"use strict";
var KioskAdMaterialBatch = (() => {
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

  // src/marketing-display/ad-material-batch.ts
  var ad_material_batch_exports = {};
  __export(ad_material_batch_exports, {
    applyBatch: () => applyBatch,
    captureBatch: () => captureBatch,
    commonAction: () => commonAction
  });
  var actionKey = (asset) => JSON.stringify(asset.clickAction ?? { type: "none" }, (_, value) => value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).sort().reduce((out, key) => ({ ...out, [key]: value[key] }), {}) : value);
  function index(items) {
    const result = /* @__PURE__ */ new Map();
    for (const item of items) {
      if (!item.assetId || result.has(item.assetId)) throw Error("\u7D20\u6750\u6807\u8BC6\u5F02\u5E38\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u5E7F\u544A");
      result.set(item.assetId, item);
    }
    return result;
  }
  function captureBatch(items, slot) {
    if (!items.length) throw Error("\u8BF7\u81F3\u5C11\u9009\u62E9\u4E00\u5F20\u7D20\u6750");
    index(items);
    return { slot: JSON.stringify(slot), ids: items.map((item) => item.assetId), before: Object.fromEntries(items.map((item) => [item.assetId, actionKey(item)])) };
  }
  function commonAction(items) {
    const mixed = items.some((item) => actionKey(item) !== actionKey(items[0]));
    return { mixed, action: mixed ? { type: "none" } : structuredClone(items[0]?.clickAction ?? { type: "none" }) };
  }
  function applyBatch(batch, current, slot, action) {
    if (JSON.stringify(slot) !== batch.slot) throw Error("\u6E20\u9053\u3001\u5E7F\u544A\u4F4D\u6216\u89C4\u683C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u7D20\u6750");
    const available = index(current);
    const targets = batch.ids.map((id) => {
      const item = available.get(id);
      if (!item) throw Error("\u6240\u9009\u7D20\u6750\u5DF2\u79FB\u9664\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
      if (actionKey(item) !== batch.before[id]) throw Error("\u6240\u9009\u7D20\u6750\u7684\u70B9\u51FB\u884C\u4E3A\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9");
      return item;
    });
    const patches = targets.map(() => structuredClone(action));
    targets.forEach((item, i) => {
      item.clickAction = patches[i];
    });
    return targets.length;
  }
  return __toCommonJS(ad_material_batch_exports);
})();
