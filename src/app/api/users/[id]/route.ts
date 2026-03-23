import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { userUpdateSchema } from '@/lib/validation';
import { getSessionWithRole, isAdmin } from '@/lib/auth';
import type { User } from '@/types/database';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithRole();
    if (!session) {
      return errorResponse('Authentication required', 401);
    }

    const { id } = await params;

    // Users can view their own profile; admins can view anyone
    if (session.userId !== id && !isAdmin(session)) {
      return errorResponse('Access denied', 403);
    }

    const doc = await db().collection('users').doc(id).get();
    if (!doc.exists) return errorResponse('User not found', 404);

    const data = doc.data() as User;
    const { password_hash: _, ...safe } = { ...data, id: doc.id };
    return successResponse(safe);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionWithRole();
    if (!session || !isAdmin(session)) {
      return errorResponse('Admin access required', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const docRef = db().collection('users').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return errorResponse('User not found', 404);

    // Check email uniqueness if changing email
    if (parsed.data.email) {
      const existing = await db()
        .collection('users')
        .where('email', '==', parsed.data.email)
        .limit(1)
        .get();
      const existingDoc = existing.docs[0];
      if (existingDoc && existingDoc.id !== id) {
        return errorResponse('A user with this email already exists', 409);
      }
    }

    const updates = { ...parsed.data, updated_at: new Date().toISOString() };
    await docRef.update(updates);

    const updated = await docRef.get();
    const updatedData = updated.data() as User;
    const { password_hash: _, ...safe } = { ...updatedData, id: updated.id };
    return successResponse(safe);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
