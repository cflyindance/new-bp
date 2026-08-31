import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { requestPitHttp, startPitTestServer } from "./lib/pit-test-server.mjs";

const clock = { now: new Date("2026-08-31T08:00:00.000Z") };
const server = await startPitTestServer({
  setupToken: "admin-api-setup-token",
  clock: () => new Date(clock.now),
});

function createClient() {
  let sessionToken = null;
  let csrfToken = null;

  async function request(method, requestPath, { body, csrf = false, origin = server.baseUrl.replace(/\/api\/v1\/pit$/, "") } = {}) {
    const headers = new Headers({ origin });
    if (sessionToken) headers.set("cookie", `pit_session=${encodeURIComponent(sessionToken)}`);
    if (csrf && csrfToken) headers.set("x-csrf-token", csrfToken);
    let payload;
    if (body !== undefined) {
      headers.set("content-type", "application/json");
      payload = JSON.stringify(body);
    }
    const response = await requestPitHttp(`${server.baseUrl}${requestPath}`, { method, headers, body: payload });
    const responseBody = await response.json();
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = /(?:^|[,;]\s*)pit_session=([^;]*)/i.exec(setCookie);
      if (match) sessionToken = match[1] ? decodeURIComponent(match[1]) : null;
    }
    if (responseBody?.data?.csrfToken) csrfToken = responseBody.data.csrfToken;
    return { status: response.status, body: responseBody };
  }

  return {
    request,
    get: (path) => request("GET", path),
    post: (path, body, options = {}) => request("POST", path, { ...options, body }),
    patch: (path, body, options = {}) => request("PATCH", path, { ...options, body }),
    put: (path, body, options = {}) => request("PUT", path, { ...options, body }),
    delete: (path, body, options = {}) => request("DELETE", path, { ...options, body }),
  };
}

async function login(client, username, password) {
  const response = await client.post("/auth/login", { username, password });
  assert.equal(response.status, 200, `login failed for ${username}: ${JSON.stringify(response.body)}`);
  const me = await client.get("/auth/me");
  assert.equal(me.status, 200);
  return me.body.data.user;
}

function insertRequirement({
  status,
  highlighted = false,
  deleted = false,
  plannedYear = null,
  plannedMonth = null,
  typeId = null,
  actorId,
}) {
  const id = randomUUID();
  const now = clock.now.toISOString();
  server.db.prepare(`
    INSERT INTO requirements (
      id, requirement_no, jira_ticket, title, description, status, priority,
      requirement_type_id, is_highlighted, planned_year, planned_month,
      row_version, deleted_at, deleted_by, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, NULL, ?, '', ?, NULL, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    `REQ-${String(server.db.prepare("SELECT count(*) AS count FROM requirements").get().count + 1).padStart(6, "0")}`,
    `Requirement ${id}`,
    status,
    typeId,
    highlighted ? 1 : 0,
    plannedYear,
    plannedMonth,
    deleted ? now : null,
    deleted ? actorId : null,
    actorId,
    actorId,
    now,
    now,
  );
  return id;
}

const admin = createClient();

try {
  const publicHealth = await admin.get("/health");
  assert.equal(publicHealth.status, 200);
  assert.equal(publicHealth.body.data.status, "ok");
  assert.equal(publicHealth.body.data.process.status, "ok");
  assert.equal(publicHealth.body.data.database.status, "ok");
  assert.equal(typeof publicHealth.body.data.backup.status, "string");
  const serializedHealth = JSON.stringify(publicHealth.body.data);
  assert.equal(serializedHealth.includes(server.dataDir), false);
  assert.equal(/(?:path|token|hash|username|password)/i.test(serializedHealth), false);

  const bootstrap = await admin.post("/setup/bootstrap", {
    token: "admin-api-setup-token",
    username: "admin",
    displayName: "Admin User",
    password: "PIT-admin-2026",
  });
  assert.equal(bootstrap.status, 201);
  await login(admin, "admin", "PIT-admin-2026");
  const adminUser = (await admin.get("/auth/me")).body.data.user;

  const missingCsrf = await admin.post("/dictionaries", {
    type: "industry", code: "blocked", label: "Blocked",
  });
  assert.equal(missingCsrf.status, 403);
  const wrongOrigin = await admin.post("/dictionaries", {
    type: "industry", code: "blocked", label: "Blocked",
  }, { csrf: true, origin: "http://evil.example" });
  assert.equal(wrongOrigin.status, 403);

  const dictionaryInputs = [
    ["product_line", "kiosk", "Kiosk"],
    ["requirement_source", "product", "Product"],
    ["requirement_type", "feature", "Feature"],
    ["problem_category", "menu", "Menu"],
    ["industry", "restaurant", "Restaurant"],
  ];
  const dictionaries = {};
  for (const [type, code, label] of dictionaryInputs) {
    const response = await admin.post("/dictionaries", { type, code, label }, { csrf: true });
    assert.equal(response.status, 201, `${type}: ${JSON.stringify(response.body)}`);
    dictionaries[type] = response.body.data.item;
  }
  const secondIndustry = await admin.post("/dictionaries", {
    type: "industry", code: "retail", label: "Retail", sortOrder: 20,
  }, { csrf: true });
  assert.equal(secondIndustry.status, 201);
  const inactive = await admin.patch(`/dictionaries/${secondIndustry.body.data.item.id}`, {
    label: "Retail Shop", sortOrder: 30, active: false,
  }, { csrf: true });
  assert.equal(inactive.status, 200);
  assert.equal(inactive.body.data.item.label, "Retail Shop");
  assert.equal(inactive.body.data.item.sortOrder, 30);
  assert.equal(inactive.body.data.item.active, false);
  const immutableCode = await admin.patch(`/dictionaries/${dictionaries.industry.id}`, { code: "food" }, { csrf: true });
  assert.equal(immutableCode.status, 422);
  const invalidType = await admin.post("/dictionaries", {
    type: "priority", code: "p0", label: "P0",
  }, { csrf: true });
  assert.equal(invalidType.status, 422);

  const reordered = await admin.put("/dictionaries/order", {
    type: "industry",
    itemIds: [secondIndustry.body.data.item.id, dictionaries.industry.id],
  }, { csrf: true });
  assert.equal(reordered.status, 200);
  assert.deepEqual(reordered.body.data.items.map((item) => item.id), [
    secondIndustry.body.data.item.id,
    dictionaries.industry.id,
  ]);
  const partialOrder = await admin.put("/dictionaries/order", {
    type: "industry",
    itemIds: [dictionaries.industry.id],
  }, { csrf: true });
  assert.equal(partialOrder.status, 422, "dictionary reorder must contain the complete type ID set");

  const createdUsers = {};
  for (const [username, role] of [["editor", "editor"], ["viewer", "viewer"], ["target", "viewer"]]) {
    const response = await admin.post("/users", {
      username,
      displayName: `${username} user`,
      password: `PIT-${username}-2026`,
      role,
    }, { csrf: true });
    assert.equal(response.status, 201, `${username}: ${JSON.stringify(response.body)}`);
    assert.equal("passwordHash" in response.body.data.user, false);
    createdUsers[username] = response.body.data.user;
  }
  const users = await admin.get("/users");
  assert.equal(users.status, 200);
  assert.equal(users.body.data.items.length, 4);
  assert.equal(/password|hash/i.test(JSON.stringify(users.body.data.items)), false);

  server.db.exec(`
    CREATE TRIGGER pit_test_abort_admin_audit
    BEFORE INSERT ON audit_events
    BEGIN
      SELECT RAISE(ABORT, 'admin audit insert blocked');
    END;
  `);
  const atomicCreate = await admin.post("/users", {
    username: "atomic-create",
    displayName: "Atomic Create",
    password: "PIT-atomic-create-2026",
    role: "viewer",
  }, { csrf: true });
  assert.equal(atomicCreate.status, 500);
  assert.equal(server.db.prepare("SELECT count(*) AS count FROM users WHERE username = 'atomic-create'").get().count, 0);
  server.db.exec("DROP TRIGGER pit_test_abort_admin_audit");

  const atomicTarget = createClient();
  await login(atomicTarget, "target", "PIT-target-2026");
  const beforeAtomicUser = server.db.prepare("SELECT * FROM users WHERE id = ?").get(createdUsers.target.id);
  const beforeAtomicSessions = server.db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY id_hash").all(createdUsers.target.id);
  server.db.exec(`
    CREATE TRIGGER pit_test_abort_admin_audit
    BEFORE INSERT ON audit_events
    BEGIN
      SELECT RAISE(ABORT, 'admin audit insert blocked');
    END;
  `);
  assert.equal((await admin.patch(`/users/${createdUsers.target.id}`, { active: false, role: "editor" }, { csrf: true })).status, 500);
  assert.deepEqual(server.db.prepare("SELECT * FROM users WHERE id = ?").get(createdUsers.target.id), beforeAtomicUser);
  assert.deepEqual(server.db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY id_hash").all(createdUsers.target.id), beforeAtomicSessions);
  assert.equal((await admin.post(`/users/${createdUsers.target.id}/reset-password`, {
    password: "PIT-atomic-reset-2026",
  }, { csrf: true })).status, 500);
  assert.deepEqual(server.db.prepare("SELECT * FROM users WHERE id = ?").get(createdUsers.target.id), beforeAtomicUser);
  assert.deepEqual(server.db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY id_hash").all(createdUsers.target.id), beforeAtomicSessions);
  assert.equal((await admin.post(`/users/${createdUsers.target.id}/revoke-sessions`, {}, { csrf: true })).status, 500);
  assert.deepEqual(server.db.prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY id_hash").all(createdUsers.target.id), beforeAtomicSessions);
  server.db.exec("DROP TRIGGER pit_test_abort_admin_audit");
  assert.equal((await atomicTarget.get("/auth/me")).status, 200, "rolled-back user writes must preserve the session");

  server.db.prepare(`
    INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
    VALUES ('rogue-priority', 'priority', 'rogue', 'Rogue', 0, 1, ?, ?)
  `).run(clock.now.toISOString(), clock.now.toISOString());

  for (const [username, password] of [
    ["admin", "PIT-admin-2026"],
    ["editor", "PIT-editor-2026"],
    ["viewer", "PIT-viewer-2026"],
  ]) {
    const reader = createClient();
    await login(reader, username, password);
    const response = await reader.get("/dictionaries");
    assert.equal(response.status, 200);
    assert.equal(response.body.data.items.length, 5);
    assert(response.body.data.items.every((item) => item.active));
    assert.deepEqual(new Set(response.body.data.items.map((item) => item.type)), new Set(dictionaryInputs.map(([type]) => type)));
  }

  const viewer = createClient();
  await login(viewer, "viewer", "PIT-viewer-2026");
  assert.equal((await viewer.get("/users")).status, 403);
  assert.equal((await viewer.get("/audit-log")).status, 403);
  assert.equal((await viewer.post("/users", {
    username: "blocked", displayName: "Blocked", password: "PIT-blocked-2026", role: "viewer",
  }, { csrf: true })).status, 403);
  assert.equal((await viewer.patch(`/dictionaries/${dictionaries.industry.id}`, {
    label: "Blocked",
  }, { csrf: true })).status, 403);

  const target = createClient();
  await login(target, "target", "PIT-target-2026");
  const promote = await admin.patch(`/users/${createdUsers.target.id}`, { role: "editor" }, { csrf: true });
  assert.equal(promote.status, 200);
  assert.equal((await target.get("/auth/me")).body.data.user.role, "editor", "role must update on the next request");

  const disable = await admin.patch(`/users/${createdUsers.target.id}`, { active: false }, { csrf: true });
  assert.equal(disable.status, 200);
  assert.equal((await target.get("/auth/me")).status, 401, "disable must remove active sessions");
  assert.equal((await admin.patch(`/users/${createdUsers.target.id}`, { active: true }, { csrf: true })).status, 200);

  await login(target, "target", "PIT-target-2026");
  const reset = await admin.post(`/users/${createdUsers.target.id}/reset-password`, {
    password: "PIT-target-new-2026",
  }, { csrf: true });
  assert.equal(reset.status, 200);
  assert.equal((await target.get("/auth/me")).status, 401, "password reset must remove active sessions");
  assert.equal((await createClient().post("/auth/login", {
    username: "target", password: "PIT-target-2026",
  })).status, 401);
  await login(target, "target", "PIT-target-new-2026");
  const revoked = await admin.post(`/users/${createdUsers.target.id}/revoke-sessions`, {}, { csrf: true });
  assert.equal(revoked.status, 200);
  assert(revoked.body.data.revokedSessions >= 1);
  assert.equal((await target.get("/auth/me")).status, 401, "session revoke must apply immediately");

  const activeUsedRequirementId = insertRequirement({
    status: "review_pending", highlighted: true, plannedYear: 2026, plannedMonth: 7,
    typeId: dictionaries.requirement_type.id, actorId: adminUser.id,
  });
  const developmentId = insertRequirement({ status: "development", actorId: adminUser.id });
  insertRequirement({ status: "scheduling_pending", actorId: adminUser.id });
  insertRequirement({ status: "testing", actorId: adminUser.id });
  const completedId = insertRequirement({ status: "completed", plannedYear: 2026, plannedMonth: 1, actorId: adminUser.id });
  insertRequirement({ status: "review_pending", deleted: true, highlighted: true, actorId: adminUser.id });
  server.db.prepare(`
    INSERT INTO requirement_assignees (id, requirement_id, role, user_id, display_name, sort_order)
    VALUES (?, ?, 'owner', ?, ?, 0)
  `).run(randomUUID(), activeUsedRequirementId, adminUser.id, adminUser.displayName);
  server.db.prepare(`
    INSERT INTO requirement_assignees (id, requirement_id, role, user_id, display_name, sort_order)
    VALUES (?, ?, 'developer', ?, ?, 0)
  `).run(randomUUID(), completedId, adminUser.id, adminUser.displayName);
  server.db.prepare(`
    INSERT INTO requirement_followers (requirement_id, user_id, created_at) VALUES (?, ?, ?)
  `).run(developmentId, adminUser.id, clock.now.toISOString());

  const deactivateUsed = await admin.patch(`/dictionaries/${dictionaries.requirement_type.id}`, { active: false }, { csrf: true });
  assert.equal(deactivateUsed.status, 200);
  const activeDictionaries = await admin.get("/dictionaries");
  assert.equal(activeDictionaries.body.data.items.some((item) => item.id === dictionaries.requirement_type.id), false);
  const allDictionaries = await admin.get("/dictionaries?includeInactive=true");
  assert.equal(allDictionaries.status, 200);
  assert.equal(allDictionaries.body.data.items.find((item) => item.id === dictionaries.requirement_type.id).active, false);
  const historical = await admin.get(`/requirements/${activeUsedRequirementId}`);
  assert.equal(historical.status, 200);
  assert.equal(historical.body.data.requirement.requirementType.label, "Feature");
  assert.equal(historical.body.data.requirement.requirementType.active, false);
  assert.equal((await admin.delete(`/dictionaries/${dictionaries.requirement_type.id}`, {}, { csrf: true })).status, 404);

  const summary = await admin.get("/dashboard/summary");
  assert.equal(summary.status, 200);
  assert.deepEqual(summary.body.data, {
    total: 5,
    review: 1,
    schedulingPending: 1,
    development: 1,
    testing: 1,
    completed: 1,
    highlighted: 1,
    mine: 2,
    followed: 1,
    overdue: 1,
    byStatus: {
      review_pending: 1,
      design_pending: 0,
      scheduling_pending: 1,
      development: 1,
      testing: 1,
      completed: 1,
      paused: 0,
      rejected: 0,
    },
  });

  const actorAudit = await admin.get(`/audit-log?actorUserId=${adminUser.id}&resourceType=user&action=user.update&pageSize=100`);
  assert.equal(actorAudit.status, 200);
  assert(actorAudit.body.data.items.length >= 2);
  assert(actorAudit.body.data.items.every((item) => item.actor.id === adminUser.id));
  assert(actorAudit.body.data.items.every((item) => item.resourceType === "user" && item.action === "user.update"));
  const dateAudit = await admin.get("/audit-log?from=2026-08-31T00%3A00%3A00.000Z&to=2026-08-31T23%3A59%3A59.999Z&pageSize=100");
  assert.equal(dateAudit.status, 200);
  assert(dateAudit.body.data.items.length > 0);
  assert(dateAudit.body.data.items.every((item) => item.createdAt.startsWith("2026-08-31")));

  const finalHealth = await createClient().get("/health");
  assert.equal(finalHealth.status, 200);
  assert.equal(finalHealth.body.data.database.status, "ok");
  assert.equal(finalHealth.body.data.backup.status, "missing");
  assert.equal(JSON.stringify(finalHealth.body.data).includes(server.dataDir), false);

  console.log("PIT administration API verification passed.");
} finally {
  await server.close();
}
