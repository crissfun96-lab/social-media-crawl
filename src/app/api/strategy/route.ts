import { db } from '@/lib/firebase';
import { successResponse, errorResponse } from '@/lib/api-response';

const COLLECTION = 'strategy_tasks';

export async function GET() {
  try {
    const snapshot = await db().collection(COLLECTION).get();
    const tasks: Record<string, boolean> = {};
    for (const doc of snapshot.docs) {
      tasks[doc.id] = doc.data().completed === true;
    }
    return successResponse(tasks);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskId, completed } = body as { taskId: string; completed: boolean };

    if (!taskId || typeof completed !== 'boolean') {
      return errorResponse('taskId (string) and completed (boolean) required', 400);
    }

    await db().collection(COLLECTION).doc(taskId).set(
      { completed, updated_at: new Date().toISOString() },
      { merge: true }
    );

    return successResponse({ taskId, completed });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}
