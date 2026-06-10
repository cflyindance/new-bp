/**
 * 财务中心 · 设置二级导航（方案 A：日常班结 2 组 + 核算口径 1 组）
 * 供 apply-finance-settings-mapping.mjs、build-module-settings-catalog.mjs、settings-intra-group-sort 共用
 */

/** 侧栏顺序：日结流程 → 钱箱平账 → 收单成本口径 */
export const FINANCE_SETTINGS_GROUP_ORDER = [
  "daily-cash-close",
  "drawer-float-reconcile",
  "processor-cost-basis",
];

export const FINANCE_SETTINGS_GROUP_TITLES = {
  "daily-cash-close": "现金日结与班结",
  "drawer-float-reconcile": "钱箱备款与平账",
  "processor-cost-basis": "收单成本与报表口径",
};

/** 财务设置侧栏分段（labelKey 由 i18n 解析） */
export const FINANCE_SETTINGS_GROUP_NAV_SECTIONS = [
  {
    labelKey: "moduleSettings.financeNav.operations",
    groupKeys: ["daily-cash-close", "drawer-float-reconcile"],
  },
  {
    labelKey: "moduleSettings.financeNav.accounting",
    groupKeys: ["processor-cost-basis"],
  },
];

/** @type {Record<string, number[]>} */
export const FINANCE_SETTINGS_ASSIGN_MAP = {
  "daily-cash-close": [171, 65, 330],
  "drawer-float-reconcile": [63, 76, 181],
  "processor-cost-basis": [307],
};

/** @returns {Map<number, { groupTitle: string, groupKey: string }>} */
export function buildFinanceAssignMap() {
  const financeAssign = new Map();
  for (const [key, seqs] of Object.entries(FINANCE_SETTINGS_ASSIGN_MAP)) {
    for (const seq of seqs) {
      financeAssign.set(seq, {
        groupTitle: FINANCE_SETTINGS_GROUP_TITLES[key],
        groupKey: key,
      });
    }
  }
  return financeAssign;
}
