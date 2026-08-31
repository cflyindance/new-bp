import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(source, snippet, message) {
  assert(source.includes(snippet), message ?? `missing source contract: ${snippet}`);
}

const shellMode = read("src/shell/app-shell-mode.ts");
const peripheral = read("src/shell/peripheral-products-control.ts");
const main = read("src/main.ts");
const routes = read("src/pit/pit-routes.ts");
const api = read("src/pit/pit-api.ts");
const session = read("src/pit/pit-session.ts");
const shell = read("src/pit/pit-shell.ts");
const login = read("src/pit/pit-login-page.ts");
const setup = read("src/pit/pit-setup-page.ts");
const types = read("src/pit/pit-types.ts");
const i18n = read("src/i18n.ts");

assertIncludes(shellMode, '"pit"', "AppShellMode must include pit");
for (const fn of ["isPitShellMode", "enterPitShell", "exitPitShell"]) {
  assertIncludes(shellMode, `function ${fn}`, `missing ${fn}`);
}

assertIncludes(peripheral, 'product: "emenu-local" | "kiosk-local" | "pit"');
const flatKiosk = peripheral.indexOf('renderFlatProductCard("kiosk-local"');
const flatPit = peripheral.indexOf('renderFlatProductCard("pit"');
assert(flatKiosk >= 0 && flatPit > flatKiosk, "flat PIT card must be immediately after Kiosk");
assert(!peripheral.slice(flatKiosk, flatPit).includes('renderFlatProductCard("emenu-local"'), "flat PIT card ordering is unstable");
const popupKiosk = peripheral.indexOf('data-peripheral-product-option="kiosk-local"');
const popupPit = peripheral.indexOf('data-peripheral-product-option="pit"', popupKiosk + 1);
assert(popupKiosk >= 0 && popupPit > popupKiosk, "popup PIT item must be immediately after Kiosk");
assertIncludes(peripheral, "enterPitShell();");
assertIncludes(peripheral, "PIT_DEFAULT_PATH");
assertIncludes(i18n, '"shell.peripheralProductsCount": "3 项"');
assertIncludes(i18n, '"shell.peripheralProductsCount": "3 items"');

assertIncludes(routes, 'export const PIT_DEFAULT_PATH = "/pit/dashboard"');
for (const contract of ["isPitContentPath", "normalizePitPath", "matchPitRoute", "canAccessPitRoute"]) {
  assertIncludes(routes, `function ${contract}`, `missing route contract ${contract}`);
}
const routeModule = await import(`${pathToFileURL(path.join(root, "src/pit/pit-routes.ts")).href}?verify=${Date.now()}`);
assert.equal(routeModule.isPitContentPath("/pit/requirements/req-1"), true);
assert.equal(routeModule.normalizePitPath("/pit"), "/pit/dashboard");
assert.equal(routeModule.normalizePitPath("/pit/"), "/pit/dashboard");
assert.equal(routeModule.normalizePitPath("/pit/not-a-route"), "/pit/dashboard");
assert.deepEqual(routeModule.matchPitRoute("/pit/requirements/new"), { id: "requirement-new" });
assert.deepEqual(routeModule.matchPitRoute("/pit/requirements/REQ%201"), { id: "requirement-detail", requirementId: "REQ 1" });
assert.equal(routeModule.canAccessPitRoute("users", "viewer"), false);
assert.equal(routeModule.canAccessPitRoute("backups", "viewer"), false);
assert.equal(routeModule.canAccessPitRoute("requirements", "viewer"), true);

const pitBranch = main.indexOf("if (isPitContentPath(authPath) || isPitShellMode())");
const merchantGate = main.indexOf("if (!isAuthenticated())");
assert(pitBranch >= 0 && merchantGate >= 0 && pitBranch < merchantGate, "PIT route ownership must precede merchant authentication");
const pitOwnershipBranch = main.slice(pitBranch, merchantGate);
assert(!/normalizedPath\s*!==\s*authPath[\s\S]{0,160}?replaceHashPath\([^)]*\);[\s\S]{0,80}?return;/.test(pitOwnershipBranch), "normalized PIT paths must render in the same mount instead of returning after silent replaceState");
assert(!/!isPitContentPath\(authPath\)[\s\S]{0,160}?replaceHashPath\([^)]*\);[\s\S]{0,80}?return;/.test(pitOwnershipBranch), "remembered PIT mode must render the default path after silent normalization");
assertIncludes(main, "mountPitShell(mount, normalizedPath)");
assertIncludes(main, "bindPitShell(mount)");
for (const fallback of ["isEmenuLocalShellMode()", "isKioskLocalShellMode()", "isMPlatformShellMode()"] ) {
  const index = main.indexOf(fallback, merchantGate);
  assert(index >= 0, `missing ${fallback} branch`);
  const scope = main.slice(index, index + 500);
  assertIncludes(scope, "!isPitContentPath(authPath)", `${fallback} fallback must exclude PIT content`);
}

assertIncludes(api, 'credentials: "same-origin"');
assertIncludes(api, 'headers.set("X-CSRF-Token"');
assertIncludes(api, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
assertIncludes(api, 'headers.set("X-PIT-File-Name"');
assertIncludes(api, "deleteRequirement: (id: string) =>", "delete must match the bodyless server endpoint");
assertIncludes(api, "restoreRequirement: (id: string) =>", "restore must match the bodyless server endpoint");
assertIncludes(api, "Promise<{ following: boolean }>", "follow transport must expose the server's following field");
assertIncludes(api, 'createBackup: () => request<{ backup: PitBackupRecord }>("/backups", { method: "POST", body: {} })', "backup POST must send the JSON object consumed by the router");
assertIncludes(types, 'Pick<PitUser, "username" | "displayName" | "role" | "active">', "user updates must model the server-supported username field");
assertIncludes(api, "type?: PitDictionaryType", "dictionary query must use the server dictionary enum");
assertIncludes(api, "reorderDictionaries: (type: PitDictionaryType", "dictionary reorder must use the server dictionary enum");
assertIncludes(types, "type: PitDictionaryType;", "import dictionary mappings must use the same dictionary enum");
assert(!/localStorage|sessionStorage/.test(session), "PIT credentials must remain in memory");

for (const [source, marker] of [
  [shell, "data-pit-shell"],
  [shell, "data-pit-navigation"],
  [login, "data-pit-login"],
  [setup, "data-pit-setup"],
  [shell, "data-pit-offline-banner"],
  [shell, "data-pit-user-menu"],
]) {
  assertIncludes(source, marker, `missing stable DOM marker ${marker}`);
}
assertIncludes(shell, "activeShellEpoch", "shell mounts need an epoch guard against stale async bootstrap results");
assertIncludes(shell, "isCurrentAttempt", "parallel bootstrap attempts need last-attempt ownership");
assertIncludes(shell, "MutationObserver", "shell event listeners must abort when their root is removed");

for (const adminOnly of ["users", "dictionaries", "audit-log", "trash", "backups"]) {
  assertIncludes(shell, `canAccessPitRoute("${adminOnly}", role)`, `viewer navigation must guard ${adminOnly}`);
}

const validationModule = await import(`${pathToFileURL(path.join(root, "src/pit/pit-form-validation.ts")).href}?verify=${Date.now()}`);
assert.deepEqual(validationModule.validatePitLoginInput({ username: "", password: "" }), {
  username: "请输入用户名。",
  password: "请输入密码。",
});
assert.equal(validationModule.validatePitSetupInput({ token: "token", username: "admin", displayName: "Admin", password: "short" }).password, "密码至少需要 12 个字符。");
assert.deepEqual(validationModule.pickPitFieldErrors({ password: "bad", secret: "must-not-render" }, ["password"]), { password: "bad" });
for (const field of ["username", "password"]) assertIncludes(login, `data-pit-field-error="${field}"`);
for (const field of ["token", "username", "displayName", "password"]) assertIncludes(setup, `data-pit-field-error="${field}"`);
assertIncludes(login, "error.fields", "login must consume safe server field errors");
assertIncludes(setup, "error.fields", "setup must consume safe server field errors");

const { startPitTestServer } = await import("./lib/pit-test-server.mjs");
const contractServer = await startPitTestServer({ setupToken: "pit-shell-contract-token" });
try {
  const { client } = contractServer;
  assert.equal((await client.get("/setup/status")).body.data.needsBootstrap, true);
  await client.post("/setup/bootstrap", { token: "pit-shell-contract-token", username: "admin", displayName: "Admin", password: "PIT-admin-2026" });
  await client.post("/auth/login", { username: "admin", password: "PIT-admin-2026" });
  await client.get("/auth/me");
  const created = await client.post("/requirements", { title: "Shell contract", description: "Contract fixture" }, { csrf: true });
  assert.equal(created.status, 201);
  const requirement = created.body.data.requirement;
  for (const key of ["requirementTypeId", "sourceId", "problemCategoryId", "industryId", "createdBy", "updatedBy", "following"]) {
    assert(Object.hasOwn(requirement, key), `real requirement response is missing ${key}`);
    assertIncludes(types, `${key}:`, `pit-types must model real requirement field ${key}`);
  }
  const id = requirement.id;
  assert.equal((await client.request("DELETE", `/requirements/${id}`, { csrf: true })).status, 200, "delete endpoint is bodyless");
  assert.equal((await client.request("POST", `/requirements/${id}/restore`, { csrf: true })).status, 200, "restore endpoint is bodyless");
  assert.deepEqual((await client.request("PUT", `/requirements/${id}/follow`, { csrf: true })).body.data, { following: true });
  assert.deepEqual((await client.request("DELETE", `/requirements/${id}/follow`, { csrf: true })).body.data, { following: false });

  const exported = await client.post("/exports", { q: "Shell" }, { csrf: true });
  for (const key of ["createdBy", "expired", "downloadable"]) {
    assert(Object.hasOwn(exported.body.data.exportJob, key), `real export response is missing ${key}`);
    assertIncludes(types, `${key}:`, `pit-types must model real export field ${key}`);
  }
  const backup = await client.post("/backups", {}, { csrf: true });
  assert(Object.hasOwn(backup.body.data.backup, "createdBy"));
  assertIncludes(types, "createdBy:", "pit-types must model backup creator");
  const audit = await client.get("/audit-log?pageSize=1");
  assert(Object.hasOwn(audit.body.data.items[0], "actor"));
  assertIncludes(types, "actor?:", "pit-types must model audit actor");
} finally {
  await contractServer.close();
}

console.log("PIT shell verification passed");
