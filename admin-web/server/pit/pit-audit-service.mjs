import { randomUUID } from "node:crypto";
import { validationFailed } from "./pit-errors.mjs";

const SENSITIVE_KEY = /(?:password|passphrase|secret|token|csrf|cookie|authorization|session)/i;

function redact(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEY.test(key)) continue;
    result[key] = redact(item, seen);
  }
  return result;
}

function stringify(value) {
  return value === undefined || value === null ? null : JSON.stringify(redact(value));
}

function positiveInteger(value, fallback, maximum = 100) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw validationFailed("分页参数不合法");
  }
  return parsed;
}

export function recordAuditEvent(db, event) {
  const row = {
    id: event?.id || randomUUID(),
    actorUserId: event?.actorUserId || null,
    action: String(event?.action || "").trim(),
    resourceType: String(event?.resourceType || "").trim(),
    resourceId: event?.resourceId == null ? null : String(event.resourceId),
    beforeJson: stringify(event?.before),
    afterJson: stringify(event?.after),
    metadataJson: stringify(event?.metadata),
    createdAt: event?.createdAt || new Date().toISOString(),
  };
  if (!row.action || !row.resourceType) throw new TypeError("audit action and resourceType are required");
  db.prepare(`
    INSERT INTO audit_events (
      id, actor_user_id, action, resource_type, resource_id,
      before_json, after_json, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    row.actorUserId,
    row.action,
    row.resourceType,
    row.resourceId,
    row.beforeJson,
    row.afterJson,
    row.metadataJson,
    row.createdAt,
  );
  return row;
}

export function listAuditEvents(db, query = {}) {
  const where = [];
  const params = [];
  const equals = [
    ["actorUserId", "audit_events.actor_user_id"],
    ["action", "audit_events.action"],
    ["resourceType", "audit_events.resource_type"],
    ["resourceId", "audit_events.resource_id"],
  ];
  for (const [property, column] of equals) {
    if (query[property] === undefined || query[property] === "") continue;
    where.push(`${column} = ?`);
    params.push(String(query[property]));
  }
  if (query.from) {
    where.push("audit_events.created_at >= ?");
    params.push(String(query.from));
  }
  if (query.to) {
    where.push("audit_events.created_at <= ?");
    params.push(String(query.to));
  }
  const page = positiveInteger(query.page, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = positiveInteger(query.pageSize, 20);
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = db.prepare(`SELECT count(*) AS count FROM audit_events ${clause}`).get(...params).count;
  const rows = db.prepare(`
    SELECT audit_events.*, users.username, users.display_name
    FROM audit_events
    LEFT JOIN users ON users.id = audit_events.actor_user_id
    ${clause}
    ORDER BY audit_events.created_at DESC, audit_events.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, (page - 1) * pageSize);
  return {
    items: rows.map((row) => ({
      id: row.id,
      actor: row.actor_user_id ? {
        id: row.actor_user_id,
        username: row.username,
        displayName: row.display_name,
      } : null,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      before: row.before_json ? JSON.parse(row.before_json) : null,
      after: row.after_json ? JSON.parse(row.after_json) : null,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
      createdAt: row.created_at,
    })),
    page,
    pageSize,
    total,
  };
}
