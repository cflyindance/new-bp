import { randomUUID } from "node:crypto";
import { createPitAdminService } from "./pit-admin-service.mjs";
import { createPitAuthService } from "./pit-auth-service.mjs";
import { invalidRequest, notFound } from "./pit-errors.mjs";
import { createPitRequirementService } from "./pit-requirement-service.mjs";
import {
  assertSameOrigin,
  clearSessionCookie,
  parseCookies,
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
  const admin = createPitAdminService({ db, clock });
  const requirements = createPitRequirementService({ db, clock });

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

  return async function routePitRequest(req, res) {
    const url = new URL(req.url || "/", "http://pit.local");
    if (url.pathname !== API_PREFIX && !url.pathname.startsWith(`${API_PREFIX}/`)) return false;

    const requestId = `req_${randomUUID()}`;
    const path = url.pathname.slice(API_PREFIX.length) || "/";
    const method = String(req.method || "GET").toUpperCase();

    try {
      if (method === "GET" && path === "/health") {
        sendData(res, requestId, admin.health());
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
      sendError(res, requestId, error);
      return true;
    }
  };
}
