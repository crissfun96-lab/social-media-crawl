import { db } from '@/lib/firebase';
import { successResponse, errorResponse, parseSearchParams } from '@/lib/api-response';
import { creatorSchema } from '@/lib/validation';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Creator } from '@/types/database';
import { v4 as uuid } from 'uuid';

export async function GET(request: Request) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const perPage = Math.min(2000, Math.max(1, parseInt(params.get('per_page') ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    let query: FirebaseFirestore.Query = db().collection('creators');

    const platform = params.get('platform');
    if (platform) query = query.where('platform', '==', platform);

    const outreachStatus = params.get('outreach_status');
    if (outreachStatus) query = query.where('outreach_status', '==', outreachStatus);

    const hasPosted = params.get('has_posted_about_us');
    if (hasPosted !== null && hasPosted !== '') {
      query = query.where('has_posted_about_us', '==', hasPosted === 'true');
    }

    const snapshot = await query.get();
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Creator);

    const location = params.get('location');
    if (location) {
      const loc = location.toLowerCase();
      results = results.filter(r => r.location?.toLowerCase().includes(loc));
    }

    // Source filter: scraper (opencli tag), google-sheet, manual
    const source = params.get('source');
    if (source === 'scraper') {
      results = results.filter(r => (r.tags ?? []).includes('opencli'));
    } else if (source === 'google-sheet' || source === 'liz' || source === 'amber') {
      results = results.filter(r => (r.tags ?? []).includes('google-sheet'));
    } else if (source === 'manual') {
      results = results.filter(r => !(r.tags ?? []).includes('opencli') && !(r.tags ?? []).includes('google-sheet'));
    }

    const search = params.get('search');
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(r =>
        r.name.toLowerCase().includes(s) || r.username.toLowerCase().includes(s)
      );
    }

    const followerMin = params.get('follower_min');
    if (followerMin) {
      const min = parseInt(followerMin, 10);
      results = results.filter(r => (r.follower_count ?? 0) >= min);
    }

    const followerMax = params.get('follower_max');
    if (followerMax) {
      const max = parseInt(followerMax, 10);
      results = results.filter(r => (r.follower_count ?? 0) <= max);
    }

    const sortBy = (params.get('sort_by') ?? 'created_at') as keyof Creator;
    const ascending = params.get('sort_order') === 'asc';
    results = [...results].sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return ascending ? cmp : -cmp;
    });

    const total = results.length;
    const pageResults = results.slice(offset, offset + perPage);

    return successResponse<readonly Creator[]>(pageResults, {
      total,
      page,
      per_page: perPage,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = creatorSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const id = uuid();
    const now = new Date().toISOString();
    const creator: Creator = {
      id,
      ...parsed.data,
      follower_count: parsed.data.follower_count ?? null,
      following_count: parsed.data.following_count ?? null,
      post_count: parsed.data.post_count ?? null,
      bio: parsed.data.bio ?? null,
      location: parsed.data.location ?? null,
      content_type: parsed.data.content_type ?? null,
      has_posted_about_us: parsed.data.has_posted_about_us ?? false,
      outreach_status: parsed.data.outreach_status ?? 'not_contacted',
      outreach_notes: parsed.data.outreach_notes ?? null,
      contact_info: parsed.data.contact_info ?? null,
      tags: parsed.data.tags ?? [],
      created_at: now,
      updated_at: now,
    };

    await db().collection('creators').doc(id).set(creator);

    return successResponse(creator, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
