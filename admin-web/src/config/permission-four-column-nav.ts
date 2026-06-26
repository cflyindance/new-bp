/**
 * 四级权限树 · 四列导航共用逻辑（平台预设配置页、RBAC 角色矩阵）
 */
import type { PermissionTreeNode } from "./permission-registry";
import { getModuleSettingsCatalog } from "./module-settings-catalog";
import { t, type MessageKey } from "../i18n";

export type PermissionModuleGroupLike = {
  moduleId: string;
  moduleKey: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  tree: PermissionTreeNode;
};

export function formatGroupNavLabel(label: string): string {
  if (label.endsWith("设置") && label.length > 2) return label.slice(0, -2);
  return label;
}

export function findL2Node(
  groups: PermissionModuleGroupLike[],
  l2Key: string,
): PermissionTreeNode | undefined {
  for (const g of groups) {
    for (const c of g.tree.children) {
      if (c.resource.key === l2Key) return c;
    }
  }
  return undefined;
}

export function findL3Node(
  groups: PermissionModuleGroupLike[],
  l3Key: string,
): PermissionTreeNode | undefined {
  for (const g of groups) {
    for (const l2 of g.tree.children) {
      for (const l3 of l2.children) {
        if (l3.resource.key === l3Key) return l3;
      }
    }
  }
  return undefined;
}

/** 三级分组列：按 catalog.groupNavSections 分段，并展示每组 L4 数量 */
export function renderL3Column(
  l2Node: PermissionTreeNode | undefined,
  activeL3: string,
  renderItem: (node: PermissionTreeNode, nested: boolean) => string,
): string {
  if (!l2Node?.children.length) return "";

  const l3Nodes = l2Node.children;
  const catalog = l2Node.resource.path ? getModuleSettingsCatalog(l2Node.resource.path) : undefined;

  if (!catalog?.groupNavSections?.length) {
    return l3Nodes.map((n) => renderItem(n, false)).join("");
  }

  const byGroupKey = new Map<string, PermissionTreeNode>();
  for (const node of l3Nodes) {
    if (node.resource.groupKey) byGroupKey.set(node.resource.groupKey, node);
  }

  const rendered = new Set<string>();
  const parts: string[] = [];

  for (let i = 0; i < catalog.groupNavSections.length; i++) {
    const section = catalog.groupNavSections[i]!;
    if (i > 0) {
      parts.push('<div class="my-2 border-t border-border" role="presentation"></div>');
    }
    parts.push(
      `<p class="px-2 ${i > 0 ? "pt-1" : "pt-0.5"} pb-1 text-sm font-semibold tracking-tight text-foreground">${escapeHtml(t(section.labelKey as MessageKey))}</p>`,
    );
    for (const groupKey of section.groupKeys) {
      const node = byGroupKey.get(groupKey);
      if (!node || rendered.has(groupKey)) continue;
      rendered.add(groupKey);
      parts.push(renderItem(node, true));
    }
  }

  for (const node of l3Nodes) {
    const groupKey = node.resource.groupKey;
    if (groupKey && rendered.has(groupKey)) continue;
    parts.push(renderItem(node, false));
  }

  return parts.join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function pickNodeTitle(title: string, titleEn?: string): string {
  return title || titleEn || "";
}
