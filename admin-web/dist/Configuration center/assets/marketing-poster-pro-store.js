/**
 * 营销中心 · 海报 Pro 编辑器（localStorage 原型）
 * 品牌多门店视角下按当前所选门店分桶存储。
 */
(function (global) {
  var STORAGE_KEY_PREFIX = "bplant-marketing-poster-pro:v1";
  var LEGACY_STORAGE_KEY = "bplant-marketing-poster-pro:v1";
  var CANVAS_WIDTH = 540;
  var CANVAS_HEIGHT = 960;

  var MOCK_DISHES = [
    { id: "dish-matcha", name: "抹茶拿铁" },
    { id: "dish-jasmine", name: "茉莉奶绿" },
    { id: "dish-milk-tea", name: "经典奶茶" },
    { id: "dish-media", name: "- 媒体 -" },
  ];

  var MOCK_GIFT_ACTIVITIES = [
    { id: "gc-spring", name: "春季礼品卡促销" },
    { id: "gc-member", name: "会员专享礼品卡" },
    { id: "gc-holiday", name: "节日限定礼品卡" },
  ];

  function usesInPageStorePicker() {
    try {
      return !!(
        global.TipOutGlobalScopeFilter &&
        typeof TipOutGlobalScopeFilter.usesInPageStorePicker === "function" &&
        TipOutGlobalScopeFilter.usesInPageStorePicker()
      );
    } catch (_) {
      return false;
    }
  }

  function getActiveStoreId() {
    try {
      if (!usesInPageStorePicker()) return "";
      if (!global.TipOutGlobalScopeFilter || typeof TipOutGlobalScopeFilter.readGlobalScopeFilter !== "function") {
        return "";
      }
      var scoped = TipOutGlobalScopeFilter.readGlobalScopeFilter();
      return scoped && scoped.storeId ? String(scoped.storeId).trim() : "";
    } catch (_) {
      return "";
    }
  }

  function storageKeyForStore(storeId) {
    return STORAGE_KEY_PREFIX + ":store:" + encodeURIComponent(String(storeId || "").trim());
  }

  function resolveStorageKey() {
    if (!usesInPageStorePicker()) return LEGACY_STORAGE_KEY;
    var storeId = getActiveStoreId();
    if (!storeId) return STORAGE_KEY_PREFIX + ":store:__none__";
    return storageKeyForStore(storeId);
  }

  function migrateLegacyIfNeeded(key) {
    if (!key || key === LEGACY_STORAGE_KEY || key.indexOf(":store:__none__") >= 0) return;
    try {
      if (global.localStorage.getItem(key)) return;
      var legacy = global.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacy) return;
      var parsed = JSON.parse(legacy);
      if (!parsed || typeof parsed !== "object") return;
      global.localStorage.setItem(key, legacy);
      global.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function requiresStoreSelection() {
    return usesInPageStorePicker() && !getActiveStoreId();
  }

  function formatNow() {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  }

  function defaultAddToCartImage() {
    return (
      "data:image/svg+xml," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">' +
          '<circle cx="20" cy="20" r="20" fill="#F5C518"/>' +
          '<path d="M20 11v18M11 20h18" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>' +
          "</svg>",
      )
    );
  }

  function createDefaultState() {
    return {
      active: true,
      aspectLabel: "9 / 16",
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      background: null,
      components: [],
      updatedAt: formatNow(),
    };
  }

  function normalizeComponent(raw) {
    if (!raw || !raw.type) return null;
    var base = {
      id: raw.id || "cmp-" + Date.now(),
      type: raw.type,
      x: Number(raw.x) || 0,
      y: Number(raw.y) || 0,
      width: Number(raw.width) || 40,
      height: Number(raw.height) || 40,
    };
    if (raw.type === "add-to-cart") {
      base.imageUrl = raw.imageUrl || defaultAddToCartImage();
      base.dishId = raw.dishId || "dish-media";
    }
    if (raw.type === "gift-card") {
      base.giftCardActivityId = raw.giftCardActivityId || "gc-spring";
      base.label = raw.label || "购买礼品卡";
    }
    if (raw.type === "cart") {
      base.imageUrl = raw.imageUrl || "";
      base.demoCount = typeof raw.demoCount === "number" ? raw.demoCount : 3;
    }
    if (raw.type === "skip") {
      base.label = raw.label || "继续点单";
    }
    return base;
  }

  function parseState(raw) {
    if (!raw) return createDefaultState();
    try {
      var parsed = JSON.parse(raw);
      return {
        active: parsed.active !== false,
        aspectLabel: parsed.aspectLabel || "9 / 16",
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        background: parsed.background || null,
        components: Array.isArray(parsed.components)
          ? parsed.components.map(normalizeComponent).filter(Boolean)
          : [],
        updatedAt: parsed.updatedAt || formatNow(),
      };
    } catch (e) {
      return createDefaultState();
    }
  }

  function readState() {
    if (requiresStoreSelection()) return createDefaultState();
    try {
      var key = resolveStorageKey();
      migrateLegacyIfNeeded(key);
      return parseState(global.localStorage.getItem(key));
    } catch (e) {
      return createDefaultState();
    }
  }

  function writeState(state) {
    if (requiresStoreSelection()) return state;
    var key = resolveStorageKey();
    migrateLegacyIfNeeded(key);
    var next = Object.assign({}, state, {
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      updatedAt: formatNow(),
    });
    global.localStorage.setItem(key, JSON.stringify(next));
    return next;
  }

  global.MarketingPosterProStore = {
    STORAGE_KEY: LEGACY_STORAGE_KEY,
    CANVAS_WIDTH: CANVAS_WIDTH,
    CANVAS_HEIGHT: CANVAS_HEIGHT,
    MOCK_DISHES: MOCK_DISHES,
    MOCK_GIFT_ACTIVITIES: MOCK_GIFT_ACTIVITIES,
    defaultAddToCartImage: defaultAddToCartImage,
    readState: readState,
    writeState: writeState,
    normalizeComponent: normalizeComponent,
    formatNow: formatNow,
    usesInPageStorePicker: usesInPageStorePicker,
    getActiveStoreId: getActiveStoreId,
    requiresStoreSelection: requiresStoreSelection,
  };
})(window);
