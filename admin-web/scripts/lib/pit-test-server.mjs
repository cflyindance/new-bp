import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { openPitDatabase } from "../../server/pit/pit-database.mjs";
import { createPitRouter } from "../../server/pit/pit-router.mjs";

export async function startPitTestServer({
  setupToken = "pit-test-setup-token",
  clock = () => new Date(),
} = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pit-api-"));
  const db = await openPitDatabase({
    dataDir,
    backupBeforeMigrate: false,
    logger: { info() {}, error() {} },
  });
  const logger = { info() {}, error() {} };
  const router = createPitRouter({
    db,
    config: { dataDir },
    setupToken,
    logger,
    clock,
    sourceIp: (req) => String(req.headers["x-pit-test-source-ip"] || req.socket?.remoteAddress || "unknown"),
  });

  const server = http.createServer(async (req, res) => {
    try {
      if (!(await router(req, res))) {
        res.statusCode = 404;
        res.end("Not found");
      }
    } catch {
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const baseUrl = `${origin}/api/v1/pit`;
  let sessionToken = null;
  let csrfToken = null;

  async function request(method, requestPath, options = {}) {
    const headers = new Headers(options.headers || {});
    const originOption = options.origin === undefined ? origin : options.origin;
    if (originOption !== false) headers.set("origin", originOption);
    if (sessionToken) headers.set("cookie", `pit_session=${encodeURIComponent(sessionToken)}`);
    if (options.csrf) {
      if (csrfToken) headers.set("x-csrf-token", csrfToken);
      headers.set("origin", origin);
    }
    if (options.sourceIp) headers.set("x-pit-test-source-ip", options.sourceIp);

    let body;
    if (options.rawBody !== undefined) {
      body = options.rawBody;
    } else if (options.body !== undefined) {
      body = JSON.stringify(options.body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }

    const response = await fetch(`${baseUrl}${requestPath}`, { method, headers, body });
    const bytes = Buffer.from(await response.arrayBuffer());
    const responseType = String(response.headers.get("content-type") || "").toLowerCase();
    const text = bytes.toString("utf8");
    const responseBody = responseType.includes("application/json") && text
      ? JSON.parse(text)
      : bytes;
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = /(?:^|[,;]\s*)pit_session=([^;]*)/i.exec(setCookie);
      if (match) {
        sessionToken = match[1] ? decodeURIComponent(match[1]) : null;
        if (!sessionToken) csrfToken = null;
      }
    }
    if (responseBody?.data?.csrfToken) csrfToken = responseBody.data.csrfToken;

    return { status: response.status, headers: response.headers, body: responseBody, bytes, text };
  }

  const client = {
    request(method, requestPath, options) {
      return request(method, requestPath, options);
    },
    get(requestPath, options) {
      return request("GET", requestPath, options);
    },
    post(requestPath, body, options = {}) {
      return request("POST", requestPath, { ...options, body });
    },
    patch(requestPath, body, options = {}) {
      return request("PATCH", requestPath, { ...options, body });
    },
    put(requestPath, body, options = {}) {
      return request("PUT", requestPath, { ...options, body });
    },
    delete(requestPath, body, options = {}) {
      return request("DELETE", requestPath, { ...options, body });
    },
    rawWorkbook(requestPath, workbookPath, options = {}) {
      const fileName = path.basename(workbookPath);
      return request("POST", requestPath, {
        ...options,
        csrf: options.csrf ?? true,
        rawBody: fs.readFileSync(workbookPath),
        headers: {
          "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "x-pit-file-name": encodeURIComponent(fileName),
          ...options.headers,
        },
      });
    },
    get sessionToken() {
      return sessionToken;
    },
    get csrfToken() {
      return csrfToken;
    },
  };

  let closed = false;
  async function close() {
    if (closed) return;
    closed = true;
    server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    db.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  }

  return { baseUrl, client, db, dataDir, close };
}
