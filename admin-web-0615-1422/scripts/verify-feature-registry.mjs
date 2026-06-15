/**
 * 校验 feature-registry L1/L2 与 NAV_MODULES 一致
 * 用法：node scripts/verify-feature-registry.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const navPath = path.resolve(__dirname, "../src/config/navigation.ts");
const registryPath = path.resolve(__dirname, "../src/config/feature-registry.ts");
const registryL2Path = path.resolve(__dirname, "../src/config/feature-registry-l2.ts");

const navText = fs.readFileSync(navPath, "utf8");
const registryText = fs.readFileSync(registryPath, "utf8");
const registryL2Text = fs.readFileSync(registryL2Path, "utf8");

const navModuleBlock = navText.match(/export const NAV_MODULES[^[]*\[([\s\S]*?)\n\];/);
if (!navModuleBlock) {
  console.error("[verify-feature-registry] Cannot parse NAV_MODULES");
  process.exit(1);
}

const navModuleIds = [...navModuleBlock[1].matchAll(/^    id: "([^"]+)"/gm)].map((m) => m[1]);
const navChildIds = [...navModuleBlock[1].matchAll(/^      \{ id: "([^"]+)"/gm)].map((m) => m[1]);

const registryIds = [...registryText.matchAll(/moduleId:\s+"([^"]+)"/g)].map((m) => m[1]);
const uniqueRegistry = [...new Set(registryIds)];

let failed = false;

const missingInRegistry = navModuleIds.filter((id) => !uniqueRegistry.includes(id));
const extraInRegistry = uniqueRegistry.filter((id) => !navModuleIds.includes(id));

if (missingInRegistry.length) {
  console.error("[verify-feature-registry] NAV_MODULES L1 missing in registry:", missingInRegistry.join(", "));
  failed = true;
}
if (extraInRegistry.length) {
  console.error("[verify-feature-registry] Registry extras not in NAV_MODULES L1:", extraInRegistry.join(", "));
  failed = true;
}
if (uniqueRegistry.length !== navModuleIds.length) {
  console.error(
    `[verify-feature-registry] L1 count mismatch: NAV=${navModuleIds.length} registry=${uniqueRegistry.length}`,
  );
  failed = true;
}

if (!registryL2Text.includes("buildL2Registry")) {
  console.error("[verify-feature-registry] feature-registry-l2.ts must build from NAV_MODULES children");
  failed = true;
}

if (failed) process.exit(1);
console.log(
  `[verify-feature-registry] OK — L1=${navModuleIds.length}, L2 derived from ${navChildIds.length} NAV children`,
);
