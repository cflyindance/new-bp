(function () {
  "use strict";

  var PERIODS = ["order_lifetime", "per_round", "multi_round"];
  var CONTROLLED_PERIOD_TEMPLATES = {
    "order-round-protection": ["order_lifetime", "per_round"],
    "order-multi-round-protection": ["order_lifetime", "multi_round"]
  };
  var LEGACY_STEP_MAP = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 4, 6: 5 };

  function migrateEditorProgress(input) {
    input = input || {};
    if (Number(input.stepVersion) >= 2) {
      var retainedCurrent = Math.max(1, Math.min(5, Number(input.currentStep) || 1));
      var retainedHighest = Math.max(retainedCurrent, Math.min(5, Number(input.highestStep) || retainedCurrent));
      return { currentStep: retainedCurrent, highestStep: retainedHighest, migrated: false, fallbackApplied: false, stepVersion: 2 };
    }
    var oldCurrent = Math.max(1, Math.min(6, Number(input.currentStep) || 1));
    var oldHighest = Math.max(oldCurrent, Math.min(6, Number(input.highestStep) || oldCurrent));
    var current = LEGACY_STEP_MAP[oldCurrent] || 1;
    var highest = LEGACY_STEP_MAP[oldHighest] || current;
    return { currentStep: current, highestStep: Math.max(current, highest), migrated: true, fallbackApplied: false, stepVersion: 2 };
  }

  function normalizedPeriods(values) {
    return PERIODS.filter(function (period) {
      return Array.isArray(values) && values.indexOf(period) >= 0;
    });
  }

  function samePeriods(left, right) {
    left = normalizedPeriods(left);
    right = normalizedPeriods(right);
    return left.length === right.length && left.every(function (period, index) { return period === right[index]; });
  }

  function controlledTemplateForPeriods(periods) {
    return Object.keys(CONTROLLED_PERIOD_TEMPLATES).find(function (templateId) {
      return samePeriods(periods, CONTROLLED_PERIOD_TEMPLATES[templateId]);
    }) || "";
  }

  function normalizePeriodSelection(input) {
    var periods = normalizedPeriods(input && input.enabledPeriods);
    if (!periods.length) return { valid: false, mode: "repair", code: "PERIOD_REQUIRED", periods: [], templateId: "" };
    if (periods.length === 1) return { valid: true, mode: "single", code: "", periods: periods, templateId: "" };
    var inferredTemplateId = controlledTemplateForPeriods(periods);
    if (inferredTemplateId) {
      return { valid: true, mode: "controlled", code: "", periods: periods, templateId: inferredTemplateId, inferred: input.buffetTemplateId !== inferredTemplateId };
    }
    return {
      valid: false,
      mode: "repair",
      code: periods.length > 2 ? "PERIOD_COMBINATION_TOO_MANY" : "PERIOD_COMBINATION_INVALID",
      periods: periods,
      templateId: ""
    };
  }

  function setSelectedPeriods(input, periods, templateId) {
    if (!input || typeof input !== "object") return input;
    periods = normalizedPeriods(periods);
    input.enabledPeriods = periods;
    input.periodPolicies = isPlainObject(input.periodPolicies) ? input.periodPolicies : {};
    PERIODS.forEach(function (period) {
      var existing = input.periodPolicies[period] || {};
      input.periodPolicies[period] = existing;
      existing.blocks = normalizeBlocks(existing.blocks);
      existing.enabled = periods.indexOf(period) >= 0;
      if (existing.enabled && !(existing.blocks.totalEnabled || existing.blocks.targetEnabled || existing.blocks.sameDishEnabled)) existing.blocks.targetEnabled = true;
    });
    input.period = periods.indexOf("multi_round") >= 0 ? "multi_round" : periods.indexOf("per_round") >= 0 ? "per_round" : periods[0] || null;
    input.buffetTemplateId = templateId || "custom";
    input.buffetTemplateModified = false;
    return input;
  }

  function selectSinglePeriod(input, period) {
    if (PERIODS.indexOf(period) < 0) return input;
    return setSelectedPeriods(input, [period], "custom");
  }

  function applyControlledPeriodTemplate(input, templateId) {
    var periods = CONTROLLED_PERIOD_TEMPLATES[templateId];
    return periods ? setSelectedPeriods(input, periods, templateId) : input;
  }

  function templateAvailability(draft, template) {
    draft = draft || {};
    template = template || {};
    if (Array.isArray(template.subjects) && template.subjects.indexOf(draft.subject) < 0) {
      return { enabled: false, reason: "当前限购主体不适用此模板", requiresRepair: Array.isArray(draft.enabledPeriods) && draft.enabledPeriods.length > 1 };
    }
    if (Array.isArray(template.targetTypes) && template.targetTypes.indexOf(draft.targetType) < 0) {
      return { enabled: false, reason: "当前限购对象不适用此模板", requiresRepair: Array.isArray(draft.enabledPeriods) && draft.enabledPeriods.length > 1 };
    }
    return { enabled: true, reason: "", requiresRepair: false };
  }

  function allowedLimitBlocks(draft, period) {
    draft = draft || {};
    var roundBased = period === "per_round" || period === "multi_round";
    var dishSet = draft.targetType === "dish_set";
    return {
      total: roundBased,
      target: PERIODS.indexOf(period) >= 0,
      sameDish: roundBased && dishSet,
      tableFallback: draft.subject === "party_size" && roundBased
    };
  }

  function legacyRangeId(kind, range, index) {
    var min = configuredNumber(range && range.min);
    var max = range && range.max == null ? "plus" : configuredNumber(range.max);
    return (kind === "round" ? "rr" : "pr") + "_legacy_" + (index + 1) + "_" + (min == null ? "x" : min) + "_" + (max == null ? "x" : max);
  }

  function ensureRangeIds(ranges, kind, issues) {
    var seen = {};
    return (Array.isArray(ranges) ? ranges : []).map(function (range, index) {
      var next = Object.assign({}, range || {});
      var rangeId = typeof next.rangeId === "string" && next.rangeId.trim() ? next.rangeId.trim() : legacyRangeId(kind, next, index);
      if (seen[rangeId]) issues.push({ code: "DUPLICATE_RANGE_ID", kind: kind, index: index, rangeId: rangeId });
      seen[rangeId] = true;
      next.rangeId = rangeId;
      return next;
    });
  }

  function migrateScenarioMap(map, partyRanges, roundRanges, issues, field) {
    var result = {};
    Object.keys(isPlainObject(map) ? map : {}).forEach(function (key) {
      var parts = String(key).split("|");
      if (!/^\d+$/.test(parts[0] || "") || !/^\d+$/.test(parts[1] || "")) {
        result[key] = map[key];
        return;
      }
      var party = partyRanges[Number(parts[0])];
      var round = roundRanges[Number(parts[1])];
      if (!party || !round) {
        issues.push({ code: "RANGE_INDEX_OUT_OF_BOUNDS", field: field, key: key });
        result[key] = map[key];
        return;
      }
      var nextKey = [party.rangeId, round.rangeId].concat(parts.slice(2)).join("|");
      if (Object.prototype.hasOwnProperty.call(result, nextKey)) {
        issues.push({ code: "RANGE_KEY_CONFLICT", field: field, key: key, nextKey: nextKey });
        result[key] = map[key];
        return;
      }
      result[nextKey] = map[key];
    });
    return result;
  }

  function migrateRangeIdentities(input) {
    var draft = clone(input);
    var issues = [];
    if (Number(draft.rangeIdentityVersion) >= 1) return { draft: draft, migrated: false, repairIssues: Array.isArray(draft.migrationIssues) ? draft.migrationIssues : [] };
    draft.partyRanges = ensureRangeIds(draft.partyRanges && draft.partyRanges.length ? draft.partyRanges : [{ min: 1, max: null }], "party", issues);
    draft.roundRanges = ensureRangeIds(draft.roundRanges && draft.roundRanges.length ? draft.roundRanges : [{ min: 1, max: null }], "round", issues);
    Object.keys(isPlainObject(draft.storeConfigs) ? draft.storeConfigs : {}).forEach(function (storeId) {
      var config = draft.storeConfigs[storeId];
      Object.keys(isPlainObject(config.periodValues) ? config.periodValues : {}).forEach(function (period) {
        var values = config.periodValues[period];
        ["totalBounds", "tableTotalBounds", "targetLimits", "tableTargetCaps", "defaultDishLimits", "exceptionDishLimits"].forEach(function (field) {
          values[field] = migrateScenarioMap(values[field], draft.partyRanges, draft.roundRanges, issues, storeId + "." + period + "." + field);
        });
      });
    });
    var partyIndex = Math.max(0, Math.min(draft.partyRanges.length - 1, Number(draft.activePartyIndex) || 0));
    var roundIndex = Math.max(0, Math.min(draft.roundRanges.length - 1, Number(draft.activeRoundIndex) || 0));
    draft.activePartyRangeId = draft.partyRanges[partyIndex].rangeId;
    draft.activeRoundRangeId = draft.roundRanges[roundIndex].rangeId;
    draft.rangeIdentityVersion = 1;
    if (issues.length) draft.migrationIssues = issues;
    return { draft: draft, migrated: true, repairIssues: issues };
  }

  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    try {
      var prototype = Object.getPrototypeOf(value);
      return prototype === Object.prototype || prototype === null;
    } catch (error) {
      return false;
    }
  }

  function clone(value) {
    if (!isPlainObject(value)) return {};
    try {
      var cloned = JSON.parse(JSON.stringify(value));
      return isPlainObject(cloned) ? cloned : {};
    } catch (error) {
      return {};
    }
  }

  function configuredNumber(value) {
    var number;
    if (typeof value === "number") number = value;
    else if (typeof value === "string" && /^\d+$/.test(value)) number = Number(value);
    else return null;
    return Number.isInteger(number) && number >= 0 && number <= 999999 ? number : null;
  }

  function compositeKey(values) {
    var parts = values.map(function (value) { return String(value); });
    var readable = parts.every(function (part) { return /^[A-Za-z0-9_.-]+$/.test(part); });
    return readable ? parts.join("|") : "json:" + JSON.stringify(parts);
  }

  function identityPart(value) {
    return String(value == null ? "" : value).trim();
  }

  function scenarioKey(partyIndex, roundIndex) {
    return compositeKey([partyIndex, roundIndex]);
  }

  function targetCellKey(partyIndex, roundIndex, productLineId, targetId) {
    return compositeKey([partyIndex, roundIndex, identityPart(productLineId), identityPart(targetId)]);
  }

  function menuIdentity(item) {
    return compositeKey([identityPart(item && item.productLineId), identityPart(item && item.dishId)]);
  }

  function categoryIdentity(item) {
    return compositeKey([identityPart(item && item.productLineId), identityPart(item && item.categoryId)]);
  }

  function normalizeLimitCell(cell) {
    var value = cell && cell.configured ? configuredNumber(cell.value) : null;
    return value == null ? { configured: false, value: null } : { configured: true, value: value };
  }

  function normalizeBoundCell(cell) {
    var min = cell && cell.minConfigured ? configuredNumber(cell.min) : null;
    var max = cell && cell.maxConfigured ? configuredNumber(cell.max) : null;
    return {
      minConfigured: min != null,
      min: min,
      maxConfigured: max != null,
      max: max
    };
  }

  function validIdentityPart(value) {
    return identityPart(value) !== "";
  }

  function uniqueStrings(values) {
    var seen = new Set();
    var result = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      var key = identityPart(value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(key);
    });
    return result;
  }

  function uniqueIdentities(values, idField, identity) {
    var seen = new Set();
    var result = [];
    (Array.isArray(values) ? values : []).forEach(function (item) {
      if (!isPlainObject(item) || !validIdentityPart(item.productLineId) || !validIdentityPart(item[idField])) return;
      var normalized = clone(item);
      normalized.productLineId = identityPart(normalized.productLineId);
      normalized[idField] = identityPart(normalized[idField]);
      var key = identity(normalized);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(normalized);
    });
    return result;
  }

  function normalizeCellMap(input, normalizer) {
    var result = Object.create(null);
    Object.keys(isPlainObject(input) ? input : {}).forEach(function (key) {
      result[key] = normalizer(input[key]);
    });
    return result;
  }

  function normalizeExceptionMap(input) {
    var result = Object.create(null);
    Object.keys(isPlainObject(input) ? input : {}).forEach(function (key) {
      var rows = Array.isArray(input[key]) ? input[key] : [];
      result[key] = rows.reduce(function (normalizedRows, row) {
        if (!isPlainObject(row)) return normalizedRows;
        // 兼容 Task 5 之前编辑器写入的单值 dish；持久化只输出 dishes 数组。
        var requestedDishes = Array.isArray(row.dishes) ? row.dishes : [];
        var dishes = uniqueIdentities(requestedDishes, "dishId", menuIdentity);
        if (!dishes.length && isPlainObject(row.dish)) {
          dishes = uniqueIdentities([row.dish], "dishId", menuIdentity);
        }
        // 每个例外行只能对应一个菜品。旧数据的一行多菜品拆为多行并保持原有顺序；
        // 跨行的相同身份不静默丢弃，交由发布前 EXCEPTION_DISH_DUPLICATED 明确阻止。
        dishes.forEach(function (dish) {
          normalizedRows.push({ dishes: [dish], limit: normalizeLimitCell(row.limit) });
        });
        return normalizedRows;
      }, []);
    });
    return result;
  }

  function normalizeScenarioValues(input) {
    var source = isPlainObject(input) ? input : {};
    return {
      totalBounds: normalizeCellMap(source.totalBounds, normalizeBoundCell),
      tableTotalBounds: normalizeCellMap(source.tableTotalBounds, normalizeBoundCell),
      targetLimits: normalizeCellMap(source.targetLimits, normalizeLimitCell),
      tableTargetCaps: normalizeCellMap(source.tableTargetCaps, normalizeLimitCell),
      defaultDishLimits: normalizeCellMap(source.defaultDishLimits, normalizeLimitCell),
      exceptionDishLimits: normalizeExceptionMap(source.exceptionDishLimits)
    };
  }

  function normalizeStoreConfig(input) {
    var source = clone(input);
    source.productLines = uniqueStrings(source.productLines);
    source.dishTargets = uniqueIdentities(source.dishTargets, "dishId", menuIdentity);
    source.categoryTargets = uniqueIdentities(source.categoryTargets, "categoryId", categoryIdentity);
    source.dishSetMembers = uniqueIdentities(source.dishSetMembers, "dishId", menuIdentity);
    source.periodValues = isPlainObject(source.periodValues) ? source.periodValues : {};
    PERIODS.forEach(function (period) {
      source.periodValues[period] = normalizeScenarioValues(source.periodValues[period]);
    });
    return source;
  }

  function normalizeBlocks(input) {
    var source = isPlainObject(input) ? input : {};
    return {
      totalEnabled: source.totalEnabled === true,
      targetEnabled: source.targetEnabled !== false,
      sameDishEnabled: source.sameDishEnabled === true
    };
  }

  function normalizeRule(input) {
    var source = clone(input);
    var requestedPeriods = Array.isArray(source.enabledPeriods)
      ? source.enabledPeriods
      : [source.period].filter(Boolean);
    source.schemaVersion = 4;
    source.enabledPeriods = requestedPeriods.filter(function (period, index, values) {
      return PERIODS.indexOf(period) >= 0 && values.indexOf(period) === index;
    });
    source.measureUnit = source.measureUnit === "kind" ? "kind" : "piece";
    source.periodPolicies = isPlainObject(source.periodPolicies) ? source.periodPolicies : {};
    PERIODS.forEach(function (period) {
      var existing = source.periodPolicies[period] || {};
      source.periodPolicies[period] = {
        enabled: source.enabledPeriods.indexOf(period) >= 0,
        blocks: normalizeBlocks(existing.blocks)
      };
    });
    source.storeConfigs = isPlainObject(source.storeConfigs) ? source.storeConfigs : {};
    Object.keys(source.storeConfigs).forEach(function (storeId) {
      source.storeConfigs[storeId] = normalizeStoreConfig(source.storeConfigs[storeId]);
    });
    return source;
  }

  function optionalNumber(value) {
    return value == null ? null : configuredNumber(value);
  }

  function effectiveBounds(values, subject, partySize) {
    values = isPlainObject(values) ? values : {};
    var perPersonMin = optionalNumber(values.perPersonMin);
    var perPersonMax = optionalNumber(values.perPersonMax);
    var tableMin = optionalNumber(values.tableMin);
    var tableMax = optionalNumber(values.tableMax);
    var hasPerPersonBound = perPersonMin != null || perPersonMax != null;
    var factor = subject === "party_size" ? configuredNumber(partySize) : 1;
    if (subject === "party_size" && hasPerPersonBound && (factor == null || factor < 1)) {
      return { min: tableMin, max: tableMax, valid: false, code: "PARTY_SIZE_INVALID" };
    }
    var mins = [perPersonMin == null || factor == null ? null : perPersonMin * factor, tableMin]
      .filter(function (value) { return value != null; });
    var maxes = [perPersonMax == null || factor == null ? null : perPersonMax * factor, tableMax]
      .filter(function (value) { return value != null; });
    var min = mins.length ? Math.max.apply(Math, mins) : null;
    var max = maxes.length ? Math.min.apply(Math, maxes) : null;
    return { min: min, max: max, valid: min == null || max == null || min <= max };
  }

  window.BuffetRulePolicy = {
    schemaVersion: 4,
    periods: PERIODS.slice(),
    controlledPeriodTemplates: clone(CONTROLLED_PERIOD_TEMPLATES),
    normalizePeriodSelection: normalizePeriodSelection,
    selectSinglePeriod: selectSinglePeriod,
    applyControlledPeriodTemplate: applyControlledPeriodTemplate,
    templateAvailability: templateAvailability,
    allowedLimitBlocks: allowedLimitBlocks,
    migrateRangeIdentities: migrateRangeIdentities,
    migrateEditorProgress: migrateEditorProgress,
    scenarioKey: scenarioKey,
    targetCellKey: targetCellKey,
    menuIdentity: menuIdentity,
    effectiveBounds: effectiveBounds,
    normalizeRule: normalizeRule,
    normalizeStoreConfig: normalizeStoreConfig
  };
})();
