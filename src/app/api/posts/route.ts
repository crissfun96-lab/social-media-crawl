import { db } from '@/lib/firebase';
import { successResponse, errorResponse, parseSearchParams } from '@/lib/api-response';
import { postSchema } from '@/lib/validation';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Post, PostWithCreator, Creator } from '@/types/database';
import { v4 as uuid } from 'uuid';

export async function GET(request: Request) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    let query: FirebaseFirestore.Query = db().collection('posts');

    const platform = params.get('platform');
    if (platform) query = query.where('platform', '==', platform);

    const isAboutBw = params.get('is_about_byondwalls');
    if (isAboutBw !== null && isAboutBw !== '') {
      query = query.where('is_about_byondwalls', '==', isAboutBw === 'true');
    }

    const creatorId = params.get('creator_id');
    if (creatorId) query = query.where('creator_id', '==', creatorId);

    const snapshot = await query.get();
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Post);

    const dateFrom = params.get('date_from');
    if (dateFrom) results = results.filter(r => (r.post_date ?? '') >= dateFrom);

    const dateTo = params.get('date_to');
    if (dateTo) results = results.filter(r => (r.post_date ?? '') <= dateTo);

    const likesMin = params.get('likes_min');
    if (likesMin) results = results.filter(r => r.likes >= parseInt(likesMin, 10));

    const likesMax = params.get('likes_max');
    if (likesMax) results = results.filter(r => r.likes <= parseInt(likesMax, 10));

    const sortBy = (params.get('sort_by') ?? 'created_at') as keyof Post;
    const ascending = params.get('sort_order') === 'asc';
    results = [...results].sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return ascending ? cmp : -cmp;
    });

    const total = results.length;
    const pageResults = results.slice(offset, offset + perPage);

    // Fetch creator details for posts
    const creatorIds = [...new Set(pageResults.map(p => p.creator_id).filter(Boolean))];
    const creatorMap = new Map<string, Pick<Creator, 'name' | 'username' | 'platform'>>();

    if (creatorIds.length > 0) {
      const creatorDocs = await Promise.all(
        creatorIds.map(id => db().collection('creators').doc(id).get())
      );
      for (const doc of creatorDocs) {
        if (doc.exists) {
          const data = doc.data()!;
          creatorMap.set(doc.id, {
            name: data.name,
            username: data.username,
            platform: data.platform,
          });
        }
      }
    }

    const postsWithCreators: readonly PostWithCreator[] = pageResults.map(post => ({
      ...post,
      creators: creatorMap.get(post.creator_id) ?? null,
    }));

    return successResponse(postsWithCreators, { total, page, per_page: perPage });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const id = uuid();
    const now = new Date().toISOString();
    const post: Post = {
      id,
      ...parsed.data,
      title: parsed.data.title ?? null,
      content: parsed.data.content ?? null,
      likes: parsed.data.likes ?? 0,
      comments: parsed.data.comments ?? 0,
      saves: parsed.data.saves ?? 0,
      views: parsed.data.views ?? 0,
      is_about_byondwalls: parsed.data.is_about_byondwalls ?? false,
      post_date: parsed.data.post_date ?? null,
      hashtags: parsed.data.hashtags ?? [],
      keywords: parsed.data.keywords ?? [],
      thumbnail_url: parsed.data.thumbnail_url ?? null,
      created_at: now,
    };

    await db().collection('posts').doc(id).set(post);

    return successResponse(post, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
