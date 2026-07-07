/**
 * M 平台 · 品牌 BID 与门店 MID 生成与校验
 * - BID（B00000000）：入驻品牌 Business Id（merchant.bid）
 * - MID（M00000000）：门店 Store Id（store.storeId）
 */
import type { EnterpriseMerchantSnapshot } from "./enterprise-merchant-types";

export const BID_PATTERN = /^B\d{8}$/;
export const MID_PATTERN = /^M\d{8}$/;

/** 旧版门店 storeId 误用 BID 时的稳定迁移映射 */
export const LEGACY_STORE_BID_TO_MID: Record<string, string> = {
  B00000007: "M00000001",
  B00000008: "M00000002",
  B00000002: "M00000003",
  B00000009: "M00000004",
  B00000004: "M00000005",
  B00000005: "M00000006",
  B00000006: "M00000007",
};

export function isBidFormat(id: string): boolean {
  return BID_PATTERN.test(id);
}

export function isMidFormat(id: string): boolean {
  return MID_PATTERN.test(id);
}

/** 将旧版误用 M 前缀的品牌 id 规范为 BID（仅用于 merchant.bid） */
export function normalizeBid(id: string): string {
  if (/^M\d{8}$/.test(id)) return `B${id.slice(1)}`;
  return id;
}

/** @deprecated 使用 normalizeBid */
export const normalizeBusinessId = normalizeBid;

export function formatBid(seq: number): string {
  return `B${String(seq).padStart(8, "0")}`;
}

export function formatMid(seq: number): string {
  return `M${String(seq).padStart(8, "0")}`;
}

export function collectUsedBids(snapshot: EnterpriseMerchantSnapshot): Set<string> {
  const used = new Set<string>();
  for (const m of snapshot.merchants) {
    if (m.bid) used.add(normalizeBid(m.bid));
  }
  for (const r of snapshot.posStoreRequests ?? []) {
    if (r.createdBid) used.add(normalizeBid(r.createdBid));
  }
  return used;
}

export function collectUsedMids(snapshot: EnterpriseMerchantSnapshot): Set<string> {
  const used = new Set<string>();
  for (const s of snapshot.stores) {
    if (isMidFormat(s.storeId)) used.add(s.storeId);
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

export function generateNextMid(snapshot: EnterpriseMerchantSnapshot): string {
  const used = collectUsedMids(snapshot);
  let seq = snapshot.midSeq ?? 1;
  while (used.has(formatMid(seq))) seq += 1;
  snapshot.midSeq = seq + 1;
  return formatMid(seq);
}

/** 将旧版以 BID 作 storeId 的值迁移为 MID */
export function migrateLegacyStoreIdToMid(storeId: string, snapshot: EnterpriseMerchantSnapshot): string {
  if (isMidFormat(storeId)) return storeId;
  const mapped = LEGACY_STORE_BID_TO_MID[storeId];
  if (mapped) return mapped;
  if (isBidFormat(storeId)) return generateNextMid(snapshot);
  return storeId;
}
