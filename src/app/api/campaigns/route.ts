import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { campaignSchema } from '@/lib/validation';
import type { Campaign, CampaignWithCreators, CampaignCreator, Creator } from '@/types/database';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const campaignsSnap = await db().collection('campaigns')
      .orderBy('created_at', 'desc')
      .get();

    const campaigns = campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Campaign);

    // Fetch campaign_creators
    const ccSnap = await db().collection('campaign_creators').get();
    const allCampaignCreators = ccSnap.docs.map(doc => doc.data() as CampaignCreator);

    // Fetch referenced creators
    const creatorIds = [...new Set(allCampaignCreators.map(cc => cc.creator_id))];
    const creatorMap = new Map<string, Pick<Creator, 'id' | 'name' | 'username' | 'platform'>>();

    if (creatorIds.length > 0) {
      const creatorDocs = await Promise.all(
        creatorIds.map(id => db().collection('creators').doc(id).get())
      );
      for (const doc of creatorDocs) {
        if (doc.exists) {
          const data = doc.data()!;
          creatorMap.set(doc.id, {
            id: doc.id,
            name: data.name,
            username: data.username,
            platform: data.platform,
          });
        }
      }
    }

    const result: readonly CampaignWithCreators[] = campaigns.map(campaign => ({
      ...campaign,
      campaign_creators: allCampaignCreators
        .filter(cc => cc.campaign_id === campaign.id)
        .map(cc => ({
          ...cc,
          creators: creatorMap.get(cc.creator_id) ?? { id: cc.creator_id, name: 'Unknown', username: '', platform: 'xhs' as const },
        })),
    }));

    return successResponse(result);
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

    const id = uuid();
    const now = new Date().toISOString();
    const campaign: Campaign = {
      id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      target_keywords: parsed.data.target_keywords ?? [],
      target_hashtags: parsed.data.target_hashtags ?? [],
      budget: parsed.data.budget ?? null,
      status: parsed.data.status ?? 'planning',
      created_at: now,
      updated_at: now,
    };

    await db().collection('campaigns').doc(id).set(campaign);

    return successResponse(campaign, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
