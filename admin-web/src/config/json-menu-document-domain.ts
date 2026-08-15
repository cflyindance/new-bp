export type MenuNodeType = "inner" | "external" | "iframe" | "micro-app";
export type EditableMenuNodeType = "inner" | "iframe";
export type MenuLocale = "zh-CN" | "zh-HK" | "en-US";

export interface MenuI18nInfo {
  "zh-CN"?: string;
  "zh-HK"?: string;
  "en-US"?: string;
}

export interface MenuMicroAppConfig {
  url?: string;
  defaultPage?: string;
  iframe?: boolean;
  routeType?: "hash" | "history";
}

export interface MenuPermission { rule?: "some"; value?: string[]; }
export interface MenuAccessControl { bool?: boolean; serviceName?: string; permission?: MenuPermission; }

export interface MenuNode {
  id?: string;
  name?: string;
  key?: string;
  path?: string;
  icon?: string;
  i18nKey?: string;
  i18nInfo?: MenuI18nInfo;
  type?: MenuNodeType;
  url?: string;
  microAppConfig?: MenuMicroAppConfig;
  accessControl?: MenuAccessControl;
  display?: boolean;
  children?: MenuNode[];
}

export interface MenuUpdatedBy { userId: string; timestamp: string; firstname: string; lastname: string | null; }
export interface MenuDocument { _id: string; name: string; menu: MenuNode[]; updatedBy: MenuUpdatedBy; createdDate: number; }
export interface MenuEditorUser { userId: string; firstname: string; lastname: string | null; }
export type MenuNodePath = number[];
export interface MenuNodeVisit { node: MenuNode; path: MenuNodePath; depth: number; ancestors: MenuNode[]; }
export type MenuValidationSeverity = "error" | "warning";
export interface MenuValidationIssue { code: string; severity: MenuValidationSeverity; message: string; path?: MenuNodePath; field?: string; }

export const MENU_ROOT_FIELDS = ["_id", "name", "menu", "updatedBy", "createdDate"] as const;
export const MENU_NODE_FIELDS = ["id", "name", "key", "path", "icon", "i18nKey", "i18nInfo", "type", "url", "microAppConfig", "accessControl", "display", "children"] as const;
export const MENU_I18N_FIELDS = ["zh-CN", "zh-HK", "en-US"] as const;
export const MENU_MICRO_APP_FIELDS = ["url", "defaultPage", "iframe", "routeType"] as const;
export const MENU_ACCESS_FIELDS = ["bool", "serviceName", "permission"] as const;
export const MENU_PERMISSION_FIELDS = ["rule", "value"] as const;
export const EDITABLE_MENU_TYPES: EditableMenuNodeType[] = ["inner", "iframe"];
export const MAX_EDITABLE_MENU_DEPTH = 3;

function randomHex(length: number): string {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("").slice(0, length);
}

export function createMenuObjectId(): string { return randomHex(24); }
export function createEmptyMenuNode(): MenuNode { return { id: createMenuObjectId() }; }
export function createEmptyMenuDocument(user: MenuEditorUser, now = new Date()): MenuDocument {
  return { _id: createMenuObjectId(), name: "", menu: [], updatedBy: { ...user, timestamp: now.toISOString() }, createdDate: now.getTime() };
}

export function walkMenuNodes(nodes: MenuNode[]): MenuNodeVisit[] {
  const visits: MenuNodeVisit[] = [];
  const walk = (items: MenuNode[], parentPath: number[], ancestors: MenuNode[]): void => {
    items.forEach((node, index) => {
      const path = [...parentPath, index];
      visits.push({ node, path, depth: path.length, ancestors });
      if (node.children?.length) walk(node.children, path, [...ancestors, node]);
    });
  };
  walk(nodes, [], []);
  return visits;
}

export function getMenuNodeAtPath(nodes: MenuNode[], path: MenuNodePath): MenuNode | undefined {
  let items = nodes;
  let current: MenuNode | undefined;
  for (const index of path) {
    current = items[index];
    if (!current) return undefined;
    items = current.children ?? [];
  }
  return current;
}

export function getMenuNodeArrayAtParentPath(nodes: MenuNode[], parentPath: MenuNodePath): MenuNode[] | undefined {
  if (!parentPath.length) return nodes;
  const parent = getMenuNodeAtPath(nodes, parentPath);
  if (!parent) return undefined;
  parent.children ??= [];
  return parent.children;
}

export function hasOwnMenuChildren(node: MenuNode): boolean {
  return Object.prototype.hasOwnProperty.call(node, "children");
}

export function isMenuDirectory(node: MenuNode): boolean {
  return hasOwnMenuChildren(node) && !node.path?.trim() && !node.url?.trim();
}

export function resolveEffectiveMenuType(node: MenuNode, ancestors: MenuNode[]): MenuNodeType | undefined {
  if (isMenuDirectory(node)) return undefined;
  if (node.type) return node.type;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor && !isMenuDirectory(ancestor) && ancestor.type) return ancestor.type;
  }
  return undefined;
}

export function isExplicitCompatibilityType(node: MenuNode): boolean {
  return node.type === "external" || node.type === "micro-app";
}

export function getCompatibilityRootPath(nodes: MenuNode[], path: MenuNodePath): MenuNodePath | null {
  for (let depth = 1; depth <= path.length; depth += 1) {
    const prefix = path.slice(0, depth);
    const node = getMenuNodeAtPath(nodes, prefix);
    if (!node) return null;
    if (depth > MAX_EDITABLE_MENU_DEPTH || isExplicitCompatibilityType(node)) return prefix;
  }
  return null;
}

export function isCompatibilityProtected(nodes: MenuNode[], path: MenuNodePath): boolean {
  return Boolean(getCompatibilityRootPath(nodes, path));
}

export function subtreeContainsCompatibility(nodes: MenuNode[], path: MenuNodePath): boolean {
  const node = getMenuNodeAtPath(nodes, path);
  if (!node) return false;
  if (isCompatibilityProtected(nodes, path)) return true;
  return walkMenuNodes(node.children ?? []).some((visit) => {
    const absolutePath = [...path, ...visit.path];
    return isCompatibilityProtected(nodes, absolutePath);
  });
}

export function cloneMenuSubtreeWithFreshIds(node: MenuNode): MenuNode {
  const clone = structuredClone(node);
  clone.id = createMenuObjectId();
  if (hasOwnMenuChildren(node)) clone.children = (node.children ?? []).map(cloneMenuSubtreeWithFreshIds);
  return clone;
}

function samePath(a: MenuNodePath, b: MenuNodePath): boolean { return a.length === b.length && a.every((part, index) => part === b[index]); }
function isPathPrefix(prefix: MenuNodePath, path: MenuNodePath): boolean { return prefix.length <= path.length && prefix.every((part, index) => part === path[index]); }

export function moveMenuNode(nodes: MenuNode[], fromPath: MenuNodePath, targetParentPath: MenuNodePath, targetIndex: number): boolean {
  if (!fromPath.length || targetParentPath.length >= MAX_EDITABLE_MENU_DEPTH || isPathPrefix(fromPath, targetParentPath)) return false;
  if (isCompatibilityProtected(nodes, fromPath) || subtreeContainsCompatibility(nodes, fromPath)) return false;
  const sourceParentPath = fromPath.slice(0, -1);
  const sourceIndex = fromPath.at(-1)!;
  const sourceArray = getMenuNodeArrayAtParentPath(nodes, sourceParentPath);
  const targetArrayBefore = getMenuNodeArrayAtParentPath(nodes, targetParentPath);
  const moving = sourceArray?.[sourceIndex];
  if (!sourceArray || !targetArrayBefore || !moving) return false;
  const subtreeDepth = Math.max(...walkMenuNodes([moving]).map((visit) => visit.depth), 1);
  if (targetParentPath.length + subtreeDepth > MAX_EDITABLE_MENU_DEPTH) return false;
  sourceArray.splice(sourceIndex, 1);
  const adjustedTargetPath = [...targetParentPath];
  if (targetParentPath.length >= fromPath.length && samePath(sourceParentPath, targetParentPath.slice(0, sourceParentPath.length)) && (targetParentPath[sourceParentPath.length] ?? -1) > sourceIndex) {
    adjustedTargetPath[sourceParentPath.length] = targetParentPath[sourceParentPath.length]! - 1;
  }
  const targetArray = getMenuNodeArrayAtParentPath(nodes, adjustedTargetPath);
  if (!targetArray) { sourceArray.splice(sourceIndex, 0, moving); return false; }
  const adjustedIndex = sourceArray === targetArray && sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  targetArray.splice(Math.max(0, Math.min(adjustedIndex, targetArray.length)), 0, moving);
  return true;
}

function isHttpUrl(value?: string): boolean {
  if (!value) return false;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function unknownFields(value: unknown, allowed: readonly string[]): string[] {
  if (!isObject(value)) return [];
  const allow = new Set(allowed);
  return Object.keys(value).filter((key) => !allow.has(key));
}

interface DuplicateOccurrence { node: MenuNode; path: MenuNodePath; }
function collectByField(document: MenuDocument, field: "id" | "key"): Map<string, DuplicateOccurrence[]> {
  const result = new Map<string, DuplicateOccurrence[]>();
  for (const visit of walkMenuNodes(document.menu)) {
    const value = visit.node[field]?.trim();
    if (value) result.set(value, [...(result.get(value) ?? []), { node: visit.node, path: visit.path }]);
  }
  return result;
}
function duplicateFingerprint(items: DuplicateOccurrence[]): string[] {
  return items.map(({ node }) => JSON.stringify(node)).sort();
}
function isPublishedLegacyDuplicate(value: string, current: DuplicateOccurrence[], publishedMap: Map<string, DuplicateOccurrence[]>): boolean {
  const baseline = publishedMap.get(value) ?? [];
  if (baseline.length < 2 || baseline.length !== current.length) return false;
  return JSON.stringify(duplicateFingerprint(baseline)) === JSON.stringify(duplicateFingerprint(current));
}

export function validateMenuDocument(document: MenuDocument, publishedBaseline?: MenuDocument | null): MenuValidationIssue[] {
  const issues: MenuValidationIssue[] = [];
  unknownFields(document, MENU_ROOT_FIELDS).forEach((field) => issues.push({ code: "UNKNOWN_ROOT_FIELD", severity: "error", message: `根字段不在参考结构中：${field}`, field }));
  if (typeof document._id !== "string" || !document._id) issues.push({ code: "INVALID_ROOT_ID", severity: "error", message: "_id 必须是非空字符串", field: "_id" });
  if (typeof document.name !== "string" || !document.name.trim()) issues.push({ code: "INVALID_ROOT_NAME", severity: "error", message: "配置名称不能为空", field: "name" });
  if (!Array.isArray(document.menu)) issues.push({ code: "INVALID_MENU", severity: "error", message: "menu 必须是数组", field: "menu" });
  if (!Number.isFinite(document.createdDate)) issues.push({ code: "INVALID_CREATED_DATE", severity: "error", message: "createdDate 必须是毫秒时间戳", field: "createdDate" });
  if (!isObject(document.updatedBy) || typeof document.updatedBy.userId !== "string" || typeof document.updatedBy.timestamp !== "string" || typeof document.updatedBy.firstname !== "string" || !(typeof document.updatedBy.lastname === "string" || document.updatedBy.lastname === null)) {
    issues.push({ code: "INVALID_UPDATED_BY", severity: "error", message: "updatedBy 结构或数据类型不正确", field: "updatedBy" });
  }

  const idPaths = collectByField(document, "id");
  const keyPaths = collectByField(document, "key");
  const publishedIds = publishedBaseline ? collectByField(publishedBaseline, "id") : new Map<string, DuplicateOccurrence[]>();
  const publishedKeys = publishedBaseline ? collectByField(publishedBaseline, "key") : new Map<string, DuplicateOccurrence[]>();
  const routePaths = new Map<string, MenuNodePath[]>();

  for (const visit of walkMenuNodes(Array.isArray(document.menu) ? document.menu : [])) {
    const { node, path, depth, ancestors } = visit;
    const compatibility = isCompatibilityProtected(document.menu, path);
    unknownFields(node, MENU_NODE_FIELDS).forEach((field) => issues.push({ code: "UNKNOWN_NODE_FIELD", severity: "error", message: `节点字段不在参考结构中：${field}`, path, field }));
    if (depth > MAX_EDITABLE_MENU_DEPTH) issues.push({ code: "LEGACY_DEPTH", severity: "warning", message: "历史四级菜单已进入兼容只读模式", path });
    if (compatibility && (depth <= MAX_EDITABLE_MENU_DEPTH && isExplicitCompatibilityType(node))) issues.push({ code: "LEGACY_TYPE", severity: "warning", message: `${node.type} 节点及其子树按原数据只读保留`, path, field: "type" });
    if (!node.id?.trim()) issues.push({ code: "MISSING_ID", severity: "error", message: "节点 ID 不能为空", path, field: "id" });
    if (!node.key?.trim()) issues.push({ code: "MISSING_KEY", severity: "error", message: "节点 Key 不能为空", path, field: "key" });
    if (node.path?.trim()) routePaths.set(node.path, [...(routePaths.get(node.path) ?? []), path]);
    if (!node.name?.trim()) issues.push({ code: "MISSING_NAME", severity: "error", message: "菜单名称不能为空", path, field: "name" });

    if (!compatibility) {
      if (isMenuDirectory(node)) {
        if (depth >= MAX_EDITABLE_MENU_DEPTH) issues.push({ code: "LEAF_DIRECTORY", severity: "error", message: "三级菜单必须配置可打开的页面", path, field: "type" });
      } else {
        const effectiveType = resolveEffectiveMenuType(node, ancestors);
        if (!effectiveType || !EDITABLE_MENU_TYPES.includes(effectiveType as EditableMenuNodeType)) issues.push({ code: "MISSING_EDITABLE_TYPE", severity: "error", message: "请选择项目内页面或 iframe 嵌入", path, field: "type" });
        if (!node.path?.trim()) issues.push({ code: "MISSING_PATH", severity: "error", message: "可打开菜单必须配置商家后台路由地址", path, field: "path" });
        if (effectiveType === "iframe" && !isHttpUrl(node.url)) issues.push({ code: "INVALID_URL", severity: "error", message: "iframe 节点需要有效的 HTTP(S) 嵌入地址", path, field: "url" });
        if (effectiveType === "iframe" && node.microAppConfig) issues.push({ code: "IFRAME_MICRO_CONFIG", severity: "error", message: "iframe 节点不能生成 microAppConfig", path, field: "microAppConfig" });
      }
    }
    if (node.microAppConfig?.routeType && !["hash", "history"].includes(node.microAppConfig.routeType)) issues.push({ code: "INVALID_ROUTE_TYPE", severity: "error", message: "routeType 只能是 hash 或 history", path, field: "microAppConfig.routeType" });
    if (node.accessControl?.permission?.rule && node.accessControl.permission.rule !== "some") issues.push({ code: "INVALID_PERMISSION_RULE", severity: "error", message: "permission.rule 只能是 some", path, field: "accessControl.permission.rule" });
    if (node.accessControl?.permission?.rule && !node.accessControl.permission.value?.length) issues.push({ code: "EMPTY_PERMISSION_VALUES", severity: "error", message: "配置 permission.rule 后必须填写 permission.value", path, field: "accessControl.permission.value" });
    if (node.i18nInfo && MENU_I18N_FIELDS.some((locale) => !node.i18nInfo?.[locale]?.trim())) issues.push({ code: "INCOMPLETE_I18N", severity: "warning", message: "多语言内容不完整，预览将回退到 name", path, field: "i18nInfo" });
    if (node.icon && /^https?:\/\//.test(node.icon) && !isHttpUrl(node.icon)) issues.push({ code: "INVALID_ICON_URL", severity: "warning", message: "图标 URL 无法识别", path, field: "icon" });
  }

  for (const [id, occurrences] of idPaths) if (occurrences.length > 1) {
    const legacy = isPublishedLegacyDuplicate(id, occurrences, publishedIds);
    occurrences.forEach(({ path }) => issues.push({ code: legacy ? "LEGACY_DUPLICATE_ID" : "DUPLICATE_ID", severity: legacy ? "warning" : "error", message: legacy ? `历史节点 ID 重复，已兼容保留：${id}` : `节点 ID 重复：${id}`, path, field: "id" }));
  }
  for (const [key, occurrences] of keyPaths) if (occurrences.length > 1) {
    const legacy = isPublishedLegacyDuplicate(key, occurrences, publishedKeys);
    occurrences.forEach(({ path }) => issues.push({ code: legacy ? "LEGACY_DUPLICATE_KEY" : "DUPLICATE_KEY", severity: legacy ? "warning" : "error", message: legacy ? `历史节点 Key 重复，已兼容保留：${key}` : `节点 Key 重复：${key}`, path, field: "key" }));
  }
  for (const [route, paths] of routePaths) if (paths.length > 1) paths.forEach((path) => issues.push({ code: "DUPLICATE_PATH", severity: "warning", message: `节点路径重复：${route}`, path, field: "path" }));
  return issues;
}
