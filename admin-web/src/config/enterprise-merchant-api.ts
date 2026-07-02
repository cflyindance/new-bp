/**
 * M 平台 · 品牌 REST API 演示层
 * 路径约定：/api/enterprises/{enterpriseId}/merchants[...]
 */
import { readActiveEnterpriseId } from "./enterprise-merchant-enterprise-context";
import {
  getMerchantById,
  getMerchants,
  getMerchantReportSummary,
  getMerchantSlaMetrics,
  renewMerchantContract,
  syncMerchantFromCrm,
  updateMerchantStatus,
} from "./enterprise-merchant-store";
import type { MerchantFilter, RenewMerchantContractInput } from "./enterprise-merchant-types";

export const MERCHANT_API_BASE = "/api/enterprises";

export interface MerchantApiCallLog {
  id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  at: string;
  detail?: string;
}

const API_LOG_KEY = "menusifu:enterprise-merchant-api-log-v1";
const API_DELAY_MS = 80;

function genLogId(): string {
  return `api-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function readApiLog(): MerchantApiCallLog[] {
  try {
    return JSON.parse(sessionStorage.getItem(API_LOG_KEY) ?? "[]") as MerchantApiCallLog[];
  } catch {
    return [];
  }
}

function writeApiLog(logs: MerchantApiCallLog[]): void {
  try {
    sessionStorage.setItem(API_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

export function appendMerchantApiLog(
  entry: Omit<MerchantApiCallLog, "id" | "at">,
): MerchantApiCallLog {
  const log: MerchantApiCallLog = {
    ...entry,
    id: genLogId(),
    at: new Date().toISOString(),
  };
  writeApiLog([log, ...readApiLog()]);
  return log;
}

export function getMerchantApiCallLog(): MerchantApiCallLog[] {
  return readApiLog();
}

export function clearMerchantApiCallLog(): void {
  try {
    sessionStorage.removeItem(API_LOG_KEY);
  } catch {
    /* ignore */
  }
}

export function merchantApiPath(enterpriseId: string, suffix = ""): string {
  const base = `${MERCHANT_API_BASE}/${encodeURIComponent(enterpriseId)}/merchants`;
  return suffix ? `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}` : base;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runApi<T>(
  method: string,
  path: string,
  handler: () => T,
  detail?: string,
): Promise<T> {
  const start = performance.now();
  await delay(API_DELAY_MS);
  try {
    const result = handler();
    appendMerchantApiLog({
      method,
      path,
      status: 200,
      durationMs: Math.round(performance.now() - start),
      detail,
    });
    return result;
  } catch (err) {
    appendMerchantApiLog({
      method,
      path,
      status: 500,
      durationMs: Math.round(performance.now() - start),
      detail: err instanceof Error ? err.message : "Internal error",
    });
    throw err;
  }
}

export async function apiListMerchants(
  enterpriseId: string = readActiveEnterpriseId(),
  filter: MerchantFilter = {},
) {
  const path = merchantApiPath(enterpriseId, filter.status ? `?status=${filter.status}` : "");
  return runApi("GET", path, () => getMerchants(filter), `返回 ${getMerchants(filter).length} 条`);
}

export async function apiGetMerchant(
  merchantId: string,
  enterpriseId: string = readActiveEnterpriseId(),
) {
  const path = merchantApiPath(enterpriseId, `/${encodeURIComponent(merchantId)}`);
  const merchant = getMerchantById(merchantId);
  if (!merchant) throw new Error("Merchant not found");
  return runApi("GET", path, () => merchant);
}

export async function apiPatchMerchantStatus(
  merchantId: string,
  status: Parameters<typeof updateMerchantStatus>[1],
  enterpriseId: string = readActiveEnterpriseId(),
) {
  const path = merchantApiPath(enterpriseId, `/${encodeURIComponent(merchantId)}/status`);
  return runApi("PATCH", path, () => {
    const updated = updateMerchantStatus(merchantId, status);
    if (!updated) throw new Error("Merchant not found");
    return updated;
  }, `status → ${status}`);
}

export async function apiPostCrmSync(
  merchantId: string,
  enterpriseId: string = readActiveEnterpriseId(),
) {
  const path = merchantApiPath(enterpriseId, `/${encodeURIComponent(merchantId)}/crm-sync`);
  return runApi("POST", path, () => {
    const synced = syncMerchantFromCrm(merchantId);
    if (!synced) throw new Error("Merchant not found");
    return synced;
  }, "CRM 合同同步");
}

export async function apiPostContractRenew(
  merchantId: string,
  input: RenewMerchantContractInput,
  enterpriseId: string = readActiveEnterpriseId(),
) {
  const path = merchantApiPath(enterpriseId, `/${encodeURIComponent(merchantId)}/contract/renew`);
  return runApi("POST", path, () => {
    const renewed = renewMerchantContract(merchantId, input);
    if (!renewed) throw new Error("Merchant not found");
    return renewed;
  }, `续期至 ${input.contractExpiresAt}`);
}

export async function apiGetMerchantReports(enterpriseId: string = readActiveEnterpriseId()) {
  const path = `${MERCHANT_API_BASE}/${encodeURIComponent(enterpriseId)}/merchants/reports/summary`;
  return runApi("GET", path, () => ({
    summary: getMerchantReportSummary(),
    sla: getMerchantSlaMetrics(),
  }));
}
