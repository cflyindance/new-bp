import fs from "node:fs";
import path from "node:path";
import {
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
} from "node:crypto";
import { promisify } from "node:util";
import { listAuditEvents, recordAuditEvent } from "./pit-audit-service.mjs";
import { verifyPitBackup } from "./pit-backup-service.mjs";
import { withImmediateTransaction } from "./pit-database.mjs";
import {
  notFound,
  permissionDenied,
  validationFailed,
  versionConflict,
} from "./pit-errors.mjs";
import { parseRequirementListQuery } from "./pit-requirement-service.mjs";

const DICTIONARY_TYPES = new Set([
  "product_line",
  "requirement_source",
  "requirement_type",
  "problem_category",
  "industry",
]);
const VALID_ROLES = new Set(["admin", "editor", "viewer"]);
const scrypt = promisify(scryptCallback);

function fieldsError(fields) {
  throw validationFailed(undefined, { fields });
}

function dateFromClock(clock) {
  const value = clock();
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
  return date;
}

function dictionaryItem(row) {
  return {
    id: row.id,
    type: row.type,
    code: row.code,
    label: row.label,
    sortOrder: row.sort_order,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function userItem(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateUserValues({ username, displayName, password, role, active }, { passwordRequired = false } = {}) {
  const fields = {};
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) fields.username = "用户名须为 3-64 位字母、数字或 ._-";
  if (!displayName || displayName.length > 100) fields.displayName = "显示名称须为 1-100 个字符";
  if (passwordRequired && (typeof password !== "string" || password.length < 8 || password.length > 256)) {
    fields.password = "密码须为 8-256 个字符";
  }
  if (!VALID_ROLES.has(role)) fields.role = "角色不合法";
  if (active !== undefined && typeof active !== "boolean") fields.active = "启用状态必须是布尔值";
  if (Object.keys(fields).length > 0) fieldsError(fields);
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${Buffer.from(derived).toString("hex")}`;
}

function isUsernameConflict(error) {
  return error?.code === "ERR_SQLITE_CONSTRAINT_UNIQUE"
    || /UNIQUE constraint failed:\s*users\.username/i.test(String(error?.message || ""));
}

function normalizeDictionaryType(value) {
  const type = typeof value === "string" ? value.trim() : "";
  if (!DICTIONARY_TYPES.has(type)) fieldsError({ type: "字典类型不合法" });
  return type;
}

function normalizeCode(value) {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(code)) {
    fieldsError({ code: "字典 code 须为 1-64 位小写字母、数字、下划线或连字符" });
  }
  return code;
}

function normalizeLabel(value) {
  const label = typeof value === "string" ? value.trim() : "";
  if (!label || label.length > 100) fieldsError({ label: "字典名称须为 1-100 个字符" });
  return label;
}

function normalizeSortOrder(value, field = "sortOrder") {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
    fieldsError({ [field]: "排序值须为 0-1000000 的整数" });
  }
  return parsed;
}

function assertAdmin(actor) {
  if (actor?.role !== "admin") throw permissionDenied();
}

function normalizeBooleanQuery(value, field) {
  if (value === undefined || value === null || value === "") return false;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  fieldsError({ [field]: `${field} 不合法` });
}

function normalizeAuditQuery(query) {
  return {
    actorUserId: query.actorUserId ?? query.actor,
    resourceType: query.resourceType ?? query.objectType,
    resourceId: query.resourceId ?? query.objectId,
    action: query.action,
    from: query.from ?? query.dateFrom,
    to: query.to ?? query.dateTo,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export function createPitAdminService({
  db,
  config = {},
  clock = () => new Date(),
}) {
  function now() {
    return dateFromClock(clock).toISOString();
  }

  function dashboardSummary(actor) {
    const compiled = parseRequirementListQuery({}, actor);
    const current = dateFromClock(clock);
    const currentYearMonth = current.getUTCFullYear() * 100 + current.getUTCMonth() + 1;
    const row = db.prepare(`
      SELECT
        count(*) AS total,
        count(*) FILTER (WHERE requirements.status = 'review_pending') AS review,
        count(*) FILTER (WHERE requirements.status = 'design_pending') AS design_pending,
        count(*) FILTER (WHERE requirements.status = 'scheduling_pending') AS scheduling_pending,
        count(*) FILTER (WHERE requirements.status = 'development') AS development,
        count(*) FILTER (WHERE requirements.status = 'testing') AS testing,
        count(*) FILTER (WHERE requirements.status = 'completed') AS completed,
        count(*) FILTER (WHERE requirements.status = 'paused') AS paused,
        count(*) FILTER (WHERE requirements.status = 'rejected') AS rejected,
        count(*) FILTER (WHERE requirements.is_highlighted = 1) AS highlighted,
        count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM requirement_assignees mine
          WHERE mine.requirement_id = requirements.id AND mine.user_id = ?
        )) AS mine,
        count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM requirement_followers followed
          WHERE followed.requirement_id = requirements.id AND followed.user_id = ?
        )) AS followed,
        count(*) FILTER (
          WHERE requirements.status NOT IN ('completed', 'rejected')
          AND requirements.planned_year IS NOT NULL
          AND requirements.planned_month IS NOT NULL
          AND requirements.planned_year * 100 + requirements.planned_month < ?
        ) AS overdue
      FROM requirements
      WHERE ${compiled.where}
    `).get(actor.id, actor.id, currentYearMonth, ...compiled.params);
    return {
      total: row.total,
      review: row.review,
      schedulingPending: row.scheduling_pending,
      development: row.development,
      testing: row.testing,
      completed: row.completed,
      highlighted: row.highlighted,
      mine: row.mine,
      followed: row.followed,
      overdue: row.overdue,
      byStatus: {
        review_pending: row.review,
        design_pending: row.design_pending,
        scheduling_pending: row.scheduling_pending,
        development: row.development,
        testing: row.testing,
        completed: row.completed,
        paused: row.paused,
        rejected: row.rejected,
      },
    };
  }

  function listDictionaries(query = {}, actor) {
    const includeInactive = normalizeBooleanQuery(query.includeInactive, "includeInactive");
    if (includeInactive) assertAdmin(actor);
    const allowedTypes = [...DICTIONARY_TYPES];
    const where = [`type IN (${allowedTypes.map(() => "?").join(", ")})`];
    const params = [...allowedTypes];
    if (!includeInactive) where.push("active = 1");
    if (query.type !== undefined && query.type !== "") {
      where.push("type = ?");
      params.push(normalizeDictionaryType(query.type));
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    return {
      items: db.prepare(`
        SELECT * FROM dictionaries ${clause}
        ORDER BY type ASC, sort_order ASC, id ASC
      `).all(...params).map(dictionaryItem),
    };
  }

  function createDictionaryItem(input, actor) {
    assertAdmin(actor);
    const type = normalizeDictionaryType(input?.type);
    const code = normalizeCode(input?.code);
    const label = normalizeLabel(input?.label);
    if (input?.active !== undefined && typeof input.active !== "boolean") {
      fieldsError({ active: "启用状态必须是布尔值" });
    }
    const sortOrder = input?.sortOrder === undefined
      ? (db.prepare("SELECT max(sort_order) AS value FROM dictionaries WHERE type = ?").get(type).value ?? 0) + 10
      : normalizeSortOrder(input.sortOrder);
    const timestamp = now();
    const row = {
      id: randomUUID(),
      type,
      code,
      label,
      sort_order: sortOrder,
      active: input?.active === false ? 0 : 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
    return withImmediateTransaction(db, () => {
      try {
        db.prepare(`
          INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(row.id, row.type, row.code, row.label, row.sort_order, row.active, row.created_at, row.updated_at);
      } catch (error) {
        if (String(error?.code || "").startsWith("ERR_SQLITE_CONSTRAINT")) {
          throw versionConflict("同类型字典 code 已存在");
        }
        throw error;
      }
      const item = dictionaryItem(row);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "dictionary.create",
        resourceType: "dictionary",
        resourceId: row.id,
        after: item,
        createdAt: timestamp,
      });
      return item;
    });
  }

  function updateDictionaryItem(id, input, actor) {
    assertAdmin(actor);
    const current = db.prepare("SELECT * FROM dictionaries WHERE id = ?").get(id);
    if (!current) throw notFound("字典项不存在");
    if (Object.hasOwn(input || {}, "code") || Object.hasOwn(input || {}, "type")) {
      fieldsError({ code: "字典 code 和类型创建后不可修改" });
    }
    const label = input?.label === undefined ? current.label : normalizeLabel(input.label);
    const sortOrder = input?.sortOrder === undefined ? current.sort_order : normalizeSortOrder(input.sortOrder);
    if (input?.active !== undefined && typeof input.active !== "boolean") {
      fieldsError({ active: "启用状态必须是布尔值" });
    }
    const active = input?.active === undefined ? current.active : input.active ? 1 : 0;
    const timestamp = now();
    return withImmediateTransaction(db, () => {
      db.prepare(`
        UPDATE dictionaries SET label = ?, sort_order = ?, active = ?, updated_at = ? WHERE id = ?
      `).run(label, sortOrder, active, timestamp, id);
      const item = dictionaryItem({
        ...current,
        label,
        sort_order: sortOrder,
        active,
        updated_at: timestamp,
      });
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "dictionary.update",
        resourceType: "dictionary",
        resourceId: id,
        before: dictionaryItem(current),
        after: item,
        createdAt: timestamp,
      });
      return item;
    });
  }

  function reorderDictionaryItems(input, actor) {
    assertAdmin(actor);
    const type = normalizeDictionaryType(input?.type);
    let orders;
    if (Array.isArray(input?.items)) {
      orders = input.items.map((item, index) => ({
        id: typeof item?.id === "string" ? item.id : "",
        sortOrder: item?.sortOrder === undefined ? index * 10 : normalizeSortOrder(item.sortOrder, `items.${index}.sortOrder`),
      }));
    } else {
      const itemIds = input?.itemIds ?? input?.ids;
      if (!Array.isArray(itemIds)) fieldsError({ itemIds: "itemIds 必须是数组" });
      orders = itemIds.map((id, index) => ({ id: typeof id === "string" ? id : "", sortOrder: index * 10 }));
    }
    if (orders.length === 0 || orders.some((item) => !item.id) || new Set(orders.map((item) => item.id)).size !== orders.length) {
      fieldsError({ itemIds: "排序项不能为空、重复或使用无效 ID" });
    }
    const rows = db.prepare("SELECT * FROM dictionaries WHERE type = ?").all(type);
    const submittedIds = new Set(orders.map((item) => item.id));
    if (rows.length !== orders.length || rows.some((row) => !submittedIds.has(row.id))) {
      fieldsError({ itemIds: "排序必须提交该字典类型的完整 ID 列表" });
    }
    const beforeById = new Map(rows.map((row) => [row.id, dictionaryItem(row)]));
    const timestamp = now();
    return withImmediateTransaction(db, () => {
      const update = db.prepare("UPDATE dictionaries SET sort_order = ?, updated_at = ? WHERE id = ? AND type = ?");
      for (const item of orders) update.run(item.sortOrder, timestamp, item.id, type);
      const items = db.prepare("SELECT * FROM dictionaries WHERE type = ? ORDER BY sort_order ASC, id ASC")
        .all(type)
        .map(dictionaryItem);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "dictionary.reorder",
        resourceType: "dictionary",
        resourceId: type,
        before: orders.map((item) => beforeById.get(item.id)),
        after: items,
        createdAt: timestamp,
      });
      return items;
    });
  }

  function listUsers() {
    return {
      items: db.prepare("SELECT * FROM users ORDER BY created_at ASC, id ASC").all().map(userItem),
    };
  }

  async function createUser(input, actor) {
    assertAdmin(actor);
    const username = normalizeUsername(input?.username);
    const displayName = typeof input?.displayName === "string" ? input.displayName.trim() : "";
    const password = input?.password;
    const role = input?.role || "viewer";
    validateUserValues({ username, displayName, password, role, active: input?.active }, { passwordRequired: true });
    const passwordHash = await hashPassword(password);
    const timestamp = now();
    const row = {
      id: randomUUID(),
      username,
      display_name: displayName,
      password_hash: passwordHash,
      role,
      active: input?.active === false ? 0 : 1,
      created_at: timestamp,
      updated_at: timestamp,
    };
    try {
      return withImmediateTransaction(db, () => {
        db.prepare(`
          INSERT INTO users (id, username, display_name, password_hash, role, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          row.id,
          row.username,
          row.display_name,
          row.password_hash,
          row.role,
          row.active,
          row.created_at,
          row.updated_at,
        );
        const user = userItem(row);
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "user.create",
          resourceType: "user",
          resourceId: user.id,
          after: user,
          createdAt: timestamp,
        });
        return user;
      });
    } catch (error) {
      if (isUsernameConflict(error)) throw versionConflict("用户名已存在");
      throw error;
    }
  }

  function updateUser(id, input, actor) {
    assertAdmin(actor);
    try {
      return withImmediateTransaction(db, () => {
        const current = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!current) throw notFound("用户不存在");
        const username = input?.username === undefined ? current.username : normalizeUsername(input.username);
        const displayName = input?.displayName === undefined ? current.display_name : String(input.displayName).trim();
        const role = input?.role === undefined ? current.role : input.role;
        validateUserValues({ username, displayName, role, active: input?.active });
        const active = input?.active === undefined ? current.active : input.active ? 1 : 0;
        const timestamp = now();
        db.prepare(`
          UPDATE users SET username = ?, display_name = ?, role = ?, active = ?, updated_at = ? WHERE id = ?
        `).run(username, displayName, role, active, timestamp, id);
        if (!active) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
        const after = userItem({
          ...current,
          username,
          display_name: displayName,
          role,
          active,
          updated_at: timestamp,
        });
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "user.update",
          resourceType: "user",
          resourceId: id,
          before: userItem(current),
          after,
          createdAt: timestamp,
        });
        return after;
      });
    } catch (error) {
      if (isUsernameConflict(error)) throw versionConflict("用户名已存在");
      throw error;
    }
  }

  async function resetUserPassword(id, input, actor) {
    assertAdmin(actor);
    const password = input?.password;
    validateUserValues({
      username: "valid-user",
      displayName: "valid",
      password,
      role: "viewer",
    }, { passwordRequired: true });
    if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(id)) throw notFound("用户不存在");
    const passwordHash = await hashPassword(password);
    const timestamp = now();
    return withImmediateTransaction(db, () => {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!user) throw notFound("用户不存在");
      const sessionCount = db.prepare("SELECT count(*) AS count FROM sessions WHERE user_id = ?").get(id).count;
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
        .run(passwordHash, timestamp, id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "user.reset_password",
        resourceType: "user",
        resourceId: id,
        metadata: { revokedSessions: sessionCount },
        createdAt: timestamp,
      });
      return { reset: true, revokedSessions: sessionCount };
    });
  }

  function revokeUserSessions(id, actor) {
    assertAdmin(actor);
    return withImmediateTransaction(db, () => {
      if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(id)) throw notFound("用户不存在");
      const revokedSessions = db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id).changes;
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "user.revoke_sessions",
        resourceType: "user",
        resourceId: id,
        metadata: { revokedSessions },
        createdAt: now(),
      });
      return { revokedSessions };
    });
  }

  function listAuditLog(query, actor) {
    assertAdmin(actor);
    return listAuditEvents(db, normalizeAuditQuery(query || {}));
  }

  async function health() {
    let database;
    try {
      const integrity = db.prepare("PRAGMA quick_check").get()?.quick_check;
      const schemaVersion = db.prepare("SELECT max(version) AS version FROM schema_migrations").get().version || 0;
      database = {
        status: integrity === "ok" ? "ok" : "error",
        integrity: integrity === "ok" ? "ok" : "failed",
        schemaVersion,
      };
    } catch {
      database = { status: "error", integrity: "unavailable", schemaVersion: null };
    }

    let backup = { status: "missing", lastCreatedAt: null };
    try {
      const latest = db.prepare(`
        SELECT file_name, manifest_name, sha256, created_at, schema_version, byte_size
        FROM backup_records ORDER BY created_at DESC, id DESC LIMIT 1
      `).get();
      if (latest) {
        const directory = path.resolve(config.backupsDir || path.join(config.dataDir || ".data/pit", "backups"));
        const safePath = (fileName) => {
          if (typeof fileName !== "string" || path.basename(fileName) !== fileName) return null;
          const candidate = path.resolve(directory, fileName);
          const relative = path.relative(directory, candidate);
          return relative.startsWith("..") || path.isAbsolute(relative) ? null : candidate;
        };
        const filePath = safePath(latest.file_name);
        const manifestPath = safePath(latest.manifest_name);
        let status = "ok";
        if (!filePath || !manifestPath) status = "invalid_path";
        else if (path.resolve(filePath.replace(/\.sqlite3$/i, ".manifest.json")) !== manifestPath) status = "invalid_path";
        else if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) status = "missing_file";
        else if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) status = "missing_manifest";
        else {
          try {
            const realDirectory = fs.realpathSync(directory);
            const isInsideDirectory = (candidate) => {
              const relative = path.relative(realDirectory, fs.realpathSync(candidate));
              return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
            };
            if (!isInsideDirectory(filePath) || !isInsideDirectory(manifestPath)) {
              status = "invalid_path";
              throw new Error("PIT backup path escapes the backup directory");
            }
            const verified = await verifyPitBackup(filePath, latest.schema_version);
            if (
              verified.size !== Number(latest.byte_size)
              || verified.schemaVersion !== Number(latest.schema_version)
              || verified.sha256 !== latest.sha256
            ) throw new Error("PIT backup catalog does not match the verified file");
          } catch {
            if (status === "ok") status = "verification_failed";
          }
        }
        backup = {
          status,
          lastCreatedAt: latest.created_at,
          schemaVersion: latest.schema_version,
          byteSize: latest.byte_size,
        };
      }
    } catch {
      backup = { status: "unavailable", lastCreatedAt: null };
    }

    return {
      status: database.status === "ok" && new Set(["ok", "missing"]).has(backup.status) ? "ok" : "degraded",
      process: {
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        runtime: process.release.name,
        runtimeVersion: process.version,
      },
      database,
      backup,
    };
  }

  return {
    dashboardSummary,
    listDictionaries,
    createDictionaryItem,
    updateDictionaryItem,
    reorderDictionaryItems,
    listUsers,
    createUser,
    updateUser,
    resetUserPassword,
    revokeUserSessions,
    listAuditLog,
    health,
  };
}
