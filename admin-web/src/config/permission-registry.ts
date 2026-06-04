/**
 * B 端 RBAC 权限资源注册表（由 navigation.ts 派生，SSOT 与侧栏一致）
 */
import { NAV_MODULES, PRODUCT_CENTER_DEEP_NAV, type NavModule } from "./navigation";

/** 对某导航/功能的访问级别 */
export type PermissionAccess = "hidden" | "view" | "operate";

export interface PermissionResource {
  /** 全局唯一键，持久化在角色 grants 中 */
  key: string;
  moduleId: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  /** 二级：滑层/Tab 子入口 */
  featureId: string;
  featureTitle: string;
  featureTitleEn?: string;
  path: string;
  /** 三级：页面内能力（可选；无则继承二级） */
  actionId?: string;
  actionTitle?: string;
  level: 2 | 3;
  chainOnly?: boolean;
}

export interface PermissionModuleGroup {
  moduleId: string;
  moduleTitle: string;
  moduleTitleEn?: string;
  resources: PermissionResource[];
}

const RBAC_EXCLUDED_MODULE_IDS = new Set(["permission-mgmt"]);

/** 页面内标准操作（可按模块在 UI 中隐藏部分列） */
export const PERMISSION_ACTION_PRESETS = [
  { id: "page", title: "进入页面", titleEn: "Page access" },
  { id: "create", title: "新建", titleEn: "Create" },
  { id: "edit", title: "编辑", titleEn: "Edit" },
  { id: "delete", title: "删除", titleEn: "Delete" },
  { id: "export", title: "导出", titleEn: "Export" },
  { id: "approve", title: "审核", titleEn: "Approve" },
] as const;

function resourceKey(moduleId: string, featureId: string, actionId?: string): string {
  return actionId ? `${moduleId}:${featureId}:${actionId}` : `${moduleId}:${featureId}`;
}

function pushLevel2(
  groups: PermissionModuleGroup[],
  mod: NavModule,
  item: { id: string; title: string; titleEn?: string; path: string; chainOnly?: boolean },
): void {
  const g = groups.find((x) => x.moduleId === mod.id)!;
  g.resources.push({
    key: resourceKey(mod.id, item.id),
    moduleId: mod.id,
    moduleTitle: mod.title,
    moduleTitleEn: mod.titleEn,
    featureId: item.id,
    featureTitle: item.title,
    featureTitleEn: item.titleEn,
    path: item.path,
    level: 2,
    chainOnly: item.chainOnly,
  });
}

/** 从 NAV_MODULES 构建可授权资源树（不含权限管理中心自身） */
export function buildPermissionModuleGroups(): PermissionModuleGroup[] {
  const groups: PermissionModuleGroup[] = [];

  for (const mod of NAV_MODULES) {
    if (RBAC_EXCLUDED_MODULE_IDS.has(mod.id)) continue;

    groups.push({
      moduleId: mod.id,
      moduleTitle: mod.title,
      moduleTitleEn: mod.titleEn,
      resources: [],
    });

    for (const child of mod.children) {
      pushLevel2(groups, mod, child);
    }

    if (mod.id === "product-center-main") {
      for (const deep of PRODUCT_CENTER_DEEP_NAV) {
        const g = groups.find((x) => x.moduleId === mod.id)!;
        if (g.resources.some((r) => r.featureId === deep.id)) continue;
        g.resources.push({
          key: resourceKey(mod.id, deep.id),
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleTitleEn: mod.titleEn,
          featureId: deep.id,
          featureTitle: deep.title,
          featureTitleEn: deep.titleEn,
          path: deep.path,
          level: 3,
        });
      }
    }
  }

  return groups;
}

export function flattenPermissionResources(groups = buildPermissionModuleGroups()): PermissionResource[] {
  return groups.flatMap((g) => g.resources);
}

export function parsePermissionAccess(value: string | undefined): PermissionAccess {
  if (value === "view" || value === "operate") return value;
  return "hidden";
}

/** 操作级别不得高于页面级别 */
export function capGrant(page: PermissionAccess, action: PermissionAccess): PermissionAccess {
  if (page === "hidden") return "hidden";
  if (page === "view") return action === "operate" ? "view" : action;
  return action;
}
