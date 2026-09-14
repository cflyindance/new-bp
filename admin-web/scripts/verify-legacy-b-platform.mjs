import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assertIncludes = (source, expected, label) => {
  if (!source.includes(expected)) throw new Error(`Missing ${label}: ${expected}`);
};

const mode = read("src/shell/app-shell-mode.ts");
const shell = read("src/shell/legacy-b-shell.ts");
const routes = read("src/shell/legacy-b-routes.ts");
const switcher = read("src/shell/view-switch-control.ts");
const main = read("src/main.ts");
const i18n = read("src/i18n.ts");

for (const [source, expected, label] of [
  [mode, '"legacy-b"', "legacy-b shell mode"],
  [mode, "isLegacyBShellMode", "legacy-b shell predicate"],
  [routes, 'LEGACY_B_DEFAULT_PATH = "/legacy-b/merchants"', "legacy-b default route"],
  [routes, "isLegacyBContentPath", "legacy-b route predicate"],
  [routes, "normalizeLegacyBPath", "legacy-b route normalizer"],
  [shell, "大飞鸽-AD", "first merchant"],
  [shell, "小飞鸽-联想PC", "fourth merchant"],
  [shell, "mountDemoSwitchFab", "floating switch mount"],
  [switcher, "export function switchToBrandView", "reusable brand view transition"],
  [switcher, 'data-view-switch-option="legacy-b"', "legacy-b switch option"],
  [switcher, "LEGACY_B_DEFAULT_PATH", "legacy-b switch route"],
  [main, "mountLegacyBShell", "legacy-b main mount"],
  [i18n, '"shell.legacyBPlatform"', "legacy-b i18n label"],
]) assertIncludes(source, expected, label);

console.log("Legacy B platform verification passed.");
