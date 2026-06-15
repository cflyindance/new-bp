/**
 * BPlant API 客户端 — 鉴权 + 多租户头（P5/P6）
 */
import { getAuthenticatedEmail } from "../auth/login";

const API_TOKEN_KEY = "bplant-api-token";
const API_TENANT_KEY = "bplant-api-tenant";
const API_TENANTS_KEY = "bplant-api-tenants";

export interface ApiTenantOption {
  id: string;
  title: string;
  titleEn?: string;
}

export function getApiBearerToken(): string | null {
  try {
    return sessionStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiBearerToken(token: string | null): void {
  try {
    if (!token) sessionStorage.removeItem(API_TOKEN_KEY);
    else sessionStorage.setItem(API_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function getApiTenantId(): string {
  try {
    return sessionStorage.getItem(API_TENANT_KEY) ?? "demo-tenant";
  } catch {
    return "demo-tenant";
  }
}

export function setApiTenantId(tenantId: string): void {
  try {
    sessionStorage.setItem(API_TENANT_KEY, tenantId);
  } catch {
    /* ignore */
  }
}

export function getApiTenantOptions(): ApiTenantOption[] {
  try {
    const raw = sessionStorage.getItem(API_TENANTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApiTenantOption[];
  } catch {
    return [];
  }
}

export function setApiTenantOptions(tenants: ApiTenantOption[]): void {
  try {
    sessionStorage.setItem(API_TENANTS_KEY, JSON.stringify(tenants));
  } catch {
    /* ignore */
  }
}

export function clearApiBearerToken(): void {
  setApiBearerToken(null);
  try {
    sessionStorage.removeItem(API_TENANT_KEY);
    sessionStorage.removeItem(API_TENANTS_KEY);
  } catch {
    /* ignore */
  }
}

export function buildApiHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const token = getApiBearerToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const email = getAuthenticatedEmail();
  if (email) headers["X-BPlant-User"] = email;
  headers["X-BPlant-Tenant"] = getApiTenantId();
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(extra)) {
      for (const [k, v] of extra) headers[k] = v;
    } else {
      Object.assign(headers, extra);
    }
  }
  return headers;
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = buildApiHeaders(init?.headers);
  return fetch(input, { ...init, headers });
}

export async function loginToBplantApi(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      token?: string;
      tenantId?: string;
      tenants?: ApiTenantOption[];
    };
    if (data.token) setApiBearerToken(data.token);
    if (data.tenantId) setApiTenantId(data.tenantId);
    if (data.tenants?.length) setApiTenantOptions(data.tenants);
    return Boolean(data.token);
  } catch {
    return false;
  }
}

export async function switchApiTenant(tenantId: string): Promise<boolean> {
  const allowed = getApiTenantOptions().some((t) => t.id === tenantId);
  if (getApiTenantOptions().length > 0 && !allowed) return false;
  setApiTenantId(tenantId);
  return true;
}
