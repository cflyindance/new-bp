/** Build an iframe URL relative to the application's actual deployment root. */
export function embeddedPageSrc(
  path: string,
  buildStamp: string,
  applicationBaseUrl: string,
): string {
  const normalizedPath = path.replace(/^\.?\//, "");
  const url = new URL(normalizedPath, applicationBaseUrl);
  url.searchParams.set("embedded", "1");
  url.searchParams.set("v", buildStamp);
  return url.toString();
}
