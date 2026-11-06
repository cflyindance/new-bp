import { renderStandalonePageHeader, type StandalonePageHeaderOptions } from "../../ui/standalone-page-header";
import distribution from "./templates/distribution.html?raw";
import details from "./templates/details.html?raw";
import rules from "./templates/rules.html?raw";
import ruleEditor from "./templates/rule-editor.html?raw";
import employeeReconciliation from "./templates/employee-reconciliation.html?raw";

export type TipsView = "distribution" | "details" | "rules" | "rule-editor" | "employee-reconciliation";

const templates: Record<TipsView, string> = { distribution, details, rules, "rule-editor": ruleEditor, "employee-reconciliation": employeeReconciliation };

export function renderTipsTemplate(view: TipsView): string {
  const header = standaloneHeaders[view];
  return header ? templates[view].replace("<!--TIPOUT_STANDALONE_HEADER-->", renderStandalonePageHeader(header)) : templates[view];
}

const standaloneHeaders: Partial<Record<TipsView, StandalonePageHeaderOptions>> = {
  "rule-editor": {
    "titleHtml": "<span id=\"pageTitle\">小费分配规则</span>",
    "backHtml": "<a class=\"btn\" data-native-onclick=\"window.location.href='rules.html'\" href=\"#\">返回规则列表</a>",
    "actionsHtml": "<div class=\"tipout-rule-heading-actions\" id=\"ruleEditorActions\">\n            <button type=\"button\" class=\"btn\" data-native-onclick=\"cancelRule()\">取消</button>\n            <button type=\"button\" class=\"btn btn-primary\" data-native-onclick=\"submitRule()\">保存规则</button>\n          </div>\n        ",
    "className": "tipout-figma-header"
  },
  "details": {
    "titleHtml": "小费分配明细",
    "subtitleHtml": "<span class=\"tipout-detail-store-subtitle\"><img src=\"/tipout/dashboard/store.svg\" alt=\"\"><span id=\"detailStoreName\" aria-label=\"当前门店\">—</span></span><input id=\"storeSelect\" type=\"hidden\">",
    "backHtml": "<button type=\"button\" class=\"btn\" data-native-onclick=\"returnToSummary()\">返回汇总</button>",
    "actionsHtml": "<div class=\"tipout-sticky-actions\" id=\"detailActionBar\">\n          <span id=\"detailAllocationScopeHint\"></span>\n          <div>\n            <button id=\"confirmDetailPayoutBtn\" class=\"btn\" hidden data-native-onclick=\"openDetailPayoutModal(event)\">确认已发放</button>\n            <button id=\"confirmDetailAllocationBtn\" class=\"btn btn-primary\" data-native-onclick=\"confirmDetailAllocation()\">确认分配</button>\n            <button id=\"saveCurrentDetailAllocationBtn\" class=\"btn btn-primary\" aria-disabled=\"true\" style=\"opacity:.45\" data-native-onclick=\"saveCurrentDetailAllocation()\">保存当前分配</button>\n          </div>\n        </div>",
    "className": "tipout-figma-header"
  },
  "employee-reconciliation": {
    "titleHtml": "<span id=\"employeeDetailName\">—</span><span id=\"employeeDetailRole\" class=\"tipout-role-tag\">未设置角色</span>",
    "backHtml": "<button type=\"button\" class=\"btn\" data-native-onclick=\"returnToEmployeeReconciliation()\">← 返回员工分配汇总</button>",
    "actionsHtml": "<div class=\"tipout-detail-export export-dropdown\">\n          <button id=\"employeeDetailExportButton\" type=\"button\" class=\"btn\" aria-haspopup=\"menu\" aria-expanded=\"false\" data-native-onclick=\"toggleEmployeeDetailExportMenu(event)\">导出结果⌄</button>\n          <div id=\"employeeDetailExportMenu\" class=\"export-menu\" role=\"menu\">\n            <button type=\"button\" class=\"export-menu-item\" role=\"menuitem\" data-native-onclick=\"runEmployeeDetailExport('pdf')\">导出 PDF</button>\n            <button type=\"button\" class=\"export-menu-item\" role=\"menuitem\" data-native-onclick=\"runEmployeeDetailExport('csv')\">导出 CSV</button>\n            <button type=\"button\" class=\"export-menu-item\" role=\"menuitem\" data-native-onclick=\"openEmployeeDetailEmailModal()\">发送至邮箱</button>\n          </div>\n        </div>\n      ",
    "className": "tipout-figma-header"
  }
};
