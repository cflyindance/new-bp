export const LEGACY_B_DEFAULT_PATH = "/legacy-b/merchants";

export function isLegacyBContentPath(path: string): boolean {
  return path === "/legacy-b" || path.startsWith("/legacy-b/");
}

export function normalizeLegacyBPath(_path: string): string {
  return LEGACY_B_DEFAULT_PATH;
}
