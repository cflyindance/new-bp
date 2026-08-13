import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolute, "utf8");
}

function expect(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

const shell = read("src/shell/emenu-local-shell.ts");
const routes = read("src/shell/emenu-local-routes.ts");
const appShellMode = read("src/shell/app-shell-mode.ts");
const viewSwitch = read("src/shell/view-switch-control.ts");
const main = read("src/main.ts");
const i18n = read("src/i18n.ts");

const orderedRoutes = [
  "/emenu-local/device-settings",
  "/emenu-local/global-settings",
  "/emenu-local/category-settings",
  "/emenu-local/menu-category-settings",
  "/emenu-local/seasoning-settings",
];

let previousIndex = -1;
for (const route of orderedRoutes) {
  const index = routes.indexOf(route);
  if (index < 0) throw new Error(`Missing eMenu route: ${route}`);
  if (index <= previousIndex) throw new Error(`eMenu routes are out of order at: ${route}`);
  previousIndex = index;
}

expect(routes, /EMENU_LOCAL_DEFAULT_PATH\s*=\s*"\/emenu-local\/device-settings"/, "Default eMenu route must be device settings");
expect(shell, /data-emenu-local-nav/, "eMenu shell must expose stable navigation markers");
expect(shell, /data-emenu-local-placeholder/, "eMenu shell must expose a stable placeholder marker");
expect(shell, /aria-current=/, "eMenu shell navigation must expose active state");
expect(shell, /mountDemoSwitchFab\(\{\s*showVersionSwitch:\s*false\s*\}\)/, "eMenu shell must mount Demo switch without version control");

expect(appShellMode, /"emenu-local"/, "App shell mode must include emenu-local");
expect(appShellMode, /isEmenuLocalShellMode/, "App shell mode must expose eMenu mode detection");
expect(appShellMode, /enterEmenuLocalShell/, "App shell mode must expose eMenu entry");
expect(appShellMode, /exitEmenuLocalShell/, "App shell mode must expose eMenu exit");

expect(viewSwitch, /data-view-switch-option="emenu-local"/, "Demo view switch must render the eMenu option");
expect(viewSwitch, /enterEmenuLocalShell/, "Demo view switch must enter the eMenu shell");
expect(viewSwitch, /EMENU_LOCAL_DEFAULT_PATH/, "Demo view switch must use the eMenu default route");

expect(main, /isEmenuLocalContentPath/, "Main mount must recognize eMenu routes");
expect(main, /mountEmenuLocalShell/, "Main mount must render the eMenu shell");
expect(main, /bindEmenuLocalShell/, "Main mount must bind the eMenu shell");

const requiredI18nKeys = [
  "shell.emenuLocal",
  "shell.emenuLocalHint",
  "shell.emenuLocalTitle",
  "shell.emenuLocalNavAria",
  "shell.emenuLocalDeviceSettings",
  "shell.emenuLocalGlobalSettings",
  "shell.emenuLocalCategorySettings",
  "shell.emenuLocalMenuCategorySettings",
  "shell.emenuLocalSeasoningSettings",
  "shell.emenuLocalComingSoon",
];

for (const key of requiredI18nKeys) {
  const count = i18n.split(`"${key}"`).length - 1;
  if (count < 2) throw new Error(`Missing bilingual i18n key: ${key}`);
}

console.log("eMenu local configuration shell verification passed");
