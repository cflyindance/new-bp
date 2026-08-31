import {
  PitApiError,
  invalidRequest,
  payloadTooLarge,
  permissionDenied,
  unsupportedFileType,
} from "./pit-errors.mjs";

const SESSION_COOKIE = "pit_session";

function assertBodyLimit(maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new TypeError("maxBytes must be a positive safe integer");
  }
}

export async function readBinary(req, { maxBytes } = {}) {
  assertBodyLimit(maxBytes);

  const declaredLength = Number(req.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw payloadTooLarge();
  }

  const chunks = [];
  let byteLength = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteLength += bytes.byteLength;
    if (byteLength > maxBytes) throw payloadTooLarge();
    chunks.push(bytes);
  }

  return Buffer.concat(chunks, byteLength);
}

export async function readJson(req, { maxBytes = 1024 * 1024 } = {}) {
  const contentType = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType && contentType !== "application/json") {
    throw unsupportedFileType("请求内容必须使用 application/json");
  }

  const body = await readBinary(req, { maxBytes });
  if (body.byteLength === 0) return {};

  try {
    const value = JSON.parse(body.toString("utf8"));
    if (value === null || Array.isArray(value) || typeof value !== "object") {
      throw invalidRequest("JSON 请求体必须是对象");
    }
    return value;
  } catch (error) {
    if (error instanceof PitApiError) throw error;
    throw invalidRequest("JSON 请求体格式错误", { cause: error });
  }
}

export function sendData(res, requestId, data, meta = {}) {
  const body = JSON.stringify({ data, meta: { ...meta, requestId } });
  if (!res.statusCode || res.statusCode < 200) res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

export function sendError(res, requestId, error) {
  const apiError = error instanceof PitApiError
    ? error
    : new PitApiError(500, "internal_error", "服务内部错误");
  const errorBody = {
    code: apiError.code,
    message: apiError.message,
    ...(apiError.fields === undefined ? {} : { fields: apiError.fields }),
    requestId,
  };
  const body = JSON.stringify({ error: errorBody });
  res.statusCode = apiError.status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

export function parseCookies(req) {
  const cookies = {};
  for (const pair of String(req.headers.cookie || "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0) continue;
    const name = pair.slice(0, separator).trim();
    const rawValue = pair.slice(separator + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }
  return cookies;
}

export function setSessionCookie(res, token, maxAgeSeconds) {
  res.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api/v1/pit; HttpOnly; SameSite=Strict; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "set-cookie",
    `${SESSION_COOKIE}=; Path=/api/v1/pit; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}

export function assertSameOrigin(req) {
  const host = String(req.headers.host || "").trim().toLowerCase();
  const origin = String(req.headers.origin || "").trim();
  if (!host || !origin) throw permissionDenied("请求来源校验失败");

  let originHost;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new TypeError("unsupported origin protocol");
    }
    originHost = parsed.host.toLowerCase();
  } catch {
    throw permissionDenied("请求来源校验失败");
  }

  if (originHost !== host) throw permissionDenied("请求来源校验失败");
}
