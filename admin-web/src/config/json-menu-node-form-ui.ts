import {
  getCompatibilityRootPath,
  isCompatibilityProtected,
  isMenuDirectory,
  resolveEffectiveExternalUrl,
  resolveEffectiveMenuType,
  subtreeContainsCompatibility,
  walkMenuNodes,
  type MenuDocument,
  type MenuNode,
  type MenuNodePath,
  type MenuValidationIssue,
} from "./json-menu-document-domain";
import { type MenuPageMode } from "./json-menu-page-mode";
import { JSON_MENU_FORM_SECTIONS, type JsonMenuFormSection } from "./json-menu-form-anchor";
import { encodeMenuNodePath } from "./json-menu-tree-ui";

export type MenuDialogMode = "add" | "edit";

const menuFormSectionLabels: Record<JsonMenuFormSection, string> = {
  basic: "基础信息",
  page: "层级与页面",
  localization: "多语言",
  status: "状态权限",
  extra: "高级",
};

function renderMenuFormAnchors(): string {
  return `<nav class="mt-5 flex items-center gap-8 border-t border-slate-100 pt-3" aria-label="菜单配置区块导航" data-jme-form-anchors>${JSON_MENU_FORM_SECTIONS.map((section, index) => `<button type="button" data-jme-form-anchor="${section}" ${index === 0 ? 'aria-current="location"' : ""} class="border-b-2 px-1 pb-3 text-sm font-semibold outline-none transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 ${index === 0 ? "border-blue-500 text-blue-500" : "border-transparent text-slate-500 hover:text-slate-900"}">${menuFormSectionLabels[section]}</button>`).join("")}</nav>`;
}
export type { MenuPageMode } from "./json-menu-page-mode";
export interface MenuNodeDialogState {
  mode: MenuDialogMode;
  targetPath?: MenuNodePath;
  parentPath: MenuNodePath;
  draft: MenuNode;
  pageMode: MenuPageMode;
  error?: string;
  servicePermissionOpen?: boolean;
  initialExplicitType?: MenuNode["type"];
  inheritedExternalUrl?: string;
  pageModeTouched?: boolean;
  extraInfoText?: string;
  linkTargetOpen?: boolean;
  linkTargetCollapsedPaths?: Set<string>;
  linkTargetReturnScrollTop?: number;
  linkTargetSearch?: string;
  parentPickerOpen?: boolean;
  parentPickerCollapsedPaths?: Set<string>;
  parentPickerSearch?: string;
  parentPickerReturnScrollTop?: number;
  movePickerMode?: boolean;
}

function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!); }
function value(input?: string): string { return escapeHtml(input ?? ""); }
function pathIsPrefix(prefix: MenuNodePath, path: MenuNodePath): boolean { return prefix.length <= path.length && prefix.every((part, index) => path[index] === part); }
function field(label: string, name: string, inputValue = "", placeholder = "", required = false, mono = false): string {
  return `<label class="block text-xs font-medium text-slate-700">${required ? `<span class="mr-1 text-red-500">*</span>` : ""}${label}<input name="${name}" data-jme-dialog-field="${name}" value="${value(inputValue)}" placeholder="${escapeHtml(placeholder)}" class="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 ${mono ? "font-mono text-xs" : ""}"></label>`;
}
function triState(label: string, name: string, selected: boolean | undefined): string {
  return `<label class="block text-xs font-medium text-slate-700">${label}<select name="${name}" data-jme-dialog-field="${name}" class="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"><option value="missing" ${selected === undefined ? "selected" : ""}>未选择</option><option value="true" ${selected === true ? "selected" : ""}>是</option><option value="false" ${selected === false ? "selected" : ""}>否</option></select></label>`;
}
function textareaField(label: string, name: string, inputValue = "", placeholder = ""): string {
  return `<label class="block text-sm font-medium text-slate-700">${label}<textarea name="${name}" data-jme-dialog-field="${name}" placeholder="${escapeHtml(placeholder)}" class="mt-2 min-h-36 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">${escapeHtml(inputValue)}</textarea></label>`;
}

function purposeButtons(state: MenuNodeDialogState, canBeDirectory: boolean, locked: boolean): string {
  const items: Array<[MenuPageMode, string]> = [["inner", "项目内页面"], ["iframe", "iframe 嵌入"], ["link", "链接菜单"], ["external", "外部链接"], ["micro-app", "微应用"]];
  return items.map(([mode, text]) => `<button type="button" data-jme-page-mode="${mode}" ${locked ? "disabled" : ""} class="rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${state.pageMode === mode ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.18)] ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"}">${text}</button>`).join("");
}

function pageModeFields(document: MenuDocument, state: MenuNodeDialogState, maxWidth = "max-w-4xl"): string {
  const node = state.draft;
  if (state.pageMode === "directory") return "";
  if (state.pageMode === "link") {
    const target = walkMenuNodes(document.menu).find((visit) => visit.node.key === node.targetKey)?.node;
    return `<div class="mt-4 ${maxWidth} rounded-md border border-slate-200 bg-slate-50 p-4"><p class="text-xs font-medium text-slate-700"><span class="mr-1 text-red-500">*</span>目标菜单</p><button type="button" data-jme-link-target-open class="mt-2 flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm"><span>${escapeHtml(target ? label(target) : "请选择目标菜单")}</span><span class="text-slate-400">选择 ›</span></button></div>`;
  }
  if (state.pageMode === "micro-app") return `<div class="mt-5 ${maxWidth} space-y-5"><div class="grid grid-cols-2 gap-x-5 gap-y-5">${field("商家后台路由地址", "path", node.path, "/report", true, true)}${field("微应用标识", "microAppConfig.name", node.microAppConfig?.name, "menu-products", true, true)}${field("应用入口 URL", "microAppConfig.url", node.microAppConfig?.url, "https://app.example.com", true, true)}${field("激活规则", "microAppConfig.defaultPage", node.microAppConfig?.defaultPage, "/m-platform/products", true, true)}</div><div class="grid grid-cols-2 gap-5">${triState("隔离沙箱", "microAppConfig.iframe", node.microAppConfig?.iframe)}${triState("保持应用状态", "microAppConfig.keepAlive", node.microAppConfig?.keepAlive)}</div></div>`;
  const needsUrl = state.pageMode === "iframe" || state.pageMode === "external";
  return `<div class="mt-4 ${maxWidth} rounded-md border border-slate-200 bg-slate-50 p-4"><div class="grid gap-4 ${needsUrl ? "grid-cols-2" : "grid-cols-1"}">${field("商家后台路由地址", "path", node.path, "/operations/dashboard", true, true)}${needsUrl ? field(state.pageMode === "iframe" ? "iframe 嵌入地址" : "外部链接地址", "url", node.url ?? state.inheritedExternalUrl, "https://example.com/page", true, true) : ""}</div>${state.pageMode === "external" ? `<div class="mt-4 grid grid-cols-2 gap-4"><label class="block text-xs font-medium text-slate-700">打开目标<select data-jme-dialog-field="externalConfig.target" class="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="missing">未配置</option>${["_blank", "_self", "_parent", "_top"].map((item) => `<option value="${item}" ${node.externalConfig?.target === item ? "selected" : ""}>${item}</option>`).join("")}<option value="custom" ${node.externalConfig?.target && !["_blank", "_self", "_parent", "_top"].includes(node.externalConfig.target) ? "selected" : ""}>自定义窗口名</option></select></label>${field("窗口特性 features", "externalConfig.features", node.externalConfig?.features, "width=1200,height=800", false, true)}${node.externalConfig?.target && !["_blank", "_self", "_parent", "_top"].includes(node.externalConfig.target) ? field("自定义窗口名", "externalConfig.targetCustom", node.externalConfig.target, "reportWindow", false, true) : ""}</div><p class="mt-3 text-xs text-slate-500">发布后由商家后台按窗口设置打开。</p>` : ""}</div>`;
}

function renderLinkTargetTree(state: MenuNodeDialogState, nodes: MenuNode[], parentPath: MenuNodePath = [], ancestors: MenuNode[] = []): string {
  const search = state.linkTargetSearch?.trim().toLocaleLowerCase() ?? "";
  const items = nodes.map((node, index) => {
    const path = [...parentPath, index];
    const encodedPath = encodeMenuNodePath(path);
    const children = node.children ?? [];
    const hasChildren = children.length > 0;
    const directory = isMenuDirectory(node);
    const currentNode = Boolean(state.targetPath && encodeMenuNodePath(state.targetPath) === encodedPath);
    const excluded = currentNode || resolveEffectiveMenuType(node, ancestors) === "link" || node.disabled === true;
    const selectable = !directory && !excluded;
    const childrenMarkup = hasChildren ? renderLinkTargetTree(state, children, path, [...ancestors, node]) : "";
    const matches = label(node).toLocaleLowerCase().includes(search);
    if (search && !matches && !childrenMarkup) return "";
    if (!search && !selectable && !hasChildren) return "";
    const collapsed = !search && (state.linkTargetCollapsedPaths?.has(encodedPath) ?? false);
    const selected = selectable && node.key === state.draft.targetKey;
    const rowClass = selected ? "border-teal-300 bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_#0f766e]" : selectable ? "border-transparent text-slate-800 hover:bg-slate-50" : "border-transparent text-slate-700 hover:bg-slate-50";
    const rowContent = `<span class="grid h-5 w-5 shrink-0 place-items-center text-[9px] font-bold text-slate-500">${hasChildren ? (collapsed ? "▶" : "▼") : ""}</span><strong class="min-w-0 flex-1 truncate text-sm">${escapeHtml(label(node))}</strong><span class="shrink-0 text-[10px] text-slate-400">${path.length} 级</span>`;
    const row = directory && hasChildren
      ? `<button type="button" data-jme-link-target-toggle="${encodedPath}" aria-expanded="${collapsed ? "false" : "true"}" class="flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/30 ${rowClass}">${rowContent}</button>`
      : selectable
        ? `<button type="button" data-jme-link-target-key="${escapeHtml(node.key ?? "")}" ${selected ? 'aria-current="true"' : ""} class="flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/30 ${rowClass}">${rowContent}</button>`
        : `<div class="flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left opacity-55 ${rowClass}">${rowContent}</div>`;
    const childTree = childrenMarkup && !collapsed ? `<ol class="ml-5 border-l border-slate-200 pl-3">${childrenMarkup}</ol>` : "";
    return `<li class="relative">${path.length > 1 ? '<span aria-hidden="true" class="pointer-events-none absolute -left-3 top-[22px] w-3 border-t border-slate-200"></span>' : ""}${row}${childTree}</li>`;
  }).join("");
  return items;
}

function renderLinkTargetDialog(document: MenuDocument, state: MenuNodeDialogState): string {
  if (!state.linkTargetOpen) return "";
  const tree = renderLinkTargetTree(state, document.menu);
  return `<div class="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/35 p-4"><section class="flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="jme-link-target-title"><header class="border-b px-6 py-4"><div class="flex items-center justify-between"><h3 id="jme-link-target-title" class="font-semibold">选择链接目标菜单</h3><button type="button" data-jme-link-target-close class="grid h-8 w-8 place-items-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="关闭">×</button></div><label class="mt-3 flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-teal-600 focus-within:bg-white"><span class="text-slate-400">⌕</span><input type="search" name="json-menu-link-target-search" data-jme-link-target-search value="${escapeHtml(state.linkTargetSearch ?? "")}" placeholder="搜索菜单名称" autocomplete="off" data-1p-ignore data-lpignore="true" class="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none"></label></header><div class="min-h-0 flex-1 overflow-y-auto p-3" data-jme-link-target-scroll><ol class="space-y-1">${tree}</ol>${tree ? "" : `<p class="p-8 text-center text-sm text-slate-500">暂无匹配菜单</p>`}</div></section></div>`;
}

function renderParentPickerTree(document: MenuDocument, state: MenuNodeDialogState, nodes: MenuNode[], parentPath: MenuNodePath = []): string {
  const search = state.parentPickerSearch?.trim().toLocaleLowerCase() ?? "";
  return nodes.map((node, index) => {
    const path = [...parentPath, index];
    const encoded = encodeMenuNodePath(path);
    const children = node.children ?? [];
    const childMarkup = renderParentPickerTree(document, state, children, path);
    const matches = label(node).toLocaleLowerCase().includes(search);
    const eligible = !(state.targetPath && pathIsPrefix(state.targetPath, path)) && !isCompatibilityProtected(document.menu, path) && !subtreeContainsCompatibility(document.menu, path);
    if (search && !matches && !childMarkup) return "";
    if (!search && !eligible && !childMarkup) return "";
    const hasChildren = Boolean(childMarkup);
    const collapsed = !search && (state.parentPickerCollapsedPaths?.has(encoded) ?? false);
    const selected = encodeMenuNodePath(state.parentPath) === encoded;
    const rowClass = selected ? "border-teal-300 bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_#0f766e]" : eligible ? "border-transparent text-slate-800 hover:bg-slate-50" : "border-transparent text-slate-500";
    const toggle = hasChildren ? `<button type="button" data-jme-parent-picker-toggle="${encoded}" aria-expanded="${collapsed ? "false" : "true"}" class="grid h-6 w-6 shrink-0 place-items-center rounded text-[9px] font-bold text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-600/30">${collapsed ? "▶" : "▼"}</button>` : `<span class="h-6 w-6 shrink-0"></span>`;
    const content = `<span class="min-w-0 flex-1 truncate text-sm font-semibold">${escapeHtml(label(node))}</span><span class="shrink-0 text-[10px] text-slate-400">${path.length} 级</span>`;
    const row = eligible
      ? `<button type="button" data-jme-parent-picker-path="${encoded}" class="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-600/30 ${rowClass}">${content}</button>`
      : `<div class="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 ${rowClass}">${content}</div>`;
    return `<li class="relative">${path.length > 1 ? '<span aria-hidden="true" class="pointer-events-none absolute -left-3 top-[22px] w-3 border-t border-slate-200"></span>' : ""}<div class="flex items-center gap-1">${toggle}${row}</div>${hasChildren && !collapsed ? `<ol class="ml-8 border-l border-slate-200 pl-3">${childMarkup}</ol>` : ""}</li>`;
  }).join("");
}

function renderParentMenuPicker(document: MenuDocument, state: MenuNodeDialogState, locked: boolean): string {
  const parent = state.parentPath.length ? getNodeLabelAtPath(document.menu, state.parentPath) : "— 作为一级菜单 —";
  const tree = renderParentPickerTree(document, state, document.menu);
  const dialog = state.parentPickerOpen ? `<div class="fixed inset-0 z-[151] flex items-center justify-center bg-slate-950/35 p-4"><section class="flex max-h-[76vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="jme-parent-picker-title"><header class="border-b px-6 py-4"><div class="flex items-center justify-between"><h3 id="jme-parent-picker-title" class="font-semibold">选择父级菜单</h3><button type="button" data-jme-parent-picker-close class="grid h-8 w-8 place-items-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="关闭">×</button></div><label class="mt-3 flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-teal-600 focus-within:bg-white"><span class="text-slate-400">⌕</span><input type="search" name="json-menu-parent-picker-search" data-jme-parent-picker-search value="${escapeHtml(state.parentPickerSearch ?? "")}" placeholder="搜索菜单名称" autocomplete="off" data-1p-ignore data-lpignore="true" class="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none"></label></header><div class="min-h-0 flex-1 overflow-y-auto p-3" data-jme-parent-picker-scroll><button type="button" data-jme-parent-picker-path="" class="flex min-h-11 w-full items-center rounded-lg border px-3 py-2 text-left text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30 ${state.parentPath.length ? "border-transparent text-slate-700 hover:bg-slate-50" : "border-teal-300 bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_#0f766e]"}">— 作为一级菜单 —</button><ol class="mt-1 space-y-1">${tree}</ol>${tree ? "" : `<p class="p-8 text-center text-sm text-slate-500">暂无匹配菜单</p>`}</div></section></div>` : "";
  return `<label class="block text-xs font-medium text-slate-700">父级菜单<button type="button" data-jme-parent-picker-open ${locked ? "disabled" : ""} class="mt-1.5 flex h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left text-sm disabled:bg-slate-100 disabled:text-slate-400"><span class="truncate ${state.parentPath.length ? "text-slate-800" : "text-slate-400"}">${escapeHtml(parent)}</span><span class="text-xl leading-none text-slate-400">›</span></button>${locked ? `<span class="mt-1 block text-[11px] font-normal text-slate-400">该节点包含兼容子树，只允许修改非结构信息。</span>` : ""}</label>${dialog}`;
}

function getNodeLabelAtPath(nodes: MenuNode[], path: MenuNodePath): string {
  let list = nodes;
  let node: MenuNode | undefined;
  for (const index of path) { node = list[index]; if (!node) break; list = node.children ?? []; }
  return node ? label(node) : "— 作为一级菜单 —";
}

function label(node: MenuNode): string { return node.i18nInfo?.["zh-CN"] || node.name || "未命名菜单"; }
function splitMultiValue(input?: string): string[] { return (input ?? "").split(/[,，]/).map((item) => item.trim()).filter(Boolean); }
function unique(values: string[]): string[] { return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b)); }
interface ServicePermissionCatalog {
  services: string[];
  permissionsByService: Map<string, string[]>;
}
function collectServicePermissionOptions(document: MenuDocument, current: MenuNode): ServicePermissionCatalog {
  const permissionsByService = new Map<string, Set<string>>();
  const addNode = (node: MenuNode): void => {
    const services = splitMultiValue(node.accessControl?.serviceName);
    const permissions = unique(node.accessControl?.permission?.value ?? []);
    services.forEach((service) => {
      const known = permissionsByService.get(service) ?? new Set<string>();
      permissions.forEach((permission) => known.add(permission));
      permissionsByService.set(service, known);
    });
  };
  for (const visit of walkMenuNodes(document.menu)) {
    addNode(visit.node);
  }
  addNode(current);
  const fallbackServices = ["cloud_report_service", "epager", "promotion", "m_master", "print"];
  const services = unique([...permissionsByService.keys(), ...splitMultiValue(current.accessControl?.serviceName), ...fallbackServices]);
  services.forEach((service) => { if (!permissionsByService.has(service)) permissionsByService.set(service, new Set()); });
  return {
    services,
    permissionsByService: new Map(services.map((service) => [service, unique([...(permissionsByService.get(service) ?? [])])])),
  };
}
function renderServicePermissionSetting(document: MenuDocument, state: MenuNodeDialogState): string {
  const services = splitMultiValue(state.draft.accessControl?.serviceName);
  const permissions = state.draft.accessControl?.permission?.value ?? [];
  const selected = [...services, ...permissions];
  const summary = selected.length
    ? selected.slice(0, 3).join("、") + (selected.length > 3 ? ` 等 ${selected.length} 项` : "")
    : "未配置";
  return `<div class="rounded-xl border border-slate-300 bg-white px-4 py-3.5">
    <button type="button" data-jme-service-permission-open class="flex w-full items-center gap-3 text-left">
      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-300 text-sm text-slate-700">♧</span><span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-slate-800">服务与权限</span><span class="mt-0.5 block truncate font-mono text-xs text-slate-400" title="${escapeHtml(selected.join(", "))}">${escapeHtml(summary)}</span></span><span class="text-2xl leading-none text-slate-400">›</span>
    </button>
    ${state.servicePermissionOpen ? renderServicePermissionDialog(document, state) : ""}
  </div>`;
}
function renderServicePermissionDialog(document: MenuDocument, state: MenuNodeDialogState): string {
  const options = collectServicePermissionOptions(document, state.draft);
  const serviceSet = new Set(splitMultiValue(state.draft.accessControl?.serviceName));
  const permissionSet = new Set(state.draft.accessControl?.permission?.value ?? []);
  const permissionRule = state.draft.accessControl?.permission?.rule;
  const validPermissionRule = permissionRule === "some" || permissionRule === "every";
  const activeService = options.services.find((service) => serviceSet.has(service)) ?? options.services[0] ?? "";
  const associatedPermissions = new Set(options.services.flatMap((service) => options.permissionsByService.get(service) ?? []));
  const unassignedPermissions = unique([...permissionSet].filter((permission) => !associatedPermissions.has(permission)));
  const serviceItems = options.services.map((service) => {
    const permissions = options.permissionsByService.get(service) ?? [];
    const selectedCount = serviceSet.has(service) ? permissions.filter((permission) => permissionSet.has(permission)).length : 0;
    return `<div class="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 ${service === activeService ? "bg-teal-50" : "bg-white hover:bg-slate-50"}" data-jme-service-permission-service-row="${escapeHtml(service)}">
      <input type="checkbox" data-jme-service-permission-service="${escapeHtml(service)}" ${serviceSet.has(service) ? "checked" : ""} class="h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700 focus:ring-teal-600">
      <button type="button" data-jme-service-permission-view="${escapeHtml(service)}" class="min-w-0 flex-1 truncate text-left font-mono text-xs font-medium ${service === activeService ? "text-teal-800" : "text-slate-700"}">${escapeHtml(service)}</button>
      <span data-jme-service-permission-count="${escapeHtml(service)}" class="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200">${selectedCount}/${permissions.length}</span>
    </div>`;
  }).join("");
  const permissionPanels = options.services.map((service) => {
    const permissions = options.permissionsByService.get(service) ?? [];
    const items = permissions.length
      ? permissions.map((permission) => `<label class="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-slate-50"><input type="checkbox" data-jme-service-permission-permission="${escapeHtml(permission)}" data-jme-service-permission-owner="${escapeHtml(service)}" ${serviceSet.has(service) && permissionSet.has(permission) ? "checked" : ""} class="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"><span class="font-mono">${escapeHtml(permission)}</span></label>`).join("")
      : `<div class="grid min-h-40 place-items-center px-6 text-center text-xs leading-5 text-slate-400">该服务暂未归纳到功能权限。<br>仍可单独订阅此服务。</div>`;
    return `<div data-jme-service-permission-panel="${escapeHtml(service)}" class="${service === activeService ? "" : "hidden"}"><div class="border-b border-slate-100 px-4 py-3"><p class="text-xs text-slate-400">当前服务</p><p class="mt-1 truncate font-mono text-sm font-semibold text-slate-800">${escapeHtml(service)}</p></div><div class="grid grid-cols-1 gap-1 p-3">${items}</div></div>`;
  }).join("");
  const unassignedPanel = unassignedPermissions.length ? `<div class="border-t border-amber-100 bg-amber-50/60 px-4 py-3"><p class="text-xs font-medium text-amber-800">未归属权限</p><p class="mt-1 text-[11px] text-amber-600">现有 JSON 无法判断这些权限所属的服务，将继续原样保留。</p><div class="mt-2 grid grid-cols-1 gap-1">${unassignedPermissions.map((permission) => `<label class="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-700 hover:bg-white"><input type="checkbox" data-jme-service-permission-unassigned="${escapeHtml(permission)}" checked class="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"><span class="font-mono">${escapeHtml(permission)}</span></label>`).join("")}</div></div>` : "";
  const ruleError = permissionSet.size && !validPermissionRule ? "请选择权限满足规则" : "";
  const ruleSelector = `<fieldset class="border-b border-slate-100 px-4 py-3" data-jme-service-permission-rule-group>
    <legend class="text-xs font-medium text-slate-700"><span class="mr-1 text-red-500">*</span>权限满足规则</legend>
    <div class="mt-2 flex flex-wrap gap-2">
      <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:border-teal-500"><input type="radio" name="jme-permission-rule" value="some" data-jme-service-permission-rule ${permissionRule === "some" ? "checked" : ""} class="h-4 w-4 border-slate-300 text-teal-700 focus:ring-teal-600"><span><strong class="font-semibold">some</strong> · 任一权限</span></label>
      <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:border-teal-500"><input type="radio" name="jme-permission-rule" value="every" data-jme-service-permission-rule ${permissionRule === "every" ? "checked" : ""} class="h-4 w-4 border-slate-300 text-teal-700 focus:ring-teal-600"><span><strong class="font-semibold">every</strong> · 全部权限</span></label>
    </div>
    <p class="mt-2 text-[11px] text-red-600 ${ruleError ? "" : "hidden"}" data-jme-service-permission-rule-error>${ruleError}</p>
  </fieldset>`;
  return `<div class="fixed inset-0 z-[130] flex items-center justify-center bg-black/45 p-4" data-jme-service-permission-overlay>
    <section class="flex max-h-[82vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.24)]" role="dialog" aria-modal="true" aria-labelledby="jme-service-permission-title">
      <header class="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
        <div class="flex items-center gap-3"><button type="button" data-jme-service-permission-close class="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-lg text-slate-600 hover:bg-slate-200">×</button><h3 id="jme-service-permission-title" class="text-base font-bold text-slate-900">设置服务与权限</h3></div><div class="flex gap-2"><button type="button" data-jme-service-permission-clear class="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-red-500">清空</button><button type="button" data-jme-service-permission-confirm class="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Confirm</button></div>
      </header>
      <div class="min-h-0 flex-1 bg-slate-100 px-4 py-4">
        <div class="grid min-h-[500px] gap-3 md:grid-cols-[1fr_1fr]">
          <aside class="overflow-hidden rounded-xl bg-white"><div class="hidden border-b border-slate-100 px-3 py-3 text-xs font-semibold text-slate-700">服务订阅</div>${serviceItems}</aside>
          <section class="min-w-0 overflow-hidden rounded-xl bg-white">${ruleSelector}${permissionPanels}${unassignedPanel}</section>
        </div>
      </div>
      <footer class="hidden flex shrink-0 justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button type="button" data-jme-service-permission-clear class="mr-auto rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50">清空</button>
        <button type="button" data-jme-service-permission-close class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">取消</button>
        <button type="button" data-jme-service-permission-confirm class="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.14)] hover:bg-teal-800">确定</button>
      </footer>
    </section>
  </div>`;
}

export function renderJsonMenuNodeSummary(
  document: MenuDocument,
  node: MenuNode | undefined,
  path: MenuNodePath,
  ancestors: MenuNode[],
  issues: MenuValidationIssue[],
): string {
  if (!node) return `<section class="grid min-h-0 flex-1 place-items-center bg-white"><div class="max-w-sm px-8 text-center"><div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-2xl text-slate-300">☰</div><h2 class="mt-4 text-base font-semibold text-slate-900">选择一个菜单节点</h2><p class="mt-1 text-sm leading-6 text-slate-500">从左侧选择菜单查看详情，或创建第一个菜单。</p><button type="button" data-jme-open-add="" class="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.16)] hover:bg-teal-800">＋ 新增一级菜单</button></div></section>`;
  const effectiveType = resolveEffectiveMenuType(node, ancestors);
  const protectedNode = isCompatibilityProtected(document.menu, path);
  const containsProtected = subtreeContainsCompatibility(document.menu, path);
  const ownIssues = issues.filter((issue) => issue.path && encodeMenuNodePath(issue.path) === encodeMenuNodePath(path));
  const pageLabel = isMenuDirectory(node) ? "目录容器" : effectiveType === "iframe" ? "iframe 嵌入" : effectiveType === "inner" ? "项目内页面" : effectiveType === "external" ? "外部链接" : effectiveType === "link" ? "链接菜单" : effectiveType === "micro-app" ? "微应用" : effectiveType ?? "未配置";
  const target = isMenuDirectory(node) ? "仅用于组织子菜单" : effectiveType === "iframe" ? node.url || "未配置 iframe 地址" : effectiveType === "external" ? resolveEffectiveExternalUrl(node, ancestors) || "未配置外部链接地址" : effectiveType === "link" ? `目标菜单 Key：${node.targetKey || "未配置"}` : effectiveType === "micro-app" ? node.microAppConfig?.url || "继承父级微应用配置" : node.path || "未配置路由地址";
  const compatibilityRoot = getCompatibilityRootPath(document.menu, path);
  const breadcrumb = [...ancestors, node].map(label).join(" / ");
  return `<section class="min-h-0 flex-1 overflow-y-auto bg-white" data-jme-detail-panel>
    <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-8 py-6 backdrop-blur-sm">
      <div class="min-w-0 flex-1"><h2 class="truncate text-xl font-semibold tracking-tight text-slate-900">${escapeHtml(label(node))}</h2><p class="mt-1.5 truncate text-xs text-slate-400" title="${escapeHtml(breadcrumb)}">${escapeHtml(breadcrumb)}</p><div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400"><span>${path.length} 级菜单</span><span>·</span><code class="truncate">${escapeHtml(node.key || "未设置 Key")}</code><span class="shrink-0 rounded-md px-2 py-0.5 ${protectedNode ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}">${protectedNode ? "兼容只读" : pageLabel}</span></div></div>
      <div class="flex shrink-0 gap-2">${!protectedNode && path.length < 3 && !containsProtected ? `<button type="button" data-jme-open-add="${encodeMenuNodePath(path)}" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-700">添加子菜单</button>` : ""}${!protectedNode ? `<button type="button" data-jme-open-edit="${encodeMenuNodePath(path)}" class="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.14)] hover:bg-teal-800">编辑菜单</button>` : ""}</div>
    </header>
    <div class="px-8 pb-10 pt-1">
      ${protectedNode ? `<div class="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"><p class="text-sm font-medium text-amber-900">历史配置已保护</p><p class="mt-1 text-xs leading-5 text-amber-700">该节点属于 micro-app 或历史第四级兼容子树。编辑器将原样保留字段和层级，不允许修改结构。</p>${compatibilityRoot ? `<p class="mt-1 font-mono text-[10px] text-amber-600">保护根：${encodeMenuNodePath(compatibilityRoot)}</p>` : ""}</div>` : containsProtected ? `<div class="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">该节点包含兼容子树。可以修改名称、国际化、权限和显示信息，但不能删除、复制、切换页面类型或调整层级。</div>` : ""}
      <section class="border-b border-slate-100 py-6"><h3 class="text-sm font-semibold text-slate-900">基础信息</h3><dl class="mt-4 grid max-w-4xl grid-cols-2 gap-x-10 gap-y-5">
        ${[["节点 ID", node.id || "—"], ["Key", node.key || "—"], ["菜单层级", `${path.length} 级菜单`], ["页面类型", pageLabel]].map(([title, text]) => `<div><dt class="text-[11px] text-slate-400">${title}</dt><dd class="mt-1 break-all font-mono text-xs font-medium text-slate-700">${escapeHtml(text)}</dd></div>`).join("")}
      </dl></section>
      <section class="border-b border-slate-100 py-6"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold text-slate-900">页面与路由</h3></div><dl class="mt-4 grid max-w-4xl grid-cols-2 gap-x-10 gap-y-5"><div><dt class="text-[11px] text-slate-400">商家后台路由</dt><dd class="mt-1 break-all font-mono text-xs font-medium text-slate-700">${escapeHtml(node.path || "—")}</dd></div><div><dt class="text-[11px] text-slate-400">打开目标</dt><dd class="mt-1 break-all font-mono text-xs font-medium text-slate-700">${escapeHtml(target)}</dd></div></dl></section>
      <section class="border-b border-slate-100 py-6"><h3 class="text-sm font-semibold text-slate-900">多语言名称</h3><div class="mt-4 grid max-w-4xl grid-cols-3 gap-4">${(["zh-CN", "zh-HK", "en-US"] as const).map((locale) => `<div><p class="text-[10px] text-slate-400">${locale}</p><p class="mt-1 truncate text-xs text-slate-700">${escapeHtml(node.i18nInfo?.[locale] || node.name || "—")}</p></div>`).join("")}</div></section>
      ${ownIssues.length ? `<section class="border-b border-slate-100 py-6"><h3 class="text-sm font-semibold text-slate-900">当前节点校验</h3><div class="mt-3 space-y-2">${ownIssues.map((issue) => `<div class="rounded-lg border px-3 py-2 text-xs ${issue.severity === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}">${escapeHtml(issue.message)}</div>`).join("")}</div></section>` : ""}
      ${!protectedNode ? `<div class="flex gap-2 pt-6"><button type="button" data-jme-duplicate class="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" ${containsProtected ? "disabled title=\"包含兼容子树，不能复制\"" : ""}>复制菜单</button><button type="button" data-jme-delete class="rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" ${containsProtected ? "disabled title=\"包含兼容子树，不能删除\"" : ""}>删除菜单</button></div>` : ""}
    </div>
  </section>`;
}

export function renderJsonMenuNodeFormPanel(
  document: MenuDocument,
  state: MenuNodeDialogState | null,
  issues: MenuValidationIssue[],
): string {
  if (!state) return `<section class="grid min-h-0 flex-1 place-items-center bg-white"><div class="max-w-sm px-8 text-center"><div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-2xl text-slate-300">☰</div><h2 class="mt-4 text-base font-semibold text-slate-900">选择一个菜单节点</h2><p class="mt-1 text-sm leading-6 text-slate-500">从左侧选择菜单查看详情，或创建第一个菜单。</p><button type="button" data-jme-open-add="" class="mt-5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.16)] hover:bg-teal-800">＋ 新增一级菜单</button></div></section>`;
  const canBeDirectory = true;
  const node = state.draft;
  const structureLocked = Boolean(state.targetPath && subtreeContainsCompatibility(document.menu, state.targetPath));
  const ownIssues = state.targetPath ? issues.filter((issue) => issue.path && encodeMenuNodePath(issue.path) === encodeMenuNodePath(state.targetPath!)) : [];
  const title = state.mode === "add" ? (state.parentPath.length ? "新增子菜单" : "新增一级菜单") : label(state.draft);
  return `<section class="min-h-0 flex-1 overflow-y-auto bg-white" data-jme-detail-panel>
    <form class="flex min-h-full flex-col" data-jme-node-form>
      <header class="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white/95 px-8 pt-6 backdrop-blur-sm" data-jme-form-sticky-header>
        <div class="flex items-start justify-between gap-4"><div class="min-w-0 flex-1"><h2 class="truncate text-xl font-bold tracking-tight text-slate-900">${escapeHtml(title)}</h2></div><button type="button" class="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-slate-500 hover:bg-slate-100" aria-label="更多操作">…</button>
        </div>
        ${renderMenuFormAnchors()}
      </header>
      <div class="min-h-0 flex-1 px-8 pb-12 pt-8">
        ${state.error ? `<div class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">${escapeHtml(state.error)}</div>` : ""}
        ${ownIssues.length ? `<div class="mb-4 space-y-2">${ownIssues.map((issue) => `<div class="rounded-lg border px-3 py-2 text-xs ${issue.severity === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}">${escapeHtml(issue.message)}</div>`).join("")}</div>` : ""}
        <section class="border-b border-slate-100 pb-8" data-jme-form-section="basic"><h3 class="text-base font-bold text-slate-900">基础信息</h3><div class="mt-5 grid max-w-5xl grid-cols-2 gap-x-5 gap-y-5">${field("菜单名称", "name", node.name, "例如：经营看板", true)}${field("菜单 Key", "key", node.key, "例如：operations_dashboard", true, true)}${field("节点 ID", "id", node.id, "唯一 ID", true, true)}${renderParentMenuPicker(document, state, structureLocked)}<label class="block text-xs font-medium text-slate-700">图标<input name="icon" data-jme-dialog-field="icon" value="${value(node.icon)}" placeholder="上传或填写图标" class="mt-1.5 h-12 w-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-2 text-center text-xs text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"></label></div></section>
        <section class="border-b border-slate-100 py-8" data-jme-form-section="page"><h3 class="text-base font-bold text-slate-900">菜单用途</h3>
          <div class="mt-5" data-jme-menu-purpose><div class="mt-3 inline-flex flex-wrap gap-1 rounded-2xl bg-slate-100 p-1.5">${purposeButtons(state, canBeDirectory, structureLocked)}</div></div>
          ${pageModeFields(document, state)}
        </section>
        <section class="max-w-5xl py-6" data-jme-advanced-settings>
          <section class="border-b border-slate-100 py-7" data-jme-advanced-group="localization" data-jme-form-section="localization">
            <h4 class="text-base font-bold text-slate-900">多语言名称</h4>
            <div class="mt-5 grid max-w-5xl grid-cols-2 gap-x-5 gap-y-5">${field("简体中文", "i18nInfo.zh-CN", node.i18nInfo?.["zh-CN"], "", true)}${field("繁体中文", "i18nInfo.zh-HK", node.i18nInfo?.["zh-HK"])}${field("English", "i18nInfo.en-US", node.i18nInfo?.["en-US"])}${field("i18nKey", "i18nKey", node.i18nKey, "app.menu.key", false, true)}</div>
          </section>
          <section class="border-b border-slate-100 py-7" data-jme-advanced-group="status-permission" data-jme-form-section="status">
            <h4 class="text-base font-bold text-slate-900">状态与权限</h4>
            <div class="mt-5 grid max-w-5xl grid-cols-3 gap-5">${triState("是否显示", "display", node.display)}${triState("是否禁用", "disabled", node.disabled)}${triState("启用权限控制", "accessControl.bool", node.accessControl?.bool)}</div>
            <div class="mt-5 max-w-5xl">${renderServicePermissionSetting(document, state)}</div>
          </section>
          <section class="pt-7" data-jme-advanced-group="extra-info" data-jme-form-section="extra">
            <h4 class="text-base font-bold text-slate-900">高级扩展</h4><p class="mt-1 text-sm text-slate-400">仅接受 JSON 对象；错误保留原输入并定位</p>
            <div class="mt-5 max-w-5xl">${textareaField("额外信息 extraInfo（JSON 对象或数组）", "extraInfo", state.extraInfoText ?? (node.extraInfo === undefined ? "" : JSON.stringify(node.extraInfo, null, 2)), "{\n  \"source\": \"m-platform\"\n}")}</div>
          </section>
        </section>
        ${state.mode === "edit" ? `<div class="flex gap-2 pt-6"><button type="button" data-jme-duplicate class="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" ${structureLocked ? "disabled title=\"包含兼容子树，不能复制\"" : ""}>复制菜单</button><button type="button" data-jme-delete class="rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" ${structureLocked ? "disabled title=\"包含兼容子树，不能删除\"" : ""}>删除菜单</button></div>` : ""}
      </div>
    </form>${renderLinkTargetDialog(document, state)}
  </section>`;
}

function parentOptions(document: MenuDocument, state: MenuNodeDialogState): string {
  const options = [{ path: [] as MenuNodePath, text: "— 作为一级菜单 —" }];
  for (const visit of walkMenuNodes(document.menu)) {
    if (state.targetPath && pathIsPrefix(state.targetPath, visit.path)) continue;
    if (isCompatibilityProtected(document.menu, visit.path) || subtreeContainsCompatibility(document.menu, visit.path)) continue;
    options.push({ path: visit.path, text: `${"　".repeat(Math.max(0, visit.depth - 1))}${label(visit.node)}` });
  }
  const selected = encodeMenuNodePath(state.parentPath);
  return options.map((option) => `<option value="${encodeMenuNodePath(option.path)}" ${encodeMenuNodePath(option.path) === selected ? "selected" : ""}>${escapeHtml(option.text)}</option>`).join("");
}

export function renderJsonMenuNodeDialog(document: MenuDocument, state: MenuNodeDialogState | null): string {
  if (!state) return "";
  const canBeDirectory = true;
  const node = state.draft;
  const structureLocked = Boolean(state.targetPath && subtreeContainsCompatibility(document.menu, state.targetPath));
  return `<div class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[1px]" data-jme-dialog-overlay>
    <form class="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]" data-jme-dialog>
      <header class="flex shrink-0 items-start justify-between border-b border-slate-100 px-7 py-5"><h2 class="text-lg font-semibold tracking-tight text-slate-900">${state.mode === "add" ? (state.parentPath.length ? "添加子菜单" : "新增一级菜单") : "编辑菜单"}</h2><button type="button" data-jme-dialog-close class="grid h-8 w-8 place-items-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button></header>
      <div class="min-h-0 flex-1 overflow-y-auto px-7 py-6">
        ${state.error ? `<div class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">${escapeHtml(state.error)}</div>` : ""}
        <div class="grid grid-cols-2 gap-4">${field("菜单名称", "name", node.name, "例如：经营看板", true)}${field("Key", "key", node.key, "例如：operations_dashboard", true, true)}${field("节点 ID", "id", node.id, "唯一 ID", true, true)}${field("图标", "icon", node.icon, "例如：AreaChartOutlined", false, true)}</div>
        <label class="mt-4 block text-xs font-medium text-slate-700">父级菜单<select name="parentPath" data-jme-dialog-parent ${structureLocked ? "disabled" : ""} class="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100 disabled:text-slate-400">${parentOptions(document, state)}</select>${structureLocked ? `<span class="mt-1 block text-[11px] font-normal text-slate-400">该节点包含兼容子树，只允许修改非结构信息。</span>` : ""}</label>
        <div class="mt-5"><p class="text-xs font-medium text-slate-700"><span class="mr-1 text-red-500">*</span>菜单用途</p><div class="mt-2 inline-flex overflow-hidden rounded-md border border-slate-300">${purposeButtons(state, canBeDirectory, structureLocked)}</div></div>
        ${pageModeFields(document, state, "")}
        <details class="mt-5 rounded-xl border border-slate-200" open><summary class="cursor-pointer list-none px-4 py-3.5 text-sm font-medium text-slate-800">高级设置 <span class="float-right text-xs font-normal text-slate-400">多语言、权限、显示</span></summary><div class="space-y-4 border-t border-slate-100 p-4"><div class="grid grid-cols-3 gap-3">${field("简体中文", "i18nInfo.zh-CN", node.i18nInfo?.["zh-CN"])}${field("繁体中文", "i18nInfo.zh-HK", node.i18nInfo?.["zh-HK"])}${field("English", "i18nInfo.en-US", node.i18nInfo?.["en-US"])}</div>${field("i18nKey", "i18nKey", node.i18nKey, "app.menu.key", false, true)}<div class="grid grid-cols-2 gap-4">${triState("是否显示", "display", node.display)}${triState("启用权限控制", "accessControl.bool", node.accessControl?.bool)}</div><div class="grid grid-cols-2 gap-4">${field("服务名称", "accessControl.serviceName", node.accessControl?.serviceName, "service_name", false, true)}${field("功能权限（逗号分隔）", "accessControl.permission.value", node.accessControl?.permission?.value?.join(", "), "permission_a, permission_b", false, true)}</div></div></details>
      </div>
      <footer class="flex shrink-0 items-center justify-end border-t border-slate-100 bg-white px-7 py-4"><div class="flex gap-2"><button type="button" data-jme-dialog-close class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">取消</button><button type="submit" class="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.14)] hover:bg-teal-800">${state.mode === "add" ? "确认新增" : "保存修改"}</button></div></footer>
    </form>${renderLinkTargetDialog(document, state)}
  </div>`;
}
