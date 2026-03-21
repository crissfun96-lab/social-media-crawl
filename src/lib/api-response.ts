interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly per_page?: number;
  };
}

interface ErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly details?: unknown;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function successResponse<T>(
  data: T,
  meta?: SuccessResponse<T>['meta'],
  status = 200
): Response {
  const body: ApiResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return Response.json(body, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown): Response {
  const body: ErrorResponse = { success: false, error: message, ...(details ? { details } : {}) };
  return Response.json(body, { status });
}

export function parseSearchParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}
