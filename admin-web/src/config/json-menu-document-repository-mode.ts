export type MenuDocumentRepositoryMode = "demo" | "http";

export function resolveMenuDocumentRepositoryMode(
  isDevelopment: boolean,
  hostname: string,
): MenuDocumentRepositoryMode {
  if (isDevelopment) return "demo";
  const host = hostname.toLowerCase();
  const isLoopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host);
  return isLoopback || host.endsWith(".github.io") ? "demo" : "http";
}
