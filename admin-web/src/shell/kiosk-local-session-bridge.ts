/**
 * Kiosk Lite 配置页（Service Setting 等）会向 parent 索取 sessionKey。
 * 本桥接通过 /kpos 代理调用 POS clientInstanceLogin，再 postMessage 回 iframe。
 */

const LICENSE_STORAGE_KEY = "menusifu:kiosk-local:appInstanceName";
const SECRET_STORAGE_KEY = "menusifu:kiosk-local:secretKey";
const SESSION_STORAGE_KEY = "menusifu:kiosk-local:sessionKey";
const SESSION_EXPIRES_KEY = "menusifu:kiosk-local:sessionExpiresAt";

/** 嵌入后台专用实例名，避免与现场 Kiosk 设备 license（如 22）抢占 Duplicate instance login */
const DEFAULT_APP_INSTANCE_NAME = "admin-web-embed";

let bridgeBound = false;
let pendingLogin: Promise<string> | null = null;

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
export function clearKioskLocalSessionCache(): void {
  pendingLogin = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_KEY);
  } catch {
    /* ignore */
  }
}

function resolveAppInstanceName(): string {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY)?.trim();
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_APP_INSTANCE_NAME;
}

function resolveSecretKey(): string {
  try {
    return localStorage.getItem(SECRET_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

async function loginKioskSession(): Promise<string> {
  const cached = readStoredSession();
  if (cached) return cached;

  if (pendingLogin) return pendingLogin;

  pendingLogin = (async () => {
    const payload = {
      appInstanceName: resolveAppInstanceName(),
      appInstanceType: "KIOSK",
      secretKey: resolveSecretKey(),
    };
    const res = await fetch("/kpos/webapp/license/clientInstanceLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`clientInstanceLogin HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      sessionKey?: string;
      secretKey?: string;
      sessionKeyRemainingActiveTime?: number;
      result?: { successful?: boolean; failureReason?: string };
    };
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
    writeStoredSession(data.sessionKey, Number(data.sessionKeyRemainingActiveTime) || 23 * 3600 * 1000);
    return data.sessionKey;
  })();

  try {
    return await pendingLogin;
  } finally {
    pendingLogin = null;
  }
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
