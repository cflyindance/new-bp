# 复杂功能 CRUD · 集合变更下发记录 · 实现计划

> **依据**：`docs/项目文档/复杂功能CRUD-集合变更下发记录设计方案.md`  
> **日期**：2026-07-23  
> **关联**：层级对比预览已落地；本计划在其上扩展 `entities` 分支

---

## 分期

| 阶段 | 范围 | 说明 |
|------|------|------|
| **P0** | 基础设施 + 自定义休息 / 加班规则、餐位平面图、排班（班次 + 安排） | 三页已在 `PAGE_BATCH_SAVE_FEATURE_PATHS`，优先替换整包摘要 |
| **P1** | 角色与员工、店中店、品类 / 分类、菜单下单限制 | 复用 Adapter；补齐未进批量保存的路径 |

---

## 任务拆分

### P0 · 基础设施

1. **类型扩展** — `deployment-types.ts`  
   - 增加 `EntityChangeOp`、`EntityFieldChange`、`EntityChangeBlock`  
   - `DeploymentConfigChange` 增加 `entities?`、`changeKind?`

2. **缓冲合并** — `deployment-change-buffer.ts`  
   - 有 `entities` 时按 `entityKey` / 字段 `key` 判等与合并  
   - 重算集合摘要与 `operation`（新增 a · 修改 b · 删除 c）  
   - 保持无 `entities` 时旧逻辑不变

3. **通用 Diff** — 新建 `collection-change-diff.ts`（建议路径 `src/config/`）  
   - `CollectionAdapter<T>` + `diffCollection(baseline, draft, adapter)` → `DeploymentConfigChange | null`  
   - 统一 `format` 默认值（禁止 JSON 直出）  
   - 导出摘要 helper

4. **预览渲染** — `deployment-change-preview.ts`  
   - 有 `entities`：集合卡片 → 实体块（操作徽标）→ 字段行  
   - 无则沿用 `details` / 单行回退  
   - 确认弹窗与变更记录继续共用同一函数

5. **冒烟（基建）** — 用最小 fixture 测：create/update/delete 合并、旧记录无 `entities` 不报错

### P0 · 业务接入（按序）

6. **休息与加班** — `team-breaks-overtime-ui.ts`  
   - Adapter：`team.custom-breaks`、`team.overtime-rules`  
   - `writeConfig` 不再整包 `formatConfigDisplayValue` 记账  
   - preCommit：相对 baseline diff → `recordPageConfigChange`（带 `entities`）→ 再落库  
   - 草稿 / dirty / discard 保持现有 registry

7. **餐位平面图** — `floor-plan-ui.ts`  
   - Adapter：区域 / 桌位（两集合或带 `area:`/`table:` 前缀的单集合，按设计 §十）  
   - 字段含名称、座位数、形状、坐标、尺寸、旋转等全量 diff  
   - UI 态（选中、弹窗）不入 diff；对齐批量保存 preCommit

8. **排班** — `team-shift-scheduling-ui.ts`  
   - Adapter：`team.shift-types`、`team.shift-assignments`  
   - 安排实体复合键 `assignment:{date}:{employeeId}:{shiftId}`  
   - 替换 `writeShiftTypes` / `writeAssignments` 的整包记账

9. **P0 验收** — 对照设计文档 §九 验收点 2～6（员工可放到 P1）

### P1 · 推广

10. **角色与员工** — 嵌入 TipOut / 团队员工列表接入 Adapter + 批量保存（若尚未在 FEATURE_PATHS 则补注册）  
11. **店中店 / 品类 / 分类 / 下单限制** — 各列表页 Adapter；缺批量保存的补 `PAGE_BATCH_SAVE_FEATURE_PATHS`  
12. **P1 验收** — 设计文档 §九 全量

---

## 完成定义

- 确认变更与变更记录对 CRUD 集合展示：集合卡 → 实体块 → 字段对比  
- P0 三页无整包 JSON /「N 项」糊弄摘要作为主展示  
- 页内多次 CRUD 仅草稿；保存并下发才落库 + 一条 Batch  
- 缓冲合并正确；旧历史无 `entities` 可回退  
- 设置项 `details` 路径行为不变  

---

## 风险与注意

- 休息与加班当前在 `writeConfig` 内即时 `recordPageOrImmediateConfigChange`：改为 **仅 preCommit 记账**，避免双记  
- 平面图字段多：预览必须可滚动，勿截断  
- 排班实体量大时摘要用计数 + 实体列表滚动，勿把全部字段拼进 `before`/`after` 字符串（结构化放 `entities`）  
