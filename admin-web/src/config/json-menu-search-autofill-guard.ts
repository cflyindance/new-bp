export function shouldIgnoreJsonMenuSearchInput(
  currentQuery: string,
  hasUserInputIntent: boolean,
  nextValue: string,
): boolean {
  return !currentQuery && !hasUserInputIntent && Boolean(nextValue);
}
