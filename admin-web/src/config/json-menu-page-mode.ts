import { type MenuNode, type MenuNodeType } from "./json-menu-document-domain";

export type MenuPageMode = "directory" | "inner" | "iframe" | "external" | "link" | "micro-app";

export interface NormalizeMenuPageModeOptions {
  depth: number;
  initialExplicitType?: MenuNodeType;
  inheritedExternalUrl?: string;
  pageModeTouched?: boolean;
}

export type NormalizeMenuPageModeResult = { ok: true; node: MenuNode } | { ok: false; error: string };

function isHttpUrl(value?: string): boolean {
  if (!value) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

export function normalizeMenuNodeForPageMode(
  draft: MenuNode,
  pageMode: MenuPageMode,
  options: NormalizeMenuPageModeOptions,
): NormalizeMenuPageModeResult {
  const node = structuredClone(draft);
  if (pageMode === "directory") {
    if (options.depth >= 3) return { ok: false, error: "三级菜单必须配置可打开的页面。" };
    delete node.type; delete node.path; delete node.url; delete node.targetKey; delete node.externalConfig; delete node.microAppConfig;
    node.children ??= [];
    return { ok: true, node };
  }
  if (pageMode !== "link" && !node.path?.trim()) return { ok: false, error: "请填写商家后台路由地址。" };
  if (node.path?.trim()) node.path = node.path.trim();
  if (pageMode === "inner") {
    node.type = "inner"; delete node.url; delete node.targetKey; delete node.externalConfig; delete node.microAppConfig;
    return { ok: true, node };
  }
  if (pageMode === "link") {
    if (!node.targetKey?.trim()) return { ok: false, error: "请选择链接目标菜单。" };
    node.type = "link"; node.targetKey = node.targetKey.trim();
    delete node.path; delete node.url; delete node.externalConfig; delete node.microAppConfig;
    return { ok: true, node };
  }
  if (pageMode === "micro-app") {
    if (!isHttpUrl(node.microAppConfig?.url)) return { ok: false, error: "请输入有效的 HTTP(S) 微应用访问地址。" };
    node.type = "micro-app"; delete node.url; delete node.targetKey; delete node.externalConfig;
    return { ok: true, node };
  }
  if (pageMode === "external" && options.initialExplicitType !== "external" && !options.pageModeTouched) {
    return { ok: true, node };
  }
  const url = node.url?.trim() || (pageMode === "external" ? options.inheritedExternalUrl?.trim() : undefined);
  if (!isHttpUrl(url)) return { ok: false, error: pageMode === "iframe" ? "请输入有效的 HTTP(S) iframe 嵌入地址。" : "请输入有效的 HTTP(S) 外部链接地址。" };
  node.type = pageMode;
  node.url = url;
  delete node.targetKey;
  if (pageMode !== "external") delete node.externalConfig;
  delete node.microAppConfig;
  return { ok: true, node };
}
