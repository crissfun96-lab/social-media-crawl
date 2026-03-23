import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { v4 as uuid } from 'uuid';
import type { BrandEngagement, Brand, EngagementStatus } from '@/types/database';

const VALID_BRANDS = new Set<string>(['songhwa', 'byondwalls', 'hwc_coffee', 'decore']);
const VALID_STATUSES = new Set<string>(['prospect', 'contacted', 'negotiating', 'confirmed', 'visited', 'posted', 'paid', 'skipped']);

function normalizeBrand(raw: string | null | undefined): Brand | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (VALID_BRANDS.has(lower)) return lower as Brand;
  if (lower === 'hwc' || lower === 'hwc coffee') return 'hwc_coffee';
  if (lower === 'de core' || lower === 'decore wellness') return 'decore';
  return null;
}

function normalizeStatus(raw: string | null | undefined): EngagementStatus {
  if (!raw) return 'prospect';
  const lower = raw.toLowerCase().trim();
  if (VALID_STATUSES.has(lower)) return lower as EngagementStatus;
  if (lower === 'skip') return 'skipped';
  return 'prospect';
}

function parseNumber(val: unknown): number | null {
  if (val == null || val === '' || val === '-') return null;
  const n = typeof val === 'string' ? parseFloat(val) : Number(val);
  return Number.isFinite(n) ? n : null;
}

interface RawEngagement {
  readonly id?: string;
  readonly creator_id?: string;
  readonly creator_name?: string;
  readonly brand?: string;
  readonly status?: string;
  readonly pic?: string | null;
  readonly rate_card?: string;
  readonly rate_rm?: number | string | null;
  readonly payout_rm?: number | string | null;
  readonly food_credit_rm?: number | string | null;
  readonly proceed_date?: string | null;
  readonly month?: string | null;
  readonly contact_number?: string | null;
  readonly posted_link?: string | null;
  readonly likes?: number | string | null;
  readonly collects?: number | string | null;
  readonly paid_status?: string | null;
  readonly ig_url?: string | null;
  readonly xhs_url?: string | null;
  readonly notes?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records: readonly RawEngagement[] = Array.isArray(body) ? body : [];

    if (records.length === 0) {
      return errorResponse('No records provided', 400);
    }

    const BATCH_SIZE = 100;
    let imported = 0;
    const errors: Array<{ readonly index: number; readonly error: string }> = [];

    // Build lookup of existing engagements to upsert
    const existingSnap = await db().collection('brand_engagements').get();
    const existingLookup = new Map<string, string>();
    for (const doc of existingSnap.docs) {
      const data = doc.data();
      existingLookup.set(`${data.creator_id}_${data.brand}`, doc.id);
    }

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);

      try {
        const batch = db().batch();
        const now = new Date().toISOString();

        for (let j = 0; j < chunk.length; j++) {
          const raw = chunk[j];
          const brand = normalizeBrand(raw.brand);
          if (!brand) {
            errors.push({ index: i + j, error: `Invalid brand: ${raw.brand}` });
            continue;
          }

          const creatorId = raw.creator_id ?? '';
          if (!creatorId) {
            errors.push({ index: i + j, error: 'Missing creator_id' });
            continue;
          }

          const rateRm = parseNumber(raw.rate_rm) ?? parseNumber(raw.rate_card);

          const engagement: BrandEngagement = {
            id: raw.id ?? uuid(),
            creator_id: creatorId,
            brand,
            status: normalizeStatus(raw.status),
            pic: raw.pic?.toLowerCase().trim() ?? null,
            rate_rm: rateRm,
            payout_rm: parseNumber(raw.payout_rm),
            food_credit_rm: parseNumber(raw.food_credit_rm),
            proceed_date: raw.proceed_date || null,
            month: raw.month || null,
            contact_number: raw.contact_number || null,
            posted_link: raw.posted_link || null,
            likes: parseNumber(raw.likes),
            collects: parseNumber(raw.collects),
            paid_status: raw.paid_status || null,
            notes: raw.notes || null,
            created_at: now,
            updated_at: now,
          };

          const key = `${engagement.creator_id}_${engagement.brand}`;
          const existingId = existingLookup.get(key);

          if (existingId) {
            const docRef = db().collection('brand_engagements').doc(existingId);
            const { id: _id, created_at: _ca, ...updateFields } = engagement;
            batch.update(docRef, { ...updateFields, updated_at: now });
          } else {
            const docRef = db().collection('brand_engagements').doc(engagement.id);
            batch.set(docRef, engagement);
            existingLookup.set(key, engagement.id);
          }
        }

        await batch.commit();
        imported += chunk.length - errors.filter(e => e.index >= i && e.index < i + BATCH_SIZE).length;
      } catch (err) {
        errors.push({ index: i, error: err instanceof Error ? err.message : 'Batch write failed' });
      }
    }

    return successResponse({
      imported,
      total: records.length,
      errors: errors.length > 0 ? errors : undefined,
    }, undefined, errors.length > 0 ? 207 : 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
