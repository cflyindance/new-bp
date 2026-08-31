# PIT Requirement Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有“周边产品”中新增独立 PIT 入口，并交付一个可由本机托管、供同一局域网使用、以 SQLite 为唯一数据源的需求池管理后台。

**Architecture:** 使用一个原生 `node:http` 进程同时提供 `/api/v1/pit/*` 和构建后的前端静态文件；服务固定监听 `0.0.0.0:3020`，业务数据、导入文件、导出文件和备份均落在项目根目录 `.data/pit/`。前端复用现有 TypeScript + Vite + Tailwind 壳层，通过独立 `pit` Shell、PIT 本地账号和 HttpOnly 会话访问 REST API。开发态由 Vite 把 `/api/v1/pit` 代理到 3020。

**Tech Stack:** Node.js 24 (`node:http`, `node:sqlite`, `node:crypto`)、ExcelJS 4.4、TypeScript 5.6、Vite 6、Tailwind CSS 4、SQLite。

**Spec:** `docs/superpowers/specs/2026-08-31-pit-requirement-pool-design.md`

## Global Constraints

- 使用项目固定的 Node.js 24 运行时；不得使用系统 Node 23 执行 PIT 数据库、测试或服务命令。
- 不修改 `vendor/emenu-new`。若实现过程中确实修改了该目录，必须从项目根目录执行 `npm run build:emenu-new-embed -- --skip-install`，并按 `AGENTS.md` 校验 `dist/emenu-new/index.html` 与 `.emenu-embed-build.json`。
- 保留当前脏工作树中的用户改动；每次提交只包含本任务明确列出的文件。
- PIT 路由必须在 `src/main.ts` 的商家后台 `isAuthenticated()` 门禁之前处理，使局域网用户只需 PIT 本地账号。
- API 成功响应固定为 `{ data, meta }`，失败响应固定为 `{ error: { code, message, fields?, requestId } }`。
- 所有已登录写请求同时校验 PIT 会话、当前用户状态、角色、`Origin` 和 `X-CSRF-Token`；公开的 login 与 bootstrap 写请求校验 `Origin`，bootstrap 另外校验一次性 token，但二者不要求尚不存在的会话/CSRF token。
- `POST /imports/preview`、`POST /imports/:id/decisions`、`POST /imports/:id/commit` 三个导入写端点必须分别调用 `assertInitialImportOpen()`；不能只在 commit 检查。
- 普通更新和状态动作必须用 `rowVersion` 做乐观锁；任何 409 都不得由前端自动覆盖。
- 所有删除需求均为软删除；默认列表、摘要、导出和关联查询都排除 `deleted_at IS NOT NULL`。
- 只导入 `Kiosk`、`E-Menu`、`TipOut`、`PayRoll`、`云报表`、`壳子`、`PayPad`、`新B平台`、`其他` 九张标准需求表；`重点需求` 只参与重点标记，其余工作表明确记录为忽略。
- 正常状态转换矩阵固定为：

  | action | from | to | reason |
  | --- | --- | --- | --- |
  | `advance` | `review_pending` | `design_pending` | 可选 |
  | `advance` | `design_pending` | `scheduling_pending` | 可选 |
  | `advance` | `scheduling_pending` | `development` | 可选 |
  | `advance` | `development` | `testing` | 可选 |
  | `advance` | `testing` | `completed` | 可选 |
  | `return` | `design_pending`、`scheduling_pending`、`development`、`testing` | `review_pending` | 必填 |
  | `pause` | 六个正常状态 | `paused` | 必填，保存 `paused_from_status` |
  | `resume` | `paused` | `paused_from_status` | 可选 |
  | `reject` | 六个正常状态或 `paused` | `rejected` | 必填 |
  | `reopen` | `rejected`、`completed` | `review_pending` | 必填，仅管理员 |

- 每完成一个任务，先运行该任务的定向验证，再运行此前所有 `verify:pit-*`，最后只提交该任务文件。

---

## Task 1: Establish the PIT dependency, data directory, and SQLite foundation

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `server/pit/pit-config.mjs`
- Create: `server/pit/pit-database.mjs`
- Create: `server/pit/migrations/001-initial.sql`
- Create: `scripts/verify-pit-database.mjs`

- [ ] **Step 1: Install the workbook dependency and register the first verification command**

  Run:

  ```powershell
  npm.cmd install exceljs@4.4.0 --save
  ```

  Add this script to `package.json`:

  ```json
  "verify:pit-database": "node scripts/verify-pit-database.mjs"
  ```

- [ ] **Step 2: Ignore runtime data without hiding source fixtures**

  Append to `.gitignore`:

  ```gitignore
  # PIT local runtime data (database, uploads, exports, backups)
  .data/pit/
  ```

- [ ] **Step 3: Write the failing database verification**

  `scripts/verify-pit-database.mjs` must create a temp directory, open a new database, and assert all of the following:

  ```js
  import assert from "node:assert/strict";
  import fs from "node:fs";
  import os from "node:os";
  import path from "node:path";
  import { openPitDatabase } from "../server/pit/pit-database.mjs";

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pit-db-"));
  const db = openPitDatabase({ dataDir: root, backupBeforeMigrate: false });
  assert.equal(db.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
  assert.equal(db.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
  for (const name of ["users", "sessions", "requirements", "requirement_product_lines", "requirement_assignees", "requirement_mids", "requirement_followers", "dictionaries", "audit_events", "import_jobs", "import_rows", "export_jobs", "backup_records", "system_settings"]) assert(tables.has(name), `missing ${name}`);
  assert.equal(db.prepare("SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1").get().version, 1);
  db.close();
  fs.rmSync(root, { recursive: true, force: true });
  ```

- [ ] **Step 4: Run the verification and confirm it fails for the missing module**

  Run: `npm.cmd run verify:pit-database`

  Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `server/pit/pit-database.mjs`.

- [ ] **Step 5: Implement deterministic runtime path resolution**

  `server/pit/pit-config.mjs` must export:

  ```js
  export function resolvePitConfig(env = process.env, projectRoot = process.cwd()) {
    const dataDir = path.resolve(env.PIT_DATA_DIR || path.join(projectRoot, ".data", "pit"));
    return {
      host: env.PIT_HOST || "0.0.0.0",
      port: Number(env.PIT_PORT || 3020),
      dataDir,
      dbPath: path.join(dataDir, "pit.sqlite3"),
      importsDir: path.join(dataDir, "imports"),
      exportsDir: path.join(dataDir, "exports"),
      backupsDir: path.join(dataDir, "backups"),
      distDir: path.resolve(env.PIT_DIST_DIR || path.join(projectRoot, "dist")),
    };
  }
  ```

- [ ] **Step 6: Define the complete first migration**

  `001-initial.sql` must create the following tables and indexes with foreign keys: `schema_migrations`, `system_settings`, `users`, `sessions`, `dictionaries`, `requirements`, `requirement_product_lines`, `requirement_mids`, `requirement_assignees`, `requirement_followers`, `audit_events`, `import_jobs`, `import_rows`, `export_jobs`, `backup_records`.

  Enforce these database invariants in SQL:

  ```sql
  CREATE UNIQUE INDEX users_username_unique ON users(lower(username));
  CREATE UNIQUE INDEX requirements_number_unique ON requirements(requirement_no);
  CREATE INDEX requirements_active_updated_idx ON requirements(deleted_at, updated_at DESC);
  CREATE INDEX requirements_jira_idx ON requirements(jira_ticket);
  CREATE UNIQUE INDEX dictionaries_type_code_unique ON dictionaries(type, code);
  CREATE UNIQUE INDEX followers_unique ON requirement_followers(requirement_id, user_id);
  CREATE INDEX sessions_id_hash_idx ON sessions(id_hash);
  CREATE INDEX audit_resource_idx ON audit_events(resource_type, resource_id, created_at DESC);
  ```

  Use this exact column contract for the non-migration tables; add only foreign-key clauses, check constraints, and indexes needed to enforce it:

  ```text
  system_settings(key TEXT PK, value_json TEXT NOT NULL, updated_at TEXT NOT NULL)
  users(id TEXT PK, username TEXT NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK admin/editor/viewer, active INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)
  sessions(id_hash TEXT PK, user_id TEXT NOT NULL FK users, csrf_hash TEXT NOT NULL, expires_at TEXT NOT NULL, absolute_expires_at TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL)
  dictionaries(id TEXT PK, type TEXT NOT NULL, code TEXT NOT NULL, label TEXT NOT NULL, sort_order INTEGER NOT NULL, active INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)
  requirements(id TEXT PK, requirement_no TEXT NOT NULL, jira_ticket TEXT, title TEXT NOT NULL, description TEXT NOT NULL, use_case TEXT, notes TEXT, status TEXT NOT NULL, priority TEXT, requirement_type_id TEXT FK dictionaries, source_id TEXT FK dictionaries, problem_category_id TEXT FK dictionaries, industry_id TEXT FK dictionaries, customer_manager TEXT, implementation_side TEXT, proposed_at TEXT, planned_year INTEGER, planned_month INTEGER, version_no TEXT, development_started_at TEXT, development_completed_at TEXT, pos_merge_version TEXT, is_highlighted INTEGER NOT NULL, paused_from_status TEXT, source_sheet TEXT, source_row INTEGER, source_status TEXT, import_job_id TEXT FK import_jobs, row_version INTEGER NOT NULL DEFAULT 1, deleted_at TEXT, deleted_by TEXT FK users, created_by TEXT NOT NULL FK users, updated_by TEXT NOT NULL FK users, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)
  requirement_product_lines(requirement_id TEXT FK requirements, dictionary_id TEXT FK dictionaries, PRIMARY KEY(requirement_id, dictionary_id))
  requirement_mids(requirement_id TEXT FK requirements, mid TEXT NOT NULL, PRIMARY KEY(requirement_id, mid))
  requirement_assignees(id TEXT PK, requirement_id TEXT FK requirements, role TEXT NOT NULL CHECK owner/developer/tester, user_id TEXT FK users, display_name TEXT NOT NULL, sort_order INTEGER NOT NULL)
  requirement_followers(requirement_id TEXT FK requirements, user_id TEXT FK users, created_at TEXT NOT NULL, PRIMARY KEY(requirement_id, user_id))
  audit_events(id TEXT PK, actor_user_id TEXT FK users, action TEXT NOT NULL, resource_type TEXT NOT NULL, resource_id TEXT, before_json TEXT, after_json TEXT, metadata_json TEXT, created_at TEXT NOT NULL)
  import_jobs(id TEXT PK, file_name TEXT NOT NULL, file_hash TEXT NOT NULL, status TEXT NOT NULL, summary_json TEXT NOT NULL, source_path TEXT, error_message TEXT, created_by TEXT NOT NULL FK users, created_at TEXT NOT NULL, committed_at TEXT)
  import_rows(id TEXT PK, import_job_id TEXT NOT NULL FK import_jobs, sheet_name TEXT NOT NULL, row_number INTEGER NOT NULL, raw_json TEXT NOT NULL, normalized_json TEXT NOT NULL, issue_json TEXT NOT NULL, decision_json TEXT)
  export_jobs(id TEXT PK, filter_json TEXT NOT NULL, row_count INTEGER, file_name TEXT, status TEXT NOT NULL, error_message TEXT, created_by TEXT NOT NULL FK users, created_at TEXT NOT NULL, completed_at TEXT, expires_at TEXT)
  backup_records(id TEXT PK, kind TEXT NOT NULL, file_name TEXT NOT NULL, manifest_name TEXT NOT NULL, sha256 TEXT NOT NULL, byte_size INTEGER NOT NULL, schema_version INTEGER NOT NULL, created_by TEXT FK users, created_at TEXT NOT NULL)
  ```

  Add a partial unique index that allows at most one `owner` assignee per requirement. All traceability and audit foreign keys must use `ON DELETE RESTRICT`; junction rows may use `ON DELETE CASCADE` only when their parent requirement/user still exists.

- [ ] **Step 7: Implement database opening, migration, and transaction helpers**

  `pit-database.mjs` must use `DatabaseSync` and export:

  ```js
  export function openPitDatabase({ dataDir, backupBeforeMigrate = true, logger = console })
  export function withImmediateTransaction(db, operation)
  export function getSystemSetting(db, key)
  export function setSystemSetting(db, key, value)
  ```

  On open, create runtime directories and execute:

  ```js
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;");
  ```

  Apply migration files in lexical order and insert their numeric version in `schema_migrations` inside the same immediate transaction. If an existing database needs a migration and `backupBeforeMigrate` is true, call the backup hook before executing SQL.

- [ ] **Step 8: Run the database verification**

  Run: `npm.cmd run verify:pit-database`

  Expected: PASS and process exits 0.

- [ ] **Step 9: Commit the SQLite foundation**

  ```powershell
  git add -- package.json package-lock.json .gitignore server/pit/pit-config.mjs server/pit/pit-database.mjs server/pit/migrations/001-initial.sql scripts/verify-pit-database.mjs
  git commit -m "feat: establish PIT sqlite foundation"
  ```

---

## Task 2: Implement setup, authentication, request security, and the API test harness

**Files:**

- Create: `server/pit/pit-errors.mjs`
- Create: `server/pit/pit-http.mjs`
- Create: `server/pit/pit-auth-service.mjs`
- Create: `server/pit/pit-router.mjs`
- Create: `scripts/lib/pit-test-server.mjs`
- Create: `scripts/verify-pit-auth-api.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add the failing auth API verification**

  Cover setup status, invalid bootstrap token, successful one-time admin bootstrap, closed bootstrap, rate-limited login failures, login cookie, `/auth/me`, rejected missing CSRF, logout, expired session, disabled user, and role refresh. Use a real ephemeral HTTP server and a temporary SQLite database.

  The happy-path assertions must include:

  ```js
  const login = await client.post("/auth/login", { username: "admin", password: "PIT-admin-2026" });
  assert.equal(login.status, 200);
  assert.match(login.headers.get("set-cookie"), /pit_session=.*HttpOnly.*SameSite=Strict/i);
  const me = await client.get("/auth/me");
  assert.equal(me.body.data.user.role, "admin");
  assert.match(me.body.data.csrfToken, /^[a-f0-9]{64}$/);
  const noCsrf = await client.post("/auth/logout");
  assert.equal(noCsrf.status, 403);
  ```

- [ ] **Step 2: Run the auth verification and confirm it fails**

  Run: `node scripts/verify-pit-auth-api.mjs`

  Expected: FAIL because router and test server modules do not exist.

- [ ] **Step 3: Implement uniform API errors and HTTP primitives**

  `pit-errors.mjs` must export `PitApiError` and helpers for 400/401/403/404/409/413/415/422/503.

  `pit-http.mjs` must export:

  ```js
  export async function readJson(req, { maxBytes = 1024 * 1024 } = {})
  export async function readBinary(req, { maxBytes })
  export function sendData(res, requestId, data, meta = {})
  export function sendError(res, requestId, error)
  export function parseCookies(req)
  export function setSessionCookie(res, token, maxAgeSeconds)
  export function clearSessionCookie(res)
  export function assertSameOrigin(req)
  ```

  Reject malformed JSON with 400, excessive bodies with 413, and an `Origin` whose host/port differs from the request `Host` with 403.

- [ ] **Step 4: Implement password hashing, sessions, bootstrap, and login throttling**

  `pit-auth-service.mjs` must use `crypto.scrypt`, random 16-byte salts, random 32-byte session tokens, and SHA-256 token hashes. Export:

  ```js
  export function createPitAuthService({ db, setupToken, clock = () => new Date(), randomBytes = crypto.randomBytes }) {
    return {
      setupStatus, bootstrap, login, logout, authenticate, assertCsrf, requireRole,
      createUser, updateUser, resetPassword, revokeAllSessions,
    };
  }
  ```

  Sessions expire after 12 idle hours and no later than 7 days after creation. Each authenticated request reloads the user row so disabled accounts and role changes take effect immediately. Keep login-attempt windows in a process-local `Map` keyed by normalized `username + sourceIp`; five failed attempts within 15 minutes return 429 for the remainder of that window, successful login clears the key, and expired keys are removed opportunistically. Do not reveal whether the username exists.

- [ ] **Step 5: Implement the router and its middleware order**

  `createPitRouter({ db, config, setupToken, logger, clock })` must return an async `(req, res) => boolean`. Route order:

  1. assign `requestId`;
  2. handle `GET /setup/status`, `POST /setup/bootstrap`, `POST /auth/login`, `GET /health` as public routes, while still calling `assertSameOrigin` for the two public POST routes;
  3. authenticate remaining `/api/v1/pit/*` routes;
  4. for non-GET/HEAD requests, call `assertSameOrigin` and `auth.assertCsrf`;
  5. dispatch route-specific role checks;
  6. convert all thrown errors to the common envelope.

- [ ] **Step 6: Build the reusable cookie-aware test server**

  `scripts/lib/pit-test-server.mjs` must export `startPitTestServer()` returning `{ baseUrl, client, db, dataDir, close }`. Its client must retain the latest `pit_session` cookie and accept `{ csrf: true }` to send `X-CSRF-Token` and a matching `Origin`.

- [ ] **Step 7: Register and run the auth verification**

  Add:

  ```json
  "verify:pit-auth-api": "node scripts/verify-pit-auth-api.mjs"
  ```

  Run: `npm.cmd run verify:pit-auth-api`

  Expected: PASS.

- [ ] **Step 8: Run all PIT checks and commit**

  ```powershell
  npm.cmd run verify:pit-database
  npm.cmd run verify:pit-auth-api
  git add -- package.json server/pit/pit-errors.mjs server/pit/pit-http.mjs server/pit/pit-auth-service.mjs server/pit/pit-router.mjs scripts/lib/pit-test-server.mjs scripts/verify-pit-auth-api.mjs
  git commit -m "feat: add PIT local authentication API"
  ```

---

## Task 3: Implement requirement CRUD, filters, following, state transitions, and audit

**Files:**

- Create: `server/pit/pit-requirement-service.mjs`
- Create: `server/pit/pit-audit-service.mjs`
- Modify: `server/pit/pit-router.mjs`
- Create: `scripts/verify-pit-requirements-api.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing requirement API verification**

  Seed admin, editor, viewer, dictionaries, and at least six requirements. Assert:

  - editor creates and edits requirements with one owner plus multiple developers/testers;
  - viewer can read but receives 403 on create, edit, follow, transition, delete, and restore;
  - `q`, every repeated multi-select filter, date range, `mine`, `followed`, sort whitelist, page limits, and total work;
  - follow/unfollow is idempotent for admin/editor;
  - `PATCH` and transition return 409 with submitted/current versions when stale;
  - soft-deleted rows are excluded from list, summary candidates, follow lookup, and default detail;
  - only admin can use `deleted=only|include`, delete, restore, and reopen;
  - every successful mutation writes one redacted audit event.

- [ ] **Step 2: Encode the entire transition matrix as table-driven failing tests**

  Use this exact case table:

  ```js
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
  ```

  Also test every invalid `action/from/targetStatus` combination, missing required reasons, resume without a valid `paused_from_status`, and editor attempting `reopen`.

- [ ] **Step 3: Run the verification and confirm it fails**

  Run: `node scripts/verify-pit-requirements-api.mjs`

  Expected: FAIL with requirement routes returning 404.

- [ ] **Step 4: Implement audit event creation**

  `pit-audit-service.mjs` must expose `recordAuditEvent(db, event)` and `listAuditEvents(db, query)`. Store only resource identifiers, action, actor, timestamps, before/after JSON with password/token fields removed, and state-transition reason.

- [ ] **Step 5: Implement the requirement service with transactional relations**

  `pit-requirement-service.mjs` must export:

  ```js
  export function createPitRequirementService({ db, clock = () => new Date() }) {
    return {
      list(query, actor),
      getById(id, actor),
      create(input, actor),
      update(id, input, actor),
      transition(id, input, actor),
      softDelete(id, actor),
      restore(id, actor),
      follow(id, actor),
      unfollow(id, actor),
    };
  }
  ```

  Generate `REQ-000001` numbers transactionally. For update, replace product-line/MID/assignment relations inside the same transaction as the main row and audit event. Compile filters from a fixed map; never concatenate client-provided column names. `mine=true` must match owner/developer/tester assignments by `user_id`; `followed=true` must join `requirement_followers` by the current user.

- [ ] **Step 6: Implement state actions from one server-owned transition function**

  Export `resolvePitTransition({ action, status, targetStatus, pausedFromStatus, actorRole, reason })` for direct testing. It must ignore client attempts to set a status through PATCH, validate the matrix in Global Constraints, preserve pause origin, clear it on resume/reject/reopen, and increment `row_version` exactly once.

- [ ] **Step 7: Add the CRUD routes and role policies**

  Add all routes from spec 9.3 and 9.4 to `pit-router.mjs`. Ensure encoded IDs are decoded once, malformed page/sort/filter input returns 400/422, and a deleted requirement behaves as 404 except through administrator trash routes.

- [ ] **Step 8: Register and run the requirement verification**

  Add:

  ```json
  "verify:pit-requirements-api": "node scripts/verify-pit-requirements-api.mjs"
  ```

  Run: `npm.cmd run verify:pit-requirements-api`

  Expected: PASS.

- [ ] **Step 9: Run the PIT regression set and commit**

  ```powershell
  npm.cmd run verify:pit-database
  npm.cmd run verify:pit-auth-api
  npm.cmd run verify:pit-requirements-api
  git add -- package.json server/pit/pit-requirement-service.mjs server/pit/pit-audit-service.mjs server/pit/pit-router.mjs scripts/verify-pit-requirements-api.mjs
  git commit -m "feat: implement PIT requirement lifecycle API"
  ```

---

## Task 4: Implement dashboard, dictionaries, users, audit-log, and health APIs

**Files:**

- Create: `server/pit/pit-admin-service.mjs`
- Modify: `server/pit/pit-router.mjs`
- Create: `scripts/verify-pit-admin-api.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing administration API verification**

  Cover:

  - summary counts by normalized status, highlighted, mine, followed, and overdue planned date;
  - all roles can read active dictionaries;
  - only admin can add/reorder/deactivate dictionary values;
  - used dictionary values cannot be hard-deleted and remain readable on historical requirements;
  - only admin can create users, change roles, disable users, reset passwords, and revoke all sessions;
  - changing role is visible on the next request and disabling/resetting removes existing sessions;
  - audit query filters by actor/object/action/date;
  - `/health` reports process/database/backup state without filesystem paths, token values, usernames, or hashes.

- [ ] **Step 2: Run the verification and confirm it fails**

  Run: `node scripts/verify-pit-admin-api.mjs`

  Expected: FAIL because admin routes are absent.

- [ ] **Step 3: Implement the administration service**

  `pit-admin-service.mjs` must export methods `dashboardSummary`, `listDictionaries`, `createDictionaryItem`, `updateDictionaryItem`, `reorderDictionaryItems`, `listUsers`, `createUser`, `updateUser`, `resetUserPassword`, `listAuditLog`, and `health`.

  Dictionary types are fixed to `product_line`, `requirement_source`, `requirement_type`, `problem_category`, `industry`. Priority remains the fixed `urgent/high/medium/low` enum. Codes are immutable after creation; labels, sort order, and active state are editable.

- [ ] **Step 4: Add exact administration routes**

  Add:

  ```text
  GET  /api/v1/pit/dashboard/summary
  GET  /api/v1/pit/dictionaries
  POST /api/v1/pit/dictionaries
  PATCH /api/v1/pit/dictionaries/:id
  PUT  /api/v1/pit/dictionaries/order
  GET  /api/v1/pit/users
  POST /api/v1/pit/users
  PATCH /api/v1/pit/users/:id
  POST /api/v1/pit/users/:id/reset-password
  POST /api/v1/pit/users/:id/revoke-sessions
  GET  /api/v1/pit/audit-log
  GET  /api/v1/pit/health
  ```

- [ ] **Step 5: Register and run the administration verification**

  Add `"verify:pit-admin-api": "node scripts/verify-pit-admin-api.mjs"` and run `npm.cmd run verify:pit-admin-api`.

  Expected: PASS.

- [ ] **Step 6: Run the PIT regression set and commit**

  ```powershell
  npm.cmd run verify:pit-database
  npm.cmd run verify:pit-auth-api
  npm.cmd run verify:pit-requirements-api
  npm.cmd run verify:pit-admin-api
  git add -- package.json server/pit/pit-admin-service.mjs server/pit/pit-router.mjs scripts/verify-pit-admin-api.mjs
  git commit -m "feat: add PIT administration APIs"
  ```

---

## Task 5: Implement filtered Excel export and recoverable SQLite backups

**Files:**

- Create: `server/pit/pit-backup-service.mjs`
- Create: `server/pit/pit-export-service.mjs`
- Create: `server/pit-restore.mjs`
- Modify: `server/pit/pit-router.mjs`
- Create: `scripts/verify-pit-export-backup.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing export and backup verification**

  Assert:

  - export applies the exact requirement-list filter parser rather than a second interpretation;
  - workbook columns use the approved 22-field order and include normalized plus source statuses;
  - exports exclude deleted rows unless an admin explicitly filters trash;
  - viewer can export and download only their own job; admin can use `scope=all`;
  - expired downloads return `410 export_expired` while history remains;
  - startup, migration, daily, pre-import, and manual backup kinds write `.sqlite3` plus `.manifest.json` with SHA-256, size, schema version, and timestamp;
  - retention keeps 14 daily and 5 operation backups, never deleting manual backups;
  - restore first backs up the current database and rejects a corrupt or wrong-schema source.

- [ ] **Step 2: Run the verification and confirm it fails**

  Run: `node scripts/verify-pit-export-backup.mjs`

  Expected: FAIL because export/backup modules are absent.

- [ ] **Step 3: Implement SQLite backup creation and retention**

  `pit-backup-service.mjs` must use `node:sqlite` `backup()` and export:

  ```js
  export async function createPitBackup({ db, config, kind, actorId = null, clock = () => new Date() })
  export function listPitBackups({ db })
  export function enforcePitBackupRetention({ db, config })
  export function scheduleDailyPitBackup({ db, config, logger, clock })
  export async function verifyPitBackup(filePath, expectedSchemaVersion)
  ```

  Use backup kind values `startup`, `migration`, `pre_import`, `daily`, `manual`, `pre_restore`. Never expose the physical source database path through API responses.

- [ ] **Step 4: Implement filtered workbook export**

  `pit-export-service.mjs` must import the same `parseRequirementListQuery` and SQL builder used by the list endpoint. Generate a worksheet named `PIT需求池`, freeze its header, enable filters, and write columns in this order:

  ```js
  export const PIT_EXPORT_COLUMNS = [
    "提出时间", "实现月份", "实现年度", "Jira Ticket", "需求描述", "产品需求名称",
    "使用场景描述", "补充说明", "需求来源", "需求类别", "状态", "产品线", "前后端",
    "研发", "优先级", "问题分类", "MID", "版本号", "研发开始时间", "研发完成时间", "测试", "合入POS",
  ];
  ```

  Store job metadata before writing, set `completed_at` and 24-hour `expires_at` only after a valid workbook is closed, and set `status=failed` with a readable error when generation fails.

- [ ] **Step 5: Add export and backup routes**

  Implement every endpoint from spec 9.7. File downloads must set a safe `Content-Disposition` file name and stream only a path resolved inside the configured export/backup directory.

- [ ] **Step 6: Implement the offline restore command**

  `server/pit-restore.mjs` accepts exactly one backup file argument, resolves and validates it, stops if `pit.sqlite3` is locked, creates `pre_restore`, closes the database, replaces it, runs `PRAGMA integrity_check`, checks schema version, and restores the prior database automatically if validation fails.

- [ ] **Step 7: Register commands and run verification**

  Add:

  ```json
  "pit:restore": "node server/pit-restore.mjs",
  "verify:pit-export-backup": "node scripts/verify-pit-export-backup.mjs"
  ```

  Run: `npm.cmd run verify:pit-export-backup`

  Expected: PASS.

- [ ] **Step 8: Run regression checks and commit**

  ```powershell
  npm.cmd run verify:pit-requirements-api
  npm.cmd run verify:pit-admin-api
  npm.cmd run verify:pit-export-backup
  git add -- package.json server/pit/pit-backup-service.mjs server/pit/pit-export-service.mjs server/pit-restore.mjs server/pit/pit-router.mjs scripts/verify-pit-export-backup.mjs
  git commit -m "feat: add PIT export and backup workflows"
  ```

---

## Task 6: Implement the guarded one-time Excel import

**Files:**

- Create: `server/pit/pit-import-parser.mjs`
- Create: `server/pit/pit-import-service.mjs`
- Create: `scripts/lib/pit-test-workbook.mjs`
- Modify: `server/pit/pit-router.mjs`
- Create: `scripts/verify-pit-import.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create a deterministic workbook fixture builder**

  `scripts/lib/pit-test-workbook.mjs` must use ExcelJS to generate, in a temp directory:

  - all nine standard sheets with the approved 22 headers;
  - a `重点需求` sheet referencing one Jira ticket;
  - one valid row, one missing-ticket row, two duplicate-ticket rows, one unknown status, one unknown dictionary value, one date serial, and one formula cell with a cached value;
  - one auxiliary sheet named `原始数据（测试用）` that must be ignored.

- [ ] **Step 2: Write the failing import verification**

  Cover preview summaries, exact sheet allowlist, field normalization, Excel dates, cached formula values, unknown status mapping, dictionary suggestions, missing tickets, duplicate groups, highlight matching, ignored sheets, file hash, 50 MB limit, wrong MIME/extension, malformed workbook cleanup, decision persistence, transactional commit, pre-import backup, and rollback on an injected database error.

  The one-time lock assertions are mandatory:

  ```js
  for (const mutation of [
    () => client.rawWorkbook("/imports/preview", workbookPath),
    () => client.post(`/imports/${previewId}/decisions`, decisionBody, { csrf: true }),
    () => client.post(`/imports/${previewId}/commit`, {}, { csrf: true }),
  ]) {
    const response = await mutation();
    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, "initial_import_completed");
  }
  ```

- [ ] **Step 3: Run the import verification and confirm it fails**

  Run: `node scripts/verify-pit-import.mjs`

  Expected: FAIL because import modules are absent.

- [ ] **Step 4: Implement a pure workbook parser**

  `pit-import-parser.mjs` must export:

  ```js
  export const PIT_STANDARD_SHEETS = ["Kiosk", "E-Menu", "TipOut", "PayRoll", "云报表", "壳子", "PayPad", "新B平台", "其他"];
  export const PIT_SOURCE_HEADERS = ["提出时间", "实现月份", "实现年度", "Jira Ticket", "需求描述", "产品需求名称", "使用场景描述", "补充说明", "需求来源", "需求类别", "状态", "产品线", "前后端", "研发", "优先级", "问题分类", "MID", "版本号", "研发开始时间", "研发完成时间", "测试", "合入POS"];
  export async function parsePitWorkbook(filePath)
  export function suggestNormalizedStatus(sourceStatus)
  ```

  Trim full-width/half-width whitespace, preserve unrecognized source text, split personnel/MID values without losing the original cell, map dates to ISO dates, and never evaluate formulas. If a formula lacks a cached result, add a blocking issue.

- [ ] **Step 5: Implement preview, decisions, and atomic commit**

  `pit-import-service.mjs` must export:

  ```js
  export function assertInitialImportOpen(db)
  export function createPitImportService({ db, config, backupService, clock = () => new Date() }) {
    return { preview, get, list, saveDecisions, commit };
  }
  ```

  `preview` copies the raw upload under `.data/pit/imports/{jobId}.xlsx`, hashes it, parses it, and persists rows/issues. `saveDecisions` supports `keep_separate`, `merge`, `skip`, status mappings, and dictionary mappings. `commit` first creates a `pre_import` backup, then writes requirements, relations, newly accepted dictionaries, highlight flags, audit events, job status, and `initial_import_completed_at` in one immediate transaction.

- [ ] **Step 6: Add the exact raw-upload contract and guarded routes**

  `POST /api/v1/pit/imports/preview` accepts the workbook bytes directly with:

  ```http
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  X-PIT-File-Name: CF-%E5%91%A8%E8%BE%B9%E4%BA%A7%E5%93%81-PIT-%E9%9C%80%E6%B1%82%E6%B1%A0.xlsx
  X-CSRF-Token: 5d4e3a9c1f8b7e6214a1d2ce6b30f8a9a9e075c8d8fb6bbf4686fae411bff110
  ```

  Decode the filename once, strip path components, require `.xlsx`, cap the body at 50 MB, and remove a partial file on any error. Call `assertInitialImportOpen(db)` at the start of preview, decisions, and commit handlers.

- [ ] **Step 7: Register and run the import verification**

  Add `"verify:pit-import": "node scripts/verify-pit-import.mjs"` and run `npm.cmd run verify:pit-import`.

  Expected: PASS.

- [ ] **Step 8: Run backend regression checks and commit**

  ```powershell
  npm.cmd run verify:pit-database
  npm.cmd run verify:pit-auth-api
  npm.cmd run verify:pit-requirements-api
  npm.cmd run verify:pit-admin-api
  npm.cmd run verify:pit-export-backup
  npm.cmd run verify:pit-import
  git add -- package.json server/pit/pit-import-parser.mjs server/pit/pit-import-service.mjs server/pit/pit-router.mjs scripts/lib/pit-test-workbook.mjs scripts/verify-pit-import.mjs
  git commit -m "feat: add guarded PIT initial workbook import"
  ```

---

## Task 7: Deliver the LAN production server and Vite development proxy

**Files:**

- Create: `server/pit-api-server.mjs`
- Create: `server/run-pit-dev.mjs`
- Modify: `vite.config.ts`
- Modify: `package.json`
- Create: `scripts/verify-pit-server.mjs`

- [ ] **Step 1: Write the failing server integration verification**

  Start the server with a temp `PIT_DATA_DIR`, temporary copied `dist`, `PIT_HOST=127.0.0.1`, and `PIT_PORT=0`. Assert `/api/v1/pit/health`, `/`, an existing asset, SPA fallback, missing API 404 envelope, path traversal rejection, startup backup, and graceful SIGTERM database close.

- [ ] **Step 2: Run the server verification and confirm it fails**

  Run: `node scripts/verify-pit-server.mjs`

  Expected: FAIL because `server/pit-api-server.mjs` does not exist.

- [ ] **Step 3: Implement one process for API and static frontend**

  `pit-api-server.mjs` must:

  - require Node 24 or newer before opening SQLite;
  - resolve config, open the DB, generate/print a one-time setup token only when no users exist;
  - create and verify a startup backup before accepting requests;
  - dispatch `/api/v1/pit/*` to `createPitRouter`;
  - serve only files resolved inside `distDir`, with correct MIME types and `Cache-Control` (`no-cache` for `index.html`, immutable for hashed assets);
  - use `dist/index.html` as SPA fallback for non-API GET/HEAD requests;
  - listen on `0.0.0.0:3020` by default and print localhost plus discovered private IPv4 LAN URLs;
  - close timers, HTTP server, and database on SIGINT/SIGTERM.

- [ ] **Step 4: Add Vite proxy and coordinated dev runner**

  In `vite.config.ts`, add `usePitApiProxy = process.env.PIT_USE_API_PROXY === "1"` and proxy `/api/v1/pit` to `http://127.0.0.1:3020` only when enabled.

  `run-pit-dev.mjs` starts the API on 3020 and Vite with `PIT_USE_API_PROXY=1`, forwards termination to both, and exits nonzero when either child fails.

- [ ] **Step 5: Register operational commands**

  Add:

  ```json
  "pit:start": "node server/pit-api-server.mjs",
  "dev:pit": "node server/run-pit-dev.mjs",
  "verify:pit-server": "node scripts/verify-pit-server.mjs"
  ```

- [ ] **Step 6: Run server and existing build verification**

  ```powershell
  npm.cmd run verify:pit-server
  npm.cmd run build
  ```

  Expected: both PASS. Do not run the eMenu embed build because this task does not modify `vendor/emenu-new`.

- [ ] **Step 7: Commit the runtime integration**

  ```powershell
  git add -- package.json vite.config.ts server/pit-api-server.mjs server/run-pit-dev.mjs scripts/verify-pit-server.mjs
  git commit -m "feat: serve PIT across the local network"
  ```

---

## Task 8: Add the PIT shell mode, floating entry, standalone login, and route ownership

**Files:**

- Modify: `src/shell/app-shell-mode.ts`
- Modify: `src/shell/peripheral-products-control.ts`
- Modify: `src/i18n.ts`
- Modify: `src/main.ts`
- Create: `src/pit/pit-routes.ts`
- Create: `src/pit/pit-types.ts`
- Create: `src/pit/pit-api-error.ts`
- Create: `src/pit/pit-api.ts`
- Create: `src/pit/pit-session.ts`
- Create: `src/pit/pit-login-page.ts`
- Create: `src/pit/pit-setup-page.ts`
- Create: `src/pit/pit-shell.ts`
- Create: `scripts/verify-pit-shell.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing shell contract verification**

  Assert source contracts for:

  - `AppShellMode` includes `pit` with enter/exit/is functions;
  - peripheral flat cards and popup both place PIT immediately after Kiosk and change count from 2 to 3;
  - click sets PIT mode and `#/pit/dashboard`;
  - direct `#/pit/*` mounts PIT before merchant authentication;
  - eMenu, Kiosk, and M-platform fallback conditions explicitly exclude PIT content;
  - PIT unauthenticated view renders PIT login/setup, not merchant login;
  - viewer navigation omits users, dictionaries, audit, trash, and backups;
  - stable DOM markers exist for shell, navigation, login, setup, offline banner, and user menu.

- [ ] **Step 2: Run the shell verification and confirm it fails**

  Run: `node scripts/verify-pit-shell.mjs`

  Expected: FAIL because PIT shell files and mode are absent.

- [ ] **Step 3: Add PIT mode and third peripheral-product entry**

  Extend product unions in both shell mode and peripheral control to `"pit"`. Update both card and menu renderers, active labels, click bindings, i18n labels/hints/counts, and import `PIT_DEFAULT_PATH`.

- [ ] **Step 4: Define the complete PIT route table**

  `pit-routes.ts` must support:

  ```ts
  export const PIT_DEFAULT_PATH = "/pit/dashboard";
  export type PitRouteId = "dashboard" | "requirements" | "requirement-new" | "requirement-detail" | "imports" | "exports" | "dictionaries" | "users" | "audit-log" | "trash" | "backups";
  export function isPitContentPath(path: string): boolean;
  export function matchPitRoute(path: string): { id: PitRouteId; requirementId?: string };
  export function canAccessPitRoute(route: PitRouteId, role: PitRole): boolean;
  ```

  Public shell auth states are not hash routes: the shell decides between setup, login, and authenticated workspace from `/setup/status` and `/auth/me`.

- [ ] **Step 5: Implement typed API transport and session state**

  `pit-types.ts` defines all request/response contracts from spec section 9, including roles, status enums, list query, row version, import decisions, export jobs, users, dictionaries, audits, and health.

  `pit-api.ts` must call `fetch` with `credentials: "same-origin"`, attach `X-CSRF-Token` for writes, parse the common envelope, throw `PitApiError`, upload workbooks as raw bytes with the exact headers from Task 6, and expose one method per API endpoint.

  `pit-session.ts` keeps authenticated user and CSRF token in memory only; never use localStorage/sessionStorage for credentials.

- [ ] **Step 6: Implement setup and login states**

  Setup form asks for initialization token, username, display name, and password. Login asks for username/password. Both submit through `pitApi`, render field/server errors without revealing credential details, and route to the preserved PIT query after success.

- [ ] **Step 7: Mount PIT before the merchant auth gate**

  Move `const authPath = location.hash.slice(1) || "";` above the merchant auth check. Add a PIT branch before `if (!isAuthenticated())`:

  ```ts
  if (isPitContentPath(authPath) || isPitShellMode()) {
    const normalized = normalizePitPath(authPath);
    if (!isPitContentPath(authPath)) return replaceHashPath(PIT_DEFAULT_PATH);
    if (!isPitShellMode()) enterPitShell();
    app.innerHTML = await mountPitShell(mount, normalized);
    bindPitShell(mount);
    return;
  }
  ```

  Adapt this to the existing synchronous mount contract by rendering a loading shell immediately and performing auth bootstrap in `bindPitShell`; do not turn the entire merchant `mount()` function async.

- [ ] **Step 8: Build the role-aware PIT shell**

  Render desktop sidebar, mobile nav, top bar, username/role, logout, theme toggle, loading state, setup/login states, offline banner, and an authenticated page outlet. On 401 return to PIT login while preserving the current PIT hash. On 403 refresh `/auth/me` and re-render allowed navigation.

- [ ] **Step 9: Register and run shell verification plus build**

  Add `"verify:pit-shell": "node scripts/verify-pit-shell.mjs"`, then run:

  ```powershell
  npm.cmd run verify:pit-shell
  npm.cmd run build
  ```

  Expected: PASS.

- [ ] **Step 10: Commit the PIT entry and shell**

  ```powershell
  git add -- package.json src/shell/app-shell-mode.ts src/shell/peripheral-products-control.ts src/i18n.ts src/main.ts src/pit/pit-routes.ts src/pit/pit-types.ts src/pit/pit-api-error.ts src/pit/pit-api.ts src/pit/pit-session.ts src/pit/pit-login-page.ts src/pit/pit-setup-page.ts src/pit/pit-shell.ts scripts/verify-pit-shell.mjs
  git commit -m "feat: add PIT shell and peripheral entry"
  ```

---

## Task 9: Build the dashboard, filters, requirement list, and following views

**Files:**

- Create: `src/pit/pit-ui.ts`
- Create: `src/pit/pit-list-query.ts`
- Create: `src/pit/pit-dashboard-page.ts`
- Create: `src/pit/pit-requirement-list-page.ts`
- Modify: `src/pit/pit-shell.ts`
- Create: `scripts/verify-pit-list-ui.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing pure list-query tests**

  Assert parse/serialize round trips for repeated filters, text search, dates, `mine`, `followed`, highlight, pagination, and sorting. Invalid values must fall back safely without losing supported parameters.

  Required example:

  ```ts
  const query = parsePitListQuery("?status=review_pending&status=development&mine=true&page=2");
  assert.deepEqual(query.status, ["review_pending", "development"]);
  assert.equal(query.mine, true);
  assert.equal(serializePitListQuery(query), "status=review_pending&status=development&mine=true&page=2&pageSize=20&sort=-updatedAt");
  ```

- [ ] **Step 2: Run the UI verification and confirm it fails**

  Run: `npx.cmd tsx scripts/verify-pit-list-ui.ts`

  Expected: FAIL because PIT list modules are absent.

- [ ] **Step 3: Implement safe UI helpers and status presentation**

  `pit-ui.ts` must export HTML escaping, date formatting, role labels, normalized/source status badges, toast/banner rendering, and a request-state helper. Never interpolate API text without escaping.

- [ ] **Step 4: Implement URL-owned list filters**

  `pit-list-query.ts` must be the only browser parser/serializer. Filter changes replace the hash query and reset page to 1; pagination pushes history. Preserve filters across login expiry and detail navigation.

- [ ] **Step 5: Build dashboard cards and shortcuts**

  Render total active, pending review, development/testing, completed, highlighted, mine, followed, and overdue counts. Each card links to `/pit/requirements` with the matching list query.

- [ ] **Step 6: Build the desktop workbench list**

  Implement search, multi-select filter popovers, applied-filter chips, saved quick views, sortable columns, 20/50/100 page size, pagination, empty/loading/error states, highlighted marker, source-status tooltip, owner/product-line display, and row click to detail. Refresh list and summary every 30 seconds only when the tab is visible.

- [ ] **Step 7: Bind follow/unfollow without viewer controls**

  Admin/editor rows expose a star button that calls idempotent follow APIs and updates counts. Viewer receives no follow control. API failure restores the prior visual state and shows the returned message.

- [ ] **Step 8: Wire pages into the shell and test accessibility contracts**

  Assert keyboard-operable filters, labelled table, visible focus, `aria-current` nav, meaningful empty text, and no form-content overwrite during background refresh.

- [ ] **Step 9: Register verification, run it and build**

  Add `"verify:pit-list-ui": "npx tsx scripts/verify-pit-list-ui.ts"`, then run:

  ```powershell
  npm.cmd run verify:pit-list-ui
  npm.cmd run verify:pit-shell
  npm.cmd run build
  ```

- [ ] **Step 10: Commit the list workbench**

  ```powershell
  git add -- package.json src/pit/pit-ui.ts src/pit/pit-list-query.ts src/pit/pit-dashboard-page.ts src/pit/pit-requirement-list-page.ts src/pit/pit-shell.ts scripts/verify-pit-list-ui.ts
  git commit -m "feat: build PIT requirement workbench"
  ```

---

## Task 10: Build requirement detail, create/edit, state actions, and conflict recovery

**Files:**

- Create: `src/pit/pit-requirement-form.ts`
- Create: `src/pit/pit-requirement-detail-page.ts`
- Create: `src/pit/pit-conflict-dialog.ts`
- Modify: `src/pit/pit-shell.ts`
- Create: `scripts/verify-pit-detail-ui.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing form and transition presentation tests**

  Test required fields, owner cardinality, multiple developers/testers, MID/product-line arrays, viewer read-only behavior, valid action buttons per status/role, reason requirements, preserved `rowVersion`, and field-diff calculation for 409 conflicts.

- [ ] **Step 2: Run the detail UI verification and confirm it fails**

  Run: `npx.cmd tsx scripts/verify-pit-detail-ui.ts`

  Expected: FAIL because detail modules are absent.

- [ ] **Step 3: Implement form model conversion and validation**

  `pit-requirement-form.ts` must export `requirementToForm`, `validatePitRequirementForm`, and `formToCreateOrPatchBody`. Keep backend IDs separate from display names and never send `status` through create/edit PATCH bodies except the fixed initial `review_pending` chosen by the server.

- [ ] **Step 4: Build create and detail pages**

  Create page renders all approved fields. Detail renders summary, 22-source-field traceability, assignments, MID/product-line tags, current normalized status, raw imported status, recent audit events, and soft-delete metadata for trash views.

- [ ] **Step 5: Add edit drawer and dirty-form protection**

  Editor/admin can open a right drawer, change fields, save with `rowVersion`, or cancel. Route changes and drawer close ask before discarding dirty values. Thirty-second refresh may update list counters but must not replace an open dirty form.

- [ ] **Step 6: Add server-driven state action dialogs**

  Render only actions allowed by the Global Constraints matrix. Require reason for return/pause/reject/reopen, require admin for reopen, send explicit target status only for `advance`, and refresh detail plus events after success.

- [ ] **Step 7: Implement 409 conflict recovery**

  `pit-conflict-dialog.ts` compares submitted fields with the current server representation returned in the 409 payload. Offer only “加载最新数据” and “取消”; do not offer force overwrite or automatic retry.

- [ ] **Step 8: Add admin delete/restore controls**

  Active detail offers soft delete to admin after confirmation. Trash detail offers restore. After delete, route to list; after restore, route to active detail.

- [ ] **Step 9: Register verification, run it and build**

  Add `"verify:pit-detail-ui": "npx tsx scripts/verify-pit-detail-ui.ts"`, then run:

  ```powershell
  npm.cmd run verify:pit-detail-ui
  npm.cmd run verify:pit-list-ui
  npm.cmd run build
  ```

- [ ] **Step 10: Commit requirement editing and lifecycle UI**

  ```powershell
  git add -- package.json src/pit/pit-requirement-form.ts src/pit/pit-requirement-detail-page.ts src/pit/pit-conflict-dialog.ts src/pit/pit-shell.ts scripts/verify-pit-detail-ui.ts
  git commit -m "feat: add PIT requirement editing and lifecycle UI"
  ```

---

## Task 11: Build import, export, and backup pages

**Files:**

- Create: `src/pit/pit-import-page.ts`
- Create: `src/pit/pit-export-page.ts`
- Create: `src/pit/pit-backup-page.ts`
- Modify: `src/pit/pit-shell.ts`
- Create: `scripts/verify-pit-file-workflows-ui.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing file-workflow UI tests**

  Cover workbook extension/size client checks, upload progress state, preview summary, issue filters, duplicate decisions, unknown status/dictionary mappings, unresolved blocker count, commit confirmation, permanent post-import lock, export current filters, export history/expiry, manual backups, and viewer/admin visibility.

- [ ] **Step 2: Run the verification and confirm it fails**

  Run: `npx.cmd tsx scripts/verify-pit-file-workflows-ui.ts`

  Expected: FAIL because the pages are absent.

- [ ] **Step 3: Build the one-time import page**

  Admin-only page flows through select → upload → preview → decisions → confirm commit → history. Disable commit until every blocking issue has a persisted decision. After `initialImportCompleted=true`, remove upload/commit actions and show immutable mapping/decision history with “首次导入已完成”. A 409 `initial_import_completed` must immediately switch to history-only mode.

- [ ] **Step 4: Build export creation and history**

  All roles can start an export from the current list query, see their own jobs, download valid files, see expired files, and regenerate with the stored filter. Admin can toggle `scope=all`.

- [ ] **Step 5: Build the backup page**

  Admin-only page lists kind, time, size, schema version, checksum, and download action; it supports manual backup with a single in-flight state. Do not expose physical paths.

- [ ] **Step 6: Wire pages, register verification, run it and build**

  Add `"verify:pit-file-workflows-ui": "npx tsx scripts/verify-pit-file-workflows-ui.ts"`, then run:

  ```powershell
  npm.cmd run verify:pit-file-workflows-ui
  npm.cmd run verify:pit-import
  npm.cmd run verify:pit-export-backup
  npm.cmd run build
  ```

- [ ] **Step 7: Commit file workflow pages**

  ```powershell
  git add -- package.json src/pit/pit-import-page.ts src/pit/pit-export-page.ts src/pit/pit-backup-page.ts src/pit/pit-shell.ts scripts/verify-pit-file-workflows-ui.ts
  git commit -m "feat: add PIT import export and backup pages"
  ```

---

## Task 12: Build dictionaries, users, audit log, and recycle bin pages

**Files:**

- Create: `src/pit/pit-dictionary-page.ts`
- Create: `src/pit/pit-user-page.ts`
- Create: `src/pit/pit-audit-page.ts`
- Create: `src/pit/pit-trash-page.ts`
- Modify: `src/pit/pit-shell.ts`
- Create: `scripts/verify-pit-admin-ui.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing administration UI tests**

  Assert admin-only route guards, dictionary add/edit/reorder/deactivate, used-value warning, user creation/role/disable/password reset/session revoke, audit filters, trash list/restore, confirmation dialogs, and 403-triggered session refresh.

- [ ] **Step 2: Run the verification and confirm it fails**

  Run: `npx.cmd tsx scripts/verify-pit-admin-ui.ts`

  Expected: FAIL because administration pages are absent.

- [ ] **Step 3: Build dictionary administration**

  Use tabs for the five fixed dictionary types (`product_line`, `requirement_source`, `requirement_type`, `problem_category`, `industry`). Codes are read-only after create. Reordering sends the complete ordered ID list. Deactivation shows affected active-requirement count and keeps historical labels visible.

- [ ] **Step 4: Build user administration**

  Support create, role change, enable/disable, reset password, and revoke all sessions. Never display stored password material. Require a newly entered temporary password for create/reset and show a one-time copy action only before the dialog closes.

- [ ] **Step 5: Build audit and recycle-bin pages**

  Audit filters by actor/object/action/date and renders redacted before/after diffs. Trash reuses the list table with `deleted=only`, exposes delete metadata, and allows admin restore; it does not offer permanent delete.

- [ ] **Step 6: Handle runtime permission loss**

  On a 403 from any admin page, refresh `/auth/me`, remove now-forbidden nav, and route to dashboard with a permission-change banner.

- [ ] **Step 7: Register verification, run it and build**

  Add `"verify:pit-admin-ui": "npx tsx scripts/verify-pit-admin-ui.ts"`, then run:

  ```powershell
  npm.cmd run verify:pit-admin-ui
  npm.cmd run verify:pit-admin-api
  npm.cmd run build
  ```

- [ ] **Step 8: Commit administration pages**

  ```powershell
  git add -- package.json src/pit/pit-dictionary-page.ts src/pit/pit-user-page.ts src/pit/pit-audit-page.ts src/pit/pit-trash-page.ts src/pit/pit-shell.ts scripts/verify-pit-admin-ui.ts
  git commit -m "feat: add PIT administration pages"
  ```

---

## Task 13: Add the aggregate verification, LAN runbook, and end-to-end acceptance

**Files:**

- Modify: `package.json`
- Create: `scripts/verify-pit-contract-coverage.mjs`
- Create: `docs/pit-local-server-runbook.md`

- [ ] **Step 1: Write the contract-coverage verification**

  `verify-pit-contract-coverage.mjs` must scan the spec and router/client source and fail unless every method/path in spec sections 9.2–9.7 exists in both the server dispatcher and typed client. It must also fail on unfinished-work markers, dummy copy, native `alert/confirm/prompt`, and unimplemented PIT route markers in `src/pit` or `server/pit`.

- [ ] **Step 2: Run it once and resolve every reported gap**

  Run: `node scripts/verify-pit-contract-coverage.mjs`

  Expected: initial FAIL if any contract or unfinished stub remains; update the owning implementation/test file, rerun its focused verification, then rerun this scan until PASS.

- [ ] **Step 3: Add one aggregate verification script**

  Add to `package.json`:

  ```json
  "verify:pit-contract-coverage": "node scripts/verify-pit-contract-coverage.mjs",
  "verify:pit": "npm run verify:pit-database && npm run verify:pit-auth-api && npm run verify:pit-requirements-api && npm run verify:pit-admin-api && npm run verify:pit-export-backup && npm run verify:pit-import && npm run verify:pit-server && npm run verify:pit-shell && npm run verify:pit-list-ui && npm run verify:pit-detail-ui && npm run verify:pit-file-workflows-ui && npm run verify:pit-admin-ui && npm run verify:pit-contract-coverage"
  ```

- [ ] **Step 4: Write the local-server runbook**

  `docs/pit-local-server-runbook.md` must document:

  1. Node 24 prerequisite and dependency install;
  2. `npm run build` then `npm run pit:start`;
  3. default data path `.data/pit`, port 3020, and how to set `PIT_DATA_DIR`/`PIT_PORT`;
  4. locating the printed private IPv4 URL and first-admin setup token;
  5. allowing inbound TCP 3020 in Windows Defender Firewall with a private-network-only rule;
  6. verifying access from a second LAN computer;
  7. first workbook import procedure and irreversible post-import lock;
  8. manual/daily/operation backup retention;
  9. stop-service restore command such as `npm run pit:restore -- C:\PIT-backups\pit-manual-20260831.sqlite3`;
  10. explicit warning: trusted LAN HTTP only, never expose port 3020 to the public internet.

- [ ] **Step 5: Run the complete automated acceptance suite**

  ```powershell
  npm.cmd run verify:pit
  npm.cmd run build
  ```

  Expected: all commands PASS. Confirm no `vendor/emenu-new` file changed; if one did, follow the project embed build rule before continuing.

- [ ] **Step 6: Perform two-browser role acceptance locally**

  Start `npm.cmd run dev:pit`. In one browser session bootstrap/login as admin; in an isolated browser session login as viewer. Verify:

  - floating ball order is eMenu, Kiosk, PIT;
  - direct `#/pit/dashboard` never shows merchant login;
  - admin sees all pages and viewer sees read-only dashboard/list/detail/export only;
  - list filters and 30-second refresh work;
  - edit conflict shows the diff dialog;
  - every transition path in the matrix works and invalid actions are unavailable;
  - import preview matches fixture counts and locks permanently after commit;
  - export downloads and backup downloads open successfully;
  - API loss keeps visible data, shows offline banner, and disables writes.

- [ ] **Step 7: Verify LAN access from a second machine**

  Build, start `pit:start`, use a printed URL such as `http://192.168.1.25:3020/` from another computer on the same LAN, login with a non-admin PIT account, open list/detail, and download one export. If unreachable, adjust only the private-network firewall rule; do not bind or forward the port to the public internet.

- [ ] **Step 8: Review the final diff against the approved spec**

  Check every acceptance item in spec section 16, confirm every server route has a typed client method and at least one verification assertion, confirm the three import mutation endpoints each enforce the one-time guard, and confirm all writes are role/CSRF/origin protected.

- [ ] **Step 9: Commit the acceptance layer and runbook**

  ```powershell
  git add -- package.json scripts/verify-pit-contract-coverage.mjs docs/pit-local-server-runbook.md
  git commit -m "docs: add PIT verification and LAN runbook"
  ```

---

## Final Completion Checklist

- [ ] `npm.cmd run verify:pit` passes with Node 24.
- [ ] `npm.cmd run build` passes.
- [ ] No unapproved `vendor/emenu-new` change exists; otherwise the required embed build and published-asset checks pass.
- [ ] The real workbook preview totals and issue counts are recorded in the implementation run notes before the irreversible commit.
- [ ] PIT is reachable through the private IPv4 URL printed by the server from a second LAN computer.
- [ ] Admin/editor/viewer permissions are verified in separate sessions.
- [ ] A manual backup can be downloaded and verified; offline restore succeeds on a disposable copy.
- [ ] API contracts, frontend client types, runbook, and implementation contain no unfinished stubs or contradictory import behavior.
