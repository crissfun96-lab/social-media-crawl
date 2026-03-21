import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { bulkCreatorsSchema } from '@/lib/validation';
import { v4 as uuid } from 'uuid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bulkCreatorsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const creators = parsed.data;
    const BATCH_SIZE = 100;
    let imported = 0;
    const errors: Array<{ index: number; error: string }> = [];

    // Pre-fetch all existing creators to build a lookup map for upsert
    const existingSnap = await db().collection('creators').get();
    const existingLookup = new Map<string, string>();
    for (const doc of existingSnap.docs) {
      const data = doc.data();
      existingLookup.set(`${data.platform}_${data.platform_id}`, doc.id);
    }

    for (let i = 0; i < creators.length; i += BATCH_SIZE) {
      const chunk = creators.slice(i, i + BATCH_SIZE);

      try {
        const batch = db().batch();
        const now = new Date().toISOString();

        for (const creator of chunk) {
          const key = `${creator.platform}_${creator.platform_id}`;
          const existingId = existingLookup.get(key);

          if (existingId) {
            const docRef = db().collection('creators').doc(existingId);
            batch.update(docRef, { ...creator, updated_at: now });
          } else {
            const id = uuid();
            const docRef = db().collection('creators').doc(id);
            batch.set(docRef, {
              id,
              ...creator,
              follower_count: creator.follower_count ?? null,
              following_count: creator.following_count ?? null,
              post_count: creator.post_count ?? null,
              bio: creator.bio ?? null,
              location: creator.location ?? null,
              content_type: creator.content_type ?? null,
              has_posted_about_us: creator.has_posted_about_us ?? false,
              outreach_status: creator.outreach_status ?? 'not_contacted',
              outreach_notes: creator.outreach_notes ?? null,
              contact_info: creator.contact_info ?? null,
              tags: creator.tags ?? [],
              created_at: now,
              updated_at: now,
            });
            existingLookup.set(key, id);
          }
        }

        await batch.commit();
        imported += chunk.length;
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : 'Batch write failed' });
      }
    }

    return successResponse({
      imported,
      total: creators.length,
      errors: errors.length > 0 ? errors : undefined,
    }, undefined, errors.length > 0 ? 207 : 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
