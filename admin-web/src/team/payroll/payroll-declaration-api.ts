import type {
  DeclarationPeriodOverride,
  DeclarationSnapshot,
  DeclarationTemplateFamily,
  DeclarationTemplateVersion,
  EmployeeDeclarationPreference,
} from "./payroll-declaration-types";

const API_BASE = "/api/v1/payroll/declaration";

export class PayrollDeclarationVersionConflictError extends Error {
  constructor(message = "声明模板已被其他页面更新，请重新加载后再操作") {
    super(message);
    this.name = "PayrollDeclarationVersionConflictError";
  }
}

export class PayrollDeclarationValidationError extends Error {
  readonly details: unknown;
  constructor(message: string, details?: unknown) {
    super(message);
    this.name = "PayrollDeclarationValidationError";
    this.details = details;
  }
}

export class PayrollDeclarationPermissionError extends Error {
  constructor(message = "当前账号没有声明模板操作权限") {
    super(message);
    this.name = "PayrollDeclarationPermissionError";
  }
}

export interface DeclarationRepositoryScope {
  organizationId: string;
  storeId?: string;
  actorId: string;
  permission: "view" | "manage" | "publish";
}

export interface PayrollDeclarationRepository {
  listTemplates(): Promise<{ families: DeclarationTemplateFamily[]; versions: DeclarationTemplateVersion[] }>;
  createFamily(input: { localeCode: string; languageDisplayName: string; storeId?: string }): Promise<DeclarationTemplateFamily>;
  saveDraft(input: { familyId: string; source: string; variableSchemaVersion: "v1" }): Promise<DeclarationTemplateVersion>;
  publishVersion(input: { versionId: string; expectedFamilyRevision: number }): Promise<{ family: DeclarationTemplateFamily; version: DeclarationTemplateVersion }>;
  retireVersion(input: { versionId: string; expectedFamilyRevision: number }): Promise<{ family: DeclarationTemplateFamily; version: DeclarationTemplateVersion }>;
  saveEmployeePreference(input: Omit<EmployeeDeclarationPreference, "updatedBy" | "updatedAt">): Promise<EmployeeDeclarationPreference>;
  savePeriodOverride(input: DeclarationPeriodOverride): Promise<DeclarationPeriodOverride>;
  confirmDeclaration(input: Record<string, unknown>): Promise<DeclarationSnapshot>;
  loadSnapshot(employeeId: string, periodId: string): Promise<DeclarationSnapshot | null>;
}

async function readPayload(response: Response): Promise<Record<string, unknown>> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return {};
  return (await response.json()) as Record<string, unknown>;
}

export function createPayrollDeclarationRepository(
  scope: DeclarationRepositoryScope,
  fetchImpl: typeof fetch = fetch,
): PayrollDeclarationRepository {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetchImpl(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Payroll-Organization-Id": scope.organizationId,
        "X-Payroll-Store-Id": scope.storeId ?? "",
        "X-Payroll-Actor-Id": scope.actorId,
        "X-Payroll-Permission": scope.permission,
        ...(init.headers ?? {}),
      },
    });
    const payload = await readPayload(response);
    if (response.status === 409) throw new PayrollDeclarationVersionConflictError(String(payload.message ?? ""));
    if (response.status === 403) throw new PayrollDeclarationPermissionError(String(payload.message ?? ""));
    if (response.status === 400 || response.status === 422) {
      throw new PayrollDeclarationValidationError(String(payload.message ?? "声明数据无效"), payload);
    }
    if (!response.ok) throw new Error(String(payload.message ?? `Declaration API failed (${response.status})`));
    return payload as T;
  };
  const body = (value: unknown): string => JSON.stringify(value);

  return {
    listTemplates: () => request(`/_templates?organizationId=${encodeURIComponent(scope.organizationId)}&storeId=${encodeURIComponent(scope.storeId ?? "")}`),
    createFamily: (input) => request("/families", { method: "POST", body: body({ ...input, organizationId: scope.organizationId }) }),
    saveDraft: ({ familyId, ...input }) => request(`/families/${encodeURIComponent(familyId)}/versions`, { method: "POST", body: body(input) }),
    publishVersion: (input) => request(`/versions/${encodeURIComponent(input.versionId)}/publish`, { method: "POST", body: body({ expectedFamilyRevision: input.expectedFamilyRevision }) }),
    retireVersion: (input) => request(`/versions/${encodeURIComponent(input.versionId)}/retire`, { method: "POST", body: body({ expectedFamilyRevision: input.expectedFamilyRevision }) }),
    saveEmployeePreference: (input) => request(`/preferences/${encodeURIComponent(input.employeeId)}`, { method: "PUT", body: body(input) }),
    savePeriodOverride: (input) => request(`/overrides/${encodeURIComponent(input.periodId)}/${encodeURIComponent(input.employeeId)}`, { method: "PUT", body: body(input) }),
    confirmDeclaration: (input) => request("/confirm", { method: "POST", body: body(input) }),
    loadSnapshot: async (employeeId, periodId) => {
      const result = await request<{ snapshot?: DeclarationSnapshot }>(`/snapshots/${encodeURIComponent(periodId)}/${encodeURIComponent(employeeId)}`);
      return result.snapshot ?? null;
    },
  };
}
