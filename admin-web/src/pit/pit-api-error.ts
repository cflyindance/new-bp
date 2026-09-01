import type { PitApiErrorBody } from "./pit-types";

export class PitApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: Record<string, unknown>;
  readonly requestId?: string;

  constructor(status: number, error: PitApiErrorBody) {
    super(error.message);
    this.name = "PitApiError";
    this.status = status;
    this.code = error.code;
    this.fields = error.fields;
    this.requestId = error.requestId;
  }
}

export function isPitApiError(error: unknown): error is PitApiError {
  return error instanceof PitApiError;
}
