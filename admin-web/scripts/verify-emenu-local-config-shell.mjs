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
const emenuEmbedBuild = read("scripts/build-emenu-new-embed.mjs");
const embeddedAssetCopy = read("scripts/copy-embedded-assets.mjs");
const embeddedAssetStash = read("scripts/stash-emenu-pro-for-build.mjs");
const pagesWorkflow = read("../.github/workflows/build-pages.yml");
const main = read("src/main.ts");
const i18n = read("src/i18n.ts");

const orderedRoutes = [
  "/emenu-local/device-settings",
  "/emenu-local/global-settings",
  "/emenu-local/category-settings",
  "/emenu-local/menu-category-settings",
  "/emenu-local/seasoning-settings",
  "/emenu-local/emenu",
  "/emenu-local/emenu-settings",
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
  "/kiosk-local/kiosk",
  "/kiosk-local/kiosk-settings",
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
expect(shell, /data-emenu-local-emenu-frame/, "eMenu shell must embed emenu-new via a stable iframe marker");
expect(shell, /emenu-new\/index\.html/, "eMenu shell must load dist/emenu-new/index.html");
expect(shell, /data-emenu-local-emenu-settings-frame/, "eMenu shell must embed eMenu settings via a stable iframe marker");
expect(shell, /emenu-new\/index\.html[\s\S]*#\/setting/, "eMenu settings iframe must open dist/emenu-new#/setting");
expect(shell, /aria-current=/, "eMenu shell navigation must expose active state");
expect(shell, /mountDemoSwitchFab\(\{\s*showVersionSwitch:\s*false\s*\}\)/, "eMenu shell must mount Demo switch without version control");
expect(shell, /renderEmenuHostIpControl/, "eMenu shell must render host IP control next to theme toggle");
expect(shell, /bindEmenuHostIpControl/, "eMenu shell must bind host IP control");
{
  const hostUi = read("src/shell/emenu-local-host-control-ui.ts");
  expect(hostUi, /data-emenu-host-ip-control/, "eMenu host IP control must expose a stable marker");
  expect(hostUi, /emenu-host-ip-apply/, "eMenu host IP control must expose an apply action");
}
expect(i18n, /"shell\.emenuLocalEmenu":\s*"eMenu"/, "i18n must include the eMenu nav title");
expect(i18n, /"shell\.emenuLocalEmenuSettings":\s*"设置"/, "i18n must include the eMenu settings nav title");
expect(i18n, /"shell\.emenuLocalHostIp":\s*"主机 IP"/, "i18n must include the eMenu host IP label");

{
  const viteConfig = read("vite.config.ts");
  expect(viteConfig, /attachEmenuKposDynamicProxy/, "Vite must attach a dynamic /kpos proxy for embedded emenu-new");
  expect(viteConfig, /EMENU_KPOS_PROXY_TARGET|localhost:22080/, "Vite /kpos proxy must target the POS host (default localhost:22080)");
  expect(viteConfig, /ws:\s*true/, "Vite /kpos proxy must enable WebSocket forwarding");
  expect(viteConfig, /menusifu-emenu-kpos-target/, "Vite /kpos proxy must honor the eMenu host IP cookie");
  expect(viteConfig, /proxy\.web\(req,\s*res,\s*\{\s*target:/, "Vite /kpos proxy must pass per-request target (Vite ignores router)");
  expect(viteConfig, /proxy\.ws\(req,\s*socket,\s*head,\s*\{\s*target:/, "Vite /kpos WS proxy must pass per-request target");
  expect(viteConfig, /\/kpos\/kiosklite/, "Vite must serve local kiosklite embed under /kpos/kiosklite");
  expect(
    viteConfig,
    /pathname === "\/kpos\/emenu\/version\.json"[\s\S]*"dist",\s*"emenu-new",\s*"version\.json"/,
    "Vite must serve local dist/emenu-new/version.json for /kpos/emenu/version.json",
  );
  if (/["']\/emenu["']\s*:[\s\S]*\/kpos\/emenu/.test(viteConfig)) {
    throw new Error("Vite must not proxy /emenu to POS; eMenu and settings must use dist/emenu-new");
  }
  if (/router:\s*\(req/.test(viteConfig)) {
    throw new Error("Vite must not rely on http-proxy-middleware router (ignored by Vite's http-proxy)");
  }
}

{
  const embedIndex = path.join(root, "dist", "emenu-new", "index.html");
  const embedMeta = path.join(root, "dist", "emenu-new", ".emenu-embed-build.json");
  if (!fs.existsSync(embedIndex)) {
    throw new Error("Missing dist/emenu-new/index.html — run: node scripts/build-emenu-new-embed.mjs");
  }
  const embedHtml = fs.readFileSync(embedIndex, "utf8");
  if (!/(?:src|href)=["']\.\/assets\//.test(embedHtml)) {
    throw new Error("dist/emenu-new/index.html must use Pages-safe relative ./assets/ URLs");
  }
  if (/(?:src|href)=["']\/emenu-new\//.test(embedHtml)) {
    throw new Error("dist/emenu-new/index.html must not resolve assets from the GitHub Pages domain root");
  }
  if (!fs.existsSync(embedMeta)) {
    throw new Error("Missing dist/emenu-new/.emenu-embed-build.json — rebuild emenu-new embed");
  }
}

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
expect(kioskRoutes, /path:\s*"\/kiosk-local\/kiosk"/, "Kiosk routes must include the Kiosk embed entry under posters");
expect(kioskRoutes, /path:\s*"\/kiosk-local\/kiosk-settings"/, "Kiosk routes must include the Kiosk settings embed entry");
expect(kioskShell, /data-kiosk-local-shell/, "Kiosk shell must expose a stable shell marker");
expect(kioskShell, /data-kiosk-local-nav/, "Kiosk shell must expose stable navigation markers");
expect(kioskShell, /data-kiosk-local-placeholder/, "Kiosk shell must expose stable placeholder markers");
expect(kioskShell, /data-kiosk-local-kiosk-frame/, "Kiosk shell must embed kiosklite via a stable iframe marker");
expect(kioskShell, /aspect-video/, "Kiosk embed pages must use a fixed 16:9 aspect container");
expect(kioskShell, /data-kiosk-embed-stage/, "Kiosk embed pages must expose a scale stage marker");
expect(kioskShell, /bindKioskEmbedViewportFit/, "Kiosk shell must fit 1920x1080 iframe into the 16:9 stage");
expect(kioskShell, /kiosklite\/index\.html/, "Kiosk shell must load kiosklite/index.html");
expect(kioskShell, /\.\/kpos\/kiosklite\/index\.html/, "Kiosk iframe must use a Pages-safe relative ./kpos/kiosklite URL");
if (/`\/kpos\/kiosklite\/index\.html/.test(kioskShell)) {
  throw new Error("Kiosk iframe must not resolve /kpos from the GitHub Pages domain root");
}
expect(emenuEmbedBuild, /const EMBED_BASE = "\.\/"/, "eMenu embed build must use a relative asset base");
expect(emenuEmbedBuild, /YARN_RC_FILENAME:\s*"\.yarnrc\.runtime\.yml"/, "eMenu build must tolerate omitted Yarn release files");
expect(emenuEmbedBuild, /YARN_NODE_LINKER:\s*"node-modules"/, "eMenu fallback install must expose local build binaries");
expect(kioskShell, /data-kiosk-local-kiosk-settings-frame/, "Kiosk shell must embed Kiosk settings via a stable iframe marker");
expect(kioskShell, /kiosklite\/index\.html[\s\S]*#\/configApp/, "Kiosk settings iframe must open dist/kiosklite#/configApp");
expect(kioskShell, /bindKioskLocalSessionBridge/, "Kiosk shell must bind sessionKey bridge for config pages");
expect(kioskShell, /renderEmenuHostIpControl/, "Kiosk shell must render host IP control next to theme toggle");
expect(kioskShell, /bindEmenuHostIpControl/, "Kiosk shell must bind host IP control (same /kpos cookie as eMenu)");
{
  const hostControl = read("src/shell/emenu-local-host-control.ts");
  expect(hostControl, /data-kiosk-local-kiosk-frame/, "Host apply must reload Kiosk embed iframes");
  expect(hostControl, /data-kiosk-local-kiosk-settings-frame/, "Host apply must reload Kiosk settings iframes");
  expect(hostControl, /reloadKposHostEmbedFrames/, "Host control must expose shared Kiosk/eMenu iframe reload");
  expect(hostControl, /clearKioskLocalSessionCache/, "Host apply must clear Kiosk session cache for the new POS host");
}
{
  const bridge = read("src/shell/kiosk-local-session-bridge.ts");
  expect(bridge, /clientInstanceLogin/, "Kiosk session bridge must login via POS clientInstanceLogin");
  expect(bridge, /type:\s*"sessionKey"/, "Kiosk session bridge must postMessage sessionKey to iframe");
  expect(bridge, /getSessionKey/, "Kiosk session bridge must handle getSessionKey from iframe");
  expect(bridge, /clearKioskLocalSessionCache/, "Kiosk session bridge must expose cache clear for host switch");
}
expect(i18n, /"shell\.kioskLocalKiosk":\s*"Kiosk"/, "i18n must include the Kiosk nav title");
expect(i18n, /"shell\.kioskLocalKioskSettings":\s*"设置"/, "i18n must include the Kiosk settings nav title");

{
  const viteConfig = read("vite.config.ts");
  expect(viteConfig, /route:\s*"kiosklite"/, "Vite must statically serve local kiosklite embed build");
  expect(viteConfig, /"kiosklite",\s*"\.embed-build"/, "Vite kiosklite route must point at dist/kiosklite/.embed-build");
  if (/["']\/kiosklite["']\s*:[\s\S]*\/kpos\/kiosklite/.test(viteConfig)) {
    throw new Error("Vite must not proxy /kiosklite to POS; Kiosk pages must use local dist/kiosklite embed");
  }
}

expect(embeddedAssetStash, /EMBEDDED_DIST_DIRS\s*=\s*\[[^\]]*"kiosklite"/, "Main build must preserve dist/kiosklite while Vite empties dist");
expect(embeddedAssetStash, /entry\s*===\s*"node_modules"/, "Kiosk stash must skip nested dependencies");
expect(embeddedAssetCopy, /"kiosklite",\s*"\.embed-build"/, "Embedded asset copy must read the Kiosk embed build");
expect(embeddedAssetCopy, /"kpos",\s*"kiosklite"/, "Embedded asset copy must publish Kiosk under dist/kpos/kiosklite");
expect(pagesWorkflow, /node-version:\s*"22"/, "Pages CI must use the Node version required by Kiosk");
expect(pagesWorkflow, /working-directory:\s*admin-web\/dist\/kiosklite[\s\S]*run:\s*npm ci/, "Pages CI must install Kiosk dependencies");
expect(pagesWorkflow, /run:\s*npm run build:kiosklite-embed -- --skip-install/, "Pages CI must build the Kiosk embed before admin-web");

{
  const embedIndex = path.join(root, "dist", "kiosklite", ".embed-build", "index.html");
  const embedMeta = path.join(root, "dist", "kiosklite", ".embed-build", ".kiosk-embed-build.json");
  if (!fs.existsSync(embedIndex)) {
    throw new Error("Missing dist/kiosklite/.embed-build/index.html — run: node scripts/build-kiosklite-embed.mjs");
  }
  const embedHtml = fs.readFileSync(embedIndex, "utf8");
  // CRA/host builds use ./static/; local vite embed may use /kiosklite/assets/
  if (
    !/\/kiosklite\/(static|assets)\//.test(embedHtml) &&
    !/\.\/(static|assets)\//.test(embedHtml) &&
    !/\/kiosklite\//.test(embedHtml)
  ) {
    throw new Error("dist/kiosklite/.embed-build/index.html must reference kiosklite static/assets (built embed, not source)");
  }
  if (!fs.existsSync(embedMeta)) {
    throw new Error("Missing dist/kiosklite/.embed-build/.kiosk-embed-build.json — rebuild kiosklite embed");
  }
}
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
