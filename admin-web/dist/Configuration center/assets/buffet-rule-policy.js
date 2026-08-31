(function () {
  "use strict";

  var PERIODS = ["order_lifetime", "per_round", "multi_round"];

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
    scenarioKey: scenarioKey,
    targetCellKey: targetCellKey,
    menuIdentity: menuIdentity,
    effectiveBounds: effectiveBounds,
    normalizeRule: normalizeRule,
    normalizeStoreConfig: normalizeStoreConfig
  };
})();
