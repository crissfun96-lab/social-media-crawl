import { db } from '@/lib/firebase';
import { parseSearchParams } from '@/lib/api-response';
import { checkBotKey, extractLikes } from '@/lib/bot-auth';
import type { Creator } from '@/types/database';

const MAX_RESULTS = 50;

function score(query: string, name: string, username: string): number {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  const u = username.toLowerCase();

  // Exact match wins
  if (n === q || u === q) return 100;
  // Starts-with match
  if (n.startsWith(q) || u.startsWith(q)) return 80;
  // Contains match
  if (n.includes(q) || u.includes(q)) return 60;
  // Fuzzy: all characters of query appear in order in name/username
  if (fuzzyContains(n, q) || fuzzyContains(u, q)) return 40;
  return 0;
}

function fuzzyContains(text: string, pattern: string): boolean {
  let pi = 0;
  for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
    if (text[ti] === pattern[pi]) pi++;
  }
  return pi === pattern.length;
}

export async function GET(request: Request) {
  const authError = checkBotKey(request);
  if (authError) return authError;

  try {
    const params = parseSearchParams(request.url);
    const q = (params.get('q') ?? '').trim();

    if (!q) {
      return Response.json(
        { success: false, error: 'Missing required param: q' },
        { status: 400 }
      );
    }

    if (q.length < 2) {
      return Response.json(
        { success: false, error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const limit = Math.min(MAX_RESULTS, Math.max(1, parseInt(params.get('limit') ?? '20', 10)));

    // Fetch all — Firestore has no native fuzzy/substring index
    const snapshot = await db().collection('creators').get();
    const creators = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Creator);

    const scored = creators
      .map(c => ({ ...c, _score: score(q, c.name, c.username) }))
      .filter(c => c._score > 0)
      .sort((a, b) => b._score - a._score || b.name.localeCompare(a.name))
      .slice(0, limit)
      .map(({ _score, ...c }) => ({
        id: c.id,
        platform: c.platform,
        name: c.name,
        username: c.username,
        profile_url: c.profile_url,
        outreach_status: c.outreach_status,
        has_posted_about_us: c.has_posted_about_us,
        follower_count: c.follower_count,
        tags: [...(c.tags ?? [])],
        likes: (c as unknown as { likes_count?: number }).likes_count
          ?? extractLikes(c.outreach_notes),
      }));

    return Response.json({
      success: true,
      query: q,
      returned: scored.length,
      data: scored,
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
