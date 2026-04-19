import { NextResponse } from 'next/server';

export const ErrorCodes = {
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_TIMEOUT: 'AI_TIMEOUT',
  PAYMENT_SERVICE_ERROR: 'PAYMENT_SERVICE_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CACHE_SERVICE_ERROR: 'CACHE_SERVICE_ERROR',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const HTTP_STATUS: Record<ErrorCode, number> = {
  AI_SERVICE_UNAVAILABLE: 503,
  AI_RATE_LIMITED: 429,
  AI_TIMEOUT: 504,
  PAYMENT_SERVICE_ERROR: 502,
  QUOTA_EXCEEDED: 429,
  CACHE_SERVICE_ERROR: 503,
  CIRCUIT_OPEN: 503,
  INVALID_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.status = HTTP_STATUS[code];
  }
}

export function apiErrorResponse(
  codeOrError: ErrorCode | ApiError | unknown,
  message?: string,
): NextResponse {
  if (codeOrError instanceof ApiError) {
    return NextResponse.json(
      { error: codeOrError.code, message: codeOrError.message },
      { status: codeOrError.status },
    );
  }

  if (typeof codeOrError === 'string' && codeOrError in ErrorCodes) {
    const code = codeOrError as ErrorCode;
    return NextResponse.json(
      { error: code, message: message ?? code },
      { status: HTTP_STATUS[code] },
    );
  }

  return NextResponse.json(
    { error: ErrorCodes.INTERNAL_ERROR, message: 'An unexpected error occurred' },
    { status: 500 },
  );
}
