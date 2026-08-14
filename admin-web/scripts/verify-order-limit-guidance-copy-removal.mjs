import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const flowPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);
const source = await readFile(flowPath, "utf8");

const removedCopy = [
  "通过门店下拉切换并配置各门店商品，实际生效门店将在“生效范围”中选择。",
  "切换门店会自动保存上一家门店的商品配置。",
  "先选择门店，再按该门店实际包含的产线配置数量；空输入表示未配置，0 表示禁止。",
  "选择本次实际生效门店，并配置时间、会员和有效人数口径。",
  "已配置商品的门店可以生效；取消勾选不会删除该门店商品和数量配置。",
  "授权只绕过当前规则的数量限制，不绕过售罄、停售、年龄或支付限制。",
  "保存草稿不会影响门店；保存并下发后才生成正式版本。",
];

removedCopy.forEach((copy) => {
  assert.doesNotMatch(source, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `流程中不应保留说明文案：${copy}`);
});

[
  "商品配置",
  "设置限购数量",
  "设置生效范围",
  "设置超限授权",
  "确认规则并发布",
  "生效门店",
].forEach((heading) => {
  assert.match(source, new RegExp(`>${heading}<`), `删除说明后仍应保留标题：${heading}`);
});

[
  "data-config-store-select",
  "data-limit-target",
  "data-effective-store",
  "data-auth-enabled",
  "headerSaveButton",
].forEach((marker) => {
  assert.match(source, new RegExp(marker), `删除说明后仍应保留关键控件：${marker}`);
});

console.log("Menu order limit guidance copy removal verification passed");
