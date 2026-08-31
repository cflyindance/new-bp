(function () {
  "use strict";

  var conflictMatrix = {
    order_lifetime: { order_lifetime: true, party_order_lifetime: false, party_per_round: false, party_multi_round: false },
    party_order_lifetime: { order_lifetime: false, party_order_lifetime: true, party_per_round: false, party_multi_round: false },
    party_per_round: { order_lifetime: false, party_order_lifetime: false, party_per_round: true, party_multi_round: true },
    party_multi_round: { order_lifetime: false, party_order_lifetime: false, party_per_round: true, party_multi_round: true }
  };

  function mouth(rule) {
    if (rule.subject === "order") return "order_lifetime";
    if (rule.period === "order_lifetime") return "party_order_lifetime";
    if (rule.period === "per_round") return "party_per_round";
    return "party_multi_round";
  }

  function isV4Rule(rule) {
    return !!(rule && (Number(rule.schemaVersion) >= 4 || Array.isArray(rule.enabledPeriods)));
  }

  function rulePeriods(rule) {
    var valid = ["order_lifetime", "per_round", "multi_round"];
    var periods = Array.isArray(rule && rule.enabledPeriods) ? rule.enabledPeriods : [rule && rule.period];
    return periods.filter(function (period, index) {
      return valid.indexOf(period) >= 0 && periods.indexOf(period) === index;
    });
  }

  function periodsConflict(left, right) {
    return left === right;
  }

  function v4PeriodsConflict(left, right) {
    return rulePeriods(left).some(function (leftPeriod) {
      return rulePeriods(right).some(function (rightPeriod) { return periodsConflict(leftPeriod, rightPeriod); });
    });
  }

  function policy() {
    return window.BuffetRulePolicy || {};
  }

  function identityPart(value) {
    return String(value == null ? "" : value).trim();
  }

  function menuIdentity(item) {
    if (typeof policy().menuIdentity === "function") return policy().menuIdentity(item || {});
    return identityPart(item && item.productLineId) + "|" + identityPart(item && item.dishId);
  }

  function categoryIdentity(item) {
    var lineId = identityPart(item && item.productLineId);
    var categoryId = identityPart(item && item.categoryId);
    return lineId + "|" + categoryId;
  }

  function scenarioKey(partyIndex, roundIndex) {
    if (typeof policy().scenarioKey === "function") return policy().scenarioKey(partyIndex, roundIndex);
    return String(partyIndex) + "|" + String(roundIndex);
  }

  function targetCellKey(partyIndex, roundIndex, productLineId, targetId) {
    if (typeof policy().targetCellKey === "function") return policy().targetCellKey(partyIndex, roundIndex, productLineId, targetId);
    return [partyIndex, roundIndex, identityPart(productLineId), identityPart(targetId)].join("|");
  }

  function mouthsConflict(left, right) {
    return !!(conflictMatrix[left] && conflictMatrix[left][right]);
  }

  function dateValue(value, fallback) {
    var date = value ? new Date(value + "T00:00:00Z") : new Date(fallback);
    return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
  }

  function dayMatches(date, conditions) {
    var cycle = conditions.activityCycle || "daily";
    if (cycle === "weekly") {
      var ids = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      return normalizedWeekdays(conditions.daysOfWeek).indexOf(ids[date.getUTCDay()]) >= 0;
    }
    if (cycle === "monthly") return (conditions.daysOfMonth || []).indexOf(date.getUTCDate()) >= 0;
    return true;
  }

  // profile 默认值为 1（周一）至 7（周日）；历史规则则使用 mon 至 sun。
  // 统一为历史字符串后比较，允许一条规则混用两种持久化格式。
  function normalizedWeekdays(days) {
    var numeric = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    var valid = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return (Array.isArray(days) ? days : []).reduce(function (result, day) {
      var numericDay = typeof day === "number" ? day : (/^[1-7]$/.test(String(day).trim()) ? Number(String(day).trim()) : NaN);
      var normalized = Number.isInteger(numericDay) && numericDay >= 1 && numericDay <= 7
        ? numeric[numericDay - 1]
        : String(day == null ? "" : day).trim().toLowerCase();
      if (valid.indexOf(normalized) >= 0 && result.indexOf(normalized) < 0) result.push(normalized);
      return result;
    }, []);
  }

  function calendarOverlap(left, right) {
    var start = dateValue(left.effectiveFrom > right.effectiveFrom ? left.effectiveFrom : right.effectiveFrom, "2000-01-01T00:00:00Z");
    var leftEnd = left.effectiveTo || "9999-12-31";
    var rightEnd = right.effectiveTo || "9999-12-31";
    var endText = leftEnd < rightEnd ? leftEnd : rightEnd;
    var end = dateValue(endText, "9999-12-31T00:00:00Z");
    if (start > end) return false;
    var horizon = new Date(Math.min(end.getTime(), start.getTime() + 400 * 86400000));
    for (var date = new Date(start); date <= horizon; date.setUTCDate(date.getUTCDate() + 1)) {
      if (dayMatches(date, left) && dayMatches(date, right)) return true;
    }
    return false;
  }

  function slotIntervals(conditions) {
    var slots = conditions.businessHourSlots || [];
    if (!slots.length) return [[0, 1440]];
    return slots.reduce(function (result, slot) {
      if (slot.mode === "full" || (!slot.from && !slot.to)) { result.push([0, 1440]); return result; }
      var from = String(slot.from || "00:00").split(":");
      var to = String(slot.to || "23:59").split(":");
      var start = Number(from[0]) * 60 + Number(from[1]);
      var end = Number(to[0]) * 60 + Number(to[1]);
      if (end >= start) result.push([start, end]);
      else { result.push([start, 1440]); result.push([0, end]); }
      return result;
    }, []);
  }

  function timeOverlap(left, right) {
    return slotIntervals(left).some(function (a) {
      return slotIntervals(right).some(function (b) { return Math.max(a[0], b[0]) <= Math.min(a[1], b[1]); });
    });
  }

  function memberOverlap(left, right) {
    if (left.memberMode !== "specified" || right.memberMode !== "specified") return true;
    return (left.memberLevelIds || []).some(function (id) { return (right.memberLevelIds || []).indexOf(id) >= 0; });
  }

  function conditionsOverlap(left, right) {
    left = left || {};
    right = right || {};
    return calendarOverlap(left, right) && timeOverlap(left, right) && memberOverlap(left, right);
  }

  function targetEntries(draft) {
    var activeStores = draft.deployStoreIds || [];
    return activeStores.reduce(function (rows, storeId) {
      var config = draft.storeConfigs && draft.storeConfigs[storeId];
      if (!config) return rows;
      if (draft.targetType === "dish_set") {
        (config.dishSetMembers || []).forEach(function (member) {
          rows.push({ storeId: storeId, lineId: identityPart(member.productLineId), targetType: "dish_set", targetId: identityPart(member.dishId), identity: menuIdentity(member) });
        });
        return rows;
      }
      if (isV4Rule(draft)) {
        var v4Targets = draft.targetType === "dish" ? config.dishTargets : config.categoryTargets;
        (v4Targets || []).forEach(function (target) {
          var targetId = draft.targetType === "dish" ? target.dishId : target.categoryId;
          rows.push({
            storeId: storeId,
            lineId: identityPart(target.productLineId),
            targetType: draft.targetType,
            targetId: identityPart(targetId),
            identity: draft.targetType === "dish" ? menuIdentity(target) : categoryIdentity(target)
          });
        });
        return rows;
      }
      (config.productLines || []).forEach(function (lineId) {
        (config.targetIds || []).forEach(function (targetId) {
          rows.push({ storeId: storeId, lineId: lineId, targetType: draft.targetType, targetId: targetId });
        });
      });
      return rows;
    }, []);
  }

  function sameTarget(left, right) {
    return left.storeId === right.storeId && left.lineId === right.lineId && left.targetType === right.targetType && left.targetId === right.targetId;
  }

  function targetIntersection(left, right) {
    return left.find(function (candidate) {
      return right.some(function (existing) { return sameTarget(candidate, existing); });
    });
  }

  function v4Conflict(candidate, existing, record) {
    if (candidate.subject !== existing.subject) return null;
    if (candidate.targetType !== existing.targetType) return null;
    if (!v4PeriodsConflict(candidate, existing)) return null;
    if (!conditionsOverlap(candidate.conditions, existing.conditions)) return null;
    var candidateTargets = targetEntries(candidate);
    var existingTargets = targetEntries(existing);
    if (candidate.targetType === "dish_set") {
      var overlap = targetIntersection(candidateTargets, existingTargets);
      return overlap ? {
        code: "DISH_SET_MEMBER_OVERLAP",
        ruleId: record.id,
        target: overlap,
        existingPeriods: rulePeriods(existing),
        candidatePeriods: rulePeriods(candidate)
      } : null;
    }
    var duplicate = targetIntersection(candidateTargets, existingTargets);
    return duplicate ? {
      code: "DUPLICATE_TARGET_RULE",
      ruleId: record.id,
      target: duplicate,
      existingPeriods: rulePeriods(existing),
      candidatePeriods: rulePeriods(candidate)
    } : null;
  }

  function findConflict(candidate, records, excludeIds) {
    var candidateTargets = targetEntries(candidate);
    var excluded = (excludeIds || []).map(String);
    for (var index = 0; index < (records || []).length; index += 1) {
      var record = records[index];
      if (!record || record.status !== "active" || excluded.indexOf(String(record.id)) >= 0) continue;
      var existing = record.authoringConfig || record.authoringDraft || record.editorDraft || record;
      if (isV4Rule(candidate) || isV4Rule(existing)) {
        var v4Result = v4Conflict(candidate, existing, record);
        if (v4Result) return v4Result;
        continue;
      }
      if (!mouthsConflict(mouth(candidate), mouth(existing))) continue;
      if (!conditionsOverlap(candidate.conditions, existing.conditions)) continue;
      var existingTargets = targetEntries(existing);
      var duplicate = candidateTargets.find(function (left) { return existingTargets.some(function (right) { return sameTarget(left, right); }); });
      if (duplicate) return { ruleId: record.id, target: duplicate, existingMouth: mouth(existing), candidateMouth: mouth(candidate) };
    }
    return null;
  }

  function configuredValue(cell) {
    var value = cell && cell.configured === true ? Number(cell.value) : NaN;
    return Number.isInteger(value) && value >= 0 && value <= 999999 ? value : null;
  }

  function configuredBound(cell, field) {
    var value = cell && cell[field + "Configured"] === true ? Number(cell[field]) : NaN;
    return Number.isInteger(value) && value >= 0 && value <= 999999 ? value : null;
  }

  function effectiveBounds(totalCell, tableCell, subject, partySize) {
    var totalMin = configuredBound(totalCell, "min");
    var totalMax = configuredBound(totalCell, "max");
    var tableMin = configuredBound(tableCell, "min");
    var tableMax = configuredBound(tableCell, "max");
    var factor = subject === "party_size" ? partySize : 1;
    var mins = [totalMin == null ? null : totalMin * factor, subject === "party_size" ? tableMin : null].filter(function (value) { return value != null; });
    var maxes = [totalMax == null ? null : totalMax * factor, subject === "party_size" ? tableMax : null].filter(function (value) { return value != null; });
    return {
      min: mins.length ? Math.max.apply(Math, mins) : null,
      max: maxes.length ? Math.min.apply(Math, maxes) : null
    };
  }

  function effectiveCellLimit(perPersonCell, tableCell, subject, partySize) {
    var value = configuredValue(perPersonCell);
    var tableCap = subject === "party_size" ? configuredValue(tableCell) : null;
    var values = [value == null ? null : value * (subject === "party_size" ? partySize : 1), tableCap].filter(function (item) { return item != null; });
    return values.length ? Math.min.apply(Math, values) : Infinity;
  }

  function flattenDishes(entries, lineId, inheritedCategoryId, result) {
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      if (!entry || typeof entry !== "object") return;
      var categoryId = entry.categoryId || entry.categoryKey || entry.category || inheritedCategoryId || "";
      var children = Array.isArray(entry.children) ? entry.children : [];
      var dishId = entry.dishId || (children.length ? "" : entry.id);
      if (dishId) result.push({ productLineId: lineId, dishId: String(dishId), categoryId: String(categoryId || "") });
      flattenDishes(children, lineId, categoryId, result);
    });
  }

  // 与 BrandMenuStructurePicker 的 d:<groupId>:<categoryId>:<dishId> 键保持一致。
  // 选择分类时 picker 会同时持久化全部 d: 后代键，因此静态校验必须读取字符串键，不能只依赖编辑器派生字段。
  function pickerDishes(config) {
    var picker = window.BrandMenuStructurePicker;
    if (picker && typeof picker.listSelectedDishes === "function") {
      return picker.listSelectedDishes(config.structureByLine || {}).map(function (item) {
        var parts = String(item.key || "").split(":");
        return {
          productLineId: identityPart(item.lineId),
          dishId: String(item.key),
          categoryId: parts.length >= 3 ? "c:" + parts[1] + ":" + parts[2] : ""
        };
      });
    }
    var result = [];
    Object.keys(config.structureByLine || {}).forEach(function (lineId) {
      (Array.isArray(config.structureByLine[lineId]) ? config.structureByLine[lineId] : []).forEach(function (key) {
        if (typeof key !== "string" || key.indexOf("d:") !== 0) return;
        var parts = key.split(":");
        if (parts.length < 4 || !parts[1] || !parts[2] || !parts[3]) return;
        result.push({ productLineId: identityPart(lineId), dishId: key, categoryId: "c:" + parts[1] + ":" + parts[2] });
      });
    });
    return result;
  }

  function uniqueDishes(dishes) {
    var seen = Object.create(null);
    return dishes.filter(function (dish) {
      var identity = menuIdentity(dish);
      if (!dish.productLineId || !dish.dishId || seen[identity]) return false;
      seen[identity] = true;
      return true;
    });
  }

  function scopeDishes(rule, config) {
    var picked = pickerDishes(config);
    if (rule.targetType === "dish") return uniqueDishes((config.dishTargets || []).map(function (dish) {
      return { productLineId: identityPart(dish.productLineId), dishId: identityPart(dish.dishId), categoryId: identityPart(dish.categoryId) };
    }).concat(picked));
    if (rule.targetType === "dish_set") return uniqueDishes((config.dishSetMembers || []).map(function (dish) {
      return { productLineId: identityPart(dish.productLineId), dishId: identityPart(dish.dishId), categoryId: identityPart(dish.categoryId) };
    }).concat(picked));
    var selected = (config.categoryTargets || []).reduce(function (result, category) {
      result[categoryIdentity(category)] = true;
      return result;
    }, Object.create(null));
    Object.keys(config.structureByLine || {}).forEach(function (lineId) {
      (Array.isArray(config.structureByLine[lineId]) ? config.structureByLine[lineId] : []).forEach(function (key) {
        if (typeof key === "string" && key.indexOf("c:") === 0) selected[identityPart(lineId) + "|" + key] = true;
      });
    });
    var all = [];
    Object.keys(config.structureByLine || {}).forEach(function (lineId) {
      flattenDishes(config.structureByLine[lineId], lineId, "", all);
    });
    return uniqueDishes(all.concat(picked).filter(function (dish) { return selected[categoryIdentity(dish)] === true; }));
  }

  function exceptionLimit(values, scenario, dish) {
    var rows = values.exceptionDishLimits && values.exceptionDishLimits[scenario] || [];
    var identity = menuIdentity(dish);
    var row = rows.find(function (candidate) {
      var member = candidate && Array.isArray(candidate.dishes) ? candidate.dishes[0] : candidate && candidate.dish;
      return member && menuIdentity(member) === identity;
    });
    return row ? row.limit : values.defaultDishLimits && values.defaultDishLimits[scenario];
  }

  function v4Blocks(rule, period) {
    var policy = rule.periodPolicies && rule.periodPolicies[period] || {};
    var blocks = policy.blocks || {};
    return { totalEnabled: blocks.totalEnabled === true, targetEnabled: blocks.targetEnabled !== false, sameDishEnabled: blocks.sameDishEnabled === true };
  }

  function targetCapacity(rule, config, values, scenario, partyIndex, roundIndex, partySize, blocks) {
    var dishes = scopeDishes(rule, config);
    var sameDishCapacity = Infinity;
    var sameDishLimits = [];
    if (blocks.sameDishEnabled) {
      var seen = Object.create(null);
      sameDishLimits = dishes.reduce(function (limits, dish) {
        var identity = menuIdentity(dish);
        if (seen[identity]) return limits;
        seen[identity] = true;
        var limit = effectiveCellLimit(exceptionLimit(values, scenario, dish), null, rule.subject, partySize);
        limits.push(limit);
        return limits;
      }, []);
      sameDishCapacity = sameDishLimits.reduce(function (sum, limit) {
        return sum === Infinity || limit === Infinity ? Infinity : sum + limit;
      }, 0);
    }
    if (!blocks.targetEnabled) return sameDishCapacity;
    if (rule.targetType === "dish_set") {
      var setLimit = effectiveCellLimit(values.targetLimits && values.targetLimits[scenario], values.tableTargetCaps && values.tableTargetCaps[scenario], rule.subject, partySize);
      if (rule.measureUnit !== "kind") return Math.min(sameDishCapacity, setLimit);
      // 按种额度限制的是可选菜品种数，而非总份数。没有单品上限时，一个允许的种仍可点无限份。
      if (setLimit === 0 || !dishes.length) return 0;
      if (!blocks.sameDishEnabled || sameDishLimits.some(function (limit) { return limit === Infinity; })) return Infinity;
      return sameDishLimits.sort(function (left, right) { return right - left; }).slice(0, Math.min(setLimit, sameDishLimits.length)).reduce(function (sum, limit) { return sum + limit; }, 0);
    }
    if (rule.targetType === "dish") {
      var dishCapacity = dishes.reduce(function (sum, dish) {
        var key = targetCellKey(partyIndex, roundIndex, dish.productLineId, dish.dishId);
        var limit = effectiveCellLimit(values.targetLimits && values.targetLimits[key], values.tableTargetCaps && values.tableTargetCaps[key], rule.subject, partySize);
        return sum === Infinity || limit === Infinity ? Infinity : sum + limit;
      }, 0);
      return Math.min(sameDishCapacity, dishCapacity);
    }
    var categoryCapacity = (config.categoryTargets || []).reduce(function (sum, category) {
      var key = targetCellKey(partyIndex, roundIndex, category.productLineId, category.categoryId);
      var limit = effectiveCellLimit(values.targetLimits && values.targetLimits[key], values.tableTargetCaps && values.tableTargetCaps[key], rule.subject, partySize);
      return sum === Infinity || limit === Infinity ? Infinity : sum + limit;
    }, 0);
    return Math.min(sameDishCapacity, categoryCapacity);
  }

  function staticViolation(rule, storeId, period, partyRangeIndex, roundRangeIndex, message) {
    return {
      code: "RULE_UNSATISFIABLE",
      ruleId: rule.id,
      storeId: storeId,
      period: period,
      partyRangeIndex: partyRangeIndex,
      roundRangeIndex: roundRangeIndex,
      message: message
    };
  }

  function partyValues(rule) {
    if (rule.subject !== "party_size") return [{ partyRangeIndex: 0, partySize: 1 }];
    var result = [];
    (rule.partyRanges || []).forEach(function (range, index) {
      var min = Number(range && range.min);
      var max = range && range.max == null ? 999999 : Number(range.max);
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) return;
      if (max - min <= 10000) {
        for (var value = min; value <= max; value += 1) result.push({ partyRangeIndex: index, partySize: value });
        return;
      }
      // 有效上下限均为线性或分段线性函数，范围两端足以发现无解；避免无限区间阻塞发布校验。
      result.push({ partyRangeIndex: index, partySize: min });
      result.push({ partyRangeIndex: index, partySize: max });
    });
    return result;
  }

  function roundValues(rule, period) {
    if (period !== "multi_round") return [{ roundRangeIndex: 0 }];
    return (rule.roundRanges || []).reduce(function (result, range, index) {
      var min = Number(range && range.min);
      if (Number.isInteger(min) && min >= 1) result.push({ roundRangeIndex: index });
      return result;
    }, []);
  }

  function scenarioValues(config, period) {
    var values = config && config.periodValues && config.periodValues[period] || {};
    return {
      totalBounds: values.totalBounds || {},
      tableTotalBounds: values.tableTotalBounds || {},
      targetLimits: values.targetLimits || {},
      tableTargetCaps: values.tableTargetCaps || {},
      defaultDishLimits: values.defaultDishLimits || {},
      exceptionDishLimits: values.exceptionDishLimits || {}
    };
  }

  function validateStaticFeasibility(rule) {
    if (!isV4Rule(rule)) return { valid: true, violations: [] };
    var violations = [];
    var stores = rule.deployStoreIds || [];
    rulePeriods(rule).forEach(function (period) {
      var blocks = v4Blocks(rule, period);
      if (!blocks.totalEnabled) return;
      stores.forEach(function (storeId) {
        var config = rule.storeConfigs && rule.storeConfigs[storeId];
        if (!config) return;
        var values = scenarioValues(config, period);
        partyValues(rule).forEach(function (party) {
          roundValues(rule, period).forEach(function (round) {
            var scenario = scenarioKey(party.partyRangeIndex, round.roundRangeIndex);
            var bounds = effectiveBounds(values.totalBounds[scenario], values.tableTotalBounds[scenario], rule.subject, party.partySize);
            if (bounds.min != null && bounds.max != null && bounds.min > bounds.max) {
              violations.push(staticViolation(rule, storeId, period, party.partyRangeIndex, round.roundRangeIndex, "有效最少下单数量大于有效最多下单数量"));
              return;
            }
            if (bounds.min == null) return;
            var capacity = targetCapacity(rule, config, values, scenario, party.partyRangeIndex, round.roundRangeIndex, party.partySize, blocks);
            if (capacity !== Infinity && bounds.min > capacity) {
              violations.push(staticViolation(rule, storeId, period, party.partyRangeIndex, round.roundRangeIndex, "最少下单数量无法由当前商品范围和单品上限满足"));
            }
          });
        });
      });
    });
    return { valid: violations.length === 0, violations: violations };
  }

  function validateAuthorizationCredential(credential, violations, context) {
    if (!credential || !Array.isArray(credential.ruleRefs)) return false;
    if (credential.storeId !== context.storeId || credential.orderId !== context.orderId) return false;
    if (credential.scope === "round" && (context.roundNo == null || credential.roundNo !== context.roundNo)) return false;
    return (violations || []).every(function (violation) {
      return credential.ruleRefs.some(function (ref) { return ref.id === violation.ruleId && ref.version === violation.ruleVersion; });
    });
  }

  function selectRuntimeModule(context) {
    if (!context || (context.orderMode !== "standard" && context.orderMode !== "buffet")) {
      return { allowed: false, code: "ORDER_MODE_REQUIRED" };
    }
    if (context.orderMode === "buffet") {
      if (!context.buffetSessionId) return { allowed: false, code: "BUFFET_SESSION_REQUIRED" };
      return { allowed: true, moduleId: "buffet-rule" };
    }
    return { allowed: true, moduleId: "menu-order-limit" };
  }

  function limitForRound(rule, roundNo) {
    if (rule.period !== "multi_round") return Number(rule.limit);
    var range = (rule.roundLimits || []).find(function (item) {
      return roundNo >= item.min && (item.max == null || roundNo <= item.max);
    });
    return range ? Number(range.limit) : NaN;
  }

  function matchingRangeIndex(ranges, value) {
    var matches = (ranges || []).reduce(function (indexes, range, index) {
      if (Number.isInteger(value) && value >= Number(range.min) && (range.max == null || value <= Number(range.max))) indexes.push(index);
      return indexes;
    }, []);
    return matches.length === 1 ? matches[0] : -1;
  }

  function matrixLimit(rule, partySize, roundNo) {
    var partyIndex = matchingRangeIndex(rule.partyRanges, partySize);
    if (partyIndex < 0) return { valid: false, code: "PARTY_RANGE_INVALID" };
    var roundIndex = 0;
    if (rule.period === "multi_round") {
      roundIndex = matchingRangeIndex(rule.roundRanges, roundNo);
      if (roundIndex < 0) return { valid: false, code: "ROUND_RANGE_INVALID" };
    }
    var row = rule.limitMatrix && rule.limitMatrix[partyIndex];
    var limit = row && Number(row[roundIndex]);
    return Number.isInteger(limit) && limit >= 0
      ? { valid: true, value: limit }
      : { valid: false, code: "LIMIT_INVALID" };
  }

  function effectiveLimit(rule, context) {
    if ((rule.period === "per_round" || rule.period === "multi_round") && (!Number.isInteger(context.roundNo) || context.roundNo < 1)) {
      return { valid: false, code: "ROUND_REQUIRED" };
    }
    if (rule.subject === "party_size" && (!Number.isInteger(context.partySize) || context.partySize < 1)) {
      return { valid: false, code: "PARTY_SIZE_REQUIRED" };
    }
    var configured;
    if (rule.targetType === "dish_set") {
      var storeConfig = rule.storeConfigs && rule.storeConfigs[context.storeId];
      if (!storeConfig) return { valid: false, code: "STORE_CONFIG_REQUIRED" };
      var dishSetPartyIndex = rule.subject === "party_size" ? matchingRangeIndex(rule.partyRanges, context.partySize) : 0;
      var dishSetRoundIndex = rule.period === "multi_round" ? matchingRangeIndex(rule.roundRanges, context.roundNo) : 0;
      if (dishSetPartyIndex < 0) return { valid: false, code: "PARTY_RANGE_INVALID" };
      if (dishSetRoundIndex < 0) return { valid: false, code: "ROUND_RANGE_INVALID" };
      var dishSetCell = storeConfig.dishSetLimits && storeConfig.dishSetLimits[dishSetPartyIndex + "|" + dishSetRoundIndex];
      if (!dishSetCell || !dishSetCell.configured || !Number.isInteger(Number(dishSetCell.value)) || Number(dishSetCell.value) < 0) {
        return { valid: false, code: "LIMIT_INVALID" };
      }
      configured = Number(dishSetCell.value);
      return rule.subject === "order"
        ? { valid: true, value: configured }
        : { valid: true, value: configured * context.partySize };
    }
    if (rule.subject === "party_size" && Array.isArray(rule.partyRanges)) {
      var selected = matrixLimit(rule, context.partySize, context.roundNo);
      if (!selected.valid) return selected;
      configured = selected.value;
    } else {
      configured = limitForRound(rule, context.roundNo);
      if (!Number.isInteger(configured) || configured < 0) return { valid: false, code: "LIMIT_INVALID" };
    }
    if (rule.subject === "order") return { valid: true, value: configured };
    return { valid: true, value: configured * context.partySize };
  }

  function evaluateBatch(input) {
    var selection = selectRuntimeModule(input.context);
    if (!selection.allowed) return selection;
    if (selection.moduleId !== "buffet-rule") return { allowed: true, moduleId: selection.moduleId, violations: [] };
    if (!input.operationId) return { allowed: false, code: "OPERATION_ID_REQUIRED" };
    if ((input.processedOperationIds || []).indexOf(input.operationId) >= 0) {
      return { allowed: true, moduleId: selection.moduleId, duplicate: true, violations: [] };
    }
    var violations = [];
    (input.rules || []).forEach(function (rule) {
      var limit = effectiveLimit(rule, input.context);
      if (!limit.valid) {
        violations.push({ ruleId: rule.id, ruleVersion: rule.version, code: limit.code });
        return;
      }
      var used = Number((input.usedByRule || {})[rule.id] || 0);
      var increment;
      if (rule.targetType === "dish_set" && Array.isArray(input.items)) {
        var storeConfig = rule.storeConfigs && rule.storeConfigs[input.context.storeId];
        var memberKeys = (storeConfig && storeConfig.dishSetMembers || []).map(function (member) {
          return member.productLineId + "|" + member.dishId;
        });
        increment = input.items.reduce(function (sum, item) {
          return memberKeys.indexOf(item.productLineId + "|" + item.dishId) >= 0 ? sum + Number(item.quantity || 0) : sum;
        }, 0);
      } else {
        increment = Number((input.quantityByRule || {})[rule.id] || 0);
      }
      if (used + increment > limit.value) {
        violations.push({ ruleId: rule.id, ruleVersion: rule.version, code: "LIMIT_EXCEEDED", used: used, increment: increment, effectiveLimit: limit.value });
      }
    });
    return { allowed: violations.length === 0, moduleId: selection.moduleId, violations: violations };
  }

  function compileRuntimeRules(records, version) {
    return (records || []).filter(function (record) { return record && record.status === "active"; }).map(function (record) {
      var config = record.authoringConfig || record.authoringDraft || record.editorDraft || record;
      return {
        id: record.id,
        version: version,
        subject: config.subject,
        period: config.period,
        targetType: config.targetType,
        conditions: config.conditions,
        authorization: config.authorization,
        deployStoreIds: config.deployStoreIds,
        storeConfigs: config.storeConfigs
      };
    });
  }

  window.BuffetRuleDomain = {
    conflictMatrix: conflictMatrix,
    mouth: mouth,
    mouthsConflict: mouthsConflict,
    conditionsOverlap: conditionsOverlap,
    targetEntries: targetEntries,
    findConflict: findConflict,
    validateStaticFeasibility: validateStaticFeasibility,
    validateAuthorizationCredential: validateAuthorizationCredential,
    selectRuntimeModule: selectRuntimeModule,
    matchingRangeIndex: matchingRangeIndex,
    effectiveLimit: effectiveLimit,
    evaluateBatch: evaluateBatch,
    compileRuntimeRules: compileRuntimeRules
  };
})();
