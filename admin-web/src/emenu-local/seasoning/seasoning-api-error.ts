export class SeasoningApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly payload: unknown,
  ) {
    super(code);
  }
}
