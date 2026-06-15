#!/usr/bin/env node
/**
 * BPlant 生产 API 服务（P5）— SQLite + 鉴权
 * 启动：npm run bplant-api
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBplantApiRouter } from "../scripts/lib/bplant-api-router.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, ".cache");
const PORT = Number(process.env.BPLANT_API_PORT || 3012);
const HOST = process.env.BPLANT_API_HOST || "127.0.0.1";

if (process.env.BPLANT_API_REQUIRE_AUTH === undefined) {
  process.env.BPLANT_API_REQUIRE_AUTH = "1";
}

const router = createBplantApiRouter({ driver: "sqlite", dataDir });

const server = http.createServer((req, res) => {
  router.handle(req, res).then((handled) => {
    if (!handled) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("BPlant API — use /api/v1/*");
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[bplant-api] http://${HOST}:${PORT}/api/v1/health`);
  console.log(`[bplant-api] driver=sqlite auth=${process.env.BPLANT_API_REQUIRE_AUTH}`);
  console.log(`[bplant-api] data: ${dataDir}/bplant-api.sqlite`);
});
