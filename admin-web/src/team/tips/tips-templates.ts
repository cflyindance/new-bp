import distribution from "./templates/distribution.html?raw";
import details from "./templates/details.html?raw";
import rules from "./templates/rules.html?raw";
import ruleEditor from "./templates/rule-editor.html?raw";

export type TipsView = "distribution" | "details" | "rules" | "rule-editor";

const templates: Record<TipsView, string> = { distribution, details, rules, "rule-editor": ruleEditor };

export function renderTipsTemplate(view: TipsView): string {
  return templates[view];
}
