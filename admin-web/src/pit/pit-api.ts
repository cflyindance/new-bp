import { PitApiError } from "./pit-api-error";
import { getPitCsrfToken } from "./pit-session";
import type {
  PitApiEnvelope,
  PitApiErrorEnvelope,
  PitAuditEvent,
  PitAuditQuery,
  PitAuthMe,
  PitBackupRecord,
  PitBootstrapInput,
  PitDashboardSummary,
  PitDictionaryCreateInput,
  PitDictionaryItem,
  PitDictionaryType,
  PitDictionaryUpdateInput,
  PitExportJob,
  PitHealth,
  PitImportDecisionsInput,
  PitImportDetail,
  PitImportJob,
  PitLoginInput,
  PitPage,
  PitRequirement,
  PitRequirementList,
  PitRequirementListQuery,
  PitRequirementPatchInput,
  PitRequirementTransitionInput,
  PitRequirementWriteInput,
  PitSetupStatus,
  PitUser,
  PitUserCreateInput,
  PitUserUpdateInput,
} from "./pit-types";

const PIT_API_PREFIX = "/api/v1/pit";

type QueryValue = string | number | boolean | null | undefined | readonly (string | number | boolean)[];
type QueryInput = Record<string, QueryValue>;
type PitRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  csrf?: boolean;
  rawBody?: BodyInit;
  authEvents?: boolean;
};

function queryString(query?: QueryInput): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null || raw === "") continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) params.append(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function emitApiState(name: "pit:unauthorized" | "pit:forbidden"): void {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name));
}

async function parseFailure(response: Response, authEvents: boolean): Promise<never> {
  let error = { code: "request_failed", message: `PIT 服务请求失败 (${response.status})` };
  try {
    const payload = await response.json() as PitApiErrorEnvelope;
    if (payload?.error?.code && payload.error.message) error = payload.error;
  } catch {
    // Non-JSON proxy/server failures retain the safe generic message.
  }
  if (authEvents && response.status === 401) emitApiState("pit:unauthorized");
  if (authEvents && response.status === 403) emitApiState("pit:forbidden");
  throw new PitApiError(response.status, error);
}

async function request<T>(path: string, options: PitRequestOptions = {}): Promise<T> {
  const { body: jsonBody, rawBody, csrf, authEvents, ...requestInit } = options;
  const method = String(requestInit.method ?? "GET").toUpperCase();
  const headers = new Headers(requestInit.headers);
  let body: BodyInit | undefined = rawBody;
  if (jsonBody !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(jsonBody);
  }
  const writes = method !== "GET" && method !== "HEAD";
  const csrfToken = getPitCsrfToken();
  if (writes && csrf !== false && csrfToken) headers.set("X-CSRF-Token", csrfToken);

  let response: Response;
  try {
    response = await fetch(`${PIT_API_PREFIX}${path}`, {
      ...requestInit,
      method,
      headers,
      body,
      credentials: "same-origin",
    });
  } catch (error) {
    throw new PitApiError(0, {
      code: "network_unavailable",
      message: "无法连接 PIT 服务，请检查服务是否启动。",
      fields: error instanceof Error ? { network: error.message } : undefined,
    });
  }
  if (!response.ok) return parseFailure(response, authEvents ?? Boolean(csrfToken));
  if (response.status === 204) return undefined as T;
  const envelope = await response.json() as PitApiEnvelope<T>;
  return envelope.data;
}

async function download(path: string): Promise<Response> {
  const response = await fetch(`${PIT_API_PREFIX}${path}`, { credentials: "same-origin" });
  if (!response.ok) return parseFailure(response, true);
  return response;
}

function requirementQuery(query: PitRequirementListQuery): QueryInput {
  return query as unknown as QueryInput;
}

export const pitApi = {
  setupStatus: () => request<PitSetupStatus>("/setup/status"),
  bootstrap: (input: PitBootstrapInput) => request<{ user: PitUser }>("/setup/bootstrap", { method: "POST", body: input, csrf: false }),
  login: (input: PitLoginInput) => request<{ user: PitUser }>("/auth/login", { method: "POST", body: input, csrf: false }),
  logout: () => request<{ loggedOut: boolean }>("/auth/logout", { method: "POST", body: {} }),
  me: () => request<PitAuthMe>("/auth/me"),

  health: () => request<PitHealth>("/health"),
  dashboardSummary: () => request<PitDashboardSummary>("/dashboard/summary"),

  listRequirements: (query: PitRequirementListQuery = {}) => request<PitRequirementList>(`/requirements${queryString(requirementQuery(query))}`),
  createRequirement: (input: PitRequirementWriteInput) => request<{ requirement: PitRequirement }>("/requirements", { method: "POST", body: input }),
  getRequirement: (id: string, options: { deleted?: "only" | "include" } = {}) => request<{ requirement: PitRequirement }>(`/requirements/${encodeURIComponent(id)}${queryString(options as QueryInput)}`),
  updateRequirement: (id: string, input: PitRequirementPatchInput) => request<{ requirement: PitRequirement }>(`/requirements/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
  deleteRequirement: (id: string) => request<{ requirement: PitRequirement }>(`/requirements/${encodeURIComponent(id)}`, { method: "DELETE" }),
  restoreRequirement: (id: string) => request<{ requirement: PitRequirement }>(`/requirements/${encodeURIComponent(id)}/restore`, { method: "POST" }),
  transitionRequirement: (id: string, input: PitRequirementTransitionInput) => request<{ requirement: PitRequirement }>(`/requirements/${encodeURIComponent(id)}/transitions`, { method: "POST", body: input }),
  followRequirement: (id: string): Promise<{ following: boolean }> => request<{ following: boolean }>(`/requirements/${encodeURIComponent(id)}/follow`, { method: "PUT" }),
  unfollowRequirement: (id: string): Promise<{ following: boolean }> => request<{ following: boolean }>(`/requirements/${encodeURIComponent(id)}/follow`, { method: "DELETE" }),

  listDictionaries: (query: { type?: PitDictionaryType; includeInactive?: boolean } = {}) => request<{ items: PitDictionaryItem[] }>(`/dictionaries${queryString(query as QueryInput)}`),
  createDictionary: (input: PitDictionaryCreateInput) => request<{ item: PitDictionaryItem }>("/dictionaries", { method: "POST", body: input }),
  updateDictionary: (id: string, input: PitDictionaryUpdateInput) => request<{ item: PitDictionaryItem }>(`/dictionaries/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
  reorderDictionaries: (type: PitDictionaryType, itemIds: string[]) => request<{ items: PitDictionaryItem[] }>("/dictionaries/order", { method: "PUT", body: { type, itemIds } }),

  listUsers: () => request<{ items: PitUser[] }>("/users"),
  createUser: (input: PitUserCreateInput) => request<{ user: PitUser }>("/users", { method: "POST", body: input }),
  updateUser: (id: string, input: PitUserUpdateInput) => request<{ user: PitUser }>(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
  resetUserPassword: (id: string, password: string) => request<{ reset: boolean; revokedSessions: number }>(`/users/${encodeURIComponent(id)}/reset-password`, { method: "POST", body: { password } }),
  revokeUserSessions: (id: string) => request<{ revokedSessions: number }>(`/users/${encodeURIComponent(id)}/revoke-sessions`, { method: "POST", body: {} }),

  listAuditLog: (query: PitAuditQuery = {}) => request<PitPage<PitAuditEvent>>(`/audit-log${queryString(query as QueryInput)}`),

  previewImport: async (fileName: string, bytes: Blob | ArrayBuffer) => {
    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    headers.set("X-PIT-File-Name", encodeURIComponent(fileName));
    return request<{ job: PitImportJob }>("/imports/preview", { method: "POST", headers, rawBody: bytes });
  },
  listImports: () => request<{ items: PitImportJob[] }>("/imports"),
  getImport: (id: string, query: { page?: number; pageSize?: number } = {}) => request<PitImportDetail>(`/imports/${encodeURIComponent(id)}${queryString(query as QueryInput)}`),
  saveImportDecisions: (id: string, decisions: PitImportDecisionsInput) => request<{ job: PitImportJob }>(`/imports/${encodeURIComponent(id)}/decisions`, { method: "POST", body: decisions }),
  commitImport: (id: string) => request<{ job: PitImportJob; importedCount: number; insertedCount: number; backup: PitBackupRecord }>(`/imports/${encodeURIComponent(id)}/commit`, { method: "POST", body: {} }),

  createExport: (filter: PitRequirementListQuery) => request<{ exportJob: PitExportJob }>("/exports", { method: "POST", body: filter }),
  listExports: (query: { scope?: "all" } = {}) => request<{ items: PitExportJob[] }>(`/exports${queryString(query as QueryInput)}`),
  downloadExport: (id: string) => download(`/exports/${encodeURIComponent(id)}/download`),

  listBackups: () => request<{ items: PitBackupRecord[] }>("/backups"),
  createBackup: () => request<{ backup: PitBackupRecord }>("/backups", { method: "POST", body: {} }),
  downloadBackup: (id: string) => download(`/backups/${encodeURIComponent(id)}/download`),
};

export type PitApi = typeof pitApi;
