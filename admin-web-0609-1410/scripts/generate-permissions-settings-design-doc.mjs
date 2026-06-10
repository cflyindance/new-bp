/**
 * 生成 docs/项目文档/权限管理中心-设置二级导航重设计方案.md
 * 运行：node scripts/generate-permissions-settings-design-doc.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseConfigMd } from "./lib/parse-bplant-config-md.mjs";
import { filterRowsForSettingsHub } from "./lib/settings-hub-override.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const projectDocs = path.join(root, "docs", "项目文档");
const sourcePath = path.join(projectDocs, "配置归类-终版.md");
const outPath = path.join(projectDocs, "权限管理中心-设置二级导航重设计方案.md");

const HUB = "权限管理中心";

const titles = {
  "account-security-auth": "账户安全与授权",
  "role-employee-permissions": "角色与员工权限",
};

const reasons = {
  "account-security-auth":
    "自动登出、登录规则、iPad 操作密码、企台只读菜、命中下单限制后弹密码；对标 Square/Clover 的登录安全与二次验证策略。",
  "role-employee-permissions":
    "门店角色主数据、允许开钱箱的员工；对标 Toast/Clover 的岗位权限与员工管理。",
};

/** seq → groupKey（权限管理中心 catalog 9 条；B4） */
const assignMap = {
  "account-security-auth": [75, 166, 175, 345, 346, 349, 646],
  "role-employee-permissions": [369, 426],
};

const assign = new Map();
for (const [key, seqs] of Object.entries(assignMap)) {
  for (const seq of seqs) assign.set(seq, key);
}

function inferArea(nav, mod, title) {
  const t = `${nav}${mod}${title}`;
  if (t.includes("登出") || t.includes("登录") || t.includes("密码") || t.includes("授权")) return "安全授权";
  if (t.includes("角色") || t.includes("员工") || t.includes("钱箱")) return "员工权限";
  if (t.includes("下单限制") || t.includes("次数") || t.includes("时长") || t.includes("间隔")) return "下单限制";
  if (t.includes("可看不可点") || t.includes("积分菜") || t.includes("服务员授权")) return "流程控制";
  return "权限";
}

function sceneSummary(scene) {
  const s = scene && scene !== "（未填写）" ? scene : "—";
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

const md = fs.readFileSync(sourcePath, "utf8");
const rows = filterRowsForSettingsHub(parseConfigMd(md), HUB);
const order = ["account-security-auth", "role-employee-permissions"];

const missing = rows.filter((r) => !assign.has(r.seq)).map((r) => r.seq);
if (missing.length) throw new Error(`未归类 seq: ${missing.join(", ")}`);
const extra = [...assign.keys()].filter((s) => !rows.some((r) => r.seq === s));
if (extra.length) throw new Error(`映射多余 seq: ${extra.join(", ")}`);

const by = new Map(order.map((k) => [k, []]));
for (const r of rows) {
  const key = assign.get(r.seq);
  by.get(key).push({ ...r, area: inferArea(r.nav, r.moduleName, r.title) });
}

const lines = [];
const push = (...xs) => lines.push(...xs);

push(
  "# 权限管理中心 · 设置二级导航重设计方案",
  "",
  "> 文档版本：v1.0  ",
  "> 数据范围：`docs/项目文档/配置归类-终版.md` 中 **B平台一级导航 = 权限管理中心** 共 **34** 条功能设置  ",
  "> 竞品参考：Toast / Clover / Square / Peblla / Snackpass 商家后台结构文档",
  "",
  "---",
  "",
  "## 1. 背景与目标",
  "",
  "### 1.1 现状问题",
  "",
  "| 指标 | 现状 | 问题 |",
  "|------|------|------|",
  "| 二级分组数 | **多来源分组** / 34 条 | 员工权限、下单限制、安全授权混排 |",
  "| 命名来源 | 旧模块直出 | 用户难分辨“人员权限”与“食客下单规则” |",
  "| 规则分散 | eMenu/全局/iPad/操作管理均有权限项 | 配置链路不连续、维护成本高 |",
  "",
  "### 1.2 设计目标",
  "",
  "- 二级导航收敛为 **4 组**，覆盖 34 条，符合餐饮门店权限治理链路",
  "- 输出可写入 `docs/项目文档/配置归类-分组映射.csv` 的 `groupTitle` / `groupKey`",
  "- **不修改** `配置归类-终版.md` 原文",
  "",
  "---",
  "",
  "## 2. 竞品对照（权限/安全设置维度）",
  "",
  "| 竞品 | 权限设置组织方式 | 本项目借鉴 |",
  "|------|------------------|------------|",
  "| **Toast** | 员工管理 + 权限管理 + POS 密码控制 | 角色权限与操作授权分轨 |",
  "| **Clover** | 员工角色、员工权限、安全中心 | 账户安全独立组 |",
  "| **Square** | 团队权限、登录安全、高级访问 | 登录安全与业务限制分层 |",
  "| **Snackpass** | 敏感操作密码、员工活动审计 | 关键操作授权单独分组 |",
  "| **Peblla** | 员工管理为主，业务限制在各场景页控制 | 食客下单限制单独分组 |",
  "",
  "### 2.1 权限设置四维（商户心智）",
  "",
  "```text",
  "账户安全与授权 → 角色与员工权限 → 下单操作限制与授权 → 食客下单限制规则",
  "```",
  "",
  "---",
  "",
  "## 3. 推荐二级导航结构（4 组）",
  "",
  "| 序号 | groupTitle | groupKey | 条数 | 说明 |",
  "|------|------------|----------|------|------|",
);

let total = 0;
for (let i = 0; i < order.length; i++) {
  const k = order[i];
  const n = by.get(k).length;
  total += n;
  push(`| ${i + 1} | **${titles[k]}** | \`${k}\` | ${n} | ${reasons[k]} |`);
}
push(`| | **合计** | | **${total}** | |`, "", "---", "", "## 4. 分类结果明细", "");

for (let i = 0; i < order.length; i++) {
  const k = order[i];
  push(`### 4.${i + 1} ${titles[k]}（\`${k}\`）`, "", `**归类理由**：${reasons[k]}`, "");
  push("| seq | 场景 | 原导航 | 功能模块 | 功能设置 | 功能场景描述（摘要） |");
  push("|-----|------|--------|----------|----------|----------------------|");
  for (const r of [...by.get(k)].sort((a, b) => a.seq - b.seq)) {
    push(`| ${r.seq} | ${r.area} | ${r.nav} | ${r.moduleName} | ${r.title} | ${sceneSummary(r.sceneDesc)} |`);
  }
  push("");
}

push(
  "---",
  "",
  "## 5. 与旧分组对照",
  "",
  "| 新 groupTitle | 吸收的旧分组 |",
  "|---------------|--------------|",
  "| 账户安全与授权 | 系统安全、基本设置（登录规则）、iPad密码权限、授权设置 |",
  "| 角色与员工权限 | 员工工时、角色、钱箱权限、只读菜权限 |",
  "| 下单操作限制与授权 | 自定义点单、用户设置（前置授权）、可看不可点与积分菜授权 |",
  "| 食客下单限制规则 | eMenu/全局下单限制（时长、次数、每轮数量、间隔） |",
  "",
  "---",
  "",
  "## 6. 落地步骤",
  "",
  "1. 确认本方案后运行 `node scripts/apply-permissions-settings-mapping.mjs`",
  "2. `cd admin-web && npm run build:settings-catalog`",
  "3. 权限管理中心 → 设置（`/permissions/settings`）验证",
  "",
  "### 6.1 映射表（CSV）",
  "",
  "```csv",
  "seq,groupTitle,groupKey",
);

for (const r of [...rows].sort((a, b) => a.seq - b.seq)) {
  const key = assign.get(r.seq);
  lines.push(`${r.seq},${titles[key]},${key}`);
}

push(
  "```",
  "",
  "---",
  "",
  "## 7. 边界说明",
  "",
  "- 34 条全部保留；`seq` 与终版表行号一致。",
  "- 本次仅重组权限管理中心设置，不改角色管理业务页。",
  "- 确认写入后执行 apply 脚本并重建 catalog。",
  "",
);

fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outPath} (${rows.length} items, ${order.length} groups)`);
