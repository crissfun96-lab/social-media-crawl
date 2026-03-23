import { db } from '@/lib/firebase';
import { successResponse, errorResponse, parseSearchParams } from '@/lib/api-response';
import { engagementSchema } from '@/lib/validation';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { BrandEngagement } from '@/types/database';
import { v4 as uuid } from 'uuid';

export async function GET(request: Request) {
  try {
    const params = parseSearchParams(request.url);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.get('per_page') ?? String(DEFAULT_PAGE_SIZE), 10)));
    const offset = (page - 1) * perPage;

    let query: FirebaseFirestore.Query = db().collection('brand_engagements');

    const brand = params.get('brand');
    if (brand) query = query.where('brand', '==', brand);

    const status = params.get('status');
    if (status) query = query.where('status', '==', status);

    const pic = params.get('pic');
    if (pic) query = query.where('pic', '==', pic);

    const creatorId = params.get('creator_id');
    if (creatorId) query = query.where('creator_id', '==', creatorId);

    const snapshot = await query.get();
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as BrandEngagement);

    const search = params.get('search');
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(r => {
        const ext = r as BrandEngagement & { readonly creator_name?: string };
        return ext.creator_name?.toLowerCase().includes(s) ?? false;
      });
    }

    const sortBy = (params.get('sort_by') ?? 'created_at') as keyof BrandEngagement;
    const ascending = params.get('sort_order') === 'asc';
    results = [...results].sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return ascending ? cmp : -cmp;
    });

    const total = results.length;
    const pageResults = results.slice(offset, offset + perPage);

    return successResponse<readonly BrandEngagement[]>(pageResults, {
      total,
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
    const parsed = engagementSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const id = uuid();
    const now = new Date().toISOString();
    const engagement: BrandEngagement = {
      id,
      creator_id: parsed.data.creator_id,
      brand: parsed.data.brand,
      status: parsed.data.status ?? 'prospect',
      pic: parsed.data.pic ?? null,
      rate_rm: parsed.data.rate_rm ?? null,
      payout_rm: parsed.data.payout_rm ?? null,
      food_credit_rm: parsed.data.food_credit_rm ?? null,
      proceed_date: parsed.data.proceed_date ?? null,
      month: parsed.data.month ?? null,
      contact_number: parsed.data.contact_number ?? null,
      posted_link: parsed.data.posted_link ?? null,
      likes: parsed.data.likes ?? null,
      collects: parsed.data.collects ?? null,
      paid_status: parsed.data.paid_status ?? null,
      notes: parsed.data.notes ?? null,
      created_at: now,
      updated_at: now,
    };

    await db().collection('brand_engagements').doc(id).set(engagement);

    return successResponse(engagement, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
