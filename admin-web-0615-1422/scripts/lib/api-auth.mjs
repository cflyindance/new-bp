/**
 * BPlant API 鉴权（P5/P6）
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { readBody, sendJson } from "./http-api-utils.mjs";
import {
  isTenantAllowedForEmail,
  listTenantsForEmail,
  resolveDefaultTenantIdForEmail,
} from "./tenant-registry.mjs";
import { resolveTenantIdFromRequest } from "./tenant-scope.mjs";

const DEMO_PASSWORD = "Menusifu666";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function isAuthRequired() {
  return process.env.BPLANT_API_REQUIRE_AUTH === "1";
}

function isMenusifuEmail(email) {
  const lower = String(email ?? "").trim().toLowerCase();
  return lower.endsWith("@menusifu.cn") || lower.endsWith("@menusifu.com");
}

function isAllowedLoginEmail(email) {
  const lower = String(email ?? "").trim().toLowerCase();
  if (isMenusifuEmail(lower)) return true;
  if (lower.endsWith("@partner.com")) return true;
  if (lower.endsWith("@chuanchuan-hotpot.com")) return true;
  return false;
}

function sessionsPath(cacheDir) {
  return path.join(cacheDir, "api-sessions.json");
}

function loadSessions(cacheDir) {
  const p = sessionsPath(cacheDir);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

function saveSessions(cacheDir, sessions) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(sessionsPath(cacheDir), JSON.stringify(sessions, null, 2), "utf8");
}

function pruneSessions(sessions) {
  const now = Date.now();
  for (const [token, meta] of Object.entries(sessions)) {
    if (!meta?.expiresAt || meta.expiresAt < now) delete sessions[token];
  }
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function getAuthContext(req, cacheDir) {
  const apiKey = process.env.BPLANT_API_KEY?.trim();
  const headerKey = req.headers["x-bplant-api-key"];
  if (apiKey && headerKey === apiKey) {
    const tenantId = resolveTenantIdFromRequest(req, {
      tenantId: req.headers["x-bplant-tenant"] ?? "demo-tenant",
    });
    return {
      actor: "api-key",
      email: req.headers["x-bplant-user"] ?? "api-key",
      tenantId,
    };
  }

  const auth = req.headers.authorization ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  if (!match) return null;

  const sessions = loadSessions(cacheDir);
  pruneSessions(sessions);
  const meta = sessions[match[1]];
  if (!meta || meta.expiresAt < Date.now()) return null;

  const headerTenant =
    typeof req.headers["x-bplant-tenant"] === "string" ? req.headers["x-bplant-tenant"].trim() : "";
  let tenantId = meta.tenantId ?? "demo-tenant";
  if (headerTenant && isTenantAllowedForEmail(meta.email, headerTenant)) {
    tenantId = headerTenant;
  }

  return { actor: meta.email, email: meta.email, token: match[1], tenantId };
}

export function requireAuth(req, res, cacheDir) {
  if (!isAuthRequired()) {
    const tenantId = resolveTenantIdFromRequest(req, { tenantId: "demo-tenant" });
    return { ok: true, actor: "dev-open", tenantId };
  }
  const ctx = getAuthContext(req, cacheDir);
  if (!ctx) {
    sendJson(res, 401, { error: "unauthorized", message: "Missing or invalid credentials" });
    return { ok: false };
  }
  return { ok: true, ...ctx };
}

export async function handleAuthLogin(req, res, cacheDir) {
  const body = await readBody(req);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!email || !isAllowedLoginEmail(email)) {
    sendJson(res, 400, { error: "invalid_email" });
    return true;
  }
  if (password !== DEMO_PASSWORD) {
    sendJson(res, 401, { error: "invalid_credentials" });
    return true;
  }

  const tenantId = resolveDefaultTenantIdForEmail(email);
  const tenants = listTenantsForEmail(email);
  const token = createToken();
  const sessions = loadSessions(cacheDir);
  pruneSessions(sessions);
  sessions[token] = {
    email,
    tenantId,
    tenants: tenants.map((t) => t.id),
    expiresAt: Date.now() + TOKEN_TTL_MS,
    createdAt: new Date().toISOString(),
  };
  saveSessions(cacheDir, sessions);

  sendJson(res, 200, {
    token,
    email,
    tenantId,
    tenants,
    expiresAt: new Date(sessions[token].expiresAt).toISOString(),
    tokenType: "Bearer",
  });
  return true;
}

export async function handleAuthMe(req, res, cacheDir) {
  const gate = requireAuth(req, res, cacheDir);
  if (!gate.ok) return true;

  const tenants = gate.email ? listTenantsForEmail(gate.email) : [];
  sendJson(res, 200, {
    email: gate.email ?? null,
    tenantId: gate.tenantId ?? "demo-tenant",
    tenants,
    actor: gate.actor,
  });
  return true;
}

export function isWriteMethod(method) {
  return method === "PUT" || method === "POST" || method === "PATCH" || method === "DELETE";
}
