import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const [
      creatorsResult,
      postsResult,
      postsAboutUsResult,
      recentPostsResult,
    ] = await Promise.all([
      supabase.from('creators').select('platform, outreach_status', { count: 'exact' }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('is_about_byondwalls', true),
      supabase
        .from('posts')
        .select('*, creators(name, username, platform)')
        .eq('is_about_byondwalls', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    if (creatorsResult.error) return errorResponse(creatorsResult.error.message, 500);
    if (postsResult.error) return errorResponse(postsResult.error.message, 500);
    if (postsAboutUsResult.error) return errorResponse(postsAboutUsResult.error.message, 500);
    if (recentPostsResult.error) return errorResponse(recentPostsResult.error.message, 500);

    const creators = creatorsResult.data ?? [];

    const platformCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();

    for (const c of creators) {
      platformCounts.set(c.platform, (platformCounts.get(c.platform) ?? 0) + 1);
      statusCounts.set(c.outreach_status, (statusCounts.get(c.outreach_status) ?? 0) + 1);
    }

    const byPlatform = Array.from(platformCounts.entries()).map(([platform, count]) => ({
      platform,
      count,
    }));

    const byOutreachStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return successResponse({
      totalCreators: creatorsResult.count ?? 0,
      byPlatform,
      byOutreachStatus,
      recentPosts: recentPostsResult.data ?? [],
      totalPosts: postsResult.count ?? 0,
      postsAboutUs: postsAboutUsResult.count ?? 0,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
