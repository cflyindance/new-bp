/** Merchant-only aliases. Do not rewrite the separate M-platform permission center. */
export function normalizePermissionCenterPath(path:string):string {
  return ['/permissions','/permissions/','/permissions/overview','/permissions/overview/'].includes(path)?'/permissions/roles':path;
}
