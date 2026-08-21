import { getAuthenticatedEmail } from "../auth/login";
import { showAppToast } from "../ui/app-toast";
import { openConfirmDialog } from "../ui/app-confirm-dialog";
import {
  createMenuObjectId,
  getMenuNodeAtPath,
  isCompatibilityProtected,
  isMenuDirectory,
  resolveEffectiveMenuType,
  subtreeContainsCompatibility,
  walkMenuNodes,
  type MenuEditorUser,
  type MenuNode,
  type MenuNodePath,
  type MenuPermissionRule,
  type MenuValidationIssue,
} from "./json-menu-document-domain";
import { jsonMenuEditorStore } from "./json-menu-editor-store";
import { renderJsonMenuNodeFormPanel, type MenuNodeDialogState, type MenuPageMode } from "./json-menu-node-form-ui";
import { renderJsonMenuFullscreenPreview } from "./json-menu-preview-ui";
import { decodeMenuNodePath, encodeMenuNodePath, findFirstDescendantIssuePath, renderJsonMenuTree } from "./json-menu-tree-ui";
import { rerenderPreservingJsonMenuTreeScroll } from "./json-menu-editor-scroll";

function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!); }
function currentUser(): MenuEditorUser {
  const email = getAuthenticatedEmail() ?? "demo@menusifu.com";
  return { userId: email, firstname: email.split("@")[0] || "Demo", lastname: null };
}
function selectedAncestors(): MenuNode[] {
  const document = jsonMenuEditorStore.state.document;
  if (!document) return [];
  const result: MenuNode[] = [];
  for (let length = 1; length < jsonMenuEditorStore.state.selectedPath.length; length += 1) {
    const node = getMenuNodeAtPath(document.menu, jsonMenuEditorStore.state.selectedPath.slice(0, length));
    if (node) result.push(node);
  }
  return result;
}

let searchValue = "";
let draggedPath: MenuNodePath | null = null;
let issueCursor = 0;
let dialogState: MenuNodeDialogState | null = null;
let fullscreenPreviewOpen = false;
let bodyOverflowBeforePreview = "";
let fullscreenPreviewSheetRootPath: MenuNodePath | null = null;
/** 全屏预览滑层内：有子菜单的二级目录展开态（与编辑器树 expandedPaths 独立） */
const fullscreenPreviewSheetExpandedPaths = new Set<string>();
const expandedPaths = new Set<string>();

function expandAll(): void {
  const document = jsonMenuEditorStore.state.document;
  if (!document) return;
  walkMenuNodes(document.menu).forEach((visit) => { if (visit.node.children?.length) expandedPaths.add(encodeMenuNodePath(visit.path)); });
}

function firstVisibleMenuPath(): MenuNodePath {
  const document = jsonMenuEditorStore.state.document;
  return document ? walkMenuNodes(document.menu).find((visit) => visit.node.display !== false)?.path ?? [] : [];
}

function nodeHasVisibleChildren(path: MenuNodePath): boolean {
  const document = jsonMenuEditorStore.state.document;
  if (!document) return false;
  const node = getMenuNodeAtPath(document.menu, path);
  return Boolean(node?.children?.some((child) => child.display !== false));
}

function deriveFullscreenPreviewSheetRootPath(path: MenuNodePath): MenuNodePath | null {
  if (!path.length) return null;
  const rootPath: MenuNodePath = [path[0]!];
  return nodeHasVisibleChildren(rootPath) ? rootPath : null;
}

function locateTreeIssue(path: MenuNodePath, severity: MenuValidationIssue["severity"], onMount: () => void): void {
  searchValue = "";
  for (let length = 1; length < path.length; length += 1) expandedPaths.add(encodeMenuNodePath(path.slice(0, length)));
  jsonMenuEditorStore.select(path);
  dialogState = buildEditFormState(path);
  onMount();
  requestAnimationFrame(() => {
    const encoded = encodeMenuNodePath(path);
    const row = document.querySelector<HTMLElement>(`[data-jme-tree-item="${encoded}"]`);
    row?.scrollIntoView({ block: "nearest" });
    row?.querySelector<HTMLButtonElement>(`[data-jme-issue-kind="own"][data-jme-issue-severity="${severity}"]`)?.focus({ preventScroll: true });
  });
}

function buildEditFormState(path: MenuNodePath): MenuNodeDialogState | null {
  const document = jsonMenuEditorStore.state.document;
  const node = document ? getMenuNodeAtPath(document.menu, path) : undefined;
  if (!document || !node || isCompatibilityProtected(document.menu, path)) return null;
  const ancestors: MenuNode[] = [];
  for (let length = 1; length < path.length; length += 1) {
    const ancestor = getMenuNodeAtPath(document.menu, path.slice(0, length));
    if (ancestor) ancestors.push(ancestor);
  }
  const effectiveType = resolveEffectiveMenuType(node, ancestors);
  const pageMode: MenuPageMode = isMenuDirectory(node) ? "directory" : effectiveType === "iframe" ? "iframe" : "inner";
  return { mode: "edit", targetPath: [...path], parentPath: path.slice(0, -1), pageMode, draft: structuredClone(node) };
}

/** 选中三级（或更深）时，自动展开其二级父目录，便于预览滑层看到当前项 */
function seedFullscreenSheetExpandedFromPath(path: MenuNodePath): void {
  if (path.length < 2) return;
  const l2Path = path.slice(0, 2);
  if (nodeHasVisibleChildren(l2Path)) {
    fullscreenPreviewSheetExpandedPaths.add(encodeMenuNodePath(l2Path));
  }
}

function applyFullscreenEnvironment(focusClose = false): void {
  const editor = document.querySelector<HTMLElement>("[data-json-menu-editor]");
  const panel = editor?.querySelector<HTMLElement>("[data-jme-fullscreen-preview-panel]");
  if (!editor || !panel) return;
  for (const child of Array.from(editor.children)) {
    if (child === panel) continue;
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }
  document.body.style.overflow = "hidden";
  if (focusClose) panel.querySelector<HTMLButtonElement>("[data-jme-fullscreen-close]")?.focus();
}

/**
 * 预览内点击只局部替换预览面板，避免 onMount 整页重绘导致闪烁。
 */
function refreshFullscreenPreview(options: { focusClose?: boolean; focusSelector?: string } = {}): void {
  const menuDocument = jsonMenuEditorStore.state.document;
  if (!fullscreenPreviewOpen || !menuDocument) return;

  const existing = document.querySelector<HTMLElement>("[data-jme-fullscreen-preview-panel]");
  const scrollState = {
    nav: existing?.querySelector<HTMLElement>("[data-jme-preview-nav-scroll]")?.scrollTop ?? 0,
    sheet: existing?.querySelector<HTMLElement>("[data-jme-preview-sheet-scroll]")?.scrollTop ?? 0,
    main: existing?.querySelector<HTMLElement>("[data-jme-preview-main-scroll]")?.scrollTop ?? 0,
  };

  const selected = jsonMenuEditorStore.selectedNode();
  const ancestors = selectedAncestors();
  const html = renderJsonMenuFullscreenPreview(
    menuDocument,
    jsonMenuEditorStore.state.locale,
    jsonMenuEditorStore.state.selectedPath,
    selected,
    ancestors,
    fullscreenPreviewSheetRootPath,
    fullscreenPreviewSheetExpandedPaths,
  );

  if (existing) {
    existing.outerHTML = html;
  } else {
    document.querySelector<HTMLElement>("[data-json-menu-editor]")?.insertAdjacentHTML("beforeend", html);
  }

  const next = document.querySelector<HTMLElement>("[data-jme-fullscreen-preview-panel]");
  if (next) {
    const nav = next.querySelector<HTMLElement>("[data-jme-preview-nav-scroll]");
    const sheet = next.querySelector<HTMLElement>("[data-jme-preview-sheet-scroll]");
    const main = next.querySelector<HTMLElement>("[data-jme-preview-main-scroll]");
    if (nav) nav.scrollTop = scrollState.nav;
    if (sheet) sheet.scrollTop = scrollState.sheet;
    if (main) main.scrollTop = scrollState.main;
  }

  applyFullscreenEnvironment(options.focusClose === true);
  if (options.focusSelector) {
    document.querySelector<HTMLElement>(options.focusSelector)?.focus();
  }
}

function clearFullscreenEnvironment(onMount: () => void): void {
  fullscreenPreviewOpen = false;
  fullscreenPreviewSheetRootPath = null;
  fullscreenPreviewSheetExpandedPaths.clear();
  document.body.style.overflow = bodyOverflowBeforePreview;
  onMount();
  requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-jme-fullscreen-open]")?.focus());
}

function renderValidationSummary(issues: MenuValidationIssue[]): string {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const textClass = errors.length ? "text-red-700" : warnings.length ? "text-amber-700" : "text-emerald-700";
  const dotClass = errors.length ? "bg-red-500" : warnings.length ? "bg-amber-500" : "bg-emerald-500";
  return `<div class="flex items-center gap-2 text-xs ${textClass}"><span class="h-2 w-2 rounded-full ${dotClass}"></span><strong>${errors.length ? `${errors.length} 个错误` : warnings.length ? `${warnings.length} 个警告` : "校验通过"}</strong>${errors[0] ? `<button type="button" data-jme-jump-path="${encodeMenuNodePath(errors[0].path ?? [])}" class="max-w-sm truncate font-normal hover:underline">${escapeHtml(errors[0].message)}</button>` : warnings[0] ? `<span class="max-w-sm truncate text-amber-600">${escapeHtml(warnings[0].message)}</span>` : `<span class="font-normal text-slate-500">可以保存并发布</span>`}</div>`;
}

export function renderJsonMenuEditorPage(): string {
  const { state } = jsonMenuEditorStore;
  if (state.status === "idle" || state.status === "loading") return `<div class="grid min-h-[680px] flex-1 place-items-center rounded-2xl bg-white shadow-[0_2px_14px_rgba(15,23,42,0.04)]"><div class="text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"></div><p class="mt-4 text-sm font-medium text-slate-800">正在读取当前菜单配置…</p><p class="mt-1 text-xs text-slate-500">优先恢复共享草稿</p></div></div>`;
  if (!state.document) return `<div class="grid min-h-[680px] flex-1 place-items-center rounded-2xl border border-red-100 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.04)]"><div class="text-center"><h2 class="font-semibold text-red-900">菜单配置加载失败</h2><p class="mt-2 text-sm text-red-700">${escapeHtml(state.message)}</p><button type="button" data-jme-retry class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm text-white">重新加载</button></div></div>`;

  const document = state.document;
  const selected = jsonMenuEditorStore.selectedNode();
  const ancestors = selectedAncestors();
  if (!dialogState && selected) dialogState = buildEditFormState(state.selectedPath);
  return `<div class="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent" data-json-menu-editor>
    <header class="shrink-0 bg-transparent px-1 pb-4 pt-1">
      <div class="flex items-center justify-between gap-5">
        <div class="min-w-0"><div class="flex items-center gap-2.5"><h1 class="text-xl font-semibold tracking-tight text-slate-900">菜单路由配置</h1><span class="rounded-full px-2.5 py-1 text-[10px] font-medium ${state.restoredDraft ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}">${state.restoredDraft ? "共享草稿" : "当前发布版本"}</span></div></div>
        <div class="flex shrink-0 items-center gap-2"><button type="button" data-jme-discard class="rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-white hover:text-slate-800">放弃修改</button><button type="button" data-jme-save class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-700">${state.status === "saving" ? "保存中…" : "保存草稿"}</button><button type="button" data-jme-publish class="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white shadow-[0_3px_8px_rgba(15,118,110,0.16)] hover:bg-teal-800">${state.status === "publishing" ? "发布中…" : "保存并发布"}</button></div>
      </div>
      <div class="mt-3 flex items-center gap-4"><label class="flex min-w-0 items-center gap-2 text-[11px] text-slate-500">配置名称<input data-jme-root-field="name" value="${escapeHtml(document.name)}" class="h-8 w-56 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none focus:border-teal-600"></label><span class="font-mono text-[10px] text-slate-400">ID ${escapeHtml(document._id)}</span><span class="text-[10px] text-slate-400">最后更新 ${escapeHtml(document.updatedBy.firstname)} · ${escapeHtml(document.updatedBy.timestamp.slice(0, 16).replace("T", " "))}</span><div class="ml-auto">${renderValidationSummary(state.issues)}</div></div>
      ${state.message ? `<div class="mt-2 rounded-lg ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"} px-3 py-2 text-xs">${escapeHtml(state.message)}</div>` : ""}
    </header>
    <div class="flex min-h-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(15,23,42,0.045)]">
      ${renderJsonMenuTree(document, state.selectedPath, state.issues, searchValue, expandedPaths)}
      ${renderJsonMenuNodeFormPanel(document, dialogState, state.issues)}
    </div>
    <footer class="flex h-14 shrink-0 items-center gap-2 bg-transparent px-1"><div class="flex items-center text-[11px] text-slate-500"><span class="h-1.5 w-1.5 rounded-full ${state.dirty ? "bg-amber-500" : "bg-emerald-500"}"></span><span class="ml-2">${state.dirty ? "有未保存修改" : "所有更改已保存"}</span></div><div class="ml-auto flex gap-2"><button type="button" data-jme-fullscreen-open class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-teal-600 hover:text-teal-700">商家菜单预览</button><button type="button" data-jme-export class="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">导出 JSON</button></div></footer>
    ${fullscreenPreviewOpen ? renderJsonMenuFullscreenPreview(document, state.locale, state.selectedPath, selected, ancestors, fullscreenPreviewSheetRootPath, fullscreenPreviewSheetExpandedPaths) : ""}
  </div>`;
}

function openAdd(parentPath: MenuNodePath, onMount: () => void): void {
  const document = jsonMenuEditorStore.state.document;
  if (!document || parentPath.length >= 3) { showAppToast("菜单最多支持三级。", { variant: "error" }); return; }
  if (parentPath.length && (isCompatibilityProtected(document.menu, parentPath) || subtreeContainsCompatibility(document.menu, parentPath))) { showAppToast("该节点属于兼容保护范围，不能添加子菜单。", { variant: "error" }); return; }
  dialogState = { mode: "add", parentPath: [...parentPath], pageMode: "inner", draft: { id: createMenuObjectId(), name: "", key: "" } };
  if (parentPath.length) expandedPaths.add(encodeMenuNodePath(parentPath));
  onMount();
}

function openEdit(path: MenuNodePath, onMount: () => void): void {
  const document = jsonMenuEditorStore.state.document;
  if (!document) return;
  if (isCompatibilityProtected(document.menu, path)) { showAppToast("该节点属于历史兼容子树，只能查看，不能编辑。", { variant: "error" }); return; }
  dialogState = buildEditFormState(path);
  jsonMenuEditorStore.select(path);
  onMount();
}

function assignDialogField(field: string, raw: string): void {
  if (!dialogState) return;
  const remove = raw === "" || raw === "missing";
  const boolValue = raw === "true" ? true : raw === "false" ? false : undefined;
  const node = dialogState.draft;
  if (["id", "name", "key", "path", "url", "icon", "i18nKey"].includes(field)) {
    if (remove) delete (node as unknown as Record<string, unknown>)[field]; else (node as unknown as Record<string, unknown>)[field] = raw;
    if (field === "name" && node.i18nInfo?.["zh-CN"] !== undefined) {
      if (remove) delete node.i18nInfo["zh-CN"]; else node.i18nInfo["zh-CN"] = raw;
    }
    return;
  }
  const parts = field.split(".");
  if (parts[0] === "i18nInfo") { node.i18nInfo ??= {}; if (remove) delete node.i18nInfo[parts[1] as keyof typeof node.i18nInfo]; else node.i18nInfo[parts[1] as keyof typeof node.i18nInfo] = raw; }
  if (field === "display") { if (remove) delete node.display; else node.display = boolValue; }
  if (parts[0] === "accessControl") {
    node.accessControl ??= {};
    if (parts[1] === "bool") { if (remove) delete node.accessControl.bool; else node.accessControl.bool = boolValue; }
    if (parts[1] === "serviceName") { if (remove) delete node.accessControl.serviceName; else node.accessControl.serviceName = raw; }
    if (parts[1] === "permission" && parts[2] === "value") {
      const values = raw.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
      if (!values.length) delete node.accessControl.permission;
      else node.accessControl.permission = { rule: node.accessControl.permission?.rule, value: values };
    }
    if (!Object.keys(node.accessControl).length) delete node.accessControl;
  }
}

function applyServicePermissionSelection(services: string[], permissions: string[], rule?: MenuPermissionRule): void {
  if (!dialogState) return;
  const node = dialogState.draft;
  node.accessControl ??= {};
  const nextServices = Array.from(new Set(services.map((item) => item.trim()).filter(Boolean)));
  const nextPermissions = Array.from(new Set(permissions.map((item) => item.trim()).filter(Boolean)));
  if (nextServices.length) node.accessControl.serviceName = nextServices.join(", ");
  else delete node.accessControl.serviceName;
  if (nextPermissions.length && rule) node.accessControl.permission = { rule, value: nextPermissions };
  else delete node.accessControl.permission;
  if (!Object.keys(node.accessControl).length) delete node.accessControl;
}

function readServicePermissionDialogSelection(): { services: string[]; permissions: string[]; rule?: MenuPermissionRule } {
  const overlay = document.querySelector<HTMLElement>("[data-jme-service-permission-overlay]");
  if (!overlay) return { services: [], permissions: [] };
  const services = Array.from(overlay.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-service]:checked"))
    .map((input) => input.dataset.jmeServicePermissionService ?? "")
    .filter(Boolean);
  const permissions = Array.from(overlay.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-permission]:checked"))
    .map((input) => input.dataset.jmeServicePermissionPermission ?? "")
    .filter(Boolean)
    .concat(Array.from(overlay.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-unassigned]:checked"))
      .map((input) => input.dataset.jmeServicePermissionUnassigned ?? "")
      .filter(Boolean));
  const rawRule = overlay.querySelector<HTMLInputElement>("[data-jme-service-permission-rule]:checked")?.value;
  const rule = rawRule === "some" || rawRule === "every" ? rawRule : undefined;
  return { services, permissions, rule };
}

function servicePermissionOverlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-jme-service-permission-overlay]");
}

function servicePermissionInputsFor(owner: string): HTMLInputElement[] {
  const overlay = servicePermissionOverlay();
  return overlay
    ? Array.from(overlay.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-owner]"))
      .filter((input) => input.dataset.jmeServicePermissionOwner === owner)
    : [];
}

function servicePermissionServiceInput(service: string): HTMLInputElement | undefined {
  const overlay = servicePermissionOverlay();
  return overlay
    ? Array.from(overlay.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-service]"))
      .find((input) => input.dataset.jmeServicePermissionService === service)
    : undefined;
}

function refreshServicePermissionCount(service: string): void {
  const overlay = servicePermissionOverlay();
  if (!overlay) return;
  const inputs = servicePermissionInputsFor(service);
  const selected = inputs.filter((input) => input.checked).length;
  const badge = Array.from(overlay.querySelectorAll<HTMLElement>("[data-jme-service-permission-count]"))
    .find((item) => item.dataset.jmeServicePermissionCount === service);
  if (badge) badge.textContent = `${selected}/${inputs.length}`;
}

function selectedServicePermissionCount(): number {
  const overlay = servicePermissionOverlay();
  if (!overlay) return 0;
  return overlay.querySelectorAll("[data-jme-service-permission-permission]:checked, [data-jme-service-permission-unassigned]:checked").length;
}

function showServicePermissionRuleError(message: string): void {
  const error = servicePermissionOverlay()?.querySelector<HTMLElement>("[data-jme-service-permission-rule-error]");
  if (!error) return;
  error.textContent = message;
  error.classList.toggle("hidden", !message);
}

function resetServicePermissionRuleWhenEmpty(): void {
  if (selectedServicePermissionCount()) return;
  servicePermissionOverlay()?.querySelectorAll<HTMLInputElement>("[data-jme-service-permission-rule]").forEach((input) => { input.checked = false; });
  showServicePermissionRuleError("");
}

function showServicePermissionPanel(service: string): void {
  const overlay = servicePermissionOverlay();
  if (!overlay) return;
  overlay.querySelectorAll<HTMLElement>("[data-jme-service-permission-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.jmeServicePermissionPanel !== service);
  });
  overlay.querySelectorAll<HTMLElement>("[data-jme-service-permission-service-row]").forEach((row) => {
    const active = row.dataset.jmeServicePermissionServiceRow === service;
    row.classList.toggle("bg-teal-50", active);
    row.classList.toggle("bg-white", !active);
    const button = row.querySelector<HTMLElement>("[data-jme-service-permission-view]");
    button?.classList.toggle("text-teal-800", active);
    button?.classList.toggle("text-slate-700", !active);
  });
}

function toggleServicePermissionService(input: HTMLInputElement): void {
  const service = input.dataset.jmeServicePermissionService ?? "";
  if (!service) return;
  servicePermissionInputsFor(service).forEach((permission) => { permission.checked = input.checked; });
  refreshServicePermissionCount(service);
  showServicePermissionPanel(service);
  resetServicePermissionRuleWhenEmpty();
}

function toggleServicePermissionPermission(input: HTMLInputElement): void {
  const service = input.dataset.jmeServicePermissionOwner ?? "";
  if (!service) return;
  const permissionInputs = servicePermissionInputsFor(service);
  const serviceInput = servicePermissionServiceInput(service);
  if (serviceInput) serviceInput.checked = permissionInputs.some((permission) => permission.checked);
  refreshServicePermissionCount(service);
  resetServicePermissionRuleWhenEmpty();
}

function validateAndNormalizeDialog(): MenuNode | null {
  if (!dialogState) return null;
  const node = structuredClone(dialogState.draft);
  if (!node.name?.trim()) { dialogState.error = "请填写菜单名称。"; return null; }
  if (!node.id?.trim()) { dialogState.error = "请填写节点 ID。"; return null; }
  if (!node.key?.trim()) { dialogState.error = "请填写 Key。"; return null; }
  const depth = dialogState.parentPath.length + 1;
  if (dialogState.pageMode === "directory") {
    if (depth >= 3) { dialogState.error = "三级菜单必须配置可打开的页面。"; return null; }
    delete node.type; delete node.path; delete node.url; delete node.microAppConfig;
    node.children ??= [];
  } else {
    if (!node.path?.trim() || !node.path.startsWith("/")) { dialogState.error = "商家后台路由地址必须以 / 开头。"; return null; }
    if (dialogState.pageMode === "inner") { node.type = "inner"; delete node.url; delete node.microAppConfig; }
    else {
      try { const parsed = new URL(node.url ?? ""); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); }
      catch { dialogState.error = "请输入有效的 HTTP(S) iframe 嵌入地址。"; return null; }
      node.type = "iframe"; delete node.microAppConfig;
    }
  }
  if (node.i18nInfo && !Object.values(node.i18nInfo).some(Boolean)) delete node.i18nInfo;
  dialogState.error = undefined;
  return node;
}

function downloadJson(content: string, name: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.replace(/[\\/:*?\"<>|]+/g, "-").trim() || "menu-config"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

let bound = false;
export function bindJsonMenuEditor(onMount: () => void): void {
  const editorExists = Boolean(document.querySelector("[data-json-menu-editor]"));
  if ((jsonMenuEditorStore.state.status === "idle" || jsonMenuEditorStore.state.status === "error") && !editorExists) void jsonMenuEditorStore.load().then(() => { expandAll(); onMount(); });
  if (bound) return;
  bound = true;

  document.body.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const previewLocale = target.closest<HTMLElement>("[data-jme-locale]")?.dataset.jmeLocale;
    if (previewLocale) {
      jsonMenuEditorStore.setLocale(previewLocale as "zh-CN" | "zh-HK" | "en-US");
      if (fullscreenPreviewOpen) {
        refreshFullscreenPreview();
        return;
      }
      onMount();
      return;
    }
    const selectPath = target.closest<HTMLElement>("[data-jme-select]")?.dataset.jmeSelect;
    if (selectPath != null) {
      const decoded = decodeMenuNodePath(selectPath);
      const inPreview = Boolean(fullscreenPreviewOpen && target.closest("[data-jme-fullscreen-preview-panel]"));
      // 预览滑层内：有子菜单的二级只能作目录，拦截误用的 select，改为展开/收起
      if (inPreview && decoded.length === 2 && nodeHasVisibleChildren(decoded)) {
        const encoded = encodeMenuNodePath(decoded);
        if (fullscreenPreviewSheetExpandedPaths.has(encoded)) fullscreenPreviewSheetExpandedPaths.delete(encoded);
        else fullscreenPreviewSheetExpandedPaths.add(encoded);
        refreshFullscreenPreview({ focusSelector: `[data-jme-sheet-toggle="${encoded}"]` });
        return;
      }
      jsonMenuEditorStore.select(decoded);
      if (fullscreenPreviewOpen) {
        fullscreenPreviewSheetRootPath = deriveFullscreenPreviewSheetRootPath(decoded);
        seedFullscreenSheetExpandedFromPath(decoded);
        dialogState = buildEditFormState(decoded);
        if (inPreview) {
          refreshFullscreenPreview({ focusSelector: `[data-jme-select="${encodeMenuNodePath(decoded)}"]` });
          return;
        }
      }
      if (!fullscreenPreviewOpen) dialogState = buildEditFormState(decoded);
      rerenderPreservingJsonMenuTreeScroll(onMount);
      if (fullscreenPreviewOpen) requestAnimationFrame(() => applyFullscreenEnvironment());
      return;
    }
    const sheetTogglePath = target.closest<HTMLElement>("[data-jme-sheet-toggle]")?.dataset.jmeSheetToggle;
    if (sheetTogglePath != null) {
      if (fullscreenPreviewSheetExpandedPaths.has(sheetTogglePath)) fullscreenPreviewSheetExpandedPaths.delete(sheetTogglePath);
      else fullscreenPreviewSheetExpandedPaths.add(sheetTogglePath);
      refreshFullscreenPreview({ focusSelector: `[data-jme-sheet-toggle="${sheetTogglePath}"]` });
      return;
    }
    const sheetBackPath = target.closest<HTMLElement>("[data-jme-sheet-back]")?.dataset.jmeSheetBack;
    if (sheetBackPath != null) {
      const decoded = decodeMenuNodePath(sheetBackPath);
      jsonMenuEditorStore.select(decoded);
      dialogState = buildEditFormState(decoded);
      fullscreenPreviewSheetRootPath = null;
      refreshFullscreenPreview({ focusSelector: `[data-jme-select="${encodeMenuNodePath(decoded)}"]` });
      return;
    }
    const jumpPath = target.closest<HTMLElement>("[data-jme-jump-path]")?.dataset.jmeJumpPath;
    if (jumpPath != null) { jsonMenuEditorStore.select(decodeMenuNodePath(jumpPath)); onMount(); return; }
    const issueButton = target.closest<HTMLButtonElement>("[data-jme-issue-path]");
    if (issueButton) {
      const sourcePath = decodeMenuNodePath(issueButton.dataset.jmeIssuePath ?? "");
      const severity = issueButton.dataset.jmeIssueSeverity as MenuValidationIssue["severity"];
      const targetPath = issueButton.dataset.jmeIssueKind === "descendant"
        ? findFirstDescendantIssuePath(jsonMenuEditorStore.state.document?.menu ?? [], sourcePath, jsonMenuEditorStore.state.issues, severity)
        : sourcePath;
      if (targetPath) locateTreeIssue(targetPath, severity, onMount);
      return;
    }
    const togglePath = target.closest<HTMLElement>("[data-jme-toggle]")?.dataset.jmeToggle;
    if (togglePath != null) { expandedPaths.has(togglePath) ? expandedPaths.delete(togglePath) : expandedPaths.add(togglePath); onMount(); return; }
    if (target.closest("[data-jme-toggle-expand-all]")) {
      const menuDocument = jsonMenuEditorStore.state.document;
      const expandableCount = menuDocument ? walkMenuNodes(menuDocument.menu).filter((visit) => visit.node.children?.length).length : 0;
      const allExpanded = menuDocument
        ? walkMenuNodes(menuDocument.menu).every((visit) => !visit.node.children?.length || expandedPaths.has(encodeMenuNodePath(visit.path)))
        : false;
      if (expandableCount && allExpanded) expandedPaths.clear();
      else expandAll();
      onMount();
      return;
    }
    const addPath = target.closest<HTMLElement>("[data-jme-open-add]")?.dataset.jmeOpenAdd;
    if (addPath != null) { openAdd(decodeMenuNodePath(addPath), onMount); return; }
    const editPath = target.closest<HTMLElement>("[data-jme-open-edit]")?.dataset.jmeOpenEdit;
    if (editPath != null) { openEdit(decodeMenuNodePath(editPath), onMount); return; }
    if (target.closest("[data-jme-service-permission-open]") && dialogState) {
      dialogState.servicePermissionOpen = true;
      onMount();
      return;
    }
    const servicePermissionView = target.closest<HTMLElement>("[data-jme-service-permission-view]")?.dataset.jmeServicePermissionView;
    if (servicePermissionView != null) {
      showServicePermissionPanel(servicePermissionView);
      return;
    }
    const servicePermissionService = target.closest<HTMLInputElement>("[data-jme-service-permission-service]");
    if (servicePermissionService) {
      toggleServicePermissionService(servicePermissionService);
      return;
    }
    const servicePermissionPermission = target.closest<HTMLInputElement>("[data-jme-service-permission-permission]");
    if (servicePermissionPermission) {
      toggleServicePermissionPermission(servicePermissionPermission);
      return;
    }
    if (target.closest("[data-jme-service-permission-unassigned]")) {
      resetServicePermissionRuleWhenEmpty();
      return;
    }
    if (target.closest("[data-jme-service-permission-rule]")) {
      showServicePermissionRuleError("");
      return;
    }
    if (target.closest("[data-jme-service-permission-clear]") && dialogState) {
      applyServicePermissionSelection([], []);
      dialogState.servicePermissionOpen = false;
      onMount();
      return;
    }
    if (target.closest("[data-jme-service-permission-confirm]") && dialogState) {
      const next = readServicePermissionDialogSelection();
      if (next.permissions.length && !next.rule) {
        showServicePermissionRuleError("请选择权限满足规则");
        return;
      }
      applyServicePermissionSelection(next.services, next.permissions, next.rule);
      dialogState.servicePermissionOpen = false;
      onMount();
      return;
    }
    if ((target.closest("[data-jme-service-permission-close]") || target.matches("[data-jme-service-permission-overlay]")) && dialogState) {
      dialogState.servicePermissionOpen = false;
      onMount();
      return;
    }
    const rowMore = target.closest<HTMLElement>("[data-jme-row-more]")?.dataset.jmeRowMore;
    if (rowMore != null) { const decoded = decodeMenuNodePath(rowMore); jsonMenuEditorStore.select(decoded); dialogState = buildEditFormState(decoded); onMount(); return; }
    if (target.closest("[data-jme-fullscreen-open]")) {
      const selected = jsonMenuEditorStore.selectedNode();
      if (!selected || selected.display === false) {
        const fallback = firstVisibleMenuPath();
        if (fallback.length) jsonMenuEditorStore.select(fallback);
      }
      const nextSelectedPath = jsonMenuEditorStore.state.selectedPath;
      // 打开预览时若落在「有子菜单的二级」，改选其一级，避免把目录当成页面详情
      if (nextSelectedPath.length === 2 && nodeHasVisibleChildren(nextSelectedPath)) {
        const l2Encoded = encodeMenuNodePath(nextSelectedPath);
        fullscreenPreviewSheetExpandedPaths.add(l2Encoded);
        jsonMenuEditorStore.select([nextSelectedPath[0]!]);
      }
      const sheetPath = jsonMenuEditorStore.state.selectedPath;
      fullscreenPreviewSheetRootPath = deriveFullscreenPreviewSheetRootPath(sheetPath);
      seedFullscreenSheetExpandedFromPath(sheetPath);
      bodyOverflowBeforePreview = document.body.style.overflow;
      fullscreenPreviewOpen = true;
      onMount();
      requestAnimationFrame(() => applyFullscreenEnvironment(true));
      return;
    }
    if (target.closest("[data-jme-fullscreen-close]") || target.matches("[data-jme-fullscreen-preview-panel]")) { clearFullscreenEnvironment(onMount); return; }
    if (target.closest("[data-jme-form-cancel]")) { dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); return; }
    const pageMode = target.closest<HTMLElement>("[data-jme-page-mode]")?.dataset.jmePageMode as MenuPageMode | undefined;
    if (pageMode && dialogState) { if (pageMode === "directory" && dialogState.parentPath.length >= 2) return; dialogState.pageMode = pageMode; dialogState.error = undefined; onMount(); return; }
    if (target.closest("[data-jme-duplicate]")) { if (!jsonMenuEditorStore.duplicateSelected()) showAppToast("包含兼容保留节点的子树不能复制。", { variant: "error" }); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); return; }
    if (target.closest("[data-jme-delete]")) { const node = jsonMenuEditorStore.selectedNode(); if (!node) return; const count = walkMenuNodes(node.children ?? []).length; void (async () => { const ok = await openConfirmDialog({ title: "删除菜单节点", message: count ? `将同时删除 ${count} 个子节点，确定继续？` : "确定删除当前菜单节点？", confirmLabel: "确认删除", danger: true }); if (!ok) return; if (!jsonMenuEditorStore.deleteSelected()) showAppToast("包含兼容保留节点的子树不能删除。", { variant: "error" }); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); })(); return; }
    if (target.closest("[data-jme-save]")) { void jsonMenuEditorStore.saveDraft(currentUser()).then(() => { dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); return; }
    if (target.closest("[data-jme-publish]")) { void (async () => { let result = await jsonMenuEditorStore.publish(currentUser(), false); if (result.needsWarningConfirmation) { const ok = await openConfirmDialog({ title: "确认发布", message: `当前有 ${jsonMenuEditorStore.state.issues.filter((issue) => issue.severity === "warning").length} 个兼容警告，确认仍要发布？`, confirmLabel: "确认发布" }); if (ok) result = await jsonMenuEditorStore.publish(currentUser(), true); } if (!result.ok && !result.needsWarningConfirmation) { const first = jsonMenuEditorStore.state.issues.find((issue) => issue.severity === "error"); if (first?.path) jsonMenuEditorStore.select(first.path); showAppToast(first ? `发布被阻止：${first.message}` : jsonMenuEditorStore.state.message || "发布失败", { variant: "error" }); } dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); })(); return; }
    if (target.closest("[data-jme-export]")) { const content = jsonMenuEditorStore.exportJson(); if (!content) { showAppToast("顶部配置不完整，无法导出。", { variant: "error" }); return; } downloadJson(content, jsonMenuEditorStore.state.document?.name ?? "menu-config"); return; }
    if (target.closest("[data-jme-discard]")) { void (async () => { const ok = await openConfirmDialog({ title: "放弃修改", message: "确定放弃当前未保存修改？将重新读取共享草稿；没有草稿时恢复发布版本。", confirmLabel: "确认放弃", danger: true }); if (ok) void jsonMenuEditorStore.discard().then(() => { dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); })(); return; }
    if (target.closest("[data-jme-retry]")) { void jsonMenuEditorStore.load().then(() => { expandAll(); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); return; }
    if (target.closest("[data-jme-next-issue]")) { const located = jsonMenuEditorStore.state.issues.filter((issue) => issue.path); if (located.length) { jsonMenuEditorStore.select(located[issueCursor++ % located.length]!.path!); onMount(); } }
  });

  document.body.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.matches("[data-jme-search]")) {
      searchValue = input.value;
      const panel = input.closest<HTMLElement>("[data-jme-tree-panel]");
      const menuDocument = jsonMenuEditorStore.state.document;
      if (panel && menuDocument) panel.outerHTML = renderJsonMenuTree(menuDocument, jsonMenuEditorStore.state.selectedPath, jsonMenuEditorStore.state.issues, searchValue, expandedPaths);
      requestAnimationFrame(() => { const next = document.querySelector<HTMLInputElement>("[data-jme-search]"); next?.focus(); next?.setSelectionRange(searchValue.length, searchValue.length); });
      return;
    }
    if (input.dataset.jmeDialogField) assignDialogField(input.dataset.jmeDialogField, input.value);
  });

  document.body.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    if (input.dataset.jmeRootField) { jsonMenuEditorStore.updateRoot((document) => (document as unknown as Record<string, unknown>)[input.dataset.jmeRootField!] = input.value); onMount(); return; }
    if (input.dataset.jmeDialogField) { assignDialogField(input.dataset.jmeDialogField, input.value); return; }
    if (input.matches("[data-jme-dialog-parent]") && dialogState) { dialogState.parentPath = decodeMenuNodePath(input.value); if (dialogState.pageMode === "directory" && dialogState.parentPath.length >= 2) dialogState.pageMode = "inner"; dialogState.error = undefined; onMount(); }
  });

  document.body.addEventListener("submit", (event) => {
    if (!(event.target as HTMLElement).matches("[data-jme-node-form]")) return;
    event.preventDefault();
    const next = validateAndNormalizeDialog();
    if (!next || !dialogState) { onMount(); return; }
    const ok = dialogState.mode === "add" ? jsonMenuEditorStore.addNode(dialogState.parentPath, next) : jsonMenuEditorStore.replaceAndRelocateSelected(next, dialogState.parentPath);
    if (!ok) { dialogState.error = "该操作会影响兼容保留子树、形成循环或超过三级，请调整后重试。"; onMount(); return; }
    expandAll();
    dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath);
    onMount();
  });

  document.body.addEventListener("dragstart", (event) => { const path = (event.target as HTMLElement).closest<HTMLElement>("[data-jme-drag-path]")?.dataset.jmeDragPath; draggedPath = path ? decodeMenuNodePath(path) : null; });
  document.body.addEventListener("dragover", (event) => { if ((event.target as HTMLElement).closest("[data-jme-drop-parent]")) event.preventDefault(); });
  document.body.addEventListener("drop", (event) => { const zone = (event.target as HTMLElement).closest<HTMLElement>("[data-jme-drop-parent]"); if (!zone || !draggedPath) return; event.preventDefault(); jsonMenuEditorStore.select(draggedPath); if (!jsonMenuEditorStore.moveSelected(decodeMenuNodePath(zone.dataset.jmeDropParent ?? ""), Number(zone.dataset.jmeDropIndex ?? 0))) showAppToast("无法移动到该位置：不能形成循环、超过三级或影响兼容保留子树。", { variant: "error" }); draggedPath = null; expandAll(); onMount(); });
  document.addEventListener("keydown", (event) => {
    if (!fullscreenPreviewOpen) return;
    if (event.key === "Escape") { event.preventDefault(); clearFullscreenEnvironment(onMount); return; }
    if (event.key !== "Tab") return;
    const panel = document.querySelector<HTMLElement>("[data-jme-fullscreen-preview-panel]");
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0]!;
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener("beforeunload", (event) => { if (!jsonMenuEditorStore.state.dirty) return; event.preventDefault(); event.returnValue = ""; });
}
