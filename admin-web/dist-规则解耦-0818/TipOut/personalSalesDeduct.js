/**
 * TipOut · 按个人销售额占比扣除
 *
 * 应扣_i = S_i × r
 * 实扣_i = min(应扣_i, 分配前小费_i)
 * 分配后小费_i = 分配前小费_i − 实扣_i
 * 未扣足_i = 应扣_i − 实扣_i
 *
 * 每人扣额只依赖本人销售额，不受其他员工销售额影响。
 */
(function (root) {
  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function roundMoney(x) {
    var n = Number(x);
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  function entryHasScope(entry) {
    if (Array.isArray(entry)) {
      return entry.some(function (e) {
        return entryHasScope(e);
      });
    }
    if (!entry || !entry.scopeType) return false;
    if (entry.scopeType === "role" && entry.roles && entry.roles.length > 0) return true;
    if (entry.scopeType === "employee") {
      var emps = Array.isArray(entry.employee) ? entry.employee : [];
      if (emps.length > 0) return true;
      if (Array.isArray(entry.employeeRoles) && entry.employeeRoles.length > 0) return true;
    }
    return false;
  }

  /**
   * 员工是否落在 deductConfig.personalSalesPct（或同类）scope 内
   * @param {{ name?: string, role?: string }} emp
   * @param {object} entry
   */
  function employeeMatchesScope(emp, entry) {
    if (!entryHasScope(entry)) return false;
    emp = emp || {};
    var role = String(emp.role || "").trim();
    var name = String(emp.name || "").trim();
    if (entry.scopeType === "role") {
      return (entry.roles || []).some(function (r) {
        return String(r || "").trim() === role;
      });
    }
    var empList = Array.isArray(entry.employee) ? entry.employee : [];
    if (empList.length > 0) {
      return empList.some(function (n) {
        return String(n || "").trim() === name;
      });
    }
    if (Array.isArray(entry.employeeRoles) && entry.employeeRoles.length) {
      return entry.employeeRoles.some(function (r) {
        return String(r || "").trim() === role;
      });
    }
    return false;
  }

  /**
   * @param {{ salesAmount?: number, rate?: number, tipBefore?: number }} input
   * rate 为小数，如 0.03 表示 3%
   */
  function calcPersonalSalesDeduct(input) {
    input = input || {};
    var S = Math.max(0, num(input.salesAmount));
    var r = Math.max(0, num(input.rate));
    var tipBefore = Math.max(0, num(input.tipBefore));
    var due = roundMoney(S * r);
    var actual = roundMoney(Math.min(due, tipBefore));
    var tipAfter = roundMoney(tipBefore - actual);
    var shortfall = roundMoney(due - actual);
    return {
      salesAmount: roundMoney(S),
      rate: r,
      due: due,
      actual: actual,
      tipBefore: roundMoney(tipBefore),
      tipAfter: tipAfter,
      shortfall: shortfall,
    };
  }

  /**
   * @param {Array<{ id?: string, salesAmount: number, tipBefore: number }>} employees
   * @param {number} rate
   */
  function calcPersonalSalesDeductForEmployees(employees, rate) {
    return (employees || []).map(function (emp) {
      emp = emp || {};
      var row = calcPersonalSalesDeduct({
        salesAmount: emp.salesAmount,
        rate: rate,
        tipBefore: emp.tipBefore,
      });
      row.id = emp.id;
      if (emp.name != null) row.name = emp.name;
      if (emp.role != null) row.role = emp.role;
      return row;
    });
  }

  function asEntryList(val) {
    if (!val) return [];
    return Array.isArray(val) ? val.filter(Boolean) : [val];
  }

  /**
   * 从规则 deductConfig.personalSalesPct 对员工列表计提（支持单条对象或多条数组）
   * 多条命中时：应扣 = Σ(S_i × r_k)，再与小费前取 min
   * @param {object} rule
   * @param {Array<{ id?: string, name?: string, role?: string, salesAmount: number, tipBefore: number }>} employees
   */
  function applyPersonalSalesDeductFromRule(rule, employees) {
    var entries = asEntryList(
      rule && rule.deductConfig ? rule.deductConfig.personalSalesPct : null
    ).filter(entryHasScope);
    var empty = {
      active: false,
      rate: 0,
      rows: [],
      totalDue: 0,
      totalActual: 0,
      totalShortfall: 0,
      poolContribution: 0,
    };
    if (!entries.length) return empty;

    var rows = [];
    var totalDue = 0;
    var totalActual = 0;
    var totalShortfall = 0;

    (employees || []).forEach(function (emp) {
      emp = emp || {};
      var tipBefore = roundMoney(num(emp.tipBefore));
      var S = Math.max(0, num(emp.salesAmount));
      var due = 0;
      var matched = false;
      var matchedRate = 0;
      entries.forEach(function (entry) {
        if (!employeeMatchesScope(emp, entry)) return;
        matched = true;
        var r = Math.max(0, num(entry.rate));
        matchedRate = roundMoney(matchedRate + r);
        due = roundMoney(due + S * r);
      });
      if (!matched) {
        rows.push({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          matched: false,
          salesAmount: roundMoney(S),
          rate: 0,
          due: 0,
          actual: 0,
          tipBefore: tipBefore,
          tipAfter: tipBefore,
          shortfall: 0,
        });
        return;
      }
      var row = calcPersonalSalesDeduct({
        salesAmount: S,
        rate: matchedRate,
        tipBefore: tipBefore,
      });
      // 多档命中时 due 可能不是 S×Σr 的单次 round，以累加 due 为准
      row.due = due;
      row.actual = roundMoney(Math.min(due, tipBefore));
      row.tipAfter = roundMoney(tipBefore - row.actual);
      row.shortfall = roundMoney(due - row.actual);
      row.rate = matchedRate;
      row.id = emp.id;
      row.name = emp.name;
      row.role = emp.role;
      row.matched = true;
      rows.push(row);
      totalDue = roundMoney(totalDue + row.due);
      totalActual = roundMoney(totalActual + row.actual);
      totalShortfall = roundMoney(totalShortfall + row.shortfall);
    });

    return {
      active: true,
      rate: entries.length === 1 ? Math.max(0, num(entries[0].rate)) : 0,
      entries: entries,
      entry: entries[0],
      rows: rows,
      totalDue: totalDue,
      totalActual: totalActual,
      totalShortfall: totalShortfall,
      poolContribution: totalActual,
    };
  }

  /**
   * 是否匹配销售额取值条件中的人员过滤（角色/员工）
   * 无角色、无员工筛选时视为全员命中（其它条件由上游订单过滤承担）
   */
  function employeeMatchesSalesPoolConditions(emp, cond) {
    cond = cond || {};
    emp = emp || {};
    var name = String(emp.name || "").trim();
    var role = String(emp.role || "").trim();
    var hasEmp = Array.isArray(cond.employee) && cond.employee.length > 0;
    var hasRole = Array.isArray(cond.role) && cond.role.length > 0;
    var hasEmpRoles = Array.isArray(cond.employeeRoles) && cond.employeeRoles.length > 0;
    if (!hasEmp && !hasRole && !hasEmpRoles) return true;
    if (hasEmp) {
      return cond.employee.some(function (n) {
        return String(n || "").trim() === name;
      });
    }
    if (hasRole) {
      return cond.role.some(function (r) {
        return String(r || "").trim() === role;
      });
    }
    return cond.employeeRoles.some(function (r) {
      return String(r || "").trim() === role;
    });
  }

  /**
   * 单条「按个人销售额」池卡片：贡献 = Σ(S_i × pct/100)，仅计命中条件的员工
   * @param {{ pct?: number, conditions?: object }} pr
   * @param {Array<{ id?: string, name?: string, role?: string, salesAmount?: number }>} employees
   */
  function calcPersonalSalesPoolCard(pr, employees) {
    pr = pr || {};
    var rate = Math.max(0, num(pr.pct)) / 100;
    var matchedSales = 0;
    var contribution = 0;
    var byEmployee = {};
    (employees || []).forEach(function (emp) {
      emp = emp || {};
      if (!employeeMatchesSalesPoolConditions(emp, pr.conditions)) return;
      var s = Math.max(0, num(emp.salesAmount));
      var due = roundMoney(s * rate);
      matchedSales = roundMoney(matchedSales + s);
      contribution = roundMoney(contribution + due);
      var key = emp.id != null && emp.id !== "" ? String(emp.id) : String(emp.name || "");
      if (key) {
        byEmployee[key] = {
          name: emp.name,
          role: emp.role,
          salesAmount: roundMoney(s),
          contribution: due,
        };
      }
    });
    return {
      matchedSales: matchedSales,
      rate: rate,
      pct: num(pr.pct),
      contribution: contribution,
      byEmployee: byEmployee,
    };
  }

  /**
   * 汇总规则中所有 type=personal_sales 的池卡片贡献
   * @param {Array} poolRules
   * @param {Array} employees
   */
  function calcPersonalSalesPoolFromRules(poolRules, employees) {
    var total = 0;
    var byRuleId = {};
    var byEmployee = {};
    (poolRules || []).forEach(function (pr) {
      if (!pr || pr.type !== "personal_sales") return;
      var card = calcPersonalSalesPoolCard(pr, employees);
      var rid = pr.id || pr.type;
      byRuleId[rid] = card;
      total = roundMoney(total + card.contribution);
      Object.keys(card.byEmployee || {}).forEach(function (k) {
        var row = card.byEmployee[k];
        if (!byEmployee[k]) {
          byEmployee[k] = {
            name: row.name,
            role: row.role,
            salesAmount: row.salesAmount,
            contribution: 0,
          };
        }
        byEmployee[k].contribution = roundMoney(byEmployee[k].contribution + row.contribution);
      });
    });
    return { total: total, byRuleId: byRuleId, byEmployee: byEmployee };
  }

  var api = {
    roundMoney: roundMoney,
    entryHasScope: entryHasScope,
    employeeMatchesScope: employeeMatchesScope,
    calcPersonalSalesDeduct: calcPersonalSalesDeduct,
    calcPersonalSalesDeductForEmployees: calcPersonalSalesDeductForEmployees,
    applyPersonalSalesDeductFromRule: applyPersonalSalesDeductFromRule,
    employeeMatchesSalesPoolConditions: employeeMatchesSalesPoolConditions,
    calcPersonalSalesPoolCard: calcPersonalSalesPoolCard,
    calcPersonalSalesPoolFromRules: calcPersonalSalesPoolFromRules,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TipOutPersonalSalesDeduct = api;
})(typeof window !== "undefined" ? window : globalThis);
