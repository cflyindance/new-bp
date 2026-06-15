/**
 * 经营业态分类元数据 — 引导 Step 1 / 平台预设页共用排序与分组
 * 方案：docs/项目文档/业态产线-功能预设与首次引导方案.md §2.5 v1.8
 */
import type { BusinessTypePreset } from "./feature-presets";

export type BusinessTypeTaxonomyGroup = "service-mode" | "cuisine";
export type BusinessTypeDisplayGroupKey = BusinessTypeTaxonomyGroup | "custom";

export interface BusinessTypeTaxonomy {
  group: BusinessTypeTaxonomyGroup;
  /** 组内展示顺序（升序） */
  sortOrder: number;
}

const TAXONOMY_GROUP_RANK: Record<BusinessTypeDisplayGroupKey, number> = {
  "service-mode": 1,
  cuisine: 2,
  custom: 3,
};

export const ONBOARDING_TAXONOMY_GROUP_LABELS: Record<
  BusinessTypeDisplayGroupKey,
  { title: string; titleEn: string }
> = {
  "service-mode": { title: "按服务方式", titleEn: "By service style" },
  cuisine: { title: "按品类", titleEn: "By cuisine" },
  custom: { title: "其他业态", titleEn: "Other" },
};

export interface OnboardingBusinessTypeGroups {
  serviceMode: BusinessTypePreset[];
  cuisine: BusinessTypePreset[];
  custom: BusinessTypePreset[];
}

export interface BusinessTypeDisplayGroup {
  group: BusinessTypeDisplayGroupKey;
  presets: BusinessTypePreset[];
}

function getDisplayGroupKey(preset: BusinessTypePreset): BusinessTypeDisplayGroupKey {
  const group = preset.taxonomy?.group;
  if (group === "service-mode" || group === "cuisine") return group;
  return "custom";
}

function sortWithinBuiltinGroup(a: BusinessTypePreset, b: BusinessTypePreset): number {
  const ao = a.taxonomy?.sortOrder ?? 999;
  const bo = b.taxonomy?.sortOrder ?? 999;
  if (ao !== bo) return ao - bo;
  return a.title.localeCompare(b.title, "zh");
}

/** 平台预设页 / 引导页共用：分组 → sortOrder → 中文名 */
export function compareBusinessTypesForDisplay(a: BusinessTypePreset, b: BusinessTypePreset): number {
  const ga = TAXONOMY_GROUP_RANK[getDisplayGroupKey(a)];
  const gb = TAXONOMY_GROUP_RANK[getDisplayGroupKey(b)];
  if (ga !== gb) return ga - gb;
  return sortWithinBuiltinGroup(a, b);
}

/** 扁平排序列表（服务方式 → 品类 → 自定义） */
export function sortBusinessTypesForDisplay(presets: BusinessTypePreset[]): BusinessTypePreset[] {
  return [...presets].sort(compareBusinessTypesForDisplay);
}

/** 将有效业态列表拆为引导 Step 1 / 平台预设左侧树三组 */
export function groupBusinessTypesForOnboarding(presets: BusinessTypePreset[]): OnboardingBusinessTypeGroups {
  const serviceMode: BusinessTypePreset[] = [];
  const cuisine: BusinessTypePreset[] = [];
  const custom: BusinessTypePreset[] = [];

  for (const preset of presets) {
    const group = preset.taxonomy?.group;
    if (group === "service-mode") serviceMode.push(preset);
    else if (group === "cuisine") cuisine.push(preset);
    else custom.push(preset);
  }

  serviceMode.sort(sortWithinBuiltinGroup);
  cuisine.sort(sortWithinBuiltinGroup);
  custom.sort((a, b) => a.title.localeCompare(b.title, "zh"));

  return { serviceMode, cuisine, custom };
}

/** 带分组标题的展示结构（空组省略） */
export function listBusinessTypeDisplayGroups(presets: BusinessTypePreset[]): BusinessTypeDisplayGroup[] {
  const { serviceMode, cuisine, custom } = groupBusinessTypesForOnboarding(presets);
  const groups: BusinessTypeDisplayGroup[] = [];
  if (serviceMode.length > 0) groups.push({ group: "service-mode", presets: serviceMode });
  if (cuisine.length > 0) groups.push({ group: "cuisine", presets: cuisine });
  if (custom.length > 0) groups.push({ group: "custom", presets: custom });
  return groups;
}
