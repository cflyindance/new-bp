/**
 * 定制化功能 · MID 白名单存储（M 平台管理）
 * P2：按 MID 到期回收、跨商户检索、能力快照同步钩子
 */
import { readActiveEnterpriseId } from "./enterprise-merchant-enterprise-context";
import { getMerchantStores, getEnterpriseMerchantSnapshot } from "./enterprise-merchant-store";
import { isMidFormat } from "./enterprise-merchant-bid";
import { listCustomFeatureRegistryEntries } from "./feature-registry";

export const CUSTOM_FEATURE_WHITELIST_STORAGE_KEY = "menusifu:custom-feature-whitelist-v1";

/** 单门店开通元数据（支持到期自动回收） */
export interface MidGrantMeta {
  mid: string;
  grantedBy: string;
  grantedAt: string;
  /** ISO；到期后自动从白名单移除 */
  expiresAt?: string;
  note?: string;
}

export interface CustomFeatureWhitelistEntry {
  featureKey: string;
  allowedMids: string[];
  /** 按 MID 的开通元数据（与 allowedMids 同步） */
  midGrants?: MidGrantMeta[];
  enabled: boolean;
  grantedBy: string;
  grantedAt: string;
  note?: string;
  /** 功能级统一到期（可选；优先使用 midGrants[].expiresAt） */
  expiresAt?: string;
}

export interface WhitelistChangeLogEntry {
  id: string;
  enterpriseId: string;
  featureKey: string;
  action:
    | "grant"
    | "revoke"
    | "batch_grant"
    | "batch_revoke"
    | "toggle"
    | "note"
    | "expire"
    | "set_expiry"
    | "manual_ready";
  mids: string[];
  operatorEmail: string;
  detail: string;
  at: string;
}

interface CustomFeatureWhitelistStore {
  enterpriseId: string;
  entries: CustomFeatureWhitelistEntry[];
  changelog: WhitelistChangeLogEntry[];
}

function genLogId(): string {
  return `cwl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function readAllStores(): Record<string, CustomFeatureWhitelistStore> {
  try {
    const raw = localStorage.getItem(CUSTOM_FEATURE_WHITELIST_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CustomFeatureWhitelistStore>;
  } catch {
    return {};
  }
}

function writeAllStores(all: Record<string, CustomFeatureWhitelistStore>): void {
  try {
    localStorage.setItem(CUSTOM_FEATURE_WHITELIST_STORAGE_KEY, JSON.stringify(all));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("menusifu:custom-feature-whitelist-changed"));
    }
  } catch {
    /* ignore */
  }
}

function seedStore(enterpriseId: string): CustomFeatureWhitelistStore {
  const now = new Date().toISOString();
  return {
    enterpriseId,
    entries: listCustomFeatureRegistryEntries().map((f) => ({
      featureKey: f.featureKey,
      allowedMids: [],
      midGrants: [],
      enabled: true,
      grantedBy: "system",
      grantedAt: now,
      note: "",
    })),
    changelog: [],
  };
}

function ensureMidGrants(entry: CustomFeatureWhitelistEntry): MidGrantMeta[] {
  if (Array.isArray(entry.midGrants) && entry.midGrants.length > 0) return entry.midGrants;
  if (Array.isArray(entry.midGrants) && (entry.allowedMids?.length ?? 0) === 0) return entry.midGrants;
  return (entry.allowedMids ?? []).map((mid) => ({
    mid,
    grantedBy: entry.grantedBy,
    grantedAt: entry.grantedAt,
    expiresAt: entry.expiresAt,
  }));
}

function syncAllowedMidsFromGrants(entry: CustomFeatureWhitelistEntry): void {
  entry.midGrants = ensureMidGrants(entry);
  entry.allowedMids = entry.midGrants.map((g) => g.mid);
}

function readStore(enterpriseId = readActiveEnterpriseId()): CustomFeatureWhitelistStore {
  const all = readAllStores();
  let store = all[enterpriseId];
  if (!store) {
    store = seedStore(enterpriseId);
    all[enterpriseId] = store;
    writeAllStores(all);
  }
  const knownKeys = new Set(store.entries.map((e) => e.featureKey));
  let changed = false;
  for (const f of listCustomFeatureRegistryEntries()) {
    if (!knownKeys.has(f.featureKey)) {
      store.entries.push({
        featureKey: f.featureKey,
        allowedMids: [],
        midGrants: [],
        enabled: true,
        grantedBy: "system",
        grantedAt: new Date().toISOString(),
      });
      changed = true;
    }
  }
  for (const e of store.entries) {
    if (!e.midGrants) {
      e.midGrants = ensureMidGrants(e);
      changed = true;
    }
  }
  if (changed) {
    all[enterpriseId] = store;
    writeAllStores(all);
  }
  return store;
}

function writeStore(store: CustomFeatureWhitelistStore): void {
  const all = readAllStores();
  all[store.enterpriseId] = store;
  writeAllStores(all);
}

function appendChangelog(
  store: CustomFeatureWhitelistStore,
  entry: Omit<WhitelistChangeLogEntry, "id" | "enterpriseId" | "at">,
): void {
  store.changelog.unshift({
    ...entry,
    id: genLogId(),
    enterpriseId: store.enterpriseId,
    at: new Date().toISOString(),
  });
  store.changelog = store.changelog.slice(0, 200);
}

function validateMidsForMerchant(merchantId: string, mids: string[]): { ok: true; mids: string[] } | { ok: false; error: string } {
  const normalized = [...new Set(mids.map((m) => m.trim()).filter(Boolean))];
  if (normalized.length === 0) return { ok: false, error: "请至少选择一个 MID" };
  for (const mid of normalized) {
    if (!isMidFormat(mid)) return { ok: false, error: `MID 格式无效：${mid}` };
  }
  const allowed = new Set(getMerchantStores(merchantId).map((s) => s.storeId));
  const invalid = normalized.filter((m) => !allowed.has(m));
  if (invalid.length > 0) {
    return { ok: false, error: `以下 MID 不属于该品牌：${invalid.join(", ")}` };
  }
  return { ok: true, mids: normalized };
}

export function getWhitelistEntry(featureKey: string, enterpriseId = readActiveEnterpriseId()): CustomFeatureWhitelistEntry | undefined {
  purgeExpiredWhitelistGrants(enterpriseId);
  const entry = readStore(enterpriseId).entries.find((e) => e.featureKey === featureKey);
  if (!entry) return undefined;
  return {
    ...entry,
    allowedMids: [...entry.allowedMids],
    midGrants: ensureMidGrants(entry).map((g) => ({ ...g })),
  };
}

export function listWhitelistEntries(enterpriseId = readActiveEnterpriseId()): CustomFeatureWhitelistEntry[] {
  purgeExpiredWhitelistGrants(enterpriseId);
  return readStore(enterpriseId).entries.map((e) => ({
    ...e,
    allowedMids: [...e.allowedMids],
    midGrants: ensureMidGrants(e).map((g) => ({ ...g })),
  }));
}

export function listWhitelistChangelog(enterpriseId = readActiveEnterpriseId(), featureKey?: string): WhitelistChangeLogEntry[] {
  const logs = readStore(enterpriseId).changelog;
  if (!featureKey) return [...logs];
  return logs.filter((l) => l.featureKey === featureKey);
}

function isMidGrantActive(grant: MidGrantMeta, entryExpiresAt: string | undefined, now = Date.now()): boolean {
  const exp = grant.expiresAt ?? entryExpiresAt;
  if (!exp) return true;
  return new Date(exp).getTime() > now;
}

export function isMidInWhitelist(featureKey: string, mid: string, enterpriseId = readActiveEnterpriseId()): boolean {
  purgeExpiredWhitelistGrants(enterpriseId);
  const entry = readStore(enterpriseId).entries.find((e) => e.featureKey === featureKey);
  if (!entry || !entry.enabled) return false;
  if (entry.expiresAt && new Date(entry.expiresAt).getTime() < Date.now()) return false;
  const grants = ensureMidGrants(entry);
  const grant = grants.find((g) => g.mid === mid);
  if (!grant) return false;
  return isMidGrantActive(grant, entry.expiresAt);
}

export function getMidGrantMeta(
  featureKey: string,
  mid: string,
  enterpriseId = readActiveEnterpriseId(),
): MidGrantMeta | undefined {
  const entry = getWhitelistEntry(featureKey, enterpriseId);
  return entry?.midGrants?.find((g) => g.mid === mid);
}

/**
 * 扫描并移除已到期的 MID 开通（自动回收）
 */
export function purgeExpiredWhitelistGrants(enterpriseId = readActiveEnterpriseId()): {
  revoked: Array<{ featureKey: string; mids: string[] }>;
} {
  const store = readStore(enterpriseId);
  const now = Date.now();
  const revoked: Array<{ featureKey: string; mids: string[] }> = [];
  let changed = false;

  for (const entry of store.entries) {
    syncAllowedMidsFromGrants(entry);
    const before = entry.midGrants ?? [];
    const keep = before.filter((g) => isMidGrantActive(g, entry.expiresAt, now));
    const removed = before.filter((g) => !isMidGrantActive(g, entry.expiresAt, now));
    if (removed.length === 0) continue;
    entry.midGrants = keep;
    syncAllowedMidsFromGrants(entry);
    changed = true;
    revoked.push({ featureKey: entry.featureKey, mids: removed.map((r) => r.mid) });
    appendChangelog(store, {
      featureKey: entry.featureKey,
      action: "expire",
      mids: removed.map((r) => r.mid),
      operatorEmail: "system",
      detail: `到期自动回收 MID：${removed.map((r) => r.mid).join(", ")}`,
    });
  }

  if (changed) writeStore(store);
  return { revoked };
}

export function grantMidsToWhitelist(input: {
  featureKey: string;
  merchantId: string;
  mids: string[];
  operatorEmail: string;
  note?: string;
  /** ISO 或相对天数；写入 midGrants.expiresAt */
  expiresAt?: string;
  expiresInDays?: number;
  enterpriseId?: string;
  skipCapabilitySync?: boolean;
}): { ok: true } | { ok: false; error: string } {
  const enterpriseId = input.enterpriseId ?? readActiveEnterpriseId();
  const validated = validateMidsForMerchant(input.merchantId, input.mids);
  if (!validated.ok) return validated;

  let expiresAt = input.expiresAt?.trim() || undefined;
  if (!expiresAt && input.expiresInDays != null && input.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + input.expiresInDays * 86400000).toISOString();
  }

  const store = readStore(enterpriseId);
  let entry = store.entries.find((e) => e.featureKey === input.featureKey);
  if (!entry) {
    entry = {
      featureKey: input.featureKey,
      allowedMids: [],
      midGrants: [],
      enabled: true,
      grantedBy: input.operatorEmail,
      grantedAt: new Date().toISOString(),
    };
    store.entries.push(entry);
  }

  syncAllowedMidsFromGrants(entry);
  const before = new Set(entry.allowedMids);
  const added = validated.mids.filter((m) => !before.has(m));
  const now = new Date().toISOString();

  for (const mid of validated.mids) {
    const existing = entry.midGrants!.find((g) => g.mid === mid);
    if (existing) {
      if (expiresAt) existing.expiresAt = expiresAt;
      if (input.note?.trim()) existing.note = input.note.trim();
    } else {
      entry.midGrants!.push({
        mid,
        grantedBy: input.operatorEmail,
        grantedAt: now,
        expiresAt,
        note: input.note?.trim(),
      });
    }
  }
  syncAllowedMidsFromGrants(entry);
  if (input.note?.trim()) entry.note = input.note.trim();
  entry.grantedBy = input.operatorEmail;
  entry.grantedAt = now;

  if (added.length > 0) {
    appendChangelog(store, {
      featureKey: input.featureKey,
      action: added.length > 1 ? "batch_grant" : "grant",
      mids: added,
      operatorEmail: input.operatorEmail,
      detail: `为品牌 ${input.merchantId} 开通 MID：${added.join(", ")}${expiresAt ? `（到期 ${expiresAt}）` : ""}`,
    });
  } else if (expiresAt) {
    appendChangelog(store, {
      featureKey: input.featureKey,
      action: "set_expiry",
      mids: validated.mids,
      operatorEmail: input.operatorEmail,
      detail: `更新到期时间：${expiresAt}`,
    });
  }
  writeStore(store);
  return { ok: true };
}

export function revokeMidsFromWhitelist(input: {
  featureKey: string;
  merchantId: string;
  mids: string[];
  operatorEmail: string;
  enterpriseId?: string;
  skipCapabilitySync?: boolean;
}): { ok: true } | { ok: false; error: string } {
  const enterpriseId = input.enterpriseId ?? readActiveEnterpriseId();
  const validated = validateMidsForMerchant(input.merchantId, input.mids);
  if (!validated.ok) return validated;

  const store = readStore(enterpriseId);
  const entry = store.entries.find((e) => e.featureKey === input.featureKey);
  if (!entry) return { ok: false, error: "未找到白名单条目" };

  syncAllowedMidsFromGrants(entry);
  const removeSet = new Set(validated.mids);
  const removed = entry.allowedMids.filter((m) => removeSet.has(m));
  if (removed.length === 0) return { ok: true };

  entry.midGrants = (entry.midGrants ?? []).filter((g) => !removeSet.has(g.mid));
  syncAllowedMidsFromGrants(entry);
  appendChangelog(store, {
    featureKey: input.featureKey,
    action: removed.length > 1 ? "batch_revoke" : "revoke",
    mids: removed,
    operatorEmail: input.operatorEmail,
    detail: `从品牌 ${input.merchantId} 移除 MID：${removed.join(", ")}`,
  });
  writeStore(store);
  return { ok: true };
}

export function setMidGrantExpiry(input: {
  featureKey: string;
  merchantId: string;
  mid: string;
  expiresAt: string | null;
  operatorEmail: string;
  enterpriseId?: string;
}): { ok: true } | { ok: false; error: string } {
  const enterpriseId = input.enterpriseId ?? readActiveEnterpriseId();
  const validated = validateMidsForMerchant(input.merchantId, [input.mid]);
  if (!validated.ok) return validated;

  const store = readStore(enterpriseId);
  const entry = store.entries.find((e) => e.featureKey === input.featureKey);
  if (!entry) return { ok: false, error: "未找到白名单条目" };
  syncAllowedMidsFromGrants(entry);
  const grant = entry.midGrants!.find((g) => g.mid === input.mid);
  if (!grant) return { ok: false, error: "该 MID 未在白名单中" };

  grant.expiresAt = input.expiresAt ?? undefined;
  appendChangelog(store, {
    featureKey: input.featureKey,
    action: "set_expiry",
    mids: [input.mid],
    operatorEmail: input.operatorEmail,
    detail: input.expiresAt ? `设置到期：${input.expiresAt}` : "清除到期（长期有效）",
  });
  writeStore(store);
  return { ok: true };
}

export function updateWhitelistNote(input: {
  featureKey: string;
  note: string;
  operatorEmail: string;
  enterpriseId?: string;
}): void {
  const enterpriseId = input.enterpriseId ?? readActiveEnterpriseId();
  const store = readStore(enterpriseId);
  const entry = store.entries.find((e) => e.featureKey === input.featureKey);
  if (!entry) return;
  entry.note = input.note.trim();
  appendChangelog(store, {
    featureKey: input.featureKey,
    action: "note",
    mids: [],
    operatorEmail: input.operatorEmail,
    detail: `更新备注：${entry.note || "（空）"}`,
  });
  writeStore(store);
}

export function countWhitelistedMidsForMerchant(featureKey: string, merchantId: string, enterpriseId = readActiveEnterpriseId()): number {
  const entry = getWhitelistEntry(featureKey, enterpriseId);
  if (!entry) return 0;
  const storeIds = new Set(getMerchantStores(merchantId).map((s) => s.storeId));
  return entry.allowedMids.filter((m) => storeIds.has(m)).length;
}

export function listWhitelistedMidsForMerchant(
  featureKey: string,
  merchantId: string,
  enterpriseId = readActiveEnterpriseId(),
): string[] {
  const entry = getWhitelistEntry(featureKey, enterpriseId);
  if (!entry) return [];
  const storeIds = new Set(getMerchantStores(merchantId).map((s) => s.storeId));
  return entry.allowedMids.filter((m) => storeIds.has(m));
}

export function listMerchantStoreOptions(merchantId: string): { mid: string; name: string; code: string }[] {
  return getMerchantStores(merchantId).map((s) => ({
    mid: s.storeId,
    name: s.name,
    code: s.code,
  }));
}

/** 跨商户检索开通明细 */
export function searchWhitelistGrants(filter: {
  enterpriseId?: string;
  featureKey?: string;
  merchantId?: string;
  query?: string;
}): Array<{
  featureKey: string;
  displayName: string;
  merchantId: string;
  merchantName: string;
  mid: string;
  storeName: string;
  grantedAt: string;
  expiresAt?: string;
  note?: string;
}> {
  const enterpriseId = filter.enterpriseId ?? readActiveEnterpriseId();
  purgeExpiredWhitelistGrants(enterpriseId);
  const snap = getEnterpriseMerchantSnapshot();
  const q = filter.query?.trim().toLowerCase() ?? "";
  const features = listCustomFeatureRegistryEntries();
  const rows: Array<{
    featureKey: string;
    displayName: string;
    merchantId: string;
    merchantName: string;
    mid: string;
    storeName: string;
    grantedAt: string;
    expiresAt?: string;
    note?: string;
  }> = [];

  for (const f of features) {
    if (filter.featureKey && f.featureKey !== filter.featureKey) continue;
    const entry = readStore(enterpriseId).entries.find((e) => e.featureKey === f.featureKey);
    if (!entry) continue;
    for (const grant of ensureMidGrants(entry)) {
      if (!isMidGrantActive(grant, entry.expiresAt)) continue;
      const store = snap.stores.find((s) => s.storeId === grant.mid);
      if (!store) continue;
      if (filter.merchantId && store.merchantId !== filter.merchantId) continue;
      const merchant = snap.merchants.find((m) => m.merchantId === store.merchantId);
      const merchantName = merchant?.name ?? store.merchantId;
      if (q) {
        const hay = [f.featureKey, f.displayName, merchantName, store.name, grant.mid, grant.note ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      rows.push({
        featureKey: f.featureKey,
        displayName: f.displayName,
        merchantId: store.merchantId,
        merchantName,
        mid: grant.mid,
        storeName: store.name,
        grantedAt: grant.grantedAt,
        expiresAt: grant.expiresAt ?? entry.expiresAt,
        note: grant.note ?? entry.note,
      });
    }
  }
  return rows;
}

/** 演示重置：清空当前企业白名单 */
export function resetCustomFeatureWhitelistDemo(enterpriseId = readActiveEnterpriseId()): void {
  const all = readAllStores();
  delete all[enterpriseId];
  writeAllStores(all);
  readStore(enterpriseId);
}

export function getWhitelistStoreRevision(): string {
  const store = readStore();
  const snap = getEnterpriseMerchantSnapshot();
  return `${store.enterpriseId}:${store.entries.length}:${store.changelog[0]?.at ?? "0"}:${snap.stores.length}`;
}
