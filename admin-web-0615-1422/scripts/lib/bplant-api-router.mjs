/**
 * BPlant 统一 API 路由（P5/P6）
 */
import path from "node:path";
import { sendJson, setCors } from "./http-api-utils.mjs";
import { handleAuthLogin, handleAuthMe } from "./api-auth.mjs";
import { handleTenantProfileApiCore } from "./tenant-profile-api-core.mjs";
import { createKpiService, handleDashboardKpiApi } from "./dashboard-kpi-handler.mjs";
import {
  createJsonTenantProfileRepository,
  createSqliteTenantProfileRepository,
} from "./tenant-profile-repository.mjs";

const AUTH_PREFIX = "/api/v1/auth";

/**
 * @param {{ driver?: 'json' | 'sqlite', dataDir: string }} options
 */
export function createBplantApiRouter(options) {
  const dataDir = options.dataDir;
  const driver = options.driver === "sqlite" ? "sqlite" : "json";
  const sqlitePath = `${dataDir}/bplant-api.sqlite`;
  const repo =
    driver === "sqlite"
      ? createSqliteTenantProfileRepository(sqlitePath)
      : createJsonTenantProfileRepository(`${dataDir}/tenant-profile-mock-db.json`);

  const kpiStore = createKpiService({ cacheDir: dataDir, driver, sqlitePath });
  const kpiCtx = { kpiStore, cacheDir: repo.cacheDir };

  async function handleSupplemental(req, res) {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname === `${AUTH_PREFIX}/login`) {
      return handleAuthLogin(req, res, repo.cacheDir);
    }
    if (pathname === `${AUTH_PREFIX}/me`) {
      return handleAuthMe(req, res, repo.cacheDir);
    }
    if (pathname.startsWith("/api/v1/dashboard")) {
      return handleDashboardKpiApi(req, res, kpiCtx);
    }
    return false;
  }

  return {
    repo,
    kpiStore,
    handleSupplemental,
    async handle(req, res) {
      setCors(res);
      if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return true;
      }

      const pathname = decodeURIComponent((req.url || "/").split("?")[0]);

      if (pathname === "/health" || pathname === "/api/v1/health") {
        sendJson(res, 200, {
          ok: true,
          service: "bplant-api",
          driver: repo.driver,
          kpiDriver: kpiStore.driver,
          authRequired: process.env.BPLANT_API_REQUIRE_AUTH === "1",
        });
        return true;
      }

      if (await handleSupplemental(req, res)) return true;
      if (await handleTenantProfileApiCore(req, res, repo)) return true;

      return false;
    },
  };
}

/** Vite dev：在未走全量代理时挂载 auth + dashboard */
export function attachBplantDevSupplementalApi(middlewares, projectRoot) {
  if (process.env.BPLANT_API_USE_PROXY === "1") return;

  const dataDir = path.join(projectRoot, ".cache");
  const router = createBplantApiRouter({ driver: "json", dataDir });

  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (
      !pathname.startsWith("/api/v1/dashboard") &&
      pathname !== "/api/v1/auth/login" &&
      pathname !== "/api/v1/auth/me"
    ) {
      next();
      return;
    }
    setCors(res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    router.handleSupplemental(req, res).then((handled) => {
      if (!handled) next();
    });
  });
}
