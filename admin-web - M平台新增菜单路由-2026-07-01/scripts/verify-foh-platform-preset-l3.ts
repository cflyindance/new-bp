/**
 * 校验平台预设 · 前厅设置三级分组与侧栏分段（员工端 / 食客端）
 * 运行：npx tsx scripts/verify-foh-platform-preset-l3.ts
 */
import { buildPlatformPresetModuleGroups } from "../src/config/platform-preset-tree";
import { renderCatalogSectionedL3Column } from "../src/config/module-settings-subnav";

const STAFF_KEYS = [
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-menu-ui-layout",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
  "foh-pos-checkout-entry",
  "foh-pos-notification-control",
  "foh-pos-order-alerts",
  "foh-table-clear-ops",
];

const GUEST_KEYS = [
  "foh-guest-order-type",
  "foh-guest-registration",
  "foh-guest-pre-order",
  "foh-guest-facing-locale",
  "foh-guest-menu-home",
  "foh-guest-menu-body",
  "foh-guest-kitchen-send",
  "foh-guest-hotpot",
  "foh-guest-duration-scenarios",
  "foh-tableside-service",
  "foh-wait-time-display",
];

const groups = buildPlatformPresetModuleGroups("pos");
const foh = groups.find((g) => g.moduleId === "queue-call");
const settings = foh?.tree.children.find((c) => c.resource.featureId === "qc-settings");

if (!settings) {
  console.error("FAIL: missing queue-call settings L2");
  process.exit(1);
}

const l3Keys = new Set(settings.children.map((c) => c.resource.groupKey));
const missingStaff = STAFF_KEYS.filter((k) => !l3Keys.has(k));
const missingGuest = GUEST_KEYS.filter((k) => !l3Keys.has(k));

console.log("FOH settings L3 count:", settings.children.length);
console.log("missing staff keys:", missingStaff.length ? missingStaff.join(", ") : "(none)");
console.log("missing guest keys:", missingGuest.length ? missingGuest.join(", ") : "(none)");

const html = renderCatalogSectionedL3Column(settings, {
  activeKey: "",
  renderItem: (n) => `[${n.resource.groupKey}]`,
});

const staffHeading = html.indexOf("员工端");
const guestHeading = html.indexOf("食客端");
const staffBlock = staffHeading >= 0 && guestHeading >= 0 ? html.slice(staffHeading, guestHeading) : "";
const staffRendered = STAFF_KEYS.filter((k) => staffBlock.includes(`[${k}]`));
const guestRendered = GUEST_KEYS.filter((k) => html.includes(`[${k}]`));

console.log("staff section rendered:", staffRendered.length, "/", STAFF_KEYS.length);
console.log("guest section rendered:", guestRendered.length, "/", GUEST_KEYS.length);

if (missingStaff.length || missingGuest.length) {
  console.error("FAIL: tree missing expected foh-* group keys");
  process.exit(1);
}

if (staffRendered.length !== STAFF_KEYS.length) {
  console.error(
    "FAIL: staff section missing groups:",
    STAFF_KEYS.filter((k) => !staffRendered.includes(k)).join(", "),
  );
  process.exit(1);
}

if (guestRendered.length !== GUEST_KEYS.length) {
  console.error(
    "FAIL: guest groups missing in render:",
    GUEST_KEYS.filter((k) => !guestRendered.includes(k)).join(", "),
  );
  process.exit(1);
}

console.log("OK");
