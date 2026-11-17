(function () {
  "use strict";
  var labels = { all: "全天", lunch: "午市", dinner: "晚市" };
  var bounds = { all: ["00:00", "23:59"], lunch: ["11:00", "16:59"], dinner: ["17:00", "23:00"] };
  function slots(c) { return Array.isArray(c.businessHourSlots) ? c.businessHourSlots : []; }
  function minute(value) {
    var match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  function rows(c) {
    return slots(c).map(function (slot) {
      var range = bounds[slot.id] || bounds.all;
      var custom = c.scopeTimeVersion === 1 || c.businessHourSetupMode === "per_slot" && slot.mode === "custom";
      return { id: slot.id, name: slot.name == null ? labels[slot.id] || "自定义时间段" : slot.name,
        mode: "custom", from: custom ? slot.from || "" : range[0], to: custom ? slot.to || "" : range[1] };
    });
  }
  function activate(c) {
    if (c.scopeTimeVersion !== 1) c.businessHourSlots = rows(c);
    c.scopeTimeVersion = 1;
    c.businessHourSetupMode = "per_slot";
    normalize(c);
  }
  function normalize(c) {
    // A deliberately empty list stays empty; do not resurrect a deleted dinner row.
    c.businessHourSlots = slots(c).filter(function (s) { return s && typeof s.id === "string"; }).map(function (s) {
      return { id: s.id, name: String(s.name == null ? labels[s.id] || "自定义时间段" : s.name),
        mode: "custom", from: String(s.from || ""), to: String(s.to || "") };
    });
    c.businessHourSetupMode = "per_slot";
  }
  function validate(c) {
    var selected = rows(c), ids = {}, intervals = [];
    if (!selected.length) return "请至少添加一个活动时段";
    for (var i = 0; i < selected.length; i += 1) {
      var s = selected[i], title = String(s.name).trim(), from = minute(s.from), to = minute(s.to);
      if (ids[s.id]) return "活动时段标识重复，请删除后重新添加";
      ids[s.id] = true;
      if (!title || title.length > 30) return "请填写1至30字的活动时段名称";
      if (from == null || to == null) return "请填写" + title + "的有效时间";
      if (from >= to) return title + "开始时间须早于结束时间";
      intervals.push({ from: from, to: to, name: title });
    }
    intervals.sort(function (a, b) { return a.from - b.from; });
    for (var j = 1; j < intervals.length; j += 1) {
      if (intervals[j].from < intervals[j - 1].to) return "活动时段不能重叠：" + intervals[j - 1].name + "与" + intervals[j].name;
    }
    return null;
  }
  function summary(c) { return rows(c).map(function (s) { return s.name + " " + s.from + "–" + s.to; }).join("；") || "未添加活动时段"; }
  window.BuffetEffectiveScope = { rows: rows, activate: activate, normalize: normalize, validate: validate, minute: minute, summary: summary };
})();
