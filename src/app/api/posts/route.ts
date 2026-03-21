import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse, parseSearchParams } from '@/lib/api-response';
import { postSchema } from '@/lib/validation';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    let query = supabase
      .from('posts')
      .select('*, creators(name, username, platform)', { count: 'exact' });

    const platform = params.get('platform');
    if (platform) query = query.eq('platform', platform);

    const isAboutBw = params.get('is_about_byondwalls');
    if (isAboutBw !== null && isAboutBw !== '') query = query.eq('is_about_byondwalls', isAboutBw === 'true');

    const dateFrom = params.get('date_from');
    if (dateFrom) query = query.gte('post_date', dateFrom);

    const dateTo = params.get('date_to');
    if (dateTo) query = query.lte('post_date', dateTo);

    const likesMin = params.get('likes_min');
    if (likesMin) query = query.gte('likes', parseInt(likesMin, 10));

    const likesMax = params.get('likes_max');
    if (likesMax) query = query.lte('likes', parseInt(likesMax, 10));

    const creatorId = params.get('creator_id');
    if (creatorId) query = query.eq('creator_id', creatorId);

    const sortBy = params.get('sort_by') ?? 'created_at';
    const sortOrder = params.get('sort_order') === 'asc';
    query = query.order(sortBy, { ascending: sortOrder });

    query = query.range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) return errorResponse(error.message, 500);

    return successResponse(data ?? [], {
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
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse(data, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
