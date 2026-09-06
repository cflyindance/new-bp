(function () {
  "use strict";

  var PERIODS = ["order_lifetime", "per_round", "multi_round"];
  var FIXED_COLUMNS = ["name", "status", "actions"];
  var DEFAULT_COLUMNS = ["name", "strategy", "partyScenario", "productScope", "effectiveStores", "status", "actions"];
  var COLUMN_GROUPS = [
    { id: "legacy", label: "旧规则核对", columns: [["legacyCapabilities", "旧 KPOS 调研能力"], ["coverage", "覆盖结果"]] },
    { id: "type", label: "规则类型", columns: [["subject", "限购主体"], ["period", "额度周期"], ["targetType", "限购对象"], ["measurement", "计量方式"]] },
    { id: "scenario", label: "场景与数量", columns: [["partyRanges", "人数区间"], ["roundRanges", "轮次区间"], ["roundTotal", "每轮总量"], ["targetLimit", "对象限额"], ["sameDishLimit", "相同菜品限额"]] },
    { id: "product", label: "商品配置", columns: [["participatingStores", "参与门店"], ["productLines", "适用产线"], ["targetCount", "目标商品数"], ["quantityCompletion", "数量完成度"]] },
    { id: "authorization", label: "超限授权", columns: [["authorizationScopes", "授权范围"], ["defaultAuthorizationScope", "默认授权范围"], ["requiredPermission", "所需权限"], ["authorizationReason", "授权原因"]] },
    { id: "effective", label: "生效范围", columns: [["effectiveDate", "有效日期"], ["activityPeriod", "活动周期"], ["businessHours", "营业时段"], ["memberScope", "会员范围"]] },
    { id: "extra", label: "补充字段", columns: [["description", "规则描述"]] }
  ];
  var BASE_COLUMNS = [
    { id: "name", label: "规则名称", fixed: true, defaultVisible: true, width: 210 },
    { id: "strategy", label: "规则策略", defaultVisible: true, width: 230 },
    { id: "partyScenario", label: "人数场景", defaultVisible: true, width: 170 },
    { id: "productScope", label: "商品范围", defaultVisible: true, width: 190 },
    { id: "effectiveStores", label: "生效门店", defaultVisible: true, width: 170 },
    { id: "status", label: "状态", fixed: true, defaultVisible: true, width: 90 },
    { id: "actions", label: "操作", fixed: true, defaultVisible: true, width: 260 }
  ];
  var COLUMN_WIDTHS = { legacyCapabilities: 280, coverage: 120, subject: 110, period: 140, targetType: 100, measurement: 100, partyRanges: 170, roundRanges: 170, roundTotal: 210, targetLimit: 210, sameDishLimit: 210, participatingStores: 170, productLines: 150, targetCount: 110, quantityCompletion: 120, authorizationScopes: 170, defaultAuthorizationScope: 130, requiredPermission: 150, authorizationReason: 110, effectiveDate: 190, activityPeriod: 150, businessHours: 210, memberScope: 150, description: 240 };

  function copyArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function unique(values) { return values.filter(function (value, index) { return value && values.indexOf(value) === index; }); }
  function valueText(value, fallback) { return value == null || value === "" ? (fallback || "—") : String(value); }
  function configFor(record) { return record && (record.authoringConfig || record.authoringDraft || record.editorDraft) || {}; }
  function normalizeStatus(value) { return value === "active" ? "active" : value === "disabled" || value === "inactive" ? "disabled" : value === "draft" ? "draft" : "unknown"; }
  function normalizePeriods(config) {
    config = config || {};
    var source = Array.isArray(config.enabledPeriods) && config.enabledPeriods.length ? config.enabledPeriods : [config.period];
    return unique(source.filter(function (value) { return PERIODS.indexOf(value) >= 0; }));
  }
  function normalizeRanges(value) {
    return copyArray(value).map(function (range) {
      var min = Number(range && range.min), rawMax = range && range.max, max = rawMax == null || rawMax === "" ? null : Number(rawMax);
      return Number.isInteger(min) && min >= 1 && (max == null || Number.isInteger(max) && max >= min) ? { min: min, max: max } : null;
    }).filter(Boolean);
  }
  function rangeLabel(range, unit) { return range.max == null ? range.min + unit + "及以上" : range.min === range.max ? range.min + unit : range.min + "–" + range.max + unit; }
  function partyRangesFor(config) {
    if (config.subject === "order") return [{ min: 1, max: null }];
    var ranges = normalizeRanges(config.partySizeRanges || config.partyRanges || config.peopleRanges);
    return ranges.length ? ranges : [];
  }
  function slotSource(conditions) {
    conditions = conditions || {};
    if (Array.isArray(conditions.businessHourSlots) && conditions.businessHourSlots.length) return conditions.businessHourSlots;
    var id = conditions.businessHour || "dinner";
    return [{ id: id, mode: conditions.businessHourTimeMode || "full", from: conditions.businessHourFrom || "", to: conditions.businessHourTo || "" }];
  }
  function normalizeEffectiveTime(conditions) {
    var allowed = ["all", "lunch", "dinner"], labels = { all: "全天", lunch: "午市", dinner: "晚市" }, byId = {};
    slotSource(conditions).forEach(function (slot) {
      if (!slot || allowed.indexOf(slot.id) < 0 || byId[slot.id]) return;
      var custom = slot.mode === "custom" && /^\d\d:\d\d$/.test(slot.from || "") && /^\d\d:\d\d$/.test(slot.to || "");
      byId[slot.id] = { id: slot.id, mode: custom ? "custom" : "full", from: custom ? slot.from : "", to: custom ? slot.to : "" };
    });
    if ((byId.lunch || byId.dinner) && byId.all) delete byId.all;
    var slots = allowed.map(function (id) { return byId[id]; }).filter(Boolean);
    if (!slots.length) slots = [{ id: "dinner", mode: "full", from: "", to: "" }];
    return {
      key: slots.map(function (slot) { return slot.id + "|" + slot.mode + (slot.mode === "custom" ? "|" + slot.from + "|" + slot.to : ""); }).join(";"),
      label: slots.map(function (slot) { return labels[slot.id] + (slot.mode === "custom" ? " " + slot.from + "–" + slot.to : slot.id === "all" ? "生效" : "全时段"); }).join("；")
    };
  }
  function resolveTemplate(record, profile) {
    if (!record || record.origin !== "system_default") return null;
    var config = configFor(record), scenarios = copyArray(profile && profile.defaultScenarios), key = String(record.defaultScenarioKey || config.defaultScenarioKey || ""), version = Number(record.defaultCatalogVersion || config.defaultCatalogVersion || 0);
    var direct = scenarios.find(function (item) { return item && item.key === key && version === item.version; });
    if (direct) return direct;
    var legacyKey = profile && typeof profile.verifiedLegacyDefaultKey === "function" ? profile.verifiedLegacyDefaultKey(record) : "";
    return scenarios.find(function (item) { return item && item.key === legacyKey; }) || null;
  }
  function capabilityRows(template, profile) {
    return template ? copyArray(template.legacyCapabilityIds).map(function (id) { return profile && profile.legacyCapabilities && profile.legacyCapabilities[id] || { id: id, label: id }; }) : [];
  }
  function groupFor(config, template) {
    if (template && ["order_lifetime", "per_round_combo", "per_round"].indexOf(template.group) >= 0) return template.group;
    if (String(config.defaultVariant || "").indexOf("combo_") === 0) return "per_round_combo";
    var periods = normalizePeriods(config);
    if (periods.length && periods.every(function (period) { return period === "order_lifetime"; })) return "order_lifetime";
    if (periods.some(function (period) { return period === "per_round" || period === "multi_round"; })) return "per_round";
    return "custom";
  }
  function targetLabel(type) { return type === "dish" ? "菜品" : type === "category" ? "分类" : type === "dish_set" ? "菜品集" : "—"; }
  function periodLabel(period) { return period === "order_lifetime" ? "整个订单" : period === "per_round" ? "每轮" : period === "multi_round" ? "多轮" : "—"; }
  function statusLabel(status) { return status === "active" ? "已启用" : status === "disabled" ? "已禁用" : status === "draft" ? "草稿" : "—"; }
  function measurementLabel(value) { return value === "types" || value === "kind" ? "种" : "份"; }
  function storeMap(stores) { var map = {}; copyArray(stores).forEach(function (store) { map[store.id] = store; }); return map; }
  function storesLabel(ids, stores) {
    ids = unique(copyArray(ids)); if (!ids.length) return "0 家";
    var map = storeMap(stores), first = map[ids[0]] ? map[ids[0]].name : "未知门店（" + ids[0] + "）";
    return ids.length === 1 ? first : first + "等 " + ids.length + " 家";
  }
  function selectedStoreIds(record, config) {
    var deploy = unique(copyArray(config.deployStoreIds));
    return deploy.length ? deploy : normalizeStatus(record.status) === "draft" ? unique(copyArray(config.participatingStoreIds)) : [];
  }
  function entriesForStore(config, storeId) {
    var sources = [config.targetsByStore, config.selectedTargetsByStore, config.productsByStore, config.storeTargets];
    for (var i = 0; i < sources.length; i += 1) if (sources[i] && Array.isArray(sources[i][storeId])) return sources[i][storeId];
    return [];
  }
  function targetKey(item, type) {
    var line = item.productLineId || item.lineId || "";
    var id = type === "category" ? item.categoryId || item.id : item.dishId || item.productId || item.id;
    return id == null ? "" : line + "::" + id;
  }
  function targetCounts(record, config) {
    var ids = selectedStoreIds(record, config), type = config.targetType;
    return ids.map(function (id) { return unique(entriesForStore(config, id).map(function (item) { return targetKey(item, type); })).length; });
  }
  function productScope(record, config) {
    var counts = targetCounts(record, config); if (!counts.length || !counts.some(function (count) { return count > 0; })) return "—";
    var noun = config.targetType === "dish_set" ? "菜品集" : config.targetType === "category" ? "分类" : "指定菜品";
    if (counts.length === 1) return noun + " " + counts[0] + (config.targetType === "dish_set" ? " 个成员" : " 个");
    var min = Math.min.apply(Math, counts), max = Math.max.apply(Math, counts);
    return counts.length + " 家 · 每店 " + (min === max ? min : min + "–" + max) + " 个";
  }
  function deepConfiguredValues(value, out) {
    out = out || [];
    if (Array.isArray(value)) value.forEach(function (item) { deepConfiguredValues(item, out); });
    else if (value && typeof value === "object") {
      if (value.configured === true && Number.isFinite(Number(value.value))) out.push(Number(value.value));
      else Object.keys(value).forEach(function (key) { if (key !== "configured") deepConfiguredValues(value[key], out); });
    }
    return out;
  }
  function quantitySummary(value, required, prefix) {
    var values = deepConfiguredValues(value), total = Math.max(Number(required) || values.length, values.length);
    if (!total) return "—"; if (!values.length) return "未配置";
    var min = Math.min.apply(Math, values), max = Math.max.apply(Math, values), text = prefix + (min === max ? min : min + "–" + max);
    return total > 1 ? total + " 个场景 · " + text + (values.length < total ? "（已配置 " + values.length + "/" + total + "）" : "") : text;
  }
  function lineSummary(config, storeIds) {
    var ids = [];
    storeIds.forEach(function (storeId) { entriesForStore(config, storeId).forEach(function (item) { ids.push(item.productLineId || item.lineId); }); });
    return unique(ids).filter(Boolean).join("、") || "—";
  }
  function createViewModel(record, profile, stores) {
    var config = configFor(record), template = resolveTemplate(record, profile), time = normalizeEffectiveTime(config.conditions || config), periods = normalizePeriods(config), partyRanges = partyRangesFor(config), capabilities = capabilityRows(template, profile), storeIds = selectedStoreIds(record, config);
    return { record: record, config: config, template: template, id: String(record.id), name: config.name || record.name || "未命名规则", description: config.description || "", status: normalizeStatus(record.status), subject: config.subject || "unknown", periods: periods, targetType: config.targetType || "unknown", measurement: config.measurement || config.measurementType || "portion", partyRanges: partyRanges, roundRanges: normalizeRanges(config.roundRanges || config.roundIntervals), effectiveTimeKey: time.key, effectiveTimeLabel: time.label, deployStoreIds: unique(copyArray(config.deployStoreIds)), participatingStoreIds: unique(copyArray(config.participatingStoreIds)), storeIds: storeIds, legacyCapabilities: capabilities, coverage: template && template.coverageStatus || "", group: groupFor(config, template), isSystemDefault: !!template, stores: stores || [] };
  }
  function containsParty(row, size) { return row.subject === "order" || row.partyRanges.some(function (range) { return size >= range.min && (range.max == null || size <= range.max); }); }
  function normalizeFilters(filters) {
    filters = filters || {}; var party = String(filters.partySize == null ? "" : filters.partySize).trim(), partyNumber = /^\d+$/.test(party) && Number(party) >= 1 ? Number(party) : null;
    return { keyword: String(filters.keyword || "").trim().toLowerCase(), storeId: filters.storeId || "", status: filters.status || "", subject: filters.subject || "", period: filters.period || "", targetType: filters.targetType || "", partySize: party, partyNumber: partyNumber, partyInvalid: party !== "" && partyNumber == null, effectiveTimeKey: filters.effectiveTimeKey || "" };
  }
  function filterRows(rows, filters) {
    var f = normalizeFilters(filters);
    return copyArray(rows).filter(function (row) {
      var search = (row.name + " " + row.legacyCapabilities.map(function (item) { return item.id + " " + item.label; }).join(" ")).toLowerCase();
      return (!f.keyword || search.indexOf(f.keyword) >= 0) && (!f.storeId || row.deployStoreIds.indexOf(f.storeId) >= 0) && (!f.status || row.status === f.status) && (!f.subject || row.subject === f.subject) && (!f.period || row.periods.indexOf(f.period) >= 0) && (!f.targetType || row.targetType === f.targetType) && (f.partyInvalid || f.partyNumber == null || containsParty(row, f.partyNumber)) && (!f.effectiveTimeKey || row.effectiveTimeKey === f.effectiveTimeKey);
    });
  }
  function groupRows(rows) {
    var groups = { order_lifetime: [], per_round_combo: [], per_round: [], custom: [] };
    copyArray(rows).forEach(function (row) { (groups[row.group] || groups.custom).push(row); });
    return groups;
  }
  function buildFilterOptions(rows, stores) {
    var used = [], times = {};
    rows.forEach(function (row) { used = used.concat(row.deployStoreIds); times[row.effectiveTimeKey] = row.effectiveTimeLabel; });
    used = unique(used); var map = storeMap(stores), known = copyArray(stores).filter(function (store) { return used.indexOf(store.id) >= 0; }).sort(function (a, b) { return a.order - b.order; });
    var unknown = used.filter(function (id) { return !map[id]; }).map(function (id) { return { id: id, name: "未知门店（" + id + "）", order: 999999 }; });
    return { stores: known.concat(unknown), times: Object.keys(times).sort().map(function (key) { return { key: key, label: times[key] }; }) };
  }
  function columnDefinitions() {
    var optional = [];
    COLUMN_GROUPS.forEach(function (group) { group.columns.forEach(function (column) { optional.push({ id: column[0], label: column[1], group: group.id, fixed: false, defaultVisible: false, width: COLUMN_WIDTHS[column[0]] || 140 }); }); });
    return BASE_COLUMNS.concat(optional);
  }
  function defaultVisibleColumns() { return DEFAULT_COLUMNS.slice(); }
  function normalizeColumnPreference(pref) {
    var all = columnDefinitions().map(function (column) { return column.id; });
    if (!pref || pref.version !== 1 || !Array.isArray(pref.visible)) return { version: 1, visible: defaultVisibleColumns() };
    var visible = unique(pref.visible.filter(function (id) { return all.indexOf(id) >= 0; }));
    FIXED_COLUMNS.forEach(function (id) { if (visible.indexOf(id) < 0) visible.push(id); });
    return { version: 1, visible: visible };
  }
  function textCell(main, sub) { return { main: main || "—", sub: sub || "" }; }
  function projectColumns(row) {
    var c = row.config, periods = row.periods.map(periodLabel), party = row.subject === "order" || row.partyRanges.some(function (range) { return range.min === 1 && range.max == null; }) ? "所有人数" : row.partyRanges.map(function (range) { return rangeLabel(range, "人"); }).join("、") || "—";
    var subject = row.subject === "party_size" ? "按人数" : row.subject === "order" ? "按桌/订单" : "—", target = targetLabel(row.targetType), measure = measurementLabel(row.measurement), strategy = row.group === "per_round_combo" ? "按人数区间 · 每轮总量＋" + target + "额度" : subject + " · " + (periods.join("＋") || "—") + " · " + target + " · 按" + measure;
    var auth = c.authorization || c.overrideAuthorization || {}, required = c.quantityRequiredCount || c.requiredQuantityCount || 0;
    return {
      name: textCell(row.name, row.isSystemDefault ? "系统默认" : ""), strategy: textCell(strategy), partyScenario: textCell(party), productScope: textCell(productScope(row.record, c)), effectiveStores: textCell(storesLabel(row.deployStoreIds, row.stores)), status: textCell(statusLabel(row.status)), actions: textCell(""),
      legacyCapabilities: textCell(row.legacyCapabilities.map(function (item) { return item.id + " " + item.label; }).join("；") || "—"), coverage: textCell(row.coverage || "—"), subject: textCell(subject), period: textCell(periods.join("＋") || "—"), targetType: textCell(target), measurement: textCell("按" + measure), partyRanges: textCell(party), roundRanges: textCell(row.roundRanges.map(function (range) { return rangeLabel(range, "轮"); }).join("、") || "—"),
      roundTotal: textCell(periods.some(function (p) { return p === "每轮" || p === "多轮"; }) || row.group === "per_round_combo" ? quantitySummary(c.tableTotalBounds || c.totalBounds, c.totalRequiredCount || required, "最少/最多 ") : "—"), targetLimit: textCell(quantitySummary(c.tableTargetCaps || c.targetLimits, c.targetRequiredCount || required, "最多 ") ), sameDishLimit: textCell(periods.some(function (p) { return p === "每轮" || p === "多轮"; }) || row.group === "per_round_combo" ? quantitySummary(c.defaultDishLimits || c.exceptionDishLimits, c.sameDishRequiredCount || required, "最多 ") : "—"),
      participatingStores: textCell(storesLabel(row.participatingStoreIds, row.stores)), productLines: textCell(lineSummary(c, row.storeIds)), targetCount: textCell(targetCounts(row.record, c).reduce(function (sum, value) { return sum + value; }, 0) || "—"), quantityCompletion: textCell(c.quantityCompletionLabel || (c.quantityConfiguredCount != null && required ? c.quantityConfiguredCount + " / " + required : "—")),
      authorizationScopes: textCell(copyArray(auth.allowedScopes).map(function (scope) { return scope === "operation" ? "本次操作" : scope === "round" ? "当前轮" : scope === "order" ? "当前订单" : scope; }).join("、") || "—"), defaultAuthorizationScope: textCell(auth.defaultScope === "operation" ? "本次操作" : auth.defaultScope === "round" ? "当前轮" : auth.defaultScope === "order" ? "当前订单" : "—"), requiredPermission: textCell(auth.permissionName || auth.permission || "—"), authorizationReason: textCell(auth.reasonRequired ? "必填" : "非必填"),
      effectiveDate: textCell(c.effectiveDateLabel || c.dateRangeLabel || "—"), activityPeriod: textCell(c.activityPeriodLabel || c.activityCycleLabel || "—"), businessHours: textCell(row.effectiveTimeLabel), memberScope: textCell(c.memberScopeLabel || c.memberScope || "全部"), description: textCell(row.description || "—")
    };
  }

  window.BuffetRuleListView = { PERIODS: PERIODS, columnGroups: COLUMN_GROUPS, configFor: configFor, normalizeStatus: normalizeStatus, normalizePeriods: normalizePeriods, normalizeEffectiveTime: normalizeEffectiveTime, normalizeFilters: normalizeFilters, createViewModel: createViewModel, filterRows: filterRows, groupRows: groupRows, buildFilterOptions: buildFilterOptions, columnDefinitions: columnDefinitions, defaultVisibleColumns: defaultVisibleColumns, normalizeColumnPreference: normalizeColumnPreference, projectColumns: projectColumns, quantitySummary: quantitySummary };
})();
