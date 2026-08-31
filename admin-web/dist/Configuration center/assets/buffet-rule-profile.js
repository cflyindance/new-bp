(function () {
  "use strict";

  var REPOSITORY_KEY = "buffet-rule:repository:v1";
  var LOCK_KEY = "buffet-rule:repository-lock:v1";
  var LOCK_TTL = 3000;
  var DEFAULT_SCENARIOS = [
    { key: "order|order_lifetime|category", subject: "order", period: "order_lifetime", targetType: "category", name: "按桌/订单·每单/整单累计·按分类限购" },
    { key: "order|order_lifetime|dish", subject: "order", period: "order_lifetime", targetType: "dish", name: "按桌/订单·每单/整单累计·按菜品限购" },
    { key: "order|order_lifetime|dish_set", subject: "order", period: "order_lifetime", targetType: "dish_set", name: "按桌/订单·每单/整单累计·按菜品集限购" },
    { key: "party_size|order_lifetime|category", subject: "party_size", period: "order_lifetime", targetType: "category", name: "按人数·每单·按分类限购" },
    { key: "party_size|order_lifetime|dish", subject: "party_size", period: "order_lifetime", targetType: "dish", name: "按人数·每单·按菜品限购" },
    { key: "party_size|order_lifetime|dish_set", subject: "party_size", period: "order_lifetime", targetType: "dish_set", name: "按人数·每单·按菜品集限购" },
    { key: "party_size|per_round|category", subject: "party_size", period: "per_round", targetType: "category", name: "按人数·每轮·按分类限购" },
    { key: "party_size|per_round|dish", subject: "party_size", period: "per_round", targetType: "dish", name: "按人数·每轮·按菜品限购" },
    { key: "party_size|per_round|dish_set", subject: "party_size", period: "per_round", targetType: "dish_set", name: "按人数·每轮·按菜品集限购" },
    { key: "party_size|multi_round|category", subject: "party_size", period: "multi_round", targetType: "category", name: "按人数·分轮次·按分类限购" },
    { key: "party_size|multi_round|dish", subject: "party_size", period: "multi_round", targetType: "dish", name: "按人数·分轮次·按菜品限购" },
    { key: "party_size|multi_round|dish_set", subject: "party_size", period: "multi_round", targetType: "dish_set", name: "按人数·分轮次·按菜品集限购" }
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

  function scenarioKey(rule) {
    if (!rule || (rule.status !== "active" && rule.status !== "disabled")) return "";
    var draft = rule.authoringConfig || rule.authoringDraft || rule.editorDraft || rule;
    var key = [draft.subject, draft.period, draft.targetType].join("|");
    return DEFAULT_SCENARIOS.some(function (scenario) { return scenario.key === key; }) ? key : "";
  }

  function missingScenarios(rules) {
    var covered = {};
    (rules || []).forEach(function (rule) { var key = scenarioKey(rule); if (key) covered[key] = true; });
    return DEFAULT_SCENARIOS.filter(function (scenario) { return !covered[scenario.key]; });
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

  function createDefaultScenarioRule(scenario, id) {
    var created = today();
    var draft = {
      schemaVersion: scenario.targetType === "dish_set" ? 2 : 1,
      currentStep: 1, highestStep: 1,
      subject: scenario.subject, period: scenario.period, targetType: scenario.targetType,
      name: scenario.name, description: "",
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
      legacyCompatibilityFallback: { structureByLine: { kiosk: [], emenu: [], sdi: [] }, productLines: [], targetIds: [], limits: {}, dishSetMembers: [], dishSetLimits: {} },
      productQuantityMergedVersion: 2
    };
    return {
      id: id, name: scenario.name, description: "", status: "disabled", created: created, updatedAt: new Date().toISOString(),
      origin: "system_default", defaultScenarioKey: scenario.key, publishedSnapshotVersion: null,
      type: scenario.subject === "party_size" ? "按人数限购" : "按桌/订单限购",
      round: scenario.period === "multi_round" ? "分轮次" : scenario.period === "per_round" ? "每轮" : "每单/整单累计",
      method: scenario.targetType === "dish_set" ? "按菜品集限购" : scenario.targetType === "dish" ? "按每种菜品限购" : "按每个分类限购",
      persons: "1 人及以上", dishes: "未配置门店/产线", selectedCategories: [], selectedDishes: [],
      structureByLine: clone(draft.structureByLine), quantitySettings: {}, personRanges: [],
      productLines: [], limits: [], conditions: clone(draft.conditions), authorization: clone(draft.authorization),
      participatingStoreIds: [], activeStoreId: "", storeConfigs: {}, deployStoreIds: [], deployExcludedStoreIds: [],
      legacyCompatibilityFallback: clone(draft.legacyCompatibilityFallback), authoringConfig: clone(draft), editorDraft: clone(draft)
    };
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
      if (!missingScenarios(initial.rules).length) return clone(initial.rules.concat(initial.drafts));
      var updated = mutateEnvelope(null, function (next) {
        var missing = missingScenarios(next.rules);
        if (!missing.length) return false;
        var id = nextNumericId(next);
        missing.forEach(function (scenario) { next.rules.push(factory(clone(scenario), id++)); });
        return next;
      });
      return clone(updated.rules.concat(updated.drafts));
    },
    saveRules: function (records) {
      return mutateEnvelope(null, function (next) {
        var previousActive = next.rules.filter(function (rule) { return rule && rule.status === "active"; });
        next.rules = records.filter(function (rule) { return rule && rule.status !== "draft"; }).map(function (rule) {
          if (!rule.authoringConfig) rule.authoringConfig = clone(rule.authoringDraft || rule.editorDraft || rule);
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
    createDefaultScenarioRule: createDefaultScenarioRule,
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
      order: ["order_lifetime"],
      party_size: ["order_lifetime", "per_round", "multi_round"]
    },
    allowedTargetTypes: ["category", "dish", "dish_set"]
  };
})();
