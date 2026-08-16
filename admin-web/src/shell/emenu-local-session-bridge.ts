/**
 * eMenu 设置页（#/setting）会向 parent 索取 sessionKey，再拉 POS 系统配置。
 * 本桥接通过 /kpos（Vite 动态代理或静态托管绝对地址）调用 clientInstanceLogin。
 *
 * 注意：POS 要求 appInstanceName 为已登记的 EMENU 设备名（license），
 * 任意新名字会返回 Not enough license。
 */

const LICENSE_STORAGE_KEY = "menusifu:emenu-local:appInstanceName";
const SECRET_STORAGE_KEY = "menusifu:emenu-local:secretKey";
const SESSION_STORAGE_KEY = "menusifu:emenu-local:sessionKey";
const SESSION_EXPIRES_KEY = "menusifu:emenu-local:sessionExpiresAt";

let bridgeBound = false;
let pendingLogin: Promise<string> | null = null;

type AppInstanceRow = {
  displayName?: string;
  type?: string;
  inUse?: boolean;
};

function readStoredSession(): string | null {
  try {
    const key = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const expiresAt = Number(sessionStorage.getItem(SESSION_EXPIRES_KEY) || "0");
    if (key && expiresAt > Date.now() + 60_000) return key;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredSession(sessionKey: string, remainingMs: number): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionKey);
    sessionStorage.setItem(SESSION_EXPIRES_KEY, String(Date.now() + Math.max(remainingMs, 60_000)));
  } catch {
    /* ignore */
  }
}

/** 切换 POS 主机后丢弃旧 session，避免仍用旧主机登录态拉配置。 */
export function clearEmenuLocalSessionCache(): void {
  pendingLogin = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
    // 不同主机的设备名可能不同，避免沿用旧 license 名导致 Not enough license
    localStorage.removeItem(LICENSE_STORAGE_KEY);
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

async function resolveEmenuAppInstanceName(apiBase: string): Promise<string> {
  const stored = readStoredAppInstanceName();
  if (stored) return stored;

  const res = await fetch(
    `${apiBase}api/appInstance/list?ipAddress=${encodeURIComponent(window.location.hostname)}&type=EMENU`,
  );
  if (!res.ok) {
    throw new Error(`appInstance/list HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    data?: { appInstances?: AppInstanceRow[] };
    appInstances?: AppInstanceRow[];
  };
  const rows = json?.data?.appInstances ?? json?.appInstances ?? [];
  const emenuRows = rows.filter((row) => (row.type || "EMENU") === "EMENU" && row.displayName?.trim());
  const preferred = emenuRows.find((row) => !row.inUse) ?? emenuRows[0];
  const name = preferred?.displayName?.trim();
  if (!name) {
    throw new Error("No EMENU app instance available on POS");
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
      appInstanceType: "EMENU",
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

async function loginEmenuSession(): Promise<string> {
  const cached = readStoredSession();
  if (cached) return cached;

  if (pendingLogin) return pendingLogin;

  pendingLogin = (async () => {
    const { resolveKposApiBase } = await import("./emenu-local-host-control");
    const apiBase = resolveKposApiBase();

    let appInstanceName = await resolveEmenuAppInstanceName(apiBase);
    let data = await postClientInstanceLogin(apiBase, appInstanceName);

    // 缓存的设备名可能已失效 / 无 license：清空后按列表重选一次
    if (!data?.result?.successful || !data.sessionKey) {
      try {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      appInstanceName = await resolveEmenuAppInstanceName(apiBase);
      data = await postClientInstanceLogin(apiBase, appInstanceName);
    }

    if (!data?.result?.successful || !data.sessionKey) {
      throw new Error(data?.result?.failureReason || "clientInstanceLogin failed");
    }
    if (data.secretKey) {
      try {
        localStorage.setItem(SECRET_STORAGE_KEY, data.secretKey);
      } catch {
        /* ignore */
      }
    }
    writeStoredAppInstanceName(appInstanceName);
    writeStoredSession(data.sessionKey, Number(data.sessionKeyRemainingActiveTime) || 23 * 3600 * 1000);
    return data.sessionKey;
  })();

  try {
    return await pendingLogin;
  } finally {
    pendingLogin = null;
  }
}

function isEmenuEmbedFrame(source: MessageEventSource | null): boolean {
  if (!source) return false;
  const frames = document.querySelectorAll<HTMLIFrameElement>(
    "[data-emenu-local-emenu-frame] iframe, [data-emenu-local-emenu-settings-frame] iframe",
  );
  for (const frame of frames) {
    if (frame.contentWindow === source) return true;
  }
  return false;
}

/**
 * 响应 emenu-new iframe 的 getSessionKey，使设置页能拉取真实 POS 配置。
 */
export function bindEmenuLocalSessionBridge(): void {
  if (bridgeBound) return;
  bridgeBound = true;

  window.addEventListener("message", (event) => {
    const data = event.data as { type?: string } | null;
    if (!data || data.type !== "getSessionKey") return;
    if (!isEmenuEmbedFrame(event.source)) return;

    const target = event.source as Window;
    void loginEmenuSession()
      .then((sessionKey) => {
        target.postMessage({ type: "sessionKey", data: sessionKey }, "*");
      })
      .catch((err) => {
        console.warn("[emenu-local] failed to resolve POS sessionKey", err);
      });
  });
}
