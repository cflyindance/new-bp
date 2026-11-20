import { getAuthenticatedEmail } from "../auth/login";
import { showAppToast } from "../ui/app-toast";
import { openConfirmDialog } from "../ui/app-confirm-dialog";
import {
  createMenuObjectId,
  getMenuNodeAtPath,
  isCompatibilityProtected,
  isMenuDirectory,
  resolveEffectiveExternalUrl,
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
import { ensurePublishedSubscriptionMenuTree } from "./subscription-published-menu-tree";
import { renderJsonMenuNodeFormPanel, type MenuNodeDialogState, type MenuPageMode } from "./json-menu-node-form-ui";
import { normalizeMenuNodeForPageMode } from "./json-menu-page-mode";
import { renderJsonMenuFullscreenPreview } from "./json-menu-preview-ui";
import { decodeMenuNodePath, encodeMenuNodePath, findFirstDescendantIssuePath, renderJsonMenuTree } from "./json-menu-tree-ui";
import { rerenderPreservingJsonMenuDetailScroll, rerenderPreservingJsonMenuTreeScroll } from "./json-menu-editor-scroll";
import { shouldIgnoreJsonMenuSearchInput } from "./json-menu-search-autofill-guard";
import { JSON_MENU_FORM_SECTIONS, resolveActiveJsonMenuFormSection, type JsonMenuFormSection } from "./json-menu-form-anchor";
import { getPageRegistrations, getBuiltInPageRegistrations } from "./page-registration-catalog";
import { bindRegisteredPage, matchRegisteredPage } from "./page-registration-domain";
import { registrationUi, registryView, registryRows, registrationModal, pickerRows } from "./page-registration-ui";
import type { MenuRoutingView } from "./menu-routing-navigation";
import { bindRegistryWorkspace, renderRegistryProjects } from './page-registry-workspace-ui';
import { pickerTree, focusPickerPage } from './page-registration-picker-tree';
import { saveLocalPageRegistration } from './local-page-registration';
import { syncPageRegistrationType } from './page-registration-create-ui';
import { currentMAccess } from '../permissions/m-platform-store';
import { mPageKey } from '../permissions/m-platform-catalog';
import {setOperationActor,appendOperation} from './operation-log';
import {currentMAccount} from '../permissions/m-platform-store';
import {renderOperationLog,bindOperationLog} from './operation-log-ui';
import {renderProjectPageTable,bindProjectPageTable} from './project-page-table';

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
let menuSearchHasUserInputIntent = false;
let draggedPath: MenuNodePath | null = null;
let issueCursor = 0;
let dialogState: MenuNodeDialogState | null = null;
let fullscreenPreviewOpen = false;
let bodyOverflowBeforePreview = "";
let fullscreenPreviewSheetRootPath: MenuNodePath | null = null;
/** 全屏预览滑层内：有子菜单的二级目录展开态（与编辑器树 expandedPaths 独立） */
const fullscreenPreviewSheetExpandedPaths = new Set<string>();
const expandedPaths = new Set<string>();

function setActiveMenuFormAnchor(active: JsonMenuFormSection): void {
  document.querySelectorAll<HTMLButtonElement>("[data-jme-form-anchor]").forEach((button) => {
    const selected = button.dataset.jmeFormAnchor === active;
    button.toggleAttribute("aria-current", selected);
    if (selected) button.setAttribute("aria-current", "location");
    button.classList.toggle("border-teal-700", selected);
    button.classList.toggle("text-teal-700", selected);
    button.classList.toggle("border-transparent", !selected);
    button.classList.toggle("text-slate-500", !selected);
  });
}

function syncMenuFormAnchor(): void {
  const host = document.querySelector<HTMLElement>("[data-jme-detail-panel]");
  const header = host?.querySelector<HTMLElement>("[data-jme-form-sticky-header]");
  if (!host || !header) return;
  const threshold = host.getBoundingClientRect().top + header.offsetHeight + 16;
  const tops = Object.fromEntries(JSON_MENU_FORM_SECTIONS.map((section) => [section, host.querySelector<HTMLElement>(`[data-jme-form-section="${section}"]`)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY])) as Record<JsonMenuFormSection, number>;
  const atBottom = host.scrollTop + host.clientHeight >= host.scrollHeight - 2;
  setActiveMenuFormAnchor(resolveActiveJsonMenuFormSection(tops, threshold, atBottom));
}

function rerenderPreservingMenuFormScroll(onMount: () => void): void {
  rerenderPreservingJsonMenuDetailScroll(onMount);
  requestAnimationFrame(() => requestAnimationFrame(syncMenuFormAnchor));
}
function rerenderPreservingMenuTreeScroll(onMount: () => void): void { rerenderPreservingJsonMenuTreeScroll(onMount); }

function closeRegistrationModal(onMount: () => void): void {
  const detail = registrationUi.detail, spec = registrationUi.spec, create = registrationUi.create;
  registrationUi.picker = false; registrationUi.detail = ""; registrationUi.spec = false; registrationUi.create = false;
  rerenderPreservingMenuFormScroll(onMount);
  requestAnimationFrame(() => document.querySelector<HTMLElement>(create ? '[data-page-register]' : detail ? `[data-page-detail="${CSS.escape(detail)}"]` : spec ? "[data-page-spec]" : "[data-page-picker-open]")?.focus());
}

function restoreMenuFormScroll(top: number, onMount: () => void): void {
  onMount();
  const restore = (): void => {
    const host = document.querySelector<HTMLElement>("[data-jme-detail-panel]");
    if (!host) return;
    host.scrollTop = Math.min(Math.max(0, top), Math.max(0, host.scrollHeight - host.clientHeight));
    syncMenuFormAnchor();
  };
  restore();
  requestAnimationFrame(() => { restore(); requestAnimationFrame(() => { restore(); requestAnimationFrame(restore); }); });
}

function rerenderAtMenuPurpose(onMount: () => void): void {
  onMount();
  const align = (): void => {
    const host = document.querySelector<HTMLElement>("[data-jme-detail-panel]");
    const header = host?.querySelector<HTMLElement>("[data-jme-form-sticky-header]");
    const purpose = host?.querySelector<HTMLElement>("[data-jme-menu-purpose]");
    if (!host || !header || !purpose) return;
    host.scrollTop = Math.max(0, host.scrollTop + purpose.getBoundingClientRect().top - host.getBoundingClientRect().top - header.offsetHeight);
    syncMenuFormAnchor();
  };
  align();
  requestAnimationFrame(() => { align(); requestAnimationFrame(align); });
}

function rerenderPreservingLinkTargetScroll(onMount: () => void): void {
  const top = document.querySelector<HTMLElement>("[data-jme-link-target-scroll]")?.scrollTop ?? 0;
  onMount();
  requestAnimationFrame(() => {
    const host = document.querySelector<HTMLElement>("[data-jme-link-target-scroll]");
    if (host) host.scrollTop = Math.min(top, Math.max(0, host.scrollHeight - host.clientHeight));
  });
}

function rerenderLinkTargetSearch(value: string, onMount: () => void): void {
  onMount();
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>("[data-jme-link-target-search]");
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(value.length, value.length);
  });
}

function rerenderParentPickerScroll(onMount: () => void): void {
  const top = document.querySelector<HTMLElement>("[data-jme-parent-picker-scroll]")?.scrollTop ?? 0;
  onMount();
  requestAnimationFrame(() => {
    const host = document.querySelector<HTMLElement>("[data-jme-parent-picker-scroll]");
    if (host) host.scrollTop = Math.min(top, Math.max(0, host.scrollHeight - host.clientHeight));
  });
}

function rerenderParentPickerSearch(value: string, onMount: () => void): void {
  onMount();
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLInputElement>("[data-jme-parent-picker-search]");
    input?.focus({ preventScroll: true });
    input?.setSelectionRange(value.length, value.length);
  });
}

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
  const pageMode: MenuPageMode = isMenuDirectory(node) ? "directory" : effectiveType === "iframe" ? "iframe" : effectiveType === "external" ? "external" : effectiveType === "link" ? "link" : effectiveType === "micro-app" ? "micro-app" : "inner";
  return { mode: "edit", targetPath: [...path], parentPath: path.slice(0, -1), pageMode, draft: structuredClone(node), initialExplicitType: node.type, inheritedExternalUrl: resolveEffectiveExternalUrl(node, ancestors), pageModeTouched: false, extraInfoText: node.extraInfo === undefined ? "" : JSON.stringify(node.extraInfo, null, 2) };
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

export function renderJsonMenuEditorPage(view: MenuRoutingView = "nav"): string {
  if(view==='project-table')return renderProjectPageTable();
  if(view==='project-log')return renderOperationLog('registry');
  if(view==='menu-log'||view==='registry-log')return renderOperationLog(view==='menu-log'?'menu':'registry');
  const { state } = jsonMenuEditorStore;
  if (state.status === "idle" || state.status === "loading") return `<div class="grid min-h-[680px] flex-1 place-items-center rounded-2xl bg-white shadow-[0_2px_14px_rgba(15,23,42,0.04)]"><div class="text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-t-transparent"></div><p class="mt-4 text-sm font-medium text-slate-800">正在读取当前菜单配置…</p><p class="mt-1 text-xs text-slate-500">优先恢复共享草稿</p></div></div>`;
  if (!state.document) return `<div class="grid min-h-[680px] flex-1 place-items-center rounded-2xl border border-red-100 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.04)]"><div class="text-center"><h2 class="font-semibold text-red-900">菜单配置加载失败</h2><p class="mt-2 text-sm text-red-700">${escapeHtml(state.message)}</p><button type="button" data-jme-retry class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm text-white">重新加载</button></div></div>`;

  const document = state.document;
  const selected = jsonMenuEditorStore.selectedNode();
  const ancestors = selectedAncestors();
  if (!dialogState && selected) dialogState = buildEditFormState(state.selectedPath);
  return `<div class="flex min-w-0 flex-col ${view === "projects" ? "grow shrink-0" : view === "nav" ? "min-h-0 flex-1 overflow-hidden" : "min-h-0 flex-1 overflow-hidden rounded-[22px] bg-[#f7f8fa] px-6 pt-6 pb-3"}" data-json-menu-editor>
    ${view === "nav" && state.message ? `<div class="mb-3 shrink-0 rounded-lg ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"} px-3 py-2 text-xs">${escapeHtml(state.message)}</div>` : ""}
    ${view === "projects" ? renderRegistryProjects() : view === "registry" || view === "pages" ? registryView() : `<div class="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_16px_0_rgba(15,23,42,0.035)]">
      ${renderJsonMenuTree(document, state.selectedPath, state.issues, searchValue, expandedPaths)}
      ${renderJsonMenuNodeFormPanel(document, dialogState, state.issues, state.published)}
    </div>`}
    ${registrationModal()}
    ${fullscreenPreviewOpen ? renderJsonMenuFullscreenPreview(document, state.locale, state.selectedPath, selected, ancestors, fullscreenPreviewSheetRootPath, fullscreenPreviewSheetExpandedPaths) : ""}
  </div>`;
}

function openAdd(parentPath: MenuNodePath, onMount: () => void): void {
  const document = jsonMenuEditorStore.state.document;
  if (!document) return;
  if (parentPath.length && (isCompatibilityProtected(document.menu, parentPath) || subtreeContainsCompatibility(document.menu, parentPath))) { showAppToast("该节点属于兼容保护范围，不能添加子菜单。", { variant: "error" }); return; }
  const id = createMenuObjectId();
  const node: MenuNode = { id, name: parentPath.length ? "新建子菜单" : "新增一级导航", key: `menu_${id}`, type: "inner" };
  if (!jsonMenuEditorStore.addNode(parentPath, node)) { showAppToast("新增子菜单失败。", { variant: "error" }); return; }
  if (!parentPath.length) jsonMenuEditorStore.moveSelected([], 0);
  if (parentPath.length) expandedPaths.add(encodeMenuNodePath(parentPath));
  dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath);
  if (dialogState) dialogState.dirty = true;
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
  dialogState.dirty = true;
  if (field === "extraInfo") { dialogState.extraInfoText = raw; return; }
  const remove = raw === "" || raw === "missing";
  const boolValue = raw === "true" ? true : raw === "false" ? false : undefined;
  const node = dialogState.draft;
  if (["id", "name", "key", "path", "url", "icon", "i18nKey"].includes(field)) {
    if (field === "url") dialogState.pageModeTouched = true;
    if (remove) delete (node as unknown as Record<string, unknown>)[field]; else (node as unknown as Record<string, unknown>)[field] = raw;
    if (field === "name" && node.i18nInfo?.["zh-CN"] !== undefined) {
      if (remove) delete node.i18nInfo["zh-CN"]; else node.i18nInfo["zh-CN"] = raw;
    }
    return;
  }
  const parts = field.split(".");
  if (parts[0] === "i18nInfo") { node.i18nInfo ??= {}; if (remove) delete node.i18nInfo[parts[1] as keyof typeof node.i18nInfo]; else node.i18nInfo[parts[1] as keyof typeof node.i18nInfo] = raw; }
  if (field === "display") { if (remove) delete node.display; else node.display = boolValue; }
  if (field === "paidMenu") node.paidMenu = boolValue === true ? true : undefined;
  if (field === "visibleToAllMerchants") {
    if (boolValue === undefined) delete node.visibleToAllMerchants;
    else node.visibleToAllMerchants = boolValue;
  }
  if (field === "disabled") { if (remove) delete node.disabled; else node.disabled = boolValue; }
  if (parts[0] === "microAppConfig") {
    node.microAppConfig ??= {};
    const key = parts[1] as keyof NonNullable<MenuNode["microAppConfig"]>;
    if (remove) delete node.microAppConfig[key];
    else if (key === "iframe" || key === "keepAlive") (node.microAppConfig as Record<string, unknown>)[key] = boolValue;
    else (node.microAppConfig as Record<string, unknown>)[key] = raw;
    if (!Object.keys(node.microAppConfig).length) delete node.microAppConfig;
  }
  if (parts[0] === "externalConfig") {
    node.externalConfig ??= {};
    const key = parts[1] === "targetCustom" ? "target" : parts[1] as "target" | "features";
    if (remove) delete node.externalConfig[key]; else node.externalConfig[key] = raw;
    if (!Object.keys(node.externalConfig).length) delete node.externalConfig;
  }
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
  dialogState.dirty = true;
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
  if (dialogState.pageMode === "inner" && !node.path?.trim()) { dialogState.error = "请选择注册页面，或在特殊接入 / 兼容配置中填写路由。"; return null; }
  const normalized = normalizeMenuNodeForPageMode(node, dialogState.pageMode, {
    depth: dialogState.parentPath.length + 1,
    initialExplicitType: dialogState.initialExplicitType,
    inheritedExternalUrl: dialogState.inheritedExternalUrl,
    pageModeTouched: dialogState.pageModeTouched,
  });
  if (!normalized.ok) { dialogState.error = normalized.error; return null; }
  if (normalized.node.paidMenu === true) delete normalized.node.visibleToAllMerchants;
  const extraInfoText = dialogState.extraInfoText?.trim();
  if (extraInfoText) {
    try {
      const parsed = JSON.parse(extraInfoText) as unknown;
      if (!parsed || typeof parsed !== "object") throw new Error();
      normalized.node.extraInfo = parsed;
    } catch { dialogState.error = "extraInfo 必须是合法的 JSON 对象或数组。"; return null; }
  } else delete normalized.node.extraInfo;
  Object.keys(node).forEach((key) => delete (node as unknown as Record<string, unknown>)[key]);
  if(dialogState.pageMode!=='micro-app'){delete normalized.node.registeredPageId;delete node.registeredPageId;}
  Object.assign(node, normalized.node);
  if (node.i18nInfo && !Object.values(node.i18nInfo).some(Boolean)) delete node.i18nInfo;
  dialogState.error = undefined;
  return node;
}

function commitCurrentDialog(): boolean {
  if (!dialogState?.dirty) return true;
  const next = validateAndNormalizeDialog();
  if (!next) return false;
  const ok = dialogState.mode === "add"
    ? jsonMenuEditorStore.addNode(dialogState.parentPath, next)
    : jsonMenuEditorStore.replaceAndRelocateSelected(next, dialogState.parentPath);
  if (!ok) { dialogState.error = "当前修改无法保存，请调整后重试。"; return false; }
  dialogState.dirty = false;
  return true;
}

async function publishCurrentMenu(onMount: () => void): Promise<boolean> {
  if (!commitCurrentDialog()) { appendOperation({scope:'menu',action:'发布',stage:'发布',before:jsonMenuEditorStore.state.document,after:jsonMenuEditorStore.state.document,result:'failure',reason:dialogState?.error??'页面校验未通过'}); onMount(); return false; }
  let result = await jsonMenuEditorStore.publish(currentUser(), false);
  if (result.needsWarningConfirmation) {
    const ok = await openConfirmDialog({ title: "确认发布", message: `当前有 ${jsonMenuEditorStore.state.issues.filter((issue) => issue.severity === "warning").length} 个兼容警告，确认仍要发布？`, confirmLabel: "确认发布" });
    if (ok) result = await jsonMenuEditorStore.publish(currentUser(), true);
  }
  if (result.ok) await ensurePublishedSubscriptionMenuTree(true);
  if (!result.ok && !result.needsWarningConfirmation) {
    const first = jsonMenuEditorStore.state.issues.find((issue) => issue.severity === "error");
    if (first?.path) jsonMenuEditorStore.select(first.path);
    showAppToast(first ? `发布被阻止：${first.message}` : jsonMenuEditorStore.state.message || "发布失败", { variant: "error" });
  }
  dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath);
  if (!result.ok && dialogState) dialogState.dirty = true;
  onMount();
  return result.ok;
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
let operationWarningBound = false;
export function bindJsonMenuEditor(mount: () => void): void {
  bindProjectPageTable(mount);
  if(!operationWarningBound){operationWarningBound=true;window.addEventListener('menusifu:operation-log-warning',event=>showAppToast((event as CustomEvent<string>).detail,{variant:'error'}));}
  setOperationActor(()=>{
    const account=currentMAccount();
    return account
      ? {name:`${account.employeeId}（本地账号）`,email:account.loginEmail}
      : '未知本地账号';
  });
  bindOperationLog(mount);
  // Right-panel edits, picker close/confirm and other direct refresh paths all
  // replace the tree DOM. Preserve its viewport independently of detail scroll.
  const onMount = () => rerenderPreservingJsonMenuTreeScroll(mount);
  bindRegistryWorkspace(onMount);
  const editorExists = Boolean(document.querySelector("[data-json-menu-editor]"));
  if ((jsonMenuEditorStore.state.status === "idle" || jsonMenuEditorStore.state.status === "error") && !editorExists) void jsonMenuEditorStore.load().then(() => { expandAll(); onMount(); });
  if (bound) return;
  bound = true;

  document.body.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const copyPath=target.closest<HTMLElement>('[data-page-copy-path]');
    if(copyPath){
      const path=copyPath.dataset.pageCopyPath??'';
      if(!navigator.clipboard){showAppToast('当前环境不支持复制，请手动选择路径复制',{variant:'error'});return;}
      if(path)void navigator.clipboard.writeText(path).then(()=>showAppToast('路径已复制')).catch(()=>showAppToast('复制失败，请手动选择路径复制',{variant:'error'}));
      return;
    }
    if (target.closest('[data-page-register]')) {
      if (currentMAccess(mPageKey('routing')) !== 'edit') return;
      registrationUi.create = true; onMount();
      requestAnimationFrame(() => {
        const form = document.querySelector<HTMLFormElement>('[data-page-registration-form]');
        if (form) { syncPageRegistrationType(form); form.querySelector<HTMLInputElement>('[name="title"]')?.focus(); }
      });
      return;
    }
    if (target.closest("[data-page-picker-open]") && dialogState) {
      if (dialogState.pageMode !== 'micro-app') return;
      registrationUi.picker = true; registrationUi.pickerQuery = "";
      registrationUi.pending = matchRegisteredPage(dialogState.draft, getPageRegistrations())?.id ?? "";
      focusPickerPage(registrationUi.pending);
      rerenderPreservingMenuFormScroll(onMount);
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>("[data-page-picker-search]")?.focus()); return;
    }
    const projectPick = target.closest<HTMLElement>('[data-picker-project]');
    if (projectPick) { pickerTree.project = projectPick.dataset.pickerProject!; registrationUi.pending = ''; const rows = document.querySelector<HTMLElement>('[data-page-picker-rows]'); if(rows) rows.innerHTML=pickerRows(); document.querySelector<HTMLButtonElement>('[data-page-confirm]')?.setAttribute('disabled',''); return; }
    const togglePick = target.closest<HTMLElement>('[data-picker-tree-toggle]');
    if(togglePick) { const id=togglePick.dataset.pickerTreeToggle!; pickerTree.collapsed.has(id)?pickerTree.collapsed.delete(id):pickerTree.collapsed.add(id); const rows=document.querySelector<HTMLElement>('[data-page-picker-rows]'); if(rows)rows.innerHTML=pickerRows(); return; }
    const pagePick = target.closest<HTMLElement>("[data-page-pick]")?.dataset.pagePick;
    if (pagePick) {
      if (!getPageRegistrations().some(p => p.id === pagePick && p.status === "active")) return;
      registrationUi.pending = pagePick;
      const rows = document.querySelector<HTMLElement>("[data-page-picker-rows]"); if (rows) rows.innerHTML = pickerRows();
      document.querySelector<HTMLButtonElement>("[data-page-confirm]")?.removeAttribute("disabled");
      document.querySelector<HTMLElement>(`[data-page-pick="${CSS.escape(pagePick)}"]`)?.focus(); return;
    }
    if(target.closest('[data-page-refresh-binding]')&&dialogState){
      if(currentMAccess(mPageKey('routing'))!=='edit'||dialogState.mode!=='edit'||dialogState.pageMode!=='micro-app')return;
      const node=dialogState.draft;
      const published=walkMenuNodes(jsonMenuEditorStore.state.published?.menu??[]).find(v=>v.node.id===node.id)?.node;
      const page=getPageRegistrations().find(p=>p.id===node.registeredPageId);
      if(!page||!published||published.type!=='micro-app'||published.registeredPageId!==page.id)return;
      try{
        dialogState.draft=bindRegisteredPage(node,page,published);
        dialogState.pageModeTouched=true;dialogState.dirty=true;dialogState.error=undefined;
        rerenderPreservingMenuFormScroll(onMount);
        showAppToast('页面配置已刷新到草稿，保存并发布后生效');
      }catch(error){showAppToast(error instanceof Error?error.message:'无法刷新已有绑定',{variant:'error'});}
      return;
    }
    if (target.closest("[data-page-confirm]") && dialogState) {
      const page = getPageRegistrations().find(p => p.id === registrationUi.pending); if (!page) return;
      try {
        dialogState.draft = bindRegisteredPage(dialogState.draft, page);
        dialogState.pageMode = page.routing.type; dialogState.pageModeTouched = true;
        dialogState.dirty = true; dialogState.error = undefined; dialogState.specialPageOpen = false;
        closeRegistrationModal(onMount);
      } catch (error) { showAppToast(error instanceof Error ? error.message : "页面关联失败", { variant: "error" }); }
      return;
    }
    const pageDetail = target.closest<HTMLElement>("[data-page-detail]")?.dataset.pageDetail;
    if (pageDetail) { registrationUi.detail = pageDetail; onMount(); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-page-close]")?.focus()); return; }
    if (target.closest("[data-page-spec]")) { registrationUi.spec = true; onMount(); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-page-close]")?.focus()); return; }
    if (target.closest("[data-page-close]") || target.matches("[data-page-overlay]")) { closeRegistrationModal(onMount); return; }
    if (target.closest("[data-page-special-toggle]") && dialogState) { dialogState.specialPageOpen = !dialogState.specialPageOpen; rerenderPreservingMenuFormScroll(onMount); return; }
    if (!target.closest("[data-jme-menu-actions]")) document.querySelectorAll<HTMLDetailsElement>("[data-jme-menu-actions][open]").forEach((menu) => { menu.open = false; });
    const formAnchor = target.closest<HTMLButtonElement>("[data-jme-form-anchor]")?.dataset.jmeFormAnchor as JsonMenuFormSection | undefined;
    if (formAnchor) {
      const host = target.closest<HTMLElement>("[data-jme-detail-panel]");
      const header = host?.querySelector<HTMLElement>("[data-jme-form-sticky-header]");
      const section = host?.querySelector<HTMLElement>(`[data-jme-form-section="${formAnchor}"]`);
      if (!host || !header || !section) return;
      const top = Math.max(0, host.scrollTop + section.getBoundingClientRect().top - host.getBoundingClientRect().top - header.offsetHeight - 16);
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      host.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
      setActiveMenuFormAnchor(formAnchor);
      return;
    }
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
      if (!fullscreenPreviewOpen && dialogState?.dirty && encodeMenuNodePath(dialogState.targetPath ?? []) !== encodeMenuNodePath(decoded)) {
        void openConfirmDialog({ title: "未保存的菜单修改", message: "当前菜单有未保存修改。保存并发布后再切换，否则本次编辑内容将丢失。", confirmLabel: "保存并发布", cancelLabel: "不保存" }).then(async (save) => {
          if (save && !(await publishCurrentMenu(onMount))) return;
          jsonMenuEditorStore.select(decoded);
          dialogState = buildEditFormState(decoded);
          rerenderPreservingJsonMenuTreeScroll(onMount);
        });
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
    if (togglePath != null) { expandedPaths.has(togglePath) ? expandedPaths.delete(togglePath) : expandedPaths.add(togglePath); rerenderPreservingMenuTreeScroll(onMount); return; }
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
    const moveMenuPath = target.closest<HTMLElement>("[data-jme-move-menu]")?.dataset.jmeMoveMenu;
    if (moveMenuPath != null) { jsonMenuEditorStore.select(decodeMenuNodePath(moveMenuPath)); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); if (dialogState) { dialogState.movePickerMode = true; dialogState.parentPickerOpen = true; dialogState.parentPickerSearch = ""; dialogState.parentPickerCollapsedPaths = new Set(); } onMount(); return; }
    const menuActionPath = target.closest<HTMLElement>("[data-jme-duplicate-menu], [data-jme-delete-menu], [data-jme-move-up], [data-jme-move-down]");
    if (menuActionPath) { const encoded = menuActionPath.dataset.jmeDuplicateMenu ?? menuActionPath.dataset.jmeDeleteMenu ?? menuActionPath.dataset.jmeMoveUp ?? menuActionPath.dataset.jmeMoveDown; const path = decodeMenuNodePath(encoded ?? ""); jsonMenuEditorStore.select(path); if (menuActionPath.dataset.jmeDeleteMenu !== undefined) { const node = jsonMenuEditorStore.selectedNode(); const menuName = node?.name ?? "菜单"; const children = node ? walkMenuNodes(node.children ?? []).length : 0; void openConfirmDialog({ title: `删除“${menuName}”？`, message: `该菜单${children ? `及其 ${children} 个下级` : ""}将被永久删除，此操作无法撤销，请准确输入菜单名称“${menuName}”以确认。`, confirmLabel: "删除", danger: true, requireText: menuName }).then((ok) => { if (ok) jsonMenuEditorStore.deleteSelected(); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); rerenderPreservingMenuTreeScroll(onMount); }); return; } if (menuActionPath.dataset.jmeDuplicateMenu !== undefined) jsonMenuEditorStore.duplicateSelected(); else { const parent = path.slice(0, -1); const index = path.at(-1) ?? 0; jsonMenuEditorStore.moveSelected(parent, menuActionPath.dataset.jmeMoveUp !== undefined ? Math.max(0, index - 1) : index + 2); } dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); rerenderPreservingMenuTreeScroll(onMount); return; }
    const addPath = target.closest<HTMLElement>("[data-jme-open-add]")?.dataset.jmeOpenAdd;
    if (addPath != null) { openAdd(decodeMenuNodePath(addPath), () => rerenderPreservingMenuTreeScroll(onMount)); return; }
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
    if (target.closest("[data-jme-icon-picker-open]") && dialogState) { dialogState.iconPickerOpen = true; onMount(); return; }
    if (target.closest("[data-jme-icon-picker-close]") && dialogState) { dialogState.iconPickerOpen = false; rerenderPreservingMenuFormScroll(onMount); return; }
    const iconPickerValue = target.closest<HTMLElement>("[data-jme-icon-picker-value]")?.dataset.jmeIconPickerValue;
    if (iconPickerValue && dialogState) { assignDialogField("icon", iconPickerValue); dialogState.iconPickerOpen = false; rerenderPreservingMenuFormScroll(onMount); return; }
    if (target.closest("[data-jme-parent-picker-open]") && dialogState) { dialogState.parentPickerReturnScrollTop = document.querySelector<HTMLElement>("[data-jme-detail-panel]")?.scrollTop ?? 0; dialogState.parentPickerOpen = true; dialogState.parentPickerSearch = ""; dialogState.parentPickerCollapsedPaths = new Set(); onMount(); return; }
    if (target.closest("[data-jme-parent-picker-close]") && dialogState) { dialogState.parentPickerOpen = false; restoreMenuFormScroll(dialogState.parentPickerReturnScrollTop ?? 0, onMount); return; }
    const parentPickerToggle = target.closest<HTMLElement>("[data-jme-parent-picker-toggle]")?.dataset.jmeParentPickerToggle;
    if (parentPickerToggle != null && dialogState) { dialogState.parentPickerCollapsedPaths ??= new Set(); if (dialogState.parentPickerCollapsedPaths.has(parentPickerToggle)) dialogState.parentPickerCollapsedPaths.delete(parentPickerToggle); else dialogState.parentPickerCollapsedPaths.add(parentPickerToggle); rerenderParentPickerScroll(onMount); return; }
    const parentPickerPath = target.closest<HTMLElement>("[data-jme-parent-picker-path]")?.dataset.jmeParentPickerPath;
    if (parentPickerPath != null && dialogState) { const nextParentPath = decodeMenuNodePath(parentPickerPath); if (dialogState.movePickerMode) { dialogState.parentPickerOpen = false; dialogState.movePickerMode = false; if (!jsonMenuEditorStore.moveSelected(nextParentPath, Number.MAX_SAFE_INTEGER)) showAppToast("无法移动到该父级：不能形成循环或影响兼容保留子树。", { variant: "error" }); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); rerenderPreservingMenuTreeScroll(onMount); return; } dialogState.parentPath = nextParentPath; dialogState.dirty = true; dialogState.parentPickerOpen = false; dialogState.error = undefined; restoreMenuFormScroll(dialogState.parentPickerReturnScrollTop ?? 0, onMount); return; }
    const pageMode = target.closest<HTMLElement>("[data-jme-page-mode]")?.dataset.jmePageMode as MenuPageMode | undefined;
    if (pageMode && dialogState) { dialogState.pageMode = pageMode; dialogState.pageModeTouched = true; dialogState.dirty = true; dialogState.error = undefined; if (pageMode === "link") rerenderAtMenuPurpose(onMount); else rerenderPreservingMenuFormScroll(onMount); return; }
    if (target.closest("[data-jme-link-target-open]") && dialogState) { dialogState.linkTargetReturnScrollTop = document.querySelector<HTMLElement>("[data-jme-detail-panel]")?.scrollTop ?? 0; dialogState.linkTargetOpen = true; dialogState.linkTargetSearch = ""; dialogState.linkTargetCollapsedPaths = new Set(); onMount(); return; }
    if (target.closest("[data-jme-link-target-close]") && dialogState) { dialogState.linkTargetOpen = false; onMount(); return; }
    const linkTargetToggle = target.closest<HTMLElement>("[data-jme-link-target-toggle]")?.dataset.jmeLinkTargetToggle;
    if (linkTargetToggle != null && dialogState) {
      dialogState.linkTargetCollapsedPaths ??= new Set();
      if (dialogState.linkTargetCollapsedPaths.has(linkTargetToggle)) dialogState.linkTargetCollapsedPaths.delete(linkTargetToggle);
      else dialogState.linkTargetCollapsedPaths.add(linkTargetToggle);
      rerenderPreservingLinkTargetScroll(onMount);
      return;
    }
    const linkTargetKey = target.closest<HTMLElement>("[data-jme-link-target-key]")?.dataset.jmeLinkTargetKey;
    if (linkTargetKey != null && dialogState) { const returnTop = dialogState.linkTargetReturnScrollTop ?? document.querySelector<HTMLElement>("[data-jme-detail-panel]")?.scrollTop ?? 0; dialogState.draft.targetKey = linkTargetKey; dialogState.dirty = true; dialogState.linkTargetOpen = false; dialogState.error = undefined; restoreMenuFormScroll(returnTop, onMount); return; }
    if (target.closest("[data-jme-duplicate]")) { if (!jsonMenuEditorStore.duplicateSelected()) showAppToast("包含兼容保留节点的子树不能复制。", { variant: "error" }); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); return; }
    if (target.closest("[data-jme-delete]")) { const node = jsonMenuEditorStore.selectedNode(); if (!node) return; const menuName = node.name || "菜单"; const count = walkMenuNodes(node.children ?? []).length; void (async () => { const ok = await openConfirmDialog({ title: `删除“${menuName}”？`, message: `该菜单${count ? `及其 ${count} 个下级` : ""}将被永久删除，请准确输入菜单名称“${menuName}”以确认。`, confirmLabel: "删除", danger: true, requireText: menuName }); if (!ok) return; if (!jsonMenuEditorStore.deleteSelected()) showAppToast("包含兼容保留节点的子树不能删除。", { variant: "error" }); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); })(); return; }
    if (target.closest("[data-jme-save]")) { void jsonMenuEditorStore.saveDraft(currentUser()).then(() => { dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); return; }
    if (target.closest("[data-jme-publish], [data-jme-publish-current]")) { void publishCurrentMenu(onMount); return; }
    if (target.closest("[data-jme-export]")) { const before=jsonMenuEditorStore.state.document; const content=jsonMenuEditorStore.exportJson(); if(!content){appendOperation({scope:"menu",action:"导出 JSON",stage:"导出",before,after:before,result:"failure",reason:"顶部配置不完整"});showAppToast("顶部配置不完整，无法导出。",{variant:"error"});return;} try{downloadJson(content,before?.name??"menu-config");appendOperation({scope:"menu",action:"导出 JSON",stage:"导出",before,after:before,force:true});}catch(error){appendOperation({scope:"menu",action:"导出 JSON",stage:"导出",before,after:before,result:"failure",reason:"生成导出文件失败"});showAppToast("导出失败",{variant:"error"});}return; }
    if (target.closest("[data-jme-discard]")) { void (async () => { const ok = await openConfirmDialog({ title: "放弃修改", message: "确定放弃当前未保存修改？将重新读取共享草稿；没有草稿时恢复发布版本。", confirmLabel: "确认放弃", danger: true }); if (ok) void jsonMenuEditorStore.discard().then(() => { dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); })(); return; }
    if (target.closest("[data-jme-retry]")) { void jsonMenuEditorStore.load().then(() => { expandAll(); dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath); onMount(); }); return; }
    if (target.closest("[data-jme-next-issue]")) { const located = jsonMenuEditorStore.state.issues.filter((issue) => issue.path); if (located.length) { jsonMenuEditorStore.select(located[issueCursor++ % located.length]!.path!); onMount(); } }
  });

  document.addEventListener("scroll", (event) => {
    if (event.target instanceof HTMLElement && event.target.matches("[data-jme-detail-panel]")) syncMenuFormAnchor();
  }, true);

  document.body.addEventListener("input", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.matches("[data-page-registry-search]")) { registrationUi.query = input.value; const rows = document.querySelector<HTMLElement>("[data-page-registry-rows]"); if (rows) rows.innerHTML = registryRows(); return; }
    if (input.matches("[data-page-picker-search]")) { registrationUi.pickerQuery = input.value; const rows = document.querySelector<HTMLElement>("[data-page-picker-rows]"); if (rows) rows.innerHTML = pickerRows(); return; }
    if (input.matches("[data-jme-parent-picker-search]") && dialogState) {
      dialogState.parentPickerSearch = input.value;
      rerenderParentPickerSearch(input.value, onMount);
      return;
    }
    if (input.matches("[data-jme-link-target-search]") && dialogState) {
      dialogState.linkTargetSearch = input.value;
      rerenderLinkTargetSearch(input.value, onMount);
      return;
    }
    if (input.matches("[data-jme-search]")) {
      if (shouldIgnoreJsonMenuSearchInput(searchValue, menuSearchHasUserInputIntent, input.value)) {
        input.value = "";
        return;
      }
      searchValue = input.value;
      if (!searchValue) menuSearchHasUserInputIntent = false;
      const panel = input.closest<HTMLElement>("[data-jme-tree-panel]");
      const menuDocument = jsonMenuEditorStore.state.document;
      if (panel && menuDocument) panel.outerHTML = renderJsonMenuTree(menuDocument, jsonMenuEditorStore.state.selectedPath, jsonMenuEditorStore.state.issues, searchValue, expandedPaths);
      requestAnimationFrame(() => { const next = document.querySelector<HTMLInputElement>("[data-jme-search]"); next?.focus(); next?.setSelectionRange(searchValue.length, searchValue.length); });
      return;
    }
    if (input.dataset.jmeDialogField) assignDialogField(input.dataset.jmeDialogField, input.value);
  });

  const markMenuSearchUserIntent = (event: Event) => {
    if ((event.target as HTMLElement).matches("[data-jme-search]")) menuSearchHasUserInputIntent = true;
  };
  document.body.addEventListener("beforeinput", markMenuSearchUserIntent, true);
  document.body.addEventListener("paste", markMenuSearchUserIntent, true);
  document.body.addEventListener("drop", markMenuSearchUserIntent, true);
  document.body.addEventListener("compositionstart", markMenuSearchUserIntent, true);

  document.body.addEventListener("change", async (event) => {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    if(input.matches('[data-jme-import]')) {
      const file=(input as HTMLInputElement).files?.[0];if(!file)return;
      try {if(currentMAccess(mPageKey('routing'))!=='edit')throw new Error('暂无导入权限');
        const text=await file.text();const parsed=JSON.parse(text);
        const ok=await openConfirmDialog({title:'导入菜单配置',message:'导入会替换当前编辑配置，尚未发布的输入将被替换；导入本身不会发布。',confirmLabel:'确认导入',danger:true});if(!ok)return;
        if(currentMAccess(mPageKey('routing'))!=='edit')throw new Error('暂无导入权限');
        if(!jsonMenuEditorStore.importDocument(parsed)){showAppToast(jsonMenuEditorStore.state.message,{variant:'error'});return;}
        expandAll();dialogState=buildEditFormState(jsonMenuEditorStore.state.selectedPath);onMount();
      }catch(error){appendOperation({scope:'menu',action:'导入 JSON',stage:'编辑配置',before:jsonMenuEditorStore.state.document,after:jsonMenuEditorStore.state.document,result:'failure',reason:error instanceof SyntaxError?'JSON 格式无效':error instanceof Error?error.message:'导入失败'});showAppToast('导入失败，当前菜单保持不变',{variant:'error'});}finally{input.value='';}return;
    }
    if (input.matches('[data-page-registration-type]')) { const form = input.closest<HTMLFormElement>('form'); if (form) syncPageRegistrationType(form); return; }
    if (input.matches("[data-page-registry-status]")) { registrationUi.status = input.value; const rows = document.querySelector<HTMLElement>("[data-page-registry-rows]"); if (rows) rows.innerHTML = registryRows(); return; }
    if (input.dataset.jmeRootField) { jsonMenuEditorStore.updateRoot((document) => (document as unknown as Record<string, unknown>)[input.dataset.jmeRootField!] = input.value); onMount(); return; }
    if (input.dataset.jmeDialogField) {
      const field = input.dataset.jmeDialogField;
      assignDialogField(field, input.value);
      if (field === "paidMenu") {
        const isPaid = input.value === "true";
        input.closest("[data-jme-paid-menu-field]")?.querySelector("#jme-paid-menu-hint")?.toggleAttribute("hidden", !isPaid);
        input.closest("[data-jme-paid-menu-field]")?.querySelector("[data-jme-merchant-visibility]")?.toggleAttribute("hidden", isPaid);
        if (isPaid) input.setAttribute("aria-describedby", "jme-paid-menu-hint");
        else input.removeAttribute("aria-describedby");
      }
      if (field === "accessControl.bool") rerenderPreservingMenuFormScroll(onMount);
      return;
    }
    if (input.matches("[data-jme-dialog-parent]") && dialogState) { dialogState.parentPath = decodeMenuNodePath(input.value); if (dialogState.pageMode === "directory" && dialogState.parentPath.length >= 2) dialogState.pageMode = "inner"; dialogState.error = undefined; onMount(); }
  });

  document.body.addEventListener("focusout", (event) => {
    const input = event.target as HTMLInputElement;
    const field = input.dataset.jmeDialogField;
    if (!field || !dialogState || dialogState.mode !== "edit" || input.type === "radio") return;
    assignDialogField(field, input.value);
    if (field === "name") {
      if (!jsonMenuEditorStore.replaceSelected(dialogState.draft)) return;
      const panel = document.querySelector<HTMLElement>("[data-jme-tree-panel]");
      const menuDocument = jsonMenuEditorStore.state.document;
      if (panel && menuDocument) rerenderPreservingJsonMenuTreeScroll(() => { panel.outerHTML = renderJsonMenuTree(menuDocument, jsonMenuEditorStore.state.selectedPath, jsonMenuEditorStore.state.issues, searchValue, expandedPaths); });
    }
    rerenderPreservingMenuFormScroll(onMount);
  });

  document.body.addEventListener("submit", (event) => {
    if ((event.target as HTMLElement).matches('[data-page-registration-form]')) {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      try {
        if (currentMAccess(mPageKey('routing')) !== 'edit') throw new Error('暂无注册页面权限。');
        const fields = new FormData(form);
        const value = (name: string) => String(fields.get(name) ?? '');
        const page = saveLocalPageRegistration({ id: value('id'), title: value('title'), titleEn: value('titleEn'), module: value('module'), type: value('type'), path: value('path'), url: value('url'), microName: value('microName'), microUrl: value('microUrl') }, getBuiltInPageRegistrations());
        registrationUi.query = page.id; registrationUi.status = 'all';
        closeRegistrationModal(onMount);
        showAppToast('页面已注册到当前浏览器，可在导航编排中选择。');
      } catch (error) {
        const message = form.querySelector<HTMLElement>('[data-page-registration-error]');
        if (message) { message.textContent = error instanceof Error ? error.message : '注册失败，输入内容已保留。'; message.classList.remove('hidden'); }
      }
      return;
    }
    if (!(event.target as HTMLElement).matches("[data-jme-node-form]")) return;
    event.preventDefault();
    const next = validateAndNormalizeDialog();
    if (!next || !dialogState) { onMount(); return; }
    const ok = dialogState.mode === "add" ? jsonMenuEditorStore.addNode(dialogState.parentPath, next) : jsonMenuEditorStore.replaceAndRelocateSelected(next, dialogState.parentPath);
    if (!ok) { dialogState.error = "该操作会影响兼容保留子树或形成循环，请调整后重试。"; onMount(); return; }
    expandAll();
    dialogState = buildEditFormState(jsonMenuEditorStore.state.selectedPath);
    onMount();
  });

  document.body.addEventListener("dragstart", (event) => { const path = (event.target as HTMLElement).closest<HTMLElement>("[data-jme-drag-path]")?.dataset.jmeDragPath; draggedPath = path ? decodeMenuNodePath(path) : null; });
  document.body.addEventListener("dragover", (event) => { if ((event.target as HTMLElement).closest("[data-jme-drop-parent]")) event.preventDefault(); });
  document.body.addEventListener("drop", (event) => { const zone = (event.target as HTMLElement).closest<HTMLElement>("[data-jme-drop-parent]"); if (!zone || !draggedPath) return; event.preventDefault(); jsonMenuEditorStore.select(draggedPath); if (!jsonMenuEditorStore.moveSelected(decodeMenuNodePath(zone.dataset.jmeDropParent ?? ""), Number(zone.dataset.jmeDropIndex ?? 0))) showAppToast("无法移动到该位置：不能形成循环或影响兼容保留子树。", { variant: "error" }); draggedPath = null; expandAll(); rerenderPreservingMenuTreeScroll(onMount); });
  document.addEventListener("keydown", (event) => {
    const pageModal = document.querySelector<HTMLElement>("[data-page-modal]");
    if (pageModal) {
      if (event.key === "Escape") { event.preventDefault(); closeRegistrationModal(onMount); return; }
      if (event.key === "Tab") {
        const items = Array.from(pageModal.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
        if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
      }
      return;
    }
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
}
