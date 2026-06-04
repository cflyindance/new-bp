/**
 * 从 docs/配置归类-终版.md + docs/配置归类-分组映射.csv 生成 module-settings-catalog.ts
 * 运行：node scripts/build-module-settings-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd, slugify } from "./lib/parse-bplant-config-md.mjs";
import { isSettingsCatalogExcluded } from "./lib/settings-catalog-exclusions.mjs";
import { buildCatalogSceneDesc, buildCatalogTitle } from "./lib/settings-catalog-scene-supplement.mjs";
import { getSettingsCatalogPathForSeq } from "./lib/settings-catalog-path-override.mjs";
import { SETTINGS_CATALOG_VIRTUAL_ITEMS } from "./lib/settings-catalog-virtual-items.mjs";
import { getSettingsHub } from "./lib/settings-hub-override.mjs";
import {
  DELIVERY_SETTINGS_GROUP_ORDER,
  FINANCE_SETTINGS_GROUP_ORDER,
  FOH_SETTINGS_GROUP_ORDER,
  INTRA_GROUP_SORT_BY_SEQ,
  INTEGRATIONS_SETTINGS_GROUP_ORDER,
  KITCHEN_SETTINGS_GROUP_ORDER,
  ORDER_SETTINGS_GROUP_ORDER,
  PAYMENT_SETTINGS_GROUP_ORDER,
  PRINT_SETTINGS_GROUP_ORDER,
  PRODUCT_SETTINGS_GROUP_ORDER,
  STORE_SETTINGS_GROUP_ORDER,
} from "./lib/settings-intra-group-sort.mjs";

const SETTINGS_GROUP_ORDER_BY_PATH = {
  "/operations/waitlist/settings": DELIVERY_SETTINGS_GROUP_ORDER,
  "/operations/queue-call/settings": FOH_SETTINGS_GROUP_ORDER,
  "/operations/kitchen-kds/settings": KITCHEN_SETTINGS_GROUP_ORDER,
  "/orders/settings": ORDER_SETTINGS_GROUP_ORDER,
  "/transactions/settings": PAYMENT_SETTINGS_GROUP_ORDER,
  "/product-center-main/settings": PRODUCT_SETTINGS_GROUP_ORDER,
  "/promotions/lottery": ["lottery-activity-settings", "lottery-animation-settings"],
  "/reviews/settings": ["review-content-moderation"],
  "/stores/settings": STORE_SETTINGS_GROUP_ORDER,
  "/finance/settings": FINANCE_SETTINGS_GROUP_ORDER,
  "/print-templates/settings": PRINT_SETTINGS_GROUP_ORDER,
  "/settings/integrations": INTEGRATIONS_SETTINGS_GROUP_ORDER,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const repoDocs = path.join(root, "..", "docs");
const projectDocs = path.join(repoDocs, "项目文档");
const sourcePath = [projectDocs, repoDocs]
  .map((d) => path.join(d, "配置归类-终版.md"))
  .find((p) => fs.existsSync(p));
const mappingPath = [projectDocs, repoDocs]
  .map((d) => path.join(d, "配置归类-分组映射.csv"))
  .find((p) => fs.existsSync(p));
const outPath = path.join(root, "src", "config", "module-settings-catalog.ts");

/** B 平台一级导航 → 滑层「设置」路由 */
const HUB_SETTINGS_PATH = {
  品牌管理: "/brand/settings",
  门店管理: "/stores/settings",
  团队管理: "/team/settings",
  商品中心: "/product-center-main/settings",
  订单中心: "/orders/settings",
  支付中心: "/transactions/settings",
  "外卖/来取": "/operations/waitlist/settings",
  促销中心: "/promotions/settings",
  会员中心: "/members/settings",
  礼品卡中心: "/gift-cards/settings",
  评价中心: "/reviews/settings",
  前厅管理中心: "/operations/queue-call/settings",
  后厨管理中心: "/operations/kitchen-kds/settings",
  预约等位中心: "/operations/reservations/settings",
  报表中心: "/reports/settings",
  财务中心: "/finance/settings",
  打印中心: "/print-templates/settings",
  消息中心: "/notifications/settings",
  库存管理中心: "/operations/inventory-ordering/settings",
  硬件管理中心: "/device-management/settings",
  权限管理中心: "/permissions/settings",
  素材中心: "/asset-center/settings",
  系统设置: "/settings/basic",
  主页: "/dashboard/settings",
  平台业务中心: "/settings/integrations",
  供应链中心: "/operations/inventory-ordering/settings",
  设置设备与License的绑定关系: "/device-management/settings",
};

function parseCsvLine(line) {
  const parts = [];
  let cur = "";
  let inQ = false;
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (inQ) {
      if (ch === '"' && line[j + 1] === '"') {
        cur += '"';
        j++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  parts.push(cur);
  return parts;
}

function loadGroupMapping() {
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`缺少分组映射表: ${mappingPath}\n请先运行: node scripts/generate-settings-group-mapping.mjs`);
  }
  const text = fs.readFileSync(mappingPath, "utf8");
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("seq,")) continue;
    const [seqRaw, groupTitle, groupKey] = parseCsvLine(t);
    const seq = Number(seqRaw);
    if (!seq || !groupTitle?.trim()) {
      throw new Error(`无效映射行: ${line}`);
    }
    map.set(seq, {
      groupTitle: groupTitle.trim(),
      groupKey: (groupKey?.trim() || slugify(groupTitle)).slice(0, 48),
    });
  }
  return map;
}

function resolveSettingsPath(hub) {
  return HUB_SETTINGS_PATH[hub];
}

function buildCatalog(rows, mapping) {
  const byPath = new Map();
  const missing = [];

  for (const row of rows) {
    if (isSettingsCatalogExcluded(row.seq)) {
      continue;
    }

    const hubDefaultPath = resolveSettingsPath(getSettingsHub(row));
    const settingsPath = getSettingsCatalogPathForSeq(row.seq, hubDefaultPath);
    if (!settingsPath) {
      console.warn(`[build] 未映射一级导航，已跳过: ${row.hub} (seq ${row.seq})`);
      continue;
    }

    const group = mapping.get(row.seq);
    if (!group) {
      missing.push(row.seq);
      continue;
    }

    const item = {
      seq: row.seq,
      title: buildCatalogTitle(row.seq, row.title),
      feature: row.feature,
      sceneDesc: buildCatalogSceneDesc(row.seq, row.sceneDesc),
      moduleName: row.moduleName,
      groupTitle: group.groupTitle,
      groupKey: group.groupKey,
    };

    if (!byPath.has(settingsPath)) {
      byPath.set(settingsPath, { settingsPath, items: [] });
    }
    byPath.get(settingsPath).items.push(item);
  }

  for (const virtual of SETTINGS_CATALOG_VIRTUAL_ITEMS) {
    const item = {
      seq: virtual.seq,
      title: buildCatalogTitle(virtual.seq, virtual.title),
      feature: virtual.feature,
      sceneDesc: buildCatalogSceneDesc(virtual.seq, virtual.sceneDesc),
      moduleName: virtual.moduleName,
      groupTitle: virtual.groupTitle,
      groupKey: virtual.groupKey,
    };
    if (!byPath.has(virtual.settingsPath)) {
      byPath.set(virtual.settingsPath, { settingsPath: virtual.settingsPath, items: [] });
    }
    byPath.get(virtual.settingsPath).items.push(item);
  }

  if (missing.length) {
    throw new Error(`映射表缺少 ${missing.length} 条 seq，例如: ${missing.slice(0, 5).join(", ")}`);
  }

  const canonicalHubByPath = new Map(Object.entries(HUB_SETTINGS_PATH).map(([hub, p]) => [p, hub]));
  canonicalHubByPath.set("/promotions/lottery", "促销中心");

  let ts = `/** 由 scripts/build-module-settings-catalog.mjs 根据 docs/配置归类-终版.md + docs/配置归类-分组映射.csv 生成，请勿手改 */\n\n`;
  ts += `export interface ModuleSettingCatalogItem {\n`;
  ts += `  id: string;\n`;
  ts += `  /** 二级导航与卡片区块标题（映射表 groupTitle） */\n`;
  ts += `  groupTitle: string;\n`;
  ts += `  /** 分组路由 slug（映射表 groupKey） */\n`;
  ts += `  groupKey: string;\n`;
  ts += `  /** 功能场景描述原文 */\n`;
  ts += `  sceneDesc: string;\n`;
  ts += `  /** 功能模块（终版表，向下填充） */\n`;
  ts += `  moduleName: string;\n`;
  ts += `  /** 功能（tooltip） */\n`;
  ts += `  feature: string;\n`;
  ts += `  /** 功能设置（设置项名称） */\n`;
  ts += `  title: string;\n`;
  ts += `  seq: number;\n`;
  ts += `}\n\n`;
  ts += `export interface ModuleSettingCatalogHub {\n`;
  ts += `  hubTitle: string;\n`;
  ts += `  settingsPath: string;\n`;
  ts += `  /** 二级导航分组展示顺序（可选） */\n`;
  ts += `  groupOrder?: string[];\n`;
  ts += `  items: ModuleSettingCatalogItem[];\n`;
  ts += `}\n\n`;
  ts += `export interface ModuleSettingCatalogGroup {\n`;
  ts += `  groupKey: string;\n`;
  ts += `  groupTitle: string;\n`;
  ts += `  items: ModuleSettingCatalogItem[];\n`;
  ts += `}\n\n`;

  ts += `export const MODULE_SETTINGS_BY_PATH: Record<string, ModuleSettingCatalogHub> = {\n`;

  const paths = [...byPath.keys()].sort((a, b) => a.localeCompare(b));
  let itemCount = 0;

  for (const settingsPath of paths) {
    const bucket = byPath.get(settingsPath);
    const hubTitle = canonicalHubByPath.get(settingsPath) ?? settingsPath;
    bucket.items.sort((a, b) => a.seq - b.seq);
    itemCount += bucket.items.length;

    const groupOrder = SETTINGS_GROUP_ORDER_BY_PATH[settingsPath];
    ts += `  ${JSON.stringify(settingsPath)}: {\n`;
    ts += `    hubTitle: ${JSON.stringify(hubTitle)},\n`;
    ts += `    settingsPath: ${JSON.stringify(settingsPath)},\n`;
    if (groupOrder) {
      ts += `    groupOrder: ${JSON.stringify(groupOrder)},\n`;
    }
    ts += `    items: [\n`;
    for (const it of bucket.items) {
      const id = `s${it.seq}-${it.groupKey}-${slugify(it.title)}`.slice(0, 80);
      ts += `      { id: ${JSON.stringify(id)}, groupTitle: ${JSON.stringify(it.groupTitle)}, groupKey: ${JSON.stringify(it.groupKey)}, sceneDesc: ${JSON.stringify(it.sceneDesc)}, moduleName: ${JSON.stringify(it.moduleName)}, feature: ${JSON.stringify(it.feature)}, title: ${JSON.stringify(it.title)}, seq: ${it.seq} },\n`;
    }
    ts += `    ],\n`;
    ts += `  },\n`;
  }

  ts += `};\n\n`;

  ts += `export function getModuleSettingsBasePath(path: string): string | undefined {\n`;
  ts += `  for (const settingsPath of Object.keys(MODULE_SETTINGS_BY_PATH)) {\n`;
  ts += `    if (path === settingsPath || path.startsWith(\`\${settingsPath}/\`)) return settingsPath;\n`;
  ts += `  }\n`;
  ts += `  return undefined;\n`;
  ts += `}\n\n`;
  ts += `export function getModuleSettingsCatalog(path: string): ModuleSettingCatalogHub | undefined {\n`;
  ts += `  const base = getModuleSettingsBasePath(path);\n`;
  ts += `  return base ? MODULE_SETTINGS_BY_PATH[base] : undefined;\n`;
  ts += `}\n\n`;

  ts += `/** 组内自定义排序（由 scripts/lib/settings-intra-group-sort.mjs 生成） */\n`;
  ts += `const MODULE_SETTINGS_INTRA_SORT: Record<number, number> = {\n`;
  for (const [seq, sortInGroup] of [...INTRA_GROUP_SORT_BY_SEQ.entries()].sort((a, b) => a[0] - b[0])) {
    ts += `  ${seq}: ${sortInGroup},\n`;
  }
  ts += `};\n\n`;
  ts += `function compareItemsInSameGroup(a: ModuleSettingCatalogItem, b: ModuleSettingCatalogItem): number {\n`;
  ts += `  if (a.groupKey !== b.groupKey) return 0;\n`;
  ts += `  const oa = MODULE_SETTINGS_INTRA_SORT[a.seq];\n`;
  ts += `  const ob = MODULE_SETTINGS_INTRA_SORT[b.seq];\n`;
  ts += `  const hasA = oa !== undefined;\n`;
  ts += `  const hasB = ob !== undefined;\n`;
  ts += `  if (hasA && hasB && oa !== ob) return oa - ob;\n`;
  ts += `  if (hasA !== hasB) return hasA ? -1 : 1;\n`;
  ts += `  return a.seq - b.seq;\n`;
  ts += `}\n\n`;
  ts += `export function groupCatalogItemsByCategory(\n`;
  ts += `  items: ModuleSettingCatalogItem[],\n`;
  ts += `  groupOrder?: string[],\n`;
  ts += `): ModuleSettingCatalogGroup[] {\n`;
  ts += `  const discovered: string[] = [];\n`;
  ts += `  const map = new Map<string, ModuleSettingCatalogItem[]>();\n`;
  ts += `  for (const item of items) {\n`;
  ts += `    if (!map.has(item.groupKey)) {\n`;
  ts += `      map.set(item.groupKey, []);\n`;
  ts += `      discovered.push(item.groupKey);\n`;
  ts += `    }\n`;
  ts += `    map.get(item.groupKey)!.push(item);\n`;
  ts += `  }\n`;
  ts += `  const order =\n`;
  ts += `    groupOrder && groupOrder.length > 0\n`;
  ts += `      ? [\n`;
  ts += `          ...groupOrder.filter((k) => map.has(k)),\n`;
  ts += `          ...discovered.filter((k) => !groupOrder.includes(k)),\n`;
  ts += `        ]\n`;
  ts += `      : discovered;\n`;
  ts += `  return order.map((groupKey) => {\n`;
  ts += `    const groupItems = map.get(groupKey)!.slice().sort(compareItemsInSameGroup);\n`;
  ts += `    return { groupKey, groupTitle: groupItems[0]?.groupTitle ?? groupKey, items: groupItems };\n`;
  ts += `  });\n`;
  ts += `}\n`;

  return { ts, itemCount, paths: paths.length, total: rows.length };
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md);
const mapping = loadGroupMapping();
const { ts, itemCount, paths, total } = buildCatalog(rows, mapping);
fs.writeFileSync(outPath, ts, "utf8");
console.log(`Wrote ${outPath} | source: ${total} | catalog: ${itemCount} | paths: ${paths}`);
if (itemCount !== total) {
  process.exitCode = 1;
}
