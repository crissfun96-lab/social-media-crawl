import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { userRegisterSchema } from '@/lib/validation';
import { hashPassword, getSessionWithRole, isAdmin } from '@/lib/auth';
import type { User } from '@/types/database';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const session = await getSessionWithRole();
    if (!session || !isAdmin(session)) {
      return errorResponse('Admin access required', 403);
    }

    const snapshot = await db().collection('users').orderBy('created_at', 'desc').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      // Never expose password_hash in list response
      const { password_hash: _, ...safe } = { ...data, id: doc.id } as User;
      return safe;
    });

    return successResponse(users);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = userRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.issues);
    }

    const { name, email, password } = parsed.data;

    // Check for duplicate email
    const existing = await db().collection('users').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return errorResponse('A user with this email already exists', 409);
    }

    const id = uuid();
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password);

    const user: User = {
      id,
      name,
      email,
      password_hash: passwordHash,
      role: 'staff',
      assigned_brands: [],
      assigned_creators: [],
      created_at: now,
      updated_at: now,
    };

    await db().collection('users').doc(id).set(user);

    // Return user without password_hash
    const { password_hash: _, ...safeUser } = user;
    return successResponse(safeUser, undefined, 201);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
