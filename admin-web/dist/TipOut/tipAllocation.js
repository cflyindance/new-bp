/**
 * 计提小费占比分配（order_tip_then_residual）计算引擎
 * 与规则字段 allocationMode、poolRules、tipClaims、residual 配合使用；
 * 订单小费钱包按与小费池汇总分配相同的 poolRules 合计逻辑（单笔订单上下文）。
 */
(function (global) {
  function roundMoney(x) {
    var n = Number(x);
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  }

  function lineMatchesFilter(line, filter) {
    filter = filter || {};
    var pl = filter.productLines || [];
    var cats = filter.categories || [];
    var plOk = !pl.length || pl.indexOf(line.productLine) >= 0;
    var catOk = !cats.length || cats.indexOf(line.category) >= 0;
    return plOk && catOk;
  }

  function categorySalesFromLines(lines, filter) {
    var sum = 0;
    (lines || []).forEach(function (line) {
      if (lineMatchesFilter(line, filter)) sum += Number(line.amount) || 0;
    });
    return roundMoney(sum);
  }

  function orderTipWallet(tipByType, tipTypes) {
    tipByType = tipByType || {};
    if (!tipTypes || !tipTypes.length) {
      var t = 0;
      Object.keys(tipByType).forEach(function (k) {
        t += Number(tipByType[k]) || 0;
      });
      return roundMoney(t);
    }
    var t2 = 0;
    tipTypes.forEach(function (tp) {
      t2 += Number(tipByType[tp]) || 0;
    });
    return roundMoney(t2);
  }

  /**
   * 单笔订单下按 poolRules 合计「订单小费钱包」（与 detail genDayData / 小费池汇总口径一致）
   * @param {Array} poolRules
   * @param {object} ctx - { lines, tipByType, surcharge?, manual? }
   */
  function orderTipPoolFromPoolRules(poolRules, ctx) {
    ctx = ctx || {};
    var lines = ctx.lines || [];
    var sales = 0;
    lines.forEach(function (l) {
      sales += Number(l.amount) || 0;
    });
    sales = roundMoney(sales);
    var tipByType = ctx.tipByType || {};
    var tipsTotal = 0;
    Object.keys(tipByType).forEach(function (k) {
      tipsTotal += Number(tipByType[k]) || 0;
    });
    tipsTotal = roundMoney(tipsTotal);
    var surcharge = roundMoney(Number(ctx.surcharge) || 0);
    var manual = roundMoney(Number(ctx.manual) || 0);

    var prules = poolRules || [];
    var salesCount = 0;
    var tipsCount = 0;
    var surchargeCount = 0;
    prules.forEach(function (pr) {
      if (pr.type === 'sales') salesCount++;
      else if (pr.type === 'tips') tipsCount++;
      else if (pr.type === 'surcharge') surchargeCount++;
    });

    var pool = 0;
    prules.forEach(function (pr) {
      var base = 0;
      if (pr.type === 'sales') base = salesCount > 0 ? sales / salesCount : sales;
      else if (pr.type === 'tips') base = tipsCount > 0 ? tipsTotal / tipsCount : tipsTotal;
      else if (pr.type === 'surcharge') base = surchargeCount > 0 ? surcharge / surchargeCount : surcharge;
      else if (pr.type === 'manual') base = manual;
      else if (pr.type === 'custom') base = pr.amount != null ? Number(pr.amount) || 0 : 0;
      else if (pr.type === 'personal_sales') {
        var empSales = ctx.employeeSales;
        var personalApi =
          typeof global.TipOutPersonalSalesDeduct !== 'undefined'
            ? global.TipOutPersonalSalesDeduct
            : null;
        if (personalApi && personalApi.calcPersonalSalesPoolCard && empSales && empSales.length) {
          var card = personalApi.calcPersonalSalesPoolCard(pr, empSales);
          pool += roundMoney(card.contribution || 0);
          return;
        }
        // 无按人员拆额时：退回按总销售额×占比（兼容演示）
        base = sales;
      }
      pool += roundMoney((base * (Number(pr.pct) || 0)) / 100);
    });
    return roundMoney(pool);
  }

  /**
   * @param {object} rule - 含 poolRules、tipClaims、residual；兼容旧字段 orderTipSource
   * @param {object} ctx - { lines: [{productLine,category,amount}], tipByType?: {}, tipTotal?: number, surcharge?, manual? }
   */
  function allocateOrderTipResidual(rule, ctx) {
    ctx = ctx || {};
    var lines = ctx.lines || [];
    var tipWallet;
    if (ctx.tipTotal != null) {
      tipWallet = roundMoney(ctx.tipTotal);
    } else if (rule.poolRules && rule.poolRules.length) {
      tipWallet = orderTipPoolFromPoolRules(rule.poolRules, ctx);
    } else {
      tipWallet = orderTipWallet(ctx.tipByType, (rule.orderTipSource && rule.orderTipSource.tipTypes) || []);
    }

    var claims = (rule.tipClaims || []).slice().sort(function (a, b) {
      var oa = a.order != null ? Number(a.order) : 0;
      var ob = b.order != null ? Number(b.order) : 0;
      if (oa !== ob) return oa - ob;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    var remaining = tipWallet;
    var claimResults = [];
    var roleAmounts = {};

    claims.forEach(function (claim) {
      var filter =
        claim.base && claim.base.menuFilter ? claim.base.menuFilter : {};
      var base = categorySalesFromLines(lines, filter);
      var pct = Number(claim.pct) || 0;
      var claimed = roundMoney((base * pct) / 100);
      var paid = Math.min(claimed, remaining);
      remaining = roundMoney(remaining - paid);
      var receivers = claim.receiverRoles || [];
      var perRole = receivers.length ? roundMoney(paid / receivers.length) : 0;
      receivers.forEach(function (r) {
        roleAmounts[r] = roundMoney((roleAmounts[r] || 0) + perRole);
      });
      var cr = {
        id: claim.id,
        name: claim.name,
        base: base,
        pct: pct,
        claimed: claimed,
        paid: paid,
        receiverRoles: receivers.slice()
      };
      if (claim.employeeWeights && typeof claim.employeeWeights === 'object' && Object.keys(claim.employeeWeights).length) {
        cr.employeeWeights = claim.employeeWeights;
      }
      claimResults.push(cr);
    });

    var residual = remaining;
    var residualMeta = allocateResidualByReceivers(residual, rule.residual, roleAmounts);

    return {
      tipWallet: tipWallet,
      claimResults: claimResults,
      residual: residual,
      residualRoles: residualMeta.residualRoles.slice(),
      roleAmounts: roleAmounts
    };
  }

  /** 将金额按角色均分写入 roleAmounts；最后一角色吸收舍入误差 */
  function distributeEqualAmongRoles(amount, roles, roleAmounts) {
    roles = roles || [];
    if (!roles.length) return;
    var a = roundMoney(Number(amount) || 0);
    if (a <= 0) return;
    var n = roles.length;
    var base = roundMoney(a / n);
    var allocated = 0;
    for (var i = 0; i < n; i++) {
      var piece = i === n - 1 ? roundMoney(a - allocated) : base;
      var r = roles[i];
      roleAmounts[r] = roundMoney((roleAmounts[r] || 0) + piece);
      allocated = roundMoney(allocated + piece);
    }
  }

  /**
   * 剩余小费接收方规则：与接收方规则一致 — residual.receivers 按行 pct 占比分剩余；行内有 subReceivers 则按子行 pct 再分；否则行内多角色均分。
   * 兼容旧数据 residual.receiverRoles（整笔剩余均分）。
   */
  function allocateResidualByReceivers(remaining, residualRule, roleAmounts) {
    residualRule = residualRule || {};
    var receivers = residualRule.receivers;
    var legacyRoles = residualRule.receiverRoles;
    var summary = [];

    function pushUniqueRoles(roles) {
      (roles || []).forEach(function (rr) {
        if (summary.indexOf(rr) < 0) summary.push(rr);
      });
    }

    if (Array.isArray(receivers) && receivers.length > 0) {
      var valid = receivers.filter(function (r) {
        var rl = r.roles || [];
        return rl.length > 0 && Number(r.pct) > 0;
      });
      if (!valid.length) {
        distributeEqualAmongRoles(remaining, ['Server'], roleAmounts);
        return { residualRoles: ['Server'] };
      }
      var sumPct = 0;
      valid.forEach(function (r) {
        sumPct += Number(r.pct) || 0;
      });
      if (sumPct <= 0) {
        distributeEqualAmongRoles(remaining, ['Server'], roleAmounts);
        return { residualRoles: ['Server'] };
      }
      var allocatedTotal = 0;
      valid.forEach(function (rec, idx) {
        var rowAmt =
          idx === valid.length - 1
            ? roundMoney(remaining - allocatedTotal)
            : roundMoney((remaining * (Number(rec.pct) || 0)) / sumPct);
        allocatedTotal = roundMoney(allocatedTotal + rowAmt);
        var subs = rec.subReceivers;
        var usedSubs = false;
        if (subs && subs.length) {
          var svalid = subs.filter(function (s) {
            return (s.roles || []).length > 0 && Number(s.pct) > 0;
          });
          var subSum = 0;
          svalid.forEach(function (s) {
            subSum += Number(s.pct) || 0;
          });
          if (subSum > 0) {
            usedSubs = true;
            var subAlloc = 0;
            svalid.forEach(function (sub, si) {
              var subAmt =
                si === svalid.length - 1
                  ? roundMoney(rowAmt - subAlloc)
                  : roundMoney((rowAmt * (Number(sub.pct) || 0)) / subSum);
              subAlloc = roundMoney(subAlloc + subAmt);
              distributeEqualAmongRoles(subAmt, sub.roles || [], roleAmounts);
              pushUniqueRoles(sub.roles || []);
            });
          }
        }
        if (!usedSubs) {
          distributeEqualAmongRoles(rowAmt, rec.roles || [], roleAmounts);
          pushUniqueRoles(rec.roles || []);
        }
      });
      return { residualRoles: summary };
    }

    var fallback = legacyRoles && legacyRoles.length ? legacyRoles.slice() : ['Server'];
    distributeEqualAmongRoles(remaining, fallback, roleAmounts);
    return { residualRoles: fallback };
  }

  /**
   * legacy_pool 扣除流水：接入 personalSalesPct（A1）。
   * tipIncome 并存时：先按个人销售额实扣，再对剩余小费按 tipIncomeRate（默认 tipRate）抽成。
   *
   * @param {object} rule
   * @param {Array<{ id?: string, name?: string, role?: string, salesAmount: number, tipBefore: number, tipRate?: number }>} employees
   * @param {{ tipIncomeRate?: number }} [opts] tipIncomeRate 未传则用各员工 tipRate
   */
  function runDeductPipeline(rule, employees, opts) {
    opts = opts || {};
    var list = employees || [];
    var personalApi =
      typeof global.TipOutPersonalSalesDeduct !== 'undefined'
        ? global.TipOutPersonalSalesDeduct
        : null;
    var personal =
      personalApi && personalApi.applyPersonalSalesDeductFromRule
        ? personalApi.applyPersonalSalesDeductFromRule(rule, list)
        : { active: false, rows: [], totalDue: 0, totalActual: 0, totalShortfall: 0, poolContribution: 0 };

    var tipIncomeEntries = [];
    if (rule && rule.deductConfig && rule.deductConfig.tipIncome) {
      var rawTip = rule.deductConfig.tipIncome;
      tipIncomeEntries = Array.isArray(rawTip) ? rawTip.filter(Boolean) : [rawTip];
    }
    tipIncomeEntries = tipIncomeEntries.filter(function (entry) {
      return personalApi && personalApi.entryHasScope
        ? personalApi.entryHasScope(entry)
        : !!(entry && entry.scopeType);
    });
    var tipIncomeActive = tipIncomeEntries.length > 0;

    var byKey = {};
    var employeeResults = [];
    var tipIncomeTotalActual = 0;

    list.forEach(function (emp, idx) {
      emp = emp || {};
      var key = emp.id != null && emp.id !== '' ? String(emp.id) : String(emp.name || idx);
      var tipBefore = roundMoney(Number(emp.tipBefore) || 0);
      var personalRow =
        (personal.rows || []).find(function (r) {
          if (emp.id != null && r.id != null && String(r.id) === String(emp.id)) return true;
          if (emp.name != null && r.name != null && String(r.name) === String(emp.name)) return true;
          return false;
        }) || null;

      var personalActual = personalRow && personalRow.matched ? roundMoney(personalRow.actual) : 0;
      var personalDue = personalRow && personalRow.matched ? roundMoney(personalRow.due) : 0;
      var remainingAfterPersonal = roundMoney(Math.max(0, tipBefore - personalActual));

      var tipIncomeDue = 0;
      var tipIncomeActual = 0;
      if (tipIncomeActive && personalApi) {
        tipIncomeEntries.forEach(function (tipIncomeEntry) {
          if (!personalApi.employeeMatchesScope(emp, tipIncomeEntry)) return;
          var rate =
            opts.tipIncomeRate != null
              ? Number(opts.tipIncomeRate)
              : tipIncomeEntry && tipIncomeEntry.rate != null
                ? Number(tipIncomeEntry.rate)
                : Number(emp.tipRate);
          if (!isFinite(rate) || rate < 0) rate = 0;
          if (rate > 1) rate = rate / 100;
          tipIncomeDue = roundMoney(tipIncomeDue + tipBefore * rate);
        });
        tipIncomeActual = roundMoney(Math.min(tipIncomeDue, remainingAfterPersonal));
        tipIncomeTotalActual = roundMoney(tipIncomeTotalActual + tipIncomeActual);
      }

      var deducted = roundMoney(personalActual + tipIncomeActual);
      var tipAfterDeduct = roundMoney(Math.max(0, tipBefore - deducted));
      var shortfall = roundMoney(
        (personalRow && personalRow.matched ? personalRow.shortfall : 0) +
          Math.max(0, tipIncomeDue - tipIncomeActual)
      );

      var result = {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        tipBefore: tipBefore,
        salesAmount: personalRow ? personalRow.salesAmount : roundMoney(Number(emp.salesAmount) || 0),
        personalDue: personalDue,
        personalActual: personalActual,
        tipIncomeDue: tipIncomeDue,
        tipIncomeActual: tipIncomeActual,
        due: roundMoney(personalDue + tipIncomeDue),
        deducted: deducted,
        shortfall: shortfall,
        tipAfterDeduct: tipAfterDeduct,
        personalMatched: !!(personalRow && personalRow.matched)
      };
      byKey[key] = result;
      employeeResults.push(result);
    });

    var poolContribution = roundMoney(
      (personal.poolContribution || 0) + tipIncomeTotalActual
    );

    return {
      personal: personal,
      tipIncomeActive: tipIncomeActive,
      employeeResults: employeeResults,
      byKey: byKey,
      poolContribution: poolContribution,
      totalDeducted: poolContribution
    };
  }

  /**
   * 将 poolContribution 按 receivers 行占比分给角色，再按模式在角色员工间切开。
   * @param {number} poolAmount
   * @param {object} rule - { receivers: [{roles,pct}], distribution? }
   * @param {Array<{ name?: string, role?: string }>} employees - 接收方候选（通常为当日在岗）
   */
  function distributePoolToReceivers(poolAmount, rule, employees) {
    var amount = roundMoney(Number(poolAmount) || 0);
    var receivedByName = {};
    (employees || []).forEach(function (e) {
      if (e && e.name) receivedByName[e.name] = 0;
    });
    if (amount <= 0) return { receivedByName: receivedByName, roleAmounts: {} };

    var receivers = (rule && rule.receivers) || [];
    var valid = receivers.filter(function (r) {
      return (r.roles || []).length > 0 && Number(r.pct) > 0;
    });
    if (!valid.length) return { receivedByName: receivedByName, roleAmounts: {} };

    var sumPct = 0;
    valid.forEach(function (r) {
      sumPct += Number(r.pct) || 0;
    });
    if (sumPct <= 0) return { receivedByName: receivedByName, roleAmounts: {} };

    var roleAmounts = {};
    var allocated = 0;
    valid.forEach(function (rec, idx) {
      var rowAmt =
        idx === valid.length - 1
          ? roundMoney(amount - allocated)
          : roundMoney((amount * (Number(rec.pct) || 0)) / sumPct);
      allocated = roundMoney(allocated + rowAmt);
      distributeEqualAmongRoles(rowAmt, rec.roles || [], roleAmounts);
    });

    var mode = (rule && rule.distribution) || 'average';
    Object.keys(roleAmounts).forEach(function (role) {
      var roleAmt = roleAmounts[role] || 0;
      var members = (employees || []).filter(function (e) {
        return e && String(e.role || '').trim() === role;
      });
      if (!members.length || roleAmt <= 0) return;
      if (mode === 'hours' || mode === 'orders') {
        // 演示期无工时/订单权重时与 average 相同
      }
      var n = members.length;
      var base = roundMoney(roleAmt / n);
      var used = 0;
      members.forEach(function (m, i) {
        var piece = i === n - 1 ? roundMoney(roleAmt - used) : base;
        used = roundMoney(used + piece);
        if (m.name) receivedByName[m.name] = roundMoney((receivedByName[m.name] || 0) + piece);
      });
    });

    return { receivedByName: receivedByName, roleAmounts: roleAmounts };
  }

  /**
   * 一日完整 legacy 扣除+接收流水（含 personalSalesPct）
   * @param {object} rule
   * @param {Array<{ id?, name, role, salesAmount, tipBefore, tipRate? }>} employees
   * @param {{ tipIncomeRate?: number }} [opts]
   */
  function runLegacyDayPipeline(rule, employees, opts) {
    var deduct = runDeductPipeline(rule, employees, opts);
    var dist = distributePoolToReceivers(deduct.poolContribution, rule, employees);
    var rows = (deduct.employeeResults || []).map(function (r) {
      var received = roundMoney((dist.receivedByName && r.name && dist.receivedByName[r.name]) || 0);
      var tipAfter = roundMoney(r.tipBefore - r.deducted + received);
      return {
        id: r.id,
        name: r.name,
        role: r.role,
        before: r.tipBefore,
        salesAmount: r.salesAmount,
        deducted: r.deducted,
        due: r.due,
        shortfall: r.shortfall,
        received: received,
        after: tipAfter,
        personalMatched: r.personalMatched,
        personalActual: r.personalActual,
        tipIncomeActual: r.tipIncomeActual
      };
    });
    return {
      deduct: deduct,
      distribution: dist,
      rows: rows,
      byName: rows.reduce(function (acc, row) {
        if (row.name) acc[row.name] = row;
        return acc;
      }, {})
    };
  }

  var api = {
    roundMoney: roundMoney,
    lineMatchesFilter: lineMatchesFilter,
    categorySalesFromLines: categorySalesFromLines,
    orderTipWallet: orderTipWallet,
    orderTipPoolFromPoolRules: orderTipPoolFromPoolRules,
    allocateOrderTipResidual: allocateOrderTipResidual,
    runDeductPipeline: runDeductPipeline,
    distributePoolToReceivers: distributePoolToReceivers,
    runLegacyDayPipeline: runLegacyDayPipeline
  };
  global.TipAllocation = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
