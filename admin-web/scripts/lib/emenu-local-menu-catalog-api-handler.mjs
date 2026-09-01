import path from "node:path";
import { createLiveMenuProvider } from "./emenu-local-seasoning-menu-provider.mjs";
import { resolveMenuCatalog } from "./emenu-local-menu-catalog.mjs";

const API_PATH = "/api/v1/emenu-local/menu-catalog";

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function handleEmenuMenuCatalogApi(req, res, { cacheDir, menuProvider } = {}) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "http://local");
  if (url.pathname !== API_PATH) return false;
  if (method !== "GET") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return true;
  }
  const catalog = await resolveMenuCatalog({
    req,
    cacheDir,
    product: url.searchParams.get("product"),
    menuProvider: menuProvider ?? createLiveMenuProvider(),
  });
  sendJson(res, 200, catalog);
  return true;
}

export function attachEmenuMenuCatalogApi(middlewares, projectRoot) {
  const cacheDir = path.join(projectRoot, ".cache");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (pathname !== API_PATH) {
      next();
      return;
    }
    handleEmenuMenuCatalogApi(req, res, { cacheDir }).then((handled) => {
      if (!handled) next();
    }).catch((error) => {
      sendJson(res, error.statusCode || 500, error.payload ?? { error: "internal", message: String(error?.message || error) });
    });
  });
}
