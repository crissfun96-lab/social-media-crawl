import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { bulkCreatorsSchema } from '@/lib/validation';

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

    for (let i = 0; i < creators.length; i += BATCH_SIZE) {
      const batch = creators.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('creators')
        .upsert(batch, { onConflict: 'platform,platform_id' })
        .select();

      if (error) {
        errors.push({ index: i, error: error.message });
      } else {
        imported += data?.length ?? 0;
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
