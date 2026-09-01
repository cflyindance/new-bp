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
  var DEFAULT_SCENARIOS = [
    { key: "order|category", subject: "order", targetType: "category", name: "按桌/订单·按分类限购" },
    { key: "order|dish", subject: "order", targetType: "dish", name: "按桌/订单·按菜品限购" },
    { key: "order|dish_set", subject: "order", targetType: "dish_set", name: "按桌/订单·按菜品集限购" },
    { key: "party_size|category", subject: "party_size", targetType: "category", name: "按人数·按分类限购" },
    { key: "party_size|dish", subject: "party_size", targetType: "dish", name: "按人数·按菜品限购" },
    { key: "party_size|dish_set", subject: "party_size", targetType: "dish_set", name: "按人数·按菜品集限购" }
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

  function subjectTargetKey(subject, targetType) {
    var key = [subject, targetType].join("|");
    return DEFAULT_SCENARIOS.some(function (scenario) { return scenario.key === key; }) ? key : "";
  }

  // Keep default-rule coverage keys separate from the party/round scenario cell key below.
  // Function declarations are hoisted, so sharing this name would make list seeding
  // miss every existing default rule on the second load.
  function defaultScenarioKeyForRule(rule) {
    if (!rule || (rule.status !== "active" && rule.status !== "disabled")) return "";
    var draft = rule.authoringConfig || rule.authoringDraft || rule.editorDraft || rule;
    var key = subjectTargetKey(draft.subject, draft.targetType);
    if (key) return key;
    var legacyParts = String(rule.defaultScenarioKey || "").split("|");
    if (legacyParts.length >= 2) return subjectTargetKey(legacyParts[0], legacyParts[legacyParts.length - 1]);
    return "";
  }

  function missingScenarios(rules) {
    var covered = {};
    (rules || []).forEach(function (rule) { var key = defaultScenarioKeyForRule(rule); if (key) covered[key] = true; });
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
    for (var index = 0; index < deployIds.length; index += 1) {
      var config = draft.storeConfigs && draft.storeConfigs[deployIds[index]];
      var selected = draft.targetType === "dish" ? config && config.dishTargets : draft.targetType === "category" ? config && config.categoryTargets : config && config.dishSetMembers;
      if (!Array.isArray(selected) || !selected.length) return { valid: false, message: "请至少选择一个分类或菜品" };
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
      return item.subject === scenario.subject && item.targetType === scenario.targetType;
    }) || scenario;
    var scenarioKey = scenario.key || defaultScenario.key || subjectTargetKey(scenario.subject, scenario.targetType);
    var scenarioName = scenario.name || defaultScenario.name || "自助餐限购规则";
    var draft = upgradeDraftToV4({
      schemaVersion: 4,
      currentStep: 1, highestStep: 1,
      subject: scenario.subject, period: "order_lifetime", enabledPeriods: ["order_lifetime"], targetType: scenario.targetType,
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
      origin: "system_default", defaultScenarioKey: scenarioKey, publishedSnapshotVersion: null,
      type: scenario.subject === "party_size" ? "按人数限购" : "按桌/订单限购",
      round: "每单/整单累计",
      method: scenario.targetType === "dish_set" ? "按菜品集限购" : scenario.targetType === "dish" ? "按每种菜品限购" : "按每个分类限购",
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
      "authorizationRecords", "authorizationHistory", "authorizationCredentials", "runtimeCounters", "processedOperationIds"].forEach(function (field) {
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
    createDefaultScenarioRule: createDefaultScenarioRule,
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
