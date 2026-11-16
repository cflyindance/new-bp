"use strict";
var KioskAdTargetPolicy = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/marketing-display/ad-target-policy.ts
  var ad_target_policy_exports = {};
  __export(ad_target_policy_exports, {
    assertSave: () => assertSave,
    canEditTarget: () => canEditTarget,
    history: () => history,
    markPublished: () => markPublished,
    prepareSave: () => prepareSave,
    preserveHistory: () => preserveHistory,
    sameTarget: () => sameTarget
  });
  function history(theme) {
    if (theme.publicationHistory === "published" || theme.hasEverPublished === true || theme.publishStatus === "published" || theme.lastPublishedAt || theme.firstPublishedAt || theme.publishedAt || theme.distributeTime && theme.distributeTime !== "--") return "published";
    return theme.publicationHistory === "never" && theme.publishStatus === "draft" ? "never" : "unknown";
  }
  function canEditTarget(theme) {
    return theme.publishStatus === "draft" && history(theme) === "never";
  }
  function sameTarget(theme, slot) {
    const old = theme.adSlot;
    return !!old && ["id", "productLine", "code", "version"].every((k) => old[k] === slot[k]) && JSON.stringify(theme.distributeChannels) === JSON.stringify([slot.productLine]) && JSON.stringify(theme.distributePositions) === JSON.stringify([slot.code]);
  }
  function preserveHistory(source, target) {
    target.publicationHistory = history(source);
    for (const k of ["hasEverPublished", "lastPublishedAt", "firstPublishedAt", "publishedAt"]) if (source[k] !== void 0) target[k] = source[k];
    if (target.publicationHistory === "published") target.hasEverPublished = true;
  }
  function markPublished(theme, now = (/* @__PURE__ */ new Date()).toISOString()) {
    theme.publicationHistory = "published";
    theme.hasEverPublished = true;
    theme.lastPublishedAt = now;
  }
  function assertSave(current, opened, slot) {
    if (!current) throw Error("\u5E7F\u544A\u5DF2\u88AB\u5220\u9664\uFF0C\u8BF7\u8FD4\u56DE\u5217\u8868\u5237\u65B0");
    if (canEditTarget(opened) && !canEditTarget(current)) throw Error("\u5E7F\u544A\u6295\u653E\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u8FD4\u56DE\u5217\u8868\u5237\u65B0\u540E\u91CD\u65B0\u7F16\u8F91");
    if (!sameTarget(current, slot) && !canEditTarget(current)) throw Error("\u5DF2\u6295\u653E\u6216\u5386\u53F2\u72B6\u6001\u4E0D\u660E\u786E\u7684\u5E7F\u544A\u4E0D\u80FD\u4FEE\u6539\u6E20\u9053\u4E0E\u4F4D\u7F6E\uFF0C\u8BF7\u590D\u5236\u5E7F\u544A");
  }
  function prepareSave(current, candidate) {
    assertSave(current, current, candidate.adSlot);
    const result = JSON.parse(JSON.stringify(candidate));
    preserveHistory(current, result);
    if (!sameTarget(current, result.adSlot)) {
      result.distributedStores = [];
      result.lastDistributePrefs = { ...result.lastDistributePrefs, stores: [], channels: [result.adSlot.productLine], positions: [result.adSlot.code] };
    }
    return result;
  }
  return __toCommonJS(ad_target_policy_exports);
})();
