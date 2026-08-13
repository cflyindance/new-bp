(function () {
  "use strict";

  var RULES_KEY = "restaurantRules";
  var RECOVERY_PREFIX = "restaurantRuleRecovery:";
  var AUTOSAVE_DELAY = 900;
  var root = document.getElementById("orderLimitFlowRoot");
  var page = document.body.getAttribute("data-order-limit-page");
  if (!root || !page) return;
  var MenuPicker = window.BrandMenuStructurePicker;

  var steps = [
    { title: "规则类型", note: "确定计算口径" },
    { title: "商品配置", note: "基础信息与商品选择" },
    { title: "场景配置", note: "人数与轮次区间" },
    { title: "限购数量", note: "按场景和产线配置" },
    { title: "生效范围", note: "时间、会员与人数" },
    { title: "超限授权", note: "授权范围与权限" },
    { title: "确认发布", note: "复核并下发" }
  ];
  var lines = [
    { id: "kiosk", name: "Kiosk" },
    { id: "emenu", name: "eMenu" },
    { id: "sdi", name: "SDI" }
  ];
  var stores = [
    { id: "ny-midtown", name: "纽约中城店", mid: "100001", zone: "America/New_York" },
    { id: "flushing", name: "法拉盛店", mid: "100002", zone: "America/New_York" },
    { id: "brooklyn", name: "布鲁克林店", mid: "100003", zone: "America/New_York" },
    { id: "boston", name: "波士顿店", mid: "100004", zone: "America/New_York" }
  ];
  var categories = [
    { id: "category:1", name: "海鲜类", count: 12 },
    { id: "category:2", name: "肉类", count: 15 },
    { id: "category:3", name: "蔬菜类", count: 20 },
    { id: "category:4", name: "主食类", count: 10 },
    { id: "category:5", name: "汤品类", count: 8 },
    { id: "category:6", name: "甜品类", count: 8 },
    { id: "category:7", name: "饮料类", count: 12 },
    { id: "category:8", name: "水果类", count: 10 }
  ];
  var dishes = [
    { id: "dish:1", name: "清蒸大闸蟹", category: "海鲜类" },
    { id: "dish:2", name: "蒜蓉粉丝扇贝", category: "海鲜类" },
    { id: "dish:3", name: "白灼基围虾", category: "海鲜类" },
    { id: "dish:13", name: "红烧肉", category: "肉类" },
    { id: "dish:14", name: "黑椒牛排", category: "肉类" },
    { id: "dish:16", name: "宫保鸡丁", category: "肉类" },
    { id: "dish:28", name: "清炒时蔬", category: "蔬菜类" },
    { id: "dish:30", name: "麻婆豆腐", category: "蔬菜类" },
    { id: "dish:48", name: "扬州炒饭", category: "主食类" },
    { id: "dish:58", name: "南瓜汤", category: "汤品类" },
    { id: "dish:66", name: "提拉米苏", category: "甜品类" },
    { id: "dish:74", name: "鲜榨橙汁", category: "饮料类" }
  ];
  var weekdays = [
    { id: "mon", name: "周一" }, { id: "tue", name: "周二" },
    { id: "wed", name: "周三" }, { id: "thu", name: "周四" },
    { id: "fri", name: "周五" }, { id: "sat", name: "周六" },
    { id: "sun", name: "周日" }
  ];
  var memberLevels = [
    { id: "platinum", name: "白金会员" }, { id: "gold", name: "黄金会员" },
    { id: "silver", name: "白银会员" }, { id: "normal", name: "普通会员" }
  ];
  var roles = ["值班经理", "主管", "店长", "区域经理"];

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function icon(name, size) {
    var paths = {
      back: '<path d="M19 12H5m7-7-7 7 7 7"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      trash: '<path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>'
    };
    return '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || "") + '</svg>';
  }

  function appendEmbedded(url) {
    return window.appendMenusifuEmbeddedParam ? window.appendMenusifuEmbeddedParam(url) : url;
  }

  function go(url) {
    window.location.href = appendEmbedded(url);
  }

  function loadRules() {
    try {
      var parsed = JSON.parse(localStorage.getItem(RULES_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveRules(rules) {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  }

  function nextRuleId(rules) {
    return rules.reduce(function (max, rule) {
      var value = Number(rule && rule.id);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0) + 1;
  }

  function findRule(id) {
    return loadRules().find(function (rule) { return String(rule.id) === String(id); }) || null;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function defaultDraft() {
    return {
      currentStep: 1,
      highestStep: 1,
      subject: null,
      period: null,
      targetType: null,
      name: "",
      description: "",
      structureByLine: MenuPicker ? MenuPicker.emptyByLine() : { kiosk: [], emenu: [], sdi: [] },
      productLines: [],
      targetIds: [],
      partyRanges: [{ min: 1, max: null }],
      roundRanges: [{ min: 1, max: null }],
      limits: {},
      activePartyIndex: 0,
      activeRoundIndex: 0,
      activeLineId: "kiosk",
      conditions: {
        effectiveFrom: today(),
        effectiveTo: "",
        daysOfWeek: weekdays.map(function (day) { return day.id; }),
        businessHour: "dinner",
        memberMode: "all",
        memberLevelIds: [],
        childCountPolicy: "inherit"
      },
      authorization: {
        enabled: true,
        allowedScopes: ["operation", "round", "order"],
        defaultScope: "round",
        scopePermissions: {
          operation: "值班经理",
          round: "主管",
          order: "店长"
        },
        reasonRequired: true
      },
      deployStoreIds: []
    };
  }

  function mapLegacyType(value) {
    return String(value || "").indexOf("按人") >= 0 ? "party_size" : "order";
  }

  function mapLegacyPeriod(value) {
    if (String(value || "").indexOf("多轮") >= 0) return "multi_round";
    if (String(value || "").indexOf("无关") >= 0) return "order_lifetime";
    return "per_round";
  }

  function mapLegacyTarget(value) {
    return String(value || "").indexOf("菜品") >= 0 ? "dish" : "category";
  }

  function legacyTargetIds(rule, targetType) {
    if (targetType === "dish") {
      return (rule.selectedDishes || []).map(function (id) { return "dish:" + id; });
    }
    return (rule.selectedCategories || []).map(function (id) { return "category:" + id; });
  }

  function normalizeLoadedEditorDraft(draft) {
    if (!MenuPicker || !draft) return draft;
    if (!draft.structureByLine) {
      draft.structureByLine = MenuPicker.emptyByLine();
      draft.targetIds = [];
      draft.productLines = [];
      draft.activeLineId = "kiosk";
      draft.limits = {};
      return draft;
    }
    syncDraftTargetsFromStructure(draft, true);
    return draft;
  }

  function draftFromRule(rule) {
    if (rule && rule.editorDraft) return normalizeLoadedEditorDraft(JSON.parse(JSON.stringify(rule.editorDraft)));
    var draft = defaultDraft();
    if (!rule) return draft;
    draft.subject = mapLegacyType(rule.type);
    draft.period = mapLegacyPeriod(rule.round);
    draft.targetType = mapLegacyTarget(rule.method);
    draft.name = rule.name || "";
    draft.description = rule.description || "";
    draft.targetIds = legacyTargetIds(rule, draft.targetType);
    if (MenuPicker && rule.structureByLine) {
      draft.structureByLine = MenuPicker.normalizeByLine(rule.structureByLine);
      syncDraftTargetsFromStructure(draft, false);
    } else {
      draft.productLines = Array.isArray(rule.productLines) && rule.productLines.length
        ? rule.productLines.slice()
        : ["kiosk", "emenu", "sdi"];
    }
    draft.conditions.businessHour = rule.enableTimeSettings
      ? ((rule.selectedBusinessHourIds || [])[0] || "all")
      : "all";
    if (Array.isArray(rule.weekdays) && rule.weekdays.length) draft.conditions.daysOfWeek = rule.weekdays.slice();
    if (rule.enableMemberLevels) {
      draft.conditions.memberMode = "specified";
      draft.conditions.memberLevelIds = (rule.memberLevels || []).slice();
    }
    if (Array.isArray(rule.personRanges) && rule.personRanges.length) {
      draft.partyRanges = rule.personRanges.map(function (range) {
        return { min: Number(range.min) || 1, max: Number(range.max) >= 99 ? null : Number(range.max) };
      });
    }
    if (draft.period === "multi_round" && Array.isArray(rule.roundRanges) && rule.roundRanges.length) {
      draft.roundRanges = rule.roundRanges.map(function (range) {
        return { min: Number(range.min) || 1, max: Number(range.max) >= 99 ? null : Number(range.max) };
      });
    }
    var legacySettings = rule.quantitySettings || {};
    draft.productLines.forEach(function (lineId) {
      draft.targetIds.forEach(function (targetId) {
        var legacyKey = targetId.replace(":", "_");
        if (legacySettings[legacyKey] !== undefined) {
          draft.limits[limitKey(0, 0, lineId, targetId)] = { configured: true, value: Number(legacySettings[legacyKey]) };
        }
      });
    });
    draft.currentStep = 1;
    draft.highestStep = 7;
    return draft;
  }

  function subjectLabel(value) { return value === "party_size" ? "按人数限购" : "按桌/订单限购"; }
  function periodLabel(value) {
    if (value === "multi_round") return "多轮";
    if (value === "order_lifetime") return "与轮次无关";
    return "每轮";
  }
  function targetLabel(value) { return value === "dish" ? "按每种菜品限购" : "按每个分类限购"; }
  function targetShortLabel(value) { return value === "dish" ? "按菜品" : "按分类"; }

  function targetSource(draft) { return draft.targetType === "dish" ? dishes : categories; }

  function structureItems(draft) {
    if (!MenuPicker || !draft.structureByLine) return [];
    var byLine = MenuPicker.normalizeByLine(draft.structureByLine);
    return draft.targetType === "dish"
      ? MenuPicker.listSelectedDishes(byLine)
      : MenuPicker.listSelectedCategories(byLine);
  }

  function structureTargetId(draft, item) {
    return draft.targetType + ":" + item.lineId + "|" + item.key;
  }

  function selectedTargets(draft) {
    var structured = structureItems(draft);
    if (structured.length) {
      return structured.map(function (item) {
        var suffix = "（" + item.lineLabel + "）";
        var shortName = item.name.slice(-suffix.length) === suffix
          ? item.name.slice(0, -suffix.length)
          : item.name;
        return {
          id: structureTargetId(draft, item),
          name: item.name,
          shortName: shortName,
          lineId: item.lineId,
          lineLabel: item.lineLabel,
          key: item.key
        };
      });
    }
    var ids = draft.targetIds || [];
    return targetSource(draft).filter(function (item) { return ids.indexOf(item.id) >= 0; });
  }

  function targetsForLine(draft, lineId) {
    return selectedTargets(draft).filter(function (item) {
      return !item.lineId || item.lineId === lineId;
    });
  }

  function syncDraftTargetsFromStructure(draft, pruneLimits) {
    if (!MenuPicker) return;
    draft.structureByLine = MenuPicker.normalizeByLine(draft.structureByLine);
    var items = structureItems(draft);
    draft.targetIds = items.map(function (item) { return structureTargetId(draft, item); });
    draft.productLines = lines.map(function (line) { return line.id; }).filter(function (lineId) {
      return items.some(function (item) { return item.lineId === lineId; });
    });
    if (draft.productLines.indexOf(draft.activeLineId) < 0) {
      draft.activeLineId = draft.productLines[0] || "kiosk";
    }
    if (pruneLimits !== false) {
      var allowedTargets = {};
      draft.targetIds.forEach(function (targetId) { allowedTargets[targetId] = true; });
      var allowedLines = {};
      draft.productLines.forEach(function (lineId) { allowedLines[lineId] = true; });
      Object.keys(draft.limits || {}).forEach(function (key) {
        var parts = key.split("|");
        var lineId = parts[2];
        var targetId = parts.slice(3).join("|");
        if (!allowedLines[lineId] || !allowedTargets[targetId]) delete draft.limits[key];
      });
    }
  }

  function formatRange(range, unit) {
    if (!range) return "未配置";
    if (range.max == null) return range.min + " " + unit + "及以上";
    if (Number(range.min) === Number(range.max)) return range.min + " " + unit;
    return range.min + "–" + range.max + " " + unit;
  }

  function limitKey(partyIndex, roundIndex, lineId, targetId) {
    return [partyIndex, roundIndex, lineId, targetId].join("|");
  }

  function eachLimitCell(draft, callback) {
    var roundCount = draft.period === "multi_round" ? draft.roundRanges.length : 1;
    draft.partyRanges.forEach(function (_, partyIndex) {
      for (var roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
        draft.productLines.forEach(function (lineId) {
          targetsForLine(draft, lineId).forEach(function (target) {
            callback(limitKey(partyIndex, roundIndex, lineId, target.id), partyIndex, roundIndex, lineId, target.id);
          });
        });
      }
    });
  }

  function buildCompatibilityRule(draftRule, status) {
    var draft = draftRule.editorDraft;
    var targets = selectedTargets(draft);
    var firstLine = draft.productLines[0];
    var firstLineTargets = targetsForLine(draft, firstLine);
    var quantitySettings = {};
    firstLineTargets.forEach(function (target) {
      var cell = draft.limits[limitKey(0, 0, firstLine, target.id)];
      if (cell && cell.configured && cell.value != null) quantitySettings[target.id.replace(":", "_")] = cell.value;
    });
    var personRanges = draft.partyRanges.map(function (range, partyIndex) {
      var quantity = {};
      firstLineTargets.forEach(function (target) {
        var cell = draft.limits[limitKey(partyIndex, 0, firstLine, target.id)];
        if (cell && cell.configured && cell.value != null) quantity[target.id.replace(":", "_")] = cell.value;
      });
      return {
        min: range.min,
        max: range.max == null ? 99 : range.max,
        quantitySettings: draft.period === "multi_round" ? undefined : quantity,
        roundQuantities: draft.period === "multi_round" ? draft.roundRanges.map(function (_, roundIndex) {
          var roundQuantity = {};
          firstLineTargets.forEach(function (target) {
            var cell = draft.limits[limitKey(partyIndex, roundIndex, firstLine, target.id)];
            if (cell && cell.configured && cell.value != null) roundQuantity[target.id.replace(":", "_")] = cell.value;
          });
          return { quantitySettings: roundQuantity };
        }) : undefined
      };
    });
    return {
      id: draftRule.id,
      sourceRuleId: draftRule.sourceRuleId,
      name: draft.name.trim() || "未命名规则",
      description: draft.description.trim(),
      type: subjectLabel(draft.subject),
      round: periodLabel(draft.period),
      method: targetLabel(draft.targetType),
      persons: draft.partyRanges.map(function (range) { return formatRange(range, "人"); }).join("、"),
      dishes: targets.length ? targets.map(function (item) { return item.name; }).join("、") : "未选择商品",
      status: status || "draft",
      created: draftRule.created || today(),
      selectedCategories: draft.targetType === "category" ? targets.map(function (item) { return item.lineId ? item.lineId + "|" + item.key : Number(item.id.split(":")[1]); }) : [],
      selectedDishes: draft.targetType === "dish" ? targets.map(function (item) { return item.lineId ? item.lineId + "|" + item.key : Number(item.id.split(":")[1]); }) : [],
      structureByLine: MenuPicker ? MenuPicker.normalizeByLine(draft.structureByLine) : draft.structureByLine,
      quantitySettings: quantitySettings,
      personRanges: personRanges,
      roundRanges: draft.period === "multi_round" ? draft.roundRanges.map(function (range) { return { min: range.min, max: range.max == null ? 99 : range.max }; }) : undefined,
      rounds: draft.period === "multi_round" ? draft.roundRanges.map(function (range) { return { min: range.min, max: range.max == null ? 99 : range.max }; }) : undefined,
      enableTimeSettings: draft.conditions.businessHour !== "all",
      selectedBusinessHourIds: draft.conditions.businessHour === "all" ? [] : [draft.conditions.businessHour],
      timeLabel: draft.conditions.businessHour === "all"
        ? "全天生效"
        : draft.conditions.businessHour === "lunch"
          ? "午市 11:00–16:59"
          : "晚市 17:00–23:00",
      weekdays: draft.conditions.daysOfWeek,
      enableMemberLevels: draft.conditions.memberMode === "specified",
      memberLevels: draft.conditions.memberLevelIds,
      productLines: draft.productLines,
      limits: Object.keys(draft.limits).map(function (key) {
        var parts = key.split("|");
        var cell = draft.limits[key];
        return {
          partyIndex: Number(parts[0]), roundIndex: Number(parts[1]),
          productLineId: parts[2], targetId: parts.slice(3).join("|"),
          value: cell.value, configured: !!cell.configured
        };
      }),
      conditions: draft.conditions,
      authorization: draft.authorization,
      deployStoreIds: draft.deployStoreIds,
      editorDraft: draft
    };
  }

  function toast(message, isError) {
    var host = document.querySelector(".olf-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "olf-toast-host";
      document.body.appendChild(host);
    }
    var item = document.createElement("div");
    item.className = "olf-toast" + (isError ? " is-error" : "");
    item.textContent = message;
    host.appendChild(item);
    window.setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 2600);
  }

  function renderErrorState(title, copy, actionLabel, action) {
    root.innerHTML = '<main class="olf-flow-main"><section class="olf-flow-card"><div class="olf-empty"><strong>' + esc(title) + '</strong><span>' + esc(copy) + '</span><div style="margin-top:18px"><button type="button" class="olf-button olf-button--primary" id="errorAction">' + esc(actionLabel) + '</button></div></div></section></main>';
    document.getElementById("errorAction").addEventListener("click", action);
  }

  function getParams() { return new URLSearchParams(window.location.search); }

  function initializeDraftRule() {
    var params = getParams();
    var draftId = params.get("draftId");
    var sourceRuleId = params.get("ruleId");
    var isCopy = params.get("copy") === "1";
    var rules = loadRules();
    if (draftId) {
      var existingDraft = rules.find(function (rule) { return String(rule.id) === String(draftId) && rule.status === "draft"; });
      if (existingDraft) {
        existingDraft.editorDraft = normalizeLoadedEditorDraft(existingDraft.editorDraft);
        return existingDraft;
      }
    }

    var sourceRule = sourceRuleId ? rules.find(function (rule) { return String(rule.id) === String(sourceRuleId); }) : null;
    if (sourceRuleId && !sourceRule) return null;
    var id = nextRuleId(rules);
    var editorDraft = draftFromRule(sourceRule);
    if (isCopy && editorDraft.name) editorDraft.name += " (副本)";
    var draftRule = {
      id: id,
      sourceRuleId: sourceRule && !isCopy ? sourceRule.id : null,
      status: "draft",
      created: today(),
      editorDraft: editorDraft
    };
    draftRule = buildCompatibilityRule(draftRule, "draft");
    rules.push(draftRule);
    saveRules(rules);
    params.delete("ruleId");
    params.delete("copy");
    params.set("draftId", String(id));
    if (window.MENUSIFU_EMBEDDED) params.set("embedded", "1");
    history.replaceState(null, "", "order-limit-rule-editor.html?" + params.toString());
    return draftRule;
  }

  var editorState = null;

  function setSaveState(text, kind) {
    var element = document.getElementById("saveState");
    if (!element) return;
    element.textContent = text;
    element.className = "olf-save-state" + (kind ? " is-" + kind : "");
  }

  function saveEditorDraft(immediate) {
    if (!editorState || !editorState.rule) return false;
    window.clearTimeout(editorState.saveTimer);
    try {
      setSaveState("正在保存…", "saving");
      var rules = loadRules();
      var index = rules.findIndex(function (rule) { return String(rule.id) === String(editorState.rule.id); });
      var built = buildCompatibilityRule(editorState.rule, "draft");
      built.editorDraft.currentStep = editorState.currentStep;
      built.editorDraft.highestStep = editorState.highestStep;
      if (index >= 0) rules[index] = built; else rules.push(built);
      saveRules(rules);
      editorState.rule = built;
      editorState.dirty = false;
      sessionStorage.removeItem(RECOVERY_PREFIX + built.id);
      setSaveState("草稿已保存 · 刚刚", "");
      return true;
    } catch (error) {
      setSaveState("保存失败，请重试", "error");
      if (immediate) toast("草稿保存失败，当前不能离开页面", true);
      return false;
    }
  }

  function markEditorDirty() {
    if (!editorState) return;
    editorState.dirty = true;
    setSaveState("有未保存的更改", "saving");
    try { sessionStorage.setItem(RECOVERY_PREFIX + editorState.rule.id, JSON.stringify(editorState.rule.editorDraft)); } catch (error) {}
    window.clearTimeout(editorState.saveTimer);
    editorState.saveTimer = window.setTimeout(function () { saveEditorDraft(false); }, AUTOSAVE_DELAY);
  }

  function validateContinuousRanges(ranges, label) {
    if (!Array.isArray(ranges) || !ranges.length) return label + "至少保留一个区间";
    for (var index = 0; index < ranges.length; index += 1) {
      var range = ranges[index];
      var min = Number(range.min);
      var max = range.max == null || range.max === "" ? null : Number(range.max);
      if (!Number.isInteger(min) || min < 1) return label + "起始值必须是大于 0 的整数";
      if (max != null && (!Number.isInteger(max) || max < min)) return label + "结束值不能小于起始值";
      if (index === 0 && min !== 1) return label + "必须从 1 开始连续覆盖";
      if (index > 0) {
        var previous = ranges[index - 1];
        if (previous.max == null || Number(previous.max) + 1 !== min) return label + "不能重叠或断档";
      }
      if (index < ranges.length - 1 && max == null) return label + "只有最后一个区间可以使用“及以上”";
      if (index === ranges.length - 1 && max != null) return label + "最后一个区间必须覆盖“及以上”";
    }
    return null;
  }

  function validateStep(stepNumber, draft) {
    if (stepNumber === 1) {
      if (!draft.subject || !draft.period || !draft.targetType) return "请选择限购主体、统计周期和限购对象";
    }
    if (stepNumber === 2) {
      if (!draft.name.trim()) return "请输入规则名称";
      if (!draft.targetIds.length) return "请至少选择一个分类或菜品";
    }
    if (stepNumber === 3) {
      var partyError = validateContinuousRanges(draft.partyRanges, "人数区间");
      if (partyError) return partyError;
      if (draft.period === "multi_round") {
        var roundError = validateContinuousRanges(draft.roundRanges, "轮次区间");
        if (roundError) return roundError;
      }
    }
    if (stepNumber === 4) {
      var missing = 0;
      eachLimitCell(draft, function (key) {
        var cell = draft.limits[key];
        if (!cell || !cell.configured) missing += 1;
      });
      if (missing) return "还有 " + missing + " 个数量单元格未配置；请输入数量、0，或显式设为不限制";
    }
    if (stepNumber === 5) {
      if (!draft.conditions.daysOfWeek.length) return "请至少选择一个生效星期";
      if (draft.conditions.memberMode === "specified" && !draft.conditions.memberLevelIds.length) return "请至少选择一个会员等级";
      if (draft.conditions.effectiveTo && draft.conditions.effectiveFrom > draft.conditions.effectiveTo) return "结束日期不能早于开始日期";
    }
    if (stepNumber === 6 && draft.authorization.enabled) {
      if (!draft.authorization.allowedScopes.length) return "请至少启用一种授权范围";
      if (draft.authorization.allowedScopes.indexOf(draft.authorization.defaultScope) < 0) return "默认授权范围必须属于已启用范围";
      for (var i = 0; i < draft.authorization.allowedScopes.length; i += 1) {
        if (!draft.authorization.scopePermissions[draft.authorization.allowedScopes[i]]) return "请为每种授权范围选择所需权限";
      }
    }
    return null;
  }

  function validateAll(draft) {
    for (var step = 1; step <= 6; step += 1) {
      var error = validateStep(step, draft);
      if (error) return { step: step, message: error };
    }
    return null;
  }

  function renderChoice(field, value, title, copy, selected) {
    return '<button type="button" class="olf-choice' + (selected ? " is-selected" : "") + '" data-choice-field="' + esc(field) + '" data-choice-value="' + esc(value) + '"><span class="olf-choice-check">' + icon("check", 18) + '</span><strong>' + esc(title) + '</strong><span>' + esc(copy) + '</span></button>';
  }

  function renderStepOne(draft) {
    return '<div class="olf-content-head"><h2 tabindex="-1">选择规则类型</h2><p>三个维度共同决定限额如何计算与累计。</p></div>' +
      '<section class="olf-section"><h3>限购主体</h3><div class="olf-choice-grid olf-choice-grid--two">' +
      renderChoice("subject", "order", "按桌/订单限购", "整桌共享同一个配置上限", draft.subject === "order") +
      renderChoice("subject", "party_size", "按人数限购", "人均上限 × 当前订单有效人数，不区分具体食客", draft.subject === "party_size") + '</div></section>' +
      '<section class="olf-section"><h3>统计周期</h3><div class="olf-choice-grid">' +
      renderChoice("period", "per_round", "每轮", "每轮使用相同上限并重新累计", draft.period === "per_round") +
      renderChoice("period", "multi_round", "多轮", "不同轮次区间可以设置不同上限", draft.period === "multi_round") +
      renderChoice("period", "order_lifetime", "与轮次无关", "订单全部轮次累计", draft.period === "order_lifetime") + '</div></section>' +
      '<section class="olf-section"><h3>限购对象</h3><div class="olf-choice-grid olf-choice-grid--two">' +
      renderChoice("targetType", "category", "按分类限购", "分类内全部菜品共享数量池", draft.targetType === "category") +
      renderChoice("targetType", "dish", "按菜品限购", "每个指定菜品独立累计", draft.targetType === "dish") + '</div></section>' +
      '<div class="olf-summary olf-summary--primary"><strong>规则预览：</strong>' + (draft.subject && draft.period && draft.targetType ? esc(subjectLabel(draft.subject) + " × " + periodLabel(draft.period) + " × " + targetShortLabel(draft.targetType)) : "请完成三个维度的选择") + '</div>';
  }

  function renderChecks(name, items, selected) {
    return items.map(function (item) {
      return '<label class="olf-check"><input type="checkbox" name="' + esc(name) + '" value="' + esc(item.id) + '"' + (selected.indexOf(item.id) >= 0 ? " checked" : "") + ' /><span>' + esc(item.name) + '</span></label>';
    }).join("");
  }

  function renderTargetSummary(draft) {
    var selected = selectedTargets(draft);
    if (!selected.length) return '<div class="olf-empty"><strong>尚未选择' + (draft.targetType === "dish" ? "菜品" : "分类") + '</strong><span>点击下方按钮打开商品结构选择器</span></div>';
    return '<div class="olf-token-list">' + selected.map(function (item) { return '<span class="olf-token">' + esc(item.name) + '</span>'; }).join("") + '</div>';
  }

  function renderStepTwo(draft) {
    var byLine = MenuPicker ? MenuPicker.normalizeByLine(draft.structureByLine) : null;
    var pickerHtml = MenuPicker
      ? MenuPicker.renderHtml(byLine, null, null, null, { leafLevel: draft.targetType === "category" ? "category" : "dish" })
      : '<div class="olf-summary olf-summary--danger">商品结构选择器未加载，请刷新后重试。</div>';
    var summary = MenuPicker ? MenuPicker.formatSummary(byLine) : "未选商品";
    return '<div class="olf-content-head"><h2 tabindex="-1">商品配置</h2><p>填写基础信息，并按原有商品结构选择限购目标。</p></div>' +
      '<section class="olf-section"><h3>基础信息</h3><div class="olf-field-grid"><label class="olf-field olf-field--full"><span class="olf-label olf-required">规则名称</span><input class="olf-input" data-field="name" value="' + esc(draft.name) + '" maxlength="60" /></label><label class="olf-field olf-field--full"><span class="olf-label">规则描述</span><textarea class="olf-textarea" data-field="description" maxlength="200">' + esc(draft.description) + '</textarea></label></div></section>' +
      '<section class="olf-section"><h3>选择商品</h3><p class="olf-structure-summary" id="structureSummary">' + esc(summary) + '</p>' + pickerHtml + '</section>';
  }

  function renderRangeRows(ranges, kind) {
    return ranges.map(function (range, index) {
      var unit = kind === "party" ? "人" : "轮";
      return '<tr><td>区间 ' + (index + 1) + '</td><td><div class="olf-range-inputs"><input class="olf-input" type="number" min="1" value="' + esc(range.min) + '" data-range-kind="' + kind + '" data-range-index="' + index + '" data-range-part="min" /><span>至</span><input class="olf-input" type="number" min="1" value="' + (range.max == null ? "" : esc(range.max)) + '" placeholder="及以上" data-range-kind="' + kind + '" data-range-index="' + index + '" data-range-part="max" /><span>' + unit + '</span></div></td><td>' + esc(formatRange(range, unit)) + '</td><td><button type="button" class="olf-button olf-button--small olf-button--danger" data-delete-range="' + kind + '" data-range-index="' + index + '"' + (ranges.length === 1 ? " disabled" : "") + '>' + icon("trash", 15) + ' 删除</button></td></tr>';
    }).join("");
  }

  function renderStepThree(draft) {
    return '<div class="olf-content-head"><h2 tabindex="-1">配置人数与轮次场景</h2><p>区间必须从 1 连续覆盖到“及以上”；不限制场景仍需保留区间。</p></div>' +
      '<section class="olf-section"><div class="olf-section-head"><h3>人数区间</h3><button type="button" class="olf-button olf-button--small" data-add-range="party">' + icon("plus", 15) + ' 添加区间</button></div><div class="olf-table-wrap"><table class="olf-table"><thead><tr><th>场景</th><th>区间</th><th>页面显示</th><th>操作</th></tr></thead><tbody>' + renderRangeRows(draft.partyRanges, "party") + '</tbody></table></div><div class="olf-help" style="margin-top:10px">' + (draft.subject === "party_size" ? "每个区间配置的是人均上限，实际限额还会乘当前订单有效人数。" : "每个区间配置的是整桌共享的绝对上限。") + '</div></section>' +
      (draft.period === "multi_round" ? '<section class="olf-section"><div class="olf-section-head"><h3>轮次区间</h3><button type="button" class="olf-button olf-button--small" data-add-range="round">' + icon("plus", 15) + ' 添加区间</button></div><div class="olf-table-wrap"><table class="olf-table"><thead><tr><th>场景</th><th>区间</th><th>页面显示</th><th>操作</th></tr></thead><tbody>' + renderRangeRows(draft.roundRanges, "round") + '</tbody></table></div></section>' : '<div class="olf-summary"><strong>当前统计周期：</strong>' + esc(periodLabel(draft.period)) + '，无需另外配置轮次区间。</div>');
  }

  function cellFor(draft, targetId) {
    return draft.limits[limitKey(draft.activePartyIndex, draft.period === "multi_round" ? draft.activeRoundIndex : 0, draft.activeLineId, targetId)] || { configured: false, value: null };
  }

  function completionFor(draft, lineId) {
    var targets = targetsForLine(draft, lineId);
    var total = targets.length;
    var complete = targets.reduce(function (count, target) {
      var cell = draft.limits[limitKey(draft.activePartyIndex, draft.period === "multi_round" ? draft.activeRoundIndex : 0, lineId, target.id)];
      return count + (cell && cell.configured ? 1 : 0);
    }, 0);
    return complete + "/" + total;
  }

  function renderLimitRows(draft) {
    return targetsForLine(draft, draft.activeLineId).map(function (target) {
      var cell = cellFor(draft, target.id);
      var stateClass = !cell.configured ? "" : cell.value === 0 ? " is-blocked" : cell.value == null ? " is-unlimited" : "";
      var stateText = !cell.configured ? "未配置" : cell.value === 0 ? "禁止下单" : cell.value == null ? "不限制" : "已配置";
      var actual = "—";
      if (cell.configured && cell.value != null) {
        actual = draft.subject === "party_size" ? "4 人示例：" + (cell.value * 4) + " 份" : cell.value + " 份";
      }
      return '<tr><td><strong>' + esc(target.shortName || target.name) + '</strong>' + (target.count ? '<div class="olf-hint">包含 ' + target.count + ' 个菜品</div>' : '<div class="olf-hint">' + esc(target.category || "") + '</div>') + '</td><td><input class="olf-input olf-limit-input" type="number" min="0" value="' + (cell.configured && cell.value != null ? esc(cell.value) : "") + '" placeholder="未配置" data-limit-target="' + esc(target.id) + '" /></td><td><span class="olf-limit-state' + stateClass + '">' + stateText + '</span></td><td>' + esc(actual) + '</td><td><button type="button" class="olf-button olf-button--small" data-set-unlimited="' + esc(target.id) + '">设为不限制</button></td></tr>';
    }).join("");
  }

  function renderStepFour(draft) {
    var partyTabs = draft.partyRanges.map(function (range, index) { return '<button type="button" class="olf-tab' + (draft.activePartyIndex === index ? " is-active" : "") + '" data-party-tab="' + index + '">' + esc(formatRange(range, "人")) + '</button>'; }).join("");
    var roundTabs = draft.period === "multi_round" ? draft.roundRanges.map(function (range, index) { return '<button type="button" class="olf-tab' + (draft.activeRoundIndex === index ? " is-active" : "") + '" data-round-tab="' + index + '">' + esc(formatRange(range, "轮")) + '</button>'; }).join("") : "";
    var lineTabs = draft.productLines.map(function (lineId) {
      var line = lines.find(function (item) { return item.id === lineId; });
      return '<button type="button" class="olf-tab' + (draft.activeLineId === lineId ? " is-active" : "") + '" data-line-tab="' + esc(lineId) + '">' + esc(line ? line.name : lineId) + ' · ' + completionFor(draft, lineId) + '</button>';
    }).join("");
    return '<div class="olf-content-head"><h2 tabindex="-1">设置限购数量</h2><p>普通空输入表示未配置；0 表示禁止；也可以显式设为不限制。</p></div>' +
      '<section class="olf-section"><h3>人数场景</h3><div class="olf-tabs">' + partyTabs + '</div>' + (roundTabs ? '<h3 style="margin-top:20px">轮次场景</h3><div class="olf-tabs">' + roundTabs + '</div>' : '') + '</section>' +
      '<section class="olf-section"><div class="olf-section-head"><h3>产线配置</h3><button type="button" class="olf-button olf-button--small" data-toggle-batch>批量设置</button></div><div class="olf-tabs">' + lineTabs + '</div><div id="batchPanel" style="display:none;margin-top:14px" class="olf-summary"><div class="olf-inline" style="flex-wrap:wrap"><input class="olf-input olf-limit-input" type="number" min="0" id="batchLimitValue" placeholder="数量" /><button type="button" class="olf-button olf-button--small" data-apply-batch="value">应用数量</button><button type="button" class="olf-button olf-button--small" data-apply-batch="zero">全部禁止</button><button type="button" class="olf-button olf-button--small" data-apply-batch="unlimited">全部不限制</button></div></div></section>' +
      '<section class="olf-section"><div class="olf-table-wrap"><table class="olf-table"><thead><tr><th>' + (draft.targetType === "dish" ? "菜品" : "分类") + '</th><th>' + (draft.subject === "party_size" ? "人均上限" : "订单上限") + '</th><th>状态</th><th>实际限额</th><th>操作</th></tr></thead><tbody>' + renderLimitRows(draft) + '</tbody></table></div></section>' +
      '<div class="olf-summary olf-summary--primary"><strong>当前示例：</strong>' + (draft.subject === "party_size" ? "按人数规则会将人均上限乘订单有效人数；不会追踪具体食客。" : "同一订单中的目标商品共同占用配置数量池。") + '</div>';
  }

  function renderStepFive(draft) {
    var condition = draft.conditions;
    return '<div class="olf-content-head"><h2 tabindex="-1">设置生效范围</h2><p>商品适用产线由商品结构自动确定；这里配置时间、会员和有效人数口径。</p></div>' +
      '<section class="olf-section"><div class="olf-field-grid"><label class="olf-field"><span class="olf-label olf-required">开始日期</span><input class="olf-input" type="date" data-condition="effectiveFrom" value="' + esc(condition.effectiveFrom) + '" /></label><label class="olf-field"><span class="olf-label">结束日期</span><input class="olf-input" type="date" data-condition="effectiveTo" value="' + esc(condition.effectiveTo) + '" /><span class="olf-hint">留空表示长期生效。</span></label><label class="olf-field"><span class="olf-label olf-required">营业时段</span><select class="olf-select" data-condition="businessHour"><option value="all"' + (condition.businessHour === "all" ? " selected" : "") + '>全天</option><option value="lunch"' + (condition.businessHour === "lunch" ? " selected" : "") + '>午市 11:00–16:59</option><option value="dinner"' + (condition.businessHour === "dinner" ? " selected" : "") + '>晚市 17:00–23:00</option></select></label><label class="olf-field"><span class="olf-label">儿童计入有效人数</span><select class="olf-select" data-condition="childCountPolicy"><option value="inherit"' + (condition.childCountPolicy === "inherit" ? " selected" : "") + '>继承门店全局设置</option><option value="include"' + (condition.childCountPolicy === "include" ? " selected" : "") + '>计入</option><option value="exclude"' + (condition.childCountPolicy === "exclude" ? " selected" : "") + '>不计入</option></select></label></div></section>' +
      '<section class="olf-section"><h3>生效星期</h3><div class="olf-check-grid">' + renderChecks("daysOfWeek", weekdays, condition.daysOfWeek) + '</div></section>' +
      '<section class="olf-section"><h3>会员范围</h3><div class="olf-choice-grid olf-choice-grid--two">' + renderChoice("memberMode", "all", "全部顾客", "会员与非会员均适用", condition.memberMode === "all") + renderChoice("memberMode", "specified", "指定会员等级", "仅选中的会员等级适用", condition.memberMode === "specified") + '</div>' + (condition.memberMode === "specified" ? '<div class="olf-check-grid" style="margin-top:14px">' + renderChecks("memberLevelIds", memberLevels, condition.memberLevelIds) + '</div>' : '') + '</section>';
  }

  function renderScopeRow(draft, scope, title, copy) {
    var enabled = draft.authorization.allowedScopes.indexOf(scope) >= 0;
    return '<div class="olf-review-row"><label class="olf-inline"><input type="checkbox" data-auth-scope="' + scope + '"' + (enabled ? " checked" : "") + ' /><span><strong>' + esc(title) + '</strong><span class="olf-hint" style="display:block">' + esc(copy) + '</span></span></label><select class="olf-select" data-auth-role="' + scope + '"' + (enabled ? "" : " disabled") + '>' + roles.map(function (role) { return '<option value="' + esc(role) + '"' + (draft.authorization.scopePermissions[scope] === role ? " selected" : "") + '>' + esc(role) + '</option>'; }).join("") + '</select><span></span></div>';
  }

  function renderStepSix(draft) {
    var auth = draft.authorization;
    return '<div class="olf-content-head"><h2 tabindex="-1">设置超限授权</h2><p>授权只绕过当前规则的数量限制，不绕过售罄、停售、年龄或支付限制。</p></div>' +
      '<section class="olf-section"><div class="olf-section-head"><div><h3>允许服务员密码授权</h3><div class="olf-help">关闭后，超限将直接拒绝。</div></div><label class="olf-switch"><input type="checkbox" data-auth-enabled' + (auth.enabled ? " checked" : "") + ' /><span class="olf-switch-track"></span><span>' + (auth.enabled ? "已开启" : "已关闭") + '</span></label></div></section>' +
      (auth.enabled ? '<section class="olf-section"><h3>可选授权范围与权限</h3><div class="olf-review">' + renderScopeRow(draft, "operation", "本次操作", "仅放行当前这一次数量变更") + renderScopeRow(draft, "round", "当前轮", "当前轮内相同规则与目标无需重复输密") + renderScopeRow(draft, "order", "当前订单", "关单前相同规则与目标持续放行") + '</div></section><section class="olf-section"><div class="olf-field-grid"><label class="olf-field"><span class="olf-label olf-required">默认授权范围</span><select class="olf-select" data-auth-default>' + [{id:"operation",name:"本次操作"},{id:"round",name:"当前轮"},{id:"order",name:"当前订单"}].filter(function (item) { return auth.allowedScopes.indexOf(item.id) >= 0; }).map(function (item) { return '<option value="' + item.id + '"' + (auth.defaultScope === item.id ? " selected" : "") + '>' + item.name + '</option>'; }).join("") + '</select></label><label class="olf-check"><input type="checkbox" data-auth-reason' + (auth.reasonRequired ? " checked" : "") + ' /><span>授权原因必须填写</span></label></div></section>' : '<div class="olf-summary olf-summary--warning"><strong>硬性拒绝：</strong>规则超限后不会出现服务员密码放行入口。</div>');
  }

  function namesFor(items, ids) {
    return ids.map(function (id) { var item = items.find(function (candidate) { return candidate.id === id; }); return item ? item.name : id; }).join("、");
  }

  function limitCompletion(draft) {
    var total = 0;
    var complete = 0;
    eachLimitCell(draft, function (key) { total += 1; if (draft.limits[key] && draft.limits[key].configured) complete += 1; });
    return { complete: complete, total: total };
  }

  function renderStepSeven(draft) {
    var check = validateAll(draft);
    var completion = limitCompletion(draft);
    var memberText = draft.conditions.memberMode === "all" ? "全部顾客" : namesFor(memberLevels, draft.conditions.memberLevelIds);
    var authText = draft.authorization.enabled ? draft.authorization.allowedScopes.map(function (scope) { return scope === "operation" ? "本次操作" : scope === "round" ? "当前轮" : "当前订单"; }).join(" / ") : "不允许授权";
    return '<div class="olf-content-head"><h2 tabindex="-1">确认规则并发布</h2><p>保存草稿不会影响门店；保存并下发后才生成正式版本。</p></div>' +
      '<div class="olf-summary ' + (check ? "olf-summary--danger" : "olf-summary--success") + '"><strong>' + (check ? "发布前检查未通过：" : "发布前检查通过：") + '</strong>' + esc(check ? check.message : "区间、目标、数量和授权配置完整。") + (check ? ' <button type="button" class="olf-button olf-button--small" data-fix-step="' + check.step + '" style="margin-left:10px">前往修正</button>' : '') + '</div>' +
      '<section class="olf-section"><div class="olf-review">' +
      '<div class="olf-review-row"><span>规则</span><strong>' + esc(draft.name || "未命名规则") + '</strong><button class="olf-button olf-button--small" data-fix-step="2">编辑</button></div>' +
      '<div class="olf-review-row"><span>计算方式</span><strong>' + esc(subjectLabel(draft.subject) + " × " + periodLabel(draft.period) + " × " + targetShortLabel(draft.targetType)) + '</strong><button class="olf-button olf-button--small" data-fix-step="1">编辑</button></div>' +
      '<div class="olf-review-row"><span>商品范围</span><strong>' + esc(selectedTargets(draft).map(function (item) { return item.name; }).join("、") || "未选择") + '</strong><button class="olf-button olf-button--small" data-fix-step="2">编辑</button></div>' +
      '<div class="olf-review-row"><span>适用产线</span><strong>' + esc(namesFor(lines, draft.productLines)) + '</strong><button class="olf-button olf-button--small" data-fix-step="2">编辑</button></div>' +
      '<div class="olf-review-row"><span>人数 / 轮次</span><strong>' + esc(draft.partyRanges.map(function (range) { return formatRange(range, "人"); }).join("、") + (draft.period === "multi_round" ? "；" + draft.roundRanges.map(function (range) { return formatRange(range, "轮"); }).join("、") : "")) + '</strong><button class="olf-button olf-button--small" data-fix-step="3">编辑</button></div>' +
      '<div class="olf-review-row"><span>数量完成度</span><strong>' + completion.complete + "/" + completion.total + ' 个单元格</strong><button class="olf-button olf-button--small" data-fix-step="4">编辑</button></div>' +
      '<div class="olf-review-row"><span>生效条件</span><strong>' + esc((draft.conditions.effectiveTo ? draft.conditions.effectiveFrom + " 至 " + draft.conditions.effectiveTo : draft.conditions.effectiveFrom + " 起长期") + " · " + memberText + " · 儿童人数" + (draft.conditions.childCountPolicy === "inherit" ? "继承门店" : draft.conditions.childCountPolicy === "include" ? "计入" : "不计入")) + '</strong><button class="olf-button olf-button--small" data-fix-step="5">编辑</button></div>' +
      '<div class="olf-review-row"><span>超限授权</span><strong>' + esc(authText + (draft.authorization.enabled ? "，默认" + (draft.authorization.defaultScope === "operation" ? "本次操作" : draft.authorization.defaultScope === "round" ? "当前轮" : "当前订单") : "")) + '</strong><button class="olf-button olf-button--small" data-fix-step="6">编辑</button></div>' +
      '</div></section><div class="olf-summary olf-summary--primary"><strong>下一步：</strong>保存并下发后进入门店选择与发布确认；发布完成前，门店继续使用上一完整版本。</div>';
  }

  function renderEditorContent() {
    var draft = editorState.rule.editorDraft;
    if (editorState.currentStep === 1) return renderStepOne(draft);
    if (editorState.currentStep === 2) return renderStepTwo(draft);
    if (editorState.currentStep === 3) return renderStepThree(draft);
    if (editorState.currentStep === 4) return renderStepFour(draft);
    if (editorState.currentStep === 5) return renderStepFive(draft);
    if (editorState.currentStep === 6) return renderStepSix(draft);
    return renderStepSeven(draft);
  }

  function renderEditorNav() {
    return steps.map(function (step, index) {
      var number = index + 1;
      var current = editorState.currentStep === number;
      var complete = number < editorState.highestStep;
      var clickable = number <= editorState.highestStep;
      return '<button type="button" class="olf-step' + (current ? " is-current" : "") + (complete ? " is-complete" : "") + (clickable ? " is-clickable" : "") + '" data-step="' + number + '"' + (current ? ' aria-current="step"' : "") + (clickable ? "" : " disabled") + '><span class="olf-step-number">' + (complete ? icon("check", 15) : number) + '</span><span class="olf-step-copy"><strong>' + esc(step.title) + '</strong><span>' + esc(step.note) + '</span></span>' + (editorState.stepErrors[number] ? '<span class="olf-step-error">!</span>' : "") + '</button>';
    }).join("");
  }

  function renderEditor() {
    var draft = editorState.rule.editorDraft;
    draft.currentStep = editorState.currentStep;
    draft.highestStep = editorState.highestStep;
    document.getElementById("stepNav").innerHTML = renderEditorNav();
    document.getElementById("editorContent").innerHTML = renderEditorContent();
    if (MenuPicker) {
      var pickerElement = document.querySelector("[data-brand-menu-structure-picker]");
      if (pickerElement) MenuPicker.bind(pickerElement, { leafLevel: draft.targetType === "category" ? "category" : "dish" });
    }
    document.getElementById("progressFill").style.width = ((editorState.currentStep / steps.length) * 100) + "%";
    document.getElementById("footerNote").textContent = "第 " + editorState.currentStep + " 步，共 " + steps.length + " 步";
    var previous = document.getElementById("previousButton");
    previous.style.visibility = editorState.currentStep === 1 ? "hidden" : "visible";
    previous.disabled = editorState.currentStep === 1;
    document.getElementById("headerSaveButton").style.display = editorState.currentStep === 7 ? "none" : "";
    document.getElementById("saveReturnButton").style.display = editorState.currentStep === 7 ? "" : "none";
    document.getElementById("nextButton").textContent = editorState.currentStep === 7 ? "保存并下发" : "下一步";
    var heading = document.querySelector(".olf-content-head h2");
    if (heading) window.setTimeout(function () { heading.focus(); }, 0);
  }

  function openDialog(title, copy, confirmLabel, onConfirm) {
    var overlay = document.getElementById("confirmOverlay");
    document.getElementById("dialogTitle").textContent = title;
    document.getElementById("dialogCopy").textContent = copy;
    document.getElementById("dialogConfirm").textContent = confirmLabel;
    overlay.classList.add("is-open");
    editorState.dialogConfirm = onConfirm;
    document.getElementById("dialogCancel").focus();
  }

  function closeDialog() {
    document.getElementById("confirmOverlay").classList.remove("is-open");
    editorState.dialogConfirm = null;
  }

  function normalizeActiveDimensions(draft) {
    draft.activePartyIndex = Math.min(draft.activePartyIndex || 0, Math.max(0, draft.partyRanges.length - 1));
    draft.activeRoundIndex = Math.min(draft.activeRoundIndex || 0, Math.max(0, draft.roundRanges.length - 1));
    if (draft.productLines.indexOf(draft.activeLineId) < 0) draft.activeLineId = draft.productLines[0] || "kiosk";
  }

  function changeChoice(field, value) {
    var draft = editorState.rule.editorDraft;
    if (field === "memberMode") {
      draft.conditions.memberMode = value;
      if (value === "all") draft.conditions.memberLevelIds = [];
      markEditorDirty(); renderEditor(); return;
    }
    var current = draft[field];
    if (current === value) return;
    var destructive = (field === "targetType" && draft.targetIds.length) || (field === "period" && Object.keys(draft.limits).length);
    var apply = function () {
      draft[field] = value;
      if (field === "targetType") {
        draft.structureByLine = MenuPicker ? MenuPicker.emptyByLine() : { kiosk: [], emenu: [], sdi: [] };
        draft.targetIds = [];
        draft.productLines = [];
        draft.activeLineId = "kiosk";
        draft.limits = {};
      }
      if (field === "period") { draft.limits = {}; draft.activeRoundIndex = 0; if (value !== "multi_round") draft.roundRanges = [{ min: 1, max: null }]; }
      markEditorDirty(); renderEditor();
    };
    if (destructive) openDialog("重置后续配置？", "修改该选项会清空已配置的商品或数量内容。", "确认重置", function () { closeDialog(); apply(); });
    else apply();
  }

  function updateCheckedList(name, value, checked) {
    var draft = editorState.rule.editorDraft;
    var target = name === "daysOfWeek" || name === "memberLevelIds" ? draft.conditions[name] : draft[name];
    var index = target.indexOf(value);
    if (checked && index < 0) target.push(value);
    if (!checked && index >= 0) target.splice(index, 1);
    if (name === "productLines") normalizeActiveDimensions(draft);
    markEditorDirty();
  }

  function recalculateSequentialRanges(ranges) {
    ranges.forEach(function (range, index) {
      if (index === 0) range.min = 1;
      else range.min = Number(ranges[index - 1].max || ranges[index - 1].min) + 1;
      if (index === ranges.length - 1) range.max = null;
    });
  }

  function addRange(kind) {
    var draft = editorState.rule.editorDraft;
    var ranges = kind === "party" ? draft.partyRanges : draft.roundRanges;
    var last = ranges[ranges.length - 1];
    var start = last.max == null ? Number(last.min) + 1 : Number(last.max) + 1;
    if (last.max == null) last.max = Math.max(Number(last.min), start - 1);
    ranges.push({ min: start, max: null });
    draft.limits = {};
    normalizeActiveDimensions(draft);
    markEditorDirty(); renderEditor();
  }

  function deleteRange(kind, index) {
    var draft = editorState.rule.editorDraft;
    var ranges = kind === "party" ? draft.partyRanges : draft.roundRanges;
    if (ranges.length <= 1) return;
    openDialog("删除区间？", "删除区间会重置全部数量配置，之后需要重新确认。", "删除并重置", function () {
      ranges.splice(index, 1);
      recalculateSequentialRanges(ranges);
      draft.limits = {};
      normalizeActiveDimensions(draft);
      closeDialog(); markEditorDirty(); renderEditor();
    });
  }

  function goToEditorStep(step, skipValidation) {
    if (!skipValidation && step > editorState.currentStep) {
      var error = validateStep(editorState.currentStep, editorState.rule.editorDraft);
      if (error) {
        editorState.stepErrors[editorState.currentStep] = error;
        toast(error, true); renderEditor(); return;
      }
      delete editorState.stepErrors[editorState.currentStep];
      editorState.highestStep = Math.max(editorState.highestStep, step);
    }
    editorState.currentStep = step;
    editorState.rule.editorDraft.currentStep = step;
    editorState.rule.editorDraft.highestStep = editorState.highestStep;
    markEditorDirty(); renderEditor();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditorClick(event) {
    var button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-choice-field")) { changeChoice(button.getAttribute("data-choice-field"), button.getAttribute("data-choice-value")); return; }
    if (button.hasAttribute("data-add-range")) { addRange(button.getAttribute("data-add-range")); return; }
    if (button.hasAttribute("data-delete-range")) { deleteRange(button.getAttribute("data-delete-range"), Number(button.getAttribute("data-range-index"))); return; }
    if (button.hasAttribute("data-party-tab")) { editorState.rule.editorDraft.activePartyIndex = Number(button.getAttribute("data-party-tab")); renderEditor(); return; }
    if (button.hasAttribute("data-round-tab")) { editorState.rule.editorDraft.activeRoundIndex = Number(button.getAttribute("data-round-tab")); renderEditor(); return; }
    if (button.hasAttribute("data-line-tab")) { editorState.rule.editorDraft.activeLineId = button.getAttribute("data-line-tab"); renderEditor(); return; }
    if (button.hasAttribute("data-toggle-batch")) { var panel = document.getElementById("batchPanel"); panel.style.display = panel.style.display === "none" ? "block" : "none"; return; }
    if (button.hasAttribute("data-apply-batch")) {
      var draft = editorState.rule.editorDraft;
      var mode = button.getAttribute("data-apply-batch");
      var input = document.getElementById("batchLimitValue");
      var value = mode === "value" ? Number(input.value) : mode === "zero" ? 0 : null;
      if (mode === "value" && (!Number.isInteger(value) || value < 0)) { toast("请输入大于或等于 0 的整数", true); return; }
      targetsForLine(draft, draft.activeLineId).forEach(function (target) { draft.limits[limitKey(draft.activePartyIndex, draft.period === "multi_round" ? draft.activeRoundIndex : 0, draft.activeLineId, target.id)] = { configured: true, value: value }; });
      markEditorDirty(); renderEditor(); return;
    }
    if (button.hasAttribute("data-set-unlimited")) {
      var unlimitedDraft = editorState.rule.editorDraft;
      unlimitedDraft.limits[limitKey(unlimitedDraft.activePartyIndex, unlimitedDraft.period === "multi_round" ? unlimitedDraft.activeRoundIndex : 0, unlimitedDraft.activeLineId, button.getAttribute("data-set-unlimited"))] = { configured: true, value: null };
      markEditorDirty(); renderEditor(); return;
    }
    if (button.hasAttribute("data-fix-step")) { goToEditorStep(Number(button.getAttribute("data-fix-step")), true); return; }
    if (button.hasAttribute("data-step")) { var step = Number(button.getAttribute("data-step")); if (step <= editorState.highestStep) goToEditorStep(step, true); return; }
  }

  function handleEditorInput(event) {
    var target = event.target;
    var draft = editorState.rule.editorDraft;
    if (target.hasAttribute("data-field")) {
      var field = target.getAttribute("data-field");
      draft[field] = target.value;
      markEditorDirty(); return;
    }
    if (target.name === "daysOfWeek" || target.name === "memberLevelIds") {
      updateCheckedList(target.name, target.value, target.checked); return;
    }
    if (target.hasAttribute("data-range-kind")) {
      var ranges = target.getAttribute("data-range-kind") === "party" ? draft.partyRanges : draft.roundRanges;
      var range = ranges[Number(target.getAttribute("data-range-index"))];
      var part = target.getAttribute("data-range-part");
      range[part] = part === "max" && target.value === "" ? null : Number(target.value);
      draft.limits = {};
      markEditorDirty(); return;
    }
    if (target.hasAttribute("data-limit-target")) {
      var key = limitKey(draft.activePartyIndex, draft.period === "multi_round" ? draft.activeRoundIndex : 0, draft.activeLineId, target.getAttribute("data-limit-target"));
      draft.limits[key] = target.value === "" ? { configured: false, value: null } : { configured: true, value: Math.max(0, Number(target.value)) };
      markEditorDirty(); return;
    }
    if (target.hasAttribute("data-condition")) { draft.conditions[target.getAttribute("data-condition")] = target.value; markEditorDirty(); return; }
    if (target.hasAttribute("data-auth-enabled")) { draft.authorization.enabled = target.checked; markEditorDirty(); renderEditor(); return; }
    if (target.hasAttribute("data-auth-scope")) {
      var scope = target.getAttribute("data-auth-scope");
      var scopeIndex = draft.authorization.allowedScopes.indexOf(scope);
      if (target.checked && scopeIndex < 0) draft.authorization.allowedScopes.push(scope);
      if (!target.checked && scopeIndex >= 0) draft.authorization.allowedScopes.splice(scopeIndex, 1);
      if (draft.authorization.allowedScopes.indexOf(draft.authorization.defaultScope) < 0) draft.authorization.defaultScope = draft.authorization.allowedScopes[0] || "";
      markEditorDirty(); renderEditor(); return;
    }
    if (target.hasAttribute("data-auth-role")) { draft.authorization.scopePermissions[target.getAttribute("data-auth-role")] = target.value; markEditorDirty(); return; }
    if (target.hasAttribute("data-auth-default")) { draft.authorization.defaultScope = target.value; markEditorDirty(); return; }
    if (target.hasAttribute("data-auth-reason")) { draft.authorization.reasonRequired = target.checked; markEditorDirty(); return; }
  }

  function mountEditor() {
    var rule;
    try { rule = initializeDraftRule(); } catch (error) {
      renderErrorState("无法创建规则草稿", "请检查浏览器存储空间后重试。", "重试", function () { window.location.reload(); });
      return;
    }
    if (!rule) {
      renderErrorState("规则不存在", "当前规则可能已被删除或归档。", "返回规则列表", function () { go("order-limit.html"); });
      return;
    }
    editorState = {
      rule: rule,
      currentStep: Number(rule.editorDraft.currentStep) || 1,
      highestStep: Math.max(Number(rule.editorDraft.highestStep) || 1, Number(rule.editorDraft.currentStep) || 1),
      stepErrors: {}, saveTimer: null, dirty: false, dialogConfirm: null
    };
    normalizeActiveDimensions(rule.editorDraft);
    root.innerHTML = '<div class="olf-page"><header class="olf-header"><div class="olf-header-main"><div class="olf-title-group"><button type="button" class="olf-icon-button" id="backButton" aria-label="返回规则列表">' + icon("back", 20) + '</button><div class="olf-title-copy"><h1>' + (rule.sourceRuleId ? "编辑" : "新增") + '数量与频次规则</h1><span class="olf-save-state" id="saveState">草稿已保存</span></div></div><div class="olf-actions"><button type="button" class="olf-button" id="headerSaveButton">保存草稿</button></div></div><div class="olf-progress"><span id="progressFill"></span></div></header><div class="olf-editor-shell"><nav class="olf-step-nav" id="stepNav" aria-label="规则配置步骤"></nav><main class="olf-content" id="editorContent"></main></div><footer class="olf-footer"><span class="olf-footer-note" id="footerNote"></span><div class="olf-actions"><button type="button" class="olf-button" id="previousButton">上一步</button><button type="button" class="olf-button" id="saveReturnButton" style="display:none">保存草稿并返回</button><button type="button" class="olf-button olf-button--primary" id="nextButton">下一步</button></div></footer></div>' +
      '<div class="olf-overlay" id="confirmOverlay" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><div class="olf-dialog"><h3 id="dialogTitle">确认操作</h3><p id="dialogCopy"></p><div class="olf-dialog-actions"><button type="button" class="olf-button" id="dialogCancel">继续编辑</button><button type="button" class="olf-button olf-button--primary" id="dialogConfirm">确定</button></div></div></div>';
    renderEditor();
    root.addEventListener("click", handleEditorClick);
    root.addEventListener("input", handleEditorInput);
    root.addEventListener("change", handleEditorInput);
    root.addEventListener("brand-menu-structure-change", function (event) {
      var draft = editorState.rule.editorDraft;
      var byLine = event.detail && event.detail.byLine;
      if (!byLine || !MenuPicker) return;
      draft.structureByLine = MenuPicker.normalizeByLine(byLine);
      syncDraftTargetsFromStructure(draft, true);
      var summary = document.getElementById("structureSummary");
      if (summary) summary.textContent = MenuPicker.formatSummary(draft.structureByLine);
      delete editorState.stepErrors[2];
      markEditorDirty();
    });
    document.getElementById("headerSaveButton").addEventListener("click", function () { if (saveEditorDraft(true)) toast("草稿已保存"); });
    document.getElementById("backButton").addEventListener("click", function () {
      if (!saveEditorDraft(true)) return;
      openDialog("退出新增规则？", "当前内容已保存为草稿，返回列表后可继续编辑。", "保存并返回", function () { go("order-limit.html"); });
    });
    document.getElementById("previousButton").addEventListener("click", function () { if (editorState.currentStep > 1) goToEditorStep(editorState.currentStep - 1, true); });
    document.getElementById("saveReturnButton").addEventListener("click", function () {
      if (!saveEditorDraft(true)) return;
      openDialog("保存草稿并返回？", "草稿会保留在规则列表中，不会下发或影响门店当前版本。", "保存并返回", function () { go("order-limit.html"); });
    });
    document.getElementById("nextButton").addEventListener("click", function () {
      var draft = editorState.rule.editorDraft;
      if (editorState.currentStep < 7) { goToEditorStep(editorState.currentStep + 1, false); return; }
      var check = validateAll(draft);
      if (check) { editorState.stepErrors[check.step] = check.message; toast(check.message, true); goToEditorStep(check.step, true); return; }
      if (!saveEditorDraft(true)) return;
      go("order-limit-store-select.html?draftId=" + encodeURIComponent(editorState.rule.id));
    });
    document.getElementById("dialogCancel").addEventListener("click", closeDialog);
    document.getElementById("dialogConfirm").addEventListener("click", function () { var confirm = editorState.dialogConfirm; if (confirm) confirm(); });
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (document.getElementById("confirmOverlay").classList.contains("is-open")) closeDialog();
    });
  }

  function updateDraftRule(draftRule) {
    var rules = loadRules();
    var index = rules.findIndex(function (rule) { return String(rule.id) === String(draftRule.id); });
    if (index < 0) return false;
    rules[index] = buildCompatibilityRule(draftRule, "draft");
    saveRules(rules);
    return true;
  }

  function getDraftFromParams() {
    var id = getParams().get("draftId");
    if (!id) return null;
    var rule = findRule(id);
    return rule && rule.status === "draft" && rule.editorDraft ? rule : null;
  }

  function renderFlowHeader(title, progress, backUrl, primaryLabel) {
    return '<header class="olf-header"><div class="olf-header-main"><div class="olf-title-group"><button type="button" class="olf-icon-button" id="flowBackButton" aria-label="返回">' + icon("back", 20) + '</button><div class="olf-title-copy"><h1>' + esc(title) + '</h1><span class="olf-save-state">规则草稿已保存</span></div></div><button type="button" class="olf-button olf-button--primary" id="flowPrimaryButton">' + esc(primaryLabel) + '</button></div><div class="olf-progress"><span style="width:' + progress + '%"></span></div></header>';
  }

  function mountStores() {
    var draftRule = getDraftFromParams();
    if (!draftRule) { renderErrorState("草稿不存在", "请返回规则列表重新进入。", "返回规则列表", function () { go("order-limit.html"); }); return; }
    var draft = draftRule.editorDraft;
    var allowed = stores.slice();
    var selected = (draft.deployStoreIds || []).slice();
    root.innerHTML = '<div class="olf-page">' + renderFlowHeader("选择发布门店", 82, "", "下一步") + '<main class="olf-flow-main"><section class="olf-flow-card"><h2>选择实际下发门店</h2><p class="olf-help">门店范围在发布阶段统一选择。至少选择一家门店后继续。</p><div class="olf-store-layout"><div class="olf-store-list" id="storeList">' + (allowed.length ? allowed.map(function (store) { return '<label class="olf-store-row"><input type="checkbox" value="' + esc(store.id) + '"' + (selected.indexOf(store.id) >= 0 ? " checked" : "") + ' /><span class="olf-store-copy"><strong>' + esc(store.name) + '</strong><span>MID ' + esc(store.mid) + ' · ' + esc(store.zone) + '</span></span></label>'; }).join("") : '<div class="olf-empty"><strong>暂无可下发门店</strong><span>当前没有可发布的门店。</span></div>') + '</div><aside class="olf-selected-panel"><h3>已选门店（<span id="selectedStoreCount">0</span>）</h3><div id="selectedStoreNames" class="olf-token-list"></div></aside></div></section></main></div>';
    function sync() {
      selected = Array.prototype.map.call(document.querySelectorAll("#storeList input:checked"), function (input) { return input.value; });
      document.getElementById("selectedStoreCount").textContent = String(selected.length);
      document.getElementById("selectedStoreNames").innerHTML = selected.length ? selected.map(function (id) { var store = stores.find(function (item) { return item.id === id; }); return '<span class="olf-token">' + esc(store ? store.name : id) + '</span>'; }).join("") : '<span class="olf-hint">尚未选择</span>';
      document.getElementById("flowPrimaryButton").disabled = selected.length === 0;
    }
    document.getElementById("storeList").addEventListener("change", sync);
    document.getElementById("flowBackButton").addEventListener("click", function () { go("order-limit-rule-editor.html?draftId=" + encodeURIComponent(draftRule.id)); });
    document.getElementById("flowPrimaryButton").addEventListener("click", function () {
      draft.deployStoreIds = selected.slice();
      if (!updateDraftRule(draftRule)) { toast("保存门店失败，请重试", true); return; }
      go("order-limit-publish-confirm.html?draftId=" + encodeURIComponent(draftRule.id));
    });
    sync();
  }

  function publishDraft(draftRule) {
    var rules = loadRules();
    var draftIndex = rules.findIndex(function (rule) { return String(rule.id) === String(draftRule.id); });
    if (draftIndex < 0) throw new Error("draft missing");
    var active = buildCompatibilityRule(draftRule, "active");
    active.publishedAt = new Date().toISOString();
    if (draftRule.sourceRuleId != null) {
      var sourceIndex = rules.findIndex(function (rule) { return String(rule.id) === String(draftRule.sourceRuleId); });
      if (sourceIndex < 0) throw new Error("source missing");
      active.id = rules[sourceIndex].id;
      active.created = rules[sourceIndex].created || active.created;
      delete active.sourceRuleId;
      rules[sourceIndex] = active;
      rules.splice(draftIndex, 1);
    } else {
      delete active.sourceRuleId;
      rules[draftIndex] = active;
    }
    saveRules(rules);
  }

  function mountPublish() {
    var draftRule = getDraftFromParams();
    if (!draftRule) { renderErrorState("草稿不存在", "请返回规则列表重新进入。", "返回规则列表", function () { go("order-limit.html"); }); return; }
    var draft = draftRule.editorDraft;
    var check = validateAll(draft);
    if (check) { renderErrorState("规则校验未通过", check.message, "返回规则编辑", function () { go("order-limit-rule-editor.html?draftId=" + encodeURIComponent(draftRule.id)); }); return; }
    if (!draft.deployStoreIds.length) { renderErrorState("尚未选择发布门店", "请先完成门店选择。", "选择门店", function () { go("order-limit-store-select.html?draftId=" + encodeURIComponent(draftRule.id)); }); return; }
    var completion = limitCompletion(draft);
    root.innerHTML = '<div class="olf-page">' + renderFlowHeader("确认发布", 100, "", "确认发布") + '<main class="olf-flow-main"><section class="olf-flow-card"><h2>发布前最终确认</h2><p class="olf-help">发布成功后将生成正式版本；全部门店作为一个完整版本处理。</p><div class="olf-summary olf-summary--success"><strong>校验通过：</strong>规则结构、数量、授权和目标门店均完整。</div><section class="olf-section"><div class="olf-review"><div class="olf-review-row"><span>规则名称</span><strong>' + esc(draft.name) + '</strong><span></span></div><div class="olf-review-row"><span>计算方式</span><strong>' + esc(subjectLabel(draft.subject) + " × " + periodLabel(draft.period) + " × " + targetShortLabel(draft.targetType)) + '</strong><span></span></div><div class="olf-review-row"><span>商品范围</span><strong>' + esc(selectedTargets(draft).map(function (item) { return item.name; }).join("、")) + '</strong><span></span></div><div class="olf-review-row"><span>数量矩阵</span><strong>' + completion.complete + ' 个单元格已确认</strong><span></span></div><div class="olf-review-row"><span>发布门店</span><strong>' + esc(namesFor(stores, draft.deployStoreIds)) + '</strong><span></span></div><div class="olf-review-row"><span>授权范围</span><strong>' + esc(draft.authorization.enabled ? draft.authorization.allowedScopes.map(function (scope) { return scope === "operation" ? "本次操作" : scope === "round" ? "当前轮" : "当前订单"; }).join(" / ") : "硬性拒绝") + '</strong><span></span></div></div></section><div class="olf-summary olf-summary--warning"><strong>原子发布：</strong>若任一门店发布失败，本次不会形成混合版本，所有门店继续使用上一完整版本。</div></section></main></div>';
    document.getElementById("flowBackButton").addEventListener("click", function () { go("order-limit-store-select.html?draftId=" + encodeURIComponent(draftRule.id)); });
    document.getElementById("flowPrimaryButton").addEventListener("click", function () {
      var button = this;
      button.disabled = true;
      button.classList.add("is-loading");
      button.textContent = "发布中…";
      window.setTimeout(function () {
        try {
          publishDraft(draftRule);
          button.textContent = "发布成功";
          toast("规则已发布");
          window.setTimeout(function () { go("order-limit.html"); }, 500);
        } catch (error) {
          button.disabled = false;
          button.classList.remove("is-loading");
          button.textContent = "重新发布";
          toast("发布失败，门店继续使用上一完整版本", true);
        }
      }, 500);
    });
  }

  if (page === "editor") mountEditor();
  else if (page === "stores") mountStores();
  else if (page === "publish") mountPublish();
})();
