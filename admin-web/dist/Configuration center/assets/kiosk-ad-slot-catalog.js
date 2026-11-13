"use strict";
var KioskAdSlots = (() => {
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

  // src/marketing-display/ad-slot-catalog.ts
  var ad_slot_catalog_exports = {};
  __export(ad_slot_catalog_exports, {
    CHANNELS: () => CHANNELS,
    PLATFORM_KEY: () => PLATFORM_KEY,
    available: () => available,
    defaults: () => defaults,
    newSpec: () => newSpec,
    ratio: () => ratio,
    readCatalog: () => readCatalog,
    samePosition: () => samePosition,
    snapshot: () => snapshot,
    updateContract: () => updateContract,
    validateMedia: () => validateMedia,
    validateSnapshot: () => validateSnapshot,
    validateSpecs: () => validateSpecs,
    withDefaults: () => withDefaults
  });
  var CHANNELS = ["Kiosk", "eMenu", "CDS", "OO", "SDI", "\u53D6\u9910\u5C4F", "Waitlist"];
  var PLATFORM_KEY = "menusifu:display-regions:v1";
  var canonical = (value) => JSON.stringify(value, (_, v) => v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((out, key) => ({ ...out, [key]: v[key] }), {}) : v);
  var copy = (x) => structuredClone(x);
  function fail(text) {
    throw Error(text);
  }
  function newSpec(id = "portrait", width = 1080, height = 1920) {
    return { id, name: height > width ? "\u7AD6\u7248" : "\u6A2A\u7248", width, height, applicability: height > width ? "\u7AD6\u5C4F\u6807\u51C6\u7248\u5F0F" : "\u6A2A\u5C4F\u6807\u51C6\u7248\u5F0F", mediaKinds: ["image", "video"], imageFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"], videoFormats: ["video/mp4", "video/webm"], imageMaxMB: 5, videoMaxMB: 20, videoMaxSeconds: 120, maxImages: 5, maxVideos: 1, sizeMode: "recommend", fit: "contain" };
  }
  function ratio(spec) {
    let a = spec.width, b = spec.height;
    while (b) {
      const r = a % b;
      a = b;
      b = r;
    }
    return `${spec.width / a}:${spec.height / a}`;
  }
  function validateSpecs(specs) {
    if (!Array.isArray(specs) || !specs.length || specs.length > 12) fail("\u8BF7\u914D\u7F6E1\uFF5E12\u5957\u7D20\u6750\u89C4\u683C");
    const ids = /* @__PURE__ */ new Set(), conditions = /* @__PURE__ */ new Set();
    for (const s of specs) {
      if (!/^[a-z][a-z0-9_-]{0,39}$/.test(s.id) || ids.has(s.id)) fail("\u89C4\u683C\u7F16\u7801\u987B\u4E3A\u552F\u4E00\u7684\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u6216\u77ED\u6A2A\u7EBF");
      ids.add(s.id);
      if (!s.name.trim() || s.name.length > 30 || !s.applicability.trim() || s.applicability.length > 80) fail("\u89C4\u683C\u540D\u79F0\u4E0E\u9002\u7528\u7248\u5F0F\uFF0F\u8BBE\u5907\u5FC5\u586B\uFF0C\u5206\u522B\u6700\u591A30\uFF0F80\u5B57");
      const condition = s.applicability.trim().toLowerCase();
      if (conditions.has(condition)) fail("\u540C\u4E00\u4F4D\u7F6E\u7684\u9002\u7528\u7248\u5F0F\uFF0F\u8BBE\u5907\u4E0D\u5F97\u91CD\u590D");
      conditions.add(condition);
      if (!Number.isInteger(s.width) || !Number.isInteger(s.height) || Math.min(s.width, s.height) < 1 || Math.max(s.width, s.height) > 16384) fail("\u7D20\u6750\u5BBD\u9AD8\u987B\u4E3A1\uFF5E16384\u7684\u6574\u6570");
      if (!s.mediaKinds.length || s.mediaKinds.some((k) => !["image", "video"].includes(k))) fail("\u6BCF\u5957\u89C4\u683C\u81F3\u5C11\u652F\u6301\u56FE\u7247\u6216\u89C6\u9891");
      if (!["recommend", "strict"].includes(s.sizeMode) || !["contain", "cover"].includes(s.fit)) fail("\u5C3A\u5BF8\u6821\u9A8C\u6216\u5C55\u793A\u65B9\u5F0F\u65E0\u6548");
      if (s.mediaKinds.includes("image") && (!s.imageFormats.length || s.imageFormats.some((f) => !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f)))) fail("\u8BF7\u9009\u62E9\u6709\u6548\u56FE\u7247\u683C\u5F0F");
      if (s.mediaKinds.includes("video") && (!s.videoFormats.length || s.videoFormats.some((f) => !["video/mp4", "video/webm"].includes(f)))) fail("\u8BF7\u9009\u62E9\u6709\u6548\u89C6\u9891\u683C\u5F0F");
      for (const [v, max, label] of [[s.imageMaxMB, 100, "\u56FE\u7247\u5927\u5C0F"], [s.videoMaxMB, 500, "\u89C6\u9891\u5927\u5C0F"], [s.videoMaxSeconds, 3600, "\u89C6\u9891\u65F6\u957F"], [s.maxImages, 20, "\u56FE\u7247\u6570\u91CF"], [s.maxVideos, 1, "\u89C6\u9891\u6570\u91CF"]]) if (!Number.isInteger(v) || v < 1 || v > max) fail(`${label}\u987B\u4E3A1\uFF5E${max}\u7684\u6574\u6570`);
    }
  }
  function defaults() {
    return ["screensaver", "home"].map((code) => ({ id: "ad-kiosk-" + code, name: code === "home" ? "\u9996\u9875\u5E7F\u544A" : "\u5C4F\u4FDD", code, productLine: "Kiosk", scene: code === "home" ? "\u9996\u9875" : "\u5F85\u673A", description: code === "home" ? "Kiosk\u9996\u9875\u5E7F\u544A\u533A\u57DF" : "Kiosk\u65E0\u64CD\u4F5C\u65F6\u5C55\u793A\uFF0C\u8FDB\u5165\u9000\u51FA\u7531\u7EC8\u7AEF\u63A7\u5236\u3002", enabled: true, builtin: true, ratio: code === "home" ? "108:125 / 4:3" : "9:16 / 16:9", mediaKinds: ["image", "video"], maxItems: 20, parameters: code === "home" ? ["interval", "transition"] : ["interval", "idle", "transition"], bindings: { Kiosk: { minimumVersion: "0.0.0", mediaKinds: ["image", "video"] } }, generation: 0, specVersion: 1, specHistory: [], specs: code === "home" ? [newSpec("portrait", 1080, 1250), newSpec("landscape", 1440, 1080)] : [newSpec(), newSpec("landscape", 1920, 1080)] })).concat([{ id: "ad-waitlist-screensaver", name: "\u5C4F\u4FDD", code: "screensaver", productLine: "Waitlist", scene: "\u5F85\u673A", description: "Waitlist\u5C4F\u4FDD\u5C55\u793A\u533A\u57DF", enabled: true, builtin: true, ratio: "9:16 / 16:9", mediaKinds: ["image", "video"], maxItems: 20, parameters: ["interval", "idle", "transition"], bindings: { Waitlist: { minimumVersion: "0.0.0", mediaKinds: ["image", "video"] } }, generation: 0, specVersion: 1, specHistory: [], specs: [newSpec(), newSpec("landscape", 1920, 1080)] }]);
  }
  function withDefaults(platform) {
    const next = copy(platform);
    for (const slot of defaults()) if (!next.regions.some((r) => r.id === slot.id || r.productLine === slot.productLine && r.code === slot.code)) next.regions.push(slot);
    return next;
  }
  function readCatalog(storage) {
    const raw = storage.getItem(PLATFORM_KEY);
    if (!raw) return defaults();
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      fail("\u5E7F\u544A\u4F4D\u914D\u7F6E\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u8054\u7CFB\u5E73\u53F0\u7BA1\u7406\u5458");
    }
    if (!value || value.schema !== 1 || !Number.isInteger(value.revision) || !Array.isArray(value.regions)) fail("\u5E7F\u544A\u4F4D\u914D\u7F6E\u7248\u672C\u65E0\u6548\uFF0C\u8BF7\u8054\u7CFB\u5E73\u53F0\u7BA1\u7406\u5458");
    return withDefaults(value).regions;
  }
  function available(slots, line) {
    return slots.filter((s) => s.enabled && s.productLine === line && s.bindings[line] && s.specs?.length);
  }
  function snapshot(slot) {
    if (!slot.productLine || !slot.specs?.length) fail("\u5E7F\u544A\u4F4D\u5C1A\u672A\u914D\u7F6E\u4EA7\u7EBF\u4E0E\u89C4\u683C");
    return { id: slot.id, name: slot.name, code: slot.code, productLine: slot.productLine, version: slot.specVersion ?? 1, specs: copy(slot.specs) };
  }
  function validateSnapshot(slots, value) {
    const slot = slots.find((s) => s.id === value?.id);
    if (!slot || !slot.enabled || slot.productLine !== value.productLine || slot.code !== value.code || !slot.bindings[value.productLine]) fail("\u5E7F\u544A\u4F4D\u4E0D\u53EF\u7528\u6216\u5C1A\u672A\u63A5\u5165\uFF0C\u8BF7\u8FD4\u56DE\u9009\u62E9\u6E20\u9053\u4E0E\u5E7F\u544A\u4F4D");
    const revision = (slot.specVersion ?? 1) === value.version ? slot.specs : slot.specHistory?.find((v) => v.version === value.version)?.specs;
    if (!revision || canonical(revision) !== canonical(value.specs)) fail("\u5E7F\u544A\u4F4D\u89C4\u683C\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u8FD4\u56DE\u7F16\u8F91\u9875\u6838\u5BF9");
    return slot;
  }
  function updateContract(existing, input) {
    if (!CHANNELS.includes(input.productLine)) fail("\u8BF7\u9009\u62E9\u6240\u5C5E\u4EA7\u7EBF");
    if (existing?.productLine && existing.productLine !== input.productLine) fail("\u6240\u5C5E\u4EA7\u7EBF\u521B\u5EFA\u540E\u4E0D\u53EF\u4FEE\u6539");
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(input.code)) fail("\u4F4D\u7F6E\u7F16\u7801\u987B\u4EE5\u5C0F\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u6700\u591A64\u4F4D");
    validateSpecs(input.specs ?? []);
    if (Object.keys(input.bindings).some((line) => line !== input.productLine)) fail("\u63A5\u5165\u4EA7\u7EBF\u5FC5\u987B\u4E0E\u5E7F\u544A\u4F4D\u6240\u5C5E\u4EA7\u7EBF\u4E00\u81F4");
    const next = copy(input);
    next.specVersion = existing?.specVersion ?? 1;
    next.specHistory = copy(existing?.specHistory ?? []);
    if (existing?.specs && canonical(existing.specs) !== canonical(next.specs)) {
      next.specHistory.push({ version: existing.specVersion ?? 1, specs: copy(existing.specs) });
      next.specVersion = (existing.specVersion ?? 1) + 1;
    }
    return next;
  }
  function validateMedia(spec, media) {
    if (!spec.mediaKinds.includes(media.kind)) fail(`${spec.name}\u4E0D\u652F\u6301\u6B64\u7D20\u6750\u7C7B\u578B`);
    const formats = media.kind === "image" ? spec.imageFormats : spec.videoFormats;
    if (!formats.includes(media.mime)) fail(`${spec.name}\u7D20\u6750\u683C\u5F0F\u4E0D\u7B26\u5408\u8981\u6C42`);
    if (!Number.isFinite(media.bytes) || media.bytes <= 0) fail("\u7D20\u6750\u6587\u4EF6\u5927\u5C0F\u65E0\u6548");
    if (media.bytes > (media.kind === "image" ? spec.imageMaxMB : spec.videoMaxMB) * 1024 * 1024) fail(`${spec.name}\u7D20\u6750\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u9650\u5236`);
    if (!Number.isFinite(media.width) || !Number.isFinite(media.height) || media.width < 1 || media.height < 1) fail("\u65E0\u6CD5\u8BFB\u53D6\u7D20\u6750\u5C3A\u5BF8\uFF0C\u8BF7\u91CD\u65B0\u4E0A\u4F20");
    if (media.kind === "video" && (!Number.isFinite(media.duration) || media.duration <= 0 || media.duration > spec.videoMaxSeconds)) fail(`${spec.name}\u89C6\u9891\u65F6\u957F\u4E0D\u7B26\u5408\u8981\u6C42`);
    const mismatch = media.width !== spec.width || media.height !== spec.height;
    if (mismatch && spec.sizeMode === "strict") fail(`${spec.name}\u987B\u4E3A${spec.width}\xD7${spec.height}px`);
    return mismatch ? [`${spec.name}\u5EFA\u8BAE${spec.width}\xD7${spec.height}px\uFF0C\u5F53\u524D${media.width}\xD7${media.height}px`] : [];
  }
  function samePosition(a, b) {
    if (a.adSlot && b.adSlot) return a.adSlot.productLine === b.adSlot.productLine && a.adSlot.id === b.adSlot.id;
    const av = a.adSlot ? [a.adSlot.code] : a.distributePositions, bv = b.adSlot ? [b.adSlot.code] : b.distributePositions;
    return !av?.length || !bv?.length || av.some((v) => bv.includes(v));
  }
  return __toCommonJS(ad_slot_catalog_exports);
})();
