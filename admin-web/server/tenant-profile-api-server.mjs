#!/usr/bin/env node
/**
 * 租户功能画像 API — 独立开发服务
 * 启动：npm run tenant-profile-api
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleTenantProfileMockApi } from "../scripts/lib/tenant-profile-mock-api-handler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dbPath = path.join(projectRoot, ".cache", "tenant-profile-mock-db.json");
const PORT = Number(process.env.TENANT_PROFILE_API_PORT || 3011);
const HOST = process.env.TENANT_PROFILE_API_HOST || "127.0.0.1";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

const server = http.createServer((req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  if (pathname.startsWith("/api/v1/tenant-profile")) {
    handleTenantProfileMockApi(req, res, dbPath).then((handled) => {
      if (!handled) {
        res.statusCode = 404;
        res.end("Not found");
      }
    });
    return;
  }
  if (pathname === "/" || pathname === "/health") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, service: "tenant-profile-api-server", port: PORT }));
    return;
  }
  res.statusCode = 404;
  res.end("Tenant Profile API — use /api/v1/tenant-profile/*");
});

server.listen(PORT, HOST, () => {
  console.log(`[tenant-profile-api] http://${HOST}:${PORT}/api/v1/tenant-profile/health`);
  console.log(`[tenant-profile-api] db: ${dbPath}`);
});
