import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hostPath = new URL("../src/config/foh-menu-order-limits-ui.ts", import.meta.url);
const listPagePath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);

const [hostSource, listPageSource] = await Promise.all([
  readFile(hostPath, "utf8"),
  readFile(listPagePath, "utf8"),
]);

const quantityPanel = hostSource.match(
  /function renderQuantityPanel[\s\S]*?<section[\s\S]*?data-menu-order-limit-panel="quantity"[\s\S]*?<\/section>`;/,
)?.[0];

assert.ok(quantityPanel, "应能定位数量与频次限制承载区");
assert.doesNotMatch(
  quantityPanel,
  /\b(?:rounded-xl|border-border|bg-card|shadow-sm)\b/,
  "数量页 iframe 外层不应保留卡片背景、边框、圆角或阴影",
);
assert.match(
  quantityPanel,
  /class="[^"]*\bmin-h-0\b[^"]*\boverflow-hidden\b[^"]*"/,
  "数量页承载区应继续限制外层溢出",
);

assert.match(
  listPageSource,
  /html\.embedded-mode,\s*html\.embedded-mode body\s*\{[^}]*height:\s*100%[^}]*overflow:\s*hidden[^}]*background:\s*transparent[^}]*\}/,
  "embedded 页面应建立完整高度链路，并移除整页滚动与背景",
);
assert.match(
  listPageSource,
  /html\.embedded-mode \.page\s*\{[^}]*height:\s*100%[^}]*min-height:\s*0[^}]*padding:\s*0[^}]*overflow:\s*hidden[^}]*\}/,
  "embedded 页面主容器应占满高度且不产生外层滚动",
);
assert.match(
  listPageSource,
  /html\.embedded-mode #rulesPanel\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*min-height:\s*0[^}]*flex:\s*1[^}]*\}/,
  "现有规则区块应占满主内容并采用纵向 flex 布局",
);
assert.match(
  listPageSource,
  /html\.embedded-mode #rulesPanel \.section-body\s*\{[^}]*min-height:\s*0[^}]*flex:\s*1[^}]*overflow:\s*auto[^}]*\}/,
  "仅现有规则的数据区应承担滚动",
);
assert.match(
  listPageSource,
  /html\.embedded-mode #rulesPanel thead th\s*\{[^}]*position:\s*sticky[^}]*top:\s*0[^}]*z-index:\s*1[^}]*\}/,
  "规则列表表头应固定在数据滚动视口顶部",
);

console.log("Menu order limit rule list scrolling verification passed");
