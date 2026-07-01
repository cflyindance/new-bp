/**
 * 四级权限树 · 四列导航共用逻辑（平台预设配置页、RBAC 角色矩阵）
 */
import type { PermissionTreeNode } from "./permission-registry";
import {
  formatModuleSettingsSubnavLabel,
  renderCatalogSectionedL3Column,
} from "./module-settings-subnav";

export type PermissionModuleGroupLike = {
  moduleId: string;
  moduleKey: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  customL1MountKind?: "page" | "features";
  tree: PermissionTreeNode;
};

export function formatGroupNavLabel(label: string): string {
  return formatModuleSettingsSubnavLabel(label);
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

/** 三级分组列：按 catalog.groupNavSections 分段（与 B 端设置侧栏一致） */
export function renderL3Column(
  l2Node: PermissionTreeNode | undefined,
  activeL3: string,
  renderItem: (node: PermissionTreeNode, nested: boolean) => string,
): string {
  return renderCatalogSectionedL3Column(l2Node, { activeKey: activeL3, renderItem });
}

export function pickNodeTitle(title: string, titleEn?: string): string {
  return title || titleEn || "";
}
