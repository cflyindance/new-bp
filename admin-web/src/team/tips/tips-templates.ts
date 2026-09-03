import distribution from "./templates/distribution.html?raw";
import details from "./templates/details.html?raw";
import rules from "./templates/rules.html?raw";
import ruleEditor from "./templates/rule-editor.html?raw";
import employeeReconciliation from "./templates/employee-reconciliation.html?raw";

export type TipsView = "distribution" | "details" | "rules" | "rule-editor" | "employee-reconciliation";

const templates: Record<TipsView, string> = { distribution, details, rules, "rule-editor": ruleEditor, "employee-reconciliation": employeeReconciliation };

export function renderTipsTemplate(view: TipsView): string {
  return templates[view];
}
