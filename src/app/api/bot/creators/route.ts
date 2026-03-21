import { db } from '@/lib/firebase';
import { parseSearchParams } from '@/lib/api-response';
import { checkBotKey, extractLikes } from '@/lib/bot-auth';
import type { Creator, OutreachStatus } from '@/types/database';

const VALID_STATUSES = new Set<string>([
  'not_contacted', 'contacted', 'responded', 'agreed', 'posted', 'declined',
]);

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

interface FlatCreator {
  readonly id: string;
  readonly platform: string;
  readonly platform_id: string;
  readonly name: string;
  readonly username: string;
  readonly profile_url: string;
  readonly follower_count: number | null;
  readonly following_count: number | null;
  readonly post_count: number | null;
  readonly bio: string | null;
  readonly location: string | null;
  readonly content_type: string | null;
  readonly has_posted_about_us: boolean;
  readonly outreach_status: string;
  readonly outreach_notes: string | null;
  readonly contact_info: string | null;
  readonly tags: string[];
  readonly created_at: string;
  readonly updated_at: string;
  readonly likes: number;
}

function toFlat(creator: Creator): FlatCreator {
  return {
    id: creator.id,
    platform: creator.platform,
    platform_id: creator.platform_id,
    name: creator.name,
    username: creator.username,
    profile_url: creator.profile_url,
    follower_count: creator.follower_count,
    following_count: creator.following_count,
    post_count: creator.post_count,
    bio: creator.bio,
    location: creator.location,
    content_type: creator.content_type,
    has_posted_about_us: creator.has_posted_about_us,
    outreach_status: creator.outreach_status,
    outreach_notes: creator.outreach_notes,
    contact_info: creator.contact_info,
    tags: [...(creator.tags ?? [])],
    created_at: creator.created_at,
    updated_at: creator.updated_at,
    likes: (creator as unknown as { likes_count?: number }).likes_count
      ?? extractLikes(creator.outreach_notes),
  };
}

function buildCsv(rows: readonly FlatCreator[]): string {
  const cols: (keyof FlatCreator)[] = [
    'id', 'platform', 'name', 'username', 'profile_url',
    'outreach_status', 'has_posted_about_us', 'likes',
    'follower_count', 'following_count', 'post_count',
    'bio', 'location', 'content_type', 'tags',
    'contact_info', 'outreach_notes', 'created_at', 'updated_at',
  ];
  const escape = (v: unknown) => {
    const s = v == null ? '' : Array.isArray(v) ? v.join('|') : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

export async function GET(request: Request) {
  const authError = checkBotKey(request);
  if (authError) return authError;

  try {
    const params = parseSearchParams(request.url);

    const platform = params.get('platform') ?? 'xhs';
    const outreachStatus = params.get('outreach_status');
    const minLikes = params.get('min_likes') ? parseInt(params.get('min_likes')!, 10) : null;
    const hasPostedParam = params.get('has_posted_about_us');
    const limitParam = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get('limit') ?? String(DEFAULT_LIMIT), 10)));
    const sort = params.get('sort') ?? 'likes_desc';
    const tagsParam = params.get('tags');
    const format = params.get('format') ?? 'json';

    // Validate outreach_status
    if (outreachStatus && !VALID_STATUSES.has(outreachStatus)) {
      return Response.json(
        { success: false, error: `Invalid outreach_status. Valid values: ${[...VALID_STATUSES].join(', ')}` },
        { status: 400 }
      );
    }

    // Build Firestore query — only equality filters to avoid composite index requirements
    let query: FirebaseFirestore.Query = db().collection('creators')
      .where('platform', '==', platform);

    if (outreachStatus) {
      query = query.where('outreach_status', '==', outreachStatus as OutreachStatus);
    }

    if (hasPostedParam !== null && hasPostedParam !== '') {
      query = query.where('has_posted_about_us', '==', hasPostedParam === 'true');
    }

    const snapshot = await query.get();
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Creator);

    // In-memory filters
    const filterTags = tagsParam
      ? tagsParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : null;

    let flat = results.map(toFlat);

    if (minLikes !== null && !isNaN(minLikes)) {
      flat = flat.filter(c => c.likes >= minLikes);
    }

    if (filterTags && filterTags.length > 0) {
      flat = flat.filter(c =>
        c.tags.some(t => filterTags.includes(t.toLowerCase()))
      );
    }

    // Sort
    flat = [...flat].sort((a, b) => {
      switch (sort) {
        case 'likes_asc': return a.likes - b.likes;
        case 'likes_desc': return b.likes - a.likes;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'created_desc': return b.created_at.localeCompare(a.created_at);
        default: return b.likes - a.likes;
      }
    });

    // Limit
    const total = flat.length;
    flat = flat.slice(0, limitParam);

    if (format === 'csv') {
      return new Response(buildCsv(flat), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'X-Total-Count': String(total),
          'X-Returned-Count': String(flat.length),
        },
      });
    }

    return Response.json({
      success: true,
      total,
      returned: flat.length,
      data: flat,
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
