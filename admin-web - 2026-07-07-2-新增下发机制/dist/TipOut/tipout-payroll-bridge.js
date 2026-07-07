/**
 * 小费分配结果 → Manage Payroll 宽表（Tips / SVCW）同步桥
 * - 小费池（poolKind !== surcharge）→ adjustments.tips
 * - 加收服务费池（poolKind === surcharge）→ adjustments.svcw
 */
(function (global) {
  "use strict";

  var ALLOC_KEY = "tipout_allocated";
  var PAYROLL_STORAGE_KEY = "tipout-payroll-state-v4";
  var EMPLOYEE_ROSTER_KEY = "tipout-employees-roster-v1";
  var BRIDGE_META_KEY = "tipout-payroll-bridge-meta-v1";
  var SURCHARGE_RULE_SALT = 7919;

  var DEFAULT_EMPLOYEES = [
    { name: "Maria Garcia", role: "Server", tipType: "deduct", baseTip: 185, tipRate: 0.15 },
    { name: "Jason Chen", role: "Server", tipType: "deduct", baseTip: 168, tipRate: 0.15 },
    { name: "Emily Watson", role: "Server", tipType: "deduct", baseTip: 155, tipRate: 0.15 },
    { name: "Diego Ramirez", role: "Server", tipType: "deduct", baseTip: 142, tipRate: 0.15 },
    { name: "Mike Johnson", role: "Bartender", tipType: "deduct", baseTip: 156, tipRate: 0.15 },
    { name: "Sarah Kim", role: "Bartender", tipType: "deduct", baseTip: 138, tipRate: 0.15 },
    { name: "Tom Wilson", role: "Kitchen", tipType: "receive", baseTip: 0, tipRate: 0 },
    { name: "Amy Liu", role: "Kitchen", tipType: "receive", baseTip: 0, tipRate: 0 },
    { name: "Carlos Lopez", role: "Busser", tipType: "receive", baseTip: 0, tipRate: 0 },
    { name: "Tyler Brown", role: "Busser", tipType: "receive", baseTip: 0, tipRate: 0 },
    { name: "Linda Nguyen", role: "Cashier", tipType: "deduct", baseTip: 45, tipRate: 0.15 },
    { name: "Daniel Ortiz", role: "Runner", tipType: "receive", baseTip: 0, tipRate: 0 },
    { name: "Rachel Scott", role: "Host", tipType: "receive", baseTip: 0, tipRate: 0 },
  ];

  function normalizeName(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function roundTip(v) {
    return +(Number(v) || 0).toFixed(2);
  }

  function calcTipAfter(before, deducted, received) {
    return roundTip(before - deducted + received);
  }

  function seedRandom(seed) {
    var s = seed;
    return function () {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function parseIsoDate(iso) {
    if (!iso) return null;
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function parseMdyDate(dateStr) {
    if (!dateStr) return null;
    var m = String(dateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
  }

  function getPeriodDateRange(rangeLabel) {
    if (!rangeLabel) return { start: null, end: null };
    var matches = String(rangeLabel).match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
    return {
      start: matches[0] ? parseMdyDate(matches[0]) : null,
      end: matches[1] ? parseMdyDate(matches[1]) : null,
    };
  }

  function isoDateInPeriod(isoDate, rangeLabel) {
    var d = parseIsoDate(isoDate);
    if (!d) return false;
    var range = getPeriodDateRange(rangeLabel);
    if (!range.start || !range.end) return false;
    var t = startOfDay(d).getTime();
    return t >= startOfDay(range.start).getTime() && t <= startOfDay(range.end).getTime();
  }

  function buildEmployeesFromRoster() {
    try {
      var raw = localStorage.getItem(EMPLOYEE_ROSTER_KEY);
      if (!raw) return DEFAULT_EMPLOYEES.slice();
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || list.length === 0) return DEFAULT_EMPLOYEES.slice();
      return list
        .filter(function (e) {
          return e && String(e.name || "").trim();
        })
        .map(function (e) {
          var role = String(e.role || "").trim();
          var tipType = String(e.tipType || "deduct").trim();
          var tipRate = Number(e.tipRate);
          tipRate = Number.isFinite(tipRate) ? (tipRate > 1 ? tipRate / 100 : tipRate) : 0;
          return {
            name: String(e.name || "").trim(),
            role: role || "Server",
            tipType: tipType === "receive" ? "receive" : "deduct",
            baseTip: Number(e.baseTip) || 0,
            tipRate: tipRate,
          };
        });
    } catch (e) {
      return DEFAULT_EMPLOYEES.slice();
    }
  }

  function splitRulesByPoolKind(store) {
    var all =
      global.ruleData && ruleData.getRulesForStore ? ruleData.getRulesForStore(store) || [] : [];
    var tip = all.filter(function (r) {
      return (r.poolKind || "tip") !== "surcharge";
    });
    var svc = all.filter(function (r) {
      return r.poolKind === "surcharge";
    });
    return { all: all, tip: tip, svc: svc };
  }

  function getDeductorContextForRulesSubset(rules) {
    if (!global.ruleData || !ruleData.buildDeductorContextForRules) {
      return { hasDeductors: false, roles: {}, names: {} };
    }
    var legacy = (rules || []).filter(function (r) {
      return (r.allocationMode || "legacy_pool") === "legacy_pool";
    });
    return ruleData.buildDeductorContextForRules(legacy);
  }

  function isEmployeeInDeductorContext(emp, deductCtx) {
    if (global.ruleData && ruleData.isEmployeeInDeductorContext) {
      return ruleData.isEmployeeInDeductorContext(emp, deductCtx);
    }
    return false;
  }

  function genDailyTipForPool(emp, dateKey, deductCtx, ruleSalt) {
    var salt = ruleSalt || 0;
    var seed =
      dateKey.split("-").reduce(function (a, b) {
        return a * 31 + parseInt(b, 10);
      }, 0) +
      emp.name.length * 7 +
      emp.name.charCodeAt(0) +
      salt;
    var rng = seedRandom(seed);
    var dayOfWeek = new Date(dateKey + "T00:00:00").getDay();
    var weekendBoost = dayOfWeek === 5 || dayOfWeek === 6 ? 1.35 : 1.0;

    var before = 0;
    var deducted = 0;
    var received = 0;
    var shouldDeduct = isEmployeeInDeductorContext(emp, deductCtx);

    if (shouldDeduct) {
      before = roundTip(emp.baseTip * (0.8 + rng() * 0.5) * weekendBoost);
      deducted = roundTip(before * (emp.tipRate || 0));
      if (emp.role === "Server") {
        received = roundTip((18 + rng() * 32) * weekendBoost);
      }
    } else {
      var baseBefore =
        Number(emp.baseTip) > 0 ? emp.baseTip * (0.8 + rng() * 0.5) : 5 + rng() * 12;
      before = roundTip(baseBefore * weekendBoost);
      received = roundTip((25 + rng() * 45) * weekendBoost);
      deducted = 0;
    }

    return calcTipAfter(before, deducted, received);
  }

  function ensureAmountRow(map, name) {
    var key = normalizeName(name);
    if (!map[key]) map[key] = { name: name, tips: 0, svcw: 0 };
    return map[key];
  }

  function computePeriodAmountsForStore(store, dateKeys) {
    var byName = {};
    if (!dateKeys || dateKeys.length === 0) return byName;

    var split = splitRulesByPoolKind(store);
    var employees = buildEmployeesFromRoster();
    var tipCtx = getDeductorContextForRulesSubset(split.tip);
    var svcCtx = getDeductorContextForRulesSubset(split.svc);
    var hasTipRules = split.tip.length > 0;
    var hasSvcRules = split.svc.length > 0;

    dateKeys.forEach(function (dateKey) {
      employees.forEach(function (emp) {
        var row = ensureAmountRow(byName, emp.name);
        if (hasTipRules) {
          row.tips = roundTip(row.tips + genDailyTipForPool(emp, dateKey, tipCtx, 0));
        } else if (!hasSvcRules && split.all.length > 0) {
          var legacyCtx = getDeductorContextForRulesSubset(split.all);
          row.tips = roundTip(row.tips + genDailyTipForPool(emp, dateKey, legacyCtx, 0));
        }
        if (hasSvcRules) {
          row.svcw = roundTip(row.svcw + genDailyTipForPool(emp, dateKey, svcCtx, SURCHARGE_RULE_SALT));
        }
      });
    });

    return byName;
  }

  function getAllocatedStoreMap() {
    try {
      var raw = localStorage.getItem(ALLOC_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function loadPayrollData() {
    try {
      var raw = localStorage.getItem(PAYROLL_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function savePayrollData(data) {
    if (!data) return;
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify(data));
  }

  function saveBridgeMeta(meta) {
    localStorage.setItem(BRIDGE_META_KEY, JSON.stringify(meta));
  }

  function getBridgeMeta() {
    try {
      var raw = localStorage.getItem(BRIDGE_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function applyAmountsToEmployeeList(list, byName, syncedAt) {
    if (!Array.isArray(list) || !byName) return false;
    var changed = false;
    list.forEach(function (emp) {
      if (!emp || !emp.name) return;
      var row = byName[normalizeName(emp.name)];
      if (!row) return;
      if (!emp.adjustments || typeof emp.adjustments !== "object") emp.adjustments = {};
      emp.adjustments.tips = row.tips;
      emp.adjustments.svcw = row.svcw;
      emp.tipoutSyncedAt = syncedAt;
      changed = true;
    });
    return changed;
  }

  function periodHasAllocatedDates(period, storeMap) {
    if (!period || !storeMap) return false;
    return Object.keys(storeMap).some(function (store) {
      var dates = storeMap[store];
      if (!Array.isArray(dates) || dates.length === 0) return false;
      return dates.some(function (d) {
        return isoDateInPeriod(d, period.rangeLabel);
      });
    });
  }

  function computeAllPeriodAmounts() {
    var storeMap = getAllocatedStoreMap();
    var payrollData = loadPayrollData();
    var periods = payrollData && Array.isArray(payrollData.periods) ? payrollData.periods : [];
    var result = {};

    periods.forEach(function (period) {
      if (!period || !period.id) return;
      if (!periodHasAllocatedDates(period, storeMap)) return;

      var merged = {};
      Object.keys(storeMap).forEach(function (store) {
        var dates = storeMap[store];
        if (!Array.isArray(dates) || dates.length === 0) return;

        var periodDates = dates.filter(function (d) {
          return isoDateInPeriod(d, period.rangeLabel);
        });
        if (periodDates.length === 0) return;

        var storeAmounts = computePeriodAmountsForStore(store, periodDates);
        Object.keys(storeAmounts).forEach(function (key) {
          var src = storeAmounts[key];
          if (!merged[key]) {
            merged[key] = { name: src.name, tips: 0, svcw: 0 };
          }
          merged[key].tips = roundTip(merged[key].tips + src.tips);
          merged[key].svcw = roundTip(merged[key].svcw + src.svcw);
        });
      });

      result[period.id] = merged;
    });

    return result;
  }

  function syncToPayrollStorage() {
    var payrollData = loadPayrollData();
    if (!payrollData || !payrollData.employees) return { syncedAt: null, periodIds: [] };

    var storeMap = getAllocatedStoreMap();
    var amountsByPeriod = computeAllPeriodAmounts();
    var syncedAt = new Date().toISOString();
    var periodIds = Object.keys(amountsByPeriod);
    var periods = Array.isArray(payrollData.periods) ? payrollData.periods : [];

    periods.forEach(function (period) {
      if (!period || !period.id) return;
      if (!periodHasAllocatedDates(period, storeMap)) return;

      var byName = amountsByPeriod[period.id] || {};
      var list = payrollData.employees[period.id];
      if (!Array.isArray(list)) return;

      list.forEach(function (emp) {
        if (!emp || !emp.name) return;
        if (!emp.adjustments || typeof emp.adjustments !== "object") emp.adjustments = {};
        var row = byName[normalizeName(emp.name)];
        emp.adjustments.tips = row ? row.tips : 0;
        emp.adjustments.svcw = row ? row.svcw : 0;
        emp.tipoutSyncedAt = syncedAt;
      });
    });

    savePayrollData(payrollData);
    saveBridgeMeta({ lastSyncAt: syncedAt, periodIds: periodIds });

    return { syncedAt: syncedAt, periodIds: periodIds };
  }

  function applyBridgeToPeriod(data, periodId) {
    if (!data || !periodId) return false;
    var stored = loadPayrollData();
    if (!stored || !stored.employees || !Array.isArray(stored.employees[periodId])) return false;
    var srcList = stored.employees[periodId];
    var dstList = data.employees && data.employees[periodId];
    if (!Array.isArray(dstList)) return false;

    var meta = getBridgeMeta();
    var syncedAt = (meta && meta.lastSyncAt) || new Date().toISOString();
    var srcMap = {};
    srcList.forEach(function (emp) {
      if (!emp || !emp.name) return;
      srcMap[normalizeName(emp.name)] = {
        name: emp.name,
        tips: Number(emp.adjustments && emp.adjustments.tips) || 0,
        svcw: Number(emp.adjustments && emp.adjustments.svcw) || 0,
      };
    });
    return applyAmountsToEmployeeList(dstList, srcMap, syncedAt);
  }

  function applyBridgeToAllPeriods(data) {
    if (!data || !data.employees) return false;
    var stored = loadPayrollData();
    if (!stored || !stored.employees) return false;
    var meta = getBridgeMeta();
    var syncedAt = (meta && meta.lastSyncAt) || new Date().toISOString();
    var changed = false;

    Object.keys(stored.employees).forEach(function (periodId) {
      var srcList = stored.employees[periodId];
      var dstList = data.employees[periodId];
      if (!Array.isArray(srcList) || !Array.isArray(dstList)) return;
      var srcMap = {};
      srcList.forEach(function (emp) {
        if (!emp || !emp.name) return;
        srcMap[normalizeName(emp.name)] = {
          name: emp.name,
          tips: Number(emp.adjustments && emp.adjustments.tips) || 0,
          svcw: Number(emp.adjustments && emp.adjustments.svcw) || 0,
        };
      });
      if (applyAmountsToEmployeeList(dstList, srcMap, syncedAt)) changed = true;
    });

    return changed;
  }

  function syncAfterAllocation(store, dateStart, dateEnd) {
    var result = syncToPayrollStorage();
    return {
      store: store || "",
      dateStart: dateStart || "",
      dateEnd: dateEnd || "",
      syncedAt: result.syncedAt,
      periodIds: result.periodIds,
    };
  }

  global.TipOutPayrollBridge = {
    normalizeName: normalizeName,
    syncAfterAllocation: syncAfterAllocation,
    syncToPayrollStorage: syncToPayrollStorage,
    applyBridgeToPeriod: applyBridgeToPeriod,
    applyBridgeToAllPeriods: applyBridgeToAllPeriods,
    computePeriodAmountsForStore: computePeriodAmountsForStore,
  };
})(typeof window !== "undefined" ? window : global);
