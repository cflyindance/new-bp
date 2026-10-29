import type { ActivityDataset, ActivityStore } from './merchant-activity-domain';
export const ACTIVITY_PATH = '/m-platform/merchants/activity';
export interface ActivityContext { kind: 'brand' | 'store'; id: string }
export function activityContextPath(context: ActivityContext | null): string {
  return ACTIVITY_PATH + (context ? `/context/${context.kind}/${encodeURIComponent(context.id)}` : '');
}
/** Unknown/malformed contextual addresses never become a global query. */
export function splitActivityContext(path: string): { context: ActivityContext | null; path: string } | undefined {
  const prefix = ACTIVITY_PATH + '/context/';
  if (!path.startsWith(prefix)) return path === ACTIVITY_PATH || path.startsWith(ACTIVITY_PATH + '/') ? { context: null, path } : undefined;
  const parts = path.slice(prefix.length).split('/');
  if (!['brand', 'store'].includes(parts[0]) || !parts[1]) return undefined;
  try {
    const id = decodeURIComponent(parts[1]);
    if (!id.trim() || /[\u0000-\u001f/?#]/.test(id)) return undefined;
    return { context: { kind: parts[0] as ActivityContext['kind'], id }, path: ACTIVITY_PATH + (parts.length > 2 ? '/' + parts.slice(2).join('/') : '') };
  } catch { return undefined; }
}
export function scopedActivityStores(data: ActivityDataset, context: ActivityContext | null): ActivityStore[] {
  return data.stores.filter(store => !context || (context.kind === 'brand' ? store.merchantId === context.id : store.id === context.id));
}
