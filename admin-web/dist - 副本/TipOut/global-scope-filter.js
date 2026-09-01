/**
 * 读取商家后台顶栏「品牌 / 区域 / 门店」全局筛选，供 TipOut 内嵌页过滤员工等数据。
 */
(function (global) {
  "use strict";

  var STORE_KEY = "header-scope-filter-store";
  var META_KEY = "menusifu-scope-filter-meta";

  var ROSTER_STORE_SCOPE_PREFIX = "roster-store:";

  function parseRosterStoreScopeId(storeId) {
    if (!storeId || String(storeId).indexOf(ROSTER_STORE_SCOPE_PREFIX) !== 0) return "";
    try {
      return decodeURIComponent(String(storeId).slice(ROSTER_STORE_SCOPE_PREFIX.length));
    } catch (_) {
      return "";
    }
  }

  /** 演示：M 平台门店 ID / 名称 → TipOut 员工主档门店名（仅用于匹配，不用于展示） */
  var ROSTER_STORE_ALIASES = {
    M00000001: ["上海陆家嘴店", "张记火锅", "Golden Dragon Chinese Kitchen - Dallas, TX 75231"],
    "shanghai-ljz": ["上海陆家嘴店", "Golden Dragon Chinese Kitchen - Dallas, TX 75231"],
    M00000002: ["广州天河店", "Sakura Sushi & Ramen House - Dallas, TX 75247"],
    "guangzhou-tzh": ["广州天河店", "Sakura Sushi & Ramen House - Dallas, TX 75247"],
    M00000003: ["深圳南山店", "Lone Star BBQ House - Austin, TX 78701"],
    "shenzhen-ns": ["深圳南山店", "Lone Star BBQ House - Austin, TX 78701"],
    M00000004: ["Nai Cha", "nai cha", "奶茶", "北京旗舰店"],
    "flagship-nyc": ["Nai Cha", "北京旗舰店"],
    "branch-la": ["Downtown Branch", "Airport Kiosk", "洛杉矶分店"],
    M00000005: ["Pacific Bowl & Grill - San Diego, CA 92101", "杭州西湖店"],
    "hangzhou-xh": ["杭州西湖店", "Pacific Bowl & Grill - San Diego, CA 92101"],
  };

  /** 英文 / 旧演示名 → 中文展示名（上海陆家嘴 / 广州天河不双语并存） */
  var ROSTER_STORE_DISPLAY_CANONICAL = {
    "golden dragon chinese kitchen - dallas, tx 75231": "上海陆家嘴店",
    "sakura sushi & ramen house - dallas, tx 75247": "广州天河店",
    张记火锅: "上海陆家嘴店",
  };

  function normalizeStoreText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function canonicalRosterStoreDisplayName(storeName) {
    var trimmed = String(storeName || "").trim();
    if (!trimmed) return "";
    return ROSTER_STORE_DISPLAY_CANONICAL[normalizeStoreText(trimmed)] || trimmed;
  }

  function isSuppressedRosterStoreAlias(storeName) {
    var trimmed = String(storeName || "").trim();
    if (!trimmed) return false;
    return canonicalRosterStoreDisplayName(trimmed) !== trimmed;
  }

  function collectAliasesForScope(scope) {
    var out = [];
    var seen = {};
    function push(name) {
      var n = String(name || "").trim();
      if (!n || seen[n]) return;
      seen[n] = 1;
      out.push(n);
    }
    if (!scope) return out;
    if (scope.storeId && ROSTER_STORE_ALIASES[scope.storeId]) {
      ROSTER_STORE_ALIASES[scope.storeId].forEach(push);
    }
    var labelNorm = normalizeStoreText(scope.storeLabel);
    if (labelNorm) {
      Object.keys(ROSTER_STORE_ALIASES).forEach(function (id) {
        var aliases = ROSTER_STORE_ALIASES[id] || [];
        var hit = aliases.some(function (a) {
          return normalizeStoreText(a) === labelNorm;
        });
        if (!hit) return;
        push(id);
        aliases.forEach(push);
      });
    }
    return out;
  }

  function readScopeMeta() {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (!raw) return null;
      var meta = JSON.parse(raw);
      return meta && typeof meta === "object" ? meta : null;
    } catch (_) {
      return null;
    }
  }

  function readGlobalScopeFilter() {
    var storeId = "";
    var storeLabel = "";
    try {
      storeId = sessionStorage.getItem(STORE_KEY) || "";
      var meta = readScopeMeta();
      if (meta) {
        storeLabel = String(meta.storeLabel || meta.storeLabelEn || "").trim();
        if (!storeId && meta.storeId) storeId = String(meta.storeId).trim();
      }
    } catch (_) {
      /* ignore */
    }
    return {
      storeId: storeId,
      storeLabel: storeLabel,
      isAllStores: !String(storeId || "").trim(),
    };
  }

  function usesInPageStorePicker() {
    var meta = readScopeMeta();
    return !!(meta && meta.usesInPageStorePicker);
  }

  function listScopedStoreOptions() {
    var meta = readScopeMeta();
    if (!meta || !Array.isArray(meta.stores)) return [];
    var seen = {};
    var out = [];
    meta.stores.forEach(function (o) {
      if (!o || !o.value) return;
      var labelZh = String(o.labelZh || o.value);
      var labelEn = String(o.labelEn || o.labelZh || o.value);
      var rosterName = parseRosterStoreScopeId(String(o.value));
      // 英文别名不进入筛选项
      if (
        isSuppressedRosterStoreAlias(labelZh) ||
        isSuppressedRosterStoreAlias(labelEn) ||
        (rosterName && isSuppressedRosterStoreAlias(rosterName))
      ) {
        return;
      }
      var display = canonicalRosterStoreDisplayName(labelZh);
      var key = normalizeStoreText(display);
      if (seen[key]) return;
      seen[key] = 1;
      out.push({
        value: String(o.value),
        labelZh: display,
        labelEn: isSuppressedRosterStoreAlias(labelEn) ? display : canonicalRosterStoreDisplayName(labelEn) || display,
      });
    });
    return out;
  }

  /**
   * 内嵌页写入门店筛选：同步 sessionStorage / meta，并通知父页走正式 writeScopeFilters。
   */
  function writeGlobalStoreFilter(storeId, storeLabel) {
    var id = String(storeId || "").trim();
    var label = String(storeLabel || "").trim();
    try {
      sessionStorage.setItem(STORE_KEY, id);
      var meta = readScopeMeta() || {};
      meta.storeId = id;
      meta.storeLabel = label;
      meta.storeLabelEn = label;
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (_) {
      /* ignore */
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: "menusifu:set-scope-store", storeId: id, storeLabel: label },
          "*",
        );
      }
    } catch (_) {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent("menusifu:scope-filter-change", {
        detail: { store: id, storeLabel: label },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("menusifu:scope-store-meta-updated", {
        detail: { storeId: id, storeLabel: label },
      }),
    );
  }

  function getRosterStoreMatchers(scope) {
    var matchers = [];
    if (!scope || scope.isAllStores) return matchers;
    if (scope.storeLabel) matchers.push(scope.storeLabel);
    if (scope.storeLabelEn) matchers.push(scope.storeLabelEn);
    if (scope.storeId) {
      var rosterName = parseRosterStoreScopeId(scope.storeId);
      if (rosterName) matchers.push(rosterName);
      collectAliasesForScope(scope).forEach(function (a) {
        matchers.push(a);
      });
      matchers.push(scope.storeId);
    } else {
      collectAliasesForScope(scope).forEach(function (a) {
        matchers.push(a);
      });
    }
    var seen = {};
    return matchers
      .map(normalizeStoreText)
      .filter(function (m) {
        if (!m || seen[m]) return false;
        seen[m] = 1;
        return true;
      });
  }

  function rosterStoreMatchesGlobalScope(rosterStoreName, scope) {
    var scoped = scope || readGlobalScopeFilter();
    if (scoped.isAllStores) return true;
    var empStore = normalizeStoreText(canonicalRosterStoreDisplayName(rosterStoreName));
    if (!empStore) return false;
    var matchers = getRosterStoreMatchers(scoped);
    // 已选门店但无法解析匹配名时，不放行全部员工
    if (matchers.length === 0) return false;
    // 优先精确匹配规范店名，避免不同门店被模糊包含误伤
    var labelCanon = normalizeStoreText(canonicalRosterStoreDisplayName(scoped.storeLabel || ""));
    if (labelCanon && empStore === labelCanon) return true;
    return matchers.some(function (m) {
      var cm = normalizeStoreText(canonicalRosterStoreDisplayName(m));
      if (empStore === m || empStore === cm) return true;
      // 仅当 matcher 足够长时才做包含匹配，避免短串误匹配
      if (m.length >= 4 && (empStore.indexOf(m) !== -1 || m.indexOf(empStore) !== -1)) return true;
      if (cm.length >= 4 && (empStore.indexOf(cm) !== -1 || cm.indexOf(empStore) !== -1)) return true;
      return false;
    });
  }

  function filterRosterByGlobalScope(list, scopeOverride) {
    var scoped = scopeOverride || readGlobalScopeFilter();
    if (!Array.isArray(list)) return [];
    if (scoped.isAllStores) return list;
    return list.filter(function (e) {
      return rosterStoreMatchesGlobalScope(e && e.store, scoped);
    });
  }

  /** 由门店下拉当前值构造筛选 scope（页内筛选以 UI 为准） */
  function scopeFromStoreSelection(storeId, storeLabel) {
    var id = String(storeId || "").trim();
    var label = String(storeLabel || "").trim();
    return {
      storeId: id,
      storeLabel: label,
      storeLabelEn: label,
      isAllStores: !id,
    };
  }

  function resolveDefaultRosterStore(stores, fallback) {
    var scoped = readGlobalScopeFilter();
    if (!Array.isArray(stores) || stores.length === 0) return fallback || "";
    if (scoped.isAllStores) return stores[0] || fallback || "";
    var hit = stores.find(function (s) {
      return rosterStoreMatchesGlobalScope(s, scoped);
    });
    return hit || stores[0] || fallback || "";
  }

  function bindGlobalScopeFilterListener(callback) {
    var refresh = function () {
      callback(readGlobalScopeFilter());
    };
    window.addEventListener("menusifu:scope-filter-change", refresh);
    window.addEventListener("menusifu:scope-perspective-change", refresh);
    window.addEventListener("menusifu:scope-store-meta-updated", refresh);
    window.addEventListener("storage", function (e) {
      if (e.key === STORE_KEY || e.key === META_KEY) refresh();
    });
    return readGlobalScopeFilter();
  }

  global.TipOutGlobalScopeFilter = {
    readGlobalScopeFilter: readGlobalScopeFilter,
    readScopeMeta: readScopeMeta,
    usesInPageStorePicker: usesInPageStorePicker,
    listScopedStoreOptions: listScopedStoreOptions,
    writeGlobalStoreFilter: writeGlobalStoreFilter,
    rosterStoreMatchesGlobalScope: rosterStoreMatchesGlobalScope,
    filterRosterByGlobalScope: filterRosterByGlobalScope,
    scopeFromStoreSelection: scopeFromStoreSelection,
    canonicalRosterStoreDisplayName: canonicalRosterStoreDisplayName,
    isSuppressedRosterStoreAlias: isSuppressedRosterStoreAlias,
    resolveDefaultRosterStore: resolveDefaultRosterStore,
    bindGlobalScopeFilterListener: bindGlobalScopeFilterListener,
  };
})(typeof window !== "undefined" ? window : global);
