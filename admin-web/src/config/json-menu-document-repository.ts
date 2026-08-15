import { serializeMenuDocument } from "./json-menu-document-serializer";
import type { MenuDocument, MenuNode } from "./json-menu-document-domain";

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

const DEMO_PUBLISHED_KEY = "menusifu:json-menu-editor:published-v2";
const DEMO_DRAFT_KEY = "menusifu:json-menu-editor:draft-v2";

const demoNodes: MenuNode[] = [
  { id: "1", name: "Home", key: "home", path: "/home", icon: "HomeOutlined", i18nKey: "home", i18nInfo: { "zh-CN": "首页", "zh-HK": "首頁", "en-US": "Home" }, type: "inner" },
  { id: "2", name: "Operations", key: "operations", icon: "AppstoreOutlined", i18nInfo: { "zh-CN": "运营中心", "zh-HK": "營運中心", "en-US": "Operations" }, children: [
    { id: "2-1", name: "Dashboard", key: "operations_dashboard", path: "/operations/dashboard", icon: "AreaChartOutlined", i18nInfo: { "zh-CN": "经营看板", "zh-HK": "經營看板", "en-US": "Dashboard" }, type: "inner" },
    { id: "2-2", name: "Partner Center", key: "partner_center", path: "/operations/partner", icon: "GlobalOutlined", i18nInfo: { "zh-CN": "合作方中心", "zh-HK": "合作方中心", "en-US": "Partner Center" }, type: "iframe", url: "https://example.com/partner" },
  ] },
  { id: "3", name: "Products", key: "products", icon: "ShoppingOutlined", i18nInfo: { "zh-CN": "商品中心", "zh-HK": "商品中心", "en-US": "Products" }, children: [
    { id: "3-1", name: "Catalog", key: "catalog", icon: "BarsOutlined", i18nInfo: { "zh-CN": "商品目录", "zh-HK": "商品目錄", "en-US": "Catalog" }, children: [
      { id: "3-1-1", name: "Product List", key: "product_list", path: "/products/list", i18nInfo: { "zh-CN": "商品列表", "zh-HK": "商品列表", "en-US": "Product List" }, type: "inner" },
    ] },
  ] },
];

function defaultDemoDocument(): MenuDocument {
  return {
    _id: "67d2d3412011b635378d3efc",
    name: "B Platform Menu",
    menu: structuredClone(demoNodes),
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
  if (!repository) repository = import.meta.env.DEV ? new DemoMenuDocumentRepository() : new HttpMenuDocumentRepository();
  return repository;
}

export function setMenuDocumentRepositoryForTesting(next: MenuDocumentRepository | null): void {
  repository = next;
}
