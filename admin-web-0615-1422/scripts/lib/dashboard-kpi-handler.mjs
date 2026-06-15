/**
 * 主页 KPI API（P5/P6）— 日快照 + 演示回退
 */
import { readBody, sendJson } from "./http-api-utils.mjs";
import { isWriteMethod, requireAuth } from "./api-auth.mjs";
import { resolveTenantIdFromRequest } from "./tenant-scope.mjs";
import {
  createJsonKpiSnapshotStore,
  createSqliteKpiSnapshotStore,
  defaultKpiSeedRows,
} from "./kpi-snapshot-store.mjs";

export const DASHBOARD_KPI_API_PREFIX = "/api/v1/dashboard";

function hashScope(tenantId, brandId, storeId) {
  const s = `${tenantId}|${brandId}|${storeId}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function buildDemoKpiPayload(tenantId, brandId, storeId) {
  const h = hashScope(tenantId, brandId, storeId);
  const salesBase = 12000 + (h % 8000);
  const orders = 80 + (h % 120);
  const staff = 4 + (h % 12);
  return {
    currency: tenantId === "partner-hq" ? "CNY" : "CNY",
    asOf: new Date().toISOString(),
    scope: { tenantId, brandId: brandId || null, storeId: storeId || null },
    metrics: {
      salesToday: { label: "今日销售额", value: salesBase, formatted: `¥${salesBase.toLocaleString("zh-CN")}` },
      orderCount: { label: "订单数", value: orders, formatted: String(orders) },
      staffOnDuty: { label: "在岗员工", value: staff, formatted: String(staff) },
    },
    source: "demo-fallback",
  };
}

/**
 * @param {{ cacheDir: string, driver?: string, sqlitePath?: string }} options
 */
export function createKpiService(options) {
  const { cacheDir, driver = "json", sqlitePath } = options;
  const store =
    driver === "sqlite"
      ? createSqliteKpiSnapshotStore(sqlitePath ?? `${cacheDir}/bplant-api.sqlite`)
      : createJsonKpiSnapshotStore(cacheDir);

  store.seedIfEmpty(defaultKpiSeedRows());

  return store;
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ kpiStore: ReturnType<typeof createKpiService>, cacheDir: string }} ctx
 */
export async function handleDashboardKpiApi(req, res, ctx) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  if (!pathname.startsWith(DASHBOARD_KPI_API_PREFIX)) return false;

  const sub = pathname.slice(DASHBOARD_KPI_API_PREFIX.length) || "/";
  const { kpiStore, cacheDir } = ctx;

  if (method === "GET" && sub === "/health") {
    sendJson(res, 200, { ok: true, service: "dashboard-kpi", driver: kpiStore.driver });
    return true;
  }

  let auth = { tenantId: "demo-tenant" };
  if (process.env.BPLANT_API_REQUIRE_AUTH === "1" || isWriteMethod(method)) {
    const gate = requireAuth(req, res, cacheDir);
    if (!gate.ok) return true;
    auth = gate;
  } else {
    auth = { tenantId: resolveTenantIdFromRequest(req, { tenantId: "demo-tenant" }) };
  }

  const tenantId = resolveTenantIdFromRequest(req, auth);
  const brandId = url.searchParams.get("brandId") || "";
  const storeId = url.searchParams.get("storeId") || "";

  if (method === "GET" && sub === "/kpi") {
    const snapshot = kpiStore.getKpi({ tenantId, brandId, storeId });
    sendJson(res, 200, snapshot ?? buildDemoKpiPayload(tenantId, brandId, storeId));
    return true;
  }

  if (method === "PUT" && sub === "/kpi/snapshot") {
    const body = await readBody(req);
    if (!body?.salesToday && body?.salesToday !== 0) {
      sendJson(res, 400, { error: "invalid_body" });
      return true;
    }
    kpiStore.upsertSnapshot({
      tenantId,
      brandId: body.brandId ?? brandId,
      storeId: body.storeId ?? storeId,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      currency: body.currency ?? "CNY",
      salesToday: Number(body.salesToday),
      orderCount: Number(body.orderCount ?? 0),
      staffOnDuty: Number(body.staffOnDuty ?? 0),
    });
    sendJson(res, 200, { ok: true });
    return true;
  }

  sendJson(res, 404, { error: "not_found", path: sub });
  return true;
}
