(function () {
  "use strict";

  var REPOSITORY_KEY = "buffet-rule:repository:v1";
  var LOCK_KEY = "buffet-rule:repository-lock:v1";
  var LOCK_TTL = 3000;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyEnvelope() {
    return {
      schemaVersion: 1,
      revision: 0,
      rules: [],
      drafts: [],
      snapshots: {},
      currentSnapshotId: null
    };
  }

  function normalizeEnvelope(value) {
    if (!value || value.schemaVersion !== 1) throw new Error("BUFFET_REPOSITORY_SCHEMA_INVALID");
    return {
      schemaVersion: 1,
      revision: Number.isInteger(value.revision) && value.revision >= 0 ? value.revision : 0,
      rules: Array.isArray(value.rules) ? value.rules : [],
      drafts: Array.isArray(value.drafts) ? value.drafts : [],
      snapshots: value.snapshots && typeof value.snapshots === "object" ? value.snapshots : {},
      currentSnapshotId: typeof value.currentSnapshotId === "string" ? value.currentSnapshotId : null
    };
  }

  function readEnvelope() {
    var raw = localStorage.getItem(REPOSITORY_KEY);
    if (!raw) return emptyEnvelope();
    try {
      return normalizeEnvelope(JSON.parse(raw));
    } catch (error) {
      var wrapped = new Error("自助餐规则数据损坏或版本不受支持");
      wrapped.code = "BUFFET_REPOSITORY_READ_ONLY";
      wrapped.cause = error;
      throw wrapped;
    }
  }

  function ownerToken() {
    return Date.now().toString(36) + ":" + Math.random().toString(36).slice(2);
  }

  function withLock(work) {
    var now = Date.now();
    var existing;
    try { existing = JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (error) { existing = null; }
    if (existing && existing.expiresAt > now) throw new Error("BUFFET_REPOSITORY_BUSY");
    var token = ownerToken();
    localStorage.setItem(LOCK_KEY, JSON.stringify({ owner: token, expiresAt: now + LOCK_TTL }));
    var acquired = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
    if (!acquired || acquired.owner !== token) throw new Error("BUFFET_REPOSITORY_BUSY");
    try {
      return work();
    } finally {
      var current;
      try { current = JSON.parse(localStorage.getItem(LOCK_KEY) || "null"); } catch (error) { current = null; }
      if (current && current.owner === token) localStorage.removeItem(LOCK_KEY);
    }
  }

  function mutateEnvelope(expectedRevision, mutator) {
    return withLock(function () {
      var current = readEnvelope();
      if (expectedRevision != null && current.revision !== expectedRevision) {
        var conflict = new Error("自助餐规则已在其他页面更新，请刷新后重试");
        conflict.code = "BUFFET_REPOSITORY_REVISION_CONFLICT";
        throw conflict;
      }
      var next = normalizeEnvelope(mutator(clone(current)) || current);
      next.revision = current.revision + 1;
      localStorage.setItem(REPOSITORY_KEY, JSON.stringify(next));
      return clone(next);
    });
  }

  var repository = {
    key: REPOSITORY_KEY,
    readEnvelope: readEnvelope,
    mutateEnvelope: mutateEnvelope,
    loadRules: function () {
      var envelope = readEnvelope();
      return clone(envelope.rules.concat(envelope.drafts));
    },
    saveRules: function (records) {
      return mutateEnvelope(null, function (next) {
        next.rules = records.filter(function (rule) { return rule && rule.status !== "draft"; });
        next.drafts = records.filter(function (rule) { return rule && rule.status === "draft"; });
        return next;
      });
    }
  };

  window.ORDER_LIMIT_MODULE_PROFILE = {
    moduleId: "buffet-rule",
    pageTitle: "自助餐规则",
    routes: {
      list: "buffet-rule.html",
      editor: "buffet-rule-editor.html",
      publishConfirm: "buffet-rule-publish-confirm.html"
    },
    storage: {
      rulesKey: REPOSITORY_KEY,
      recoveryPrefix: "buffet-rule:recovery:v1:",
      listColumnsKey: "buffet-rule:rule-list-columns:v1",
      listFiltersKey: "buffet-rule:rule-list-filters:v1"
    },
    repository: repository,
    conflictPolicy: window.BuffetRuleDomain || null,
    steps: [
      { title: "规则类型", note: "确定计算口径" },
      { title: "场景配置", note: "人数与轮次区间" },
      { title: "限购数量", note: "按门店选品并配置数量" },
      { title: "超限授权", note: "授权范围与权限" },
      { title: "生效范围", note: "时间、会员与门店" },
      { title: "确认发布", note: "复核并下发" }
    ],
    allowedPeriodsBySubject: {
      order: ["order_lifetime"],
      party_size: ["order_lifetime", "per_round", "multi_round"]
    },
    allowedTargetTypes: ["category", "dish"]
  };
})();
