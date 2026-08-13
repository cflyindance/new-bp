#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, env) {
  return spawn(command, args, { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, ...env } });
}

const api = run("node", ["server/emenu-local-config-api-server.mjs"], { EMENU_LOCAL_API_PORT: "3011" });
const vite = run("npx", ["vite"], { EMENU_LOCAL_USE_API_PROXY: "1" });

function shutdown() {
  api.kill("SIGTERM");
  vite.kill("SIGTERM");
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
api.on("exit", (code) => { if (code && code !== 0) shutdown(); });
vite.on("exit", (code) => { if (code && code !== 0) shutdown(); });
