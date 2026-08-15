export type MenuDocumentRepositoryMode = "demo" | "http";

export function resolveMenuDocumentRepositoryMode(
  isDevelopment: boolean,
  hostname: string,
): MenuDocumentRepositoryMode {
  if (isDevelopment) return "demo";
  return hostname.toLowerCase().endsWith(".github.io") ? "demo" : "http";
}
