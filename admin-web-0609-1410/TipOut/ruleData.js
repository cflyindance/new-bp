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
      ruleName: 'Tip Pool — 多角色分配',
      store: 'Sakura Sushi & Ramen House - Dallas, TX 75247',
      poolRules: [{ type: 'tips', pct: 10 }],
      deductRoles: ['Server', 'Bartender', 'Cashier'],
      receivers: [
        { roles: ['Busser'], pct: 50 },
        { roles: ['Runner'], pct: 30 },
        { roles: ['Host'], pct: 20 }
      ],
      distribution: 'hours',
      clockin: 'clock'
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

  function getRules() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
      }
    } catch (e) {}
    return [];
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

  /** 规则是否配置了小费扣除方（角色或指定员工） */
  function ruleHasDeductors(rule) {
    if (!rule || !ruleHasSalesPool(rule)) return false;
    if ((rule.allocationMode || 'legacy_pool') === 'order_tip_then_residual') return false;
    var cfg = rule.deductConfig;
    if (cfg) {
      if (cfg.salesPct && deductEntryHasScope(cfg.salesPct)) return true;
      if (cfg.tipIncome && deductEntryHasScope(cfg.tipIncome)) return true;
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
        mergeDeductEntryIntoContext(cfg.salesPct, roles, names);
        mergeDeductEntryIntoContext(cfg.tipIncome, roles, names);
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

  function buildRuleDescription(rule) {
    var parts = [];
    if (rule.allocationMode === 'order_tip_then_residual') {
      if (rule.poolRules && rule.poolRules.length > 0) {
        var poolStrOt = rule.poolRules.map(function(p) {
          var name = poolTypeNames[p.type] || p.type;
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
      if (rule.distribution) parts.push(distNames[rule.distribution] || rule.distribution);
      return parts.join('，');
    }
    if (rule.poolRules && rule.poolRules.length > 0) {
      var poolStr = rule.poolRules.map(function(p) {
        var name = poolTypeNames[p.type] || p.type;
        if (p.type === 'custom') return name + ' $' + (p.amount != null ? p.amount : 0) + ' × ' + (p.pct != null ? p.pct : 100) + '%';
        return p.pct != null ? name + ' × ' + p.pct + '%' : name;
      }).join(' + ');
      parts.push('Tip Pool = ' + poolStr);
    }
    var cfg = rule.deductConfig;
    if (cfg && (cfg.salesPct || cfg.tipIncome)) {
      if (cfg.salesPct && deductEntryHasScope(cfg.salesPct)) {
        if (cfg.salesPct.scopeType === 'role') parts.push('扣除方(销售额) ' + (cfg.salesPct.roles || []).join('/'));
        else parts.push('扣除方(销售额) 指定员工');
      }
      if (cfg.tipIncome && deductEntryHasScope(cfg.tipIncome)) {
        var ttList = (cfg.tipIncome.tipTypes || []).filter(function(t) { return t && t !== '全部'; });
        var tt = ttList.length ? ttList.join('/') : '未指定';
        parts.push('扣除方(小费收入 ' + tt + ')');
      }
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
      parts.push(distNames[rule.distribution] || rule.distribution);
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
    poolTypeNames: poolTypeNames,
    distNames: distNames
  };
})();
