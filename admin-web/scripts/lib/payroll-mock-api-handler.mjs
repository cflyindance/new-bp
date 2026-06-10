/**
 * PayRoll P0 — 开发态 Mock REST API（Vite / preview 中间件）
 * @see docs/项目文档/PayRoll-P0-设计与开发规格.md §4.2
 */
import fs from "node:fs";
import path from "node:path";

const API_PREFIX = "/api/v1/payroll";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : null);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function loadDb(dbPath) {
  if (!fs.existsSync(dbPath)) {
    return { version: 1, updatedAt: null, snapshot: null };
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { version: 1, updatedAt: null, snapshot: null };
  }
}

function saveDb(dbPath, db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} dbPath
 */
export async function handlePayrollMockApi(req, res, dbPath) {
  const method = (req.method || "GET").toUpperCase();
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);

  if (!pathname.startsWith(API_PREFIX)) {
    return false;
  }

  const sub = pathname.slice(API_PREFIX.length) || "/";

  try {
    if (method === "GET" && sub === "/health") {
      sendJson(res, 200, { ok: true, service: "payroll-mock" });
      return true;
    }

    if (method === "GET" && sub === "/state") {
      const db = loadDb(dbPath);
      if (!db.snapshot) {
        sendJson(res, 404, { error: "no_snapshot", message: "Payroll state not initialized" });
        return true;
      }
      sendJson(res, 200, db.snapshot);
      return true;
    }

    if (method === "PUT" && sub === "/state") {
      const body = await readBody(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_body" });
        return true;
      }
      const db = loadDb(dbPath);
      db.snapshot = body;
      saveDb(dbPath, db);
      sendJson(res, 200, { ok: true, updatedAt: db.updatedAt });
      return true;
    }

    if (method === "GET" && sub === "/audit-log") {
      const db = loadDb(dbPath);
      const log = db.snapshot?.data?.auditLog;
      const list = Array.isArray(log) ? log : [];
      const limit = Math.min(100, parseInt(new URL(req.url || "", "http://x").searchParams.get("limit") || "50", 10));
      sendJson(res, 200, { items: list.slice(0, limit), total: list.length });
      return true;
    }

    if (method === "GET" && sub === "/config") {
      sendJson(res, 200, {
        mode: "calculation_only",
        apiVersion: "v1",
        features: { state: true, auditLog: true, adpExport: "client" },
      });
      return true;
    }

    sendJson(res, 404, { error: "not_found", path: sub });
    return true;
  } catch (err) {
    sendJson(res, 500, { error: "internal", message: String(err && err.message ? err.message : err) });
    return true;
  }
}

export function attachPayrollMockApi(middlewares, projectRoot) {
  const dbPath = path.join(projectRoot, ".cache", "payroll-mock-db.json");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!pathname.startsWith(API_PREFIX)) {
      next();
      return;
    }
    handlePayrollMockApi(req, res, dbPath).then((handled) => {
      if (!handled) next();
    });
  });
}
