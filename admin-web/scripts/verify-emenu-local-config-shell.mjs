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
const peripheralProducts = read("src/shell/peripheral-products-control.ts");
const demoSwitch = read("src/shell/demo-switch-control.ts");
const kioskShell = read("src/shell/kiosk-local-shell.ts");
const kioskRoutes = read("src/shell/kiosk-local-routes.ts");
const main = read("src/main.ts");
const i18n = read("src/i18n.ts");

const orderedRoutes = [
  "/emenu-local/device-settings",
  "/emenu-local/global-settings",
  "/emenu-local/category-settings",
  "/emenu-local/menu-category-settings",
  "/emenu-local/seasoning-settings",
];

const orderedKioskRoutes = [
  "/kiosk-local/service-settings",
  "/kiosk-local/surcharge-settings",
  "/kiosk-local/brand-settings",
  "/kiosk-local/promotions",
  "/kiosk-local/device-management",
  "/kiosk-local/screensaver",
  "/kiosk-local/menu-tags",
  "/kiosk-local/poster-pro",
  "/kiosk-local/login-guide-image",
  "/kiosk-local/cover-image",
  "/kiosk-local/logo",
  "/kiosk-local/posters",
];

let previousIndex = -1;
for (const route of orderedRoutes) {
  const index = routes.indexOf(route);
  if (index < 0) throw new Error(`Missing eMenu route: ${route}`);
  if (index <= previousIndex) throw new Error(`eMenu routes are out of order at: ${route}`);
  previousIndex = index;
}

previousIndex = -1;
for (const route of orderedKioskRoutes) {
  const index = kioskRoutes.indexOf(route);
  if (index < 0) throw new Error(`Missing Kiosk route: ${route}`);
  if (index <= previousIndex) throw new Error(`Kiosk routes are out of order at: ${route}`);
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

expect(viewSwitch, /data-view-switch-option="store"/, "Demo view switch must keep the store option");
expect(viewSwitch, /data-view-switch-chain-perspective="\$\{perspective\}"/, "Demo view switch must keep chain perspective options");
expect(viewSwitch, /data-view-switch-option="m-platform"/, "Demo view switch must keep the M Platform option");
expect(viewSwitch, /data-demo-switch-non-mvp-stack/, "Flat non-MVP cards must expose a stacked badge wrapper");
expect(viewSwitch, /perspective === "group-hq"[\s\S]*renderFlatNonMvpContent/, "Flat Group HQ card must use the stacked badge wrapper");
expect(viewSwitch, /renderFlatNonMvpContent\(t\("shell\.mPlatform"\)\)/, "Flat M Platform card must use the stacked badge wrapper");
if (/data-view-switch-option="emenu-local"/.test(viewSwitch)) {
  throw new Error("eMenu must not remain inside the view switch menu");
}

expect(peripheralProducts, /data-peripheral-products-root/, "Demo switch must render a peripheral products control");
expect(peripheralProducts, /data-peripheral-product-option="emenu-local"/, "Peripheral products must render the eMenu option");
expect(peripheralProducts, /data-peripheral-product-option="kiosk-local"/, "Peripheral products must render the Kiosk option");
expect(peripheralProducts, /enterEmenuLocalShell/, "Peripheral products must enter the eMenu shell");
expect(peripheralProducts, /EMENU_LOCAL_DEFAULT_PATH/, "Peripheral products must use the eMenu default route");
expect(demoSwitch, /renderFlatPeripheralProductsGroup/, "Demo switch panel must include flat peripheral products");
expect(demoSwitch, /bindPeripheralProductsControl/, "Demo switch panel must bind peripheral products");
expect(demoSwitch, /data-demo-switch-view-group/, "Demo panel must expose the flat view group");
expect(demoSwitch, /data-demo-switch-version-group/, "Demo panel must expose the flat version group");
expect(demoSwitch, /data-demo-switch-products-group/, "Demo panel must expose the flat peripheral products group");
if (/renderViewSwitchControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested view control");
if (/renderVersionSwitchControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested version control");
if (/renderPeripheralProductsControl\(\)/.test(demoSwitch)) throw new Error("Demo panel must not render the nested products control");
expect(demoSwitch, /data-demo-switch-panel-scroll/, "Demo panel must constrain small-screen overflow");
expect(demoSwitch, /\.focus\(/, "Demo panel must manage keyboard focus");

expect(kioskRoutes, /KIOSK_LOCAL_DEFAULT_PATH\s*=\s*"\/kiosk-local\/service-settings"/, "Default Kiosk route must be service settings");
expect(kioskShell, /data-kiosk-local-shell/, "Kiosk shell must expose a stable shell marker");
expect(kioskShell, /data-kiosk-local-nav/, "Kiosk shell must expose stable navigation markers");
expect(kioskShell, /data-kiosk-local-placeholder/, "Kiosk shell must expose stable placeholder markers");
expect(kioskShell, /mountDemoSwitchFab\(\{\s*showVersionSwitch:\s*false\s*\}\)/, "Kiosk shell must mount Demo switch without version control");

expect(main, /isEmenuLocalContentPath/, "Main mount must recognize eMenu routes");
expect(main, /mountEmenuLocalShell/, "Main mount must render the eMenu shell");
expect(main, /bindEmenuLocalShell/, "Main mount must bind the eMenu shell");
expect(main, /isKioskLocalContentPath/, "Main mount must recognize Kiosk routes");
expect(main, /mountKioskLocalShell/, "Main mount must render the Kiosk shell");
expect(main, /bindKioskLocalShell/, "Main mount must bind the Kiosk shell");

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
  "shell.peripheralProducts",
  "shell.peripheralProductsHint",
  "shell.peripheralProductsAria",
  "shell.peripheralProductsMenuAria",
  "shell.peripheralProductsCount",
  "shell.kioskLocal",
  "shell.kioskLocalHint",
  "shell.kioskLocalTitle",
  "shell.kioskLocalNavAria",
  "shell.kioskLocalServiceSettings",
  "shell.kioskLocalSurchargeSettings",
  "shell.kioskLocalBrandSettings",
  "shell.kioskLocalPromotions",
  "shell.kioskLocalDeviceManagement",
  "shell.kioskLocalScreensaver",
  "shell.kioskLocalMenuTags",
  "shell.kioskLocalPosterPro",
  "shell.kioskLocalLoginGuideImage",
  "shell.kioskLocalCoverImage",
  "shell.kioskLocalLogo",
  "shell.kioskLocalPosters",
];

for (const key of requiredI18nKeys) {
  const count = i18n.split(`"${key}"`).length - 1;
  if (count < 2) throw new Error(`Missing bilingual i18n key: ${key}`);
}

console.log("eMenu local configuration shell verification passed");
