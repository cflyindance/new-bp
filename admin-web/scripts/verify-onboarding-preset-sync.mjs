/**
 * 校验引导 Step 3 默认勾选与 mergePresets / 平台预设合并结果一致（含 L2/L3 与重新引导场景）
 */
import { FEATURE_REGISTRY_L1 } from "../src/config/feature-registry.ts";
import {
  computePresetDefaultRemovedFeatures,
  computePresetEnabledL1Modules,
  computeVariantPresetEnabledL1Modules,
  getVisibleNavModules,
  getVisibleModuleChildren,
  getVisibleSheetSubnav,
  isL2FeatureVisible,
  mergePresets,
  profileToInput,
  resolveVisibilityContext,
} from "../src/config/feature-visibility.ts";
import {
  applyOnboardingFeatureToggle,
  countOnboardingVisibleL1Modules,
  buildOnboardingCommittedProfile,
  buildOnboardingFeatureTree,
  buildOnboardingPresetSyncKey,
  isOnboardingL1Checked,
  isOnboardingL1PresetEnabled,
  listOnboardingStep3L1ModuleIds,
  resolveOnboardingCommitFeatures,
  syncOnboardingDraftFromPresets,
} from "../src/onboarding/onboarding-preset-sync.ts";
import { resolveProductLinesFromPresetIds } from "../src/config/tenant-profile-storage.ts";
import { NAV_MODULES } from "../src/config/navigation.ts";
import { collectModuleNavSubtreeIds } from "../src/config/feature-presets-nav-tree.ts";
import { reconcileVariantSubtreeIncludes } from "../src/config/feature-presets-subtree-includes.ts";
import {
  getEffectiveVariantForPair,
  setBusinessProductLineVariantOverrides,
} from "../src/config/feature-presets-variant-runtime.ts";

const cases = [
  { bt: "hotpot", lines: ["emenu-only"] },
  { bt: "hotpot", lines: ["pos-suite", "kds"] },
  { bt: "fast-food", lines: ["kiosk-only"] },
  { bt: "general", lines: ["emenu-only", "pos-suite"] },
];

let failed = 0;
for (const c of cases) {
  const draft = {
    primaryBusinessType: c.bt,
    productLinePresetIds: c.lines,
    removedFeatures: [],
    addedFeatures: [],
  };
  const synced = syncOnboardingDraftFromPresets(draft, { force: true });
  const input = {
    primaryBusinessType: c.bt,
    productLinePresetIds: c.lines,
    productLines: resolveProductLinesFromPresetIds(c.lines),
    addedFeatures: [],
    removedFeatures: synced.removedFeatures,
  };
  const presetEnabled = computeVariantPresetEnabledL1Modules({
    ...input,
    removedFeatures: [],
    addedFeatures: [],
  });
  const profile = {
    tenantId: "t",
    primaryBusinessType: c.bt,
    productLinePresetIds: c.lines,
    productLines: input.productLines,
    enabledFeatures: [],
    addedFeatures: [],
    removedFeatures: synced.removedFeatures,
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: {} },
  };
  const ctx = resolveVisibilityContext(profile);
  const step2Count = countOnboardingVisibleL1Modules(draft);
  const mergedCount = mergePresets(input).size;

  for (const meta of FEATURE_REGISTRY_L1) {
    const listed = listOnboardingStep3L1ModuleIds(draft).includes(meta.moduleId);
    if (!listed) continue;
    const expectedOn = presetEnabled.has(meta.moduleId);
    const ctxOn = ctx.l1.has(meta.moduleId) && !synced.removedFeatures.includes(meta.moduleId);
    if (expectedOn !== ctxOn) {
      console.error(`[FAIL] ${c.bt}+${c.lines.join("+")} ${meta.moduleId}: preset=${expectedOn} ctx=${ctxOn}`);
      failed++;
    }
  }

  if (step2Count !== presetEnabled.size) {
    console.error(`[FAIL] ${c.bt} step2 count ${step2Count} != preset ${presetEnabled.size}`);
    failed++;
  }
  if (mergedCount !== ctx.l1.size) {
    console.error(`[FAIL] ${c.bt} merged ${mergedCount} != ctx.l1 ${ctx.l1.size}`);
    failed++;
  }
  const removed = computePresetDefaultRemovedFeatures({
    ...input,
    removedFeatures: [],
    addedFeatures: [],
  });
  if (removed.join(",") !== synced.removedFeatures.join(",")) {
    console.error(`[FAIL] ${c.bt} removed mismatch`);
    failed++;
  }
}

// 重新引导：旧 removedFeatures 不应在新画像中残留
{
  const draft = {
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  };
  const synced = syncOnboardingDraftFromPresets(draft, { force: true });
  const staleRemoved = ["marketing", "inventory", "foh-menu"];
  const profile = {
    tenantId: "t",
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
    productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
    enabledFeatures: [],
    addedFeatures: [],
    removedFeatures: synced.removedFeatures,
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: {} },
  };
  if (staleRemoved.some((id) => profile.removedFeatures.includes(id))) {
    console.error("[FAIL] reonboard profile still carries stale removedFeatures");
    failed++;
  }
  const ctx = resolveVisibilityContext(profile);
  const presetL1 = computePresetEnabledL1Modules({
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
    productLines: profile.productLines,
    addedFeatures: [],
    removedFeatures: [],
  });
  for (const id of presetL1) {
    if (!ctx.l1.has(id)) {
      console.error(`[FAIL] reonboard L1 ${id} missing after fresh sync`);
      failed++;
    }
  }
}

// 门店管理：L1 已勾选但覆盖层 l2Includes 为空时，应补全二级侧滑导航
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("general", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing general:emenu-only variant");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "general:emenu-only": {
        features: base.features,
        l2Includes: [],
        l3Includes: [],
      },
    });
    const effective = getEffectiveVariantForPair("general", "emenu-only");
    const reconciled = reconcileVariantSubtreeIncludes({
      ...base,
      l2Includes: [],
      l3Includes: [],
    });
    const profile = {
      tenantId: "t",
      primaryBusinessType: "general",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const storeMgmt = NAV_MODULES.find((m) => m.id === "store-mgmt");
    if (!storeMgmt) {
      console.error("[FAIL] store-mgmt module missing");
      failed++;
    } else {
      const sheet = getVisibleSheetSubnav(storeMgmt, profile);
      const children = getVisibleModuleChildren(storeMgmt, profile);
      if (!sheet.some((i) => i.id === "st-overview")) {
        console.error("[FAIL] store-mgmt sheet missing st-overview", sheet.map((i) => i.id));
        failed++;
      }
      if (!children.some((c) => c.id === "st-overview")) {
        console.error("[FAIL] store-mgmt children missing st-overview", children.map((c) => c.id));
        failed++;
      }
    }
    if (!(effective?.l2Includes ?? []).includes("st-overview")) {
      console.error("[FAIL] effective variant missing st-overview after empty override");
      failed++;
    }
    if (!(reconciled.l2Includes ?? []).includes("st-overview")) {
      console.error("[FAIL] reconcileVariantSubtreeIncludes missing st-overview");
      failed++;
    }
    // 仅含设置树虚拟 L2（st-store-profile）时，主导航二级仍应补全/继承展示
    setBusinessProductLineVariantOverrides({
      "general:emenu-only": {
        features: base.features,
        l2Includes: (base.l2Includes ?? []).filter(
          (id) => !["st-overview", "st-list", "st-status", "st-brand-menu", "st-settings"].includes(id),
        ),
      },
    });
    const virtualOnlyProfile = {
      tenantId: "t",
      primaryBusinessType: "general",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const virtualOnlySheet = getVisibleSheetSubnav(storeMgmt, virtualOnlyProfile);
    if (!virtualOnlySheet.some((i) => i.id === "st-overview")) {
      console.error(
        "[FAIL] store-mgmt sheet missing st-overview when l2Includes only has virtual L2",
        virtualOnlySheet.map((i) => i.id),
      );
      failed++;
    }
    setBusinessProductLineVariantOverrides({});
  }
}

// 平台预设 L2 白名单优先于产线门槛（多场景）
{
  setBusinessProductLineVariantOverrides({});
  const cases = [
    {
      name: "qc-floor-plan on emenu-only",
      bt: "general",
      lines: ["emenu-only"],
      l2Id: "qc-floor-plan",
    },
    {
      name: "qc-emenu-pro on pos-suite",
      bt: "general",
      lines: ["pos-suite"],
      l2Id: "qc-emenu-pro",
    },
    {
      name: "qc-menu-order-limits on pos-suite",
      bt: "general",
      lines: ["pos-suite"],
      l2Id: "qc-menu-order-limits",
    },
  ];
  for (const c of cases) {
    const base = getEffectiveVariantForPair(c.bt, c.lines[0]);
    if (!base) {
      console.error(`[FAIL] missing variant ${c.bt}:${c.lines[0]}`);
      failed++;
      continue;
    }
    setBusinessProductLineVariantOverrides({
      [`${c.bt}:${c.lines[0]}`]: {
        l2Includes: [...new Set([...(base.l2Includes ?? []), c.l2Id])],
      },
    });
    const profile = {
      tenantId: "t",
      primaryBusinessType: c.bt,
      productLinePresetIds: c.lines,
      productLines: resolveProductLinesFromPresetIds(c.lines),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    if (!isL2FeatureVisible(c.l2Id, profile)) {
      console.error(`[FAIL] ${c.name}: ${c.l2Id} should bypass product-line gate when in l2Includes`);
      failed++;
    }
    setBusinessProductLineVariantOverrides({});
  }
}

// 引导 Step 3 功能树应包含平台预设 L2/L3
{
  setBusinessProductLineVariantOverrides({});
  const draft = {
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  };
  const tree = buildOnboardingFeatureTree(draft);
  const storeMgmt = tree.find((m) => m.moduleId === "store-mgmt");
  if (!storeMgmt || !storeMgmt.children.some((c) => c.id === "st-overview")) {
    console.error("[FAIL] onboarding feature tree missing store-mgmt L2", tree.map((m) => m.moduleId));
    failed++;
  }
  const queueCall = tree.find((m) => m.moduleId === "queue-call");
  if (queueCall && queueCall.children.length === 0) {
    console.error("[FAIL] onboarding feature tree queue-call has no L2 children");
    failed++;
  }
  setBusinessProductLineVariantOverrides({});
}

// 引导提交：Step 3 勾选的 L2 应写入 addedFeatures，进入系统后仍可见
{
  setBusinessProductLineVariantOverrides({});
  const draft = {
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  };
  const selections = resolveOnboardingCommitFeatures(draft);
  const profile = {
    tenantId: "t",
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
    enabledFeatures: [],
    addedFeatures: selections.addedFeatures,
    removedFeatures: selections.removedFeatures,
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: {} },
  };
  const storeMgmt = NAV_MODULES.find((m) => m.id === "store-mgmt");
  if (storeMgmt) {
    const sheet = getVisibleSheetSubnav(storeMgmt, profile);
    if (!selections.addedFeatures.includes("st-overview")) {
      console.error("[FAIL] commit selections missing st-overview", selections.addedFeatures);
      failed++;
    }
    if (!sheet.some((i) => i.id === "st-overview")) {
      console.error("[FAIL] post-commit sheet missing st-overview", sheet.map((i) => i.id));
      failed++;
    }
  }
  if (selections.addedFeatures.includes("qc-floor-plan") && !isL2FeatureVisible("qc-floor-plan", profile)) {
    console.error("[FAIL] addedFeatures qc-floor-plan not visible after commit");
    failed++;
  }
  setBusinessProductLineVariantOverrides({});
}

// Step 3 取消一级模块：Step 4 同步不得清空；提交后侧栏应隐藏该模块
{
  setBusinessProductLineVariantOverrides({});
  let draft = syncOnboardingDraftFromPresets({
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  });
  const presetL1 = computeVariantPresetEnabledL1Modules({
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
    addedFeatures: [],
    removedFeatures: [],
  });
  const cancelTarget = [...presetL1].find((id) => id === "marketing") ?? [...presetL1].find((id) => !["permission-mgmt", "settings", "dashboard", "store-mgmt"].includes(id));
  if (!cancelTarget) {
    console.error("[FAIL] no cancellable L1 module in general+emenu-only preset");
    failed++;
  } else {
    applyOnboardingFeatureToggle(draft, cancelTarget, false);
    const afterStep4 = syncOnboardingDraftFromPresets(draft);
    if (!afterStep4.removedFeatures.includes(cancelTarget)) {
      console.error("[FAIL] Step 4 sync cleared Step 3 L1 uncheck", cancelTarget, afterStep4.removedFeatures);
      failed++;
    }
    const selections = resolveOnboardingCommitFeatures(afterStep4);
    const profile = {
      tenantId: "t",
      primaryBusinessType: "general",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: selections.addedFeatures,
      removedFeatures: selections.removedFeatures,
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const visibleIds = getVisibleNavModules(profile).map((m) => m.id);
    if (visibleIds.includes(cancelTarget)) {
      console.error("[FAIL] sidebar still shows cancelled L1 after commit", cancelTarget, visibleIds);
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 非平台预设模块：Step 3 展示且默认不勾选；手动勾选后提交应出现在侧栏
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("general", "emenu-only");
  const optInTarget = "promotions";
  if (!base) {
    console.error("[FAIL] missing general:emenu-only variant for non-preset test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "general:emenu-only": {
        features: base.features.filter((f) => f.featureId !== optInTarget),
      },
    });
    const draft = {
      primaryBusinessType: "general",
      productLinePresetIds: ["emenu-only"],
      removedFeatures: [],
      addedFeatures: [],
      presetSyncKey: "general:emenu-only",
    };
    const listed = listOnboardingStep3L1ModuleIds(draft);
    if (!listed.includes(optInTarget)) {
      console.error("[FAIL] platform-unchecked module not listed in Step 3", optInTarget, listed);
      failed++;
    } else if (isOnboardingL1PresetEnabled(optInTarget, draft)) {
      console.error("[FAIL] module should not be preset-enabled after override", optInTarget);
      failed++;
    } else if (isOnboardingL1Checked(optInTarget, draft)) {
      console.error("[FAIL] non-preset module should default unchecked", optInTarget);
      failed++;
    } else {
      applyOnboardingFeatureToggle(draft, optInTarget, true);
      const selections = resolveOnboardingCommitFeatures(draft);
      if (!selections.addedFeatures.includes(optInTarget)) {
        console.error("[FAIL] commit missing non-preset L1 in addedFeatures", optInTarget, selections.addedFeatures);
        failed++;
      }
      const profile = {
        tenantId: "t",
        primaryBusinessType: "general",
        productLinePresetIds: ["emenu-only"],
        productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
        enabledFeatures: [],
        addedFeatures: selections.addedFeatures,
        removedFeatures: selections.removedFeatures,
        onboardingCompleted: true,
        implementationPreConfigured: true,
        presetVersions: { business: 1, productLine: {} },
      };
      const visibleIds = getVisibleNavModules(profile).map((m) => m.id);
      if (!visibleIds.includes(optInTarget)) {
        console.error("[FAIL] sidebar missing opted-in non-preset L1", optInTarget, visibleIds);
        failed++;
      }
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 引导提交：系统设置须写入二级入口（预设树不含 settings 模块）
{
  const draft = syncOnboardingDraftFromPresets({
    primaryBusinessType: "fast-food",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  });
  const sel = resolveOnboardingCommitFeatures(draft);
  for (const id of ["set-locale-display", "fin-settings", "pt-settings", "pt-decoration"]) {
    if (!sel.addedFeatures.includes(id)) {
      console.error("[FAIL] commit missing settings/finance/print L2", id, sel.addedFeatures.length);
      failed++;
    }
  }
}

// 租户已开通 L1：二/三级须与平台预设 L2 白名单一致（不再因 L1 开通而绕过白名单）
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("general", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing general:emenu-only for legacy L2 test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "general:emenu-only": {
        features: base.features,
        l2Includes: (base.l2Includes ?? []).filter((id) => id !== "orders-settings"),
      },
    });
    const profile = {
      tenantId: "t",
      primaryBusinessType: "general",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const orders = NAV_MODULES.find((m) => m.id === "orders");
    const sheet = orders ? getVisibleSheetSubnav(orders, profile) : [];
    if (sheet.some((i) => i.id === "orders-settings")) {
      console.error(
        "[FAIL] orders-settings should be hidden when removed from variant l2Includes",
        sheet.map((i) => i.id),
      );
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 手动勾选非预设 L1：提交后须带出完整二/三级侧栏
{
  setBusinessProductLineVariantOverrides({});
  const optInTargets = [
    "orders",
    "waitlist",
    "gift-cards",
    "reservations",
    "finance-center",
    "print-templates",
    "kitchen-kds",
    "device-management",
  ];
  let draft = syncOnboardingDraftFromPresets({
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  });
  for (const id of listOnboardingStep3L1ModuleIds(draft)) {
    applyOnboardingFeatureToggle(draft, id, optInTargets.includes(id));
  }
  const selections = resolveOnboardingCommitFeatures(draft);
  const profile = {
    tenantId: "t",
    primaryBusinessType: "hotpot",
    productLinePresetIds: ["emenu-only"],
    productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
    enabledFeatures: [],
    addedFeatures: selections.addedFeatures,
    removedFeatures: selections.removedFeatures,
    onboardingCompleted: true,
    implementationPreConfigured: true,
    presetVersions: { business: 1, productLine: {} },
  };
  for (const moduleId of optInTargets) {
    const mod = NAV_MODULES.find((m) => m.id === moduleId);
    if (!mod) {
      console.error("[FAIL] missing nav module", moduleId);
      failed++;
      continue;
    }
    const sheet = getVisibleSheetSubnav(mod, profile);
    if (sheet.length === 0) {
      console.error("[FAIL] opted-in L1 missing sheet subnav after commit", moduleId, sheet);
      failed++;
    }
    if (!isOnboardingL1PresetEnabled(moduleId, draft) && !selections.addedFeatures.includes(moduleId)) {
      console.error("[FAIL] opted-in L1 missing from addedFeatures", moduleId);
      failed++;
    }
    const firstL2 = mod.children[0]?.id;
    if (firstL2 && !selections.addedFeatures.includes(firstL2) && !isL2FeatureVisible(firstL2, profile)) {
      console.error("[FAIL] opted-in L1 missing default L2 in commit/visibility", moduleId, firstL2);
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// Step 3 须展示全部可勾选 L1；默认勾选与平台变体 features 一致
{
  const draft = syncOnboardingDraftFromPresets({
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    removedFeatures: [],
    addedFeatures: [],
  });
  const variantL1 = computeVariantPresetEnabledL1Modules({
    primaryBusinessType: "general",
    productLinePresetIds: ["emenu-only"],
    productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
    addedFeatures: [],
    removedFeatures: [],
  });
  const listed = listOnboardingStep3L1ModuleIds(draft);
  const mustList = [
    "kitchen-kds",
    "orders",
    "waitlist",
    "gift-cards",
    "reservations",
    "finance-center",
    "print-templates",
  ];
  for (const moduleId of mustList) {
    if (!listed.includes(moduleId)) {
      console.error("[FAIL] Step 3 missing L1 for general+emenu-only", moduleId, listed);
      failed++;
    }
  }
  for (const moduleId of variantL1) {
    if (!isOnboardingL1PresetEnabled(moduleId, draft)) {
      console.error("[FAIL] variant L1 should be preset-enabled in Step 3", moduleId);
      failed++;
    }
    if (!isOnboardingL1Checked(moduleId, draft)) {
      console.error("[FAIL] variant L1 should default checked in Step 3", moduleId);
      failed++;
    }
  }
}

// 平台预设变体 version 变化后应重新同步 Step 3 默认勾选
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for variant version sync test");
    failed++;
  } else {
    let draft = {
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      removedFeatures: [],
      addedFeatures: [],
    };
    draft = syncOnboardingDraftFromPresets(draft, { force: true });
    applyOnboardingFeatureToggle(draft, "finance-center", false);
    const oldKey = draft.presetSyncKey;
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: [
          ...base.features,
          { featureId: "finance-center", tier: "recommended" },
        ],
        version: (base.version ?? 1) + 1,
      },
    });
    const newKey = buildOnboardingPresetSyncKey(draft);
    if (oldKey === newKey) {
      console.error("[FAIL] preset sync key should change when variant version changes", oldKey, newKey);
      failed++;
    }
    draft = syncOnboardingDraftFromPresets(draft);
    if (!isOnboardingL1Checked("finance-center", draft)) {
      console.error("[FAIL] Step 3 should re-check finance after variant preset update", draft.removedFeatures);
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 引导提交：非预设且未勾选的 L1 不得写入 removedFeatures（避免侧栏长期隐藏）
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for removedFeatures test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: base.features.filter((f) => f.featureId !== "finance-center"),
      },
    });
    const draft = syncOnboardingDraftFromPresets({
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      removedFeatures: [],
      addedFeatures: [],
    });
    const selections = resolveOnboardingCommitFeatures(draft);
    if (selections.removedFeatures.includes("finance-center")) {
      console.error(
        "[FAIL] unchecked non-preset L1 should not be in removedFeatures",
        selections.removedFeatures,
      );
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 平台变体开通的 L1 优先于产线 scope：财务/打印在 emenu-only 下仍应出现在侧栏
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for scope override test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: [
          ...base.features.filter((f) => !["finance-center", "print-templates"].includes(f.featureId)),
          { featureId: "finance-center", tier: "recommended" },
          { featureId: "print-templates", tier: "recommended" },
        ],
      },
    });
    const profile = {
      tenantId: "t",
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: [],
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const visibleIds = getVisibleNavModules(profile).map((m) => m.id);
    for (const moduleId of ["finance-center", "print-templates"]) {
      if (!visibleIds.includes(moduleId)) {
        console.error("[FAIL] variant-enabled L1 missing from sidebar after scope filter", moduleId, visibleIds);
        failed++;
      }
      const mod = NAV_MODULES.find((m) => m.id === moduleId);
      if (mod && !getVisibleSheetSubnav(mod, profile).some((i) => i.id.endsWith("-settings"))) {
        console.error("[FAIL] finance/print settings L2 missing", moduleId);
        failed++;
      }
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 历史引导批量 removed：平台变体已开通的财务/打印应恢复侧栏
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for bulk stale removed test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: [
          ...base.features,
          { featureId: "finance-center", tier: "recommended" },
          { featureId: "print-templates", tier: "recommended" },
        ],
      },
    });
    const staleL1 = [
      "orders",
      "waitlist",
      "gift-cards",
      "reservations",
      "finance-center",
      "print-templates",
      "kitchen-kds",
      "device-management",
    ];
    const staleRemoved = [];
    for (const moduleId of staleL1) {
      staleRemoved.push(moduleId);
      const subtree = collectModuleNavSubtreeIds(moduleId);
      staleRemoved.push(...subtree.l2, ...subtree.l3);
    }
    const profile = {
      tenantId: "t",
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      productLines: resolveProductLinesFromPresetIds(["emenu-only"]),
      enabledFeatures: [],
      addedFeatures: [],
      removedFeatures: staleRemoved,
      onboardingCompleted: true,
      implementationPreConfigured: true,
      presetVersions: { business: 1, productLine: {} },
    };
    const visibleIds = getVisibleNavModules(profile).map((m) => m.id);
    for (const moduleId of ["finance-center", "print-templates"]) {
      if (!visibleIds.includes(moduleId)) {
        console.error("[FAIL] bulk stale removed still hides variant L1", moduleId, visibleIds);
        failed++;
      }
    }
    const pruned = profileToInput(profile).removedFeatures;
    if (pruned.includes("finance-center") || pruned.includes("print-templates")) {
      console.error("[FAIL] pruneBulkStaleL1Removals should lift finance/print", pruned);
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 引导默认勾选提交后：侧栏 L1 须与 Step 3 变体预设一致
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for post-commit sidebar test");
    failed++;
  } else {
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: [
          ...base.features.filter((f) => !["finance-center", "print-templates"].includes(f.featureId)),
          { featureId: "finance-center", tier: "recommended" },
          { featureId: "print-templates", tier: "recommended" },
        ],
        version: (base.version ?? 1) + 1,
      },
    });
    const draft = syncOnboardingDraftFromPresets({
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      removedFeatures: [],
      addedFeatures: [],
    });
    const profile = buildOnboardingCommittedProfile(draft);
    const visibleIds = getVisibleNavModules(profile).map((m) => m.id);
    for (const moduleId of ["finance-center", "print-templates"]) {
      if (!isOnboardingL1Checked(moduleId, draft)) {
        console.error("[FAIL] Step 3 should default-check variant L1", moduleId);
        failed++;
      }
      if (!profile.addedFeatures.includes(moduleId)) {
        console.error("[FAIL] commit profile missing explicit L1 in addedFeatures", moduleId);
        failed++;
      }
      if (!visibleIds.includes(moduleId)) {
        console.error("[FAIL] sidebar missing committed variant L1", moduleId, visibleIds);
        failed++;
      }
    }
  }
  setBusinessProductLineVariantOverrides({});
}

// 平台预设仅开通财务中心部分 L2：引导提交与侧栏须与白名单一致
{
  setBusinessProductLineVariantOverrides({});
  const base = getEffectiveVariantForPair("hotpot", "emenu-only");
  if (!base) {
    console.error("[FAIL] missing hotpot:emenu-only for finance partial subtree test");
    failed++;
  } else {
    const financeSubtree = collectModuleNavSubtreeIds("finance-center");
    const partialL2 = financeSubtree.l2.filter((id) => id === "fin-settings");
    setBusinessProductLineVariantOverrides({
      "hotpot:emenu-only": {
        features: [
          ...base.features.filter((f) => f.featureId !== "finance-center"),
          { featureId: "finance-center", tier: "recommended" },
        ],
        l2Includes: partialL2,
        l3Includes: financeSubtree.l3.filter((id) => id.startsWith("set:")),
        version: (base.version ?? 1) + 1,
      },
    });
    const draft = syncOnboardingDraftFromPresets({
      primaryBusinessType: "hotpot",
      productLinePresetIds: ["emenu-only"],
      removedFeatures: [],
      addedFeatures: [],
    });
    const selections = resolveOnboardingCommitFeatures(draft);
    if (!selections.addedFeatures.includes("fin-settings")) {
      console.error("[FAIL] commit should include variant fin-settings only", selections.addedFeatures);
      failed++;
    }
    if (selections.addedFeatures.includes("fin-register-audit")) {
      console.error("[FAIL] commit should not include fin-register-audit when not in variant l2Includes");
      failed++;
    }
    const profile = buildOnboardingCommittedProfile(draft);
    const finance = NAV_MODULES.find((m) => m.id === "finance-center");
    const sheet = finance ? getVisibleSheetSubnav(finance, profile) : [];
    if (!sheet.some((i) => i.id === "fin-settings")) {
      console.error("[FAIL] sidebar missing fin-settings from partial preset", sheet.map((i) => i.id));
      failed++;
    }
    if (sheet.some((i) => i.id === "fin-register-audit")) {
      console.error("[FAIL] sidebar should hide fin-register-audit when not in variant l2Includes", sheet.map((i) => i.id));
      failed++;
    }
  }
  setBusinessProductLineVariantOverrides({});
}

if (failed > 0) {
  console.error(`verify-onboarding-preset-sync: ${failed} failure(s)`);
  process.exit(1);
}
console.log("verify-onboarding-preset-sync: OK");
