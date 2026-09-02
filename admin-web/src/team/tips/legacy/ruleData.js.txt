/**
 * ruleData.js - 小费分配规则数据存储
 */
(function() {
  var STORAGE_KEY = 'tipout_rules';

  var defaultRules = [
    {
      id: 1,
      ruleName: 'Tip Pool — Server & Bartender to Busser',
      store: 'Golden Dragon Chinese Kitchen - Dallas, TX 75231',
      poolRules: [
        { type: 'sales', pct: 4.5 },
        { type: 'tips', pct: 5.5 },
        { type: 'manual', pct: 6.5 }
      ],
      deductRoles: ['Server', 'Bartender', 'Cashier'],
      receivers: [
        { roles: ['Server'], pct: 30 },
        { roles: ['Busser', 'Runner'], pct: 70 }
      ],
      distribution: 'average',
      clockin: 'clock'
    },
    {
      id: 2,
      ruleName: 'Tip Pool — 多角色分配（不打卡按工时）',
      store: 'Sakura Sushi & Ramen House - Dallas, TX 75247',
      poolRules: [{ type: 'tips', pct: 10 }],
      deductRoles: ['Server', 'Bartender', 'Cashier'],
      receivers: [
        { roles: ['Busser'], pct: 50 },
        { roles: ['Runner'], pct: 30 },
        { roles: ['Host'], pct: 20 }
      ],
      distribution: 'hours',
      clockin: 'noclock'
    },
    {
      id: 3,
      ruleName: 'Tip Pool — Server to Busser/Runner',
      store: 'El Fuego Tex-Mex Grill - Plano, TX 75074',
      poolRules: [
        { type: 'sales', pct: 3 },
        { type: 'manual', pct: 8 }
      ],
      deductRoles: ['Server'],
      receivers: [
        { roles: ['Busser'], pct: 60 },
        { roles: ['Runner'], pct: 40 }
      ],
      distribution: 'orders',
      clockin: 'clock'
    },
    {
      id: 4,
      ruleName: 'Bar Tip Pool',
      store: 'Golden Dragon Chinese Kitchen - Dallas, TX 75231',
      poolRules: [{ type: 'tips', pct: 8 }],
      deductRoles: ['Bartender'],
      receivers: [{ roles: ['Busser'], pct: 100 }],
      distribution: 'average',
      clockin: 'clock'
    }
  ];

  var poolTypeNames = {
    sales: '销售额',
    personal_sales: '按个人销售额',
    tips: '小费',
    surcharge: '加收服务费',
    manual: '手动上报小费',
    custom: '自定义小费'
  };

  var distNames = {
    average: '按员工数量平均分配',
    hours: '按工作时长占比分配',
    orders: '按订单占比分配'
  };

  function normalizeWorkHoursConfig(config) {
    var mode = config && config.mode === 'capped' ? 'capped' : 'actual';
    var max = config && config.maxHoursPerDay != null ? Number(config.maxHoursPerDay) : null;
    if (!isFinite(max) || max < 0.1 || max > 24 || Math.round(max * 10) !== max * 10) max = null;
    if (mode === 'capped' && max == null) mode = 'actual';
    return { mode: mode, maxHoursPerDay: mode === 'capped' ? max : null };
  }

  function formatDistributionName(rule) {
    rule = rule || {};
    var distribution = rule.distribution || 'average';
    var base = distNames[distribution] || distribution;
    if (distribution !== 'hours') return base;
    var config = normalizeWorkHoursConfig(rule.workHoursConfig);
    if (config.mode === 'capped') {
      return base + '（每日最多 ' + config.maxHoursPerDay + ' 小时）';
    }
    return base + (rule.clockin === 'noclock' ? '（按照实际录入工时）' : '（按照实际打卡工时）');
  }

  function getRules() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      }
      var seeded = JSON.parse(JSON.stringify(defaultRules));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultRules));
  }

  function saveRules(rules) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }

  function getRuleById(id) {
    var rules = getRules();
    var numId = parseInt(id, 10);
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].id === numId) return rules[i];
    }
    return null;
  }

  function getNextRuleId() {
    var rules = getRules();
    var max = 0;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].id > max) max = rules[i].id;
    }
    return max + 1;
  }

  function deleteRuleById(id) {
    var rules = getRules();
    var numId = parseInt(id, 10);
    var filtered = rules.filter(function(r) { return r.id !== numId; });
    saveRules(filtered);
  }

  function getRulesForStore(storeVal) {
    if (!storeVal) return [];
    var rules = getRules();
    var sv = (storeVal || '').trim();
    if (!sv) return [];
    return rules.filter(function(r) {
      var rs = (r.store || '').trim();
      if (!rs) return false;
      if (sv.indexOf(rs) >= 0 || rs.indexOf(sv) >= 0) return true;
      var parts = rs.split('-');
      var namePart = (parts[0] || '').trim();
      var locPart = (parts.slice(1).join('-') || '').trim();
      return namePart && sv.indexOf(namePart) === 0 && (!locPart || sv.indexOf(locPart) >= 0);
    });
  }

  /** 小费池含「销售额」项时方可配置小费扣除方（与 rule-add 展示逻辑一致） */
  function ruleHasSalesPool(rule) {
    return !!(rule && rule.poolRules && rule.poolRules.some(function(pr) { return pr.type === 'sales'; }));
  }

  function deductEntryHasScope(entry) {
    if (!entry || !entry.scopeType) return false;
    if (entry.scopeType === 'role' && entry.roles && entry.roles.length > 0) return true;
    if (entry.scopeType === 'employee') {
      var emps = Array.isArray(entry.employee) ? entry.employee : [];
      if (emps.length > 0) return true;
      if (Array.isArray(entry.employeeRoles) && entry.employeeRoles.length > 0) return true;
    }
    return false;
  }

  function asDeductEntryList(val) {
    if (!val) return [];
    return Array.isArray(val) ? val.filter(Boolean) : [val];
  }

  function anyDeductEntryHasScope(val) {
    return asDeductEntryList(val).some(deductEntryHasScope);
  }

  function mergeDeductEntryIntoContext(entry, roles, names) {
    if (!entry || !deductEntryHasScope(entry)) return;
    if (entry.scopeType === 'role') {
      (entry.roles || []).forEach(function(r) {
        if (r) roles[String(r).trim()] = true;
      });
      return;
    }
    var empList = Array.isArray(entry.employee) ? entry.employee : [];
    empList.forEach(function(n) {
      if (n) names[String(n).trim()] = true;
    });
    if (!empList.length && Array.isArray(entry.employeeRoles)) {
      entry.employeeRoles.forEach(function(r) {
        if (r) roles[String(r).trim()] = true;
      });
    }
  }

  function mergeDeductConfigField(val, roles, names) {
    asDeductEntryList(val).forEach(function(entry) {
      mergeDeductEntryIntoContext(entry, roles, names);
    });
  }

  /** 规则是否配置了小费扣除方（角色或指定员工） */
  function ruleHasDeductors(rule) {
    if (!rule) return false;
    if ((rule.allocationMode || 'legacy_pool') === 'order_tip_then_residual') return false;
    var cfg = rule.deductConfig;
    // A1 个人销售额扣除：不依赖销售额池
    if (cfg && anyDeductEntryHasScope(cfg.personalSalesPct)) return true;
    if (!ruleHasSalesPool(rule)) return false;
    if (cfg) {
      if (anyDeductEntryHasScope(cfg.salesPct)) return true;
      if (anyDeductEntryHasScope(cfg.tipIncome)) return true;
      return false;
    }
    if (rule.deductRoles && rule.deductRoles.length > 0) return true;
    var de = rule.deductEmployees;
    if (!de) return false;
    var emps = Array.isArray(de.employee) ? de.employee : (Array.isArray(de.employees) ? de.employees : []);
    if (emps.length > 0) return true;
    if (Array.isArray(de.employeeRoles) && de.employeeRoles.length > 0) return true;
    return false;
  }

  function buildDeductorContextForRules(rules) {
    var roles = {};
    var names = {};
    var hasDeductors = false;
    (rules || []).forEach(function(rule) {
      if (!ruleHasDeductors(rule)) return;
      hasDeductors = true;
      var cfg = rule.deductConfig;
      if (cfg) {
        mergeDeductConfigField(cfg.personalSalesPct, roles, names);
        mergeDeductConfigField(cfg.salesPct, roles, names);
        mergeDeductConfigField(cfg.tipIncome, roles, names);
        return;
      }
      (rule.deductRoles || []).forEach(function(r) {
        if (r) roles[String(r).trim()] = true;
      });
      var de = rule.deductEmployees;
      if (!de) return;
      var empList = Array.isArray(de.employee) ? de.employee : (Array.isArray(de.employees) ? de.employees : []);
      empList.forEach(function(n) {
        if (n) names[String(n).trim()] = true;
      });
      if (!empList.length && Array.isArray(de.employeeRoles)) {
        de.employeeRoles.forEach(function(r) {
          if (r) roles[String(r).trim()] = true;
        });
      }
    });
    return { hasDeductors: hasDeductors, roles: roles, names: names };
  }

  function buildDeductorContextForStore(storeVal) {
    var legacy = getRulesForStore(storeVal).filter(function(r) {
      return (r.allocationMode || 'legacy_pool') === 'legacy_pool';
    });
    return buildDeductorContextForRules(legacy);
  }

  function isEmployeeInDeductorContext(emp, ctx) {
    if (!ctx || !ctx.hasDeductors || !emp) return false;
    var name = String(emp.name || '').trim();
    if (name && ctx.names[name]) return true;
    var role = String(emp.role || '').trim();
    if (role && ctx.roles[role]) return true;
    return false;
  }

  function getRulePoolKindLabel(rule) {
    return rule && rule.poolKind === 'surcharge' ? '加收服务费池' : '小费池';
  }

  function getRulePoolKindTagClass(rule) {
    return rule && rule.poolKind === 'surcharge' ? 'tag-orange' : 'tag-blue';
  }

  function buildRuleDescription(rule) {
    var parts = [];
    if (rule.allocationMode === 'order_tip_then_residual') {
      if (rule.poolRules && rule.poolRules.length > 0) {
        var poolStrOt = rule.poolRules.map(function(p) {
          var name = p.name || poolTypeNames[p.type] || p.type;
          if (p.type === 'custom') return name + ' $' + (p.amount != null ? p.amount : 0) + ' × ' + (p.pct != null ? p.pct : 100) + '%';
          return p.pct != null ? name + ' × ' + p.pct + '%' : name;
        }).join(' + ');
        parts.push('池 ' + poolStrOt);
      }
      var n = (rule.tipClaims && rule.tipClaims.length) || 0;
      var res = '—';
      if (rule.residual) {
        if (Array.isArray(rule.residual.receivers) && rule.residual.receivers.length) {
          res = rule.residual.receivers.map(function(r) {
            var rs = (r.roles && r.roles.length) ? r.roles.join('/') : '';
            return rs + (r.pct != null ? r.pct + '%' : '');
          }).join('+');
        } else if (rule.residual.receiverRoles && rule.residual.receiverRoles.length) {
          res = rule.residual.receiverRoles.join('/');
        }
      }
      parts.push('计提小费接受方×' + n + '；剩余接收方→' + res);
      if (rule.distribution) parts.push(formatDistributionName(rule));
      return parts.join('，');
    }
    if (rule.poolRules && rule.poolRules.length > 0) {
      var poolStr = rule.poolRules.map(function(p) {
        var name = p.name || poolTypeNames[p.type] || p.type;
        if (p.type === 'custom') return name + ' $' + (p.amount != null ? p.amount : 0) + ' × ' + (p.pct != null ? p.pct : 100) + '%';
        return p.pct != null ? name + ' × ' + p.pct + '%' : name;
      }).join(' + ');
      parts.push('Tip Pool = ' + poolStr);
    }
    var cfg = rule.deductConfig;
    if (cfg && (cfg.personalSalesPct || cfg.salesPct || cfg.tipIncome)) {
      asDeductEntryList(cfg.personalSalesPct).forEach(function(psp) {
        if (!deductEntryHasScope(psp)) return;
        var pspRate = psp.rate != null ? (Math.round(Number(psp.rate) * 10000) / 100) + '%' : '';
        if (psp.scopeType === 'role') {
          parts.push('扣除方(个人销售额' + (pspRate ? ' ' + pspRate : '') + ') ' + (psp.roles || []).join('/'));
        } else {
          parts.push('扣除方(个人销售额' + (pspRate ? ' ' + pspRate : '') + ') 指定员工');
        }
      });
      asDeductEntryList(cfg.salesPct).forEach(function(sp) {
        if (!deductEntryHasScope(sp)) return;
        var salesRate = sp.rate != null ? (Math.round(Number(sp.rate) * 10000) / 100) + '%' : '';
        if (sp.scopeType === 'role') parts.push('扣除方(销售额' + (salesRate ? ' ' + salesRate : '') + ') ' + (sp.roles || []).join('/'));
        else parts.push('扣除方(销售额' + (salesRate ? ' ' + salesRate : '') + ') 指定员工');
      });
      asDeductEntryList(cfg.tipIncome).forEach(function(ti) {
        if (!deductEntryHasScope(ti)) return;
        var tipRateStr = ti.rate != null ? (Math.round(Number(ti.rate) * 10000) / 100) + '%' : '';
        var ttList = (ti.tipTypes || []).filter(function(t) { return t && t !== '全部'; });
        var tt = ttList.length ? ttList.join('/') : '未指定';
        parts.push('扣除方(小费收入' + (tipRateStr ? ' ' + tipRateStr : '') + ' ' + tt + ')');
      });
    } else if (rule.deductRoles && rule.deductRoles.length > 0) {
      parts.push('扣除方 ' + rule.deductRoles.join('/'));
    } else if (rule.deductEmployees) {
      var de = rule.deductEmployees;
      var emps = Array.isArray(de.employee) ? de.employee : (Array.isArray(de.employees) ? de.employees : []);
      if (emps.length) {
        var deParts = ['扣除方员工 ' + emps.join('/')];
        if (de.employeeRoles && de.employeeRoles.length) deParts.unshift('筛选角色 ' + de.employeeRoles.join('/'));
        parts.push(deParts.join(' '));
      }
    }
    if (rule.receivers && rule.receivers.length > 0) {
      var recStr = rule.receivers.map(function(r) {
        return (r.roles && r.roles.length ? r.roles.join('/') : '') + ' ' + (r.pct || 0) + '%';
      }).join(' / ');
      parts.push('接收方 ' + recStr);
    }
    if (rule.distribution) {
      parts.push(formatDistributionName(rule));
    }
    return parts.join('，');
  }

  // Expose globally
  window.ruleData = {
    getRules: getRules,
    saveRules: saveRules,
    getRuleById: getRuleById,
    getNextRuleId: getNextRuleId,
    getRulesForStore: getRulesForStore,
    deleteRuleById: deleteRuleById,
    ruleHasSalesPool: ruleHasSalesPool,
    ruleHasDeductors: ruleHasDeductors,
    buildDeductorContextForRules: buildDeductorContextForRules,
    buildDeductorContextForStore: buildDeductorContextForStore,
    isEmployeeInDeductorContext: isEmployeeInDeductorContext,
    buildRuleDescription: buildRuleDescription,
    getRulePoolKindLabel: getRulePoolKindLabel,
    getRulePoolKindTagClass: getRulePoolKindTagClass,
    normalizeWorkHoursConfig: normalizeWorkHoursConfig,
    formatDistributionName: formatDistributionName,
    poolTypeNames: poolTypeNames,
    distNames: distNames
  };
})();
