import type { MenuNode, MenuNodeType } from "./json-menu-document-domain";

export type PageRouting = Pick<MenuNode, "type" | "path" | "url" | "microAppConfig" | "externalConfig">;
export interface PageRegistration {
  id: string;
  title: string;
  titleEn?: string;
  module: string;
  status: "active" | "retired";
  source: string;
  routing: PageRouting & { type: Exclude<MenuNodeType, "link">; path: string };
  icon?: string;
  /** 声明能力供查看，不在关联时自动授予或覆盖菜单权限。 */
  permissions?: readonly string[];
}

const routingKeys = ["type", "path", "url", "microAppConfig", "externalConfig"] as const;
function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}
function validHttp(value?: string): boolean {
  try { return Boolean(value && ["http:", "https:"].includes(new URL(value).protocol)); } catch { return false; }
}
export function validatePageRegistrations(pages: readonly PageRegistration[]): string[] {
  const errors: string[] = [], ids = new Set<string>(), paths = new Set<string>();
  for (const page of pages) {
    if (!page.id.trim() || ids.has(page.id)) errors.push(`页面标识为空或重复：${page.id}`);
    if (!page.title.trim() || !page.module.trim()) errors.push(`页面名称或维护模块为空：${page.id}`);
    const path = page.routing.path;
    if (!path.startsWith("/") || path.startsWith("//") || path !== path.trim() || /[?#]/.test(path) || paths.has(path)) errors.push(`路由无效或重复：${path}`);
    if (page.routing.type === "micro-app" && (!page.routing.microAppConfig?.name || !validHttp(page.routing.microAppConfig.url))) errors.push(`微应用加载参数不完整：${page.id}`);
    if (["external", "iframe"].includes(page.routing.type) && !validHttp(page.routing.url)) errors.push(`页面入口必须是 HTTP(S) 地址：${page.id}`);
    ids.add(page.id); paths.add(path);
  }
  return errors;
}
export function searchPageRegistrations(pages: readonly PageRegistration[], query = "", status = "all"): PageRegistration[] {
  const q = query.trim().toLocaleLowerCase();
  return pages.filter(p => (status === "all" || p.status === status) && `${p.title} ${p.titleEn ?? ""} ${p.id} ${p.module} ${p.routing.path}`.toLocaleLowerCase().includes(q));
}
/** 只识别技术快照精确匹配的节点，不重写历史配置，不按路径强行认领。 */
export function matchRegisteredPage(node: MenuNode, pages: readonly PageRegistration[]): PageRegistration | undefined {
  if (node.children?.length || node.targetKey) return undefined;
  return pages.find(page => routingKeys.every(key => canonical(node[key]) === canonical(page.routing[key])));
}
export function bindRegisteredPage(node: MenuNode, page: PageRegistration): MenuNode {
  if (page.status !== "active") throw new Error("该页面已停用，不能新增关联。");
  const errors = validatePageRegistrations([page]);
  if (errors.length) throw new Error(errors[0]);
  if (node.children?.length) throw new Error("有子导航的菜单不需要关联页面。");
  const next = structuredClone(node);
  for (const key of routingKeys) delete next[key];
  delete next.targetKey;
  Object.assign(next, structuredClone(page.routing));
  // 空目录转换为页面；不触及菜单身份、名称、权限、多语言和 extraInfo。
  if (next.children?.length === 0) delete next.children;
  return next;
}
