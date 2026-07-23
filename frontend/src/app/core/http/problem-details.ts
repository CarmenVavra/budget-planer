import { HttpErrorResponse } from '@angular/common/http';

export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/** Extracts a user-facing message from an ASP.NET Core ProblemDetails error response. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const problem = error.error as ProblemDetails | undefined;
  const firstFieldError = problem?.errors && Object.values(problem.errors)[0]?.[0];

  return firstFieldError ?? problem?.detail ?? problem?.title ?? fallback;
}
