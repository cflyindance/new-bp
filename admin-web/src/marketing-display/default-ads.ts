/** Default delivery policy. Host storage and terminal resource readiness are adapters. */
type Ad = Record<string, any>;
export const isDefault = (ad: Ad) => ad?.adPurpose === 'default';
export function stores(ad: Ad): string[] {
  const source = Array.isArray(ad.defaultStoreIds) && isDefault(ad)
    ? ad.defaultStoreIds : (ad.distributedStores || []).map((s: Ad) => s.mid);
  return [...new Set(source.map(String))] as string[];
}
export function sameScope(a: Ad, b: Ad): boolean {
  return !!a.interactionScope && a.interactionScope === b.interactionScope &&
    !!a.adSlot?.id && a.adSlot.id === b.adSlot?.id &&
    a.adSlot.productLine === b.adSlot?.productLine && a.adSlot.code === b.adSlot?.code;
}
export function validateDefault(ad: Ad) {
  if (!isDefault(ad) || !ad.interactionScope || !ad.adSlot?.id) throw Error('默认广告缺少品牌、渠道或位置');
  const items = Object.values(ad.adSlotAssets || {}).flat() as Ad[];
  if (!items.length) throw Error('请至少配置一套规格的广告素材');
  if (items.some(item => !['image', 'video'].includes(item.type || 'image') ||
    (item.clickAction && item.clickAction.type !== 'none'))) throw Error('默认广告仅支持不跳转的图片或视频');
}
export function conflicts(list: Ad[], candidate: Ad, ids: string[]) {
  return list.filter(ad => ad.id !== candidate.id && isDefault(ad) && ad.publishStatus === 'published' && sameScope(ad, candidate))
    .map(ad => ({ad, storeIds: stores(ad).filter(id => ids.includes(id))})).filter(row => row.storeIds.length);
}
/** Pure transaction: callers must confirm conflicts and compare storage revision before committing. */
export function enable(list: Ad[], id: string, selected: Ad[], scope: string, now = new Date().toISOString()): Ad[] {
  const result: Ad[] = structuredClone(list), candidate = result.find(ad => ad.id === id);
  if (!candidate || candidate.interactionScope !== scope) throw Error('广告不存在或品牌已变化');
  validateDefault(candidate);
  const ids = [...new Set(selected.map(s => String(s.mid || '')).filter(Boolean))];
  if (!ids.length || ids.length !== selected.length) throw Error('请至少选择一家有效门店，且不能重复');
  for (const row of conflicts(result, candidate, ids)) {
    row.ad.defaultStoreIds = stores(row.ad).filter(mid => !ids.includes(mid));
    row.ad.distributedStores = (row.ad.distributedStores || []).filter((s: Ad) => row.ad.defaultStoreIds.includes(String(s.mid)));
    if (row.ad.lastDistributePrefs) row.ad.lastDistributePrefs.stores = row.ad.distributedStores.map((s: Ad) => ({name:s.name,mid:s.mid}));
    if (!row.ad.defaultStoreIds.length) row.ad.publishStatus = 'draft';
  }
  candidate.defaultStoreIds = ids;
  candidate.distributedStores = selected.map(s => ({name:s.name,mid:String(s.mid),channelStatuses:[{channel:candidate.adSlot.productLine}]}));
  candidate.distributeChannels = [candidate.adSlot.productLine];
  candidate.distributePositions = [candidate.adSlot.code];
  candidate.lastDistributePrefs = {stores:selected,channels:candidate.distributeChannels,positions:candidate.distributePositions};
  candidate.effectTime = '--';
  delete candidate.effectStartUtc;
  delete candidate.effectEndUtc;
  candidate.distributeTime = '--';
  candidate.publishStatus = 'published';
  candidate.publicationHistory = 'published';
  candidate.hasEverPublished = true;
  candidate.lastPublishedAt = now;
  return result;
}

export type PlaybackContext = {scope:string; storeId:string; slot:Ad; now:number;
  ready:(ad:Ad)=>boolean; usable:(ad:Ad)=>boolean; campaignActive:(ad:Ad,now:number)=>boolean;
  cachedDefault?:Ad; fallback:'builtin'|'hide'};
/** Input campaigns are already sorted by the channel's existing scheduling priority. */
export function selectPlayback(list: Ad[], context: PlaybackContext) {
  const target = {interactionScope:context.scope,adSlot:context.slot};
  const matches = (ad:Ad) => sameScope(ad,target) && stores(ad).includes(context.storeId);
  const playable = (ad:Ad) => context.ready(ad) && context.usable(ad);
  const campaign = list.find(ad => !isDefault(ad) && ad.publishStatus === 'published' && matches(ad) && context.campaignActive(ad,context.now) && playable(ad));
  if (campaign) return {kind:'campaign' as const,ad:campaign};
  const defaults = list.filter(ad => isDefault(ad) && ad.publishStatus === 'published' && matches(ad));
  // A complete manifest removes disabled defaults. Retain cache only while an assigned replacement is downloading.
  const fallback = defaults.find(playable);
  if (fallback) return {kind:'default' as const,ad:fallback};
  const cached = context.cachedDefault;
  if (defaults.length && cached && isDefault(cached) && matches(cached) && playable(cached)) return {kind:'default' as const,ad:cached};
  return {kind:context.fallback,ad:null};
}
