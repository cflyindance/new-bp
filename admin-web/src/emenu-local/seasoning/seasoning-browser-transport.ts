import { SeasoningApiError } from "./seasoning-api-error";
import {
  BrowserBuffer,
  configureSeasoningBrowserStorage,
  ensureSeasoningBrowserStorage,
} from "./seasoning-browser-runtime";

interface BrowserLockManager {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

interface BrowserTransportDependencies {
  storage?: Storage;
  lockManager?: BrowserLockManager;
}

interface NodeLikeRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  on(event: string, callback: (value?: unknown) => void): NodeLikeRequest;
  destroy(): void;
}

const SESSION_ID = globalThis.crypto?.randomUUID?.() ?? `seasoning-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const API_BASE = "/api/v1/emenu-local/seasoning";
const WRITE_LOCK = "emenu-local:seasoning-demo:write:v1";

function createRequest(path: string, init?: RequestInit): NodeLikeRequest {
  const callbacks = new Map<string, (value?: unknown) => void>();
  let scheduled = false;
  const body = typeof init?.body === "string" ? init.body : "";
  const request: NodeLikeRequest = {
    method: (init?.method ?? "GET").toUpperCase(),
    url: `${API_BASE}${path}`,
    headers: { "x-seasoning-session": SESSION_ID },
    on(event, callback) {
      callbacks.set(event, callback);
      if (event === "end" && !scheduled) {
        scheduled = true;
        queueMicrotask(() => {
          if (body) callbacks.get("data")?.(BrowserBuffer.from(body));
          callbacks.get("end")?.();
        });
      }
      return request;
    },
    destroy() {},
  };
  return request;
}

function infrastructureError(code: string, status: number): SeasoningApiError {
  const payload = { error: code, mode: "browser" };
  return new SeasoningApiError(status, code, payload);
}

export function createBrowserSeasoningRequest(dependencies: BrowserTransportDependencies = {}) {
  const storage = dependencies.storage ?? globalThis.localStorage;
  const lockManager = dependencies.lockManager ?? globalThis.navigator?.locks;

  return async function browserRequest<T>(path: string, init?: RequestInit): Promise<T> {
    if (!storage) throw infrastructureError("browser_storage_unavailable", 503);
    configureSeasoningBrowserStorage(storage);
    try {
      ensureSeasoningBrowserStorage();
    } catch (error) {
      const candidate = error as { statusCode?: number; payload?: { error?: string } };
      const code = candidate.payload?.error ?? "browser_storage_unavailable";
      throw infrastructureError(code, candidate.statusCode ?? 503);
    }

    const execute = async (): Promise<T> => {
      const { handleEmenuSeasoningApi } = await import("./generated/seasoning-browser-handler");
      const request = createRequest(path, init);
      let statusCode = 200;
      let raw = "";
      let resolveEnd!: () => void;
      const ended = new Promise<void>((resolve) => { resolveEnd = resolve; });
      const response = {
        get statusCode() { return statusCode; },
        set statusCode(value: number) { statusCode = value; },
        setHeader() {},
        end(value?: unknown) { raw = value === undefined ? "" : String(value); resolveEnd(); },
      };
      await handleEmenuSeasoningApi(request, response, STORAGE_SCOPE);
      await ended;
      const payload = raw ? JSON.parse(raw) : undefined;
      if (statusCode < 200 || statusCode >= 300) {
        const code = typeof payload?.error === "string" ? payload.error : "request_failed";
        throw new SeasoningApiError(statusCode, code, payload);
      }
      return payload as T;
    };

    const method = (init?.method ?? "GET").toUpperCase();
    if (method === "GET") return execute();
    if (!lockManager) throw infrastructureError("browser_lock_unavailable", 503);
    return lockManager.request(WRITE_LOCK, execute);
  };
}

const STORAGE_SCOPE = "browser://emenu-local/seasoning/v1";
export const browserSeasoningRequest = createBrowserSeasoningRequest();
