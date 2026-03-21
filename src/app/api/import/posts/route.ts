import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { bulkPostsSchema } from '@/lib/validation';

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
      const batch = posts.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('posts')
        .insert(batch)
        .select();

      if (error) {
        errors.push({ index: i, error: error.message });
      } else {
        imported += data?.length ?? 0;
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
