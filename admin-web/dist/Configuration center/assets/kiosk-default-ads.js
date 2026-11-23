"use strict";
var KioskDefaultAds = (() => {
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

  // src/marketing-display/default-ads.ts
  var default_ads_exports = {};
  __export(default_ads_exports, {
    conflicts: () => conflicts,
    enable: () => enable,
    isDefault: () => isDefault,
    sameScope: () => sameScope,
    selectPlayback: () => selectPlayback,
    stores: () => stores,
    validateDefault: () => validateDefault
  });
  var isDefault = (ad) => ad?.adPurpose === "default";
  function stores(ad) {
    const source = Array.isArray(ad.defaultStoreIds) && isDefault(ad) ? ad.defaultStoreIds : (ad.distributedStores || []).map((s) => s.mid);
    return [...new Set(source.map(String))];
  }
  function sameScope(a, b) {
    return !!a.interactionScope && a.interactionScope === b.interactionScope && !!a.adSlot?.id && a.adSlot.id === b.adSlot?.id && a.adSlot.productLine === b.adSlot?.productLine && a.adSlot.code === b.adSlot?.code;
  }
  function validateDefault(ad) {
    if (!isDefault(ad) || !ad.interactionScope || !ad.adSlot?.id) throw Error("\u9ED8\u8BA4\u5E7F\u544A\u7F3A\u5C11\u54C1\u724C\u3001\u6E20\u9053\u6216\u4F4D\u7F6E");
    const items = Object.values(ad.adSlotAssets || {}).flat();
    if (!items.length) throw Error("\u8BF7\u81F3\u5C11\u914D\u7F6E\u4E00\u5957\u89C4\u683C\u7684\u5E7F\u544A\u7D20\u6750");
    if (items.some((item) => !["image", "video"].includes(item.type || "image") || item.clickAction && item.clickAction.type !== "none")) throw Error("\u9ED8\u8BA4\u5E7F\u544A\u4EC5\u652F\u6301\u4E0D\u8DF3\u8F6C\u7684\u56FE\u7247\u6216\u89C6\u9891");
  }
  function conflicts(list, candidate, ids) {
    return list.filter((ad) => ad.id !== candidate.id && isDefault(ad) && ad.publishStatus === "published" && sameScope(ad, candidate)).map((ad) => ({ ad, storeIds: stores(ad).filter((id) => ids.includes(id)) })).filter((row) => row.storeIds.length);
  }
  function enable(list, id, selected, scope, now = (/* @__PURE__ */ new Date()).toISOString()) {
    const result = structuredClone(list), candidate = result.find((ad) => ad.id === id);
    if (!candidate || candidate.interactionScope !== scope) throw Error("\u5E7F\u544A\u4E0D\u5B58\u5728\u6216\u54C1\u724C\u5DF2\u53D8\u5316");
    validateDefault(candidate);
    const ids = [...new Set(selected.map((s) => String(s.mid || "")).filter(Boolean))];
    if (!ids.length || ids.length !== selected.length) throw Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u5BB6\u6709\u6548\u95E8\u5E97\uFF0C\u4E14\u4E0D\u80FD\u91CD\u590D");
    for (const row of conflicts(result, candidate, ids)) {
      row.ad.defaultStoreIds = stores(row.ad).filter((mid) => !ids.includes(mid));
      row.ad.distributedStores = (row.ad.distributedStores || []).filter((s) => row.ad.defaultStoreIds.includes(String(s.mid)));
      if (row.ad.lastDistributePrefs) row.ad.lastDistributePrefs.stores = row.ad.distributedStores.map((s) => ({ name: s.name, mid: s.mid }));
      if (!row.ad.defaultStoreIds.length) row.ad.publishStatus = "draft";
    }
    candidate.defaultStoreIds = ids;
    candidate.distributedStores = selected.map((s) => ({ name: s.name, mid: String(s.mid), channelStatuses: [{ channel: candidate.adSlot.productLine }] }));
    candidate.distributeChannels = [candidate.adSlot.productLine];
    candidate.distributePositions = [candidate.adSlot.code];
    candidate.lastDistributePrefs = { stores: selected, channels: candidate.distributeChannels, positions: candidate.distributePositions };
    candidate.effectTime = "--";
    delete candidate.effectStartUtc;
    delete candidate.effectEndUtc;
    candidate.distributeTime = "--";
    candidate.publishStatus = "published";
    candidate.publicationHistory = "published";
    candidate.hasEverPublished = true;
    candidate.lastPublishedAt = now;
    return result;
  }
  function selectPlayback(list, context) {
    const target = { interactionScope: context.scope, adSlot: context.slot };
    const matches = (ad) => sameScope(ad, target) && stores(ad).includes(context.storeId);
    const playable = (ad) => context.ready(ad) && context.usable(ad);
    const campaign = list.find((ad) => !isDefault(ad) && ad.publishStatus === "published" && matches(ad) && context.campaignActive(ad, context.now) && playable(ad));
    if (campaign) return { kind: "campaign", ad: campaign };
    const defaults = list.filter((ad) => isDefault(ad) && ad.publishStatus === "published" && matches(ad));
    const fallback = defaults.find(playable);
    if (fallback) return { kind: "default", ad: fallback };
    const cached = context.cachedDefault;
    if (defaults.length && cached && isDefault(cached) && matches(cached) && playable(cached)) return { kind: "default", ad: cached };
    return { kind: context.fallback, ad: null };
  }
  return __toCommonJS(default_ads_exports);
})();
