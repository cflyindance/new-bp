/**
 * 平台功能预设 — 变更审计（API + 本地兜底）
 */
import type { PresetOverrideChangeSet } from "./feature-presets-audit-diff";
import { apiFetch } from "./api-client";

const API_BASE = "/api/v1/tenant-profile";
const LOCAL_AUDIT_KEY = "bplant-preset-audit-v1";
const LOCAL_AUDIT_MAX = 200;

export type PresetAuditAction =
  | "preset.variant.override"
  | "preset.business_type.create"
  | "preset.business_type.update"
  | "preset.business_type.delete";

export interface PresetAuditEntry {
  id: string;
  createdAt: string;
  actor: string;
  action: PresetAuditAction;
  path?: string;
  variantId?: string;
  businessTypeId?: string;
  version?: number;
  title?: string;
  cloneFrom?: string;
  changes?: PresetOverrideChangeSet;
}

export interface PresetAuditQuery {
  variantId?: string;
  businessTypeId?: string;
  limit?: number;
}

function loadLocalAudit(): PresetAuditEntry[] {
  try {
    const raw = sessionStorage.getItem(LOCAL_AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PresetAuditEntry[];
  } catch {
    return [];
  }
}

function saveLocalAudit(entries: PresetAuditEntry[]): void {
  try {
    sessionStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(entries.slice(0, LOCAL_AUDIT_MAX)));
  } catch {
    /* ignore */
  }
}

export function appendLocalPresetAudit(entry: Omit<PresetAuditEntry, "id" | "createdAt">): void {
  const list = loadLocalAudit();
  list.unshift({
    ...entry,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  saveLocalAudit(list);
}

function matchesQuery(entry: PresetAuditEntry, query: PresetAuditQuery): boolean {
  if (query.variantId && entry.variantId !== query.variantId) return false;
  if (query.businessTypeId) {
    const bt = entry.businessTypeId ?? entry.variantId?.split(":")[0];
    if (bt !== query.businessTypeId) return false;
  }
  return true;
}

export async function fetchPresetAuditLog(query: PresetAuditQuery = {}): Promise<PresetAuditEntry[]> {
  const limit = query.limit ?? 50;
  const params = new URLSearchParams();
  if (query.variantId) params.set("variantId", query.variantId);
  if (query.businessTypeId) params.set("businessTypeId", query.businessTypeId);
  params.set("limit", String(limit));
  try {
    const res = await apiFetch(`${API_BASE}/presets/audit-log?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { entries?: PresetAuditEntry[] };
    return data.entries ?? [];
  } catch {
    return loadLocalAudit().filter((e) => matchesQuery(e, query)).slice(0, limit);
  }
}
