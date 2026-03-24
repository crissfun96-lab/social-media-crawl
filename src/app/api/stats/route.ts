import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { Creator, Platform, PostWithCreator, BrandEngagement } from '@/types/database';
import { CREATOR_TIERS, OUTREACH_STATUS_OPTIONS, getCreatorTier } from '@/lib/constants';

const STATS_CACHE_TTL_MS = 60_000; // 1 minute
let statsCache: { readonly data: unknown; readonly timestamp: number } | null = null;

export async function GET() {
  try {
    // Return cached response if fresh
    if (statsCache && Date.now() - statsCache.timestamp < STATS_CACHE_TTL_MS) {
      return successResponse(statsCache.data);
    }

    const [creatorsSnap, postsCountSnap, postsAboutUsCountSnap, recentCandidatesSnap, engagementsSnap] =
      await Promise.all([
        db().collection('creators').select('platform', 'outreach_status', 'follower_count', 'likes_count', 'name', 'profile_url', 'tags').get(),
        db().collection('posts').count().get(),
        db().collection('posts').where('is_about_byondwalls', '==', true).count().get(),
        db().collection('posts').orderBy('created_at', 'desc').limit(50).get(),
        db().collection('brand_engagements').get(),
      ]);

    const creators = creatorsSnap.docs.map(doc => doc.data() as Pick<Creator, 'platform' | 'outreach_status' | 'follower_count' | 'name' | 'profile_url' | 'tags'> & { readonly likes_count?: number | null });

    const engagements = engagementsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as BrandEngagement);

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

    // Brand breakdown: count unique creators per brand from engagements
    const brandCreatorSets = new Map<string, Set<string>>();
    const picCounts = new Map<string, number>();
    let totalSpent = 0;

    for (const eng of engagements) {
      // Brand creator counts
      const existing = brandCreatorSets.get(eng.brand) ?? new Set<string>();
      brandCreatorSets.set(eng.brand, new Set([...existing, eng.creator_id]));

      // PIC counts
      if (eng.pic) {
        picCounts.set(eng.pic, (picCounts.get(eng.pic) ?? 0) + 1);
      }

      // Total spent
      totalSpent += eng.payout_rm ?? 0;
    }

    const byBrand = Array.from(brandCreatorSets.entries()).map(([brand, creatorSet]) => ({
      brand,
      creatorCount: creatorSet.size,
    }));

    const picBreakdown = Array.from(picCounts.entries()).map(([pic, count]) => ({
      pic,
      count,
    }));

    // Engagement pipeline: count engagements at each status
    const engagementStatusCounts = new Map<string, number>();
    for (const eng of engagements) {
      engagementStatusCounts.set(eng.status, (engagementStatusCounts.get(eng.status) ?? 0) + 1);
    }
    const engagementPipeline = Array.from(engagementStatusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Filter in-memory for posts about Byond Walls and take the 5 most recent.
    interface PostDoc { readonly id: string; readonly creator_id: string; readonly is_about_byondwalls: unknown; readonly [key: string]: unknown }
    const recentPosts: readonly PostDoc[] = recentCandidatesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }) as PostDoc)
      .filter(p => p.is_about_byondwalls === true)
      .slice(0, 5);

    const creatorIds = [...new Set(recentPosts.map(p => p.creator_id).filter(Boolean))];
    const creatorMap = new Map<string, Pick<Creator, 'name' | 'username' | 'platform'>>();

    if (creatorIds.length > 0) {
      const creatorDocs = await Promise.all(
        creatorIds.map(id => db().collection('creators').doc(id).get())
      );
      for (const doc of creatorDocs) {
        if (doc.exists) {
          const data = doc.data()!;
          creatorMap.set(doc.id, {
            name: data.name as string,
            username: data.username as string,
            platform: data.platform as Platform,
          });
        }
      }
    }

    const recentPostsWithCreators: readonly PostWithCreator[] = recentPosts.map(post => ({
      ...(post as unknown as PostWithCreator),
      creators: creatorMap.get(post.creator_id) ?? null,
    }));

    // Tier breakdown
    const tierCounts = new Map<string, number>();
    for (const tier of CREATOR_TIERS) {
      tierCounts.set(tier.tier, 0);
    }
    for (const c of creators) {
      const tier = getCreatorTier(c.follower_count);
      tierCounts.set(tier.tier, (tierCounts.get(tier.tier) ?? 0) + 1);
    }
    const tierBreakdown = CREATOR_TIERS.map(t => ({
      tier: t.tier,
      label: t.label,
      emoji: t.emoji,
      color: t.color,
      count: tierCounts.get(t.tier) ?? 0,
    }));

    // Top 5 creators by likes_count (engagement likes), fallback to follower_count
    const topCreators = [...creators]
      .sort((a, b) => (b.likes_count ?? b.follower_count ?? 0) - (a.likes_count ?? a.follower_count ?? 0))
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        follower_count: c.follower_count,
        likes_count: c.likes_count,
        outreach_status: c.outreach_status,
        profile_url: c.profile_url,
      }));

    // Outreach funnel
    const totalCreatorsCount = creators.length || 1;
    const outreachFunnel = OUTREACH_STATUS_OPTIONS.map(opt => {
      const count = statusCounts.get(opt.value) ?? 0;
      return {
        status: opt.value,
        label: opt.label,
        color: opt.color,
        count,
        percentage: Math.round((count / totalCreatorsCount) * 100),
      };
    });

    const responseData = {
      totalCreators: creatorsSnap.size,
      byPlatform,
      byOutreachStatus,
      byBrand,
      picBreakdown,
      totalSpent,
      engagementPipeline,
      recentPosts: recentPostsWithCreators,
      totalPosts: postsCountSnap.data().count,
      postsAboutUs: postsAboutUsCountSnap.data().count,
      tierBreakdown,
      topCreators,
      outreachFunnel,
    };

    // Cache the response
    statsCache = { data: responseData, timestamp: Date.now() };

    return successResponse(responseData);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
