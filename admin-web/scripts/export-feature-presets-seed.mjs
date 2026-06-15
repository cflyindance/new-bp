/**
 * 从 TS 预设源导出 API 种子 JSON（业态 + 业态×产线完整预设）
 * 用法：node scripts/export-feature-presets-seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_TS = path.resolve(__dirname, "../src/config/feature-presets.ts");
const LINE_TEMPLATES_TS = path.resolve(__dirname, "../src/config/feature-presets-line-templates.ts");
const VARIANTS_TS = path.resolve(__dirname, "../src/config/feature-presets-variants.ts");
const REGISTRY_TS = path.resolve(__dirname, "../src/config/feature-registry.ts");
const OUT_DIR = path.resolve(__dirname, "../.cache");
const OUT_PATH = path.join(OUT_DIR, "feature-presets-seed.json");

function extractArrayBody(text, constName, nextMarker) {
  const marker = `export const ${constName}`;
  const start = text.indexOf(marker);
  if (start < 0) return "";
  const after = text.slice(start);
  const open = after.indexOf("[");
  const endIdx = nextMarker ? after.indexOf(nextMarker) : -1;
  const slice = endIdx > 0 ? after.slice(open, endIdx) : after.slice(open);
  const close = slice.lastIndexOf("]");
  return slice.slice(1, close);
}

function splitTopLevelObjects(arrBody) {
  const blocks = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < arrBody.length; i++) {
    const ch = arrBody[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        blocks.push(arrBody.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return blocks;
}

function parseBusinessBlock(block) {
  const id = block.match(/id:\s*"([^"]+)"/)?.[1];
  const title = block.match(/title:\s*"([^"]+)"/)?.[1];
  const titleEn = block.match(/titleEn:\s*"([^"]+)"/)?.[1];
  const version = Number(block.match(/version:\s*(\d+)/)?.[1] ?? 1);
  const features = [...block.matchAll(/f\("([^"]+)",\s*"([^"]+)"\)/g)].map((m) => ({
    featureId: m[1],
    tier: m[2],
  }));
  return { id, title, titleEn, version, features };
}

function parseLineTemplateBlock(block) {
  const id = block.match(/id:\s*"([^"]+)"/)?.[1];
  const title = block.match(/title:\s*"([^"]+)"/)?.[1];
  const titleEn = block.match(/titleEn:\s*"([^"]+)"/)?.[1];
  const productLines = [...(block.match(/productLines:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map(
    (m) => m[1],
  );
  const features = [...block.matchAll(/f\("([^"]+)",\s*"([^"]+)"\)/g)].map((m) => ({
    featureId: m[1],
    tier: m[2],
  }));
  const excludes = [...(block.match(/excludes:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const l2Raw = block.match(/l2Excludes:\s*\[([\s\S]*?)\]/);
  const l2Excludes = l2Raw ? [...l2Raw[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  const l3Raw = block.match(/l3Excludes:\s*\[([\s\S]*?)\]/);
  const l3Excludes = l3Raw ? [...l3Raw[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  return { id, title, titleEn, productLines, features, excludes, l2Excludes, l3Excludes };
}

function parseVariantDeltaKeys(variantsText) {
  const deltas = {};
  const re = /\[buildVariantId\("([^"]+)",\s*"([^"]+)"\)\]:\s*\{([\s\S]*?)\n\s*\},/g;
  for (const m of variantsText.matchAll(re)) {
    const id = `${m[1]}:${m[2]}`;
    const body = m[3];
    const l2Raw = body.match(/l2Excludes:\s*\[([\s\S]*?)\]/);
    const l2Excludes = l2Raw ? [...l2Raw[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : undefined;
    const l3Raw = body.match(/l3Excludes:\s*\[([\s\S]*?)\]/);
    const l3Excludes = l3Raw ? [...l3Raw[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : undefined;
    deltas[id] = { l2Excludes, l3Excludes };
  }
  return deltas;
}

function unionUnique(...lists) {
  const out = new Set();
  for (const list of lists) {
    if (!list) continue;
    for (const id of list) out.add(id);
  }
  return out.size > 0 ? [...out] : undefined;
}

/** 与 feature-presets.ts buildAllL1PresetFeatures 对齐 */
function allL1PresetFeatures(registryText) {
  const body = extractArrayBody(registryText, "FEATURE_REGISTRY_L1", "const REGISTRY_BY_MODULE");
  return [...body.matchAll(/featureId:\s*"([^"]+)"[\s\S]*?tier:\s*"([^"]+)"/g)].map((m) => ({
    featureId: m[1],
    tier: m[2] === "core" ? "core" : "recommended",
  }));
}

function applyFullPlatformPresetDefaults(businessTypes, variants) {
  const registryText = fs.readFileSync(REGISTRY_TS, "utf8");
  const allL1 = allL1PresetFeatures(registryText);
  for (const bt of businessTypes) {
    bt.features = allL1;
  }
  for (const v of variants) {
    v.features = allL1;
    v.excludes = [];
    v.l2Excludes = undefined;
    v.l3Excludes = undefined;
  }
}

function materializeVariants(businessTypes, lineTemplates, deltas) {
  const variants = [];
  for (const bt of businessTypes) {
    const btLabel = { title: bt.title, titleEn: bt.titleEn ?? bt.title };
    for (const tpl of lineTemplates) {
      const id = `${bt.id}:${tpl.id}`;
      const delta = deltas[id] ?? {};
      variants.push({
        id,
        businessType: bt.id,
        productLinePresetId: tpl.id,
        title: `${btLabel.title} · ${tpl.title}`,
        titleEn: `${btLabel.titleEn} · ${tpl.titleEn}`,
        productLines: tpl.productLines,
        features: tpl.features,
        excludes: tpl.excludes,
        l2Excludes: unionUnique(tpl.l2Excludes, delta.l2Excludes),
        l3Excludes: unionUnique(tpl.l3Excludes, delta.l3Excludes),
        version: 1,
      });
    }
  }
  return variants;
}

function main() {
  const presetsText = fs.readFileSync(PRESETS_TS, "utf8");
  const lineText = fs.readFileSync(LINE_TEMPLATES_TS, "utf8");
  const variantsText = fs.readFileSync(VARIANTS_TS, "utf8");

  const businessBody = extractArrayBody(presetsText, "BUSINESS_TYPE_PRESETS", "export { PRODUCT_LINE_KEYS");
  const lineBody = extractArrayBody(lineText, "PRODUCT_LINE_KEY_TEMPLATES", "export const PRODUCT_LINE_KEYS");
  const deltas = parseVariantDeltaKeys(variantsText);

  const businessTypes = splitTopLevelObjects(businessBody).map(parseBusinessBlock).filter((b) => b.id);

  const variants = materializeVariants(
    businessTypes,
    splitTopLevelObjects(lineBody).map(parseLineTemplateBlock).filter((p) => p.id),
    deltas,
  );
  applyFullPlatformPresetDefaults(businessTypes, variants);

  const payload = {
    businessTypes,
    variants,
    variantOverrides: {},
    exportedAt: new Date().toISOString(),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(
    `[export-feature-presets-seed] business=${payload.businessTypes.length} variants=${payload.variants.length} → ${OUT_PATH}`,
  );
}

main();
