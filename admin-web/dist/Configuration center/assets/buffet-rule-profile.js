(function () {
  "use strict";

  var REPOSITORY_KEY = "buffet-rule:repository:v1";
  var LOCK_KEY = "buffet-rule:repository-lock:v1";
  var LOCK_TTL = 3000;
  var ALLOWED_PERIODS = ["order_lifetime", "per_round", "multi_round"];
  var PERIOD_TEMPLATES = [
    { id: "order-basic", name: "基础整单限购", periods: ["order_lifetime"], blocks: { order_lifetime: ["target"] } },
    { id: "round-party-table-cap", name: "每人每轮＋整桌兜底", periods: ["per_round"], blocks: { per_round: ["total", "target"] } },
    { id: "order-round-protection", name: "整单＋每轮保护", periods: ["order_lifetime", "per_round"], blocks: { order_lifetime: ["target"], per_round: ["target", "same_dish"] } },
    { id: "multi-round-desc", name: "分轮次递减", periods: ["multi_round"], blocks: { multi_round: ["target"] } },
    { id: "custom", name: "自定义配置", periods: [], blocks: {} }
  ];
  var LEGACY_CAPABILITIES = {
    "KPOS-O01": { id: "KPOS-O01", label: "每个订单的指定菜品分别限制份数", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O02": { id: "KPOS-O02", label: "每个订单的指定菜品集合并限制总份数", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O03": { id: "KPOS-O03", label: "每位食客每单指定菜品额度 × 有效人数", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime" },
    "KPOS-O04": { id: "KPOS-O04", label: "每位食客每单菜品集额度 × 有效人数", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime" },
    "KPOS-O05": { id: "KPOS-O05", label: "选择分类后展开并保存具体菜品", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O06": { id: "KPOS-O06", label: "菜品规则选择多个商品时分别统计", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime" },
    "KPOS-O07": { id: "KPOS-O07", label: "菜品集是规则内临时集合，不新增名称或编码", group: "order_lifetime", level: "rule", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O08": { id: "KPOS-O08", label: "菜品集成员跨产线合并统计", group: "order_lifetime", level: "rule", coverageStatus: "defined_extension", legacyEvidenceStatus: "not_legacy" },
    "KPOS-O09": { id: "KPOS-O09", label: "同一功能支持多条非重叠规则独立生效", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O10": { id: "KPOS-O10", label: "同一商品允许跨四种整单功能重复选择", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O11": { id: "KPOS-O11", label: "四种整单规则共同生效，任一超限即拦截", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O12": { id: "KPOS-O12", label: "数量跨全部下单轮次累计，关单或重新开单后重置", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-O13": { id: "KPOS-O13", label: "额度空值、0 与正整数采用新系统明确语义", group: "order_lifetime", level: "group", coverageStatus: "product_redefined", legacyEvidenceStatus: "verified_config", gap: "旧页面默认 1、最小值 1；新系统为空值未配置、0 禁止下单、正整数为最大份数" },
    "KPOS-O14": { id: "KPOS-O14", label: "整单规则与每轮规则使用独立统计桶并可同时命中", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "verified_config" },
    "KPOS-OV01": { id: "KPOS-OV01", label: "历史每位食客规则是否确实按有效人数乘算", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime", gap: "新系统明确按有效人数乘算" },
    "KPOS-OV02": { id: "KPOS-OV02", label: "历史保存接口是否接受 0", group: "order_lifetime", level: "group", coverageStatus: "product_redefined", legacyEvidenceStatus: "pending_runtime", gap: "新系统明确 0 为禁止下单" },
    "KPOS-OV03": { id: "KPOS-OV03", label: "历史执行引擎是否对多选菜品逐菜统计", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime", gap: "新系统菜品规则逐菜统计" },
    "KPOS-OV04": { id: "KPOS-OV04", label: "修改就餐人数后整单额度如何重算", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime", gap: "新系统按校验时有效人数重算" },
    "KPOS-OV05": { id: "KPOS-OV05", label: "历史服务员授权实际放行范围", group: "order_lifetime", level: "group", coverageStatus: "complete", legacyEvidenceStatus: "pending_runtime", gap: "新系统按本次操作／当前轮／当前订单授权配置执行" },
    "KPOS-R01": { id: "KPOS-R01", label: "每轮菜品总数最少/最多", coverageStatus: "complete", level: "rule" },
    "KPOS-R02": { id: "KPOS-R02", label: "每人每轮菜品总数最少/最多", coverageStatus: "complete", level: "rule" },
    "KPOS-R03": { id: "KPOS-R03", label: "人均总量之外设置整桌每轮兜底", coverageStatus: "complete", level: "rule" },
    "KPOS-R04": { id: "KPOS-R04", label: "每轮指定菜品最多份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R05": { id: "KPOS-R05", label: "每人每轮指定菜品最多份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R06": { id: "KPOS-R06", label: "每轮指定菜品集最多总份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R07": { id: "KPOS-R07", label: "每人每轮指定菜品集最多总份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R08": { id: "KPOS-R08", label: "每轮指定菜品集最多菜品种数", coverageStatus: "complete", level: "rule" },
    "KPOS-R09": { id: "KPOS-R09", label: "每人每轮指定菜品集最多菜品种数", coverageStatus: "complete", level: "rule" },
    "KPOS-R10": { id: "KPOS-R10", label: "菜品集按份时限制相同菜品每轮最大份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R11": { id: "KPOS-R11", label: "菜品集按种时限制每种菜品最大份数", coverageStatus: "complete", level: "rule" },
    "KPOS-R12": { id: "KPOS-R12", label: "同一人数区间混合配置每轮、每人每轮规则", coverageStatus: "partial", level: "group", gap: "按桌每轮固定额度不能按人数区间变化" },
    "KPOS-R13": { id: "KPOS-R13", label: "不同人数区间使用不同总量和指定对象额度", coverageStatus: "partial", level: "group", gap: "按人数规则按人均额度乘有效人数，不能表达区间内固定整桌额度" }
  };
  var LEGACY_CAPABILITY_GROUPS = [
    { group: "order_lifetime", capabilityIds: ["KPOS-O09", "KPOS-O10", "KPOS-O11", "KPOS-O12", "KPOS-O13", "KPOS-O14"], evidenceIds: ["KPOS-OV01", "KPOS-OV02", "KPOS-OV03", "KPOS-OV04", "KPOS-OV05"] },
    { group: "per_round", capabilityIds: ["KPOS-R12", "KPOS-R13"], evidenceIds: [] }
  ];
  var DEFAULT_SCENARIOS = [
    { key: "order|order_lifetime|dish", version: 4, group: "order_lifetime", subject: "order", targetType: "dish", defaultVariant: "order_target", measureUnit: "piece", legacyCapabilityIds: ["KPOS-O01", "KPOS-O05", "KPOS-O06"], coverageStatus: "complete", name: "每个订单指定菜品限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "order|order_lifetime|dish_set", version: 4, group: "order_lifetime", subject: "order", targetType: "dish_set", defaultVariant: "order_target", measureUnit: "piece", legacyCapabilityIds: ["KPOS-O02", "KPOS-O05", "KPOS-O07", "KPOS-O08"], coverageStatus: "defined_extension", name: "每个订单指定菜品集限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "party_size|order_lifetime|dish", version: 4, group: "order_lifetime", subject: "party_size", targetType: "dish", defaultVariant: "order_target", measureUnit: "piece", legacyCapabilityIds: ["KPOS-O03", "KPOS-O05", "KPOS-O06"], coverageStatus: "complete", name: "每位食客每单指定菜品限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "party_size|order_lifetime|dish_set", version: 4, group: "order_lifetime", subject: "party_size", targetType: "dish_set", defaultVariant: "order_target", measureUnit: "piece", legacyCapabilityIds: ["KPOS-O04", "KPOS-O05", "KPOS-O07", "KPOS-O08"], coverageStatus: "defined_extension", name: "每位食客每单菜品集限制下单份数", enabledPeriods: ["order_lifetime"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "order|per_round|total", version: 1, group: "per_round", subject: "order", targetType: "dish", defaultVariant: "round_total", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R01"], coverageStatus: "complete", name: "每轮下单菜品总数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: false } },
    { key: "party_size|per_round|total", version: 1, group: "per_round", subject: "party_size", targetType: "dish", defaultVariant: "round_total", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R02", "KPOS-R03"], coverageStatus: "complete", name: "每人每轮下单菜品总数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: true, targetEnabled: false, sameDishEnabled: false } },
    { key: "order|per_round|dish", version: 3, group: "per_round", subject: "order", targetType: "dish", defaultVariant: "round_dish", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R04"], coverageStatus: "complete", name: "每轮指定菜品数量限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "party_size|per_round|dish", version: 3, group: "per_round", subject: "party_size", targetType: "dish", defaultVariant: "round_dish", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R05"], coverageStatus: "complete", name: "每人每轮指定菜品数量限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: false } },
    { key: "order|per_round|dish_set|piece", version: 1, group: "per_round", subject: "order", targetType: "dish_set", defaultVariant: "round_dish_set_piece", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R06", "KPOS-R10"], coverageStatus: "complete", name: "每轮指定菜品集按份数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } },
    { key: "party_size|per_round|dish_set|piece", version: 1, group: "per_round", subject: "party_size", targetType: "dish_set", defaultVariant: "round_dish_set_piece", measureUnit: "piece", legacyCapabilityIds: ["KPOS-R07", "KPOS-R10"], coverageStatus: "complete", name: "每人每轮指定菜品集按份数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } },
    { key: "order|per_round|dish_set|kind", version: 1, group: "per_round", subject: "order", targetType: "dish_set", defaultVariant: "round_dish_set_kind", measureUnit: "kind", legacyCapabilityIds: ["KPOS-R08", "KPOS-R11"], coverageStatus: "complete", name: "每轮指定菜品集按种数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } },
    { key: "party_size|per_round|dish_set|kind", version: 1, group: "per_round", subject: "party_size", targetType: "dish_set", defaultVariant: "round_dish_set_kind", measureUnit: "kind", legacyCapabilityIds: ["KPOS-R09", "KPOS-R11"], coverageStatus: "complete", name: "每人每轮指定菜品集按种数限制", enabledPeriods: ["per_round"], blocks: { totalEnabled: false, targetEnabled: true, sameDishEnabled: true } }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyEnvelope() {
    return {
      schemaVersion: 1,
      revision: 0,
      rules: [],
      drafts: [],
      snapshots: {},
      currentSnapshotId: null
    };
  }

  function normalizeEnvelope(value) {
    if (!value || value.schemaVersion !== 1) throw new Error("BUFFET_REPOSITORY_SCHEMA_INVALID");
    return {
      schemaVersion: 1,
      revision: Number.isInteger(value.revision) && value.revision >= 0 ? value.revision : 0,
      rules: Array.isArray(value.rules) ? value.rules : [],
      drafts: Array.isArray(value.drafts) ? value.drafts : [],
      snapshots: value.snapshots && typeof value.snapshots === "object" ? value.snapshots : {},
      currentSnapshotId: typeof value.currentSnapshotId === "string" ? value.currentSnapshotId : null
    };
  }

  function readEnvelope() {
    var raw = localStorage.getItem(REPOSITORY_KEY);
    if (!raw) return emptyEnvelope();
    try {
      return normalizeEnvelope(JSON.parse(raw));
    } catch (error) {
      var wrapped = new Error("自助餐规则数据损坏或版本不受支持");
      wrapped.code = "BUFFET_REPOSITORY_READ_ONLY";
      wrapped.cause = error;
      throw wrapped;
    }
  }

  function ownerToken() {
    return Date.now().toString(36) + ":" + Math.random().toString(36).slice(2);
  }

  function withLock(work) {
    var now = Date.now();
    var existing;
    try { existing = JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (error) { existing = null; }
    if (existing && existing.expiresAt > now) throw new Error("BUFFET_REPOSITORY_BUSY");
    var token = ownerToken();
    localStorage.setItem(LOCK_KEY, JSON.stringify({ owner: token, expiresAt: now + LOCK_TTL }));
    var acquired = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
    if (!acquired || acquired.owner !== token) throw new Error("BUFFET_REPOSITORY_BUSY");
    try {
      return work();
    } finally {
      var current;
      try { current = JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (error) { current = null; }
      if (current && current.owner === token) localStorage.removeItem(LOCK_KEY);
    }
  }

  function mutateEnvelope(expectedRevision, mutator) {
    return withLock(function () {
      var current = readEnvelope();
      if (expectedRevision != null && current.revision !== expectedRevision) {
        var conflict = new Error("自助餐规则已在其他页面更新，请刷新后重试");
        conflict.code = "BUFFET_REPOSITORY_REVISION_CONFLICT";
        throw conflict;
      }
      var mutated = mutator(clone(current));
      if (mutated === false) return clone(current);
      var next = normalizeEnvelope(mutated || current);
      next.revision = current.revision + 1;
      localStorage.setItem(REPOSITORY_KEY, JSON.stringify(next));
      return clone(next);
    });
  }

  function defaultTemplate(key) {
    return DEFAULT_SCENARIOS.find(function (scenario) { return scenario.key === key; }) || null;
  }

  function canonicalDefaultKey(subject, period, targetType) {
    var key = [subject, period, targetType].join("|");
    return defaultTemplate(key) ? key : "";
  }

  function systemIdentity(rule) {
    var draft = rule && (rule.authoringConfig || rule.authoringDraft || rule.editorDraft) || {};
    return {
      origin: rule && (rule.origin || draft.origin),
      key: String(rule && (rule.defaultScenarioKey || draft.defaultScenarioKey) || ""),
      version: Number(rule && (rule.defaultCatalogVersion || draft.defaultCatalogVersion) || 0)
    };
  }

  function exactDefaultKey(rule) {
    var identity = systemIdentity(rule);
    var template = defaultTemplate(identity.key);
    return identity.origin === "system_default" && template && identity.version === template.version ? template.key : "";
  }

  function verifiedLegacyDefaultKey(rule) {
    var identity = systemIdentity(rule);
    var parts = identity.key.split("|");
    var legacyVersion = Number(identity.version || 1);
    if (identity.origin !== "system_default" || legacyVersion !== 1 || parts.length !== 2) return "";
    return canonicalDefaultKey(parts[0], "order_lifetime", parts[1]);
  }

  function snapshotContainsRule(snapshot, rule) {
    var id = rule && rule.id;
    if (id == null) return false;
    if (!snapshot || typeof snapshot !== "object") return false;
    return [snapshot.rules, snapshot.publishedRules, snapshot.runtimeRules].some(function (rules) {
      return Array.isArray(rules) && rules.some(function (snapshotRule) {
        return snapshotRule && (snapshotRule.id === id || snapshotRule.ruleId === id || snapshotRule.sourceRuleId === id);
      });
    });
  }

  function currentSnapshotReferencesRule(envelope, rule) {
    var id = envelope && envelope.currentSnapshotId;
    return !!(id && envelope.snapshots && snapshotContainsRule(envelope.snapshots[id], rule));
  }

  function historicalSnapshotReferencesRule(envelope, rule) {
    return Object.keys(envelope && envelope.snapshots || {}).some(function (snapshotId) {
      return snapshotId !== envelope.currentSnapshotId && snapshotContainsRule(envelope.snapshots[snapshotId], rule);
    });
  }

  function authoringCopies(rule) {
    return [rule, rule && rule.authoringConfig, rule && rule.authoringDraft, rule && rule.editorDraft].filter(function (value, index, values) {
      return value && typeof value === "object" && values.indexOf(value) === index;
    });
  }

  function hasValues(value) {
    if (Array.isArray(value)) return value.length > 0;
    return !!(value && typeof value === "object" && Object.keys(value).length);
  }

  function nestedCollectionHasValues(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) { return nestedCollectionHasValues(value[key]); });
  }

  function legacyDefaultName(rule) {
    var key = systemIdentity(rule).key;
    return {
      "order|category": "按桌/订单·按分类限购", "order|dish": "按桌/订单·按菜品限购",
      "order|dish_set": "按桌/订单·按菜品集限购", "party_size|category": "按人数·按分类限购",
      "party_size|dish": "按人数·按菜品限购", "party_size|dish_set": "按人数·按菜品集限购"
    }[key] || "";
  }

  function hasNonBaselineValue(value, baseline) {
    if (value == null || value === "") return false;
    if (Array.isArray(value)) {
      if (!value.length) return false;
      if (!Array.isArray(baseline) || !baseline.length || value.length !== baseline.length) return true;
      return value.some(function (item, index) { return hasNonBaselineValue(item, baseline[index]); });
    }
    if (value && typeof value === "object") {
      var keys = Object.keys(value);
      if (!keys.length) return false;
      if (!baseline || typeof baseline !== "object" || Array.isArray(baseline)) {
        return keys.some(function (key) { return hasNonBaselineValue(value[key], undefined); });
      }
      return keys.some(function (key) { return hasNonBaselineValue(value[key], baseline[key]); });
    }
    if (baseline === undefined) return value === false ? false : true;
    return value !== baseline;
  }

  function legacyPeriodPoliciesBaseline() {
    var blocks = { totalEnabled: false, targetEnabled: true, sameDishEnabled: false };
    return {
      order_lifetime: { enabled: true, blocks: clone(blocks) },
      per_round: { enabled: false, blocks: clone(blocks) },
      multi_round: { enabled: false, blocks: clone(blocks) }
    };
  }

  function legacyPeriodValuesBaseline() {
    function emptyPeriod() {
      return {
        totalBounds: {}, tableTotalBounds: {}, targetLimits: {}, tableTargetCaps: {},
        defaultDishLimits: {}, exceptionDishLimits: {}
      };
    }
    return { order_lifetime: emptyPeriod(), per_round: emptyPeriod(), multi_round: emptyPeriod() };
  }

  function legacyConditionsBaseline(createdDate) {
    return {
      effectiveFrom: createdDate || "", effectiveTo: "", activityCycle: "weekly",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7], daysOfMonth: [],
      businessHourSlots: [{ id: "dinner", mode: "full", from: "", to: "" }],
      businessHourSetupMode: "all_full", businessHour: "dinner", businessHourTimeMode: "full",
      businessHourFrom: "", businessHourTo: "", memberMode: "all", memberLevelIds: [], childCountPolicy: "inherit"
    };
  }

  function legacyAuthorizationBaseline() {
    return {
      enabled: true, allowedScopes: ["operation", "round", "order"], defaultScope: "round",
      scopePermissions: { operation: "值班经理", round: "主管", order: "店长" }, reasonRequired: true
    };
  }

  function hasCustomLegacyConditions(value, createdDate) {
    return hasNonBaselineValue(value && value.conditions, legacyConditionsBaseline(createdDate));
  }

  function hasCustomLegacyAuthorization(value) {
    return hasNonBaselineValue(value && value.authorization, legacyAuthorizationBaseline());
  }

  function nonEmptyValue(value) {
    if (value == null || value === "" || value === false) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  function hasCustomLegacyPeriodPolicies(value) {
    return hasNonBaselineValue(value && value.periodPolicies, legacyPeriodPoliciesBaseline());
  }

  function configuredFieldScore(rule, envelope) {
    var score = 0;
    var createdDate = String(rule && (rule.created || rule.createdAt) || "").slice(0, 10);
    var initialName = legacyDefaultName(rule);
    var arrays = ["participatingStoreIds", "deployStoreIds", "deployExcludedStoreIds", "productLines", "targetIds",
      "selectedCategories", "selectedDishes", "dishSetMembers", "memberLevelIds", "personRanges", "rounds"];
    var maps = ["storeConfigs", "limits", "dishSetLimits", "quantitySettings"];
    authoringCopies(rule).forEach(function (copy) {
      arrays.forEach(function (field) { if (hasValues(copy[field])) score += 1; });
      maps.forEach(function (field) { if (hasValues(copy[field])) score += 2; });
      if (nestedCollectionHasValues(copy.structureByLine)) score += 2;
      if (nestedCollectionHasValues(copy.legacyCompatibilityFallback)) score += 2;
      Object.keys(copy.periodValues || {}).forEach(function (period) {
        var values = copy.periodValues[period] || {};
        ["totalLimits", "tableTotalLimits", "targetLimits", "sameDishLimits"].forEach(function (field) {
          if (hasConfiguredCellMap(values[field])) score += 2;
        });
      });
      if (hasNonBaselineValue(copy.periodValues, legacyPeriodValuesBaseline())) score += 2;
      if (Array.isArray(copy.enabledPeriods) && (copy.enabledPeriods.length !== 1 || copy.enabledPeriods[0] !== "order_lifetime")) score += 2;
      if (Array.isArray(copy.partyRanges) && (copy.partyRanges.length !== 1 || Number(copy.partyRanges[0].min) !== 1 || copy.partyRanges[0].max != null)) score += 1;
      if (Array.isArray(copy.roundRanges) && (copy.roundRanges.length !== 1 || Number(copy.roundRanges[0].min) !== 1 || copy.roundRanges[0].max != null)) score += 1;
      if (String(copy.description || "")) score += 2;
      if (copy.name && copy.name !== initialName) score += 2;
      if (copy.activeStoreId) score += 1;
      if (copy.currentStep != null && Number(copy.currentStep) !== 1) score += 1;
      if (copy.highestStep != null && Number(copy.highestStep) !== 1) score += 1;
      if (copy.deploymentSelectionVersion != null && Number(copy.deploymentSelectionVersion) !== 1) score += 1;
      if (copy.productQuantityMergedVersion != null && Number(copy.productQuantityMergedVersion) !== 2) score += 1;
      if (copy.measureUnit != null && copy.measureUnit !== "piece") score += 1;
      if (hasCustomLegacyPeriodPolicies(copy)) score += 2;
      if (hasCustomLegacyConditions(copy, createdDate)) score += 2;
      if (hasCustomLegacyAuthorization(copy)) score += 2;
      if (copy.publishedSnapshotVersion != null || copy.publishedConfig || copy.publishedAt || copy.runtimeSnapshotId || copy.runtimeSnapshotRef || copy.runtimeSnapshotVersion != null) score += 16;
      ["publicationHistory", "deploymentHistory", "releaseHistory", "versionReferences", "downstreamReferences",
        "authorizationRecords", "authorizationHistory", "authorizationCredentials", "runtimeCounters", "processedOperationIds"].forEach(function (field) {
        if (hasValues(copy[field])) score += 16;
      });
      if (hasUnknownLegacyBusinessData(copy)) score += 64;
    });
    if (rule && rule.status === "active") score += 8;
    return score;
  }

  function hasUnknownLegacyBusinessData(copy) {
    var known = {
      id: true, status: true, origin: true, defaultScenarioKey: true, defaultCatalogVersion: true,
      schemaVersion: true, currentStep: true, highestStep: true, name: true, description: true,
      created: true, createdAt: true, updatedAt: true, type: true, round: true, method: true, persons: true, dishes: true,
      subject: true, period: true, enabledPeriods: true, periodPolicies: true, targetType: true, measureUnit: true,
      partyRanges: true, roundRanges: true, personRanges: true, rounds: true,
      activePartyIndex: true, activeRoundIndex: true, activeLineId: true, activeStoreId: true,
      participatingStoreIds: true, deployStoreIds: true, deployExcludedStoreIds: true,
      productLines: true, targetIds: true, selectedCategories: true, selectedDishes: true, dishSetMembers: true, memberLevelIds: true,
      structureByLine: true, storeConfigs: true, limits: true, dishSetLimits: true, quantitySettings: true, periodValues: true,
      conditions: true, authorization: true, legacyCompatibilityFallback: true,
      authoringConfig: true, authoringDraft: true, editorDraft: true,
      publishedSnapshotVersion: true, publishedConfig: true, publishedAt: true,
      runtimeSnapshotId: true, runtimeSnapshotRef: true, runtimeSnapshotVersion: true,
      publicationHistory: true, deploymentHistory: true, releaseHistory: true, versionReferences: true,
      downstreamReferences: true, authorizationRecords: true, authorizationHistory: true, authorizationCredentials: true,
      runtimeCounters: true, processedOperationIds: true, deploymentSelectionVersion: true, productQuantityMergedVersion: true
    };
    return Object.keys(copy || {}).some(function (field) {
      if (known[field]) return false;
      var value = copy[field];
      return nonEmptyValue(value);
    });
  }

  function isUntouchedLegacyDefault(rule, envelope) {
    var candidateIdentity = systemIdentity(rule);
    if (!verifiedLegacyDefaultKey(rule) && !(candidateIdentity.origin === "system_default" && Number(candidateIdentity.version || 1) === 1 && candidateIdentity.key.split("|").length === 2)) return false;
    if (!rule || rule.status !== "disabled" || configuredFieldScore(rule, envelope) !== 0) return false;
    return !currentSnapshotReferencesRule(envelope, rule) && !historicalSnapshotReferencesRule(envelope, rule);
  }

  function hasDraftReference(envelope, rule) {
    var id = rule && rule.id;
    return id != null && (envelope.drafts || []).some(function (draft) {
      return String(draft && (draft.sourceRuleId != null ? draft.sourceRuleId : draft.ruleId)) === String(id);
    });
  }

  function obsoleteV2DefaultKey(rule) {
    var identity = systemIdentity(rule);
    if (identity.origin !== "system_default" || identity.version !== 2) return "";
    return [
      "order|order_lifetime|dish", "order|order_lifetime|dish_set", "party_size|order_lifetime|dish", "party_size|order_lifetime|dish_set",
      "order|per_round|dish", "order|per_round|dish_set", "party_size|per_round|dish", "party_size|per_round|dish_set"
    ].indexOf(identity.key) >= 0 ? identity.key : "";
  }

  function blankV2Default(rule, envelope) {
    var copies = authoringCopies(rule);
    var hasScope = copies.some(function (copy) {
      return ["participatingStoreIds", "deployStoreIds", "targetIds", "productLines", "dishSetMembers"].some(function (field) { return hasValues(copy[field]); }) ||
        ["storeConfigs", "limits", "dishSetLimits", "quantitySettings"].some(function (field) { return nestedCollectionHasValues(copy[field]); }) ||
        Object.keys(copy.periodValues || {}).some(function (period) {
          var values = copy.periodValues[period] || {};
          return ["totalBounds", "tableTotalBounds", "targetLimits", "tableTargetCaps", "defaultDishLimits", "exceptionDishLimits"].some(function (field) { return hasConfiguredCellMap(values[field]); });
        });
    });
    return rule && rule.status === "disabled" && !hasScope && !currentSnapshotReferencesRule(envelope, rule) && !historicalSnapshotReferencesRule(envelope, rule);
  }

  function stripSystemIdentity(rule) {
    [rule, rule && rule.authoringConfig, rule && rule.authoringDraft, rule && rule.editorDraft].forEach(function (value) {
      if (!value || typeof value !== "object") return;
      delete value.origin;
      delete value.defaultScenarioKey;
      delete value.defaultCatalogVersion;
    });
    return rule;
  }

  function setSystemIdentity(rule, key) {
    [rule, rule && rule.authoringConfig, rule && rule.authoringDraft, rule && rule.editorDraft].forEach(function (value) {
      if (!value || typeof value !== "object") return;
      value.origin = "system_default";
      value.defaultScenarioKey = key;
      value.defaultCatalogVersion = (defaultTemplate(key) || {}).version || 0;
    });
    return rule;
  }

  function legacySemanticsMatch(rule, key) {
    var parts = key.split("|");
    var semanticCopies = authoringCopies(rule).filter(function (copy) {
      return copy.subject != null || copy.targetType != null || copy.period != null || Array.isArray(copy.enabledPeriods);
    });
    return semanticCopies.length > 0 && semanticCopies.every(function (copy) {
      var periods = Array.isArray(copy.enabledPeriods) && copy.enabledPeriods.length ? copy.enabledPeriods : [copy.period || "order_lifetime"];
      return copy.subject === parts[0] && copy.targetType === parts[2] && periods.length === 1 && periods[0] === "order_lifetime";
    });
  }

  function candidateRank(rule, envelope) {
    var currentSnapshot = currentSnapshotReferencesRule(envelope, rule);
    var historicalSnapshot = historicalSnapshotReferencesRule(envelope, rule);
    var published = authoringCopies(rule).some(function (copy) {
      return copy.publishedSnapshotVersion != null || !!copy.publishedConfig || !!copy.publishedAt;
    });
    var active = rule.status === "active";
    var configured = configuredFieldScore(rule, envelope);
    var created = Date.parse(rule.created || rule.createdAt || "") || Number.MAX_SAFE_INTEGER;
    var id = Number(rule.id);
    return [currentSnapshot ? 1 : 0, published ? 1 : 0, historicalSnapshot ? 1 : 0, active ? 1 : 0, configured, -created, Number.isFinite(id) ? -id : -Number.MAX_SAFE_INTEGER];
  }

  function compareCandidates(left, right, envelope) {
    var a = candidateRank(left, envelope);
    var b = candidateRank(right, envelope);
    for (var index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return b[index] - a[index];
    return 0;
  }

  function reconcileDefaultRules(envelope, factory) {
    var next = clone(envelope);
    var before = JSON.stringify(next);
    var groups = {};
    var retained = [];
    var deferredCovered = {};
    next.rules.forEach(function (rule) {
      var exact = exactDefaultKey(rule);
      var legacy = verifiedLegacyDefaultKey(rule);
      var obsolete = obsoleteV2DefaultKey(rule);
      var identity = systemIdentity(rule);
      if (!exact && legacy && hasDraftReference(next, rule)) {
        retained.push(rule);
        deferredCovered[legacy] = true;
        return;
      }
      if (obsolete) {
        if (hasDraftReference(next, rule)) {
          retained.push(rule);
          return;
        }
        if (obsolete.indexOf("|order_lifetime|") >= 0) {
          if (!groups[obsolete]) groups[obsolete] = [];
          groups[obsolete].push(rule);
          return;
        }
        var upgradedKey = obsolete;
        if (/\|dish_set$/.test(obsolete)) upgradedKey += ((rule.authoringConfig || rule.editorDraft || rule).measureUnit === "kind" ? "|kind" : "|piece");
        if (blankV2Default(rule, next)) {
          var upgradedTemplate = defaultTemplate(upgradedKey);
          authoringCopies(rule).forEach(function (copy) {
            copy.measureUnit = upgradedTemplate.measureUnit;
            copy.enabledPeriods = clone(upgradedTemplate.enabledPeriods);
            copy.period = upgradedTemplate.enabledPeriods[0];
            copy.periodPolicies = copy.periodPolicies || {};
            copy.periodPolicies[copy.period] = { enabled: true, blocks: clone(upgradedTemplate.blocks) };
          });
          if (!groups[upgradedKey]) groups[upgradedKey] = [];
          groups[upgradedKey].push(rule);
        } else retained.push(stripSystemIdentity(rule));
        return;
      }
      var isLegacyCategory = identity.origin === "system_default" && Number(identity.version || 1) === 1 && /\|category$/.test(identity.key);
      if (isLegacyCategory) {
        if (!isUntouchedLegacyDefault(rule, next)) retained.push(stripSystemIdentity(rule));
        return;
      }
      if (legacy && !legacySemanticsMatch(rule, legacy)) {
        retained.push(stripSystemIdentity(rule));
        return;
      }
      var key = exact || legacy;
      if (!key) {
        retained.push(rule);
        return;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(rule);
    });
    Object.keys(groups).forEach(function (key) {
      var candidates = groups[key].sort(function (left, right) { return compareCandidates(left, right, next); });
      retained.push(setSystemIdentity(candidates[0], key));
      candidates.slice(1).forEach(function (candidate) {
        if (!isUntouchedLegacyDefault(candidate, next)) retained.push(stripSystemIdentity(candidate));
      });
    });
    next.rules = retained;
    var covered = {};
    next.rules.forEach(function (rule) { var key = exactDefaultKey(rule); if (key) covered[key] = true; });
    Object.keys(deferredCovered).forEach(function (key) { covered[key] = true; });
    next.rules.forEach(function (rule) {
      var oldKey = obsoleteV2DefaultKey(rule);
      if (!oldKey || !hasDraftReference(next, rule)) return;
      if (oldKey.indexOf("|order_lifetime|") >= 0) covered[oldKey] = true;
      else if (/\|dish$/.test(oldKey)) covered[oldKey] = true;
      else {
        var unit = (rule.authoringConfig || rule.editorDraft || rule).measureUnit;
        if (unit === "piece" || unit === "kind") covered[oldKey + "|" + unit] = true;
        else { covered[oldKey + "|piece"] = true; covered[oldKey + "|kind"] = true; }
      }
    });
    var id = nextNumericId(next);
    DEFAULT_SCENARIOS.forEach(function (scenario) {
      if (!covered[scenario.key]) next.rules.push(factory(clone(scenario), id++));
    });
    return { changed: before !== JSON.stringify(next), envelope: next };
  }

  function nextNumericId(envelope) {
    return envelope.rules.concat(envelope.drafts).reduce(function (max, rule) {
      var id = Number(rule && rule.id);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0) + 1;
  }

  function today() {
    var now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function hasConfiguredCellMap(value) {
    if (!value || typeof value !== "object") return false;
    return Object.keys(value).some(function (key) {
      var cell = value[key];
      if (Array.isArray(cell)) return cell.length > 0;
      return !!(cell && typeof cell === "object" && (
        cell.configured === true || cell.minConfigured === true || cell.maxConfigured === true
      ));
    });
  }

  function configuredLimit(cell) {
    var value = cell && cell.configured === true ? Number(cell.value) : NaN;
    return Number.isInteger(value) && value >= 0 && value <= 999999;
  }

  function configuredBound(cell, field) {
    var value = cell && cell[field + "Configured"] === true ? Number(cell[field]) : NaN;
    return Number.isInteger(value) && value >= 0 && value <= 999999;
  }

  function validRanges(ranges) {
    if (!Array.isArray(ranges) || !ranges.length) return false;
    var previousMax = 0;
    for (var index = 0; index < ranges.length; index += 1) {
      var range = ranges[index] || {};
      var min = Number(range.min);
      var max = range.max == null || range.max === "" ? null : Number(range.max);
      if (!Number.isInteger(min) || min < 1 || (max != null && (!Number.isInteger(max) || max < min))) return false;
      if (index && min !== previousMax + 1) return false;
      if (max == null && index !== ranges.length - 1) return false;
      previousMax = max;
    }
    return true;
  }

  function scenarioKey(partyIndex, roundIndex) {
    return window.BuffetRulePolicy && window.BuffetRulePolicy.scenarioKey
      ? window.BuffetRulePolicy.scenarioKey(partyIndex, roundIndex)
      : [partyIndex, roundIndex].join("|");
  }

  function targetKey(partyIndex, roundIndex, lineId, targetId) {
    return window.BuffetRulePolicy && window.BuffetRulePolicy.targetCellKey
      ? window.BuffetRulePolicy.targetCellKey(partyIndex, roundIndex, lineId, targetId)
      : [partyIndex, roundIndex, lineId, targetId].join("|");
  }

  function exceptionEligibleKeys(draft, config) {
    var eligible = {};
    var add = function (item) {
      if (item && item.productLineId != null && item.dishId != null) eligible[String(item.productLineId) + "|" + String(item.dishId)] = true;
    };
    if (draft.targetType === "dish") (config.dishTargets || []).forEach(add);
    else if (draft.targetType === "dish_set") (config.dishSetMembers || []).forEach(add);
    else {
      var categories = {};
      (config.categoryTargets || []).forEach(function (item) { categories[String(item.productLineId) + "|" + String(item.categoryId)] = true; });
      Object.keys(config.structureByLine || {}).forEach(function (lineId) {
        var visit = function (entry) {
          if (!entry || typeof entry !== "object") return;
          var dishId = entry.dishId || entry.id;
          var categoryId = entry.categoryId || entry.categoryKey || entry.category || "";
          if (dishId && categories[lineId + "|" + String(categoryId)]) add({ productLineId: lineId, dishId: dishId });
          (Array.isArray(entry.children) ? entry.children : []).forEach(visit);
        };
        (Array.isArray(config.structureByLine[lineId]) ? config.structureByLine[lineId] : []).forEach(visit);
      });
    }
    return eligible;
  }

  // 此校验同时服务于发布与列表重新启用：不能只因存在一个 map 就允许生效。
  function validateV4Publication(draft) {
    if (!usesV4Capability(draft)) return { valid: true, message: "" };
    var periods = Array.isArray(draft.enabledPeriods) ? draft.enabledPeriods : [];
    if (!periods.length) return { valid: false, message: "请至少启用一个限制周期" };
    if (draft.subject === "party_size" && !validRanges(draft.partyRanges)) return { valid: false, message: "人数区间必须连续且有效" };
    if (periods.indexOf("multi_round") >= 0 && !validRanges(draft.roundRanges)) return { valid: false, message: "轮次区间必须连续且有效" };
    var deployIds = Array.isArray(draft.deployStoreIds) ? draft.deployStoreIds : [];
    for (var periodIndex = 0; periodIndex < periods.length; periodIndex += 1) {
      var period = periods[periodIndex];
      var blocks = draft.periodPolicies && draft.periodPolicies[period] && draft.periodPolicies[period].blocks;
      if (!blocks || !(blocks.totalEnabled || blocks.targetEnabled || blocks.sameDishEnabled)) return { valid: false, message: "每个启用周期至少保留一个限购维度" };
    }
    for (var storeIndex = 0; storeIndex < deployIds.length; storeIndex += 1) {
      var config = draft.storeConfigs && draft.storeConfigs[deployIds[storeIndex]];
      if (!config) return { valid: false, message: "生效门店缺少商品与数量配置" };
      if (draft.targetType === "dish_set" && (!Array.isArray(config.dishSetMembers) || config.dishSetMembers.length < 2)) return { valid: false, message: "每家参与门店的菜品集至少需要 2 个菜品" };
      for (var pi = 0; pi < periods.length; pi += 1) {
        var currentPeriod = periods[pi];
        var currentBlocks = draft.periodPolicies[currentPeriod].blocks || {};
        var values = config.periodValues && config.periodValues[currentPeriod] || {};
        var partyCount = draft.subject === "party_size" ? (draft.partyRanges || []).length : 1;
        var roundCount = currentPeriod === "multi_round" ? (draft.roundRanges || []).length : 1;
        for (var partyIndex = 0; partyIndex < partyCount; partyIndex += 1) for (var roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
          var scenario = scenarioKey(partyIndex, roundIndex);
          if (currentPeriod !== "order_lifetime" && currentBlocks.totalEnabled) {
            var total = values.totalBounds && values.totalBounds[scenario];
            var minSet = configuredBound(total, "min"), maxSet = configuredBound(total, "max");
            if (!minSet && !maxSet) return { valid: false, message: "已启用的菜品总数需要至少配置一个上下限" };
            if ((total && total.minConfigured && !minSet) || (total && total.maxConfigured && !maxSet) || (minSet && maxSet && Number(total.min) > Number(total.max))) return { valid: false, message: "菜品总数上下限无效" };
            var table = values.tableTotalBounds && values.tableTotalBounds[scenario];
            if (table && (table.minConfigured || table.maxConfigured) && (!configuredBound(table, "min") && !configuredBound(table, "max") || (configuredBound(table, "min") && configuredBound(table, "max") && Number(table.min) > Number(table.max)))) return { valid: false, message: "整桌兜底数量无效" };
          }
          if (currentBlocks.targetEnabled) {
            var targetKeys;
            if (draft.targetType === "dish_set") targetKeys = [scenario];
            else {
              var targets = draft.targetType === "category" ? (config.categoryTargets || []) : (config.dishTargets || []);
              targetKeys = targets.map(function (target) { return targetKey(partyIndex, roundIndex, target.productLineId, draft.targetType === "category" ? target.categoryId : target.dishId); });
            }
            if (!targetKeys.length || targetKeys.some(function (key) { return !configuredLimit(values.targetLimits && values.targetLimits[key]); })) return { valid: false, message: "已启用的指定对象额度尚未全部配置" };
          }
          if (currentPeriod !== "order_lifetime" && currentBlocks.sameDishEnabled) {
            var defaultLimit = values.defaultDishLimits && values.defaultDishLimits[scenario];
            var exceptions = values.exceptionDishLimits && values.exceptionDishLimits[scenario];
            var seen = {};
            var eligible = exceptionEligibleKeys(draft, config);
            var hasException = false;
            for (var exceptionIndex = 0; exceptionIndex < (Array.isArray(exceptions) ? exceptions.length : 0); exceptionIndex += 1) {
              var row = exceptions[exceptionIndex];
              var dishes = row && Array.isArray(row.dishes) ? row.dishes : row && row.dish ? [row.dish] : [];
              var dish = dishes[0];
              var key = dish && String(dish.productLineId || "") + "|" + String(dish.dishId || "");
              if (dishes.length !== 1 || !key || !eligible[key]) return { valid: false, message: "例外商品必须来自当前规则商品范围" };
              if (seen[key]) return { valid: false, message: "同一菜品不能重复添加为例外商品" };
              seen[key] = true;
              if (!configuredLimit(row.limit)) return { valid: false, message: "例外商品上限未配置" };
              hasException = true;
            }
            if (!configuredLimit(defaultLimit) && !hasException) return { valid: false, message: "单品保护需要配置默认上限或至少一个例外商品" };
          }
        }
      }
    }
    return { valid: true, message: "" };
  }

  function validatePublicationBasics(draft) {
    if (!draft || !String(draft.name || "").trim()) return { valid: false, message: "请输入规则名称" };
    if (!draft.subject || !draft.targetType) return { valid: false, message: "请选择限购主体和限购对象" };
    var deployIds = Array.isArray(draft.deployStoreIds) ? draft.deployStoreIds : [];
    if (!deployIds.length) return { valid: false, message: "请至少选择一家生效门店" };
    var requiresTargets = (Array.isArray(draft.enabledPeriods) ? draft.enabledPeriods : []).some(function (period) {
      var blocks = draft.periodPolicies && draft.periodPolicies[period] && draft.periodPolicies[period].blocks;
      return !!(blocks && (blocks.targetEnabled || blocks.sameDishEnabled));
    });
    for (var index = 0; index < deployIds.length; index += 1) {
      var config = draft.storeConfigs && draft.storeConfigs[deployIds[index]];
      var selected = draft.targetType === "dish" ? config && config.dishTargets : draft.targetType === "category" ? config && config.categoryTargets : config && config.dishSetMembers;
      if (requiresTargets && (!Array.isArray(selected) || !selected.length)) return { valid: false, message: "请至少选择一个分类或菜品" };
    }
    var authorization = draft.authorization || {};
    if (authorization.enabled) {
      var scopes = Array.isArray(authorization.allowedScopes) ? authorization.allowedScopes : [];
      if (!scopes.length) return { valid: false, message: "请至少启用一种授权范围" };
      if (scopes.indexOf(authorization.defaultScope) < 0) return { valid: false, message: "默认授权范围必须属于已启用范围" };
      if (scopes.some(function (scope) { return !(authorization.scopePermissions && authorization.scopePermissions[scope]); })) return { valid: false, message: "请为每种授权范围选择所需权限" };
    }
    var conditions = draft.conditions || {};
    if (conditions.activityCycle === "weekly" && (!Array.isArray(conditions.daysOfWeek) || !conditions.daysOfWeek.length)) return { valid: false, message: "请至少选择一个生效星期" };
    if (conditions.activityCycle === "monthly" && (!Array.isArray(conditions.daysOfMonth) || !conditions.daysOfMonth.length)) return { valid: false, message: "请至少选择一个生效日期" };
    if (conditions.memberMode === "specified" && (!Array.isArray(conditions.memberLevelIds) || !conditions.memberLevelIds.length)) return { valid: false, message: "请至少选择一个会员等级" };
    if (conditions.effectiveTo && conditions.effectiveFrom && conditions.effectiveFrom > conditions.effectiveTo) return { valid: false, message: "结束日期不能早于开始日期" };
    var slots = Array.isArray(conditions.businessHourSlots) ? conditions.businessHourSlots : [];
    if (slots.some(function (slot) { return slot && slot.mode === "custom" && (!/^\d{2}:\d{2}$/.test(String(slot.from || "")) || !/^\d{2}:\d{2}$/.test(String(slot.to || "")) || String(slot.from) >= String(slot.to)); })) return { valid: false, message: "营业时间段无效" };
    return { valid: true, message: "" };
  }

  function usesV4Capability(draft) {
    if (!draft || typeof draft !== "object") return false;
    if (Number(draft.schemaVersion) >= 4 || Array.isArray(draft.enabledPeriods) || draft.measureUnit === "kind") return true;
    if (draft.periodPolicies && Object.keys(draft.periodPolicies).some(function (period) {
      var blocks = draft.periodPolicies[period] && draft.periodPolicies[period].blocks;
      return !!(blocks && (blocks.totalEnabled || blocks.sameDishEnabled));
    })) return true;
    var capabilityMaps = ["tableTotalBounds", "tableTargetCaps", "totalBounds", "defaultDishLimits", "exceptionDishLimits"];
    if (capabilityMaps.some(function (field) { return hasConfiguredCellMap(draft[field]); })) return true;
    return Object.keys(draft.storeConfigs || {}).some(function (storeId) {
      var config = draft.storeConfigs[storeId] || {};
      if (capabilityMaps.some(function (field) { return hasConfiguredCellMap(config[field]); })) return true;
      return Object.keys(config.periodValues || {}).some(function (period) {
        var values = config.periodValues[period] || {};
        return capabilityMaps.some(function (field) { return hasConfiguredCellMap(values[field]); });
      });
    });
  }

  function upgradeDraftToV4(draft) {
    if (!window.BuffetRulePolicy || typeof window.BuffetRulePolicy.normalizeRule !== "function") {
      throw new Error("BUFFET_V4_POLICY_REQUIRED");
    }
    var prepared = clone(draft || {});
    prepared.storeConfigs = prepared.storeConfigs && typeof prepared.storeConfigs === "object"
      ? prepared.storeConfigs
      : {};
    var rootFallback = {
      structureByLine: clone(prepared.structureByLine || { kiosk: [], emenu: [], sdi: [] }),
      productLines: clone(prepared.productLines || []),
      targetIds: clone(prepared.targetIds || []),
      limits: clone(prepared.limits || {}),
      dishSetMembers: clone(prepared.dishSetMembers || []),
      dishSetLimits: clone(prepared.dishSetLimits || {})
    };
    (Array.isArray(prepared.deployStoreIds) ? prepared.deployStoreIds : []).forEach(function (storeId) {
      if (!storeId || prepared.storeConfigs[storeId]) return;
      prepared.storeConfigs[storeId] = clone(rootFallback);
    });
    var upgraded = window.BuffetRulePolicy.normalizeRule(prepared);
    var period = ALLOWED_PERIODS.indexOf(prepared.period) >= 0 ? prepared.period : "order_lifetime";
    if (!upgraded.enabledPeriods.length) upgraded.enabledPeriods = [period];
    ALLOWED_PERIODS.forEach(function (periodKey) {
      upgraded.periodPolicies[periodKey].enabled = upgraded.enabledPeriods.indexOf(periodKey) >= 0;
    });
    Object.keys(upgraded.storeConfigs || {}).forEach(function (storeId) {
      var original = prepared.storeConfigs[storeId] || {};
      var config = upgraded.storeConfigs[storeId];
      var legacyCells = prepared.targetType === "dish_set" ? original.dishSetLimits : original.limits;
      if (!legacyCells || typeof legacyCells !== "object") return;
      var targetLimits = config.periodValues[period].targetLimits;
      Object.keys(legacyCells).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(targetLimits, key)) targetLimits[key] = clone(legacyCells[key]);
      });
    });
    upgraded.schemaVersion = 4;
    return upgraded;
  }

  function createDefaultScenarioRule(scenario, id) {
    var created = today();
    var defaultScenario = DEFAULT_SCENARIOS.find(function (item) {
      return item.key === scenario.key;
    }) || scenario;
    var scenarioKey = defaultScenario.key;
    var scenarioName = defaultScenario.name || "自助餐限购规则";
    var enabledPeriods = clone(defaultScenario.enabledPeriods || ["order_lifetime"]);
    var period = enabledPeriods[0] || "order_lifetime";
    var periodPolicies = {};
    enabledPeriods.forEach(function (periodKey) {
      periodPolicies[periodKey] = { enabled: true, blocks: clone(defaultScenario.blocks || {}) };
    });
    var draft = upgradeDraftToV4({
      schemaVersion: 4,
      currentStep: 1, highestStep: 1,
      origin: "system_default", defaultScenarioKey: scenarioKey, defaultCatalogVersion: defaultScenario.version,
      subject: defaultScenario.subject, period: period, enabledPeriods: enabledPeriods, periodPolicies: periodPolicies, targetType: defaultScenario.targetType, measureUnit: defaultScenario.measureUnit,
      name: scenarioName, description: "",
      structureByLine: { kiosk: [], emenu: [], sdi: [] }, productLines: [], targetIds: [],
      partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }],
      limits: {}, activePartyIndex: 0, activeRoundIndex: 0, activeLineId: "kiosk",
      conditions: {
        effectiveFrom: created, effectiveTo: "", activityCycle: "weekly",
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7], daysOfMonth: [],
        businessHourSlots: [{ id: "dinner", mode: "full", from: "", to: "" }],
        businessHourSetupMode: "all_full", businessHour: "dinner", businessHourTimeMode: "full",
        businessHourFrom: "", businessHourTo: "", memberMode: "all", memberLevelIds: [], childCountPolicy: "inherit"
      },
      authorization: {
        enabled: true, allowedScopes: ["operation", "round", "order"], defaultScope: "round",
        scopePermissions: { operation: "值班经理", round: "主管", order: "店长" }, reasonRequired: true
      },
      participatingStoreIds: [], activeStoreId: "", storeConfigs: {}, deployStoreIds: [], deployExcludedStoreIds: [],
      deploymentSelectionVersion: 1,
      legacyCompatibilityFallback: { structureByLine: { kiosk: [], emenu: [], sdi: [] }, productLines: [], targetIds: [], limits: {} },
      productQuantityMergedVersion: 2
    });
    return {
      id: id, name: scenarioName, description: "", status: "disabled", created: created, updatedAt: new Date().toISOString(),
      origin: "system_default", defaultScenarioKey: scenarioKey, defaultCatalogVersion: defaultScenario.version, publishedSnapshotVersion: null,
      type: defaultScenario.subject === "party_size" ? "按人数限购" : "按桌/订单限购",
      round: period === "per_round" ? "每轮" : "每单/整单累计",
      method: defaultScenario.targetType === "dish_set" ? "按菜品集限购" : "按每种菜品限购",
      persons: "1 人及以上", dishes: "未配置门店/产线", selectedCategories: [], selectedDishes: [],
      structureByLine: clone(draft.structureByLine), quantitySettings: {}, personRanges: [],
      productLines: [], limits: [], conditions: clone(draft.conditions), authorization: clone(draft.authorization),
      participatingStoreIds: [], activeStoreId: "", storeConfigs: {}, deployStoreIds: [], deployExcludedStoreIds: [],
      legacyCompatibilityFallback: clone(draft.legacyCompatibilityFallback), authoringConfig: clone(draft), editorDraft: clone(draft)
    };
  }

  // 发布版本只携带本次生效门店；作者草稿仍由调用方完整保留，以便后续再次启用门店时继续编辑。
  function buildPublishedDraft(input) {
    var draft = clone(input || {});
    var deployIds = (Array.isArray(draft.deployStoreIds) ? draft.deployStoreIds : []).filter(function (storeId, index, values) {
      return storeId && values.indexOf(storeId) === index && draft.storeConfigs && draft.storeConfigs[storeId];
    });
    var storeConfigs = {};
    deployIds.forEach(function (storeId) { storeConfigs[storeId] = clone(draft.storeConfigs[storeId]); });
    draft.storeConfigs = storeConfigs;
    draft.deployStoreIds = deployIds;
    draft.participatingStoreIds = deployIds.slice();
    draft.activeStoreId = deployIds[0] || "";
    draft.deployExcludedStoreIds = [];
    return draft;
  }

  // 复制仅复制可编辑的策略与门店草稿，绝不复用一次发布产生的快照或服务员授权记录。
  function prepareDraftCopy(input) {
    var draft = clone(input || {});
    ["publishedAt", "publishedSnapshotVersion", "runtimeSnapshotId", "runtimeSnapshotRef", "runtimeSnapshotVersion",
      "authorizationRecords", "authorizationHistory", "authorizationCredentials", "runtimeCounters", "processedOperationIds",
      "origin", "defaultScenarioKey", "defaultCatalogVersion"].forEach(function (field) {
      delete draft[field];
    });
    return draft;
  }

  function activationValidation(record, records) {
    var draft = record && (record.authoringConfig || record.authoringDraft || record.editorDraft || record) || {};
    var basics = validatePublicationBasics(draft);
    if (!basics.valid) return basics;
    var deployIds = Array.isArray(draft.deployStoreIds) ? draft.deployStoreIds : [];
    if (!deployIds.length) return { valid: false, message: "请先编辑并至少选择一家生效门店" };
    if (deployIds.some(function (storeId) { return !draft.storeConfigs || !draft.storeConfigs[storeId]; })) {
      return { valid: false, message: "生效门店缺少商品与数量配置" };
    }
    if (usesV4Capability(draft)) {
      var publicationCheck = validateV4Publication(draft);
      if (!publicationCheck.valid) return publicationCheck;
    }
    var domain = window.BuffetRuleDomain;
    if (domain && typeof domain.findConflict === "function") {
      var conflict = domain.findConflict(draft, records || [], [record && record.id].filter(Boolean));
      if (conflict) return { valid: false, message: "当前规则与已启用规则存在冲突" };
    }
    if (domain && typeof domain.validateStaticFeasibility === "function") {
      var feasibility = domain.validateStaticFeasibility(draft);
      if (feasibility && !feasibility.valid) return { valid: false, message: (feasibility.violations[0] || {}).message || "当前配置无法满足，请调整额度或区间" };
    }
    return { valid: true, message: "" };
  }

  function prepareActivation(record) {
    var draft = record && (record.authoringConfig || record.authoringDraft || record.editorDraft || record) || {};
    record.authoringConfig = clone(draft);
    record.authoringDraft = clone(draft);
    record.editorDraft = clone(draft);
    // 禁用期间的编辑以作者草稿为准，重新启用时必须重新裁剪，绝不可复用旧发布态。
    record.publishedConfig = buildPublishedDraft(draft);
    return record;
  }

  var repository = {
    key: REPOSITORY_KEY,
    readEnvelope: readEnvelope,
    mutateEnvelope: mutateEnvelope,
    loadRules: function () {
      var envelope = readEnvelope();
      return clone(envelope.rules.concat(envelope.drafts));
    },
    loadForAuthoringList: function (factory) {
      if (typeof factory !== "function") throw new Error("BUFFET_DEFAULT_RULE_FACTORY_REQUIRED");
      var initial = readEnvelope();
      var preview = reconcileDefaultRules(initial, factory);
      if (!preview.changed) return clone(initial.rules.concat(initial.drafts));
      var updated = mutateEnvelope(null, function (next) {
        var result = reconcileDefaultRules(next, factory);
        return result.changed ? result.envelope : false;
      });
      return clone(updated.rules.concat(updated.drafts));
    },
    saveRules: function (records) {
      return mutateEnvelope(null, function (next) {
        var previousActive = next.rules.filter(function (rule) { return rule && rule.status === "active"; });
        next.rules = records.filter(function (rule) { return rule && rule.status !== "draft"; }).map(function (rule) {
          // 活跃/禁用规则保存两份明确用途的数据：完整作者草稿用于再次编辑，裁剪发布态只用于冲突和运行快照。
          if (!rule.authoringConfig) rule.authoringConfig = clone(rule.authoringDraft || rule.editorDraft || rule);
          if (!rule.authoringDraft) rule.authoringDraft = clone(rule.authoringConfig);
          if (!rule.publishedConfig) rule.publishedConfig = buildPublishedDraft(rule.authoringConfig);
          return rule;
        });
        next.drafts = records.filter(function (rule) { return rule && rule.status === "draft"; });
        var active = next.rules.filter(function (rule) { return rule && rule.status === "active"; });
        if (JSON.stringify(previousActive) !== JSON.stringify(active)) {
          var version = next.revision + 1;
          var snapshotId = "buffet-snapshot-" + version;
          var runtimeRules = window.BuffetRuleDomain
            ? window.BuffetRuleDomain.compileRuntimeRules(active, version)
            : clone(active);
          next.snapshots[snapshotId] = { snapshotId: snapshotId, version: version, createdAt: new Date().toISOString(), rules: runtimeRules };
          var keep = [next.currentSnapshotId, snapshotId].filter(Boolean);
          Object.keys(next.snapshots).forEach(function (id) { if (keep.indexOf(id) < 0) delete next.snapshots[id]; });
          next.currentSnapshotId = snapshotId;
        }
        return next;
      });
    }
  };

  window.ORDER_LIMIT_MODULE_PROFILE = {
    moduleId: "buffet-rule",
    pageTitle: "自助餐规则",
    routes: {
      list: "buffet-rule.html",
      editor: "buffet-rule-editor.html",
      publishConfirm: "buffet-rule-publish-confirm.html"
    },
    storage: {
      rulesKey: REPOSITORY_KEY,
      recoveryPrefix: "buffet-rule:recovery:v1:",
      listColumnsKey: "buffet-rule:rule-list-columns:v1",
      listFiltersKey: "buffet-rule:rule-list-filters:v1"
    },
    repository: repository,
    defaultScenarios: clone(DEFAULT_SCENARIOS),
    legacyCapabilities: clone(LEGACY_CAPABILITIES),
    legacyCapabilityGroups: clone(LEGACY_CAPABILITY_GROUPS),
    createDefaultScenarioRule: createDefaultScenarioRule,
    reconcileDefaultRules: reconcileDefaultRules,
    verifiedLegacyDefaultKey: verifiedLegacyDefaultKey,
    isUntouchedLegacyDefault: isUntouchedLegacyDefault,
    periodTemplates: clone(PERIOD_TEMPLATES),
    allowedPeriods: ALLOWED_PERIODS.slice(),
    usesV4Capability: usesV4Capability,
    upgradeDraftToV4: upgradeDraftToV4,
    lifecycle: {
      buildPublishedDraft: buildPublishedDraft,
      prepareDraftCopy: prepareDraftCopy,
      validateActivation: activationValidation,
      prepareActivation: prepareActivation
    },
    conflictPolicy: window.BuffetRuleDomain || null,
    steps: [
      { title: "规则类型", note: "确定计算口径" },
      { title: "场景配置", note: "人数与轮次区间" },
      { title: "限购数量", note: "按门店选品并配置数量" },
      { title: "超限授权", note: "授权范围与权限" },
      { title: "生效范围", note: "时间、会员与门店" },
      { title: "确认发布", note: "复核并下发" }
    ],
    allowedPeriodsBySubject: {
      order: ALLOWED_PERIODS.slice(),
      party_size: ALLOWED_PERIODS.slice()
    },
    allowedTargetTypes: ["category", "dish", "dish_set"]
  };
})();
