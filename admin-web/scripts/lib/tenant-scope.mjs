/**
 * 多租户 profile 键规范（P6）
 * 格式：{tenantId}:tenant | {tenantId}:brand:{brandId} | {tenantId}:store:{storeId}
 */

const LEGACY_TENANT = "demo-tenant";

export function profileKey(tenantId, scope, brandId, storeId) {
  const tid = tenantId || LEGACY_TENANT;
  if (scope === "store" && storeId) return `${tid}:store:${storeId}`;
  if (scope === "brand" && brandId) return `${tid}:brand:${brandId}`;
  return `${tid}:tenant`;
}

export function tenantLayerKey(tenantId) {
  return profileKey(tenantId, "tenant");
}

export function migrateLegacyProfileKeys(profiles) {
  if (!profiles || typeof profiles !== "object") return {};
  const out = { ...profiles };
  let migrated = false;

  for (const [key, value] of Object.entries({ ...profiles })) {
    if (/^[a-z0-9-]+:(tenant|brand:|store:)/.test(key)) continue;

    if (key === "tenant:demo-tenant") {
      out[`${LEGACY_TENANT}:tenant`] = { ...value, tenantId: value?.tenantId ?? LEGACY_TENANT };
      delete out[key];
      migrated = true;
    } else if (key.startsWith("brand:")) {
      const brandId = key.slice(6);
      const tid = value?.tenantId ?? LEGACY_TENANT;
      out[`${tid}:brand:${brandId}`] = value;
      delete out[key];
      migrated = true;
    } else if (key.startsWith("store:")) {
      const storeId = key.slice(6);
      const tid = value?.tenantId ?? LEGACY_TENANT;
      out[`${tid}:store:${storeId}`] = value;
      delete out[key];
      migrated = true;
    }
  }

  return migrated ? out : profiles;
}

export function resolveTenantIdFromRequest(req, auth) {
  const header = req.headers["x-bplant-tenant"];
  const fromHeader = typeof header === "string" ? header.trim() : "";
  if (fromHeader) return fromHeader;
  if (auth?.tenantId) return auth.tenantId;
  const qs = new URL(req.url || "/", "http://localhost").searchParams.get("tenantId");
  if (qs) return qs;
  return LEGACY_TENANT;
}
