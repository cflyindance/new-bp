/**
 * M 平台 · 当前 Enterprise 上下文（多租户演示）
 */
import type { EnterpriseTenant } from "./enterprise-merchant-types";

export const DEFAULT_ENTERPRISE_ID = "enterprise-miju";
export const ENTERPRISE_CONTEXT_KEY = "menusifu:enterprise-merchant-context-v1";

export const DEMO_ENTERPRISES: EnterpriseTenant[] = [
  { enterpriseId: "enterprise-miju", name: "米聚餐饮集团", code: "miju", region: "CN" },
  { enterpriseId: "enterprise-na-partner", name: "MenuSifu NA Partner", code: "na-partner", region: "US" },
];

export function readActiveEnterpriseId(): string {
  try {
    const raw = sessionStorage.getItem(ENTERPRISE_CONTEXT_KEY);
    if (raw && DEMO_ENTERPRISES.some((e) => e.enterpriseId === raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_ENTERPRISE_ID;
}

export function writeActiveEnterpriseId(enterpriseId: string): void {
  if (!DEMO_ENTERPRISES.some((e) => e.enterpriseId === enterpriseId)) return;
  try {
    sessionStorage.setItem(ENTERPRISE_CONTEXT_KEY, enterpriseId);
  } catch {
    /* ignore */
  }
}

export function getEnterpriseById(enterpriseId: string): EnterpriseTenant | undefined {
  return DEMO_ENTERPRISES.find((e) => e.enterpriseId === enterpriseId);
}

export function getActiveEnterprise(): EnterpriseTenant {
  return getEnterpriseById(readActiveEnterpriseId()) ?? DEMO_ENTERPRISES[0]!;
}

export function listEnterprises(): EnterpriseTenant[] {
  return [...DEMO_ENTERPRISES];
}
