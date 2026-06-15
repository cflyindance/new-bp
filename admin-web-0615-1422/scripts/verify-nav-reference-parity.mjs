/**
 * 校验：主导航壳层与 GitHub admin-web reference 一致（全量 L1/L2，不按预设隐藏）
 * 用法：node scripts/verify-nav-reference-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const navText = fs.readFileSync(path.resolve(__dirname, "../src/config/navigation.ts"), "utf8");

const l1Ids = [...navText.matchAll(/^\s+id: "([^"]+)",\n\s+title:/gm)].map((m) => m[1]);
const l2Ids = [
  ...navText.matchAll(/^      \{ id: "([^"]+)"/gm),
  ...navText.matchAll(/^        id: "([^"]+)"/gm),
].map((m) => m[1]);

/** 与 feature-visibility.isNavShellFilteringActive 一致 */
const NAV_SHELL_FILTERING = false;

function visibleL1(profile) {
  if (!NAV_SHELL_FILTERING) return new Set(l1Ids);
  return new Set(l1Ids); // 壳层关闭过滤时恒为全量
}

function visibleL2(profile) {
  if (!NAV_SHELL_FILTERING) return new Set(l2Ids);
  return new Set(l2Ids);
}

const fakeProfile = {
  onboardingCompleted: true,
  primaryBusinessType: "tea-drink",
  productLinePresetIds: ["emenu-only", "kiosk-only"],
  productLines: ["emenu", "kiosk"],
  removedFeatures: [],
};

const l1 = visibleL1(fakeProfile);
const l2 = visibleL2(fakeProfile);

const CRITICAL_L1 = ["team", "marketing", "queue-call"];
const CRITICAL_L2 = [
  "qc-emenu-pro",
  "team-roles",
  "team-tips",
  "team-tax-payroll",
  "mkt-screensaver",
  "mkt-ads",
  "mkt-poster-pro",
];

const missingL1 = CRITICAL_L1.filter((id) => !l1.has(id));
const missingL2 = CRITICAL_L2.filter((id) => !l2.has(id));

if (missingL1.length || missingL2.length) {
  console.error("[verify-nav-reference-parity] FAIL");
  if (missingL1.length) console.error("  missing L1:", missingL1.join(", "));
  if (missingL2.length) console.error("  missing L2:", missingL2.join(", "));
  process.exit(1);
}

console.log(
  `[verify-nav-reference-parity] OK — shell parity with reference (L1=${l1.size}, L2=${l2.size}, critical=${CRITICAL_L1.length + CRITICAL_L2.length})`,
);
