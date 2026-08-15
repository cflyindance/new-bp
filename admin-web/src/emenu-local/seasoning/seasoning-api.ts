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
  SeasoningOptionCategory,
  SeasoningOptionPickerSnapshot,
  SeasoningProduct,
  SeasoningRelationPageSize,
  SeasoningRelationProductPage,
  SeasoningRelationSummary,
  SeasoningMenuStructure,
} from "./seasoning-types";
import { SeasoningApiError } from "./seasoning-api-error";
import { resolveSeasoningApiMode } from "./seasoning-api-mode";

export { SeasoningApiError } from "./seasoning-api-error";

const API_BASE = "/api/v1/emenu-local/seasoning";
const SESSION_ID = globalThis.crypto?.randomUUID?.() ?? `seasoning-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const API_MODE = resolveSeasoningApiMode(
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_EMENU_SEASONING_MODE,
  globalThis.location?.hostname ?? "localhost",
);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (API_MODE === "browser") {
    const { browserSeasoningRequest } = await import("./seasoning-browser-transport");
    return browserSeasoningRequest<T>(path, init);
  }
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

export type SeasoningRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export function createSeasoningApi(client: SeasoningRequest = request) {
  return {
  bootstrap: () => client<SeasoningBootstrap>("/bootstrap"),
  summaries: (params: { query?: string; action?: string; categoryId?: string; status?: string; cursor?: string; limit?: number }) =>
    client<CursorPage<SeasoningRelationSummary>>(`/relations/summary${query(params)}`),
  relationProductGroups: (params: { query?: string; action?: string; categoryId?: string; status?: string; page?: number; limit?: SeasoningRelationPageSize }) =>
    client<SeasoningRelationProductPage>(`/relations/product-groups${query(params)}`),
  options: (params: { query?: string; status?: string; categoryId?: string; cursor?: string; limit?: number }) =>
    client<CursorPage<SeasoningOption>>(`/options${query(params)}`),
  optionPicker: (params: { query?: string } = {}) => client<SeasoningOptionPickerSnapshot>(`/option-picker${query(params)}`),
  optionCategories: (includeInactive = true) => client<{ version: number; items: SeasoningOptionCategory[] }>(`/option-categories${query({ includeInactive: includeInactive ? 1 : 0 })}`),
  createOptionCategory: (body: { expectedVersion: number; name: string; code: string }) => client<{ version: number; category: SeasoningOptionCategory }>("/option-categories", { method: "POST", body: JSON.stringify(body) }),
  updateOptionCategory: (categoryId: string, body: { expectedVersion: number; name?: string; status?: "active" | "inactive" }) => client<{ version: number; category: SeasoningOptionCategory }>(`/option-categories/${encodeURIComponent(categoryId)}`, { method: "PATCH", body: JSON.stringify(body) }),
  reorderOptionCategories: (body: { expectedVersion: number; categoryIds: string[] }) => client<{ version: number; items: SeasoningOptionCategory[] }>("/option-categories/order", { method: "PUT", body: JSON.stringify(body) }),
  deleteOptionCategory: (categoryId: string, body: { expectedVersion: number }) => client<{ version: number }>(`/option-categories/${encodeURIComponent(categoryId)}`, { method: "DELETE", body: JSON.stringify(body) }),
  createOption: (body: { expectedVersion: number; name: string; nameEn?: string; code: string; categoryId: string; sortOrder?: number }) =>
    client<{ option: SeasoningOption; version: number }>("/options", { method: "POST", body: JSON.stringify(body) }),
  updateOption: (optionId: string, body: { expectedVersion: number; name?: string; nameEn?: string; categoryId?: string; sortOrder?: number; status?: "active" | "inactive" }) =>
    client<{ option: SeasoningOption; version: number }>(`/options/${encodeURIComponent(optionId)}`, { method: "PATCH", body: JSON.stringify(body) }),
  products: (params: { query?: string; categoryId?: string; action?: string; optionIds?: string; cursor?: string; limit?: number }) =>
    client<CursorPage<SeasoningProduct>>(`/products${query(params)}`),
  menuStructure: (params: { selectionToken: string; query?: string; groupId?: string; categoryId?: string; cursor?: string; limit?: number }) =>
    client<SeasoningMenuStructure>(`/menu-structure${query(params)}`),
  createProductSelection: () => client<ProductSelectionDraft>("/product-selections", { method: "POST", body: "{}" }),
  productSelection: (token: string) => client<ProductSelectionDraft>(`/product-selections/${encodeURIComponent(token)}`),
  updateProductSelection: (token: string, body:
    | { operation: "dish"; productId: string; groupId?: string; selected: boolean }
    | { operation: "scope"; level: "group" | "category" | "search"; groupId?: string; categoryId?: string; query?: string; selected: boolean }) =>
    client<ProductSelectionDraft>(`/product-selections/${encodeURIComponent(token)}`, { method: "PATCH", body: JSON.stringify(body) }),
  discardProductSelection: (token: string) => client<void>(`/product-selections/${encodeURIComponent(token)}`, { method: "DELETE" }),
  relationProducts: (params: { action: SeasoningActionCode; optionId: string; query?: string; categoryId?: string; cursor?: string; limit?: number }) =>
    client<CursorPage<{ product: SeasoningProduct; priceDelta: number; status: "active" | "inactive"; id: string }>>(`/relations/products${query(params)}`),
  productRelations: (productId: string) =>
    client<{ product: SeasoningProduct; relations: ProductSeasoningRelation[]; version: number }>(`/products/${encodeURIComponent(productId)}/relations`),
  saveProductRelations: (productId: string, body: { expectedVersion: number; relations: Omit<ProductSeasoningRelation, "id" | "productId" | "createdAt" | "updatedAt">[] }) =>
    client<{ relations: ProductSeasoningRelation[]; version: number }>(`/products/${encodeURIComponent(productId)}/relations`, { method: "PUT", body: JSON.stringify(body) }),
  previewBatch: (body: { actionOptions: BatchActionOptions[]; productSelectionToken: string; expectedVersion: number }) =>
    client<BatchPreviewResponse>("/relations/preview", { method: "POST", body: JSON.stringify(body) }),
  previewItems: (previewToken: string, params: { kind?: string; cursor?: string; limit?: number }) =>
    client<BatchPreviewPage>(`/relation-previews/${encodeURIComponent(previewToken)}/items${query(params)}`),
  previewProducts: (previewToken: string, params: { kind?: string; cursor?: string; page?: number; limit?: number }) =>
    client<BatchPreviewProductPage>(`/relation-previews/${encodeURIComponent(previewToken)}/products${query(params)}`),
  updatePreviewDecision: (previewToken: string, body: BatchDecision) =>
    client<{ candidate: BatchPreviewPage["items"][number]; unresolvedCount: number; summary: BatchPreviewPage["summary"] }>(`/relation-previews/${encodeURIComponent(previewToken)}/items`, { method: "PATCH", body: JSON.stringify(body) }),
  discardPreview: (previewToken: string) => client<void>(`/relation-previews/${encodeURIComponent(previewToken)}`, { method: "DELETE" }),
  commitBatch: (body: { expectedVersion: number; previewToken: string }) =>
    client<BatchCommitResult>("/relations/batch", { method: "POST", body: JSON.stringify(body) }),
  };
}

export const seasoningApi = createSeasoningApi();
