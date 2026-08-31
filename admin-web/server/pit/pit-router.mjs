import { randomUUID } from "node:crypto";
import { createPitAuthService } from "./pit-auth-service.mjs";
import { notFound } from "./pit-errors.mjs";
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

  return async function routePitRequest(req, res) {
    const url = new URL(req.url || "/", "http://pit.local");
    if (url.pathname !== API_PREFIX && !url.pathname.startsWith(`${API_PREFIX}/`)) return false;

    const requestId = `req_${randomUUID()}`;
    const path = url.pathname.slice(API_PREFIX.length) || "/";
    const method = String(req.method || "GET").toUpperCase();

    try {
      if (method === "GET" && path === "/health") {
        sendData(res, requestId, { status: "ok" });
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
