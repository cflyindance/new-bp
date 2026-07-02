/**
 * M 平台 · 品牌 BID（Business Id，B00000000）生成与校验
 */
import type { EnterpriseMerchantSnapshot } from "./enterprise-merchant-types";

export const BID_PATTERN = /^B\d{8}$/;
const LEGACY_MID_PATTERN = /^M\d{8}$/;

export function isBidFormat(id: string): boolean {
  return BID_PATTERN.test(id) || LEGACY_MID_PATTERN.test(id);
}

export function normalizeBusinessId(id: string): string {
  if (LEGACY_MID_PATTERN.test(id)) return `B${id.slice(1)}`;
  return id;
}

export function formatBid(seq: number): string {
  return `B${String(seq).padStart(8, "0")}`;
}

export function collectUsedBids(snapshot: EnterpriseMerchantSnapshot): Set<string> {
  const used = new Set<string>();
  for (const m of snapshot.merchants) {
    if (m.bid) used.add(normalizeBusinessId(m.bid));
  }
  for (const s of snapshot.stores) {
    if (isBidFormat(s.storeId)) used.add(normalizeBusinessId(s.storeId));
  }
  for (const r of snapshot.posStoreRequests ?? []) {
    if (r.createdBid) used.add(normalizeBusinessId(r.createdBid));
  }
  return used;
}

export function generateNextBid(snapshot: EnterpriseMerchantSnapshot): string {
  const used = collectUsedBids(snapshot);
  let seq = snapshot.bidSeq ?? 1;
  while (used.has(formatBid(seq))) seq += 1;
  snapshot.bidSeq = seq + 1;
  return formatBid(seq);
}

/** @deprecated 使用 isBidFormat */
export const isMidFormat = isBidFormat;

/** @deprecated 使用 generateNextBid */
export const generateNextMid = generateNextBid;

/** @deprecated 使用 formatBid */
export const formatMid = formatBid;
