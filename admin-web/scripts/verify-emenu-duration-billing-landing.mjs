import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const landing = read("vendor/emenu-new/src/pages/Landing/index.jsx");
const timingBar = read("vendor/emenu-new/src/components/DurationBilling/TimingBar.jsx");
const utilitySource = read("vendor/emenu-new/src/utils/durationBilling.js");
const utilityUrl = `data:text/javascript;base64,${Buffer.from(utilitySource).toString("base64")}`;
const billing = await import(utilityUrl);

assert.match(landing, /durationBillingStatus === 'idle'/);
assert.doesNotMatch(landing, /currentTable\?\.durationBillingRuleId/);
assert.match(landing, /isKtvDurationBillingTable\(currentTable\)/);
assert.match(landing, /tableSnapshot: currentTable/);
assert.doesNotMatch(landing, /getFinalConfigById\(443\)/);
assert.match(landing, /await startTiming\(\{/);
assert.doesNotMatch(landing, /import StartTimingButton/);
assert.doesNotMatch(landing, /<StartTimingButton/);
assert.match(
  landing,
  /durationBillingStatus === 'idle'[\s\S]*?isKtvDurationBillingTable\(currentTable\)[\s\S]*?t\('DurationBilling\.startTiming'\)/,
  "KTV 未计时时中央按钮必须显示开单计时",
);
assert.match(
  landing,
  /if \(displayTable && isKtvDurationBillingTable\(currentTable\)\)[\s\S]*?durationBillingStatus === 'timing'[\s\S]*?navigate\('\/order'\)[\s\S]*?await handleStartTiming\(\)[\s\S]*?return/,
  "KTV 的开始点单必须复用开单计时，计时中直接进入当前订单",
);
assert.match(landing, /refresh:\s*refreshDurationBilling/);
assert.match(
  landing,
  /refreshDurationBilling\(\)[\s\S]*?currentTable\?\.id,\s*orderId,\s*refreshDurationBilling/,
  "切换桌台或订单后必须重新读取当前桌的计时会话",
);
assert.match(
  landing,
  /await runFetchOrder\(\)[\s\S]*?navigate\('\/order'\)[\s\S]*?Toast\.success\(t\('DurationBilling\.startSuccess'\)\)/,
  "开单计时成功刷新订单后必须直接进入菜单页",
);
assert.match(landing, /durationBillingStatus === 'timing'/);
assert.match(timingBar, /setInterval\(\(\) => setNow\(Date\.now\(\)\), 1000\)/);
assert.match(timingBar, /function TimingBar\(\{ session, onEnd \}\)/);
assert.doesNotMatch(timingBar, /DurationBilling\.estimatedFee/);
assert.doesNotMatch(timingBar, /classes\.name/);
const timingBarUsage = landing.match(/<TimingBar[\s\S]*?\/>/)?.[0] ?? "";
assert.doesNotMatch(timingBarUsage, /tableName=/);

const landingHeaderZIndex = Number(
  landing.match(/landingHeader:\s*\{[\s\S]*?zIndex:\s*(\d+)/)?.[1],
);
const landingMainZIndex = Number(
  landing.match(/main:\s*\{[\s\S]*?zIndex:\s*(\d+)/)?.[1],
);
assert.ok(
  landingHeaderZIndex > landingMainZIndex,
  "顶部桌子切换入口必须位于全屏首页内容层之上",
);

assert.equal(billing.formatDurationBillingElapsed(0, 3661000), "01:01:01");
assert.equal(
  billing.formatDurationBillingRule({
    pricing: { type: "unit", amount: 10, unitMinutes: 30 },
  }),
  "¥10/30min",
);
assert.equal(
  billing.formatDurationBillingRule({
    pricing: {
      type: "interval",
      intervals: [
        { endMinutes: 30, amount: 10 },
        { endMinutes: 60, amount: 18 },
        { endMinutes: null, amount: 25 },
      ],
    },
  }),
  "1-30min ¥10 · 31-60min ¥18 · 61min+ ¥25",
);

console.log("verify-emenu-duration-billing-landing: OK");
