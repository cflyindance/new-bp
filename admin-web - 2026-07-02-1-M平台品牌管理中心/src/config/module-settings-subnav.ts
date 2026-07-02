/**
 * 设置页侧栏 / 四列矩阵 · 三级分组分段展示（与 B 端 renderModuleSettingsSubnavList 同源）
 */
import type { PermissionTreeNode } from "./permission-registry";
import {
  getModuleSettingsCatalog,
  type ModuleSettingCatalogHub,
} from "./module-settings-catalog";
import { t, type MessageKey } from "../i18n";
import { FOH_SETTINGS_PATH } from "./foh-settings-by-line-ui";
import { fohPresetAliasKeysForGroupKey } from "./foh-settings-group-keys";

/** 与 B 端 MODULE_SETTINGS_SUBNAV_SECTION_HEADING 一致 */
export const MODULE_SETTINGS_SUBNAV_SECTION_HEADING_CLASS =
  "px-2.5 pb-1 text-sm font-semibold tracking-tight text-foreground";

export function formatModuleSettingsSubnavLabel(label: string): string {
  if (label.endsWith("设置") && label.length > 2) return label.slice(0, -2);
  return label;
}

export function resolveModuleSettingsCatalogForL2(
  l2Node: PermissionTreeNode | undefined,
): ModuleSettingCatalogHub | undefined {
  if (!l2Node?.resource.path) return undefined;
  return getModuleSettingsCatalog(l2Node.resource.path);
}

/** 按 catalog.groupNavSections / groupOrder 排序 L3 节点（与 B 端侧栏顺序一致） */
export function sortL3NodesByCatalogNav(
  children: PermissionTreeNode[],
  catalog: ModuleSettingCatalogHub,
): PermissionTreeNode[] {
  const order = catalog.groupNavSections?.length
    ? catalog.groupNavSections.flatMap((s) => s.groupKeys)
    : (catalog.groupOrder ?? []);
  if (!order.length) return children;

  const byKey = buildL3NodeIndexByGroupKey(children, catalog);

  const sorted: PermissionTreeNode[] = [];
  const seen = new Set<string>();
  for (const key of order) {
    const node = byKey.get(key) ?? resolveL3NodeForSectionGroupKey(key, byKey, catalog);
    if (node) {
      sorted.push(node);
      if (node.resource.groupKey) seen.add(node.resource.groupKey);
      seen.add(key);
    }
  }
  for (const n of children) {
    const gk = n.resource.groupKey;
    if (!gk || !seen.has(gk)) sorted.push(n);
  }
  return sorted;
}

export function applyCatalogNavOrderToL2Tree(l2Node: PermissionTreeNode): void {
  const catalog = resolveModuleSettingsCatalogForL2(l2Node);
  if (!catalog || !l2Node.children.length) return;
  l2Node.children = sortL3NodesByCatalogNav(l2Node.children, catalog);
}

export interface RenderCatalogSectionedL3Options {
  activeKey: string;
  renderItem: (node: PermissionTreeNode, nested: boolean) => string;
}

function buildL3NodeIndexByGroupKey(
  l3Nodes: PermissionTreeNode[],
  catalog?: ModuleSettingCatalogHub,
): Map<string, PermissionTreeNode> {
  const byGroupKey = new Map<string, PermissionTreeNode>();
  const isFoh = catalog?.settingsPath === FOH_SETTINGS_PATH;

  for (const node of l3Nodes) {
    const gk = node.resource.groupKey;
    if (!gk) continue;
    const register = (key: string) => {
      if (!byGroupKey.has(key)) byGroupKey.set(key, node);
    };
    register(gk);
    if (isFoh) {
      for (const alias of fohPresetAliasKeysForGroupKey(gk)) {
        register(alias);
      }
    }
  }
  return byGroupKey;
}

function resolveL3NodeForSectionGroupKey(
  sectionGroupKey: string,
  byGroupKey: Map<string, PermissionTreeNode>,
  catalog?: ModuleSettingCatalogHub,
): PermissionTreeNode | undefined {
  const direct = byGroupKey.get(sectionGroupKey);
  if (direct) return direct;
  if (catalog?.settingsPath !== FOH_SETTINGS_PATH) return undefined;
  for (const alias of fohPresetAliasKeysForGroupKey(sectionGroupKey)) {
    const node = byGroupKey.get(alias);
    if (node) return node;
  }
  return undefined;
}

function markSectionGroupRendered(
  rendered: Set<string>,
  groupKey: string,
  catalog?: ModuleSettingCatalogHub,
): void {
  rendered.add(groupKey);
  if (catalog?.settingsPath === FOH_SETTINGS_PATH) {
    for (const alias of fohPresetAliasKeysForGroupKey(groupKey)) {
      rendered.add(alias);
    }
  }
}

function isSectionGroupRendered(
  rendered: Set<string>,
  groupKey: string | undefined,
  catalog?: ModuleSettingCatalogHub,
): boolean {
  if (!groupKey) return false;
  if (rendered.has(groupKey)) return true;
  if (catalog?.settingsPath !== FOH_SETTINGS_PATH) return false;
  return fohPresetAliasKeysForGroupKey(groupKey).some((alias) => rendered.has(alias));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 三级列：有 groupNavSections 时按 B 端侧栏分段（如前厅 员工端 / 食客端）
 */
export function renderCatalogSectionedL3Column(
  l2Node: PermissionTreeNode | undefined,
  options: RenderCatalogSectionedL3Options,
): string {
  if (!l2Node?.children.length) return "";

  const catalog = resolveModuleSettingsCatalogForL2(l2Node);
  const l3Nodes = catalog ? sortL3NodesByCatalogNav(l2Node.children, catalog) : l2Node.children;

  if (!catalog?.groupNavSections?.length) {
    return l3Nodes.map((n) => options.renderItem(n, false)).join("");
  }

  const byGroupKey = buildL3NodeIndexByGroupKey(l3Nodes, catalog);

  const rendered = new Set<string>();
  const parts: string[] = [];

  for (let i = 0; i < catalog.groupNavSections.length; i++) {
    const section = catalog.groupNavSections[i]!;
    if (i > 0) {
      parts.push('<div class="my-2 border-t border-border" role="presentation" aria-hidden="true"></div>');
    }
    const sectionLabel = formatModuleSettingsSubnavLabel(t(section.labelKey as MessageKey));
    parts.push(
      `<p class="${MODULE_SETTINGS_SUBNAV_SECTION_HEADING_CLASS} ${i > 0 ? "pt-2" : "pt-0.5"}">${escapeHtml(sectionLabel)}</p>`,
    );
    for (const groupKey of section.groupKeys) {
      const node = resolveL3NodeForSectionGroupKey(groupKey, byGroupKey, catalog);
      if (!node || isSectionGroupRendered(rendered, groupKey, catalog)) continue;
      markSectionGroupRendered(rendered, groupKey, catalog);
      if (node.resource.groupKey) markSectionGroupRendered(rendered, node.resource.groupKey, catalog);
      parts.push(options.renderItem(node, true));
    }
  }

  for (const node of l3Nodes) {
    const groupKey = node.resource.groupKey;
    if (isSectionGroupRendered(rendered, groupKey, catalog)) continue;
    parts.push(options.renderItem(node, false));
  }

  return parts.join("");
}

/** 当前 L2 是否使用 catalog 侧栏分段（如前厅 员工端/食客端） */
export function l2HasCatalogNavSections(l2Node: PermissionTreeNode | undefined): boolean {
  const catalog = resolveModuleSettingsCatalogForL2(l2Node);
  return Boolean(catalog?.groupNavSections?.length);
}
