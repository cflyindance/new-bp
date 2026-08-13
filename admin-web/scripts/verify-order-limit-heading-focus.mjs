import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const cssPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.css", import.meta.url);
const jsPath = new URL("../dist/Configuration%20center/assets/order-limit-flow.js", import.meta.url);

const [css, js] = await Promise.all([
  readFile(cssPath, "utf8"),
  readFile(jsPath, "utf8"),
]);

assert.match(
  js,
  /<h2 tabindex="-1">选择规则类型<\/h2>/,
  "步骤标题应继续支持程序化聚焦",
);
assert.match(
  js,
  /heading\.focus\(\)/,
  "步骤切换后应继续把无障碍焦点移到当前标题",
);
assert.match(
  css,
  /\.olf-content-head h2:focus\s*\{[^}]*outline:\s*none\s*;?[^}]*\}/,
  "非交互步骤标题获得程序化焦点时不应显示浏览器默认边框",
);
assert.doesNotMatch(
  css,
  /\.olf-(?:button|input|select|textarea)[^{]*:focus(?:-visible)?[^}]*outline:\s*none/,
  "修复不应移除交互控件的焦点提示",
);

console.log("Menu order limit heading focus verification passed");
