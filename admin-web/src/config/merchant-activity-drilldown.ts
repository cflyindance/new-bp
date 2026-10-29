import { PRODUCT_LINES, type ActivityDataset, type ActivityScope, type ProductLine } from './merchant-activity-domain';

import { ACTIVITY_PATH, activityContextPath, splitActivityContext, scopedActivityStores, type ActivityContext } from './merchant-activity-context';
export { ACTIVITY_PATH } from './merchant-activity-context';

export function activityScopeHref(scope?: ActivityScope, context: ActivityContext | null = null): string {
  return '#' + activityContextPath(context) + (scope ? '/store/' + encodeURIComponent(scope.storeId) +
    (scope.line ? '/line/' + encodeURIComponent(scope.line) : '') +
    (scope.deviceId ? '/device/' + encodeURIComponent(scope.deviceId) : '') : '');
}

/** Old detail URLs and all-line device expansions share the same scope validation. */
export function parseActivityScope(path: string, data: ActivityDataset): ActivityScope | null | undefined {
  const route = splitActivityContext(path);
  if (!route) return undefined;
  path = route.path;
  if (path === ACTIVITY_PATH) return null;
  if (!path.startsWith(ACTIVITY_PATH + '/')) return undefined;
  try {
    const parts = path.slice(ACTIVITY_PATH.length).split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== 'store' || !parts[1] || ![2, 4, 6].includes(parts.length)) return undefined;
    const scope: ActivityScope = { storeId: parts[1] };
    if (!scopedActivityStores(data, route.context).some(store => store.id === scope.storeId)) return undefined;
    if (parts.length >= 4 && parts[2] === 'line') {
      if (!PRODUCT_LINES.includes(parts[3] as ProductLine)) return undefined;
      scope.line = parts[3] as ProductLine;
    } else if (parts.length >= 4 && !(parts.length === 4 && parts[2] === 'device')) return undefined;
    if (parts.length === 6 || parts[2] === 'device') {
      const offset = parts.length === 6 ? 4 : 2;
      if (parts[offset] !== 'device') return undefined;
      scope.deviceId = parts[offset + 1];
      if (!data.devices.some(device => device.id === scope.deviceId) || !data.bindings.some(binding =>
        binding.deviceId === scope.deviceId && binding.storeId === scope.storeId && (!scope.line || binding.line === scope.line))) return undefined;
    }
    return scope;
  } catch { return undefined; }
}
