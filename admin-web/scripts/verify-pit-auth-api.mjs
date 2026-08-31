import assert from "node:assert/strict";
import { scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { startPitTestServer } from "./lib/pit-test-server.mjs";
import { createPitAuthService } from "../server/pit/pit-auth-service.mjs";

const scrypt = promisify(scryptCallback);

const mutableClock = {
  now: new Date("2026-08-31T00:00:00.000Z"),
  read() {
    return new Date(this.now);
  },
  advance(milliseconds) {
    this.now = new Date(this.now.getTime() + milliseconds);
  },
};

const server = await startPitTestServer({
  setupToken: "setup-token-for-tests",
  clock: () => mutableClock.read(),
});

try {
  const { client, db } = server;
  assert.equal(typeof client.rawWorkbook, "function");

  const health = await client.get("/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.data.status, "ok");
  assert.equal(typeof health.body.meta.requestId, "string");

  const setup = await client.get("/setup/status");
  assert.equal(setup.status, 200);
  assert.deepEqual(setup.body.data, { needsBootstrap: true });

  const missingOrigin = await client.post(
    "/setup/bootstrap",
    {
      token: "setup-token-for-tests",
      username: "admin",
      displayName: "PIT Admin",
      password: "PIT-admin-2026",
    },
    { origin: false },
  );
  assert.equal(missingOrigin.status, 403);
  assert.equal(missingOrigin.body.error.code, "permission_denied");

  const invalidBootstrap = await client.post("/setup/bootstrap", {
    token: "incorrect-token",
    username: "admin",
    displayName: "PIT Admin",
    password: "PIT-admin-2026",
  });
  assert.equal(invalidBootstrap.status, 403);
  assert.equal(invalidBootstrap.body.error.code, "permission_denied");

  const bootstrap = await client.post("/setup/bootstrap", {
    token: "setup-token-for-tests",
    username: "admin",
    displayName: "PIT Admin",
    password: "PIT-admin-2026",
  });
  assert.equal(bootstrap.status, 201);
  assert.equal(bootstrap.body.data.user.username, "admin");
  assert.equal(bootstrap.body.data.user.role, "admin");
  assert.equal(bootstrap.body.data.user.passwordHash, undefined);
  const adminId = bootstrap.body.data.user.id;
  const managementAuth = createPitAuthService({
    db,
    setupToken: "unused-after-bootstrap",
    clock: () => mutableClock.read(),
  });
  const validPasswordHash = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(adminId).password_hash;
  const shortSaltDigest = await scrypt("PIT-admin-2026", Buffer.from("aa", "hex"), 64);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    `scrypt$aa$${Buffer.from(shortSaltDigest).toString("hex")}`,
    adminId,
  );
  const corruptHashLogin = await client.post(
    "/auth/login",
    { username: "admin", password: "PIT-admin-2026" },
    { sourceIp: "198.51.100.9" },
  );
  assert.equal(corruptHashLogin.status, 401);
  assert.equal(corruptHashLogin.body.error.code, "authentication_required");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(validPasswordHash, adminId);

  const closedSetup = await client.get("/setup/status");
  assert.deepEqual(closedSetup.body.data, { needsBootstrap: false });
  const reusedBootstrap = await client.post("/setup/bootstrap", {
    token: "setup-token-for-tests",
    username: "second-admin",
    displayName: "Second Admin",
    password: "PIT-second-2026",
  });
  assert.equal(reusedBootstrap.status, 409);

  const malformed = await client.request("POST", "/auth/login", {
    rawBody: "{not-json",
    headers: { "content-type": "application/json" },
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.code, "invalid_request");
  assert.equal(typeof malformed.body.error.requestId, "string");

  const unsupported = await client.request("POST", "/auth/login", {
    rawBody: "username=admin",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  assert.equal(unsupported.status, 415);
  assert.equal(unsupported.body.error.code, "unsupported_file_type");

  const oversized = await client.request("POST", "/auth/login", {
    rawBody: Buffer.alloc(1024 * 1024 + 1),
    headers: { "content-type": "application/json" },
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.error.code, "file_too_large");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const failed = await client.post(
      "/auth/login",
      { username: "missing-user", password: "wrong-password" },
      { sourceIp: "198.51.100.20" },
    );
    assert.equal(failed.status, 401, `failed login ${attempt} should remain generic`);
    assert.equal(failed.body.error.code, "authentication_required");
  }
  const rateLimited = await client.post(
    "/auth/login",
    { username: "missing-user", password: "wrong-password" },
    { sourceIp: "198.51.100.20" },
  );
  assert.equal(rateLimited.status, 429);
  assert.equal(rateLimited.body.error.code, "too_many_requests");
  const independentIp = await client.post(
    "/auth/login",
    { username: "missing-user", password: "wrong-password" },
    { sourceIp: "198.51.100.21" },
  );
  assert.equal(independentIp.status, 401);

  const existingWrongPassword = await client.post(
    "/auth/login",
    { username: "admin", password: "wrong-password" },
    { sourceIp: "198.51.100.30" },
  );
  assert.equal(existingWrongPassword.status, 401);
  assert.equal(existingWrongPassword.body.error.message, independentIp.body.error.message);

  const badOriginLogin = await client.post(
    "/auth/login",
    { username: "admin", password: "PIT-admin-2026" },
    { origin: "http://attacker.example" },
  );
  assert.equal(badOriginLogin.status, 403);

  const login = await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /pit_session=.*HttpOnly.*SameSite=Strict/i);
  assert.match(login.headers.get("set-cookie"), /Path=\/api\/v1\/pit/i);
  assert.match(login.headers.get("set-cookie"), /Max-Age=604800/i);
  assert.equal(login.body.data.user.passwordHash, undefined);

  const me = await client.get("/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.role, "admin");
  assert.match(me.body.data.csrfToken, /^[a-f0-9]{64}$/);

  const storedSession = db.prepare(`
    SELECT id_hash, csrf_hash, created_at, expires_at, absolute_expires_at FROM sessions
  `).get();
  assert.match(storedSession.id_hash, /^[a-f0-9]{64}$/);
  assert.match(storedSession.csrf_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(storedSession.id_hash, client.sessionToken);
  assert.notEqual(storedSession.csrf_hash, me.body.data.csrfToken);
  assert.equal(Date.parse(storedSession.expires_at) - Date.parse(storedSession.created_at), 12 * 60 * 60 * 1000);
  assert.equal(
    Date.parse(storedSession.absolute_expires_at) - Date.parse(storedSession.created_at),
    7 * 24 * 60 * 60 * 1000,
  );

  const noCsrf = await client.post("/auth/logout");
  assert.equal(noCsrf.status, 403);
  const wrongCsrf = await client.request("POST", "/auth/logout", {
    headers: { "x-csrf-token": "0".repeat(64) },
  });
  assert.equal(wrongCsrf.status, 403);
  const logout = await client.post("/auth/logout", undefined, { csrf: true });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /pit_session=;.*Max-Age=0/i);
  const afterLogout = await client.get("/auth/me");
  assert.equal(afterLogout.status, 401);

  const relogin = await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(relogin.status, 200);
  await client.get("/auth/me");

  managementAuth.updateUser(adminId, { role: "editor" });
  const refreshedRole = await client.get("/auth/me");
  assert.equal(refreshedRole.body.data.user.role, "editor");

  db.prepare("UPDATE sessions SET expires_at = ?, absolute_expires_at = ?").run(
    "2099-01-01T00:00:00.000Z",
    mutableClock.read().toISOString(),
  );
  const absoluteExpired = await client.get("/auth/me");
  assert.equal(absoluteExpired.status, 401);

  const loginForIdleExpiry = await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(loginForIdleExpiry.status, 200);
  await client.get("/auth/me");

  mutableClock.advance(12 * 60 * 60 * 1000 + 1);
  const expired = await client.get("/auth/me");
  assert.equal(expired.status, 401);
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 0);

  const loginForDisable = await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(loginForDisable.status, 200);
  await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 2);
  managementAuth.updateUser(adminId, { active: false });
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 0);
  const disabled = await client.get("/auth/me");
  assert.equal(disabled.status, 401);
  managementAuth.updateUser(adminId, { active: true });

  const loginForPasswordReset = await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  });
  assert.equal(loginForPasswordReset.status, 200);
  await managementAuth.resetPassword(adminId, "PIT-admin-reset-2026");
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 0);
  assert.equal((await client.get("/auth/me")).status, 401);
  assert.equal((await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-2026",
  })).status, 401);

  assert.equal((await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-reset-2026",
  })).status, 200);
  assert.equal((await client.post("/auth/login", {
    username: "admin",
    password: "PIT-admin-reset-2026",
  })).status, 200);
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 2);
  assert.equal(managementAuth.revokeAllSessions(adminId), 2);
  assert.equal(db.prepare("SELECT count(*) AS count FROM sessions").get().count, 0);
  assert.equal((await client.get("/auth/me")).status, 401);
} finally {
  await server.close();
}

async function verifyIdleBoundaryAndSlidingRenewal() {
  const timeline = { now: new Date("2026-09-01T00:00:00.000Z") };
  const boundaryServer = await startPitTestServer({
    setupToken: "idle-boundary-token",
    clock: () => new Date(timeline.now),
  });
  try {
    const { client, db } = boundaryServer;
    await client.post("/setup/bootstrap", {
      token: "idle-boundary-token",
      username: "idle-admin",
      displayName: "Idle Admin",
      password: "PIT-idle-2026",
    });
    assert.equal((await client.post("/auth/login", {
      username: "idle-admin",
      password: "PIT-idle-2026",
    })).status, 200);

    const initial = db.prepare("SELECT expires_at, absolute_expires_at FROM sessions").get();
    timeline.now = new Date(Date.parse(initial.expires_at) - 1);
    assert.equal((await client.get("/auth/me")).status, 200);
    const renewed = db.prepare("SELECT expires_at, absolute_expires_at FROM sessions").get();
    assert.equal(
      Date.parse(renewed.expires_at),
      Math.min(timeline.now.getTime() + 12 * 60 * 60 * 1000, Date.parse(renewed.absolute_expires_at)),
    );
    assert(Date.parse(renewed.expires_at) > Date.parse(initial.expires_at));

    timeline.now = new Date(renewed.expires_at);
    assert.equal((await client.get("/auth/me")).status, 401);
  } finally {
    await boundaryServer.close();
  }
}

async function verifyAbsoluteBoundary() {
  const timeline = { now: new Date("2026-09-10T00:00:00.000Z") };
  const startedAt = timeline.now.getTime();
  const boundaryServer = await startPitTestServer({
    setupToken: "absolute-boundary-token",
    clock: () => new Date(timeline.now),
  });
  try {
    const { client, db } = boundaryServer;
    await client.post("/setup/bootstrap", {
      token: "absolute-boundary-token",
      username: "absolute-admin",
      displayName: "Absolute Admin",
      password: "PIT-absolute-2026",
    });
    assert.equal((await client.post("/auth/login", {
      username: "absolute-admin",
      password: "PIT-absolute-2026",
    })).status, 200);

    for (let hour = 11; hour <= 165; hour += 11) {
      timeline.now = new Date(startedAt + hour * 60 * 60 * 1000);
      assert.equal((await client.get("/auth/me")).status, 200);
    }

    const absoluteBoundary = startedAt + 7 * 24 * 60 * 60 * 1000;
    timeline.now = new Date(absoluteBoundary - 1);
    assert.equal((await client.get("/auth/me")).status, 200);
    const finalSession = db.prepare("SELECT expires_at, absolute_expires_at FROM sessions").get();
    assert.equal(Date.parse(finalSession.absolute_expires_at), absoluteBoundary);
    assert.equal(Date.parse(finalSession.expires_at), absoluteBoundary);

    timeline.now = new Date(absoluteBoundary);
    assert.equal((await client.get("/auth/me")).status, 401);
  } finally {
    await boundaryServer.close();
  }
}

await verifyIdleBoundaryAndSlidingRenewal();
await verifyAbsoluteBoundary();
