import { NextResponse } from 'next/server';
import {
  PlanLimitError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from './errors';

export type ApiResponse<T> = {
  data?: T;
  error?: string | Record<string, unknown>;
  meta?: Record<string, unknown>;
};

/** Success JSON response with envelope. */
export function success<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
  meta?: Record<string, unknown>,
) {
  const res = NextResponse.json({ data, meta } satisfies ApiResponse<T>, { status });
  if (headers) {
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  }
  return res;
}

/** Error JSON response with envelope. */
export function error(
  message: string | Record<string, unknown>,
  status = 400,
  meta?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, meta } satisfies ApiResponse<never>, { status });
}

/** Map service errors to HTTP responses. */
export function handleApiError(e: unknown) {
  if (e instanceof PlanLimitError) {
    return error(
      {
        code: 'plan_limit_exceeded',
        limit: e.limit,
        max: e.max,
        upgrade_url: '/settings/billing',
      },
      402,
    );
  }
  if (e instanceof NotFoundError) return error('not_found', 404);
  if (e instanceof ConflictError) return error({ code: 'conflict', message: e.message }, 409);
  if (e instanceof UnauthorizedError) return error('unauthorized', 401);
  if (e instanceof ValidationError) {
    return error({ code: 'validation_error', message: e.message, details: e.details }, 422);
  }
  console.error('Unexpected API error:', e);
  return error('internal_server_error', 500);
}
