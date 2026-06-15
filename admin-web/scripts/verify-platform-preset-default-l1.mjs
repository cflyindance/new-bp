/**
 * 校验 PLATFORM_PRESET_DEFAULT_L1 在所有业态×产线变体推荐/种子中均默认开通
 */
import { PLATFORM_PRESET_DEFAULT_L1, FEATURE_REGISTRY_L1 } from "../src/config/feature-registry.ts";
import { PRODUCT_LINE_KEY_TEMPLATES } from "../src/config/feature-presets-line-templates.ts";
import { BUSINESS_TYPE_PRESETS } from "../src/config/feature-presets.ts";
import {
  computeRecommendedVariantFeatures,
  getRecommendedL1Ids,
} from "../src/config/feature-presets-recommendations.ts";
import { getBusinessProductLineVariant } from "../src/config/feature-presets-variants.ts";
import { computeDefaultSubtreeIncludes } from "../src/config/feature-presets-subtree-includes.ts";

const sampleBusinessTypes = ["general", "hotpot", "fast-food", "tea-drink"];
const sampleLines = PRODUCT_LINE_KEY_TEMPLATES.map((t) => t.id);

let failed = 0;

for (const bt of sampleBusinessTypes) {
  if (!BUSINESS_TYPE_PRESETS.some((p) => p.id === bt)) continue;
  for (const line of sampleLines) {
    const ids = getRecommendedL1Ids(bt, line);
    for (const required of PLATFORM_PRESET_DEFAULT_L1) {
      if (!ids.has(required)) {
        console.error(`[FAIL] ${bt}+${line} missing platform default L1: ${required}`);
        failed++;
      }
    }
    const variant = getBusinessProductLineVariant(`${bt}:${line}`);
    if (variant) {
      const variantIds = new Set(variant.features.map((f) => f.featureId));
      for (const required of PLATFORM_PRESET_DEFAULT_L1) {
        if (!variantIds.has(required)) {
          console.error(`[FAIL] materialized variant ${bt}:${line} missing ${required}`);
          failed++;
        }
      }
    }
  }
}

// 全功能 / 不确定：任意产线组合均默认开通注册表全部 L1
{
  const ids = getRecommendedL1Ids("general", "emenu-only");
  if (ids.size !== FEATURE_REGISTRY_L1.length) {
    console.error(
      `[FAIL] general+emenu-only should enable all registry L1 (${ids.size}/${FEATURE_REGISTRY_L1.length})`,
    );
    failed++;
  }
  for (const moduleId of ["orders", "waitlist", "finance-center", "print-templates"]) {
    if (!ids.has(moduleId)) {
      console.error(`[FAIL] general+emenu-only missing full-feature default L1: ${moduleId}`);
      failed++;
    }
  }
  if (!ids.has("kitchen-kds")) {
    console.error("[FAIL] emenu-only should still include kitchen-kds via platform defaults");
    failed++;
  }
  const features = computeRecommendedVariantFeatures("hotpot", "kiosk-only");
  if (!features.some((f) => f.featureId === "store-mgmt")) {
    console.error("[FAIL] hotpot+kiosk-only missing store-mgmt");
    failed++;
  }
}

// 快餐 + eMenu / 快餐 + SDI：平台预设默认全选 L1/L2/L3
for (const variantKey of ["fast-food:emenu-only", "fast-food:sdi-only"]) {
  const [bt, line] = variantKey.split(":");
  const l1Ids = getRecommendedL1Ids(bt, line);
  if (l1Ids.size !== FEATURE_REGISTRY_L1.length) {
    console.error(`[FAIL] ${variantKey} should enable all registry L1 (${l1Ids.size}/${FEATURE_REGISTRY_L1.length})`);
    failed++;
  }
  const variant = getBusinessProductLineVariant(variantKey);
  if (!variant) {
    console.error(`[FAIL] missing variant ${variantKey}`);
    failed++;
    continue;
  }
  const expectedSubtree = computeDefaultSubtreeIncludes(variant.features.map((f) => f.featureId));
  for (const l2Id of expectedSubtree.l2Includes) {
    if (!(variant.l2Includes ?? []).includes(l2Id)) {
      console.error(`[FAIL] ${variantKey} missing default L2 ${l2Id}`);
      failed++;
    }
  }
  for (const l3Id of expectedSubtree.l3Includes) {
    if (!(variant.l3Includes ?? []).includes(l3Id)) {
      console.error(`[FAIL] ${variantKey} missing default L3 ${l3Id}`);
      failed++;
    }
  }
  for (const moduleId of ["orders", "queue-call", "kitchen-kds", "finance-center", "print-templates"]) {
    if (!l1Ids.has(moduleId)) {
      console.error(`[FAIL] ${variantKey} missing full-feature L1 ${moduleId}`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.error(`verify-platform-preset-default-l1: ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify-platform-preset-default-l1: OK");
