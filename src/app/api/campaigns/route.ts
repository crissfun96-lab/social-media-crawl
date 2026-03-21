import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { campaignSchema } from '@/lib/validation';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, campaign_creators(*, creators(id, name, username, platform))')
      .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message, 500);

    return successResponse(data ?? []);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = campaignSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse(data, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
