"use strict";
var KioskAdActivities = (() => {
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

  // src/marketing-display/ad-activity-actions.ts
  var ad_activity_actions_exports = {};
  __export(ad_activity_actions_exports, {
    CATALOG_PREFIX: () => CATALOG_PREFIX,
    EVENT_PREFIX: () => EVENT_PREFIX,
    NONE: () => NONE,
    actionLabel: () => actionLabel,
    activityState: () => activityState,
    canConfigureActions: () => canConfigureActions,
    capabilities: () => capabilities,
    externalOpenModes: () => externalOpenModes,
    filterActivities: () => filterActivities,
    getActivity: () => getActivity,
    getContext: () => getContext,
    hasActions: () => hasActions,
    listActivities: () => listActivities,
    localCatalogProvider: () => localCatalogProvider,
    normalizeAction: () => normalizeAction,
    recordEvent: () => recordEvent,
    resolveThemeAssets: () => resolveThemeAssets,
    safeExternalUrl: () => safeExternalUrl,
    setContext: () => setContext,
    setContextResolver: () => setContextResolver,
    validateAction: () => validateAction,
    validateThemeActions: () => validateThemeActions
  });
  var CATALOG_PREFIX = "menusifu:ad-activity-catalog:v1:";
  var EVENT_PREFIX = "menusifu:ad-activity-events:v1:";
  var NONE = { type: "none" };
  function canConfigureActions(pageAccess, snapshot, demo = false) {
    if (pageAccess !== void 0) return pageAccess === "edit";
    if (snapshot) return snapshot.enabled === true && snapshot.display !== false && snapshot.l4EditMode === "editable";
    return demo;
  }
  var CAPABILITIES = { Kiosk: ["screensaver", "home"], eMenu: ["screensaver", "home"] };
  function capabilities(slot, context2) {
    if (slot && context2?.supportedActions) {
      try {
        const supported = context2.supportedActions(slot);
        return Array.isArray(supported) ? ["none", ...supported.filter((value, index, all) => value !== "none" && ["activity", "external"].includes(value) && all.indexOf(value) === index)] : ["none"];
      } catch {
        return ["none"];
      }
    }
    return slot && CAPABILITIES[slot.productLine]?.includes(slot.code) ? ["none", "activity", "external"] : ["none"];
  }
  function externalOpenModes(slot, context2) {
    try {
      return context2.externalModes?.(slot)?.includes("newTab") ? ["iframe", "newTab"] : ["iframe"];
    } catch {
      return ["iframe"];
    }
  }
  function normalizeAction(raw) {
    if (raw === void 0 || raw === null) return { type: "none" };
    if (typeof raw !== "object") throw Error("\u70B9\u51FB\u884C\u4E3A\u683C\u5F0F\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u914D\u7F6E");
    const a = raw;
    if (a.type === "none") return { type: "none" };
    const scope = typeof a.scope === "string" ? a.scope.trim() : "";
    if (!scope) throw Error("\u8BF7\u9009\u62E9\u660E\u786E\u54C1\u724C\u540E\u914D\u7F6E\u6D3B\u52A8");
    if (a.type === "activity" && ["promotion", "points", "coupon"].includes(String(a.activityType)) && typeof a.activityId === "string" && a.activityId.trim()) return { type: "activity", scope, activityType: a.activityType, activityId: a.activityId.trim() };
    if (a.type === "external" && a.openMode !== void 0 && !["iframe", "newTab"].includes(String(a.openMode))) throw Error("\u5916\u90E8\u6D3B\u52A8\u6253\u5F00\u65B9\u5F0F\u65E0\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
    if (a.type === "external" && typeof a.title === "string" && a.title.trim() && a.title.trim().length <= 80 && typeof a.url === "string") return { type: "external", scope, title: a.title.trim(), url: a.url.trim(), openMode: a.openMode === "newTab" ? "newTab" : "iframe" };
    throw Error("\u8BF7\u5B8C\u6574\u586B\u5199\u70B9\u51FB\u884C\u4E3A\u4E0E\u6D3B\u52A8\u4FE1\u606F");
  }
  function safeExternalUrl(value, origins) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw Error("\u8BF7\u8F93\u5165\u5B8C\u6574\u7684 HTTPS \u6D3B\u52A8\u94FE\u63A5");
    }
    if (url.protocol !== "https:" || url.username || url.password) throw Error("\u4EC5\u652F\u6301\u4E0D\u542B\u8D26\u53F7\u5BC6\u7801\u7684 HTTPS \u6D3B\u52A8\u94FE\u63A5");
    if (!origins.some((origin) => {
      try {
        return new URL(origin).origin === origin && origin === url.origin;
      } catch {
        return false;
      }
    })) throw Error("\u8BE5\u6D3B\u52A8\u57DF\u540D\u5C1A\u672A\u767B\u8BB0\uFF0C\u8BF7\u8054\u7CFB\u5E73\u53F0\u7BA1\u7406\u5458");
    return url.href;
  }
  function assertRecord(record, scope, type, id) {
    if (!record || record.scope !== scope || record.type !== type || typeof record.id !== "string" || !record.id.trim() || id !== void 0 && record.id !== id || typeof record.name !== "string" || !record.name.trim() || !Array.isArray(record.storeIds) || record.storeIds.some((store) => typeof store !== "string" || !store)) throw Error("\u6D3B\u52A8\u5F52\u5C5E\u6216\u6570\u636E\u5F02\u5E38\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    for (const key of ["startAt", "endAt"]) if (record[key] !== void 0 && !Number.isFinite(record[key])) throw Error("\u6D3B\u52A8\u65F6\u95F4\u4FE1\u606F\u65E0\u6548");
    if (record.startAt !== void 0 && record.endAt !== void 0 && record.endAt <= record.startAt) throw Error("\u6D3B\u52A8\u6709\u6548\u671F\u65E0\u6548");
  }
  function localCatalogProvider(storage) {
    function read(scope) {
      const raw = storage.getItem(CATALOG_PREFIX + encodeURIComponent(scope));
      if (!raw) return [];
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        throw Error("\u6D3B\u52A8\u76EE\u5F55\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u91CD\u8BD5");
      }
      if (value?.schema !== 1 || value.scope !== scope || !Array.isArray(value.activities)) throw Error("\u6D3B\u52A8\u76EE\u5F55\u5F52\u5C5E\u6216\u7248\u672C\u65E0\u6548");
      return value.activities;
    }
    return { async list(scope, type) {
      return read(scope).filter((a) => a.type === type).map((a) => {
        assertRecord(a, scope, type);
        return structuredClone(a);
      });
    }, async get(scope, type, id) {
      const a = read(scope).find((a2) => a2.id === id && a2.type === type);
      if (a) assertRecord(a, scope, type, id);
      return a ? structuredClone(a) : null;
    } };
  }
  async function getActivity(context2, type, id) {
    if (!context2.scope) throw Error("\u54C1\u724C\u4E0A\u4E0B\u6587\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4ECE\u8425\u9500\u5E7F\u544A\u5165\u53E3\u8FDB\u5165");
    const record = await context2.provider.get(context2.scope, type, id);
    if (!record) throw Error("\u6D3B\u52A8\u5DF2\u5220\u9664\u6216\u4E0D\u53EF\u8BBF\u95EE");
    assertRecord(record, context2.scope, type, id);
    return record;
  }
  async function listActivities(context2, type) {
    if (!context2.scope) throw Error("\u54C1\u724C\u4E0A\u4E0B\u6587\u4E0D\u53EF\u7528\uFF0C\u8BF7\u4ECE\u8425\u9500\u5E7F\u544A\u5165\u53E3\u8FDB\u5165");
    const rows = await context2.provider.list(context2.scope, type), ids = /* @__PURE__ */ new Set();
    if (!Array.isArray(rows)) throw Error("\u6D3B\u52A8\u5217\u8868\u683C\u5F0F\u65E0\u6548");
    for (const row of rows) {
      assertRecord(row, context2.scope, type);
      if (ids.has(row.id)) throw Error("\u6D3B\u52A8\u76EE\u5F55\u5B58\u5728\u91CD\u590D\u6807\u8BC6");
      ids.add(row.id);
    }
    return rows;
  }
  function filterActivities(rows, query, promotionType = "", status = "") {
    const normalized = query.trim().toLocaleLowerCase();
    return rows.filter((row) => (!promotionType || row.type === "promotion" && row.promotionType === promotionType) && row.name.toLocaleLowerCase().includes(normalized) && (!status || activityState(row) === status));
  }
  function activityState(record, now = Date.now()) {
    if (record.status !== "published") return record.status === "disabled" ? "\u5DF2\u505C\u7528" : "\u672A\u53D1\u5E03";
    if (record.endAt !== void 0 && now >= record.endAt) return "\u5DF2\u7ED3\u675F";
    return record.startAt !== void 0 && now < record.startAt ? "\u672A\u5F00\u59CB" : "\u8FDB\u884C\u4E2D";
  }
  async function validateAction(raw, slot, context2, options = {}) {
    const action = normalizeAction(raw);
    if (action.type === "none") return action;
    if (!capabilities(slot, context2).includes(action.type)) throw Error("\u8BE5\u6E20\u9053\u6216\u4F4D\u7F6E\u6682\u4E0D\u652F\u6301\u6B64\u70B9\u51FB\u884C\u4E3A\uFF0C\u8BF7\u6539\u4E3A\u4E0D\u8DF3\u8F6C");
    if (!context2.scope || action.scope !== context2.scope) throw Error("\u6D3B\u52A8\u6240\u5C5E\u54C1\u724C\u4E0E\u5F53\u524D\u54C1\u724C\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
    if (action.type === "external") {
      if (!externalOpenModes(slot, context2).includes(action.openMode ?? "iframe")) throw Error("\u8BE5\u6E20\u9053\u6216\u4F4D\u7F6E\u4E0D\u652F\u6301\u6B64\u6253\u5F00\u65B9\u5F0F\uFF0C\u8BF7\u9009\u62E9\u7EDF\u4E00H5\u5BB9\u5668");
      return { ...action, url: safeExternalUrl(action.url, context2.externalOrigins) };
    }
    const record = await getActivity(context2, action.activityType, action.activityId), now = options.now ?? Date.now(), state = activityState(record, now);
    if (record.status !== "published" || state === "\u5DF2\u7ED3\u675F" || options.runtime && state !== "\u8FDB\u884C\u4E2D") throw Error("\u6D3B\u52A8" + state + "\uFF0C\u8BF7\u66F4\u6362\u6D3B\u52A8");
    if (options.storeIds?.some((id) => record.storeIds.length && !record.storeIds.includes(id))) throw Error("\u6240\u9009\u95E8\u5E97\u4E0D\u5728\u6D3B\u52A8\u9002\u7528\u8303\u56F4\u5185\uFF0C\u8BF7\u8C03\u6574\u95E8\u5E97\u6216\u6D3B\u52A8");
    if (options.startAt !== void 0 && record.startAt !== void 0 && options.startAt < record.startAt || options.endAt !== void 0 && record.endAt !== void 0 && options.endAt > record.endAt) throw Error("\u5E7F\u544A\u751F\u6548\u65F6\u95F4\u8D85\u51FA\u6D3B\u52A8\u6709\u6548\u671F\uFF0C\u8BF7\u8C03\u6574\u6392\u671F");
    if (record.requiresBusinessCheck && !context2.provider.check) throw Error("\u6D3B\u52A8\u7684\u661F\u671F\u3001\u65F6\u6BB5\u53CA\u751F\u6548\u7C7B\u578B\u6821\u9A8C\u5C1A\u672A\u63A5\u5165");
    if (context2.provider.check) {
      const result = await context2.provider.check(record, options);
      if (!result?.available) throw Error(result?.reason || "\u6D3B\u52A8\u5F53\u524D\u4E0D\u53EF\u7528\u4E8E\u8BE5\u5E7F\u544A");
    }
    return action;
  }
  function actionLabel(raw) {
    try {
      const a = normalizeAction(raw);
      return a.type === "none" ? "\u4E0D\u8DF3\u8F6C" : a.type === "external" ? "\u5916\u90E8\u6D3B\u52A8 \xB7 " + a.title : a.activityType === "promotion" ? "\u4FC3\u9500\u6D3B\u52A8" : a.activityType === "coupon" ? "\u4F18\u60E0\u5238\u6D3B\u52A8" : "\u79EF\u5206\u5151\u6362\u6D3B\u52A8";
    } catch {
      return "\u70B9\u51FB\u884C\u4E3A\u5F85\u5B8C\u5584";
    }
  }
  function hasActions(theme) {
    return Object.values(theme.adSlotAssets ?? {}).some((list) => list.some((a) => normalizeAction(a.clickAction).type !== "none"));
  }
  async function validateThemeActions(theme, context2, phase = "content") {
    if (theme.interactionScope && theme.interactionScope !== context2.scope) throw Error("\u5E7F\u544A\u6D3B\u52A8\u6240\u5C5E\u54C1\u724C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u5E7F\u544A");
    if (!hasActions(theme)) return;
    if (!context2.canWrite) throw Error("\u6682\u65E0\u6D3B\u52A8\u5E7F\u544A\u7F16\u8F91\u6216\u53D1\u5E03\u6743\u9650");
    if (theme.interactionScope !== context2.scope) throw Error("\u5E7F\u544A\u6D3B\u52A8\u6240\u5C5E\u54C1\u724C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u5E7F\u544A");
    const prefs = theme.lastDistributePrefs ?? {}, start = Date.parse((prefs.startDate ?? "") + "T" + (prefs.startTime ?? "")), end = Date.parse((prefs.endDate ?? "") + "T" + (prefs.endTime ?? ""));
    for (const list of Object.values(theme.adSlotAssets ?? {})) for (const item of list) await validateAction(item.clickAction, theme.adSlot, context2, phase === "publish" ? { storeIds: (prefs.stores ?? []).map((s) => s.mid), startAt: Number.isFinite(start) ? start : void 0, endAt: Number.isFinite(end) ? end : void 0 } : {});
  }
  async function resolveThemeAssets(theme, context2, storeId, now = Date.now()) {
    if (theme.interactionScope && theme.interactionScope !== context2.scope) return { items: [], clear: true };
    const items = [];
    for (const list of Object.values(theme.adSlotAssets ?? {})) for (const item of list) {
      try {
        if (normalizeAction(item.clickAction).type !== "none" && theme.interactionScope !== context2.scope) continue;
        await validateAction(item.clickAction, theme.adSlot, context2, { runtime: true, storeIds: [storeId], now });
        items.push(item);
      } catch {
      }
    }
    return { items, clear: items.length === 0 };
  }
  function recordEvent(storage, context2, event, preview = false) {
    if (preview || !context2.scope) return;
    const key = EVENT_PREFIX + encodeURIComponent(context2.scope);
    try {
      const old = JSON.parse(storage.getItem(key) ?? "[]");
      storage.setItem(key, JSON.stringify([...(Array.isArray(old) ? old : []).slice(-499), { type: event.type, adId: event.adId, assetId: event.assetId, slotId: event.slotId, activityId: event.activityId, channel: event.channel, positionCode: event.positionCode, storeId: event.storeId, at: Date.now() }]));
    } catch {
    }
  }
  var context;
  var resolver;
  function setContext(next) {
    context = { ...next, storeIds: [...next.storeIds], externalOrigins: [...next.externalOrigins] };
    if (typeof window !== "undefined") window.dispatchEvent(new Event("ad-activity-context"));
  }
  function setContextResolver(next) {
    resolver = next;
    if (typeof window !== "undefined") window.dispatchEvent(new Event("ad-activity-context"));
  }
  function getContext() {
    return resolver?.() ?? context ?? { scope: "", canWrite: false, storeIds: [], externalOrigins: [], provider: localCatalogProvider(localStorage) };
  }
  return __toCommonJS(ad_activity_actions_exports);
})();
