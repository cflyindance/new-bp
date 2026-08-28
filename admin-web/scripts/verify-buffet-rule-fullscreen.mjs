import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const controller = read("src/config/rule-iframe-fullscreen.ts");
const menu = read("src/config/foh-menu-order-limits-ui.ts");
const buffet = read("src/config/foh-buffet-rules-ui.ts");
const main = read("src/main.ts");

for (const marker of ["ownerFrame", "ownerToken", "teardown", "scrollX", "scrollY", "removeEventListener", "restoreFrameStyle"]) {
  assert.ok(controller.includes(marker), `共享全屏控制器缺少 ${marker}`);
}
assert.match(controller, /catch[\s\S]*?exitRuleIframeFullscreen/, "无法读取 iframe URL 时应 fail-safe 退出");
assert.match(menu, /bindRuleIframeFullscreen/);
assert.match(menu, /order-limit-rule-editor\.html/);
assert.match(menu, /order-limit-publish-confirm\.html/);
assert.match(buffet, /bindRuleIframeFullscreen/);
assert.match(buffet, /buffet-rule-editor\.html/);
assert.match(buffet, /buffet-rule-publish-confirm\.html/);
assert.match(buffet, /buffet-rule\.html/);
assert.match(buffet, /data-foh-buffet-rule-frame/);
assert.match(main, /bindFohBuffetRulesUi\(\)/);
assert.match(main, /releaseFohBuffetRulesFullscreen\(\)/);

console.log("verify-buffet-rule-fullscreen: OK");
