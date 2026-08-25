import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");
const landing = read("vendor/emenu-new/src/pages/Landing/index.jsx");
const dialog = read("vendor/emenu-new/src/components/DurationBilling/EndTimingDialog.jsx");
const timingBar = read("vendor/emenu-new/src/components/DurationBilling/TimingBar.jsx");
const adminLogin = read("vendor/emenu-new/src/components/AdminLogin/index.jsx");

assert.match(timingBar, /onEnd &&/);
assert.match(landing, /onEnd=\{waiterInfo\?\.userId \? handleOpenEndTiming : undefined\}/);
assert.match(landing, /setDurationBillingEndAt\(Date\.now\(\)\)/);
assert.match(landing, /permission: 'durationBillingEnd'/);
assert.match(landing, /endTiming\(staff\?\.userId, durationBillingEndAt\)/);
assert.match(landing, /orders\.reduce/);
assert.match(dialog, /calcDurationBillingFee/);
assert.match(dialog, /formatDurationBillingElapsed/);
assert.doesNotMatch(dialog, /window\.confirm/);
assert.match(adminLogin, /permission === 'durationBillingEnd'/);
assert.match(adminLogin, /Toast\.error\(t\('AdminLogin\.tip_wrong'\)\)/);

console.log("verify-emenu-duration-billing-end: OK");

