import { serializeMenuDocument } from "./json-menu-document-serializer";
import type { MenuDocument } from "./json-menu-document-domain";
import { resolveMenuDocumentRepositoryMode } from "./json-menu-document-repository-mode";
import { buildCurrentMerchantMenuDemoNodes } from "./json-menu-demo-data";

export interface MenuDocumentRepository {
  readPublished(): Promise<MenuDocument>;
  readDraft(): Promise<MenuDocument | null>;
  saveDraft(document: MenuDocument): Promise<MenuDocument>;
  deleteDraft(): Promise<void>;
  publish(document: MenuDocument): Promise<MenuDocument>;
}

export class MenuDocumentConflictError extends Error {
  constructor(message = "菜单配置已被其他用户修改，请重新加载或先导出备份。") {
    super(message);
    this.name = "MenuDocumentConflictError";
  }
}

const API_BASE = "/api/m-platform/menu-document";

export class HttpMenuDocumentRepository implements MenuDocumentRepository {
  private etag = "";

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    headers.set("Accept", "application/json");
    if (init?.body) headers.set("Content-Type", "application/json");
    if (this.etag && init?.method && init.method !== "GET") headers.set("If-Match", this.etag);
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (response.status === 409 || response.status === 412) throw new MenuDocumentConflictError();
    if (!response.ok) throw new Error(`菜单配置服务请求失败（${response.status}）`);
    this.etag = response.headers.get("ETag") ?? this.etag;
    return response;
  }

  async readPublished(): Promise<MenuDocument> {
    return await (await this.request("/published")).json() as MenuDocument;
  }

  async readDraft(): Promise<MenuDocument | null> {
    const response = await fetch(`${API_BASE}/draft`, { headers: { Accept: "application/json" } });
    if (response.status === 404) return null;
    if (response.status === 409 || response.status === 412) throw new MenuDocumentConflictError();
    if (!response.ok) throw new Error(`读取菜单草稿失败（${response.status}）`);
    this.etag = response.headers.get("ETag") ?? this.etag;
    return await response.json() as MenuDocument;
  }

  async saveDraft(document: MenuDocument): Promise<MenuDocument> {
    return await (await this.request("/draft", { method: "PUT", body: JSON.stringify(serializeMenuDocument(document)) })).json() as MenuDocument;
  }

  async deleteDraft(): Promise<void> {
    await this.request("/draft", { method: "DELETE" });
  }

  async publish(document: MenuDocument): Promise<MenuDocument> {
    return await (await this.request("/publish", { method: "POST", body: JSON.stringify(serializeMenuDocument(document)) })).json() as MenuDocument;
  }
}

export const DEMO_PUBLISHED_KEY = "menusifu:json-menu-editor:published-v3";
export const DEMO_DRAFT_KEY = "menusifu:json-menu-editor:draft-v3";

function defaultDemoDocument(): MenuDocument {
  return {
    _id: "67d2d3412011b635378d3efc",
    name: "B Platform Menu",
    menu: buildCurrentMerchantMenuDemoNodes(),
    updatedBy: { userId: "demo", timestamp: new Date().toISOString(), firstname: "Demo", lastname: null },
    createdDate: Date.now(),
  };
}

function readStored(key: string): MenuDocument | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as MenuDocument : null; } catch { return null; }
}

function writeStored(key: string, document: MenuDocument): MenuDocument {
  const serialized = serializeMenuDocument(document);
  localStorage.setItem(key, JSON.stringify(serialized));
  return structuredClone(serialized);
}

export class DemoMenuDocumentRepository implements MenuDocumentRepository {
  async readPublished(): Promise<MenuDocument> {
    return structuredClone(readStored(DEMO_PUBLISHED_KEY) ?? defaultDemoDocument());
  }
  async readDraft(): Promise<MenuDocument | null> {
    return structuredClone(readStored(DEMO_DRAFT_KEY));
  }
  async saveDraft(document: MenuDocument): Promise<MenuDocument> {
    return writeStored(DEMO_DRAFT_KEY, document);
  }
  async deleteDraft(): Promise<void> {
    localStorage.removeItem(DEMO_DRAFT_KEY);
  }
  async publish(document: MenuDocument): Promise<MenuDocument> {
    const saved = writeStored(DEMO_PUBLISHED_KEY, document);
    localStorage.removeItem(DEMO_DRAFT_KEY);
    return saved;
  }
}

let repository: MenuDocumentRepository | null = null;

export function getMenuDocumentRepository(): MenuDocumentRepository {
  if (!repository) {
    const mode = resolveMenuDocumentRepositoryMode(import.meta.env.DEV, window.location.hostname);
    repository = mode === "demo" ? new DemoMenuDocumentRepository() : new HttpMenuDocumentRepository();
  }
  return repository;
}

export function setMenuDocumentRepositoryForTesting(next: MenuDocumentRepository | null): void {
  repository = next;
}
