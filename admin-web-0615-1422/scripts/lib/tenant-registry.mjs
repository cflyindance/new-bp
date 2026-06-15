/**
 * 多租户注册表（P6）— 邮箱 → 租户映射
 */

/** @type {Record<string, { title: string; titleEn?: string; emails: string[] }>} */
export const TENANT_REGISTRY = {
  "demo-tenant": {
    title: "MenuSifu 演示租户",
    titleEn: "MenuSifu Demo",
    emails: ["*@menusifu.cn", "*@menusifu.com"],
  },
  "partner-hq": {
    title: "川味火锅总部",
    titleEn: "Partner Hotpot HQ",
    emails: ["hotpot@menusifu.cn", "hotpot@partner.com", "*@chuanchuan-hotpot.com"],
  },
};

function emailMatches(pattern, email) {
  const e = String(email ?? "").trim().toLowerCase();
  const p = pattern.toLowerCase();
  if (p.startsWith("*@")) {
    return e.endsWith(p.slice(1));
  }
  return e === p;
}

/** @returns {string[]} */
export function resolveTenantIdsForEmail(email) {
  const matched = [];
  for (const [tenantId, meta] of Object.entries(TENANT_REGISTRY)) {
    if (meta.emails.some((pat) => emailMatches(pat, email))) {
      matched.push(tenantId);
    }
  }
  return matched.length > 0 ? matched : ["demo-tenant"];
}

export function resolveDefaultTenantIdForEmail(email) {
  const ids = resolveTenantIdsForEmail(email);
  if (ids.length === 1) return ids[0];
  const lower = String(email ?? "").toLowerCase();
  if (lower.includes("hotpot") || lower.includes("chuanchuan")) return "partner-hq";
  return ids[0];
}

export function listTenantsForEmail(email) {
  return resolveTenantIdsForEmail(email).map((id) => ({
    id,
    title: TENANT_REGISTRY[id]?.title ?? id,
    titleEn: TENANT_REGISTRY[id]?.titleEn ?? id,
  }));
}

export function isTenantAllowedForEmail(email, tenantId) {
  return resolveTenantIdsForEmail(email).includes(tenantId);
}
