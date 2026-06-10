/**
 * 营销中心 · 广告列表 localStorage（列表页与编辑页共用）
 */
(function (global) {
  var STORAGE_KEY = "bplant-marketing-ads:v1";
  var PRODUCT_LINES = ["eMenu", "Kiosk", "POS", "Paypad", "CDS", "叫号屏"];

  /** 系统默认广告定义（顺序即列表置顶顺序） */
  var SYSTEM_DEFAULT_AD_SPECS = [
    {
      id: "ad-default-order-popup-poster",
      name: "eMenu下单弹海报",
      kind: "order-popup",
      sceneDescSystem: "开启后，下单页展示海报或广告",
      productLines: ["eMenu"],
      toggleSeq: 671,
    },
    {
      id: "ad-default-start-order-poster",
      name: "eMenu开始点单操作后展示海报",
      kind: "start-order",
      sceneDescSystem: "开启后，开始点单操作后展示海报",
      productLines: ["eMenu"],
      toggleSeq: null,
    },
    {
      id: "ad-default-emenu-home-cover-poster",
      name: "eMenu首页封面图",
      kind: "emenu-home-cover",
      sceneDescSystem: "开启后，设置首页展示上传的广告而不是系统默认的广告",
      productLines: ["eMenu"],
      toggleSeq: null,
    },
    {
      id: "ad-default-menu-page-poster",
      name: "Kiosk菜单页海报",
      kind: "menu-page",
      sceneDescSystem: "开启后，设置菜单页面是否展示的弹框广告",
      productLines: ["Kiosk"],
      toggleSeq: null,
    },
    {
      id: "ad-default-home-cover-poster",
      name: "Kiosk首页封面图",
      kind: "home-cover",
      sceneDescSystem: "开启后，设置首页展示上传的广告而不是系统默认的广告",
      productLines: ["Kiosk"],
      toggleSeq: null,
    },
    {
      id: "ad-default-cds-home-cover",
      name: "CDS封面图",
      kind: "start-order",
      sceneDescSystem: "开启后，设置首页展示上传的广告而不是系统默认的广告",
      productLines: ["CDS"],
      toggleSeq: null,
    },
    {
      id: "ad-default-queue-display-home-cover",
      name: "叫号屏封面图",
      kind: "start-order",
      sceneDescSystem: "开启后，设置首页展示上传的广告而不是系统默认的广告",
      productLines: ["叫号屏"],
      toggleSeq: null,
    },
  ];

  function isMixedMediaKind(kind) {
    return kind === "start-order" || kind === "menu-page" || kind === "emenu-home-cover";
  }

  function isHomeCoverKind(kind) {
    return kind === "home-cover";
  }

  function emptyHomeCover() {
    return { portrait: null, landscape: null };
  }

  function normalizeCoverImage(img) {
    if (!img || typeof img !== "object" || !img.imageUrl) return null;
    return {
      imageUrl: img.imageUrl,
      fileName: typeof img.fileName === "string" ? img.fileName : "",
      width: typeof img.width === "number" ? img.width : 0,
      height: typeof img.height === "number" ? img.height : 0,
      updatedAt: img.updatedAt || formatNow(),
    };
  }

  function normalizeHomeCover(cover) {
    if (!cover || typeof cover !== "object") return emptyHomeCover();
    return {
      portrait: normalizeCoverImage(cover.portrait),
      landscape: normalizeCoverImage(cover.landscape),
    };
  }

  var SYSTEM_DEFAULT_AD_SPEC_BY_ID = {};
  SYSTEM_DEFAULT_AD_SPECS.forEach(function (spec) {
    SYSTEM_DEFAULT_AD_SPEC_BY_ID[spec.id] = spec;
  });

  var DEFAULT_AD_ID = SYSTEM_DEFAULT_AD_SPECS[0].id;
  var DEFAULT_AD_NAME = SYSTEM_DEFAULT_AD_SPECS[0].name;
  var DEFAULT_AD_SCENE_DESC_SYSTEM = SYSTEM_DEFAULT_AD_SPECS[0].sceneDescSystem;

  /** 与设置滑层 module-settings-toggle-ui 一致 */
  var SEQ_SHOW_POSTER_BUTTON = 649;
  var SEQ_ORDER_POPUP_POSTER = 671;
  var MODULE_TOGGLE_SEQ_ON_BY_DEFAULT = true;

  function toggleStorageKey(seq) {
    return "bplant-module-setting-toggle:" + seq;
  }

  function systemAdEnabledStorageKey(adId) {
    return "bplant-marketing-system-ad-enabled:" + adId;
  }

  function readModuleToggle(seq) {
    try {
      var raw = global.localStorage.getItem(toggleStorageKey(seq));
      if (raw === null) return MODULE_TOGGLE_SEQ_ON_BY_DEFAULT;
      return raw === "1";
    } catch (e) {
      return MODULE_TOGGLE_SEQ_ON_BY_DEFAULT;
    }
  }

  function writeModuleToggle(seq, on) {
    try {
      global.localStorage.setItem(toggleStorageKey(seq), on ? "1" : "0");
    } catch (e2) {
      /* ignore */
    }
  }

  function readSystemAdEnabledFlag(adId) {
    try {
      var raw = global.localStorage.getItem(systemAdEnabledStorageKey(adId));
      if (raw === null) return MODULE_TOGGLE_SEQ_ON_BY_DEFAULT;
      return raw === "1";
    } catch (e) {
      return MODULE_TOGGLE_SEQ_ON_BY_DEFAULT;
    }
  }

  function writeSystemAdEnabledFlag(adId, on) {
    try {
      global.localStorage.setItem(systemAdEnabledStorageKey(adId), on ? "1" : "0");
    } catch (e2) {
      /* ignore */
    }
  }

  function statusFromEnabled(on) {
    return on ? "已开启" : "已关闭";
  }

  function getSystemAdSpec(adId) {
    return SYSTEM_DEFAULT_AD_SPEC_BY_ID[adId] || null;
  }

  function isSystemDefaultAd(item) {
    return !!(item && item.locked === true && getSystemAdSpec(item.id));
  }

  function readSystemAdEnabled(adId) {
    var spec = getSystemAdSpec(adId);
    if (!spec) return false;
    if (spec.toggleSeq) return readModuleToggle(spec.toggleSeq);
    return readSystemAdEnabledFlag(adId);
  }

  function setSystemAdEnabled(adId, on) {
    var spec = getSystemAdSpec(adId);
    if (!spec) return;
    if (spec.toggleSeq) writeModuleToggle(spec.toggleSeq, on);
    else writeSystemAdEnabledFlag(adId, on);
    updateSystemAd(adId, { status: statusFromEnabled(on) });
  }

  function formatNow() {
    return new Date().toLocaleString("zh-CN", { hour12: false });
  }

  function normalizeSceneDescExtra(extra) {
    return typeof extra === "string" ? extra.trim() : "";
  }

  function getSceneDescSystem(item) {
    var spec = item && getSystemAdSpec(item.id);
    return spec ? spec.sceneDescSystem : "";
  }

  function formatSceneDescDisplay(item) {
    if (!isSystemDefaultAd(item)) return "";
    var system = getSceneDescSystem(item);
    var extra = normalizeSceneDescExtra(item.sceneDescExtra);
    if (!extra) return system;
    return system + extra;
  }

  function normalizePosterButtonLabels(labels) {
    if (!labels || typeof labels !== "object") return { zh: "", en: "" };
    return {
      zh: typeof labels.zh === "string" ? labels.zh : "",
      en: typeof labels.en === "string" ? labels.en : "",
    };
  }

  function createSystemDefaultAd(spec) {
    var enabled = spec.toggleSeq
      ? readModuleToggle(spec.toggleSeq)
      : readSystemAdEnabledFlag(spec.id);
    var base = {
      id: spec.id,
      name: spec.name,
      type: "弹框广告",
      status: statusFromEnabled(enabled),
      updatedAt: formatNow(),
      productLines: spec.productLines.slice(),
      locked: true,
      sceneDescExtra: "",
    };
    if (spec.kind === "order-popup") {
      base.poster = null;
      base.posterButtonLabels = { zh: "", en: "" };
    }
    if (isMixedMediaKind(spec.kind)) {
      base.mediaItems = [];
    }
    if (isHomeCoverKind(spec.kind)) {
      base.homeCover = emptyHomeCover();
    }
    return base;
  }

  function normalizeMediaItems(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter(function (it) {
        return (
          it &&
          (it.kind === "image" || it.kind === "video") &&
          typeof it.dataUrl === "string" &&
          it.dataUrl
        );
      })
      .map(function (it) {
        return {
          id: it.id || "media-" + Date.now(),
          kind: it.kind,
          dataUrl: it.dataUrl,
          fileName: typeof it.fileName === "string" ? it.fileName : "",
          width: typeof it.width === "number" ? it.width : 0,
          height: typeof it.height === "number" ? it.height : 0,
          updatedAt: it.updatedAt || formatNow(),
        };
      });
  }

  function normalizeSystemDefaultAd(existing, spec) {
    var def = createSystemDefaultAd(spec);
    var enabled = spec.toggleSeq
      ? readModuleToggle(spec.toggleSeq)
      : readSystemAdEnabledFlag(spec.id);
    var normalized = {
      id: spec.id,
      name: spec.name,
      type: existing.type || def.type,
      status: statusFromEnabled(enabled),
      updatedAt: existing.updatedAt || def.updatedAt,
      productLines: spec.productLines.slice(),
      locked: true,
      sceneDescExtra: normalizeSceneDescExtra(existing.sceneDescExtra),
    };
    if (spec.kind === "order-popup") {
      normalized.poster = existing.poster || null;
      normalized.posterButtonLabels = normalizePosterButtonLabels(existing.posterButtonLabels);
    }
    if (isMixedMediaKind(spec.kind)) {
      normalized.mediaItems = normalizeMediaItems(existing.mediaItems);
    }
    if (isHomeCoverKind(spec.kind)) {
      normalized.homeCover = normalizeHomeCover(existing.homeCover);
    }
    return normalized;
  }

  function ensureSystemDefaultAds(list, persist) {
    var items = list.slice();
    var changed = false;

    SYSTEM_DEFAULT_AD_SPECS.slice().reverse().forEach(function (spec) {
      var idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === spec.id) {
          idx = i;
          break;
        }
      }
      if (idx < 0) {
        items.unshift(createSystemDefaultAd(spec));
        changed = true;
        return;
      }
      var existing = items[idx];
      var normalized = normalizeSystemDefaultAd(existing, spec);
      if (
        existing.name !== normalized.name ||
        existing.locked !== true ||
        existing.status !== normalized.status ||
        JSON.stringify(existing.productLines) !== JSON.stringify(normalized.productLines) ||
        normalizeSceneDescExtra(existing.sceneDescExtra) !== normalized.sceneDescExtra
      ) {
        changed = true;
      }
      if (spec.kind === "order-popup") {
        if (JSON.stringify(existing.posterButtonLabels) !== JSON.stringify(normalized.posterButtonLabels)) {
          changed = true;
        }
      }
      items.splice(idx, 1);
      items.unshift(normalized);
      if (idx !== 0) changed = true;
    });

    if (persist && changed) {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
    return items;
  }

  function readAds() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      var list = Array.isArray(parsed) ? parsed : [];
      return ensureSystemDefaultAds(list, true);
    } catch (e) {
      return ensureSystemDefaultAds([], true);
    }
  }

  function writeAds(items) {
    var normalized = ensureSystemDefaultAds(items, false);
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  function updateSystemAd(adId, patch) {
    var items = readAds();
    var idx = -1;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === adId) {
        idx = i;
        break;
      }
    }
    if (idx < 0) return null;
    items[idx] = Object.assign({}, items[idx], patch, {
      updatedAt: formatNow(),
    });
    writeAds(items);
    return items[idx];
  }

  function updateDefaultAd(patch) {
    return updateSystemAd(DEFAULT_AD_ID, patch);
  }

  function readOrderPopupEnabled() {
    return readSystemAdEnabled(DEFAULT_AD_ID);
  }

  function setOrderPopupEnabled(on) {
    setSystemAdEnabled(DEFAULT_AD_ID, on);
  }

  function orderPopupStatusFromToggle(on) {
    return statusFromEnabled(on);
  }

  /** @deprecated 使用 isSystemDefaultAd */
  function isDefaultAd(item) {
    return isSystemDefaultAd(item);
  }

  /** @deprecated 使用 ensureSystemDefaultAds */
  function ensureDefaultAd(list, persist) {
    return ensureSystemDefaultAds(list, persist);
  }

  function createDefaultAd() {
    return createSystemDefaultAd(SYSTEM_DEFAULT_AD_SPECS[0]);
  }

  global.MarketingAdsStore = {
    STORAGE_KEY: STORAGE_KEY,
    SYSTEM_DEFAULT_AD_SPECS: SYSTEM_DEFAULT_AD_SPECS,
    DEFAULT_AD_ID: DEFAULT_AD_ID,
    DEFAULT_AD_NAME: DEFAULT_AD_NAME,
    DEFAULT_AD_SCENE_DESC_SYSTEM: DEFAULT_AD_SCENE_DESC_SYSTEM,
    PRODUCT_LINES: PRODUCT_LINES,
    SEQ_SHOW_POSTER_BUTTON: SEQ_SHOW_POSTER_BUTTON,
    SEQ_ORDER_POPUP_POSTER: SEQ_ORDER_POPUP_POSTER,
    formatNow: formatNow,
    getSystemAdSpec: getSystemAdSpec,
    isMixedMediaKind: isMixedMediaKind,
    isHomeCoverKind: isHomeCoverKind,
    normalizeHomeCover: normalizeHomeCover,
    emptyHomeCover: emptyHomeCover,
    isSystemDefaultAd: isSystemDefaultAd,
    isDefaultAd: isDefaultAd,
    createDefaultAd: createDefaultAd,
    createSystemDefaultAd: createSystemDefaultAd,
    ensureSystemDefaultAds: ensureSystemDefaultAds,
    ensureDefaultAd: ensureDefaultAd,
    readAds: readAds,
    writeAds: writeAds,
    updateSystemAd: updateSystemAd,
    updateDefaultAd: updateDefaultAd,
    normalizePosterButtonLabels: normalizePosterButtonLabels,
    normalizeSceneDescExtra: normalizeSceneDescExtra,
    normalizeMediaItems: normalizeMediaItems,
    getSceneDescSystem: getSceneDescSystem,
    formatSceneDescDisplay: formatSceneDescDisplay,
    readModuleToggle: readModuleToggle,
    writeModuleToggle: writeModuleToggle,
    readSystemAdEnabled: readSystemAdEnabled,
    setSystemAdEnabled: setSystemAdEnabled,
    readOrderPopupEnabled: readOrderPopupEnabled,
    setOrderPopupEnabled: setOrderPopupEnabled,
    orderPopupStatusFromToggle: orderPopupStatusFromToggle,
    statusFromEnabled: statusFromEnabled,
  };
})(window);
