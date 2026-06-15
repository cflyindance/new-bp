/**
 * 校验：全产线组合下关键 L2 子入口应可见；emenu+kiosk 并存时 eMenu Pro 不被误伤
 * 用法：node scripts/verify-l2-visibility.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const navText = fs.readFileSync(path.resolve(__dirname, "../src/config/navigation.ts"), "utf8");

const l2Ids = [
  ...navText.matchAll(/^      \{ id: "([^"]+)"/gm),
  ...navText.matchAll(/^        id: "([^"]+)"/gm),
].map((m) => m[1]);

const CRITICAL = [
  "qc-emenu-pro",
  "team-roles",
  "team-tips",
  "team-tax-payroll",
  "mkt-screensaver",
  "mkt-ads",
  "mkt-poster-pro",
];

const L2_META = {
  "qc-emenu-pro": { productLines: ["emenu"] },
  "team-roles": { productLines: [] },
  "team-tips": { productLines: [] },
  "team-tax-payroll": { productLines: [] },
  "mkt-screensaver": { productLines: [] },
  "mkt-ads": { productLines: [] },
  "mkt-poster-pro": { productLines: [] },
};

const TEMPLATE_L2 = {
  "emenu-only": ["qc-floor-plan", "kds-display", "kds-workflow", "fin-register-audit"],
  "sdi-only": ["qc-floor-plan", "kds-display", "kds-workflow", "fin-register-audit", "qc-emenu-pro"],
  "kiosk-only": ["qc-floor-plan", "qc-emenu-pro", "fin-register-audit"],
};

const L2_OVERRIDE = {
  "qc-floor-plan": { productLines: ["pos", "paypad"] },
  "kds-display": { productLines: ["kds", "pos"] },
  "kds-workflow": { productLines: ["kds", "pos"] },
  "fin-register-audit": { productLines: ["pos"] },
  "qc-emenu-pro": { productLines: ["emenu"] },
};

function collectL2Excludes(input) {
  const out = new Set();
  const tenantLines = new Set(input.productLines);
  for (const presetId of input.productLinePresetIds) {
    for (const id of TEMPLATE_L2[presetId] ?? []) {
      const meta = L2_OVERRIDE[id];
      if (!meta || meta.productLines.length === 0) {
        out.add(id);
        continue;
      }
      if (!meta.productLines.some((line) => tenantLines.has(line))) out.add(id);
    }
  }
  return out;
}

function l2Visible(featureId, input) {
  if (collectL2Excludes(input).has(featureId)) return false;
  const meta = L2_META[featureId] ?? { productLines: [] };
  const lines = new Set(input.productLines);
  if (meta.productLines.length > 0 && lines.size > 0) {
    return meta.productLines.some((l) => lines.has(l));
  }
  return true;
}

const allProductLines = ["emenu", "sdi", "kiosk", "pos", "pos-go", "paypad", "online-order", "kds"];
const allPresetIds = [
  "emenu-only",
  "sdi-only",
  "kiosk-only",
  "pos-suite",
  "pos-go-only",
  "online-order",
  "kds",
  "paypad",
];

let failed = false;
for (const id of CRITICAL) {
  if (!l2Ids.includes(id)) {
    console.error(`[verify-l2-visibility] Missing NAV L2: ${id}`);
    failed = true;
    continue;
  }
  const fullInput = { productLinePresetIds: allPresetIds, productLines: allProductLines };
  if (!l2Visible(id, fullInput)) {
    console.error(`[verify-l2-visibility] Critical L2 hidden under full profile: ${id}`);
    failed = true;
  }
}

const emenuKiosk = {
  productLinePresetIds: ["emenu-only", "kiosk-only"],
  productLines: ["emenu", "kiosk"],
};
if (!l2Visible("qc-emenu-pro", emenuKiosk)) {
  console.error("[verify-l2-visibility] qc-emenu-pro must stay visible when emenu+kiosk combined");
  failed = true;
}

if (failed) process.exit(1);
console.log(`[verify-l2-visibility] OK — NAV L2=${l2Ids.length}, critical=${CRITICAL.length}`);
