import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { Creator, Platform, PostWithCreator } from '@/types/database';

export async function GET() {
  try {
    const [creatorsSnap, postsCountSnap, postsAboutUsCountSnap, recentCandidatesSnap] =
      await Promise.all([
        db().collection('creators').select('platform', 'outreach_status').get(),
        db().collection('posts').count().get(),
        db().collection('posts').where('is_about_byondwalls', '==', true).count().get(),
        // Fetch recent posts ordered by date, then filter in-memory to avoid a
        // composite index on (is_about_byondwalls, created_at).
        db().collection('posts').orderBy('created_at', 'desc').limit(50).get(),
      ]);

    const creators = creatorsSnap.docs.map(doc => doc.data() as Pick<Creator, 'platform' | 'outreach_status'>);

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

    return successResponse({
      totalCreators: creatorsSnap.size,
      byPlatform,
      byOutreachStatus,
      recentPosts: recentPostsWithCreators,
      totalPosts: postsCountSnap.data().count,
      postsAboutUs: postsAboutUsCountSnap.data().count,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
