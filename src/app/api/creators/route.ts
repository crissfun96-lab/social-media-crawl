import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse, parseSearchParams } from '@/lib/api-response';
import { creatorSchema } from '@/lib/validation';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Creator } from '@/types/database';

export async function GET(request: Request) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    let query = supabase.from('creators').select('*', { count: 'exact' });

    const platform = params.get('platform');
    if (platform) query = query.eq('platform', platform);

    const location = params.get('location');
    if (location) query = query.ilike('location', `%${location}%`);

    const outreachStatus = params.get('outreach_status');
    if (outreachStatus) query = query.eq('outreach_status', outreachStatus);

    const hasPosted = params.get('has_posted_about_us');
    if (hasPosted !== null && hasPosted !== '') query = query.eq('has_posted_about_us', hasPosted === 'true');

    const followerMin = params.get('follower_min');
    if (followerMin) query = query.gte('follower_count', parseInt(followerMin, 10));

    const followerMax = params.get('follower_max');
    if (followerMax) query = query.lte('follower_count', parseInt(followerMax, 10));

    const search = params.get('search');
    if (search) query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);

    const sortBy = params.get('sort_by') ?? 'created_at';
    const sortOrder = params.get('sort_order') === 'asc';
    query = query.order(sortBy, { ascending: sortOrder });

    query = query.range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) return errorResponse(error.message, 500);

    return successResponse<readonly Creator[]>(data ?? [], {
      total: count ?? 0,
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

    const { data, error } = await supabase
      .from('creators')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse(data, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
