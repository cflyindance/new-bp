import assert from "node:assert/strict";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { startPitTestServer } from "./lib/pit-test-server.mjs";
import { createPitAuthService } from "../server/pit/pit-auth-service.mjs";
import { recordAuditEvent } from "../server/pit/pit-audit-service.mjs";
import {
  createPitRequirementService,
  parseRequirementListQuery,
  resolvePitTransition,
} from "../server/pit/pit-requirement-service.mjs";

const clock = { now: new Date("2026-08-31T08:00:00.000Z") };
const server = await startPitTestServer({
  setupToken: "requirements-setup-token",
  clock: () => new Date(clock.now),
});

function insertDictionary(db, type, code, label, sortOrder) {
  const id = `${type}-${code}`;
  const now = clock.now.toISOString();
  db.prepare(`
    INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, type, code, label, sortOrder, now, now);
  return id;
}

async function login(client, username, password) {
  const result = await client.post("/auth/login", { username, password });
  assert.equal(result.status, 200, `login failed for ${username}`);
  const me = await client.get("/auth/me");
  assert.equal(me.status, 200);
  return me.body.data.user;
}

function requirementBody(overrides = {}) {
  return {
    jiraTicket: "PIT-20527",
    title: "Kiosk international phone number",
    description: "Support international country codes at checkout",
    useCase: "International guests",
    notes: "Coordinate the rollout with support",
    priority: "high",
    requirementTypeId: ids.typeFeature,
    sourceId: ids.sourceProduct,
    problemCategoryId: ids.problemMenu,
    industryId: ids.industryRestaurant,
    customerManager: "Alice",
    implementationSide: "both",
    proposedAt: "2026-08-15",
    plannedYear: 2026,
    plannedMonth: 9,
    versionNo: "v3.2",
    developmentStartedAt: null,
    developmentCompletedAt: null,
    posMergeVersion: null,
    isHighlighted: true,
    productLineIds: [ids.productKiosk],
    mids: ["MID-001", "MID-002"],
    assignees: [
      { role: "owner", userId: users.editor.id, displayName: users.editor.displayName },
      { role: "developer", userId: users.editor.id, displayName: users.editor.displayName },
      { role: "developer", userId: null, displayName: "External Dev" },
      { role: "tester", userId: users.viewer.id, displayName: users.viewer.displayName },
      { role: "tester", userId: null, displayName: "External QA" },
    ],
    ...overrides,
  };
}

function assertAuditDelta(db, before, action) {
  const rows = db.prepare("SELECT * FROM audit_events ORDER BY rowid").all();
  assert.equal(rows.length, before + 1, `${action} must write exactly one audit event`);
  const event = rows.at(-1);
  assert.equal(event.action, action);
  const serialized = `${event.before_json || ""}${event.after_json || ""}${event.metadata_json || ""}`;
  assert(!/authToken|password|csrf|sessionToken/i.test(serialized), `${action} audit is not redacted`);
  return rows.length;
}

const normal = [
  "review_pending",
  "design_pending",
  "scheduling_pending",
  "development",
  "testing",
  "completed",
];
const accepted = [
  ["advance", "review_pending", "design_pending", "editor"],
  ["advance", "design_pending", "scheduling_pending", "editor"],
  ["advance", "scheduling_pending", "development", "editor"],
  ["advance", "development", "testing", "editor"],
  ["advance", "testing", "completed", "editor"],
  ["return", "development", "review_pending", "editor"],
  ["pause", "testing", "paused", "editor"],
  ["resume", "paused", "testing", "editor"],
  ["reject", "design_pending", "rejected", "editor"],
  ["reopen", "rejected", "review_pending", "admin"],
  ["reopen", "completed", "review_pending", "admin"],
];

for (const [action, status, targetStatus, actorRole] of accepted) {
  const reason = ["return", "pause", "reject", "reopen"].includes(action) ? "required reason" : undefined;
  const suppliedTarget = action === "advance" ? targetStatus : undefined;
  const pausedFromStatus = action === "resume" ? targetStatus : undefined;
  const result = resolvePitTransition({ action, status, targetStatus: suppliedTarget, pausedFromStatus, actorRole, reason });
  assert.equal(result.status, targetStatus, `${action} ${status} should reach ${targetStatus}`);
}

const fullAccepted = [
  ...[
    ["review_pending", "design_pending"],
    ["design_pending", "scheduling_pending"],
    ["scheduling_pending", "development"],
    ["development", "testing"],
    ["testing", "completed"],
  ].map(([status, targetStatus]) => ({ action: "advance", status, targetStatus, expected: targetStatus })),
  ...["design_pending", "scheduling_pending", "development", "testing"].map((status) => ({
    action: "return", status, reason: "return reason", expected: "review_pending",
  })),
  ...normal.map((status) => ({ action: "pause", status, reason: "pause reason", expected: "paused", expectedPausedFrom: status })),
  ...normal.map((pausedFromStatus) => ({ action: "resume", status: "paused", pausedFromStatus, expected: pausedFromStatus })),
  ...[...normal, "paused"].map((status) => ({ action: "reject", status, reason: "reject reason", expected: "rejected" })),
  ...["rejected", "completed"].map((status) => ({
    action: "reopen", status, actorRole: "admin", reason: "reopen reason", expected: "review_pending",
  })),
];
for (const item of fullAccepted) {
  const result = resolvePitTransition({ actorRole: "editor", ...item });
  assert.equal(result.status, item.expected, `${item.action}/${item.status}`);
  assert.equal(result.pausedFromStatus, item.expectedPausedFrom ?? null, `${item.action}/${item.status} pause origin`);
}

for (const [status, correctTarget] of [
  ["review_pending", "design_pending"],
  ["design_pending", "scheduling_pending"],
  ["scheduling_pending", "development"],
  ["development", "testing"],
  ["testing", "completed"],
]) {
  for (const targetStatus of [...normal, "paused", "rejected", undefined]) {
    if (targetStatus === correctTarget) continue;
    assert.throws(
      () => resolvePitTransition({ action: "advance", status, targetStatus, actorRole: "admin" }),
      (error) => error?.status === 422,
      `advance/${status}/${targetStatus} must be rejected`,
    );
  }
}
for (const action of ["return", "pause", "resume", "reject", "reopen"]) {
  const status = { return: "development", pause: "testing", resume: "paused", reject: "testing", reopen: "rejected" }[action];
  assert.throws(
    () => resolvePitTransition({
      action,
      status,
      targetStatus: "review_pending",
      pausedFromStatus: action === "resume" ? "testing" : undefined,
      actorRole: "admin",
      reason: ["return", "pause", "reject", "reopen"].includes(action) ? "reason" : undefined,
    }),
    (error) => error?.status === 422,
    `${action} must reject client targetStatus`,
  );
  assert.throws(
    () => resolvePitTransition({
      action,
      status,
      targetStatus: null,
      pausedFromStatus: action === "resume" ? "testing" : undefined,
      actorRole: "admin",
      reason: ["return", "pause", "reject", "reopen"].includes(action) ? "reason" : undefined,
    }),
    (error) => error?.status === 422,
    `${action} must reject null targetStatus`,
  );
}

for (const status of [...normal, "paused", "rejected"]) {
  for (const action of ["advance", "return", "pause", "resume", "reject", "reopen"]) {
    const knownValid = accepted.some(([candidateAction, from]) => candidateAction === action && from === status)
      || (action === "return" && ["design_pending", "scheduling_pending", "testing"].includes(status))
      || (action === "pause" && normal.includes(status))
      || (action === "reject" && [...normal, "paused"].includes(status));
    if (knownValid) continue;
    assert.throws(
      () => resolvePitTransition({
        action,
        status,
        targetStatus: action === "advance" ? "completed" : undefined,
        pausedFromStatus: status === "paused" ? "testing" : undefined,
        actorRole: "admin",
        reason: "reason",
      }),
      (error) => error?.status === 422,
      `${action}/${status} must be rejected`,
    );
  }
}

for (const action of ["return", "pause", "reject", "reopen"]) {
  const status = { return: "development", pause: "testing", reject: "testing", reopen: "rejected" }[action];
  assert.throws(
    () => resolvePitTransition({ action, status, actorRole: "admin", reason: "   " }),
    (error) => error?.status === 422,
    `${action} requires reason`,
  );
}
assert.throws(
  () => resolvePitTransition({ action: "resume", status: "paused", pausedFromStatus: null, actorRole: "admin" }),
  (error) => error?.status === 422,
);
assert.throws(
  () => resolvePitTransition({ action: "resume", status: "paused", pausedFromStatus: "rejected", actorRole: "admin" }),
  (error) => error?.status === 422,
);
assert.throws(
  () => resolvePitTransition({ action: "reopen", status: "rejected", actorRole: "editor", reason: "retry" }),
  (error) => error?.status === 403,
);
assert.throws(
  () => resolvePitTransition({ action: "return", status: "development", targetStatus: "review_pending", actorRole: "editor", reason: "retry" }),
  (error) => error?.status === 422,
);

const actions = ["advance", "return", "pause", "resume", "reject", "reopen"];
const statuses = [...normal, "paused", "rejected"];
const targetCandidates = [undefined, null, ...statuses, "unknown_status"];
for (const action of actions) {
  for (const status of statuses) {
    for (const targetStatus of targetCandidates) {
      const expectedAdvance = {
        review_pending: "design_pending",
        design_pending: "scheduling_pending",
        scheduling_pending: "development",
        development: "testing",
        testing: "completed",
      }[status];
      const targetAbsent = targetStatus === undefined;
      const allowed = action === "advance"
        ? expectedAdvance !== undefined && targetStatus === expectedAdvance
        : action === "return"
          ? targetAbsent && ["design_pending", "scheduling_pending", "development", "testing"].includes(status)
          : action === "pause"
            ? targetAbsent && normal.includes(status)
            : action === "resume"
              ? targetAbsent && status === "paused"
              : action === "reject"
                ? targetAbsent && [...normal, "paused"].includes(status)
                : targetAbsent && ["rejected", "completed"].includes(status);
      const invoke = () => resolvePitTransition({
        action,
        status,
        targetStatus,
        pausedFromStatus: action === "resume" && status === "paused" ? "testing" : undefined,
        actorRole: "admin",
        reason: ["return", "pause", "reject", "reopen"].includes(action) ? "matrix reason" : undefined,
      });
      if (allowed) assert.doesNotThrow(invoke, `${action}/${status}/${String(targetStatus)}`);
      else assert.throws(invoke, (error) => error?.status === 422, `${action}/${status}/${String(targetStatus)}`);
    }
  }
}
assert.throws(
  () => resolvePitTransition({ action: "unknown", status: "review_pending", actorRole: "admin" }),
  (error) => error?.status === 422,
);
assert.throws(
  () => resolvePitTransition({ action: "advance", status: "unknown", targetStatus: "design_pending", actorRole: "admin" }),
  (error) => error?.status === 422,
);

let ids;
let users;

try {
  const { client, db } = server;
  const bootstrap = await client.post("/setup/bootstrap", {
    token: "requirements-setup-token",
    username: "admin",
    displayName: "Admin User",
    password: "PIT-admin-2026",
  });
  assert.equal(bootstrap.status, 201);
  const auth = createPitAuthService({ db, setupToken: "unused", clock: () => new Date(clock.now) });
  const editor = await auth.createUser({
    username: "editor",
    displayName: "Editor User",
    password: "PIT-editor-2026",
    role: "editor",
  });
  const viewer = await auth.createUser({
    username: "viewer",
    displayName: "Viewer User",
    password: "PIT-viewer-2026",
    role: "viewer",
  });
  users = { admin: bootstrap.body.data.user, editor, viewer };
  ids = {
    productKiosk: insertDictionary(db, "product_line", "kiosk", "Kiosk", 1),
    productPay: insertDictionary(db, "product_line", "payroll", "PayRoll", 2),
    typeFeature: insertDictionary(db, "requirement_type", "feature", "Feature", 1),
    typeBug: insertDictionary(db, "requirement_type", "bug", "Bug", 2),
    sourceProduct: insertDictionary(db, "requirement_source", "product", "Product", 1),
    sourceOps: insertDictionary(db, "requirement_source", "ops", "Operations", 2),
    problemMenu: insertDictionary(db, "problem_category", "menu", "Menu", 1),
    problemPay: insertDictionary(db, "problem_category", "payment", "Payment", 2),
    industryRestaurant: insertDictionary(db, "industry", "restaurant", "Restaurant", 1),
  };
  const defaultListQuery = parseRequirementListQuery({}, users.admin);
  assert.match(defaultListQuery.where, /requirements\.deleted_at IS NULL/);

  const redactionEvent = recordAuditEvent(db, {
    actorUserId: users.admin.id,
    action: "requirement.redaction-test",
    resourceType: "requirement",
    resourceId: "redaction-test",
    before: {
      safe: "visible",
      password: "remove-me",
      nested: { accessToken: "remove-me", csrfValue: "remove-me", retained: true },
      list: [{ sessionToken: "remove-me", label: "kept" }],
    },
    after: { safe: "still-visible", authorization: "remove-me" },
    metadata: { token: "remove-me", reason: "kept" },
    createdAt: clock.now.toISOString(),
  });
  const storedRedaction = db.prepare("SELECT * FROM audit_events WHERE id = ?").get(redactionEvent.id);
  const redactionJson = `${storedRedaction.before_json}${storedRedaction.after_json}${storedRedaction.metadata_json}`;
  assert(!/remove-me|password|token|csrf|session|authorization/i.test(redactionJson));
  assert.match(redactionJson, /visible|retained|label|reason/);
  db.prepare("DELETE FROM audit_events WHERE id = ?").run(redactionEvent.id);

  await login(client, "editor", "PIT-editor-2026");
  let auditCount = 0;
  const created = [];
  const createCases = [
    requirementBody(),
    requirementBody({
      jiraTicket: "PIT-20528", title: "PayRoll tax report", description: "Payroll report issue",
      priority: "urgent", requirementTypeId: ids.typeBug, sourceId: ids.sourceOps,
      problemCategoryId: ids.problemPay, proposedAt: "2026-08-31", plannedYear: 2026,
      plannedMonth: 10, isHighlighted: false, productLineIds: [ids.productPay], mids: ["MID-003"],
    }),
    requirementBody({
      jiraTicket: "PIT-20529", title: "Kiosk menu layout", description: "Improve menu rendering",
      priority: "medium", proposedAt: "2026-09-01", plannedYear: 2027, plannedMonth: 1,
      productLineIds: [ids.productKiosk, ids.productPay],
    }),
    requirementBody({ jiraTicket: "PIT-20530", title: "POS payment", priority: "low", isHighlighted: false, proposedAt: "2026-08-01" }),
    requirementBody({ jiraTicket: "PIT-20531", title: "Customer menu", priority: null, proposedAt: null }),
    requirementBody({ jiraTicket: "PIT-20532", title: "Operations settings", sourceId: ids.sourceOps, proposedAt: "2026-07" }),
  ];
  createCases[0].proposedAt = "2026-08";

  for (const body of createCases) {
    const response = await client.post("/requirements", body, { csrf: true });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    created.push(response.body.data.requirement);
    auditCount = assertAuditDelta(db, auditCount, "requirement.create");
  }
  assert.deepEqual(created.map((item) => item.requirementNo), [
    "REQ-000001", "REQ-000002", "REQ-000003", "REQ-000004", "REQ-000005", "REQ-000006",
  ]);
  assert.equal(created[0].status, "review_pending");
  assert.equal(created[0].assignees.filter((entry) => entry.role === "owner").length, 1);
  assert.equal(created[0].assignees.filter((entry) => entry.role === "developer").length, 2);
  assert.equal(created[0].assignees.filter((entry) => entry.role === "tester").length, 2);
  db.prepare("UPDATE requirements SET source_status = ? WHERE id = ?").run("待分配（源状态）", created[0].id);

  db.prepare("UPDATE dictionaries SET active = 0 WHERE id = ?").run(ids.sourceProduct);
  const historicalDetail = await client.get(`/requirements/${created[0].id}`);
  assert.equal(historicalDetail.status, 200);
  assert.deepEqual(historicalDetail.body.data.requirement.requirementType, {
    id: ids.typeFeature,
    code: "feature",
    label: "Feature",
    active: true,
  });
  assert.deepEqual(historicalDetail.body.data.requirement.source, {
    id: ids.sourceProduct,
    code: "product",
    label: "Product",
    active: false,
  });
  assert.deepEqual(historicalDetail.body.data.requirement.problemCategory, {
    id: ids.problemMenu,
    code: "menu",
    label: "Menu",
    active: true,
  });
  assert.deepEqual(historicalDetail.body.data.requirement.industry, {
    id: ids.industryRestaurant,
    code: "restaurant",
    label: "Restaurant",
    active: true,
  });
  const historicalList = await client.get("/requirements?sort=createdAt&pageSize=100");
  assert.equal(historicalList.status, 200);
  assert.deepEqual(historicalList.body.data.items.find((item) => item.id === created[0].id).source, {
    id: ids.sourceProduct,
    code: "product",
    label: "Product",
    active: false,
  });
  assert.equal(historicalList.body.data.items.find((item) => item.id === created[0].id).sourceStatus, "待分配（源状态）");
  db.prepare("UPDATE dictionaries SET active = 1 WHERE id = ?").run(ids.sourceProduct);

  const invalidOwners = await client.post("/requirements", requirementBody({
    assignees: [
      { role: "owner", userId: users.editor.id, displayName: "Editor User" },
      { role: "owner", userId: users.viewer.id, displayName: "Viewer User" },
    ],
  }), { csrf: true });
  assert.equal(invalidOwners.status, 422);
  const inactiveSource = insertDictionary(db, "requirement_source", "inactive", "Inactive", 99);
  db.prepare("UPDATE dictionaries SET active = 0 WHERE id = ?").run(inactiveSource);
  const inactiveDictionary = await client.post("/requirements", requirementBody({ sourceId: inactiveSource }), { csrf: true });
  assert.equal(inactiveDictionary.status, 422);
  assert.equal(db.prepare("SELECT count(*) AS count FROM audit_events").get().count, auditCount);

  const original = created[0];
  const update = await client.patch(`/requirements/${original.id}`, {
    rowVersion: original.rowVersion,
    title: "Kiosk international phone number v2",
    status: "completed",
    productLineIds: [ids.productKiosk, ids.productPay],
    mids: ["MID-100"],
    assignees: requirementBody().assignees,
    password: "must-not-be-audited",
  }, { csrf: true });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.requirement.title, "Kiosk international phone number v2");
  assert.equal(update.body.data.requirement.status, "review_pending", "PATCH status must be ignored");
  assert.equal(update.body.data.requirement.rowVersion, original.rowVersion + 1);
  assert.deepEqual(update.body.data.requirement.mids, ["MID-100"]);
  auditCount = assertAuditDelta(db, auditCount, "requirement.update");

  const stale = await client.patch(`/requirements/${original.id}`, {
    rowVersion: original.rowVersion,
    title: "stale overwrite",
  }, { csrf: true });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, "version_conflict");
  assert.equal(stale.body.error.fields.submittedVersion, original.rowVersion);
  assert.equal(stale.body.error.fields.currentVersion, original.rowVersion + 1);
  assert.equal(stale.body.error.fields.current.title, "Kiosk international phone number v2");
  assert.equal(db.prepare("SELECT count(*) AS count FROM audit_events").get().count, auditCount);

  const beforeRollback = db.prepare("SELECT title, row_version FROM requirements WHERE id = ?").get(original.id);
  const beforeRollbackProducts = db.prepare(`
    SELECT dictionary_id FROM requirement_product_lines WHERE requirement_id = ? ORDER BY dictionary_id
  `).all(original.id);
  const beforeRollbackMids = db.prepare(`
    SELECT mid FROM requirement_mids WHERE requirement_id = ? ORDER BY mid
  `).all(original.id);
  db.exec(`
    CREATE TRIGGER pit_test_abort_requirement_audit
    BEFORE INSERT ON audit_events
    BEGIN
      SELECT RAISE(ABORT, 'audit insert blocked');
    END;
  `);
  const rolledBack = await client.patch(`/requirements/${original.id}`, {
    rowVersion: beforeRollback.row_version,
    title: "must roll back",
    productLineIds: [ids.productKiosk],
    mids: ["ROLLBACK-MID"],
  }, { csrf: true });
  assert.equal(rolledBack.status, 500);
  db.exec("DROP TRIGGER pit_test_abort_requirement_audit");
  assert.deepEqual(
    db.prepare("SELECT title, row_version FROM requirements WHERE id = ?").get(original.id),
    beforeRollback,
  );
  assert.deepEqual(
    db.prepare("SELECT dictionary_id FROM requirement_product_lines WHERE requirement_id = ? ORDER BY dictionary_id").all(original.id),
    beforeRollbackProducts,
  );
  assert.deepEqual(
    db.prepare("SELECT mid FROM requirement_mids WHERE requirement_id = ? ORDER BY mid").all(original.id),
    beforeRollbackMids,
  );

  const firstId = original.id;
  const follow = await client.put(`/requirements/${firstId}/follow`, {}, { csrf: true });
  assert.equal(follow.status, 200);
  assert.equal(follow.body.data.following, true);
  auditCount = assertAuditDelta(db, auditCount, "requirement.follow");
  const followAgain = await client.put(`/requirements/${firstId}/follow`, {}, { csrf: true });
  assert.equal(followAgain.status, 200);
  assert.equal(followAgain.body.data.following, true);
  auditCount = assertAuditDelta(db, auditCount, "requirement.follow");

  const queryCases = [
    ["?q=tax%20report", 1],
    [`?productLine=${ids.productKiosk}&productLine=${ids.productPay}`, 6],
    ["?status=review_pending&status=development", 6],
    ["?priority=urgent&priority=low", 2],
    [`?requirementType=${ids.typeFeature}&requirementType=${ids.typeBug}`, 6],
    [`?problemCategory=${ids.problemMenu}&problemCategory=${ids.problemPay}`, 6],
    [`?source=${ids.sourceProduct}&source=${ids.sourceOps}`, 6],
    [`?owner=${users.editor.id}&owner=${users.viewer.id}`, 6],
    ["?highlighted=true", 4],
    ["?plannedYear=2026&plannedYear=2027", 6],
    ["?plannedMonth=9&plannedMonth=10", 5],
    ["?proposedFrom=2026-08&proposedTo=2026-08", 3],
    ["?proposedFrom=2026-08-31&proposedTo=2026-08-31", 1],
    ["?proposedFrom=2026-08&proposedTo=2026-08-31", 3],
    ["?mine=true", 6],
    ["?followed=true", 1],
    ["?active=true", 6],
    ["?overdue=true", 0],
  ];
  for (const [query, total] of queryCases) {
    const response = await client.get(`/requirements${query}`);
    assert.equal(response.status, 200, `${query}: ${JSON.stringify(response.body)}`);
    assert.equal(response.body.data.total, total, query);
  }

  for (const sort of ["updatedAt", "-updatedAt", "createdAt", "-createdAt", "priority", "-priority", "plannedDate", "-plannedDate"]) {
    const response = await client.get(`/requirements?sort=${sort}`);
    assert.equal(response.status, 200, sort);
    assert.equal(response.body.data.items.length, 6);
  }
  const paged = await client.get("/requirements?page=2&pageSize=2&sort=createdAt");
  assert.equal(paged.status, 200);
  assert.equal(paged.body.data.page, 2);
  assert.equal(paged.body.data.pageSize, 2);
  assert.equal(paged.body.data.items.length, 2);
  assert.equal(paged.body.data.total, 6);
  for (const invalidQuery of ["page=0", "pageSize=101", "sort=title", "highlighted=maybe", "active=maybe", "overdue=maybe", "plannedMonth=13", "proposedFrom=not-a-date", "status=unknown"]) {
    const response = await client.get(`/requirements?${invalidQuery}`);
    assert([400, 422].includes(response.status), invalidQuery);
  }

  let current = (await client.get(`/requirements/${firstId}`)).body.data.requirement;
  assert.equal(current.following, true);
  const advance = await client.post(`/requirements/${firstId}/transitions`, {
    action: "advance", targetStatus: "design_pending", rowVersion: current.rowVersion,
  }, { csrf: true });
  assert.equal(advance.status, 200);
  assert.equal(advance.body.data.requirement.status, "design_pending");
  auditCount = assertAuditDelta(db, auditCount, "requirement.transition.advance");
  const staleTransition = await client.post(`/requirements/${firstId}/transitions`, {
    action: "advance", targetStatus: "scheduling_pending", rowVersion: current.rowVersion,
  }, { csrf: true });
  assert.equal(staleTransition.status, 409);
  assert.equal(staleTransition.body.error.fields.submittedVersion, current.rowVersion);
  assert.equal(staleTransition.body.error.fields.currentVersion, current.rowVersion + 1);

  const returnMissingReason = await client.post(`/requirements/${firstId}/transitions`, {
    action: "return", rowVersion: advance.body.data.requirement.rowVersion,
  }, { csrf: true });
  assert.equal(returnMissingReason.status, 422);
  const reopenByEditor = await client.post(`/requirements/${firstId}/transitions`, {
    action: "reopen", reason: "retry", rowVersion: advance.body.data.requirement.rowVersion,
  }, { csrf: true });
  assert([403, 422].includes(reopenByEditor.status));
  assert.equal((await client.delete(`/requirements/${firstId}`, {}, { csrf: true })).status, 403);
  assert.equal((await client.post(`/requirements/${firstId}/restore`, {}, { csrf: true })).status, 403);
  assert.equal((await client.get("/requirements?deleted=only")).status, 403);
  assert.equal((await client.get("/requirements?deleted=include")).status, 403);

  await login(client, "viewer", "PIT-viewer-2026");
  assert.equal((await client.get("/requirements")).status, 200);
  assert.equal((await client.get(`/requirements/${firstId}`)).status, 200);
  const viewerWrites = [
    ["POST", "/requirements", requirementBody()],
    ["PATCH", `/requirements/${firstId}`, { rowVersion: current.rowVersion, title: "blocked" }],
    ["PUT", `/requirements/${firstId}/follow`, {}],
    ["DELETE", `/requirements/${firstId}/follow`, {}],
    ["POST", `/requirements/${firstId}/transitions`, { action: "pause", reason: "blocked", rowVersion: current.rowVersion }],
    ["DELETE", `/requirements/${firstId}`, {}],
    ["POST", `/requirements/${firstId}/restore`, {}],
  ];
  for (const [method, path, body] of viewerWrites) {
    const response = await client.request(method, path, { body, csrf: true });
    assert.equal(response.status, 403, `${method} ${path}`);
  }
  assert.equal((await client.get("/requirements?deleted=only")).status, 403);
  assert.equal((await client.get("/requirements?deleted=include")).status, 403);
  assert.equal(db.prepare("SELECT count(*) AS count FROM audit_events").get().count, auditCount);

  await login(client, "admin", "PIT-admin-2026");
  current = (await client.get(`/requirements/${firstId}`)).body.data.requirement;
  const rejected = await client.post(`/requirements/${firstId}/transitions`, {
    action: "reject", reason: "not viable", rowVersion: current.rowVersion,
  }, { csrf: true });
  assert.equal(rejected.status, 200);
  auditCount = assertAuditDelta(db, auditCount, "requirement.transition.reject");
  const reopened = await client.post(`/requirements/${firstId}/transitions`, {
    action: "reopen", reason: "new evidence", rowVersion: rejected.body.data.requirement.rowVersion,
  }, { csrf: true });
  assert.equal(reopened.status, 200);
  assert.equal(reopened.body.data.requirement.status, "review_pending");
  auditCount = assertAuditDelta(db, auditCount, "requirement.transition.reopen");

  const deleted = await client.delete(`/requirements/${firstId}`, {}, { csrf: true });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.body.data.requirement.deletedBy.id, users.admin.id);
  auditCount = assertAuditDelta(db, auditCount, "requirement.delete");
  assert.equal((await client.get("/requirements")).body.data.total, 5);
  assert.equal((await client.get("/requirements?followed=true")).body.data.total, 0);
  assert.equal((await client.get(`/requirements/${firstId}`)).status, 404);
  assert.equal((await client.put(`/requirements/${firstId}/follow`, {}, { csrf: true })).status, 404);
  assert.equal((await client.get("/requirements?deleted=only")).body.data.total, 1);
  assert.equal((await client.get("/requirements?deleted=include")).body.data.total, 6);
  const deletedDetail = await client.get(`/requirements/${firstId}?deleted=include`);
  assert.equal(deletedDetail.status, 200);
  assert.equal(deletedDetail.body.data.requirement.deletedAt !== null, true);

  const restored = await client.post(`/requirements/${firstId}/restore`, {}, { csrf: true });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.data.requirement.deletedAt, null);
  auditCount = assertAuditDelta(db, auditCount, "requirement.restore");
  assert.equal((await client.get("/requirements")).body.data.total, 6);

  const unfollow = await client.delete(`/requirements/${firstId}/follow`, {}, { csrf: true });
  assert.equal(unfollow.status, 200);
  assert.equal(unfollow.body.data.following, false);
  auditCount = assertAuditDelta(db, auditCount, "requirement.unfollow");
  const unfollowAgain = await client.delete(`/requirements/${firstId}/follow`, {}, { csrf: true });
  assert.equal(unfollowAgain.status, 200);
  auditCount = assertAuditDelta(db, auditCount, "requirement.unfollow");

  const events = db.prepare("SELECT * FROM audit_events ORDER BY rowid").all();
  assert.equal(events.length, auditCount);
  for (const event of events) {
    assert.equal(event.actor_user_id !== null, true);
    assert.equal(event.resource_type, "requirement");
    assert.equal(typeof event.created_at, "string");
  }
  const transitionEvent = events.find((event) => event.action === "requirement.transition.reject");
  assert.equal(JSON.parse(transitionEvent.metadata_json).reason, "not viable");

  const secondDb = new DatabaseSync(path.join(server.dataDir, "pit.sqlite3"));
  secondDb.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  try {
    const firstService = createPitRequirementService({ db, clock: () => new Date(clock.now) });
    const secondService = createPitRequirementService({ db: secondDb, clock: () => new Date(clock.now) });
    const directBody = requirementBody({ sourceId: ids.sourceOps, title: "Connection one" });
    const fromFirstConnection = firstService.create(directBody, users.admin);
    const fromSecondConnection = secondService.create({ ...directBody, title: "Connection two" }, users.admin);
    assert.deepEqual(
      [fromFirstConnection.requirementNo, fromSecondConnection.requirementNo],
      ["REQ-000007", "REQ-000008"],
    );
    assert.equal(new Set(db.prepare("SELECT requirement_no FROM requirements").all().map((row) => row.requirement_no)).size, 8);
  } finally {
    secondDb.close();
  }
} finally {
  await server.close();
}
