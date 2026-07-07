/**
 * 生成 docs/项目文档/评价中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-reviews-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { getSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "评价中心-设置二级导航重设计方案.md");

const HUB = "评价中心";

const titles = {
  "review-content-moderation": "评价内容治理",
};

const reasons = {
  "review-content-moderation":
    "菜品评价的批量清理与治理动作；与门店地址数据维护分离，对标评价/UGC 后台的内容 moderation 入口。",
};

const assignMap = {
  "review-content-moderation": [421],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

const SCENE_SUMMARY_OVERRIDE_BY_SEQ = new Map([
  [421, "批量删除菜品评价数据（运维/治理动作，非日常门店档案配置）"],
]);

function sceneSummary(scene, seq) {
  const override = SCENE_SUMMARY_OVERRIDE_BY_SEQ.get(seq);
  const s = override ?? (scene && scene !== "（未填写）" ? scene : "—");
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = parseConfigMd(md).filter((r) => getSettingsHub(r) === HUB);
const order = ["review-content-moderation"];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  by.get(assign.get(r.seq)).push(r);
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 评价中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0（421 自门店管理迁入；hub 覆盖见 `settings-hub-override.mjs`）  ",
  "> 数据范围：评价中心设置 catalog **1** 条（终版 seq 421 hub 为空，经 hub 覆盖挂载）  ",
  "",
  "---",
  "",
  "## 1. 背景",
  "",
  "seq **421**「删除菜品评价」原与门店「上传/删除地址数据」同组，语义属 **评价/UGC 治理**，不应出现在门店「地址数据维护」组。",
  "",
  "## 2. 推荐二级导航（1 组）",
  "",
  "| groupTitle | groupKey | 条数 | 说明 |",
  "|------------|----------|------|------|",
  `| **${titles["review-content-moderation"]}** | \`review-content-moderation\` | 1 | ${reasons["review-content-moderation"]} |`,
  "",
  "## 3. 明细",
  "",
  "| seq | 原导航 | 功能模块 | 功能设置 | 场景摘要 |",
  "|-----|--------|----------|----------|----------|",
);

for (const r of rows.sort((a, b) => a.seq - b.seq)) {
  push(
    `| ${r.seq} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc, r.seq)} |`,
  );
}

push(
  "",
  "## 4. 边界",
  "",
  "- **门店管理**：419/420 地址批量维护保留在门店「地址数据维护」；421 不再重复出现。",
  "- **评价明细/统计**：业务浏览页在评价中心主滑层；本设置页仅治理类开关/动作。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items)`);
