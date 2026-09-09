/**
 * Build an iframe URL from the site root so deep application routes cannot
 * resolve the embedded page back into the host application.
 */
export function embeddedPageSrc(path: string, buildStamp: string): string {
  const normalizedPath = path.replace(/^\.\//, "");
  const rootPath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  return `${rootPath}?embedded=1&v=${encodeURIComponent(buildStamp)}`;
}
