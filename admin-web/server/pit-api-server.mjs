import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const MINIMUM_NODE_MAJOR = 24;
const PROCESS_LOCK_NAME = ".pit-server.lock";
const DEFAULT_LOCK_HEARTBEAT_INTERVAL_MS = 5_000;
const DEFAULT_LOCK_LEASE_MS = 5 * 60_000;
const DEFAULT_INCOMPLETE_LOCK_GRACE_MS = 30_000;
const API_PREFIX = "/api/v1/pit";

const MIME_BY_EXTENSION = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "application/javascript; charset=utf-8"],
  [".otf", "font/otf"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".ttf", "font/ttf"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

class PitStaticRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "PitStaticRequestError";
    this.status = status;
  }
}

export function assertPitNodeVersion(version = process.versions.node) {
  const major = Number(String(version || "").split(".")[0]);
  if (!Number.isSafeInteger(major) || major < MINIMUM_NODE_MAJOR) {
    throw new Error(`PIT requires Node ${MINIMUM_NODE_MAJOR} or newer; received ${version || "unknown"}`);
  }
}

function isProcessAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    if (error?.code === "ESRCH") return false;
    return true;
  }
}

function readLock(lockPath) {
  try {
    const stat = fs.statSync(lockPath);
    let value = null;
    try {
      value = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    } catch {
      // A just-created lock may briefly be empty. Its age decides whether it is stale.
    }
    return { stat, value };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function lockDate(clock) {
  const date = new Date(clock());
  if (Number.isNaN(date.getTime())) throw new TypeError("lock clock must return a valid date");
  return date;
}

function validLockOwner(value) {
  return Boolean(
    Number.isSafeInteger(Number(value?.pid))
    && Number(value.pid) > 0
    && typeof value?.token === "string"
    && value.token.length > 0
    && typeof value?.createdAt === "string"
    && !Number.isNaN(Date.parse(value.createdAt)),
  );
}

function activeLockLease(lock, observedAtMs, leaseMs, malformedGraceMs) {
  if (!lock) return false;
  const ageMs = observedAtMs - lock.stat.mtimeMs;
  if (!validLockOwner(lock.value)) return ageMs < malformedGraceMs;
  return isProcessAlive(Number(lock.value.pid)) && ageMs <= leaseMs;
}

export function acquirePitProcessLock(dataDir, {
  clock = () => new Date(),
  heartbeatIntervalMs = DEFAULT_LOCK_HEARTBEAT_INTERVAL_MS,
  leaseMs = DEFAULT_LOCK_LEASE_MS,
  malformedGraceMs = DEFAULT_INCOMPLETE_LOCK_GRACE_MS,
  beforeStaleRename,
} = {}) {
  if (!Number.isSafeInteger(heartbeatIntervalMs) || heartbeatIntervalMs < 10) {
    throw new TypeError("heartbeatIntervalMs must be an integer of at least 10 milliseconds");
  }
  if (!Number.isSafeInteger(leaseMs) || leaseMs <= heartbeatIntervalMs) {
    throw new TypeError("leaseMs must be an integer greater than heartbeatIntervalMs");
  }
  if (!Number.isSafeInteger(malformedGraceMs) || malformedGraceMs < 0) {
    throw new TypeError("malformedGraceMs must be a non-negative integer");
  }
  if (beforeStaleRename !== undefined && typeof beforeStaleRename !== "function") {
    throw new TypeError("beforeStaleRename must be a function");
  }
  const resolvedDataDir = path.resolve(dataDir);
  fs.mkdirSync(resolvedDataDir, { recursive: true });
  const lockPath = path.join(resolvedDataDir, PROCESS_LOCK_NAME);
  const token = randomUUID();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    let descriptor;
    try {
      descriptor = fs.openSync(lockPath, "wx", 0o600);
      const created = lockDate(clock);
      const createdAt = created.toISOString();
      fs.writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, token, createdAt })}\n`, "utf8");
      fs.fsyncSync(descriptor);
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.utimesSync(lockPath, created, created);
      let released = false;
      let heartbeatTimer = null;
      let leaseLost = false;
      const lostListeners = new Set();
      function stopHeartbeat() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      function loseLease(error) {
        if (released || leaseLost) return;
        leaseLost = true;
        stopHeartbeat();
        for (const listener of lostListeners) queueMicrotask(() => listener(error));
      }
      function heartbeatNow() {
        if (released || leaseLost) return false;
        let heartbeatDescriptor;
        try {
          heartbeatDescriptor = fs.openSync(lockPath, "r+");
          let currentValue;
          try {
            currentValue = JSON.parse(fs.readFileSync(heartbeatDescriptor, "utf8"));
          } catch {
            currentValue = null;
          }
          if (currentValue?.token !== token) {
            loseLease(new Error(`PIT process lock ownership was lost for ${resolvedDataDir}`));
            return false;
          }
          const heartbeatAt = lockDate(clock);
          fs.futimesSync(heartbeatDescriptor, heartbeatAt, heartbeatAt);
          return true;
        } catch (error) {
          loseLease(error);
          return false;
        } finally {
          if (heartbeatDescriptor !== undefined) fs.closeSync(heartbeatDescriptor);
        }
      }
      heartbeatTimer = setInterval(heartbeatNow, heartbeatIntervalMs);
      heartbeatTimer.unref?.();
      return {
        lockPath,
        heartbeatNow,
        get lost() { return leaseLost; },
        onLost(listener) {
          if (typeof listener !== "function") throw new TypeError("lock loss listener must be a function");
          if (leaseLost) queueMicrotask(() => listener(new Error(`PIT process lock ownership was lost for ${resolvedDataDir}`)));
          else lostListeners.add(listener);
          return () => lostListeners.delete(listener);
        },
        release() {
          if (released) return;
          released = true;
          stopHeartbeat();
          const current = readLock(lockPath);
          if (current?.value?.token === token) fs.unlinkSync(lockPath);
          lostListeners.clear();
        },
      };
    } catch (error) {
      if (descriptor !== undefined) fs.closeSync(descriptor);
      if (error?.code !== "EEXIST") throw error;
    }

    const existing = readLock(lockPath);
    if (!existing) continue;
    const observedAtMs = lockDate(clock).getTime();
    const pid = Number(existing.value?.pid);
    if (activeLockLease(existing, observedAtMs, leaseMs, malformedGraceMs)) {
      const owner = Number.isSafeInteger(pid) && pid > 0 ? ` (PID ${pid})` : "";
      const error = new Error(`PIT server is already running for ${resolvedDataDir}${owner}`);
      error.code = "PIT_ALREADY_RUNNING";
      throw error;
    }

    const stalePath = `${lockPath}.stale-${process.pid}-${randomUUID()}`;
    beforeStaleRename?.({ lockPath, observedAt: new Date(observedAtMs), attempt });
    try {
      fs.renameSync(lockPath, stalePath);
    } catch (error) {
      if (error?.code === "ENOENT" || error?.code === "EEXIST" || error?.code === "EPERM") continue;
      throw error;
    }
    const renamed = readLock(stalePath);
    if (activeLockLease(renamed, observedAtMs, leaseMs, malformedGraceMs)) {
      let restored = false;
      try {
        fs.linkSync(stalePath, lockPath);
        restored = true;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
      }
      try {
        fs.unlinkSync(stalePath);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      if (restored) {
        const ownerPid = Number(renamed?.value?.pid);
        const owner = Number.isSafeInteger(ownerPid) && ownerPid > 0 ? ` (PID ${ownerPid})` : "";
        const error = new Error(`PIT server is already running for ${resolvedDataDir}${owner}`);
        error.code = "PIT_ALREADY_RUNNING";
        throw error;
      }
      continue;
    }
    try {
      fs.unlinkSync(stalePath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }

  const error = new Error(`Could not acquire the PIT server lock for ${resolvedDataDir}`);
  error.code = "PIT_LOCK_UNAVAILABLE";
  throw error;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function decodeRequestPath(requestUrl) {
  const rawTarget = String(requestUrl || "/");
  const queryIndex = rawTarget.indexOf("?");
  const rawPath = queryIndex < 0 ? rawTarget : rawTarget.slice(0, queryIndex);
  if (!rawPath.startsWith("/")) throw new PitStaticRequestError(400, "Bad request path");
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    throw new PitStaticRequestError(400, "Bad request path encoding");
  }
  if (
    decoded.includes("\0")
    || decoded.includes("\\")
    || /%(?:00|2e|2f|5c)/i.test(decoded)
    || decoded.split("/").some((segment) => segment === "..")
  ) {
    throw new PitStaticRequestError(400, "Path traversal is not allowed");
  }
  return decoded || "/";
}

function rawTargetsPitApi(requestUrl) {
  const rawTarget = String(requestUrl || "/");
  const queryIndex = rawTarget.indexOf("?");
  const rawPath = queryIndex < 0 ? rawTarget : rawTarget.slice(0, queryIndex);
  return rawPath === API_PREFIX || rawPath.startsWith(`${API_PREFIX}/`);
}

function resolveExistingStaticFile(distRealPath, pathname) {
  const candidate = path.resolve(distRealPath, `.${pathname}`);
  if (!isInside(distRealPath, candidate)) throw new PitStaticRequestError(403, "Static path is outside dist");
  let stat;
  try {
    stat = fs.statSync(candidate);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") return null;
    throw error;
  }
  if (!stat.isFile()) return null;
  const realPath = fs.realpathSync(candidate);
  if (!isInside(distRealPath, realPath)) {
    throw new PitStaticRequestError(403, "Static symlink escapes dist");
  }
  return { filePath: realPath, stat };
}

function isHashedAsset(pathname) {
  return /(?:^|\/)assets\//.test(pathname)
    && /(?:\.|-)[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(path.basename(pathname));
}

async function serveFile(req, res, file, pathname) {
  res.statusCode = 200;
  res.setHeader("content-type", MIME_BY_EXTENSION.get(path.extname(file.filePath).toLowerCase()) || "application/octet-stream");
  res.setHeader("content-length", file.stat.size);
  res.setHeader("x-content-type-options", "nosniff");
  if (path.basename(file.filePath).toLowerCase() === "index.html") {
    res.setHeader("cache-control", "no-cache, no-store, must-revalidate");
  } else if (isHashedAsset(pathname)) {
    res.setHeader("cache-control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("cache-control", "no-cache");
  }
  if (String(req.method || "GET").toUpperCase() === "HEAD") {
    res.end();
    return;
  }
  await pipeline(fs.createReadStream(file.filePath), res);
}

function sendJsonError(res, status, code, message) {
  const requestId = `req_${randomUUID()}`;
  const bytes = Buffer.from(JSON.stringify({ error: { code, message, requestId } }));
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", bytes.length);
  res.end(bytes);
}

function privateIpv4Addresses() {
  const result = new Set();
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.internal || entry.family !== "IPv4") continue;
      if (
        /^10\./.test(entry.address)
        || /^192\.168\./.test(entry.address)
        || /^172\.(1[6-9]|2\d|3[01])\./.test(entry.address)
      ) result.add(entry.address);
    }
  }
  return [...result].sort();
}

function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    function onError(error) {
      server.off("listening", onListening);
      reject(error);
    }
    function onListening() {
      server.off("error", onError);
      resolve();
    }
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function closeHttpServer(server) {
  if (!server.listening) return Promise.resolve();
  server.closeIdleConnections?.();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function startPitApiServer({
  env = process.env,
  projectRoot = process.cwd(),
  logger = console,
  installSignalHandlers = true,
  processLockOptions = {},
  startupHooks = {},
} = {}) {
  assertPitNodeVersion();
  const [
    { resolvePitConfig },
    { openPitDatabase },
    { createPitRouter },
    {
      createPitBackup,
      enforcePitBackupRetention,
      scheduleDailyPitBackup,
      verifyPitBackup,
    },
    { scheduleExpiredPitExportCleanup },
  ] = await Promise.all([
    import("./pit/pit-config.mjs"),
    import("./pit/pit-database.mjs"),
    import("./pit/pit-router.mjs"),
    import("./pit/pit-backup-service.mjs"),
    import("./pit/pit-export-service.mjs"),
  ]);

  const config = resolvePitConfig(env, projectRoot);
  if (!config.host || !Number.isSafeInteger(config.port) || config.port < 0 || config.port > 65_535) {
    throw new Error(`Invalid PIT listen address: ${config.host || "<empty>"}:${config.port}`);
  }

  const processLock = acquirePitProcessLock(config.dataDir, processLockOptions);
  let db;
  let server;
  let dailyBackupScheduler;
  let exportCleanupScheduler;
  let backgroundReady = Promise.resolve([]);
  let closed = false;
  let startupComplete = false;
  let closePromise = null;
  let lockLossError = null;
  const signalHandlers = new Map();
  let messageHandler = null;

  function close() {
    if (closePromise) return closePromise;
    closed = true;
    closePromise = (async () => {
      for (const [signal, handler] of signalHandlers) process.off(signal, handler);
      signalHandlers.clear();
      if (messageHandler) process.off("message", messageHandler);
      messageHandler = null;
      try {
        await dailyBackupScheduler?.stop?.();
        await exportCleanupScheduler?.stop?.();
        await backgroundReady.catch(() => undefined);
        if (server) await closeHttpServer(server);
      } finally {
        try {
          db?.close();
        } finally {
          processLock.release();
        }
      }
    })();
    return closePromise;
  }

  processLock.onLost((error) => {
    lockLossError = error instanceof Error ? error : new Error(String(error));
    process.exitCode = 1;
    logger?.error?.("PIT process lock lease was lost; shutting down", error);
    if (startupComplete) {
      close().catch((closeError) => logger?.error?.("PIT lock-loss shutdown failed", closeError));
    }
  });

  function assertProcessLockOwned(stage) {
    if (!lockLossError && processLock.heartbeatNow()) return;
    process.exitCode = 1;
    const error = new Error(`PIT process lock lease was lost during ${stage}`, {
      cause: lockLossError || undefined,
    });
    error.code = "PIT_LOCK_LEASE_LOST";
    throw error;
  }

  try {
    const distRealPath = fs.realpathSync(config.distDir);
    const indexFile = resolveExistingStaticFile(distRealPath, "/index.html");
    if (!indexFile) throw new Error(`PIT frontend entry is missing: ${path.join(config.distDir, "index.html")}`);

    const databaseOpen = openPitDatabase({ dataDir: config.dataDir, logger });
    db = await (startupHooks.wrapDatabaseOpen
      ? startupHooks.wrapDatabaseOpen(databaseOpen, { config, lockPath: processLock.lockPath })
      : databaseOpen);
    assertProcessLockOwned("database open");
    await startupHooks.afterDatabaseOpen?.({ config, db, lockPath: processLock.lockPath });
    assertProcessLockOwned("database-open hook");
    const integrity = db.prepare("PRAGMA quick_check").get()?.quick_check;
    if (integrity !== "ok") throw new Error("PIT database quick_check failed before startup");

    const userCount = Number(db.prepare("SELECT count(*) AS count FROM users").get().count);
    const setupToken = userCount === 0 ? randomBytes(24).toString("base64url") : undefined;
    if (setupToken) {
      logger?.info?.("PIT has no users. Complete first-time setup with the local console token below.");
      logger?.info?.(`PIT_SETUP_TOKEN=${setupToken}`);
    }

    const startupBackup = await createPitBackup({ db, config, kind: "startup" });
    assertProcessLockOwned("startup backup creation");
    await startupHooks.afterStartupBackup?.({ config, db, lockPath: processLock.lockPath, startupBackup });
    assertProcessLockOwned("startup-backup hook");
    const startupBackupPath = path.join(config.backupsDir, startupBackup.fileName);
    await verifyPitBackup(startupBackupPath, startupBackup.schemaVersion);
    assertProcessLockOwned("startup backup verification");
    await startupHooks.afterStartupBackupVerification?.({
      config,
      db,
      lockPath: processLock.lockPath,
      startupBackup,
    });
    assertProcessLockOwned("startup-backup-verification hook");
    enforcePitBackupRetention({ db, config });

    const router = createPitRouter({ db, config, setupToken, logger });
    server = http.createServer((req, res) => {
      Promise.resolve().then(async () => {
        const pathname = decodeRequestPath(req.url);
        const method = String(req.method || "GET").toUpperCase();
        if (pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`)) {
          if (!(await router(req, res))) sendJsonError(res, 404, "not_found", "请求的资源不存在");
          return;
        }
        if (pathname.startsWith("/api/")) {
          sendJsonError(res, 404, "not_found", "请求的资源不存在");
          return;
        }
        if (method !== "GET" && method !== "HEAD") {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const requested = resolveExistingStaticFile(distRealPath, pathname);
        await serveFile(req, res, requested || indexFile, requested ? pathname : "/index.html");
      }).catch((error) => {
        if (res.headersSent) {
          res.destroy(error);
          return;
        }
        if (error instanceof PitStaticRequestError) {
          if (rawTargetsPitApi(req.url)) {
            sendJsonError(res, error.status, "invalid_request", "请求路径不合法");
            return;
          }
          res.statusCode = error.status;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end(error.message);
          return;
        }
        logger?.error?.("PIT HTTP request failed", error);
        sendJsonError(res, 500, "internal_error", "服务内部错误");
      });
    });

    await listen(server, config.port, config.host);
    assertProcessLockOwned("HTTP listen");
    await startupHooks.afterListen?.({ config, db, lockPath: processLock.lockPath, server });
    assertProcessLockOwned("HTTP-listen hook");
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : config.port;
    const origin = `http://127.0.0.1:${port}`;
    const lanUrls = privateIpv4Addresses().map((addressValue) => `http://${addressValue}:${port}`);
    if (installSignalHandlers) {
      for (const signal of ["SIGINT", "SIGTERM"]) {
        const handler = () => {
          close().then(
            () => { process.exitCode = 0; },
            (error) => {
              logger?.error?.("PIT graceful shutdown failed", error);
              process.exitCode = 1;
            },
          );
        };
        signalHandlers.set(signal, handler);
        process.on(signal, handler);
      }
      if (typeof process.send === "function") {
        messageHandler = (message) => {
          if (message?.type !== "pit:shutdown") return;
          close().then(
            () => {
              if (process.connected) process.disconnect();
              process.exitCode = 0;
            },
            (error) => {
              logger?.error?.("PIT graceful shutdown failed", error);
              if (process.connected) process.disconnect();
              process.exitCode = 1;
            },
          );
        };
        process.on("message", messageHandler);
      }
    }
    logger?.info?.(`PIT local URL: ${origin}`);
    for (const lanUrl of lanUrls) logger?.info?.(`PIT LAN URL: ${lanUrl}`);
    if (config.host === "0.0.0.0") {
      logger?.info?.("PIT does not modify Windows Firewall. If LAN access is blocked, manually allow TCP port " + port + ".");
    }
    logger?.info?.(`PIT_SERVER_READY ${JSON.stringify({ host: config.host, port, origin, lanUrls })}`);

    dailyBackupScheduler = scheduleDailyPitBackup({ db, config, logger });
    backgroundReady = (async () => {
      const daily = await dailyBackupScheduler.ready;
      if (closed) return [daily, null];
      exportCleanupScheduler = scheduleExpiredPitExportCleanup({ db, config, logger });
      return [daily, await exportCleanupScheduler.ready];
    })();

    startupComplete = true;

    return {
      server,
      db,
      config,
      origin,
      lanUrls,
      lockPath: processLock.lockPath,
      startupBackup,
      get backgroundReady() { return backgroundReady; },
      close,
    };
  } catch (error) {
    await close().catch((closeError) => logger?.error?.("PIT startup cleanup failed", closeError));
    throw error;
  }
}

const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  startPitApiServer().catch((error) => {
    console.error("PIT server failed to start:", error?.message || error);
    process.exitCode = 1;
  });
}
