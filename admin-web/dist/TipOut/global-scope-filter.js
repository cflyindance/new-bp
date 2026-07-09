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

  /** 演示：M 平台门店 ID / 名称 → TipOut 员工主档门店名 */
  var ROSTER_STORE_ALIASES = {
    M00000001: ["上海陆家嘴店", "张记火锅", "Golden Dragon Chinese Kitchen - Dallas, TX 75231"],
    "shanghai-ljz": ["上海陆家嘴店", "Golden Dragon Chinese Kitchen - Dallas, TX 75231"],
    M00000002: ["广州天河店", "Sakura Sushi & Ramen House - Dallas, TX 75247"],
    "guangzhou-tzh": ["广州天河店", "Sakura Sushi & Ramen House - Dallas, TX 75247"],
    M00000004: ["Nai Cha", "nai cha", "奶茶"],
    "flagship-nyc": ["Nai Cha"],
    "branch-la": ["Downtown Branch", "Airport Kiosk"],
  };

  function normalizeStoreText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function readGlobalScopeFilter() {
    var storeId = "";
    var storeLabel = "";
    try {
      storeId = sessionStorage.getItem(STORE_KEY) || "";
      var raw = localStorage.getItem(META_KEY);
      if (raw) {
        var meta = JSON.parse(raw);
        if (meta && typeof meta === "object") {
          storeLabel = String(meta.storeLabel || meta.storeLabelEn || "").trim();
          if (!storeId && meta.storeId) storeId = String(meta.storeId).trim();
        }
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

  function getRosterStoreMatchers(scope) {
    var matchers = [];
    if (!scope || scope.isAllStores) return matchers;
    if (scope.storeLabel) matchers.push(scope.storeLabel);
    if (scope.storeId) {
      var rosterName = parseRosterStoreScopeId(scope.storeId);
      if (rosterName) matchers.push(rosterName);
      var aliases = ROSTER_STORE_ALIASES[scope.storeId] || [];
      aliases.forEach(function (a) {
        matchers.push(a);
      });
      matchers.push(scope.storeId);
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
    var empStore = normalizeStoreText(rosterStoreName);
    if (!empStore) return false;
    var matchers = getRosterStoreMatchers(scoped);
    if (matchers.length === 0) return true;
    return matchers.some(function (m) {
      return empStore === m || empStore.indexOf(m) !== -1 || m.indexOf(empStore) !== -1;
    });
  }

  function filterRosterByGlobalScope(list) {
    var scoped = readGlobalScopeFilter();
    if (!Array.isArray(list)) return [];
    if (scoped.isAllStores) return list;
    return list.filter(function (e) {
      return rosterStoreMatchesGlobalScope(e && e.store, scoped);
    });
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
    rosterStoreMatchesGlobalScope: rosterStoreMatchesGlobalScope,
    filterRosterByGlobalScope: filterRosterByGlobalScope,
    resolveDefaultRosterStore: resolveDefaultRosterStore,
    bindGlobalScopeFilterListener: bindGlobalScopeFilterListener,
  };
})(typeof window !== "undefined" ? window : global);
