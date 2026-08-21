import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const source = await readFile(htmlPath, "utf8");
const actions = source.match(/function ruleActionsHtml\(rule\)[\s\S]*?(?=\n\s*function ruleTextCell)/)?.[0] ?? "";

assert.match(actions, /isDraft[\s\S]*?<button class='btn' data-rule-action='edit'[\s\S]*?>编辑<\/button>/, "草稿编辑入口应与启用状态使用相同文案和样式");
assert.doesNotMatch(actions, /btn btn-primary' data-rule-action='edit'|>继续编辑<\/button>/, "草稿编辑入口不应再使用“继续编辑”或主按钮样式");

console.log("Menu order limit draft edit action verification passed");
