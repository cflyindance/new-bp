/**
 * 校验平台预设 · 前厅设置三级分组与侧栏分段（员工端 / 食客端）
 * 运行：npx tsx scripts/verify-foh-platform-preset-l3.ts
 */
import { MODULE_SETTINGS_BY_PATH } from "../src/config/module-settings-catalog";
import { renderCatalogSectionedL3Column } from "../src/config/module-settings-subnav";
import type { PermissionTreeNode } from "../src/config/permission-registry";

const STAFF_KEYS = [
  "foh-pos-shell",
  "foh-table-start-flow",
  "foh-pos-menu-scope",
  "foh-pos-order-cart",
  "foh-pos-combo-ordering",
  "foh-pos-buttons",
  "foh-pos-order-toolbar",
  "foh-kitchen-send-timing",
  "foh-pos-find-order-list",
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
  "foh-guest-hotpot",
  "foh-guest-duration-scenarios",
  "foh-tableside-service",
  "foh-guest-order-notes",
  "foh-wait-time-display",
];

const catalog = MODULE_SETTINGS_BY_PATH["/operations/queue-call/settings"];
const settings = catalog
  ? ({
      resource: {
        moduleId: "queue-call",
        featureId: "qc-settings",
        path: catalog.settingsPath,
      },
      children: (catalog.groupOrder ?? []).map((groupKey) => ({
        resource: { moduleId: "queue-call", featureId: "qc-settings", groupKey },
        children: [],
      })),
    } as PermissionTreeNode)
  : undefined;

if (!settings) {
  console.error("FAIL: missing queue-call settings L2");
  process.exit(1);
}

const l3Keys = new Set(settings.children.map((c) => c.resource.groupKey));
const obsoleteKeys = [
  "foh-pos-notification-control",
  "foh-pos-menu-ui-layout",
  "foh-pos-order-extras",
  "foh-pos-checkout-entry",
  "foh-guest-kitchen-send",
];
const presentObsoleteKeys = obsoleteKeys.filter((key) => l3Keys.has(key));
if (presentObsoleteKeys.length) {
  console.error("FAIL: obsolete FOH groups are still present:", presentObsoleteKeys.join(", "));
  process.exit(1);
}
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

if (settings.children.length !== 22) {
  console.error(`FAIL: expected exactly 22 FOH L3 groups, received ${settings.children.length}`);
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
