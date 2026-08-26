export type MenuNodeType = "inner" | "external" | "iframe" | "micro-app" | "link";
export type EditableMenuNodeType = MenuNodeType;
export type MenuLocale = "zh-CN" | "zh-HK" | "en-US";

export interface MenuI18nInfo {
  "zh-CN"?: string;
  "zh-HK"?: string;
  "en-US"?: string;
}

export interface MenuMicroAppConfig {
  name?: string;
  url?: string;
  defaultPage?: string;
  iframe?: boolean;
  keepAlive?: boolean;
  path?: string;
  routeType?: "hash" | "history";
}

export interface MenuExternalConfig { target?: string; features?: string; }

export type MenuPermissionRule = "some" | "every";
export interface MenuPermission { rule?: MenuPermissionRule; value?: string[]; }
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
  targetKey?: string;
  parentKey?: string;
  externalConfig?: MenuExternalConfig;
  microAppConfig?: MenuMicroAppConfig;
  accessControl?: MenuAccessControl;
  display?: boolean;
  disabled?: boolean;
  extraInfo?: unknown;
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
export const MENU_NODE_FIELDS = ["id", "name", "key", "path", "icon", "i18nKey", "i18nInfo", "type", "url", "targetKey", "parentKey", "externalConfig", "microAppConfig", "accessControl", "display", "disabled", "extraInfo", "children"] as const;
export const MENU_I18N_FIELDS = ["zh-CN", "zh-HK", "en-US"] as const;
export const MENU_MICRO_APP_FIELDS = ["name", "url", "iframe", "keepAlive", "path", "defaultPage", "routeType"] as const;
export const MENU_EXTERNAL_CONFIG_FIELDS = ["target", "features"] as const;
export const MENU_ACCESS_FIELDS = ["bool", "serviceName", "permission"] as const;
export const MENU_PERMISSION_FIELDS = ["rule", "value"] as const;
export const EDITABLE_MENU_TYPES: EditableMenuNodeType[] = ["inner", "iframe", "external", "link", "micro-app"];

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

export function resolveEffectiveExternalUrl(node: MenuNode, ancestors: MenuNode[]): string | undefined {
  if (node.type === "external" && node.url?.trim()) return node.url.trim();
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor?.type === "external" && ancestor.url?.trim()) return ancestor.url.trim();
  }
  return undefined;
}

export function resolveEffectiveMicroAppConfig(node: MenuNode, ancestors: MenuNode[]): MenuMicroAppConfig | undefined {
  if (node.type === "micro-app" && node.microAppConfig) return node.microAppConfig;
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (ancestor?.type === "micro-app" && ancestor.microAppConfig) return ancestor.microAppConfig;
  }
  return undefined;
}

export function isExplicitCompatibilityType(node: MenuNode): boolean {
  return false;
}

export function synchronizeMenuParentKeys(nodes: MenuNode[], parentKey?: string): void {
  nodes.forEach((node) => {
    if (parentKey) node.parentKey = parentKey; else delete node.parentKey;
    synchronizeMenuParentKeys(node.children ?? [], node.key?.trim() || undefined);
  });
}

export function getCompatibilityRootPath(nodes: MenuNode[], path: MenuNodePath): MenuNodePath | null {
  for (let depth = 1; depth <= path.length; depth += 1) {
    const prefix = path.slice(0, depth);
    const node = getMenuNodeAtPath(nodes, prefix);
    if (!node) return null;
    if (isExplicitCompatibilityType(node)) return prefix;
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
  if (!fromPath.length || isPathPrefix(fromPath, targetParentPath)) return false;
  if (isCompatibilityProtected(nodes, fromPath) || subtreeContainsCompatibility(nodes, fromPath)) return false;
  const sourceParentPath = fromPath.slice(0, -1);
  const sourceIndex = fromPath.at(-1)!;
  const sourceArray = getMenuNodeArrayAtParentPath(nodes, sourceParentPath);
  const targetArrayBefore = getMenuNodeArrayAtParentPath(nodes, targetParentPath);
  const moving = sourceArray?.[sourceIndex];
  if (!sourceArray || !targetArrayBefore || !moving) return false;
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
function isJsonContainer(value: unknown): boolean { return Array.isArray(value) || isObject(value); }
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
  const keyNodes = new Map(walkMenuNodes(document.menu).filter((visit) => visit.node.key?.trim()).map((visit) => [visit.node.key!.trim(), visit]));

  for (const visit of walkMenuNodes(Array.isArray(document.menu) ? document.menu : [])) {
    const { node, path, depth, ancestors } = visit;
    const compatibility = isCompatibilityProtected(document.menu, path);
    unknownFields(node, MENU_NODE_FIELDS).forEach((field) => issues.push({ code: "UNKNOWN_NODE_FIELD", severity: "error", message: `节点字段不在参考结构中：${field}`, path, field }));
    if (compatibility && isExplicitCompatibilityType(node)) issues.push({ code: "LEGACY_TYPE", severity: "warning", message: `${node.type} 节点及其子树按原数据只读保留`, path, field: "type" });
    if (!node.id?.trim()) issues.push({ code: "MISSING_ID", severity: "error", message: "节点 ID 不能为空", path, field: "id" });
    if (!node.key?.trim()) issues.push({ code: "MISSING_KEY", severity: "error", message: "节点 Key 不能为空", path, field: "key" });
    if (node.path?.trim()) routePaths.set(node.path, [...(routePaths.get(node.path) ?? []), path]);
    if (!node.name?.trim()) issues.push({ code: "MISSING_NAME", severity: "error", message: "菜单名称不能为空", path, field: "name" });
    const expectedParentKey = ancestors.at(-1)?.key?.trim();
    if (node.parentKey !== undefined && (node.parentKey.trim() || undefined) !== expectedParentKey) issues.push({ code: "INVALID_PARENT_KEY", severity: "error", message: expectedParentKey ? `parentKey 应为直接父菜单 Key：${expectedParentKey}` : "一级菜单不能配置 parentKey", path, field: "parentKey" });

    if (!compatibility) {
      if (!isMenuDirectory(node)) {
        const effectiveType = resolveEffectiveMenuType(node, ancestors);
        if (!effectiveType || !EDITABLE_MENU_TYPES.includes(effectiveType as EditableMenuNodeType)) issues.push({ code: "MISSING_EDITABLE_TYPE", severity: "error", message: "请选择菜单用途", path, field: "type" });
        if (effectiveType !== "link" && !node.path?.trim()) issues.push({ code: "MISSING_PATH", severity: "error", message: "当前菜单用途必须配置商家后台路由地址", path, field: "path" });
        if (effectiveType === "iframe" && !isHttpUrl(node.url)) issues.push({ code: "INVALID_URL", severity: "error", message: "iframe 节点需要有效的 HTTP(S) 嵌入地址", path, field: "url" });
        if (effectiveType === "iframe" && node.microAppConfig) issues.push({ code: "IFRAME_MICRO_CONFIG", severity: "error", message: "iframe 节点不能生成 microAppConfig", path, field: "microAppConfig" });
        if (node.type === "external" && !isHttpUrl(node.url)) issues.push({ code: "INVALID_EXTERNAL_URL", severity: "error", message: "外部链接节点需要有效的 HTTP(S) 地址", path, field: "url" });
        if (node.type === "external" && node.microAppConfig) issues.push({ code: "EXTERNAL_MICRO_CONFIG", severity: "error", message: "外部链接节点不能生成 microAppConfig", path, field: "microAppConfig" });
        if (effectiveType === "link") {
          const target = node.targetKey?.trim() ? keyNodes.get(node.targetKey.trim()) : undefined;
          if (!target) issues.push({ code: "INVALID_LINK_TARGET", severity: "error", message: "链接菜单必须选择有效的目标菜单", path, field: "targetKey" });
          else if (target.node === node || isMenuDirectory(target.node) || resolveEffectiveMenuType(target.node, target.ancestors) === "link" || target.node.disabled === true) issues.push({ code: "INVALID_LINK_TARGET", severity: "error", message: "目标不能是自身、目录、链接菜单或已禁用菜单", path, field: "targetKey" });
        }
        if (node.type === "micro-app" && !isHttpUrl(node.microAppConfig?.url)) issues.push({ code: "INVALID_MICRO_APP_URL", severity: "error", message: "显式微应用需要有效的 HTTP(S) 访问地址", path, field: "microAppConfig.url" });
      }
    }
    unknownFields(node.microAppConfig, MENU_MICRO_APP_FIELDS).forEach((field) => issues.push({ code: "UNKNOWN_MICRO_APP_FIELD", severity: "error", message: `微应用字段不在接口结构中：${field}`, path, field: `microAppConfig.${field}` }));
    unknownFields(node.externalConfig, MENU_EXTERNAL_CONFIG_FIELDS).forEach((field) => issues.push({ code: "UNKNOWN_EXTERNAL_CONFIG_FIELD", severity: "error", message: `外链窗口字段不在接口结构中：${field}`, path, field: `externalConfig.${field}` }));
    if (node.type !== "external" && node.externalConfig) issues.push({ code: "UNEXPECTED_EXTERNAL_CONFIG", severity: "error", message: "只有外部链接可以配置 externalConfig", path, field: "externalConfig" });
    if (node.type !== "link" && node.targetKey) issues.push({ code: "UNEXPECTED_TARGET_KEY", severity: "error", message: "只有链接菜单可以配置 targetKey", path, field: "targetKey" });
    if (node.type !== "micro-app" && node.microAppConfig) issues.push({ code: "UNEXPECTED_MICRO_APP_CONFIG", severity: "error", message: "只有显式微应用可以配置 microAppConfig", path, field: "microAppConfig" });
    if (node.extraInfo !== undefined && !isJsonContainer(node.extraInfo)) issues.push({ code: "INVALID_EXTRA_INFO", severity: "error", message: "extraInfo 顶层必须是 JSON 对象或数组", path, field: "extraInfo" });
    if (node.microAppConfig?.routeType && !["hash", "history"].includes(node.microAppConfig.routeType)) issues.push({ code: "INVALID_ROUTE_TYPE", severity: "error", message: "routeType 只能是 hash 或 history", path, field: "microAppConfig.routeType" });
    if (node.accessControl?.permission?.rule && !["some", "every"].includes(node.accessControl.permission.rule)) issues.push({ code: "INVALID_PERMISSION_RULE", severity: "error", message: "permission.rule 只能是 some 或 every", path, field: "accessControl.permission.rule" });
    if (node.accessControl?.permission?.rule && !node.accessControl.permission.value?.length) issues.push({ code: "EMPTY_PERMISSION_VALUES", severity: "error", message: "配置 permission.rule 后必须填写 permission.value", path, field: "accessControl.permission.value" });
    if (node.accessControl?.permission?.value?.length && !node.accessControl.permission.rule) issues.push({ code: "MISSING_PERMISSION_RULE", severity: "error", message: "配置功能权限后必须选择 permission.rule", path, field: "accessControl.permission.rule" });
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
  for (const visit of walkMenuNodes(document.menu)) {
    if (visit.node.type !== "link" || !visit.node.targetKey?.trim()) continue;
    const seen = new Set<string>([visit.node.key?.trim() ?? ""]);
    let targetKey: string | undefined = visit.node.targetKey.trim();
    while (targetKey) {
      if (seen.has(targetKey)) { issues.push({ code: "LINK_CYCLE", severity: "error", message: "链接菜单不能形成循环引用", path: visit.path, field: "targetKey" }); break; }
      seen.add(targetKey);
      const target: MenuNode | undefined = keyNodes.get(targetKey)?.node;
      targetKey = target?.type === "link" ? target.targetKey?.trim() : undefined;
    }
  }
  return issues;
}
