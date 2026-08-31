(function () {
  "use strict";

  var conflictMatrix = {
    order_lifetime: { order_lifetime: true, party_order_lifetime: false, party_per_round: false, party_multi_round: false },
    party_order_lifetime: { order_lifetime: false, party_order_lifetime: true, party_per_round: false, party_multi_round: false },
    party_per_round: { order_lifetime: false, party_order_lifetime: false, party_per_round: true, party_multi_round: true },
    party_multi_round: { order_lifetime: false, party_order_lifetime: false, party_per_round: true, party_multi_round: true }
  };

  function mouth(rule) {
    if (rule.subject === "order") return rule.period === "per_round" ? "order_per_round" : "order_lifetime";
    if (rule.period === "order_lifetime") return "party_order_lifetime";
    if (rule.period === "per_round") return "party_per_round";
    return "party_multi_round";
  }

  function mouthsConflict(left, right) {
    if (left === "order_per_round" || right === "order_per_round") return left === right;
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
      return (conditions.daysOfWeek || []).indexOf(ids[date.getUTCDay()]) >= 0;
    }
    if (cycle === "monthly") return (conditions.daysOfMonth || []).indexOf(date.getUTCDate()) >= 0;
    return true;
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
      if ((draft.constraintKind || "target_max") !== "target_max") {
        if (config.included !== false) rows.push({ storeId: storeId, lineId: "", targetType: draft.constraintKind, targetId: draft.constraintKind });
        return rows;
      }
      if (draft.targetType === "dish_set") {
        (config.dishSetMembers || []).forEach(function (member) {
          rows.push({ storeId: storeId, lineId: member.productLineId, targetType: "dish_set", targetId: String(member.dishId) });
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

  function findConflict(candidate, records, excludeIds) {
    var candidateTargets = targetEntries(candidate);
    var excluded = (excludeIds || []).map(String);
    for (var index = 0; index < (records || []).length; index += 1) {
      var record = records[index];
      if (!record || record.status !== "active" || excluded.indexOf(String(record.id)) >= 0) continue;
      var existing = record.authoringConfig || record.authoringDraft || record.editorDraft || record;
      if ((candidate.constraintKind || "target_max") !== (existing.constraintKind || "target_max")) continue;
      if (!mouthsConflict(mouth(candidate), mouth(existing))) continue;
      if (!conditionsOverlap(candidate.conditions, existing.conditions)) continue;
      var existingTargets = targetEntries(existing);
      var duplicate = candidateTargets.find(function (left) { return existingTargets.some(function (right) { return sameTarget(left, right); }); });
      if (duplicate) return { ruleId: record.id, target: duplicate, existingMouth: mouth(existing), candidateMouth: mouth(candidate) };
    }
    return null;
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
    var supportedMax = Number(rule.supportedPartySizeMax || (rule.storeConfigs && rule.storeConfigs[context.storeId] && rule.storeConfigs[context.storeId].supportedPartySizeMax));
    if (Number.isInteger(supportedMax) && Number.isInteger(context.partySize) && context.partySize > supportedMax) {
      return { valid: false, code: "PARTY_SIZE_ABOVE_SUPPORTED_MAX" };
    }
    if ((rule.period === "per_round" || rule.period === "multi_round") && (!Number.isInteger(context.roundNo) || context.roundNo < 1)) {
      return { valid: false, code: "ROUND_REQUIRED" };
    }
    if (rule.subject === "party_size" && (!Number.isInteger(context.partySize) || context.partySize < 1)) {
      return { valid: false, code: "PARTY_SIZE_REQUIRED" };
    }
    var configured;
    var partyIndex = rule.subject === "party_size" ? matchingRangeIndex(rule.partyRanges, context.partySize) : 0;
    var roundIndex = rule.period === "multi_round" ? matchingRangeIndex(rule.roundRanges, context.roundNo) : 0;
    var cellKey = partyIndex + "|" + roundIndex;
    var scopedStoreConfig = rule.storeConfigs && rule.storeConfigs[context.storeId];
    if (rule.constraintKind === "round_total") {
      if (partyIndex < 0) return { valid: false, code: "PARTY_RANGE_INVALID" };
      var boundCell = scopedStoreConfig && scopedStoreConfig.totalBounds && scopedStoreConfig.totalBounds[cellKey];
      if (!boundCell) return { valid: false, code: "TOTAL_BOUNDS_INVALID" };
      var maximum = boundCell.maxConfigured ? Number(boundCell.max) : Infinity;
      if (boundCell.maxConfigured && (!Number.isInteger(maximum) || maximum < 0)) return { valid: false, code: "TOTAL_BOUNDS_INVALID" };
      return { valid: true, value: rule.subject === "party_size" ? maximum * context.partySize : maximum };
    }
    if (rule.constraintKind === "same_dish_max") {
      if (partyIndex < 0) return { valid: false, code: "PARTY_RANGE_INVALID" };
      var sameCell = scopedStoreConfig && scopedStoreConfig.sameDishLimits && scopedStoreConfig.sameDishLimits[cellKey];
      if (sameCell) {
        if (!sameCell.configured || !Number.isInteger(Number(sameCell.value)) || Number(sameCell.value) < 0) return { valid: false, code: "LIMIT_INVALID" };
        configured = Number(sameCell.value);
        return { valid: true, value: rule.subject === "party_size" ? configured * context.partySize : configured };
      }
    }
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

  function totalBoundForRule(rule, context) {
    var limitCheck = effectiveLimit(rule, context);
    if (!limitCheck.valid) return limitCheck;
    var partyIndex = rule.subject === "party_size" ? matchingRangeIndex(rule.partyRanges, context.partySize) : 0;
    var roundIndex = rule.period === "multi_round" ? matchingRangeIndex(rule.roundRanges, context.roundNo) : 0;
    var config = rule.storeConfigs && rule.storeConfigs[context.storeId];
    var cell = config && config.totalBounds && config.totalBounds[partyIndex + "|" + roundIndex];
    var multiplier = rule.subject === "party_size" ? context.partySize : 1;
    return {
      valid: true,
      min: cell.minConfigured ? Number(cell.min) * multiplier : 0,
      max: cell.maxConfigured ? Number(cell.max) * multiplier : Infinity
    };
  }

  function mergeTotalBounds(rules, context) {
    var result = { valid: true, min: 0, max: Infinity, minRuleIds: [], maxRuleIds: [] };
    for (var index = 0; index < (rules || []).length; index += 1) {
      var rule = rules[index];
      if (rule.constraintKind !== "round_total") continue;
      var bound = totalBoundForRule(rule, context);
      if (!bound.valid) return bound;
      result.min = Math.max(result.min, bound.min);
      result.max = Math.min(result.max, bound.max);
      var config = rule.storeConfigs && rule.storeConfigs[context.storeId];
      var partyIndex = rule.subject === "party_size" ? matchingRangeIndex(rule.partyRanges, context.partySize) : 0;
      var cell = config && config.totalBounds && config.totalBounds[partyIndex + "|0"];
      if (cell && cell.minConfigured) result.minRuleIds.push(rule.id);
      if (cell && cell.maxConfigured) result.maxRuleIds.push(rule.id);
    }
    if (result.min > result.max) return { valid: false, code: "ROUND_TOTAL_UNSATISFIABLE", min: result.min, max: result.max, ruleIds: result.minRuleIds.concat(result.maxRuleIds) };
    return result;
  }

  function itemQuantity(items) {
    return (items || []).reduce(function (sum, item) { return sum + Number(item.quantity || 0); }, 0);
  }

  function itemKey(item) { return String(item.productLineId) + "|" + String(item.dishId); }

  function targetList(rule, context) {
    if (Array.isArray(rule.targets)) return rule.targets;
    var config = rule.storeConfigs && rule.storeConfigs[context.storeId];
    var rows = [];
    (config && config.productLines || []).forEach(function (lineId) {
      (config.targetIds || []).forEach(function (targetId) { rows.push({ productLineId: lineId, targetId: targetId }); });
    });
    return rows;
  }

  function groupedMaximum(rule, context, items) {
    var groups = {};
    if (rule.constraintKind === "same_dish_max") {
      (items || []).forEach(function (item) { groups[itemKey(item)] = (groups[itemKey(item)] || 0) + Number(item.quantity || 0); });
    } else if (rule.targetType === "dish_set") {
      var config = rule.storeConfigs && rule.storeConfigs[context.storeId];
      var members = (config && config.dishSetMembers || []).map(function (member) { return member.productLineId + "|" + member.dishId; });
      groups.set = (items || []).reduce(function (sum, item) { return members.indexOf(itemKey(item)) >= 0 ? sum + Number(item.quantity || 0) : sum; }, 0);
    } else {
      targetList(rule, context).forEach(function (target) {
        var key = target.productLineId + "|" + target.targetId;
        groups[key] = (items || []).reduce(function (sum, item) {
          var value = rule.targetType === "category" ? item.categoryId : item.dishId;
          return String(item.productLineId) === String(target.productLineId) && String(value) === String(target.targetId) ? sum + Number(item.quantity || 0) : sum;
        }, 0);
      });
    }
    return Object.keys(groups).reduce(function (maximum, key) { return Math.max(maximum, groups[key]); }, 0);
  }

  function targetMatrixViolations(rule, context, items) {
    if (rule.constraintKind !== "target_max" || (rule.targetType !== "dish" && rule.targetType !== "category")) return null;
    var config = rule.storeConfigs && rule.storeConfigs[context.storeId];
    if (!config || !config.limits) return null;
    var partyIndex = rule.subject === "party_size" ? matchingRangeIndex(rule.partyRanges, context.partySize) : 0;
    var roundIndex = rule.period === "multi_round" ? matchingRangeIndex(rule.roundRanges, context.roundNo) : 0;
    if (partyIndex < 0) return [{ ruleId: rule.id, ruleVersion: rule.version, code: "PARTY_RANGE_INVALID" }];
    if (roundIndex < 0) return [{ ruleId: rule.id, ruleVersion: rule.version, code: "ROUND_RANGE_INVALID" }];
    var multiplier = rule.subject === "party_size" ? context.partySize : 1;
    return targetList(rule, context).reduce(function (violations, target) {
      var key = partyIndex + "|" + roundIndex + "|" + target.productLineId + "|" + target.targetId;
      var cell = config.limits[key];
      if (!cell || !cell.configured || !Number.isInteger(Number(cell.value)) || Number(cell.value) < 0) {
        violations.push({ ruleId: rule.id, ruleVersion: rule.version, code: "LIMIT_INVALID", targetId: target.targetId });
        return violations;
      }
      var quantity = (items || []).reduce(function (sum, item) {
        var identity = rule.targetType === "category" ? item.categoryId : item.dishId;
        return String(item.productLineId) === String(target.productLineId) && String(identity) === String(target.targetId) ? sum + Number(item.quantity || 0) : sum;
      }, 0);
      var limit = Number(cell.value) * multiplier;
      if (quantity > limit) violations.push({ ruleId: rule.id, ruleVersion: rule.version, code: "LIMIT_EXCEEDED", increment: quantity, effectiveLimit: limit, targetId: target.targetId });
      return violations;
    }, []);
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
    var allItems = (input.usedItems || []).concat(input.items || []);
    var totals = mergeTotalBounds(input.rules, input.context);
    if (!totals.valid) return { allowed: false, moduleId: selection.moduleId, violations: [{ code: totals.code, ruleIds: totals.ruleIds }] };
    var totalQuantity = allItems.length ? itemQuantity(allItems) : Number(input.totalQuantity || 0);
    if (totalQuantity > totals.max) violations.push({ code: "ROUND_TOTAL_MAX_EXCEEDED", effectiveLimit: totals.max, ruleIds: totals.maxRuleIds });
    var phase = input.phase || input.context.phase || "add";
    if (["submit_round", "end_round", "next_round", "checkout"].indexOf(phase) >= 0 && totalQuantity > 0 && totalQuantity < totals.min) {
      violations.push({ code: "ROUND_TOTAL_MIN_NOT_MET", effectiveMinimum: totals.min, ruleIds: totals.minRuleIds });
    }
    (input.rules || []).forEach(function (rule) {
      if (rule.constraintKind === "round_total") return;
      var matrixViolations = targetMatrixViolations(rule, input.context, allItems);
      if (matrixViolations) {
        violations = violations.concat(matrixViolations);
        return;
      }
      var limit = effectiveLimit(rule, input.context);
      if (!limit.valid) {
        violations.push({ ruleId: rule.id, ruleVersion: rule.version, code: limit.code });
        return;
      }
      var used = Number((input.usedByRule || {})[rule.id] || 0);
      var increment;
      if (allItems.length && (rule.constraintKind === "same_dish_max" || rule.targetType === "dish" || rule.targetType === "category" || rule.targetType === "dish_set")) {
        if (Array.isArray(input.usedItems)) {
          used = 0;
          increment = groupedMaximum(rule, input.context, allItems);
        } else {
          increment = groupedMaximum(rule, input.context, input.items || []);
        }
      } else if (rule.targetType === "dish_set" && Array.isArray(input.items)) {
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
        schemaVersion: config.schemaVersion,
        constraintKind: config.constraintKind || "target_max",
        subject: config.subject,
        period: config.period,
        targetType: config.targetType,
        conditions: config.conditions,
        authorization: config.authorization,
        deployStoreIds: config.deployStoreIds,
        storeConfigs: config.storeConfigs
        ,partyRanges: config.partyRanges
        ,roundRanges: config.roundRanges
        ,supportedPartySizeMax: config.supportedPartySizeMax
        ,limit: config.limit
        ,limitMatrix: config.limitMatrix
        ,roundLimits: config.roundLimits
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
    validateAuthorizationCredential: validateAuthorizationCredential,
    selectRuntimeModule: selectRuntimeModule,
    matchingRangeIndex: matchingRangeIndex,
    effectiveLimit: effectiveLimit,
    mergeTotalBounds: mergeTotalBounds,
    evaluateBatch: evaluateBatch,
    compileRuntimeRules: compileRuntimeRules
  };
})();
