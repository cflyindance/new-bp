import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bindTipOutRulesFullscreenFlow,
  resolveTipOutRulesFullscreenTransition,
} from "../src/config/tipout-rules-fullscreen";

const cases = [
  ["https://example.test/TipOut/rules.html?embedded=1", "enter"],
  ["https://example.test/TipOut/rule-add.html?poolKind=tip#editor", "enter"],
  ["https://example.test/TipOut/index.html?qa=return#summary", "exit"],
  ["https://example.test/TipOut/detail.html?date=2026-01-01", "preserve"],
] as const;

for (const [url, expected] of cases) {
  assert.equal(resolveTipOutRulesFullscreenTransition(url), expected, url);
}

const classes = new Set<string>();
const attributes = new Set<string>();
let listenerCount = 0;
const frame = {
  dataset: {} as Record<string, string>,
  src: "https://example.test/TipOut/rules.html",
  contentWindow: { location: { href: "https://example.test/TipOut/rules.html" } },
  classList: {
    toggle: (name: string, on: boolean) => on ? classes.add(name) : classes.delete(name),
  },
  toggleAttribute: (name: string, on: boolean) => on ? attributes.add(name) : attributes.delete(name),
  addEventListener: (type: string) => { if (type === "load") listenerCount += 1; },
} as unknown as HTMLIFrameElement;
const root = { querySelectorAll: () => [frame] } as unknown as ParentNode;

bindTipOutRulesFullscreenFlow(root);
bindTipOutRulesFullscreenFlow(root);
assert.equal(listenerCount, 1);
assert.equal(classes.has("tipout-rules-flow-fullscreen"), true);
assert.equal(attributes.has("data-tipout-rules-flow-fullscreen"), true);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const mainSource = fs.readFileSync(path.join(rootDir, "src/main.ts"), "utf8");
const appCss = fs.readFileSync(path.join(rootDir, "src/styles/app.css"), "utf8");
const rulesHtml = fs.readFileSync(path.join(rootDir, "dist/TipOut/rules.html"), "utf8");

assert.match(mainSource, /import \{ bindTipOutRulesFullscreenFlow \} from "\.\/config\/tipout-rules-fullscreen"/);
assert.equal((mainSource.match(/data-tipout-rules-frame/g) ?? []).length, 2);
assert.match(mainSource, /bindTipOutRulesFullscreenFlow\(app\)/);
assert.match(
  appCss,
  /iframe\.marketing-screensaver-flow-fullscreen,\s*iframe\.tipout-rules-flow-fullscreen\s*\{/,
);
assert.match(rulesHtml, /href="index\.html"[^>]*>返回小费分配汇总<\/a>/);

console.log("TipOut rules fullscreen flow verification passed.");
