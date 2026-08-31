import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { loadConfigFromFile } from "vite";
import { openPitDatabase } from "../server/pit/pit-database.mjs";
import { verifyPitBackup } from "../server/pit/pit-backup-service.mjs";
import { resolvePitConfig } from "../server/pit/pit-config.mjs";
import { createPitDevCoordinator } from "../server/run-pit-dev.mjs";
import { requestPitHttp } from "./lib/pit-test-server.mjs";
import {
  acquirePitProcessLock,
  assertPitNodeVersion,
  startPitApiServer,
} from "../server/pit-api-server.mjs";

const nodeMajor = Number(process.versions.node.split(".")[0]);
assert(nodeMajor >= 24, `PIT server verification requires Node 24+, received ${process.versions.node}`);
assert.throws(() => assertPitNodeVersion("23.9.0"), /Node 24 or newer/);
assert.doesNotThrow(() => assertPitNodeVersion("24.0.0"));
const defaultConfig = resolvePitConfig({}, path.resolve("pit-config-default-probe"));
assert.equal(defaultConfig.host, "0.0.0.0");
assert.equal(defaultConfig.port, 3020);
const pitVerificationSources = [
  ...fs.readdirSync(path.resolve("scripts"))
    .filter((name) => /^verify-pit-.+\.mjs$/.test(name))
    .map((name) => path.resolve("scripts", name)),
  path.resolve("scripts", "lib", "pit-test-server.mjs"),
];
for (const sourcePath of pitVerificationSources) {
  assert.doesNotMatch(
    fs.readFileSync(sourcePath, "utf8"),
    /\bfetch\s*\(/,
    `${path.basename(sourcePath)} must use the node:http PIT test client, not WHATWG fetch`,
  );
}

const previousPitProxy = process.env.PIT_USE_API_PROXY;
try {
  delete process.env.PIT_USE_API_PROXY;
  const proxyOff = await loadConfigFromFile(
    { command: "serve", mode: "development", isSsrBuild: false, isPreview: false },
    path.resolve("vite.config.ts"),
  );
  assert(proxyOff);
  assert.equal(Object.hasOwn(proxyOff.config.server?.proxy || {}, "/api/v1/pit"), false);
  process.env.PIT_USE_API_PROXY = "1";
  const proxyOn = await loadConfigFromFile(
    { command: "serve", mode: "development", isSsrBuild: false, isPreview: false },
    path.resolve("vite.config.ts"),
  );
  assert(proxyOn);
  assert.deepEqual(proxyOn.config.server?.proxy?.["/api/v1/pit"], {
    target: "http://127.0.0.1:3020",
    changeOrigin: false,
  });
} finally {
  if (previousPitProxy === undefined) delete process.env.PIT_USE_API_PROXY;
  else process.env.PIT_USE_API_PROXY = previousPitProxy;
}

class FakeChild extends EventEmitter {
  constructor({ connected = false } = {}) {
    super();
    this.connected = connected;
    this.sent = [];
    this.killed = [];
  }

  send(message, callback) {
    this.sent.push(message);
    callback?.(null);
    return true;
  }

  kill(signal) {
    this.killed.push(signal);
    return true;
  }
}

function fakeCoordinator() {
  const calls = [];
  const fakeRuntime = new EventEmitter();
  fakeRuntime.execPath = "fake-node";
  fakeRuntime.env = { INHERITED: "yes" };
  fakeRuntime.exitCode = undefined;
  const childQueue = [new FakeChild({ connected: true }), new FakeChild()];
  const coordinator = createPitDevCoordinator({
    runtimeProcess: fakeRuntime,
    projectRoot: path.resolve("fake-pit-project"),
    installSignalHandlers: false,
    forceAfterMs: 60_000,
    logger: { error() {} },
    spawnChild(command, args, options) {
      const child = childQueue[calls.length];
      calls.push({ command, args, options, child });
      return child;
    },
  });
  return { calls, fakeRuntime, coordinator };
}

{
  const { calls, fakeRuntime, coordinator } = fakeCoordinator();
  assert.equal(calls.length, 2);
  assert.equal(calls[0].command, "fake-node");
  assert.match(calls[0].args[0], /server[\\/]pit-api-server\.mjs$/);
  assert.equal(calls[0].options.env.PIT_PORT, "3020");
  assert.deepEqual(calls[0].options.stdio, ["inherit", "inherit", "inherit", "ipc"]);
  assert.match(calls[1].args[0], /node_modules[\\/]vite[\\/]bin[\\/]vite\.js$/);
  assert.equal(calls[1].options.env.PIT_USE_API_PROXY, "1");
  calls[1].child.emit("close", 1, null);
  assert.deepEqual(calls[0].child.sent, [{ type: "pit:shutdown", signal: "SIGTERM" }]);
  calls[0].child.emit("close", 0, null);
  assert.equal(await coordinator.done, 1);
  assert.equal(fakeRuntime.exitCode, 1);
}

{
  const { calls, fakeRuntime, coordinator } = fakeCoordinator();
  calls[0].child.emit("close", 1, null);
  assert.deepEqual(calls[1].child.killed, ["SIGTERM"]);
  calls[1].child.emit("close", null, "SIGTERM");
  assert.equal(await coordinator.done, 1);
  assert.equal(fakeRuntime.exitCode, 1);
}

{
  const { calls, fakeRuntime, coordinator } = fakeCoordinator();
  calls[0].child.emit("error", new Error("spawn failed"));
  coordinator.terminate("SIGINT", true);
  calls[0].child.emit("close", 1, null);
  calls[1].child.emit("close", null, "SIGTERM");
  assert.equal(await coordinator.done, 1, "a later external signal must not hide an earlier child failure");
  assert.equal(fakeRuntime.exitCode, 1);
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-lock-lease-"));
try {
  const concurrentDir = path.join(leaseRoot, "concurrent");
  const contenders = await Promise.allSettled([
    Promise.resolve().then(() => acquirePitProcessLock(concurrentDir)),
    Promise.resolve().then(() => acquirePitProcessLock(concurrentDir)),
  ]);
  assert.equal(contenders.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(contenders.filter((item) => item.status === "rejected" && /already running/i.test(item.reason?.message)).length, 1);
  contenders.find((item) => item.status === "fulfilled")?.value.release();

  const heartbeatDir = path.join(leaseRoot, "heartbeat");
  let heartbeatNow = new Date("2026-08-31T08:00:00.000Z");
  const heartbeatLock = acquirePitProcessLock(heartbeatDir, {
    clock: () => new Date(heartbeatNow),
    heartbeatIntervalMs: 20,
    leaseMs: 200,
  });
  const heartbeatPath = path.join(heartbeatDir, ".pit-server.lock");
  const initialHeartbeat = fs.statSync(heartbeatPath).mtimeMs;
  heartbeatNow = new Date("2026-08-31T08:00:00.100Z");
  await delay(50);
  assert(fs.statSync(heartbeatPath).mtimeMs > initialHeartbeat, "the lock owner must refresh its heartbeat mtime");
  assert.throws(
    () => acquirePitProcessLock(heartbeatDir, {
      clock: () => new Date(heartbeatNow),
      heartbeatIntervalMs: 20,
      leaseMs: 200,
    }),
    /already running/i,
    "a live PID with a fresh heartbeat must retain the lease",
  );
  heartbeatLock.release();

  const partialDir = path.join(leaseRoot, "partial");
  fs.mkdirSync(partialDir, { recursive: true });
  const partialPath = path.join(partialDir, ".pit-server.lock");
  fs.writeFileSync(partialPath, "{");
  const partialNow = new Date("2026-08-31T09:00:00.000Z");
  fs.utimesSync(partialPath, partialNow, partialNow);
  assert.throws(
    () => acquirePitProcessLock(partialDir, { clock: () => new Date(partialNow), malformedGraceMs: 30_000 }),
    /already running/i,
    "a newly-created partial lock must receive a grace period",
  );
  const oldPartial = new Date("2026-08-31T08:00:00.000Z");
  fs.utimesSync(partialPath, oldPartial, oldPartial);
  const recoveredPartial = acquirePitProcessLock(partialDir, { clock: () => new Date(partialNow), malformedGraceMs: 30_000 });
  recoveredPartial.release();

  const refreshRaceDir = path.join(leaseRoot, "refresh-race");
  fs.mkdirSync(refreshRaceDir, { recursive: true });
  const refreshRacePath = path.join(refreshRaceDir, ".pit-server.lock");
  const refreshNow = new Date("2026-08-31T09:30:00.000Z");
  fs.writeFileSync(refreshRacePath, JSON.stringify({
    pid: process.pid,
    token: "active-owner",
    createdAt: "2026-08-31T08:00:00.000Z",
  }));
  fs.utimesSync(refreshRacePath, oldPartial, oldPartial);
  assert.throws(
    () => acquirePitProcessLock(refreshRaceDir, {
      clock: () => new Date(refreshNow),
      heartbeatIntervalMs: 20,
      leaseMs: 200,
      beforeStaleRename({ lockPath }) {
        fs.utimesSync(lockPath, refreshNow, refreshNow);
      },
    }),
    /already running/i,
    "a heartbeat refreshed between stale-read and rename must be restored and treated as live",
  );
  assert.equal(JSON.parse(fs.readFileSync(refreshRacePath, "utf8")).token, "active-owner");
  fs.unlinkSync(refreshRacePath);

  const tokenRaceDir = path.join(leaseRoot, "token-race");
  const tokenClock = new Date("2026-08-31T10:00:00.000Z");
  const oldOwner = acquirePitProcessLock(tokenRaceDir, {
    clock: () => new Date(tokenClock),
    heartbeatIntervalMs: 20,
    leaseMs: 200,
  });
  const tokenRacePath = path.join(tokenRaceDir, ".pit-server.lock");
  fs.writeFileSync(tokenRacePath, JSON.stringify({
    pid: process.pid,
    token: "replacement-owner",
    createdAt: tokenClock.toISOString(),
  }));
  fs.utimesSync(tokenRacePath, tokenClock, tokenClock);
  oldOwner.release();
  const replacementMtime = fs.statSync(tokenRacePath).mtimeMs;
  await delay(50);
  assert.equal(JSON.parse(fs.readFileSync(tokenRacePath, "utf8")).token, "replacement-owner");
  assert.equal(fs.statSync(tokenRacePath).mtimeMs, replacementMtime, "release must stop the old owner's heartbeat before token comparison");
  fs.unlinkSync(tokenRacePath);
} finally {
  fs.rmSync(leaseRoot, { recursive: true, force: true });
}

function makeDist(root) {
  const distDir = path.join(root, "dist");
  fs.mkdirSync(path.join(distDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(distDir, "emenu-new", "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(distDir, "index.html"),
    "<!doctype html><html><body><main>PIT SPA</main></body></html>",
  );
  fs.writeFileSync(path.join(distDir, "assets", "app.a1b2c3d4.js"), "globalThis.pitAsset = true;\n");
  fs.writeFileSync(path.join(distDir, "emenu-new", "assets", "vendor.abcdef12.js"), "globalThis.nestedAsset = true;\n");
  return distDir;
}

function rawRequest(origin, requestPath, { method = "GET", headers = {} } = {}) {
  const url = new URL(origin);
  return new Promise((resolve, reject) => {
    const request = http.request({
      host: url.hostname,
      port: url.port,
      method,
      path: requestPath,
      headers,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    request.once("error", reject);
    request.end();
  });
}

async function jsonRequest(origin, requestPath, { method = "GET", body, cookie } = {}) {
  const headers = new Headers();
  if (body !== undefined) {
    headers.set("content-type", "application/json");
    headers.set("origin", origin);
  }
  if (cookie) headers.set("cookie", cookie);
  const response = await requestPitHttp(`${origin}${requestPath}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return {
    status: response.status,
    headers: response.headers,
    body: text ? JSON.parse(text) : null,
    text,
  };
}

function waitForChildReady(child, output, timeoutMs = 20_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`PIT child did not become ready:\n${output.text}`)), timeoutMs);
    timeout.unref?.();
    function inspect() {
      const match = /PIT_SERVER_READY\s+(\{[^\r\n]+\})/.exec(output.text);
      if (!match) return;
      clearTimeout(timeout);
      cleanup();
      resolve(JSON.parse(match[1]));
    }
    function exited(code, signal) {
      clearTimeout(timeout);
      cleanup();
      reject(new Error(`PIT child exited before ready (${code ?? signal}):\n${output.text}`));
    }
    function cleanup() {
      child.stdout?.off("data", inspect);
      child.stderr?.off("data", inspect);
      child.off("exit", exited);
    }
    child.stdout?.on("data", inspect);
    child.stderr?.on("data", inspect);
    child.once("exit", exited);
    inspect();
  });
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-"));
const dataDir = path.join(root, "data");
const distDir = makeDist(root);
const outsideDir = path.join(root, "outside");
fs.mkdirSync(outsideDir);
fs.writeFileSync(path.join(outsideDir, "secret.txt"), "must-not-leak");
fs.mkdirSync(dataDir, { recursive: true });
const staleLockPath = path.join(dataDir, ".pit-server.lock");
fs.writeFileSync(staleLockPath, JSON.stringify({ pid: process.pid, token: "reused-pid", createdAt: "2000-01-01T00:00:00.000Z" }));
fs.utimesSync(staleLockPath, new Date("2000-01-01T00:00:00.000Z"), new Date("2000-01-01T00:00:00.000Z"));

const logLines = [];
const logger = {
  info(...values) { logLines.push(values.map(String).join(" ")); },
  warn(...values) { logLines.push(values.map(String).join(" ")); },
  error(...values) { logLines.push(values.map(String).join(" ")); },
};

let runtime;
try {
  runtime = await startPitApiServer({
    env: {
      PIT_DATA_DIR: dataDir,
      PIT_DIST_DIR: distDir,
      PIT_HOST: "127.0.0.1",
      PIT_PORT: "0",
    },
    logger,
    installSignalHandlers: false,
  });
  await runtime.backgroundReady;

  assert.equal(fs.existsSync(staleLockPath), true, "server must recover a stale lock and hold a new lock");
  await assert.rejects(
    startPitApiServer({
      env: {
        PIT_DATA_DIR: dataDir,
        PIT_DIST_DIR: distDir,
        PIT_HOST: "127.0.0.1",
        PIT_PORT: "0",
      },
      logger,
      installSignalHandlers: false,
    }),
    /already running|正在运行|lock/i,
    "a live lock must prevent a second server from opening the same data directory",
  );

  const setupLog = logLines.find((line) => line.includes("PIT_SETUP_TOKEN="));
  assert(setupLog, "an empty user database must produce a setup token on the local console");
  const setupToken = /PIT_SETUP_TOKEN=([A-Za-z0-9_-]+)/.exec(setupLog)?.[1];
  assert(setupToken);
  assert.equal(logLines.filter((line) => line.includes("PIT_SETUP_TOKEN=")).length, 1);

  const health = await jsonRequest(runtime.origin, "/api/v1/pit/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.data.database.status, "ok");
  assert.equal(health.body.data.backup.status, "ok");
  assert(!health.text.includes(setupToken), "the setup token must never be exposed over HTTP");

  const malformedApiPath = await rawRequest(runtime.origin, "/api/v1/pit/%zz");
  assert.equal(malformedApiPath.status, 400);
  assert.match(String(malformedApiPath.headers["content-type"]), /application\/json/);
  const malformedApiBody = JSON.parse(malformedApiPath.body.toString("utf8"));
  assert.equal(malformedApiBody.error.code, "invalid_request");
  assert.equal(typeof malformedApiBody.error.requestId, "string");

  const rootResponse = await requestPitHttp(`${runtime.origin}/`);
  assert.equal(rootResponse.status, 200);
  assert.match(await rootResponse.text(), /PIT SPA/);
  assert.match(String(rootResponse.headers.get("content-type")), /^text\/html/);
  assert.match(String(rootResponse.headers.get("cache-control")), /no-cache/);

  const asset = await requestPitHttp(`${runtime.origin}/assets/app.a1b2c3d4.js`);
  assert.equal(asset.status, 200);
  assert.match(await asset.text(), /pitAsset/);
  assert.match(String(asset.headers.get("content-type")), /javascript/);
  assert.match(String(asset.headers.get("cache-control")), /immutable/);

  const nestedAsset = await requestPitHttp(`${runtime.origin}/emenu-new/assets/vendor.abcdef12.js`);
  assert.equal(nestedAsset.status, 200);
  assert.match(await nestedAsset.text(), /nestedAsset/);
  assert.match(String(nestedAsset.headers.get("cache-control")), /immutable/);

  const headAsset = await requestPitHttp(`${runtime.origin}/assets/app.a1b2c3d4.js`, { method: "HEAD" });
  assert.equal(headAsset.status, 200);
  assert.equal((await headAsset.arrayBuffer()).byteLength, 0);
  assert.equal(Number(headAsset.headers.get("content-length")), fs.statSync(path.join(distDir, "assets", "app.a1b2c3d4.js")).size);

  const fallback = await requestPitHttp(`${runtime.origin}/pit/requirements/example`);
  assert.equal(fallback.status, 200);
  assert.match(await fallback.text(), /PIT SPA/);
  const fallbackHead = await requestPitHttp(`${runtime.origin}/pit/requirements/example`, { method: "HEAD" });
  assert.equal(fallbackHead.status, 200);
  assert.equal((await fallbackHead.arrayBuffer()).byteLength, 0);

  const bootstrap = await jsonRequest(runtime.origin, "/api/v1/pit/setup/bootstrap", {
    method: "POST",
    body: {
      token: setupToken,
      username: "pit-admin",
      displayName: "PIT Admin",
      password: "pit-admin-password",
    },
  });
  assert.equal(bootstrap.status, 201);
  const login = await jsonRequest(runtime.origin, "/api/v1/pit/auth/login", {
    method: "POST",
    body: { username: "pit-admin", password: "pit-admin-password" },
  });
  assert.equal(login.status, 200);
  const cookie = String(login.headers.get("set-cookie") || "").split(";", 1)[0];
  assert.match(cookie, /^pit_session=/);
  const missingApi = await jsonRequest(runtime.origin, "/api/v1/pit/does-not-exist", { cookie });
  assert.equal(missingApi.status, 404);
  assert.equal(missingApi.body.error.code, "not_found");
  assert.equal(typeof missingApi.body.error.requestId, "string");

  for (const traversal of ["/../outside/secret.txt", "/%2e%2e/outside/secret.txt", "/%252e%252e/outside/secret.txt", "/..\\outside\\secret.txt"]) {
    const response = await rawRequest(runtime.origin, traversal);
    assert([400, 403, 404].includes(response.status), `${traversal} must be rejected`);
    assert(!response.body.toString("utf8").includes("must-not-leak"));
  }

  let linked = false;
  try {
    fs.symlinkSync(outsideDir, path.join(distDir, "escape"), process.platform === "win32" ? "junction" : "dir");
    linked = true;
  } catch (error) {
    if (!new Set(["EPERM", "EACCES", "ENOTSUP"]).has(error?.code)) throw error;
  }
  if (linked) {
    const escaped = await requestPitHttp(`${runtime.origin}/escape/secret.txt`);
    assert([400, 403, 404].includes(escaped.status));
    assert(!String(await escaped.text()).includes("must-not-leak"));
  }

  const startupBackups = runtime.db.prepare(`
    SELECT file_name, manifest_name, schema_version
    FROM backup_records WHERE kind = 'startup' ORDER BY created_at DESC, id DESC
  `).all();
  assert.equal(startupBackups.length, 1, "startup backup must complete before startPitApiServer resolves");
  await verifyPitBackup(path.join(runtime.config.backupsDir, startupBackups[0].file_name), startupBackups[0].schema_version);

  const latestBackup = runtime.db.prepare(`
    SELECT manifest_name FROM backup_records ORDER BY created_at DESC, id DESC LIMIT 1
  `).get();
  const latestManifestPath = path.join(runtime.config.backupsDir, latestBackup.manifest_name);
  const savedManifest = fs.readFileSync(latestManifestPath);
  fs.unlinkSync(latestManifestPath);
  const degraded = await jsonRequest(runtime.origin, "/api/v1/pit/health");
  assert.equal(degraded.status, 200);
  assert.equal(degraded.body.data.status, "degraded");
  assert.equal(degraded.body.data.backup.status, "missing_manifest");
  fs.writeFileSync(latestManifestPath, savedManifest);

  const latestFileName = runtime.db.prepare(`
    SELECT file_name FROM backup_records ORDER BY created_at DESC, id DESC LIMIT 1
  `).get().file_name;
  const latestFilePath = path.join(runtime.config.backupsDir, latestFileName);
  const savedBackup = fs.readFileSync(latestFilePath);
  const corruptBackup = Buffer.from(savedBackup);
  corruptBackup[Math.floor(corruptBackup.length / 2)] ^= 0xff;
  fs.writeFileSync(latestFilePath, corruptBackup);
  const corruptHealth = await jsonRequest(runtime.origin, "/api/v1/pit/health");
  assert.equal(corruptHealth.status, 200);
  assert.equal(corruptHealth.body.data.status, "degraded");
  assert.equal(corruptHealth.body.data.backup.status, "verification_failed");
  fs.writeFileSync(latestFilePath, savedBackup);
} finally {
  await runtime?.close();
}

assert.equal(fs.existsSync(staleLockPath), false, "graceful close must release the data-directory lock");
const closedDb = new DatabaseSync(path.join(dataDir, "pit.sqlite3"));
assert.equal(closedDb.prepare("PRAGMA quick_check").get().quick_check, "ok");
closedDb.close();

const defaultHostRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-default-host-"));
const defaultHostLogs = [];
let defaultHostRuntime;
try {
  defaultHostRuntime = await startPitApiServer({
    env: {
      PIT_DATA_DIR: path.join(defaultHostRoot, "data"),
      PIT_DIST_DIR: makeDist(defaultHostRoot),
      PIT_PORT: "0",
    },
    logger: {
      info(...values) { defaultHostLogs.push(values.map(String).join(" ")); },
      warn(...values) { defaultHostLogs.push(values.map(String).join(" ")); },
      error(...values) { defaultHostLogs.push(values.map(String).join(" ")); },
    },
    installSignalHandlers: false,
  });
  assert.equal(defaultHostRuntime.config.host, "0.0.0.0");
  assert(defaultHostLogs.some((line) => line.includes("PIT local URL:")));
  assert(defaultHostLogs.some((line) => /does not modify Windows Firewall.*manually allow TCP port/i.test(line)));
  if (defaultHostRuntime.lanUrls.length > 0) {
    assert(defaultHostRuntime.lanUrls.every((url) => /^http:\/\/(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url)));
    assert(defaultHostRuntime.lanUrls.every((url) => defaultHostLogs.some((line) => line.includes(url))));
  }
} finally {
  await defaultHostRuntime?.close();
  fs.rmSync(defaultHostRoot, { recursive: true, force: true });
}

const startupLossRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-startup-loss-"));
const exitCodeBeforeStartupLoss = process.exitCode;
const startupLossLogs = [];
let startupOpenedDb;
try {
  const startupLossDataDir = path.join(startupLossRoot, "data");
  await assert.rejects(
    startPitApiServer({
      env: {
        PIT_DATA_DIR: startupLossDataDir,
        PIT_DIST_DIR: makeDist(startupLossRoot),
        PIT_HOST: "127.0.0.1",
        PIT_PORT: "0",
      },
      logger: {
        info(...values) { startupLossLogs.push(values.map(String).join(" ")); },
        warn(...values) { startupLossLogs.push(values.map(String).join(" ")); },
        error(...values) { startupLossLogs.push(values.map(String).join(" ")); },
      },
      installSignalHandlers: false,
      processLockOptions: { heartbeatIntervalMs: 20, leaseMs: 200 },
      startupHooks: {
        async wrapDatabaseOpen(databaseOpen, { lockPath }) {
          const opened = await databaseOpen;
          startupOpenedDb = opened;
          const now = new Date();
          fs.writeFileSync(lockPath, JSON.stringify({
            pid: process.pid,
            token: "replacement-during-startup",
            createdAt: now.toISOString(),
          }));
          fs.utimesSync(lockPath, now, now);
          await delay(50);
          return opened;
        },
      },
    }),
    /lock lease was lost/i,
  );
  assert.equal(startupLossLogs.some((line) => line.includes("PIT_SERVER_READY")), false);
  const startupLossLockPath = path.join(startupLossDataDir, ".pit-server.lock");
  assert.equal(JSON.parse(fs.readFileSync(startupLossLockPath, "utf8")).token, "replacement-during-startup");
  assert.throws(() => startupOpenedDb.prepare("SELECT 1"), /closed|open/i);
  fs.unlinkSync(startupLossLockPath);
  const startupLossDb = new DatabaseSync(path.join(startupLossDataDir, "pit.sqlite3"));
  assert.equal(startupLossDb.prepare("PRAGMA quick_check").get().quick_check, "ok");
  startupLossDb.close();
} finally {
  process.exitCode = exitCodeBeforeStartupLoss;
  fs.rmSync(startupLossRoot, { recursive: true, force: true });
}

const runtimeLossRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-runtime-loss-"));
const exitCodeBeforeRuntimeLoss = process.exitCode;
let runtimeLossServer;
try {
  const runtimeLossDataDir = path.join(runtimeLossRoot, "data");
  runtimeLossServer = await startPitApiServer({
    env: {
      PIT_DATA_DIR: runtimeLossDataDir,
      PIT_DIST_DIR: makeDist(runtimeLossRoot),
      PIT_HOST: "127.0.0.1",
      PIT_PORT: "0",
    },
    logger: { info() {}, warn() {}, error() {} },
    installSignalHandlers: false,
    processLockOptions: { heartbeatIntervalMs: 20, leaseMs: 200 },
  });
  const runtimeLossLockPath = path.join(runtimeLossDataDir, ".pit-server.lock");
  const now = new Date();
  fs.writeFileSync(runtimeLossLockPath, JSON.stringify({
    pid: process.pid,
    token: "replacement-during-runtime",
    createdAt: now.toISOString(),
  }));
  fs.utimesSync(runtimeLossLockPath, now, now);
  await delay(80);
  await runtimeLossServer.close();
  assert.equal(process.exitCode, 1);
  assert.equal(runtimeLossServer.server.listening, false);
  assert.equal(JSON.parse(fs.readFileSync(runtimeLossLockPath, "utf8")).token, "replacement-during-runtime");
  fs.unlinkSync(runtimeLossLockPath);
} finally {
  await runtimeLossServer?.close();
  process.exitCode = exitCodeBeforeRuntimeLoss;
  fs.rmSync(runtimeLossRoot, { recursive: true, force: true });
}

const cleanupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-cleanup-"));
const cleanupDataDir = path.join(cleanupRoot, "data");
const cleanupDistDir = makeDist(cleanupRoot);
const seedDb = await openPitDatabase({ dataDir: cleanupDataDir, backupBeforeMigrate: false, logger: { info() {} } });
const seedTimestamp = "2026-08-01T00:00:00.000Z";
seedDb.prepare(`
  INSERT INTO users (id, username, display_name, password_hash, role, active, created_at, updated_at)
  VALUES ('cleanup-user', 'cleanup-user', 'Cleanup User', 'unused', 'admin', 1, ?, ?)
`).run(seedTimestamp, seedTimestamp);
const expiredFileName = "expired-export.xlsx";
fs.writeFileSync(path.join(cleanupDataDir, "exports", expiredFileName), "expired");
seedDb.prepare(`
  INSERT INTO export_jobs (
    id, filter_json, row_count, file_name, status, error_message,
    created_by, created_at, completed_at, expires_at
  ) VALUES ('expired-export', '{}', 0, ?, 'completed', NULL, 'cleanup-user', ?, ?, ?)
`).run(expiredFileName, seedTimestamp, seedTimestamp, "2026-08-02T00:00:00.000Z");
seedDb.close();
let cleanupRuntime;
try {
  cleanupRuntime = await startPitApiServer({
    env: {
      PIT_DATA_DIR: cleanupDataDir,
      PIT_DIST_DIR: cleanupDistDir,
      PIT_HOST: "127.0.0.1",
      PIT_PORT: "0",
    },
    logger: { info() {}, warn() {}, error() {} },
    installSignalHandlers: false,
  });
  await cleanupRuntime.backgroundReady;
  assert.equal(fs.existsSync(path.join(cleanupDataDir, "exports", expiredFileName)), false, "expired export files must be proactively removed");
} finally {
  await cleanupRuntime?.close();
  fs.rmSync(cleanupRoot, { recursive: true, force: true });
}

const childRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pit-server-child-"));
const childDataDir = path.join(childRoot, "data");
const childDistDir = makeDist(childRoot);
const childOutput = { text: "" };
const child = spawn(process.execPath, [path.resolve("server/pit-api-server.mjs")], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PIT_DATA_DIR: childDataDir,
    PIT_DIST_DIR: childDistDir,
    PIT_HOST: "127.0.0.1",
    PIT_PORT: "0",
  },
  stdio: ["ignore", "pipe", "pipe", "ipc"],
  windowsHide: true,
});
child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");
child.stdout.on("data", (chunk) => { childOutput.text += chunk; });
child.stderr.on("data", (chunk) => { childOutput.text += chunk; });
const childReady = await waitForChildReady(child, childOutput);
assert.equal(typeof childReady.port, "number");
assert.equal((await requestPitHttp(`http://127.0.0.1:${childReady.port}/api/v1/pit/health`)).status, 200);
if (process.platform === "win32") child.send({ type: "pit:shutdown", signal: "SIGTERM" });
else assert.equal(child.kill("SIGTERM"), true);
const [childCode, childSignal] = await once(child, "exit");
assert.equal(childSignal, null);
assert.equal(childCode, 0, childOutput.text);
assert.equal(fs.existsSync(path.join(childDataDir, ".pit-server.lock")), false, "graceful shutdown must release the process lock");
const signaledDb = new DatabaseSync(path.join(childDataDir, "pit.sqlite3"));
assert.equal(signaledDb.prepare("PRAGMA quick_check").get().quick_check, "ok");
signaledDb.close();

fs.rmSync(childRoot, { recursive: true, force: true });
fs.rmSync(root, { recursive: true, force: true });
console.log("PIT LAN production server verification passed.");
