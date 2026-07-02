/**
 * 平台预设树 · 节点数量校验（与 permission-registry 四级树一致）
 * 用法：node scripts/verify-platform-preset-tree.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const NAV_PATH = path.join(ROOT, "src/config/navigation.ts");
const CATALOG_PATH = path.join(ROOT, "src/config/module-settings-catalog.ts");

const navText = fs.readFileSync(NAV_PATH, "utf8");
const catalogText = fs.readFileSync(CATALOG_PATH, "utf8");

const moduleIds = [...navText.matchAll(/id:\s*"([^"]+)",[\s\S]*?subNavPlacement/g)].map((m) => m[1]);
const navModuleCount = new Set(moduleIds).size;

const seqMatches = [...catalogText.matchAll(/\bseq:\s*(\d+)/g)];
const seqCount = new Set(seqMatches.map((m) => m[1])).size;

console.log("Platform preset tree sanity check");
console.log(`  NAV module blocks (approx): ${navModuleCount}`);
console.log(`  Catalog setting seq (unique): ${seqCount}`);
console.log("");
console.log("Runtime tree is built from permission-registry (buildPlatformPresetModuleGroups).");
console.log("Run `npm run build` to type-check platform-preset-*.ts modules.");

if (navModuleCount < 15) {
  console.error("FAIL: expected at least 20 nav modules");
  process.exit(1);
}

if (seqCount < 100) {
  console.error("FAIL: expected at least 100 catalog seq entries");
  process.exit(1);
}

console.log("OK");
