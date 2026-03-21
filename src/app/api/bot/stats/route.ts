import { db } from '@/lib/firebase';
import { checkBotKey, extractLikes, likesToTier, type LikesTier } from '@/lib/bot-auth';
import type { Creator } from '@/types/database';

interface LikesTierCount {
  readonly tier: LikesTier;
  readonly count: number;
}

interface TopCreator {
  readonly id: string;
  readonly name: string;
  readonly username: string;
  readonly platform: string;
  readonly outreach_status: string;
  readonly likes: number;
  readonly profile_url: string;
}

export async function GET(request: Request) {
  const authError = checkBotKey(request);
  if (authError) return authError;

  try {
    const snapshot = await db().collection('creators').get();
    const creators = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Creator);

    const statusCounts = new Map<string, number>();
    const tierCounts = new Map<LikesTier, number>();
    const withLikes: Array<{ id: string; name: string; username: string; platform: string; outreach_status: string; likes: number; profile_url: string }> = [];

    for (const c of creators) {
      // Status breakdown
      statusCounts.set(c.outreach_status, (statusCounts.get(c.outreach_status) ?? 0) + 1);

      // Likes
      const likes = (c as unknown as { likes_count?: number }).likes_count ?? extractLikes(c.outreach_notes);
      const tier = likesToTier(likes);
      tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);

      withLikes.push({
        id: c.id,
        name: c.name,
        username: c.username,
        platform: c.platform,
        outreach_status: c.outreach_status,
        likes,
        profile_url: c.profile_url,
      });
    }

    const byStatus = Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const tierOrder: LikesTier[] = ['100k+', '20k-100k', '5k-20k', '1k-5k', '<1k'];
    const byLikesTier: LikesTierCount[] = tierOrder.map(tier => ({
      tier,
      count: tierCounts.get(tier) ?? 0,
    }));

    const top10: TopCreator[] = [...withLikes]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    return Response.json({
      success: true,
      data: {
        total_creators: creators.length,
        by_status: byStatus,
        by_likes_tier: byLikesTier,
        top10_by_likes: top10,
      },
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
