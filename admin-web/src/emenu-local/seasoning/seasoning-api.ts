import type {
  BatchCommitResult,
  BatchActionOptions,
  BatchDecision,
  BatchPreviewPage,
  BatchPreviewProductPage,
  BatchPreviewResponse,
  CursorPage,
  ProductSeasoningRelation,
  ProductSelectionDraft,
  SeasoningActionCode,
  SeasoningBootstrap,
  SeasoningOption,
  SeasoningProduct,
  SeasoningRelationSummary,
  SeasoningMenuStructure,
} from "./seasoning-types";

const API_BASE = "/api/v1/emenu-local/seasoning";
const SESSION_ID = globalThis.crypto?.randomUUID?.() ?? `seasoning-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export class SeasoningApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly payload: unknown,
  ) {
    super(code);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", "X-Seasoning-Session": SESSION_ID, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  const payload = await response.json().catch(() => ({ error: "invalid_response" }));
  if (!response.ok) {
    const code = typeof payload?.error === "string" ? payload.error : "request_failed";
    throw new SeasoningApiError(response.status, code, payload);
  }
  return payload as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const value = search.toString();
  return value ? `?${value}` : "";
}

export const seasoningApi = {
  bootstrap: () => request<SeasoningBootstrap>("/bootstrap"),
  summaries: (params: { query?: string; action?: string; categoryId?: string; status?: string; cursor?: string; limit?: number }) =>
    request<CursorPage<SeasoningRelationSummary>>(`/relations/summary${query(params)}`),
  options: (params: { query?: string; status?: string; cursor?: string; limit?: number }) =>
    request<CursorPage<SeasoningOption>>(`/options${query(params)}`),
  createOption: (body: { expectedVersion: number; name: string; nameEn?: string; code: string; sortOrder?: number }) =>
    request<{ option: SeasoningOption; version: number }>("/options", { method: "POST", body: JSON.stringify(body) }),
  updateOption: (optionId: string, body: { expectedVersion: number; name?: string; nameEn?: string; sortOrder?: number; status?: "active" | "inactive" }) =>
    request<{ option: SeasoningOption; version: number }>(`/options/${encodeURIComponent(optionId)}`, { method: "PATCH", body: JSON.stringify(body) }),
  products: (params: { query?: string; categoryId?: string; action?: string; optionIds?: string; cursor?: string; limit?: number }) =>
    request<CursorPage<SeasoningProduct>>(`/products${query(params)}`),
  menuStructure: (params: { selectionToken: string; query?: string; groupId?: string; categoryId?: string; cursor?: string; limit?: number }) =>
    request<SeasoningMenuStructure>(`/menu-structure${query(params)}`),
  createProductSelection: () => request<ProductSelectionDraft>("/product-selections", { method: "POST", body: "{}" }),
  productSelection: (token: string) => request<ProductSelectionDraft>(`/product-selections/${encodeURIComponent(token)}`),
  updateProductSelection: (token: string, body:
    | { operation: "dish"; productId: string; selected: boolean }
    | { operation: "scope"; level: "group" | "category" | "search"; groupId?: string; categoryId?: string; query?: string; selected: boolean }) =>
    request<ProductSelectionDraft>(`/product-selections/${encodeURIComponent(token)}`, { method: "PATCH", body: JSON.stringify(body) }),
  discardProductSelection: (token: string) => request<void>(`/product-selections/${encodeURIComponent(token)}`, { method: "DELETE" }),
  relationProducts: (params: { action: SeasoningActionCode; optionId: string; query?: string; categoryId?: string; cursor?: string; limit?: number }) =>
    request<CursorPage<{ product: SeasoningProduct; priceDelta: number; status: "active" | "inactive"; id: string }>>(`/relations/products${query(params)}`),
  productRelations: (productId: string) =>
    request<{ product: SeasoningProduct; relations: ProductSeasoningRelation[]; version: number }>(`/products/${encodeURIComponent(productId)}/relations`),
  saveProductRelations: (productId: string, body: { expectedVersion: number; relations: Omit<ProductSeasoningRelation, "id" | "productId" | "createdAt" | "updatedAt">[] }) =>
    request<{ relations: ProductSeasoningRelation[]; version: number }>(`/products/${encodeURIComponent(productId)}/relations`, { method: "PUT", body: JSON.stringify(body) }),
  previewBatch: (body: { actionOptions: BatchActionOptions[]; productSelectionToken: string; expectedVersion: number }) =>
    request<BatchPreviewResponse>("/relations/preview", { method: "POST", body: JSON.stringify(body) }),
  previewItems: (previewToken: string, params: { kind?: string; cursor?: string; limit?: number }) =>
    request<BatchPreviewPage>(`/relation-previews/${encodeURIComponent(previewToken)}/items${query(params)}`),
  previewProducts: (previewToken: string, params: { kind?: string; cursor?: string; page?: number; limit?: number }) =>
    request<BatchPreviewProductPage>(`/relation-previews/${encodeURIComponent(previewToken)}/products${query(params)}`),
  updatePreviewDecision: (previewToken: string, body: BatchDecision) =>
    request<{ candidate: BatchPreviewPage["items"][number]; unresolvedCount: number; summary: BatchPreviewPage["summary"] }>(`/relation-previews/${encodeURIComponent(previewToken)}/items`, { method: "PATCH", body: JSON.stringify(body) }),
  discardPreview: (previewToken: string) => request<void>(`/relation-previews/${encodeURIComponent(previewToken)}`, { method: "DELETE" }),
  commitBatch: (body: { expectedVersion: number; previewToken: string }) =>
    request<BatchCommitResult>("/relations/batch", { method: "POST", body: JSON.stringify(body) }),
};
