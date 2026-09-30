/**
 * PayRoll P0 — 开发态 Mock REST API（Vite / preview 中间件）
 * @see docs/项目文档/PayRoll-P0-设计与开发规格.md §4.2
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

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
    return createEmptyDb();
  }
  try {
    return normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf8")));
  } catch {
    return createEmptyDb();
  }
}

function createEmptyDb() {
  return normalizeDb({ version: 1, updatedAt: null, snapshot: null });
}

function normalizeDb(db) {
  return {
    ...db,
    declarationFamilies: Array.isArray(db?.declarationFamilies) ? db.declarationFamilies : [],
    declarationVersions: Array.isArray(db?.declarationVersions) ? db.declarationVersions : [],
    declarationPreferences: Array.isArray(db?.declarationPreferences) ? db.declarationPreferences : [],
    declarationOverrides: Array.isArray(db?.declarationOverrides) ? db.declarationOverrides : [],
    declarationSnapshots: Array.isArray(db?.declarationSnapshots) ? db.declarationSnapshots : [],
    declarationAudit: Array.isArray(db?.declarationAudit) ? db.declarationAudit : [],
  };
}

function declarationRequestScope(req) {
  return {
    organizationId: String(req.headers["x-payroll-organization-id"] || "").trim(),
    storeId: String(req.headers["x-payroll-store-id"] || "").trim(),
    actorId: String(req.headers["x-payroll-actor-id"] || "").trim(),
    permission: String(req.headers["x-payroll-permission"] || "view").trim(),
  };
}

function requireDeclarationScope(req, res, permission = "view") {
  const scope = declarationRequestScope(req);
  if (!scope.organizationId || !scope.actorId) {
    sendJson(res, 403, { error: "scope_required", message: "Declaration organization and actor scope are required" });
    return null;
  }
  const allowed = permission === "view" || scope.permission === "publish" || (permission === "manage" && scope.permission === "manage");
  if (!allowed) {
    sendJson(res, 403, { error: "permission_denied", message: `Declaration ${permission} permission is required` });
    return null;
  }
  return scope;
}

function scopedFamily(db, familyId, scope) {
  return db.declarationFamilies.find((family) =>
    family.familyId === familyId && family.scope?.organizationId === scope.organizationId &&
    (!family.scope?.storeId || family.scope.storeId === scope.storeId),
  );
}

function declarationId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function appendDeclarationAudit(db, scope, action, targetId, detail = {}) {
  db.declarationAudit.unshift({ id: declarationId("audit"), action, targetId, actorId: scope.actorId, organizationId: scope.organizationId, storeId: scope.storeId || null, at: new Date().toISOString(), detail });
}

function canonicalJson(value) {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, canonicalJson(nested)]));
  return value;
}

function saveDb(dbPath, db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db.updatedAt = new Date().toISOString();
  const temporary = `${dbPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(temporary, dbPath);
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

    if (sub.startsWith("/declaration")) {
      const route = sub.slice("/declaration".length) || "/";
      const viewScope = requireDeclarationScope(req, res, "view");
      if (!viewScope) return true;
      const db = loadDb(dbPath);

      if (method === "GET" && route === "/_templates") {
        const families = db.declarationFamilies.filter((family) => family.scope?.organizationId === viewScope.organizationId && (!family.scope?.storeId || family.scope.storeId === viewScope.storeId));
        const familyIds = new Set(families.map((family) => family.familyId));
        sendJson(res, 200, { families, versions: db.declarationVersions.filter((version) => familyIds.has(version.familyId)) });
        return true;
      }

      if (method === "POST" && route === "/families") {
        const scope = requireDeclarationScope(req, res, "manage");
        if (!scope) return true;
        const body = await readBody(req);
        if (!body?.localeCode || !body?.languageDisplayName || body.organizationId !== scope.organizationId || (body.storeId && body.storeId !== scope.storeId)) {
          sendJson(res, 422, { error: "invalid_family", message: "Family language and matching scope are required" });
          return true;
        }
        const family = { familyId: declarationId("family"), scope: { organizationId: scope.organizationId, ...(body.storeId ? { storeId: body.storeId } : {}) }, localeCode: String(body.localeCode), languageDisplayName: String(body.languageDisplayName), activeVersionId: null, revision: 0 };
        db.declarationFamilies.push(family);
        appendDeclarationAudit(db, scope, "family_created", family.familyId);
        saveDb(dbPath, db);
        sendJson(res, 201, family);
        return true;
      }

      const familyVersionMatch = route.match(/^\/families\/([^/]+)\/versions$/);
      if (method === "POST" && familyVersionMatch) {
        const scope = requireDeclarationScope(req, res, "manage");
        if (!scope) return true;
        const family = scopedFamily(db, decodeURIComponent(familyVersionMatch[1]), scope);
        if (!family) { sendJson(res, 404, { error: "family_not_found" }); return true; }
        const body = await readBody(req);
        if (!body?.source || /<\/?[a-zA-Z][^>]*>/.test(String(body.source))) { sendJson(res, 422, { error: "invalid_source", message: "A plain-text declaration source is required" }); return true; }
        const versionNumber = Math.max(0, ...db.declarationVersions.filter((item) => item.familyId === family.familyId).map((item) => Number(item.version || 0))) + 1;
        const version = { versionId: declarationId("version"), familyId: family.familyId, version: versionNumber, status: "draft", source: String(body.source), variableSchemaVersion: "v1", createdBy: scope.actorId, createdAt: new Date().toISOString() };
        db.declarationVersions.push(version);
        appendDeclarationAudit(db, scope, "version_created", version.versionId, { familyId: family.familyId });
        saveDb(dbPath, db);
        sendJson(res, 201, version);
        return true;
      }

      const versionActionMatch = route.match(/^\/versions\/([^/]+)\/(publish|retire)$/);
      if (method === "POST" && versionActionMatch) {
        const scope = requireDeclarationScope(req, res, "publish");
        if (!scope) return true;
        const version = db.declarationVersions.find((item) => item.versionId === decodeURIComponent(versionActionMatch[1]));
        const family = version ? scopedFamily(db, version.familyId, scope) : null;
        if (!version || !family) { sendJson(res, 404, { error: "version_not_found" }); return true; }
        const body = await readBody(req);
        if (Number(body?.expectedFamilyRevision) !== Number(family.revision || 0)) { sendJson(res, 409, { error: "stale_family", message: "Declaration family changed", revision: family.revision }); return true; }
        const now = new Date().toISOString();
        if (versionActionMatch[2] === "publish") {
          db.declarationVersions.forEach((item) => { if (item.familyId === family.familyId && item.status === "published") { item.status = "retired"; item.retiredAt = now; } });
          version.status = "published"; version.reviewedBy = scope.actorId; version.reviewedAt = now; version.publishedAt = now; version.retiredAt = undefined; family.activeVersionId = version.versionId;
        } else {
          version.status = "retired"; version.retiredAt = now; if (family.activeVersionId === version.versionId) family.activeVersionId = null;
        }
        family.revision = Number(family.revision || 0) + 1;
        appendDeclarationAudit(db, scope, versionActionMatch[2] === "publish" ? "version_published" : "version_retired", version.versionId, { familyId: family.familyId });
        saveDb(dbPath, db);
        sendJson(res, 200, { family, version });
        return true;
      }

      const preferenceMatch = route.match(/^\/preferences\/([^/]+)$/);
      if (method === "GET" && preferenceMatch) {
        const employeeId = decodeURIComponent(preferenceMatch[1]);
        const preference = db.declarationPreferences.find((item) => item.employeeId === employeeId && item.organizationId === viewScope.organizationId && (item.storeId || null) === (viewScope.storeId || null));
        sendJson(res, 200, { preference: preference || null }); return true;
      }
      if (method === "PUT" && preferenceMatch) {
        const scope = requireDeclarationScope(req, res, "manage");
        if (!scope) return true;
        const body = await readBody(req);
        const family = scopedFamily(db, body?.defaultFamilyId, scope);
        const systemDefault = body?.defaultFamilyId === "system-default" && body?.defaultLocaleCode === "en-US";
        if (!systemDefault && !family?.activeVersionId) { sendJson(res, 422, { error: "template_unavailable", message: "An applicable published template is required" }); return true; }
        const preference = { ...body, employeeId: decodeURIComponent(preferenceMatch[1]), updatedBy: scope.actorId, updatedAt: new Date().toISOString(), organizationId: scope.organizationId, storeId: scope.storeId || null };
        db.declarationPreferences = db.declarationPreferences.filter((item) => !(item.employeeId === preference.employeeId && item.organizationId === scope.organizationId && (item.storeId || null) === (scope.storeId || null)));
        db.declarationPreferences.push(preference); appendDeclarationAudit(db, scope, "preference_saved", preference.employeeId); saveDb(dbPath, db); sendJson(res, 200, preference); return true;
      }

      const overrideMatch = route.match(/^\/overrides\/([^/]+)\/([^/]+)$/);
      if (method === "PUT" && overrideMatch) {
        const scope = requireDeclarationScope(req, res, "manage");
        if (!scope) return true;
        const body = await readBody(req);
        const family = scopedFamily(db, body?.familyId, scope);
        if (!family?.activeVersionId) { sendJson(res, 422, { error: "template_unavailable", message: "An applicable published template is required" }); return true; }
        const override = { ...body, periodId: decodeURIComponent(overrideMatch[1]), employeeId: decodeURIComponent(overrideMatch[2]), organizationId: scope.organizationId, storeId: scope.storeId || null };
        db.declarationOverrides = db.declarationOverrides.filter((item) => !(item.periodId === override.periodId && item.employeeId === override.employeeId));
        db.declarationOverrides.push(override); appendDeclarationAudit(db, scope, "override_saved", `${override.periodId}:${override.employeeId}`); saveDb(dbPath, db); sendJson(res, 200, override); return true;
      }

      if (method === "POST" && route === "/confirm") {
        const scope = requireDeclarationScope(req, res, "manage");
        if (!scope) return true;
        const body = await readBody(req);
        const primary = db.declarationVersions.find((item) => item.versionId === body?.primaryVersionId && item.status === "published");
        const family = primary ? scopedFamily(db, primary.familyId, scope) : null;
        if (!primary || !family || family.activeVersionId !== primary.versionId) { sendJson(res, 409, { error: "stale_version", message: "Declaration version changed" }); return true; }
        const confirmedAt = new Date().toISOString();
        const variables = { ...(body.variables || {}), confirmation_date: confirmedAt.slice(0, 10) };
        const renderedText = String(primary.source).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_token, key) => variables[key] == null ? "" : String(variables[key]));
        if (/\{\{/.test(renderedText) || !body?.employeeId || !body?.periodId) { sendJson(res, 422, { error: "missing_variables", message: "Declaration variables and employee period are required" }); return true; }
        const canonical = canonicalJson({ localeCode: family.localeCode, printMode: body.printMode || "employee-only", source: primary.source, variables, renderedText, primaryVersionId: primary.versionId, englishVersionId: body.englishVersionId || null });
        const snapshot = { snapshotId: declarationId("snapshot"), employeeId: String(body.employeeId), periodId: String(body.periodId), primaryVersionId: primary.versionId, englishVersionId: body.englishVersionId || null, localeCode: family.localeCode, printMode: body.printMode || "employee-only", source: primary.source, englishSource: body.englishSource || null, variables, renderedText, renderedEnglishText: body.renderedEnglishText || null, confirmedAt, lockedAt: null, hashAlgorithm: "SHA-256(canonical-json-v1)", contentHash: crypto.createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex"), organizationId: scope.organizationId, storeId: scope.storeId || null };
        db.declarationSnapshots = db.declarationSnapshots.filter((item) => !(item.employeeId === snapshot.employeeId && item.periodId === snapshot.periodId && item.organizationId === scope.organizationId));
        db.declarationSnapshots.push(snapshot); appendDeclarationAudit(db, scope, "declaration_confirmed", snapshot.snapshotId); saveDb(dbPath, db); sendJson(res, 201, snapshot); return true;
      }

      const snapshotMatch = route.match(/^\/snapshots\/([^/]+)\/([^/]+)$/);
      if (method === "GET" && snapshotMatch) {
        const periodId = decodeURIComponent(snapshotMatch[1]); const employeeId = decodeURIComponent(snapshotMatch[2]);
        const snapshot = db.declarationSnapshots.find((item) => item.periodId === periodId && item.employeeId === employeeId && item.organizationId === viewScope.organizationId && (!item.storeId || item.storeId === viewScope.storeId));
        sendJson(res, 200, { snapshot: snapshot || null }); return true;
      }

      sendJson(res, 404, { error: "declaration_not_found", path: route });
      return true;
    }

    if (method === "GET" && sub === "/state") {
      const db = loadDb(dbPath);
      if (!db.snapshot) {
        sendJson(res, 404, { error: "no_snapshot", message: "Payroll state not initialized" });
        return true;
      }
      sendJson(res, 200, { ...db.snapshot, revision: Number(db.revision || 0) });
      return true;
    }

    if (method === "PUT" && sub === "/state") {
      const body = await readBody(req);
      if (!body || typeof body !== "object") {
        sendJson(res, 400, { error: "invalid_body" });
        return true;
      }
      const db = loadDb(dbPath);
      const revision = Number(db.revision || 0);
      const expected = req.headers['if-match'];
      if (expected === undefined && revision > 0) {
        sendJson(res, 428, { error: 'revision_required', revision });
        return true;
      }
      if (expected !== undefined && (!/^\d+$/.test(String(expected)) || Number(expected) !== revision)) {
        sendJson(res, 409, { error: 'stale_revision', revision });
        return true;
      }
      // No await between reading the revision and the atomic rename: requests in
      // this single-process local mock cannot interleave this critical section.
      db.revision = revision + 1;
      body.revision = db.revision;
      db.snapshot = body;
      saveDb(dbPath, db);
      sendJson(res, 200, { ok: true, updatedAt: db.updatedAt, revision: db.revision });
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
