#!/usr/bin/env node
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleEmenuSeasoningApi } from "../scripts/lib/emenu-local-seasoning-api-handler.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, ".cache", "emenu-local-seasoning-db.json");
const port = Number(process.env.EMENU_LOCAL_API_PORT || 3011);
const host = process.env.EMENU_LOCAL_API_HOST || "127.0.0.1";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  handleEmenuSeasoningApi(req, res, dbPath).then((handled) => {
    if (!handled) {
      res.statusCode = 404;
      res.end("eMenu local API — use /api/v1/emenu-local/seasoning/*");
    }
  }).catch((error) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "internal", message: String(error?.message || error) }));
  });
});

server.listen(port, host, () => {
  console.log(`[emenu-local-api] http://${host}:${port}/api/v1/emenu-local/seasoning/health`);
  console.log(`[emenu-local-api] db: ${dbPath}`);
});
