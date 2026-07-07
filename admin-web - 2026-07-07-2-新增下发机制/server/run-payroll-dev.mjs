#!/usr/bin/env node
/**
 * 同时启动 Payroll API (3010) + Vite（代理 /api/v1/payroll）
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function run(cmd, args, env) {
  return spawn(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env },
  });
}

const api = run("node", ["server/payroll-api-server.mjs"], { PAYROLL_API_PORT: "3010" });
const vite = run("npx", ["vite"], { PAYROLL_USE_API_PROXY: "1" });

function shutdown() {
  api.kill("SIGTERM");
  vite.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

api.on("exit", (code) => {
  if (code && code !== 0) shutdown();
});
vite.on("exit", (code) => {
  if (code && code !== 0) shutdown();
});
