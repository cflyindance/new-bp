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

  function effectiveLimit(rule, context) {
    if ((rule.period === "per_round" || rule.period === "multi_round") && (!Number.isInteger(context.roundNo) || context.roundNo < 1)) {
      return { valid: false, code: "ROUND_REQUIRED" };
    }
    var configured = limitForRound(rule, context.roundNo);
    if (!Number.isInteger(configured) || configured < 0) return { valid: false, code: "LIMIT_INVALID" };
    if (rule.subject === "order") return { valid: true, value: configured };
    if (!Number.isInteger(context.partySize) || context.partySize < 1) return { valid: false, code: "PARTY_SIZE_REQUIRED" };
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
      var increment = Number((input.quantityByRule || {})[rule.id] || 0);
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
    validateAuthorizationCredential: validateAuthorizationCredential,
    selectRuntimeModule: selectRuntimeModule,
    effectiveLimit: effectiveLimit,
    evaluateBatch: evaluateBatch,
    compileRuntimeRules: compileRuntimeRules
  };
})();
