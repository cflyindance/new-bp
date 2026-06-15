/**

 * 平台预设 · 经营业态目录（产线复用 FOH_LINE_NAV_ORDER）

 */

import { FOH_LINE_NAV_ORDER, type FohLineNavId } from "./foh-settings-line-scope";

import {

  getBusinessModuleTiers,

  getEffectivePresetModuleTier,

  FULL_SELECTION_BUSINESS_TYPE_ID,

  type PresetModuleTier,

} from "./platform-preset-recommendations";



export type ProductLineId = FohLineNavId;



export const PLATFORM_PRESET_PRODUCT_LINES = FOH_LINE_NAV_ORDER;



/** 所有业态 × 产线预设默认始终启用的一级模块（不可通过业态推荐等级关闭） */

export const PLATFORM_PRESET_ALWAYS_ENABLED_L1_MODULE_IDS = ["settings"] as const;



/** 默认勾选该业态下全部预设节点（所有产线） */

export const PLATFORM_PRESET_FULL_SELECTION_BUSINESS_TYPE_IDS = [FULL_SELECTION_BUSINESS_TYPE_ID] as const;



export type BusinessTypeCategory = "service-mode" | "category" | "custom";



export type BusinessTypeTier = PresetModuleTier;



export interface BusinessTypeDefinition {

  id: string;

  label: string;

  category: BusinessTypeCategory;

  /** @deprecated 画像见 platform-preset-recommendations.ts */

  moduleTiers?: Partial<Record<string, BusinessTypeTier>>;

}



const SERVICE_MODE_TYPES: BusinessTypeDefinition[] = [

  { id: "fast-food", label: "快餐", category: "service-mode" },

  { id: "casual-dining", label: "休闲餐饮", category: "service-mode" },

  { id: "delivery-only", label: "外卖专营", category: "service-mode" },

  { id: "full-service", label: "全功能/不确定", category: "service-mode" },

];



const CATEGORY_TYPES: BusinessTypeDefinition[] = [

  { id: "tea-drinks", label: "茶饮", category: "category" },

  { id: "coffee", label: "咖啡", category: "category" },

  { id: "bakery", label: "烘焙", category: "category" },

  { id: "hotpot", label: "火锅", category: "category" },

  { id: "bbq", label: "烧烤", category: "category" },

  { id: "buffet", label: "自助餐", category: "category" },

  { id: "bar", label: "酒吧", category: "category" },

  { id: "chinese", label: "中餐", category: "category" },

  { id: "western", label: "西餐", category: "category" },

  { id: "japanese-korean", label: "日韩料理", category: "category" },

  { id: "full-meal", label: "正餐", category: "category" },

];



export const PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES: BusinessTypeDefinition[] = [

  ...SERVICE_MODE_TYPES,

  ...CATEGORY_TYPES,

];



export function presetComboKey(businessTypeId: string, productLineId: ProductLineId): string {

  return `${businessTypeId}:${productLineId}`;

}



export function productLineLabel(lineId: ProductLineId): string {

  return PLATFORM_PRESET_PRODUCT_LINES.find((l) => l.id === lineId)?.label ?? lineId;

}



export function businessTypeLabel(id: string, customLabel?: string): string {

  if (customLabel) return customLabel;

  return PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.find((b) => b.id === id)?.label ?? id;

}



/** 业态画像（不含产线） */

export function getBusinessTypeModuleTier(

  businessTypeId: string,

  moduleId: string,

  customTiers?: Partial<Record<string, BusinessTypeTier>>,

): BusinessTypeTier | undefined {

  return getBusinessModuleTiers(businessTypeId, customTiers)[moduleId];

}



/** 业态 × 产线合并后的编辑页标签等级 */

export function getPresetEditModuleTier(

  businessTypeId: string,

  productLineId: ProductLineId,

  moduleId: string,

  customTiers?: Partial<Record<string, BusinessTypeTier>>,

): BusinessTypeTier | undefined {

  return getEffectivePresetModuleTier(moduleId, businessTypeId, productLineId, customTiers);

}



export function tierBadgeLabel(tier: BusinessTypeTier | undefined): string {

  if (tier === "core") return "核心";

  if (tier === "recommended") return "推荐";

  if (tier === "optional") return "可选";

  if (tier === "excluded") return "不适用";

  return "";

}



export function tierBadgeClass(tier: BusinessTypeTier | undefined): string {

  if (tier === "core") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";

  if (tier === "recommended") return "bg-sky-500/15 text-sky-800 dark:text-sky-200";

  if (tier === "optional") return "bg-muted text-muted-foreground";

  if (tier === "excluded") return "bg-rose-500/10 text-rose-700 dark:text-rose-300";

  return "hidden";

}


