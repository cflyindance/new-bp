# 产品 PRD / 技术规格导出

把 Cursor 里已实现的原型逻辑，导出为可交给研发的 Markdown 套件。

设计文档：[`docs/superpowers/specs/2026-07-28-export-prd-spec-design.md`](../superpowers/specs/2026-07-28-export-prd-spec-design.md)

## 你怎么用（PM）

在 Cursor 对话中直接说，例如：

- `导出 PRD/规格：TipOut`
- `按页面导出：排班表`
- `分析 src/config/team-shift-scheduling-ui.ts 并导出`

Agent 会走项目 Skill `export-prd-spec`，产出：

```
docs/产品PRD/exports/YYYY-MM-DD-<scope>/
  ├── PRD.md    # 场景、需求、验收
  ├── SPEC.md   # 字段、状态、分支（研发主用）
  └── DIFF.md   # 意图 vs 实现差异（你拍板）
```

可选：导出前补 2～3 句业务目标；导出后只处理 DIFF / 开放问题。

## 交给研发

1. 主文件投喂 **SPEC.md**（可附 PRD.md）  
2. 对齐会用 PRD 讲场景，用 DIFF 清待决  
3. 推荐开场白：

> 请严格按 SPEC 实现工程代码；验收以 PRD 的 Given/When/Then 为准。  
> DIFF 中未关闭项不要擅自发明，标为待确认。  
> 原型代码仅作行为参考，最终以 SPEC 契约为准重写/接入真实服务。

## 手动兜底

若 Skill 未触发，可 `@docs/产品PRD/generate_spec.md`，并要求同时补齐 PRD + DIFF，输出到 `exports/` 约定目录。

## 相关路径

| 路径 | 用途 |
|------|------|
| `.cursor/skills/export-prd-spec/` | 自动导出流程与模板 |
| `exports/` | 导出产物 |
| `generate_spec.md` | 手动兜底提示词 |
