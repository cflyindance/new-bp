---
name: export-prd-spec
description: >-
  Reverse-engineer product PRD, technical SPEC, and DIFF markdown from implemented
  prototype code in this repo. Use when the user asks to 导出 PRD、导出规格、生成需求文档、
  从代码生成 PRD/SPEC、export PRD/spec, or hand off vibe-coded features to engineering.
---

# 从原型导出 PRD + SPEC

依据设计：`docs/superpowers/specs/2026-07-28-export-prd-spec-design.md`。

## 何时使用

用户要求把已实现的原型/业务逻辑导出为可交给研发的文档时立即使用本 Skill。

## 必读参考（按需打开）

- [references/analysis-checklist.md](references/analysis-checklist.md) — 挖证据
- [references/spec-template.md](references/spec-template.md) — SPEC 章节
- [references/prd-template.md](references/prd-template.md) — PRD 章节
- [examples/tipout-mini.md](examples/tipout-mini.md) — 粒度与编号样例

## 硬性约束

1. **必须产出三件套**：`PRD.md` + `SPEC.md` + `DIFF.md`，禁止只写摘要
2. **未给范围先问清**，禁止整仓盲扫
3. **不编造**无证据的 API / 表结构；无则写 `N/A` 或「建议契约」并进 DIFF（推测）
4. 简体中文；代码标识符保留英文
5. 输出目录：`docs/产品PRD/exports/YYYY-MM-DD-<scope-slug>/`（同日同范围用 `-v2`，不覆盖）

## 执行步骤（固定顺序）

### 1. 定范围

解析用户给出的：模块名 / 页面路由 / 文件或目录路径。

- 推导 `scope-slug`（小写短横线）与需求前缀（大写 3～5 位，如 `tipout`→`TIP`，`team-shift-scheduling`→`SCHED`）
- 文件较多时：先列出拟分析路径，请用户确认后再继续

### 2. 收证据

按 [analysis-checklist.md](references/analysis-checklist.md) 与本仓库优先级阅读：

```
types/enums/constants → store/factory/api mock → *-ui.ts
→ permissions/scope → 路由/导航注册 → docs/ 已有设计
```

同时检索 `docs/项目文档`、`docs/superpowers/specs`、范围内既有 PRD。

### 3. 建需求编号

格式 `<PREFIX>-<序号>`（`TIP-01`）。同一次导出前缀固定；多页面时序号在 scope 内全局递增，**不用** `P1-01` 页面前缀。表格列结构对齐 TipOut（编号/类型/描述/关联）。

### 4. 写 SPEC.md

以代码为准，套用 [spec-template.md](references/spec-template.md)。关键字段/状态/分支旁注明证据路径。

### 5. 写 PRD.md

套用 [prd-template.md](references/prd-template.md)。缺意图处标「待产品补充」。验收用 Given/When/Then，编号与 SPEC 互链。

### 6. 写 DIFF.md

分类：代码有意图未清 / 意图有代码未做 / 行为冲突 / 推测项。每条含证据与建议处理。

### 7. 自检门禁（全部通过再交付）

| 门禁 | 要求 |
|------|------|
| 证据可追溯 | 关键逻辑有路径或符号 |
| 编号闭环 | PRD↔SPEC 可互指 |
| 无空章节滥竽 | 不适用写 N/A + 原因 |
| 推测显式化 | 进 DIFF |
| 研发可执行 | SPEC 有字段表 + 状态/分支 + 异常 |
| 三件套齐全 | 写入约定目录 |

### 8. 交付

写入 exports 目录后，向用户简短汇报：

- 产物路径
- DIFF / 开放问题中需拍板的项
- 交给研发时建议主投喂 `SPEC.md`

用户裁决 DIFF 后若要求更新，可原地改三份并加文首变更记录。

## 手动兜底

Skill 不可用时，可引用 `docs/产品PRD/generate_spec.md`（应与 spec-template 对齐），但仍应尽量补齐 PRD + DIFF。
