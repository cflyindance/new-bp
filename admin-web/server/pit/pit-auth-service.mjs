import crypto, {
  createHash,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { withImmediateTransaction } from "./pit-database.mjs";
import {
  authenticationRequired,
  notFound,
  permissionDenied,
  serviceUnavailable,
  tooManyRequests,
  validationFailed,
  versionConflict,
} from "./pit-errors.mjs";

const scrypt = promisify(scryptCallback);
const IDLE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const PASSWORD_PREFIX = "scrypt";
const VALID_ROLES = new Set(["admin", "editor", "viewer"]);
const DUMMY_PASSWORD_HASH = `${PASSWORD_PREFIX}$${"0".repeat(32)}$${"0".repeat(128)}`;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

function publicUser(row) {
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

function asHex(randomBytes, size) {
  const bytes = randomBytes(size);
  return Buffer.from(bytes).toString("hex");
}

function csrfForSession(sessionToken) {
  return sha256(`pit-csrf:${sessionToken}`);
}

function constantTimeTokenMatch(actual, expected) {
  const actualHash = createHash("sha256").update(String(actual || "")).digest();
  const expectedHash = createHash("sha256").update(String(expected || "")).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function validateUserInput(input, { passwordRequired = false } = {}) {
  const fields = {};
  const username = normalizeUsername(input?.username);
  const displayName = typeof input?.displayName === "string" ? input.displayName.trim() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const role = input?.role || "viewer";

  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) fields.username = "用户名须为 3-64 位字母、数字或 ._-";
  if (!displayName || displayName.length > 100) fields.displayName = "显示名称须为 1-100 个字符";
  if (passwordRequired && (password.length < 8 || password.length > 256)) fields.password = "密码须为 8-256 个字符";
  if (!VALID_ROLES.has(role)) fields.role = "角色不合法";
  if (input?.active !== undefined && typeof input.active !== "boolean") fields.active = "启用状态必须是布尔值";
  if (Object.keys(fields).length > 0) throw validationFailed(undefined, { fields });

  return { username, displayName, password, role };
}

async function hashPassword(password, randomBytes) {
  const salt = asHex(randomBytes, 16);
  const derived = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return `${PASSWORD_PREFIX}$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  const [prefix, salt, expectedHex, ...extra] = String(encoded || "").split("$");
  if (
    prefix !== PASSWORD_PREFIX
    || !/^[a-f0-9]{32}$/.test(salt || "")
    || !/^[a-f0-9]{128}$/.test(expectedHex || "")
    || extra.length > 0
  ) {
    return false;
  }
  const actual = Buffer.from(await scrypt(password, Buffer.from(salt, "hex"), 64));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createPitAuthService({
  db,
  setupToken,
  clock = () => new Date(),
  randomBytes = crypto.randomBytes,
}) {
  const loginAttempts = new Map();
  let setupTokenConsumed = false;

  function currentDate() {
    const value = clock();
    const date = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
    return date;
  }

  function setupStatus() {
    const count = db.prepare("SELECT count(*) AS count FROM users").get().count;
    return { needsBootstrap: count === 0 };
  }

  async function bootstrap(input) {
    if (!setupStatus().needsBootstrap || setupTokenConsumed) {
      throw versionConflict("系统已经完成初始化");
    }
    if (!setupToken) throw serviceUnavailable("初始化 token 未配置");
    if (!constantTimeTokenMatch(input?.token, setupToken)) throw permissionDenied("初始化 token 无效");

    const values = validateUserInput({ ...input, role: "admin" }, { passwordRequired: true });
    const passwordHash = await hashPassword(values.password, randomBytes);
    const now = currentDate().toISOString();
    const row = {
      id: randomUUID(),
      username: values.username,
      display_name: values.displayName,
      password_hash: passwordHash,
      role: "admin",
      active: 1,
      created_at: now,
      updated_at: now,
    };

    withImmediateTransaction(db, () => {
      if (db.prepare("SELECT count(*) AS count FROM users").get().count !== 0) {
        throw versionConflict("系统已经完成初始化");
      }
      db.prepare(`
        INSERT INTO users (
          id, username, display_name, password_hash, role, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    });
    setupTokenConsumed = true;
    return publicUser(row);
  }

  function attemptKey(username, sourceIp) {
    return `${normalizeUsername(username)}\u0000${String(sourceIp || "unknown")}`;
  }

  function activeAttemptWindow(key, nowMs) {
    const attempt = loginAttempts.get(key);
    if (attempt && nowMs - attempt.startedAt < LOGIN_WINDOW_MS) return attempt;
    if (attempt) loginAttempts.delete(key);
    return null;
  }

  function removeExpiredAttemptWindows(nowMs) {
    for (const [key, attempt] of loginAttempts) {
      if (nowMs - attempt.startedAt >= LOGIN_WINDOW_MS) loginAttempts.delete(key);
    }
  }

  async function login({ username, password, sourceIp }) {
    const normalized = normalizeUsername(username);
    const key = attemptKey(normalized, sourceIp);
    const now = currentDate();
    const nowMs = now.getTime();
    removeExpiredAttemptWindows(nowMs);
    const attempt = activeAttemptWindow(key, nowMs);
    if (attempt?.failures >= MAX_FAILED_LOGINS) throw tooManyRequests();

    const user = normalized
      ? db.prepare("SELECT * FROM users WHERE lower(username) = ?").get(normalized)
      : null;
    const passwordMatches = await verifyPassword(
      typeof password === "string" ? password : "",
      user?.password_hash || DUMMY_PASSWORD_HASH,
    );
    const validPassword = Boolean(user?.active && passwordMatches);

    if (!validPassword) {
      const current = activeAttemptWindow(key, nowMs);
      if (current) current.failures += 1;
      else loginAttempts.set(key, { failures: 1, startedAt: nowMs });
      throw authenticationRequired("用户名或密码错误");
    }

    loginAttempts.delete(key);
    const sessionToken = asHex(randomBytes, 32);
    const csrfToken = csrfForSession(sessionToken);
    const createdAt = now.toISOString();
    const absoluteExpiresAt = new Date(nowMs + ABSOLUTE_TIMEOUT_MS);
    const expiresAt = new Date(Math.min(nowMs + IDLE_TIMEOUT_MS, absoluteExpiresAt.getTime()));
    db.prepare(`
      INSERT INTO sessions (
        id_hash, user_id, csrf_hash, expires_at, absolute_expires_at, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      sha256(sessionToken),
      user.id,
      sha256(csrfToken),
      expiresAt.toISOString(),
      absoluteExpiresAt.toISOString(),
      createdAt,
      createdAt,
    );

    return {
      sessionToken,
      maxAgeSeconds: Math.floor(ABSOLUTE_TIMEOUT_MS / 1000),
      user: publicUser(user),
    };
  }

  function logout(sessionToken) {
    if (sessionToken) db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(sha256(sessionToken));
  }

  function authenticate(sessionToken) {
    if (!sessionToken) throw authenticationRequired();
    const idHash = sha256(sessionToken);
    const row = db.prepare(`
      SELECT
        sessions.id_hash, sessions.user_id, sessions.csrf_hash, sessions.expires_at,
        sessions.absolute_expires_at, sessions.created_at, sessions.last_seen_at,
        users.id, users.username, users.display_name, users.role, users.active,
        users.created_at AS user_created_at, users.updated_at AS user_updated_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.id_hash = ?
    `).get(idHash);
    if (!row) throw authenticationRequired();

    const now = currentDate();
    if (!row.active || now.getTime() >= Date.parse(row.expires_at) || now.getTime() >= Date.parse(row.absolute_expires_at)) {
      db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(idHash);
      throw authenticationRequired("会话已失效");
    }

    const nextIdleExpiry = new Date(
      Math.min(now.getTime() + IDLE_TIMEOUT_MS, Date.parse(row.absolute_expires_at)),
    ).toISOString();
    db.prepare("UPDATE sessions SET expires_at = ?, last_seen_at = ? WHERE id_hash = ?").run(
      nextIdleExpiry,
      now.toISOString(),
      idHash,
    );

    return {
      sessionToken,
      sessionIdHash: idHash,
      csrfHash: row.csrf_hash,
      csrfToken: csrfForSession(sessionToken),
      user: publicUser({
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        role: row.role,
        active: row.active,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      }),
    };
  }

  function assertCsrf(authentication, token) {
    const submittedHash = sha256(typeof token === "string" ? token : "");
    if (!constantTimeTokenMatch(submittedHash, authentication.csrfHash)) {
      throw permissionDenied("CSRF token 无效");
    }
  }

  function requireRole(authentication, ...roles) {
    const accepted = roles.flat();
    if (!accepted.includes(authentication?.user?.role)) throw permissionDenied();
    return authentication;
  }

  async function createUser(input) {
    const values = validateUserInput(input, { passwordRequired: true });
    const passwordHash = await hashPassword(values.password, randomBytes);
    const now = currentDate().toISOString();
    const row = {
      id: randomUUID(),
      username: values.username,
      display_name: values.displayName,
      password_hash: passwordHash,
      role: values.role,
      active: input?.active === false ? 0 : 1,
      created_at: now,
      updated_at: now,
    };
    try {
      db.prepare(`
        INSERT INTO users (
          id, username, display_name, password_hash, role, active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    } catch (error) {
      if (String(error?.code || "").startsWith("ERR_SQLITE_CONSTRAINT")) {
        throw versionConflict("用户名已存在");
      }
      throw error;
    }
    return publicUser(row);
  }

  function updateUser(userId, input) {
    const current = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!current) throw notFound("用户不存在");
    const username = input?.username === undefined ? current.username : normalizeUsername(input.username);
    const displayName = input?.displayName === undefined ? current.display_name : String(input.displayName).trim();
    const role = input?.role === undefined ? current.role : input.role;
    validateUserInput({ username, displayName, role, active: input?.active });
    const active = input?.active === undefined ? current.active : input.active ? 1 : 0;
    const updatedAt = currentDate().toISOString();
    withImmediateTransaction(db, () => {
      try {
        db.prepare(`
          UPDATE users SET username = ?, display_name = ?, role = ?, active = ?, updated_at = ?
          WHERE id = ?
        `).run(username, displayName, role, active, updatedAt, userId);
      } catch (error) {
        if (String(error?.code || "").startsWith("ERR_SQLITE_CONSTRAINT")) {
          throw versionConflict("用户名已存在");
        }
        throw error;
      }
      if (!active) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    });
    return publicUser({ ...current, username, display_name: displayName, role, active, updated_at: updatedAt });
  }

  async function resetPassword(userId, password) {
    if (typeof password !== "string" || password.length < 8 || password.length > 256) {
      throw validationFailed(undefined, { fields: { password: "密码须为 8-256 个字符" } });
    }
    const passwordHash = await hashPassword(password, randomBytes);
    const updatedAt = currentDate().toISOString();
    withImmediateTransaction(db, () => {
      const result = db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
        passwordHash,
        updatedAt,
        userId,
      );
      if (result.changes === 0) throw notFound("用户不存在");
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    });
  }

  function revokeAllSessions(userId) {
    return db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId).changes;
  }

  return {
    setupStatus,
    bootstrap,
    login,
    logout,
    authenticate,
    assertCsrf,
    requireRole,
    createUser,
    updateUser,
    resetPassword,
    revokeAllSessions,
  };
}
