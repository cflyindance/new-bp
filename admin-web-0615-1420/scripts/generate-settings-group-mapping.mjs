/**
 * 根据 docs/配置归类-终版.md 生成/更新 docs/配置归类-分组映射.csv（初稿规则，供人工修订）
 * 运行：node scripts/generate-settings-group-mapping.mjs
 *       node scripts/generate-settings-group-mapping.mjs --check  # 仅校验行数
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd, slugify } from "./lib/parse-bplant-config-md.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const repoDocs = path.join(root, "..", "docs");
const projectDocs = path.join(repoDocs, "项目文档");
const sourcePath = [projectDocs, repoDocs]
  .map((d) => path.join(d, "配置归类-终版.md"))
  .find((p) => fs.existsSync(p));
const outPath = [projectDocs, repoDocs]
  .map((d) => path.join(d, "配置归类-分组映射.csv"))
  .find((p) => fs.existsSync(p))
  ?? path.join(projectDocs, "配置归类-分组映射.csv");

/** 从功能场景描述提取短分组名（初稿；最终以 CSV 人工修订为准） */
const SCENE_THEME_RULES = [
  [/送厨|送厨/i, "送厨策略"],
  [/单号|订单号/i, "单号规则"],
  [/等位|叫号|排队/i, "等位叫号"],
  [/短信|语音|消息|通知/i, "消息通知"],
  [/打印|小票|收据|票据/i, "打印与票据"],
  [/库存|购货|采购|供应商/i, "库存采购"],
  [/权限|密码/i, "操作权限"],
  [/支付|刷卡|小费|结账/i, "支付流程"],
  [/报表|总报表/i, "报表展示"],
  [/地图|地址/i, "地址与地图"],
  [/语言/i, "语言"],
  [/礼品卡/i, "礼品卡"],
  [/会员/i, "会员"],
  [/菜单|点单|加菜|分单/i, "点单与菜单"],
  [/预约/i, "预约提醒"],
  [/集成|对接|callback|Callback|API|Datahub/i, "集成对接"],
  [/屏保|封面|LOGO|广告/i, "界面展示"],
  [/设备|打印机|钱箱|License|license/i, "设备与硬件"],
  [/税率|税/i, "税务"],
  [/折扣|促销|营销/i, "营销促销"],
];

function isBlankScene(scene) {
  return !scene || scene === "（未填写）";
}

function themeFromScene(scene) {
  if (isBlankScene(scene)) return "";
  for (const [re, label] of SCENE_THEME_RULES) {
    if (re.test(scene)) return label;
  }
  let s = scene.replace(/^[设置控制是否]+/, "").trim();
  const cut = s.split(/[，。；;.]/)[0] ?? s;
  s = cut.slice(0, 8);
  return s.length >= 2 ? s : "";
}

function proposeGroupTitle(row) {
  if (row.settingGroup) return row.settingGroup.slice(0, 12);
  if (row.moduleName && row.moduleName.length <= 12) return row.moduleName;
  const theme = themeFromScene(row.sceneDesc);
  if (theme) return theme.slice(0, 12);
  if (row.moduleName) return row.moduleName.slice(0, 12);
  if (row.nav && row.nav.length <= 12) return row.nav;
  return "其他";
}

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function readExistingMapping() {
  if (!fs.existsSync(outPath)) return new Map();
  const text = fs.readFileSync(outPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const map = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.startsWith("seq,")) continue;
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
    const seq = Number(parts[0]);
    if (!seq) continue;
    map.set(seq, {
      groupTitle: parts[1] ?? "",
      groupKey: parts[2] ?? "",
    });
  }
  return map;
}

const checkOnly = process.argv.includes("--check");
const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md);
const existing = readExistingMapping();

const usedKeysByPath = new Map();
const outputRows = [];

for (const row of rows) {
  let groupTitle;
  let groupKey;

  if (existing.has(row.seq) && existing.get(row.seq).groupTitle) {
    groupTitle = existing.get(row.seq).groupTitle;
    groupKey = existing.get(row.seq).groupKey || slugify(groupTitle);
  } else {
    groupTitle = proposeGroupTitle(row);
    groupKey = slugify(groupTitle);
  }

  const pathKey = row.hub;
  const hubKeys = usedKeysByPath.get(pathKey) ?? new Map();
  if (hubKeys.has(groupKey) && hubKeys.get(groupKey) !== groupTitle) {
    let n = 2;
    while (hubKeys.has(`${groupKey}-${n}`)) n++;
    groupKey = `${groupKey}-${n}`;
  }
  hubKeys.set(groupKey, groupTitle);
  usedKeysByPath.set(pathKey, hubKeys);

  outputRows.push({ seq: row.seq, groupTitle, groupKey });
}

if (checkOnly) {
  console.log(`mapping rows: ${outputRows.length}, source rows: ${rows.length}`);
  process.exit(outputRows.length === rows.length ? 0 : 1);
}

const header = "seq,groupTitle,groupKey";
const body = outputRows.map((r) => `${r.seq},${escapeCsvCell(r.groupTitle)},${escapeCsvCell(r.groupKey)}`).join("\n");
const comment = "# 由 scripts/generate-settings-group-mapping.mjs 生成；groupTitle 为设置页二级导航名称。可手改，勿改 seq。\n";
fs.writeFileSync(outPath, `${comment}${header}\n${body}\n`, "utf8");
console.log(`Wrote ${outPath} (${outputRows.length} rows)`);
