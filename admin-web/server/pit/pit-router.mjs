import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createPitAdminService } from "./pit-admin-service.mjs";
import { createPitAuthService } from "./pit-auth-service.mjs";
import {
  createPitBackup,
  enforcePitBackupRetention,
  listPitBackups,
  resolvePitBackupDownload,
} from "./pit-backup-service.mjs";
import { invalidRequest, notFound, unsupportedFileType } from "./pit-errors.mjs";
import { createPitExportService } from "./pit-export-service.mjs";
import {
  assertInitialImportOpen,
  createPitImportService,
  PIT_IMPORT_MAX_BYTES,
} from "./pit-import-service.mjs";
import { createPitRequirementService } from "./pit-requirement-service.mjs";
import {
  assertSameOrigin,
  clearSessionCookie,
  parseCookies,
  readBinary,
  readJson,
  sendData,
  sendError,
  setSessionCookie,
} from "./pit-http.mjs";

const API_PREFIX = "/api/v1/pit";

export function createPitRouter({
  db,
  config,
  setupToken,
  logger = console,
  clock,
  sourceIp = (req) => req.socket?.remoteAddress || "unknown",
}) {
  const auth = createPitAuthService({ db, setupToken, clock });
  const admin = createPitAdminService({ db, config, clock });
  const requirements = createPitRequirementService({ db, clock });
  const exportService = createPitExportService({ db, config, clock });
  const importService = createPitImportService({ db, config, clock });

  async function sendFile(res, file) {
    const stat = fs.statSync(file.filePath);
    const asciiName = file.fileName.replace(/[^A-Za-z0-9._-]/g, "_");
    res.statusCode = 200;
    res.setHeader("content-type", file.contentType || "application/octet-stream");
    res.setHeader("content-length", stat.size);
    res.setHeader(
      "content-disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    await pipeline(fs.createReadStream(file.filePath), res);
  }

  function decodeId(rawId, label = "资源") {
    try {
      const id = decodeURIComponent(rawId);
      if (!id || id.includes("/")) throw new TypeError("invalid id");
      return id;
    } catch {
      throw invalidRequest(`${label} ID 编码不合法`);
    }
  }

  function requirementQuery(searchParams) {
    const repeated = new Set([
      "productLine",
      "status",
      "priority",
      "requirementType",
      "problemCategory",
      "source",
      "owner",
      "plannedYear",
      "plannedMonth",
    ]);
    const result = {};
    for (const key of new Set(searchParams.keys())) {
      result[key] = repeated.has(key) ? searchParams.getAll(key) : searchParams.get(key);
    }
    return result;
  }

  function queryObject(searchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  function workbookFileName(req) {
    const raw = req.headers["x-pit-file-name"];
    if (typeof raw !== "string" || !raw) throw unsupportedFileType("缺少 X-PIT-File-Name");
    let decoded;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      throw unsupportedFileType("X-PIT-File-Name 编码不合法");
    }
    if (/%[0-9a-f]{2}/i.test(decoded)) {
      throw unsupportedFileType("X-PIT-File-Name 不能重复编码");
    }
    const fileName = decoded.replace(/\\/g, "/").split("/").pop()?.trim();
    if (!fileName || fileName === "." || fileName === ".." || pathExtension(fileName) !== ".xlsx") {
      throw unsupportedFileType("只接受 .xlsx 文件");
    }
    return fileName;
  }

  function pathExtension(fileName) {
    const index = fileName.lastIndexOf(".");
    return index < 0 ? "" : fileName.slice(index).toLowerCase();
  }

  function assertWorkbookMime(req) {
    const mime = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
    if (mime !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      throw unsupportedFileType("Content-Type 必须是 XLSX MIME");
    }
  }

  return async function routePitRequest(req, res) {
    const url = new URL(req.url || "/", "http://pit.local");
    if (url.pathname !== API_PREFIX && !url.pathname.startsWith(`${API_PREFIX}/`)) return false;

    const requestId = `req_${randomUUID()}`;
    const path = url.pathname.slice(API_PREFIX.length) || "/";
    const method = String(req.method || "GET").toUpperCase();

    try {
      if (method === "GET" && path === "/health") {
        sendData(res, requestId, await admin.health());
        return true;
      }

      if (method === "GET" && path === "/setup/status") {
        sendData(res, requestId, auth.setupStatus());
        return true;
      }

      if (method === "POST" && path === "/setup/bootstrap") {
        assertSameOrigin(req);
        const input = await readJson(req);
        const user = await auth.bootstrap(input);
        res.statusCode = 201;
        sendData(res, requestId, { user });
        return true;
      }

      if (method === "POST" && path === "/auth/login") {
        assertSameOrigin(req);
        const input = await readJson(req);
        const login = await auth.login({
          username: input.username,
          password: input.password,
          sourceIp: sourceIp(req),
        });
        setSessionCookie(res, login.sessionToken, login.maxAgeSeconds);
        sendData(res, requestId, { user: login.user });
        return true;
      }

      const cookies = parseCookies(req);
      const authentication = auth.authenticate(cookies.pit_session);

      if (method !== "GET" && method !== "HEAD") {
        assertSameOrigin(req);
        auth.assertCsrf(authentication, req.headers["x-csrf-token"]);
      }

      if (method === "GET" && path === "/auth/me") {
        sendData(res, requestId, {
          user: authentication.user,
          csrfToken: authentication.csrfToken,
        });
        return true;
      }

      if (method === "POST" && path === "/auth/logout") {
        auth.logout(authentication.sessionToken);
        clearSessionCookie(res);
        sendData(res, requestId, { loggedOut: true });
        return true;
      }

      if (method === "GET" && path === "/dashboard/summary") {
        sendData(res, requestId, admin.dashboardSummary(authentication.user));
        return true;
      }

      if (path === "/dictionaries") {
        if (method === "GET") {
          sendData(res, requestId, admin.listDictionaries(queryObject(url.searchParams), authentication.user));
          return true;
        }
        if (method === "POST") {
          auth.requireRole(authentication, "admin");
          const item = admin.createDictionaryItem(await readJson(req), authentication.user);
          res.statusCode = 201;
          sendData(res, requestId, { item });
          return true;
        }
      }

      if (method === "PUT" && path === "/dictionaries/order") {
        auth.requireRole(authentication, "admin");
        const items = admin.reorderDictionaryItems(await readJson(req), authentication.user);
        sendData(res, requestId, { items });
        return true;
      }

      const dictionaryMatch = /^\/dictionaries\/([^/]+)$/.exec(path);
      if (dictionaryMatch && method === "PATCH") {
        auth.requireRole(authentication, "admin");
        const id = decodeId(dictionaryMatch[1], "字典项");
        const item = admin.updateDictionaryItem(id, await readJson(req), authentication.user);
        sendData(res, requestId, { item });
        return true;
      }

      if (path === "/users") {
        auth.requireRole(authentication, "admin");
        if (method === "GET") {
          sendData(res, requestId, admin.listUsers());
          return true;
        }
        if (method === "POST") {
          const user = await admin.createUser(await readJson(req), authentication.user);
          res.statusCode = 201;
          sendData(res, requestId, { user });
          return true;
        }
      }

      const userMatch = /^\/users\/([^/]+)(?:\/(reset-password|revoke-sessions))?$/.exec(path);
      if (userMatch) {
        auth.requireRole(authentication, "admin");
        const id = decodeId(userMatch[1], "用户");
        const action = userMatch[2] || null;
        if (!action && method === "PATCH") {
          const user = admin.updateUser(id, await readJson(req), authentication.user);
          sendData(res, requestId, { user });
          return true;
        }
        if (action === "reset-password" && method === "POST") {
          sendData(res, requestId, await admin.resetUserPassword(id, await readJson(req), authentication.user));
          return true;
        }
        if (action === "revoke-sessions" && method === "POST") {
          await readJson(req);
          sendData(res, requestId, admin.revokeUserSessions(id, authentication.user));
          return true;
        }
      }

      if (method === "GET" && path === "/audit-log") {
        auth.requireRole(authentication, "admin");
        sendData(res, requestId, admin.listAuditLog(queryObject(url.searchParams), authentication.user));
        return true;
      }

      if (method === "POST" && path === "/imports/preview") {
        auth.requireRole(authentication, "admin");
        assertInitialImportOpen(db);
        assertWorkbookMime(req);
        const fileName = workbookFileName(req);
        const bytes = await readBinary(req, { maxBytes: PIT_IMPORT_MAX_BYTES });
        const job = await importService.preview({ fileName, bytes }, authentication.user);
        res.statusCode = 201;
        sendData(res, requestId, { job });
        return true;
      }

      if (method === "GET" && path === "/imports") {
        auth.requireRole(authentication, "admin");
        sendData(res, requestId, importService.list());
        return true;
      }

      const importMatch = /^\/imports\/([^/]+)(?:\/(decisions|commit))?$/.exec(path);
      if (importMatch) {
        auth.requireRole(authentication, "admin");
        const action = importMatch[2] || null;
        if (method === "POST" && (action === "decisions" || action === "commit")) {
          assertInitialImportOpen(db);
        }
        const id = decodeId(importMatch[1], "导入批次");
        if (!action && method === "GET") {
          sendData(res, requestId, importService.get(id, queryObject(url.searchParams)));
          return true;
        }
        if (action === "decisions" && method === "POST") {
          const job = importService.saveDecisions(id, await readJson(req), authentication.user);
          sendData(res, requestId, { job });
          return true;
        }
        if (action === "commit" && method === "POST") {
          await readJson(req);
          sendData(res, requestId, await importService.commit(id, authentication.user));
          return true;
        }
      }

      if (path === "/exports") {
        if (method === "GET") {
          sendData(res, requestId, exportService.listExports(queryObject(url.searchParams), authentication.user));
          return true;
        }
        if (method === "POST") {
          const exportJob = await exportService.createExport(await readJson(req), authentication.user);
          res.statusCode = 201;
          sendData(res, requestId, { exportJob });
          return true;
        }
      }

      const exportDownloadMatch = /^\/exports\/([^/]+)\/download$/.exec(path);
      if (exportDownloadMatch && method === "GET") {
        const id = decodeId(exportDownloadMatch[1], "导出任务");
        await sendFile(res, exportService.resolveDownload(id, authentication.user));
        return true;
      }

      if (path === "/backups") {
        auth.requireRole(authentication, "admin");
        if (method === "GET") {
          sendData(res, requestId, { items: listPitBackups({ db }) });
          return true;
        }
        if (method === "POST") {
          await readJson(req);
          const backup = await createPitBackup({
            db,
            config,
            kind: "manual",
            actorId: authentication.user.id,
            clock,
          });
          enforcePitBackupRetention({ db, config });
          res.statusCode = 201;
          sendData(res, requestId, { backup });
          return true;
        }
      }

      const backupDownloadMatch = /^\/backups\/([^/]+)\/download$/.exec(path);
      if (backupDownloadMatch && method === "GET") {
        auth.requireRole(authentication, "admin");
        const id = decodeId(backupDownloadMatch[1], "备份");
        await sendFile(res, resolvePitBackupDownload({ db, config, id }));
        return true;
      }

      if (path === "/requirements") {
        if (method === "GET") {
          sendData(res, requestId, requirements.list(requirementQuery(url.searchParams), authentication.user));
          return true;
        }
        if (method === "POST") {
          auth.requireRole(authentication, "admin", "editor");
          const input = await readJson(req);
          const requirement = requirements.create(input, authentication.user);
          res.statusCode = 201;
          sendData(res, requestId, { requirement });
          return true;
        }
      }

      const requirementMatch = /^\/requirements\/([^/]+)(?:\/(restore|transitions|follow))?$/.exec(path);
      if (requirementMatch) {
        const id = decodeId(requirementMatch[1], "需求");
        const action = requirementMatch[2] || null;
        if (!action && method === "GET") {
          const requirement = requirements.getById(id, authentication.user, {
            deleted: url.searchParams.get("deleted") || "exclude",
          });
          sendData(res, requestId, { requirement });
          return true;
        }
        if (!action && method === "PATCH") {
          auth.requireRole(authentication, "admin", "editor");
          const requirement = requirements.update(id, await readJson(req), authentication.user);
          sendData(res, requestId, { requirement });
          return true;
        }
        if (!action && method === "DELETE") {
          auth.requireRole(authentication, "admin");
          const requirement = requirements.softDelete(id, authentication.user);
          sendData(res, requestId, { requirement });
          return true;
        }
        if (action === "restore" && method === "POST") {
          auth.requireRole(authentication, "admin");
          const requirement = requirements.restore(id, authentication.user);
          sendData(res, requestId, { requirement });
          return true;
        }
        if (action === "transitions" && method === "POST") {
          auth.requireRole(authentication, "admin", "editor");
          const requirement = requirements.transition(id, await readJson(req), authentication.user);
          sendData(res, requestId, { requirement });
          return true;
        }
        if (action === "follow" && method === "PUT") {
          auth.requireRole(authentication, "admin", "editor");
          sendData(res, requestId, requirements.follow(id, authentication.user));
          return true;
        }
        if (action === "follow" && method === "DELETE") {
          auth.requireRole(authentication, "admin", "editor");
          sendData(res, requestId, requirements.unfollow(id, authentication.user));
          return true;
        }
      }

      throw notFound();
    } catch (error) {
      if (error?.status === undefined) {
        logger?.error?.(`PIT request ${requestId} failed`, error);
      }
      if (res.headersSent) res.destroy(error);
      else sendError(res, requestId, error);
      return true;
    }
  };
}
