import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { bulkPostsSchema } from '@/lib/validation';
import { v4 as uuid } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bulkPostsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const posts = parsed.data;
    const BATCH_SIZE = 100;
    let imported = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const chunk = posts.slice(i, i + BATCH_SIZE);

      try {
        const batch = db().batch();
        const now = new Date().toISOString();

        for (const post of chunk) {
          const id = uuid();
          const docRef = db().collection('posts').doc(id);
          batch.set(docRef, {
            id,
            ...post,
            title: post.title ?? null,
            content: post.content ?? null,
            likes: post.likes ?? 0,
            comments: post.comments ?? 0,
            saves: post.saves ?? 0,
            views: post.views ?? 0,
            is_about_byondwalls: post.is_about_byondwalls ?? false,
            post_date: post.post_date ?? null,
            hashtags: post.hashtags ?? [],
            keywords: post.keywords ?? [],
            thumbnail_url: post.thumbnail_url ?? null,
            created_at: now,
          });
        }

        await batch.commit();
        imported += chunk.length;
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : 'Batch write failed' });
      }
    }

    return successResponse({
      imported,
      total: posts.length,
      errors: errors.length > 0 ? errors : undefined,
    }, undefined, errors.length > 0 ? 207 : 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
