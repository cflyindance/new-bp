#!/usr/bin/env node
/**
 * PayRoll API — 独立开发服务（P0 骨架，与 Vite Mock 共用 handler）
 * 启动：npm run payroll-api
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handlePayrollMockApi } from "../scripts/lib/payroll-mock-api-handler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dbPath = path.join(projectRoot, ".cache", "payroll-mock-db.json");
const PORT = Number(process.env.PAYROLL_API_PORT || 3010);
const HOST = process.env.PAYROLL_API_HOST || "127.0.0.1";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
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
  if (pathname.startsWith("/api/v1/payroll")) {
    handlePayrollMockApi(req, res, dbPath).then((handled) => {
      if (!handled) {
        res.statusCode = 404;
        res.end("Not found");
      }
    });
    return;
  }
  if (pathname === "/" || pathname === "/health") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, service: "payroll-api-server", port: PORT }));
    return;
  }
  res.statusCode = 404;
  res.end("Payroll API — use /api/v1/payroll/*");
});

server.listen(PORT, HOST, () => {
  console.log(`[payroll-api] http://${HOST}:${PORT}/api/v1/payroll/health`);
  console.log(`[payroll-api] db: ${dbPath}`);
});
