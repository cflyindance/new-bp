/** Publication history must survive status changes and must never be inferred from draft alone. */
export type AdRecord = Record<string, any>;
export function history(theme: AdRecord): 'never' | 'published' | 'unknown' {
  if (theme.publicationHistory === 'published' || theme.hasEverPublished === true || theme.publishStatus === 'published' || theme.lastPublishedAt || theme.firstPublishedAt || theme.publishedAt || (theme.distributeTime && theme.distributeTime !== '--')) return 'published';
  return theme.publicationHistory === 'never' && theme.publishStatus === 'draft' ? 'never' : 'unknown';
}
export function canEditTarget(theme: AdRecord): boolean { return theme.publishStatus === 'draft' && history(theme) === 'never'; }
export function sameTarget(theme: AdRecord, slot: AdRecord): boolean {
  const old = theme.adSlot;
  return !!old && ['id', 'productLine', 'code', 'version'].every(k => old[k] === slot[k]) &&
    JSON.stringify(theme.distributeChannels) === JSON.stringify([slot.productLine]) && JSON.stringify(theme.distributePositions) === JSON.stringify([slot.code]);
}
export function preserveHistory(source: AdRecord, target: AdRecord): void {
  target.publicationHistory = history(source);
  for (const k of ['hasEverPublished', 'lastPublishedAt', 'firstPublishedAt', 'publishedAt']) if (source[k] !== undefined) target[k] = source[k];
  if (target.publicationHistory === 'published') target.hasEverPublished = true;
}
export function markPublished(theme: AdRecord, now = new Date().toISOString()): void {
  theme.publicationHistory = 'published'; theme.hasEverPublished = true; theme.lastPublishedAt = now;
}
export function assertSave(current: AdRecord | undefined, opened: AdRecord, slot: AdRecord): void {
  if (!current) throw Error('广告已被删除，请返回列表刷新');
  if (canEditTarget(opened) && !canEditTarget(current)) throw Error('广告投放状态已变化，请返回列表刷新后重新编辑');
  if (!sameTarget(current, slot) && !canEditTarget(current)) throw Error('已投放或历史状态不明确的广告不能修改渠道与位置，请复制广告');
}
export function prepareSave(current: AdRecord, candidate: AdRecord): AdRecord {
  assertSave(current, current, candidate.adSlot);
  const result = JSON.parse(JSON.stringify(candidate));
  preserveHistory(current, result);
  if (!sameTarget(current, result.adSlot)) {
    result.distributedStores = [];
    result.lastDistributePrefs = { ...result.lastDistributePrefs, stores: [], channels: [result.adSlot.productLine], positions: [result.adSlot.code] };
  }
  return result;
}
