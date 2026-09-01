/** 前厅设置 22 组信息架构与迁移不变量专项校验。 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FOH_SETTINGS_GROUP_TITLES as RUNTIME_TITLES,
  FOH_SETTINGS_LEGACY_GROUP_REDIRECT as RUNTIME_REDIRECTS,
  normalizeFohCatalogItemsForGrouping,
  normalizeLegacyFohSettingsPath,
} from "../src/config/foh-settings-group-keys";
import { FOH_LINE_SCOPE_BY_SEQ } from "../src/config/foh-settings-line-scope";
import { FOH_LINE_STORAGE_BY_SEQ } from "../src/config/foh-settings-line-storage-registry";
import { MODULE_SETTINGS_BY_PATH } from "../src/config/module-settings-catalog";
import {
  MVP_HIDDEN_MODULE_SETTING_GROUP_KEYS,
  MVP_HIDDEN_MODULE_SETTING_SEQS,
  RETIRED_MODULE_SETTING_SEQS,
} from "../src/config/product-version";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/lib/foh-settings-22-group-baseline.json"), "utf8"),
) as {
  items: Array<Record<string, unknown> & { seq: number }>;
  linesBySeq: Record<string, string[]>;
  storageBySeq: Record<string, string>;
  uiModulesBySeq: Record<string, string[]>;
};

const generator = await import("./lib/foh-settings-groups.mjs");
const sortModule = await import("./lib/settings-intra-group-sort.mjs");
const {
  FOH_SETTINGS_ASSIGN_MAP,
  FOH_SETTINGS_GROUP_ORDER,
  FOH_SETTINGS_GROUP_TITLES,
  FOH_SETTINGS_LEGACY_GROUP_REDIRECT,
} = generator as {
  FOH_SETTINGS_ASSIGN_MAP: Record<string, number[]>;
  FOH_SETTINGS_GROUP_ORDER: string[];
  FOH_SETTINGS_GROUP_TITLES: Record<string, string>;
  FOH_SETTINGS_LEGACY_GROUP_REDIRECT: Record<string, string>;
};
const INTRA_GROUP_SORT_BY_SEQ = sortModule.INTRA_GROUP_SORT_BY_SEQ as Map<number, number>;

const expectedGroups: Array<[string, string, number[]]> = [
  ["foh-pos-shell", "登录与终端主界面", [75, 166, 175, 165, 346]],
  ["foh-table-start-flow", "选桌与开台流程", [107, 619, 111, 625, 621, 643, 592]],
  ["foh-pos-menu-scope", "POS 菜单与界面", [118, 174, 148, 348, 216, 217, 218, 220, 219, 350]],
  ["foh-pos-order-cart", "点单内容与客户信息", [132, 133, 135, 137, 178, 121, 122, 222, 223, 349, 141]],
  ["foh-pos-combo-ordering", "套餐与自定义点单", [138, 139, 145]],
  ["foh-pos-buttons", "点单页按钮显隐", [193, 194, 195, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215]],
  ["foh-pos-order-toolbar", "点单页工具栏", [483, 484, 485, 486, 196]],
  ["foh-kitchen-send-timing", "送厨规则与权限", [125, 113, 123, 114, 120, 345]],
  ["foh-pos-find-order-list", "找单与结账入口", [153, 151, 152, 251, 248, 221]],
  ["foh-pos-order-alerts", "消息类型提醒", [331, 332, 638, 639, 637, 110]],
  ["foh-table-clear-ops", "清桌与换服务员（企台）", [534, 642, 351, 347]],
  ["foh-guest-order-type", "订单类型、取餐与送厨", [487, 488, 489, 490, 491, 503, 581, 502]],
  ["foh-guest-registration", "食客登记与会员", [623, 622, 504, 505, 506, 507, 510]],
  ["foh-guest-pre-order", "点单前限制与授权", [620, 626, 627]],
  ["foh-guest-facing-locale", "食客端语言", [652, 653]],
  ["foh-guest-menu-home", "点餐首页与入口", [599, 604, 601, 602, 600, 611, 532]],
  ["foh-guest-menu-body", "菜单与购物车展示", [516, 518, 606, 517, 520, 608, 515, 528, 618, 616, 524, 607, 519, 645, 509, 525, 526, 617]],
  ["foh-guest-hotpot", "火锅点餐", [572, 574, 573, 575]],
  ["foh-guest-duration-scenarios", "计时与自助餐规则", [571, 674, 577, 578, 579, 580]],
  ["foh-tableside-service", "桌边呼叫", [641, 640, 333]],
  ["foh-guest-order-notes", "点单备注", [521, 522, 523]],
  ["foh-wait-time-display", "等待时长计算与展示", [673, 535, 536, 537, 538, 539, 540]],
];

const requiredRedirects: Record<string, string> = {
  "foh-pos-menu-ui-layout": "foh-pos-menu-scope",
  "pos-menu-ui-layout": "foh-pos-menu-scope",
  "foh-pos-order-extras": "foh-pos-order-toolbar",
  "foh-order-toolbar-extra": "foh-pos-order-toolbar",
  "foh-pos-checkout-entry": "foh-pos-find-order-list",
  "pos-checkout-entry": "foh-pos-find-order-list",
  "foh-guest-kitchen-send": "foh-guest-order-type",
  "foh-guest-scenario-dining": "foh-guest-order-type",
  "guest-channel-kitchen-send": "foh-guest-order-type",
  "guest-scenario-dining": "foh-guest-order-type",
  "foh-guest-kitchen-dining": "foh-guest-order-type",
  "guest-notes-fees": "foh-guest-order-notes",
};

const errors: string[] = [];
const approvedGuestMenuCatalogChanges = new Set([
  509, 515, 516, 517, 518, 519, 520, 526, 528, 577, 578, 579, 580, 606, 607, 608,
  617, 618, 674,
]);
const approvedGuestMenuLineScopeChanges = new Set([
  509, 515, 516, 517, 518, 519, 520, 524, 525, 526, 528, 577, 578, 579, 580, 606,
  607, 608, 616, 617, 618, 645, 674,
]);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const assert = (condition: unknown, message: string) => {
  if (!condition) errors.push(message);
};

const expectedOrder = expectedGroups.map(([key]) => key);
assert(same(FOH_SETTINGS_GROUP_ORDER, expectedOrder), "生成侧 groupOrder 与 22 组规格不一致");
assert(expectedOrder.slice(0, 11).length === 11 && expectedOrder.slice(11).length === 11, "员工端/食客端必须各 11 组");

const allSeqs: number[] = [];
for (const [groupKey, title, seqs] of expectedGroups) {
  assert(FOH_SETTINGS_GROUP_TITLES[groupKey] === title, `${groupKey} 生成侧标题错误`);
  assert(RUNTIME_TITLES[groupKey] === title, `${groupKey} 运行时标题错误`);
  assert(same(FOH_SETTINGS_ASSIGN_MAP[groupKey], seqs), `${groupKey} seq 顺序错误`);
  const sorted = [...seqs].sort(
    (a, b) => (INTRA_GROUP_SORT_BY_SEQ.get(a) ?? a) - (INTRA_GROUP_SORT_BY_SEQ.get(b) ?? b),
  );
  assert(same(sorted, seqs), `${groupKey} 运行时组内排序错误`);
  allSeqs.push(...seqs);
}
assert(allSeqs.length === 153, `规范 seq 应为 153，实际 ${allSeqs.length}`);
assert(new Set(allSeqs).size === 153, "规范 seq 存在重复");

const canonical = new Set(expectedOrder);
for (const [legacy, target] of Object.entries(requiredRedirects)) {
  assert(FOH_SETTINGS_LEGACY_GROUP_REDIRECT[legacy] === target, `${legacy} 生成侧重定向错误`);
  assert(RUNTIME_REDIRECTS[legacy] === target, `${legacy} 运行时重定向错误`);
  assert(canonical.has(target), `${legacy} 未直接指向存活组`);
  const oldPath = `/operations/queue-call/settings/${legacy}`;
  const targetPath = `/operations/queue-call/settings/${target}`;
  assert(normalizeLegacyFohSettingsPath(oldPath) === targetPath, `${legacy} 路径重定向错误`);
  assert(normalizeLegacyFohSettingsPath(targetPath) === targetPath, `${target} 路径规范化不幂等`);
  assert(
    normalizeLegacyFohSettingsPath(`/operations/queue-call/settings?group=${legacy}`) === targetPath,
    `${legacy} 查询参数重定向错误`,
  );
}

for (const [legacy, target] of Object.entries(FOH_SETTINGS_LEGACY_GROUP_REDIRECT)) {
  assert(canonical.has(target), `生成侧别名 ${legacy} 指向已删除组 ${target}`);
}
for (const [legacy, target] of Object.entries(RUNTIME_REDIRECTS)) {
  assert(canonical.has(target), `运行时别名 ${legacy} 指向已删除组 ${target}`);
}

const hub = MODULE_SETTINGS_BY_PATH["/operations/queue-call/settings"];
const normalizedItems = normalizeFohCatalogItemsForGrouping(hub?.items ?? []);
assert(normalizedItems.length === 153, `复杂版本 catalog 应为 153 项，实际 ${normalizedItems.length}`);
assert(same(hub?.groupOrder, expectedOrder), "catalog groupOrder 与规范不一致");
assert(same(hub?.groupNavSections?.map((s) => s.groupKeys), [expectedOrder.slice(0, 11), expectedOrder.slice(11)]), "catalog 员工端/食客端分段错误");

const baselineItems = new Map(
  baseline.items.map(({ id: _id, ...stable }) => [stable.seq, stable]),
);
for (const item of normalizedItems) {
  const { id: _id, groupKey: _groupKey, groupTitle: _groupTitle, ...stable } = item;
  if (approvedGuestMenuCatalogChanges.has(item.seq)) continue;
  assert(same(stable, baselineItems.get(item.seq)), `seq ${item.seq} 非分组 catalog 字段发生变化`);
}
assert(same([...normalizedItems.map((item) => item.seq)].sort((a, b) => a - b), [...allSeqs].sort((a, b) => a - b)), "catalog seq 集合与 153 项规范不一致");

for (const seq of allSeqs) {
  if (approvedGuestMenuLineScopeChanges.has(seq)) continue;
  const lines = [...(FOH_LINE_SCOPE_BY_SEQ[seq]?.lines ?? [])].sort();
  assert(same(lines, baseline.linesBySeq[String(seq)]), `seq ${seq} 产线集合发生变化`);
}
for (const [seq, key] of Object.entries(baseline.storageBySeq)) {
  if (Number(seq) === 517) continue;
  assert(FOH_LINE_STORAGE_BY_SEQ[Number(seq)] === key, `seq ${seq} 存储键发生变化`);
}

const configDir = path.join(root, "src/config");
const uiFiles = fs.readdirSync(configDir).filter((name) => name.startsWith("module-settings-") && name.endsWith(".ts"));
for (const [seq, expectedModules] of Object.entries(baseline.uiModulesBySeq)) {
  const token = new RegExp(`(^|\\D)${seq}(\\D|$)`);
  const actual = uiFiles.filter((name) => token.test(fs.readFileSync(path.join(configDir, name), "utf8"))).sort();
  assert(same(actual, expectedModules), `seq ${seq} 自定义 UI 模块签名发生变化`);
}

const mvpHiddenSeqs = new Set<number>(MVP_HIDDEN_MODULE_SETTING_SEQS as readonly number[]);
const mvpHiddenGroups = new Set<string>(MVP_HIDDEN_MODULE_SETTING_GROUP_KEYS as readonly string[]);
const mvpItems = normalizedItems.filter((item) => !mvpHiddenSeqs.has(item.seq) && !mvpHiddenGroups.has(item.groupKey));
assert(mvpItems.length === 118, `MVP 应为 118 项，实际 ${mvpItems.length}`);
assert(new Set(mvpItems.map((item) => item.groupKey)).size === 20, "MVP 应为 20 组");
for (const seq of [164, 176, 177]) {
  assert((RETIRED_MODULE_SETTING_SEQS as readonly number[]).includes(seq), `seq ${seq} 未全版本退役`);
  assert(!normalizedItems.some((item) => item.seq === seq), `seq ${seq} 仍在运行 catalog`);
}

const mainSource = fs.readFileSync(path.join(root, "src/main.ts"), "utf8");
assert(!mainSource.includes("fohSettingsLegacyGroup"), "src/main.ts 仍维护独立前厅旧路径表");

if (errors.length) {
  console.error("FOH 22-group IA verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("FOH 22-group IA verified: future 22/153, MVP 20/118, invariants preserved.");
