/**
 * Kiosk Lite 配置页（Service Setting 等）会向 parent 索取 sessionKey。
 * 本桥接通过 /kpos（Vite 代理或静态托管下的绝对 POS 地址）调用 clientInstanceLogin。
 *
 * 注意：
 * - 不要静态 import emenu-local-host-control（彼处已 import 本模块，会成环）。
 * - POS 要求 appInstanceName 为已登记的 KIOSK 设备名；随意新名字会 Not enough license。
 * - kiosklite 开发态会优先用 document.cookie 的 sessionKey，切换主机必须清掉旧 cookie。
 */

const LICENSE_STORAGE_KEY = "menusifu:kiosk-local:appInstanceName";
const SECRET_STORAGE_KEY = "menusifu:kiosk-local:secretKey";
const SESSION_STORAGE_KEY = "menusifu:kiosk-local:sessionKey";
const SESSION_EXPIRES_KEY = "menusifu:kiosk-local:sessionExpiresAt";
/** 当前 session / secret / license 绑定的 POS 主机；切换主机后必须失效 */
const SESSION_HOST_KEY = "menusifu:kiosk-local:sessionHost";
/** 与 emenu-local-host-control 的 EMENU_KPOS_HOST_STORAGE_KEY 保持一致 */
const KPOS_HOST_STORAGE_KEY = "menusifu:emenu-local:kpos-host";
const DEFAULT_KPOS_HOST = "http://localhost:22080";

/**
 * kiosklite 写在父页域名下的鉴权 cookie。
 * 开发态 requestKioskConfigSessionKey 会优先用 cookie，不换主机清掉就会继续打旧 POS 的 session。
 */
const KIOSK_EMBED_AUTH_COOKIES = [
  "sessionKey",
  "secretKey",
  "AndroidSecret",
  "kioskLicense",
  "kioskSskeyActiveTime",
  "kioskclientInstanceTime",
] as const;

let bridgeBound = false;
let pendingLogin: Promise<string> | null = null;

type AppInstanceRow = {
  displayName?: string;
  type?: string;
  inUse?: boolean;
};

/** 轻量读当前 POS 主机（避免与 host-control 循环依赖）。 */
function readCurrentKposHost(): string {
  try {
    const stored = localStorage.getItem(KPOS_HOST_STORAGE_KEY)?.trim();
    if (stored) {
      return stored.replace(/\/+$/, "").replace(/\/kpos\/?$/i, "");
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_KPOS_HOST;
}

function readBoundSessionHost(): string | null {
  try {
    return sessionStorage.getItem(SESSION_HOST_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function readStoredSession(): string | null {
  try {
    const host = readCurrentKposHost();
    if (readBoundSessionHost() !== host) return null;
    const key = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const expiresAt = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY) || "0");
    if (key && expiresAt > Date.now() + 60_000) return key;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredSession(sessionKey: string, remainingMs: number, host: string): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionKey);
    sessionStorage.setItem(SESSION_EXPIRES_KEY, String(Date.now() + Math.max(remainingMs, 60_000)));
    sessionStorage.setItem(SESSION_HOST_KEY, host);
  } catch {
    /* ignore */
  }
}

function readStoredAppInstanceName(): string | null {
  try {
    return localStorage.getItem(LICENSE_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function writeStoredAppInstanceName(name: string): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, name);
  } catch {
    /* ignore */
  }
}

function resolveSecretKey(): string {
  try {
    return localStorage.getItem(SECRET_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

/** 清除 kiosklite 落在 localhost 上的鉴权 cookie，避免开发态优先用旧主机 session。 */
export function clearKioskEmbedAuthCookies(): void {
  for (const name of KIOSK_EMBED_AUTH_COOKIES) {
    try {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }
}

function writeKioskEmbedAuthCookies(options: {
  sessionKey: string;
  appInstanceName: string;
  secretKey?: string;
  remainingMs: number;
}): void {
  const maxAge = Math.max(60, Math.floor(options.remainingMs / 1000));
  try {
    document.cookie = `sessionKey=${encodeURIComponent(options.sessionKey)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    document.cookie = `kioskLicense=${encodeURIComponent(options.appInstanceName)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    document.cookie = `kioskclientInstanceTime=${Date.now()}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    document.cookie = `kioskSskeyActiveTime=${options.remainingMs}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    if (options.secretKey) {
      document.cookie = `secretKey=${encodeURIComponent(options.secretKey)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    }
  } catch {
    /* ignore */
  }
}

/** 切换 POS 主机后丢弃旧 session / secret / cookie，避免仍用旧主机登录态拉配置。 */
export function clearKioskLocalSessionCache(): void {
  pendingLogin = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    sessionStorage.removeItem(SESSION_HOST_KEY);
  } catch {
    /* ignore */
  }
  try {
    // secret / 设备名都按主机绑定；沿用会导致另一台 POS 登录失败或拉错店数据
    localStorage.removeItem(SECRET_STORAGE_KEY);
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearKioskEmbedAuthCookies();
}

/**
 * 进入 Kiosk 嵌入页前：若绑定主机与当前不一致，清掉旧登录态。
 * 主机未变时保留 cookie，避免每次切「Kiosk / 设置」都被迫重登。
 */
export function prepareKioskEmbedAuthForHost(host: string = readCurrentKposHost()): void {
  if (readBoundSessionHost() !== host) {
    clearKioskLocalSessionCache();
  }
}

async function resolveKioskAppInstanceName(apiBase: string): Promise<string> {
  const stored = readStoredAppInstanceName();
  if (stored) return stored;

  const res = await fetch(
    `${apiBase}api/appInstance/list?ipAddress=${encodeURIComponent(window.location.hostname)}&type=KIOSK`,
  );
  if (!res.ok) {
    throw new Error(`appInstance/list HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    data?: { appInstances?: AppInstanceRow[] };
    appInstances?: AppInstanceRow[];
  };
  const rows = json?.data?.appInstances ?? json?.appInstances ?? [];
  const kioskRows = rows.filter((row) => (row.type || "KIOSK") === "KIOSK" && row.displayName?.trim());
  const preferred = kioskRows.find((row) => !row.inUse) ?? kioskRows[0];
  const name = preferred?.displayName?.trim();
  if (!name) {
    throw new Error("No KIOSK app instance available on POS");
  }
  writeStoredAppInstanceName(name);
  return name;
}

async function postClientInstanceLogin(
  apiBase: string,
  appInstanceName: string,
): Promise<{
  sessionKey?: string;
  secretKey?: string;
  sessionKeyRemainingActiveTime?: number;
  result?: { successful?: boolean; failureReason?: string };
}> {
  const res = await fetch(`${apiBase}webapp/license/clientInstanceLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appInstanceName,
      appInstanceType: "KIOSK",
      secretKey: resolveSecretKey(),
    }),
  });
  if (!res.ok) {
    throw new Error(`clientInstanceLogin HTTP ${res.status}`);
  }
  return (await res.json()) as {
    sessionKey?: string;
    secretKey?: string;
    sessionKeyRemainingActiveTime?: number;
    result?: { successful?: boolean; failureReason?: string };
  };
}

async function loginKioskSession(): Promise<string> {
  const host = readCurrentKposHost();
  const cached = readStoredSession();
  if (cached) {
    const license = readStoredAppInstanceName();
    if (license) {
      writeKioskEmbedAuthCookies({
        sessionKey: cached,
        appInstanceName: license,
        secretKey: resolveSecretKey() || undefined,
        remainingMs: Math.max(
          60_000,
          Number(sessionStorage.getItem(SESSION_EXPIRES_KEY) || "0") - Date.now(),
        ),
      });
    }
    return cached;
  }

  if (pendingLogin) return pendingLogin;

  pendingLogin = (async () => {
    const { resolveKposApiBase } = await import("./emenu-local-host-control");
    const apiBase = resolveKposApiBase();

    let appInstanceName = await resolveKioskAppInstanceName(apiBase);
    let data = await postClientInstanceLogin(apiBase, appInstanceName);

    // 缓存的设备名可能已失效 / 无 license：清空后按列表重选一次
    if (!data?.result?.successful || !data.sessionKey) {
      try {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      appInstanceName = await resolveKioskAppInstanceName(apiBase);
      data = await postClientInstanceLogin(apiBase, appInstanceName);
    }

    if (!data?.result?.successful || !data.sessionKey) {
      throw new Error(data?.result?.failureReason || "clientInstanceLogin failed");
    }

    const remainingMs = Number(data.sessionKeyRemainingActiveTime) || 23 * 3600 * 1000;
    if (data.secretKey) {
      try {
        localStorage.setItem(SECRET_STORAGE_KEY, data.secretKey);
      } catch {
        /* ignore */
      }
    }
    writeStoredAppInstanceName(appInstanceName);
    writeStoredSession(data.sessionKey, remainingMs, host);
    writeKioskEmbedAuthCookies({
      sessionKey: data.sessionKey,
      appInstanceName,
      secretKey: data.secretKey,
      remainingMs,
    });
    return data.sessionKey;
  })();

  try {
    return await pendingLogin;
  } finally {
    pendingLogin = null;
  }
}

/**
 * 进入 Kiosk 壳后预热当前主机 session，并写回 cookie。
 * 若进入时还没有 sessionKey cookie（刚切主机），调用方应在 resolve 后刷新 iframe。
 */
export async function ensureKioskEmbedSession(): Promise<string> {
  prepareKioskEmbedAuthForHost();
  return loginKioskSession();
}

function isKioskEmbedFrame(source: MessageEventSource | null): boolean {
  if (!source) return false;
  const frames = document.querySelectorAll<HTMLIFrameElement>(
    "[data-kiosk-local-kiosk-frame] iframe, [data-kiosk-local-kiosk-settings-frame] iframe",
  );
  for (const frame of frames) {
    if (frame.contentWindow === source) return true;
  }
  return false;
}

/**
 * 响应 kiosklite iframe 的 getSessionKey，使 Service Setting 等能拉取主机配置。
 */
export function bindKioskLocalSessionBridge(): void {
  if (bridgeBound) return;
  bridgeBound = true;

  window.addEventListener("message", (event) => {
    const data = event.data as { type?: string } | null;
    if (!data || data.type !== "getSessionKey") return;
    if (!isKioskEmbedFrame(event.source)) return;

    const target = event.source as Window;
    void loginKioskSession()
      .then((sessionKey) => {
        target.postMessage({ type: "sessionKey", data: sessionKey }, "*");
      })
      .catch((err) => {
        console.warn("[kiosk-local] failed to resolve POS sessionKey", err);
      });
  });
}
