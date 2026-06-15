/**
 * 租户功能画像 Mock REST API（Vite dev / 独立服务）
 * P5：路由委托给 tenant-profile-api-core + JSON repository
 */
import path from "node:path";
import { handleTenantProfileApiCore, TENANT_PROFILE_API_PREFIX } from "./tenant-profile-api-core.mjs";
import { createJsonTenantProfileRepository } from "./tenant-profile-repository.mjs";

export const API_PREFIX = TENANT_PROFILE_API_PREFIX;

export { mergeProfileLayers } from "./tenant-profile-defaults.mjs";
export { profileKey } from "./tenant-scope.mjs";

let _resolveHelper;

function getResolveHelper() {
  if (!_resolveHelper) {
    _resolveHelper = createJsonTenantProfileRepository(
      path.join(process.cwd(), ".cache", "tenant-profile-mock-db.json"),
    );
  }
  return _resolveHelper;
}

export function resolveProfileFromDb(db, { brandId = "", storeId = "" } = {}) {
  return getResolveHelper().resolveProfile(db, { brandId, storeId });
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} dbPath
 */
export async function handleTenantProfileMockApi(req, res, dbPath) {
  const repo = createJsonTenantProfileRepository(dbPath);
  return handleTenantProfileApiCore(req, res, repo);
}

export function attachTenantProfileMockApi(middlewares, projectRoot) {
  if (process.env.BPLANT_API_USE_PROXY === "1") return;

  const dbPath = path.join(projectRoot, ".cache", "tenant-profile-mock-db.json");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!pathname.startsWith(API_PREFIX)) {
      next();
      return;
    }
    handleTenantProfileMockApi(req, res, dbPath).then((handled) => {
      if (!handled) next();
    });
  });
}
