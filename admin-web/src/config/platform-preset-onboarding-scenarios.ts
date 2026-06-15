/**
 * 首次登录引导 · 功能确认页一级模块业务场景分组
 * 对齐《一级导航定义说明》中的经营主线与运营域划分
 */
import type { ProductLineId } from "./platform-preset-catalog";
import { buildPlatformPresetModuleGroups } from "./platform-preset-tree";
import { getEffectivePresetSnapshot } from "./platform-preset-store";

export interface OnboardingModuleScenarioGroup {
  id: string;
  label: string;
  /** 分组说明（引导页展示） */
  hint: string;
  moduleIds: readonly string[];
}

/** 一级模块 · 业务场景分组（顺序即展示顺序） */
export const ONBOARDING_MODULE_SCENARIO_GROUPS: readonly OnboardingModuleScenarioGroup[] = [
  {
    id: "overview",
    label: "经营概览",
    hint: "登录后的工作台与关键指标",
    moduleIds: ["dashboard"],
  },
  {
    id: "chain",
    label: "连锁与组织",
    hint: "品牌、门店与组织主数据",
    moduleIds: ["brand-mgmt", "store-mgmt"],
  },
  {
    id: "catalog-transaction",
    label: "商品与交易",
    hint: "菜单商品、订单处理与支付结算",
    moduleIds: ["product-center-main", "orders", "transactions"],
  },
  {
    id: "foh-boh",
    label: "前厅与后厨",
    hint: "堂食前场、厨房履约与到店客流",
    moduleIds: ["queue-call", "kitchen-kds", "waitlist", "reservations"],
  },
  {
    id: "guest-marketing",
    label: "顾客与营销",
    hint: "会员、促销、礼品卡与口碑运营",
    moduleIds: ["marketing", "promotions", "members", "gift-cards", "reviews"],
  },
  {
    id: "team",
    label: "团队与人力",
    hint: "员工、排班、小费与工时",
    moduleIds: ["team"],
  },
  {
    id: "finance-report",
    label: "报表与财务",
    hint: "经营分析与资金账务",
    moduleIds: ["reports-finance", "finance-center"],
  },
  {
    id: "supply-device",
    label: "库存与设备",
    hint: "供应链、打印模板与终端硬件",
    moduleIds: ["inventory-ordering", "print-templates", "device-management"],
  },
  {
    id: "platform",
    label: "平台与系统",
    hint: "消息通知、系统设置与平台能力",
    moduleIds: ["notifications", "settings", "asset-center", "capital-turnover", "log-management"],
  },
] as const;

export interface OnboardingConfirmationModule {
  moduleId: string;
  title: string;
}

export interface OnboardingConfirmationSection {
  group: OnboardingModuleScenarioGroup;
  modules: OnboardingConfirmationModule[];
}

const GROUP_BY_MODULE_ID = new Map<string, OnboardingModuleScenarioGroup>(
  ONBOARDING_MODULE_SCENARIO_GROUPS.flatMap((group) =>
    group.moduleIds.map((moduleId) => [moduleId, group] as const),
  ),
);

const FALLBACK_GROUP: OnboardingModuleScenarioGroup = {
  id: "other",
  label: "其他能力",
  hint: "补充功能模块",
  moduleIds: [],
};

/** 按业务场景分组的一级模块（仅含当前预设已启用项） */
export function getOnboardingConfirmationSections(
  businessTypeId: string,
  productLineId: ProductLineId,
): OnboardingConfirmationSection[] {
  const snap = getEffectivePresetSnapshot(businessTypeId, productLineId);
  const enabled = buildPlatformPresetModuleGroups(productLineId).filter(
    (g) => snap.selection[g.moduleKey]?.enabled,
  );

  const sectionMap = new Map<string, OnboardingConfirmationSection>();
  const ensureSection = (group: OnboardingModuleScenarioGroup): OnboardingConfirmationSection => {
    let section = sectionMap.get(group.id);
    if (!section) {
      section = { group, modules: [] };
      sectionMap.set(group.id, section);
    }
    return section;
  };

  for (const mod of enabled) {
    const group = GROUP_BY_MODULE_ID.get(mod.moduleId) ?? FALLBACK_GROUP;
    ensureSection(group).modules.push({
      moduleId: mod.moduleId,
      title: mod.moduleTitle,
    });
  }

  const ordered: OnboardingConfirmationSection[] = [];
  for (const group of ONBOARDING_MODULE_SCENARIO_GROUPS) {
    const section = sectionMap.get(group.id);
    if (section?.modules.length) ordered.push(section);
  }
  const other = sectionMap.get(FALLBACK_GROUP.id);
  if (other?.modules.length) ordered.push(other);

  return ordered;
}

export function countOnboardingConfirmationModules(sections: OnboardingConfirmationSection[]): number {
  return sections.reduce((sum, s) => sum + s.modules.length, 0);
}
