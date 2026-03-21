import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { creatorUpdateSchema } from '@/lib/validation';
import type { Creator } from '@/types/database';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await db().collection('creators').doc(id).get();

    if (!doc.exists) return errorResponse('Creator not found', 404);

    return successResponse({ id: doc.id, ...doc.data() } as Creator);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = creatorUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const docRef = db().collection('creators').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return errorResponse('Creator not found', 404);

    const updates = { ...parsed.data, updated_at: new Date().toISOString() };
    await docRef.update(updates);

    const updated = await docRef.get();
    return successResponse({ id: updated.id, ...updated.data() } as Creator);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = db().collection('creators').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return errorResponse('Creator not found', 404);

    await docRef.delete();

    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
