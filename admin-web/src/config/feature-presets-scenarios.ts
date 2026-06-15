/**
 * 引导场景包 — 一键绑定「业态 + 产线预设」，运行时自动解析业态×产线变体
 */
import type { BusinessTypeTag } from "./feature-registry";

export interface OnboardingScenarioBundle {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  primaryBusinessType: BusinessTypeTag;
  productLinePresetIds: string[];
}

export const ONBOARDING_SCENARIO_BUNDLES: OnboardingScenarioBundle[] = [
  {
    id: "scenario-hotpot-emenu",
    title: "火锅自助餐 · 电子菜单",
    titleEn: "Hot pot buffet · eMenu",
    description: "跳过选桌、保留火锅锅底设置；适用 eMenu / SDI",
    descriptionEn: "Skip table pick; hot pot base settings on",
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
  },
  {
    id: "scenario-fullservice-emenu",
    title: "正餐 · 电子菜单",
    titleEn: "Full service · eMenu",
    description: "保留选桌开台；隐藏火锅专属设置",
    descriptionEn: "Table selection on; hot pot settings hidden",
    primaryBusinessType: "full-service",
    productLinePresetIds: ["emenu-only"],
  },
  {
    id: "scenario-hotpot-kiosk",
    title: "火锅 · 自助点餐机",
    titleEn: "Hot pot · Kiosk",
    description: "Kiosk 自助 + 火锅点餐流程预设",
    descriptionEn: "Self-order kiosk with hot pot flow",
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["kiosk-only"],
  },
  {
    id: "scenario-tea-emenu",
    title: "茶饮 · 电子菜单",
    titleEn: "Tea & beverages · eMenu",
    description: "轻量前厅流程，无桌台/火锅设置",
    descriptionEn: "Light FOH flow without table/hot pot",
    primaryBusinessType: "tea-drink",
    productLinePresetIds: ["emenu-only"],
  },
  {
    id: "scenario-fastfood-kiosk",
    title: "快餐 · 自助点餐机",
    titleEn: "Quick service · Kiosk",
    description: "Kiosk 自助点餐，跳过选桌与人数页",
    descriptionEn: "Self-order kiosk; skip table and party size",
    primaryBusinessType: "fast-food",
    productLinePresetIds: ["kiosk-only"],
  },
  {
    id: "scenario-fastfood-pos",
    title: "快餐 · 门店收银",
    titleEn: "Quick service · in-store POS",
    description: "POS + KDS 全套收银后厨",
    descriptionEn: "POS suite with kitchen display",
    primaryBusinessType: "fast-food",
    productLinePresetIds: ["pos-suite", "kds"],
  },
  {
    id: "scenario-online",
    title: "外卖 / 网订为主",
    titleEn: "Delivery & online first",
    description: "以外卖来取、网单为核心",
    descriptionEn: "Online ordering centric",
    primaryBusinessType: "fast-food",
    productLinePresetIds: ["online-order"],
  },
];

export function getOnboardingScenarioBundle(id: string): OnboardingScenarioBundle | undefined {
  return ONBOARDING_SCENARIO_BUNDLES.find((s) => s.id === id);
}
