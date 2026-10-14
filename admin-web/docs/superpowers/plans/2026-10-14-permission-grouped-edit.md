# 全菜单同对象编辑权限合并 Implementation Plan

> **For agentic workers:** Execute inline using the already approved category-edit pattern; track steps with checkboxes.

**Goal:** 将其他页面同一对象的新增/删除/修改合并为编辑对象，保留非 CRUD 动作和真实对象边界。

**Architecture:** sourcePageActions 保留已核查来源，center-action-groups.ts 显式列举成员键和操作种类后组合。新 key 默认拒绝，旧存储不改；help 精确反映实际成员，不通过名称或 ID 前缀猜对象。

**Tech Stack:** TypeScript、Vite、Node assert、agent-browser。

**Spec:** 当前三份权限权威文档，PERM-20261014-05；用户批准其他菜单采用相同合并方式。

## Constraints

- 保存、导出、打印、复制、发布、启停、分配、批量配置等非 CRUD 独立。
- 同页面不同对象分别合并；没有实际删除时提示不包含删除；单一动作不伪造其他操作。
- 旧允许不自动升级，保留角色与门店例外旧值；本地配置/预览，不修改正式鉴权。
- 保留上一轮未提交分类改动，不提交或推送。

## Steps

- [x] 新增测试首轮 RED 缺少休息组合，后 GREEN；覆盖 28 组全部说明/来源、缺省/退役/门店/预览/保存/错误。
- [x] 显式组与 applyActionGroups 实现，完整同/跨文件来源和目录错误校验；28 新组加分类共 29 组。
- [x] 商品调味/角色来源归入同一目录，保留 staff save；源 145、组合目录 98+1=99，比 146 减少 47 控件，不减少实际控制点。
- [x] 六个权限脚本通过，导航用当前 Option 组合继续门控测试；薪资变为 17 个点；tsc 退出 0，独立 Vite build 成功（551 模块，原警告）。
- [x] 三份 V3.1/V2.1/V2.1、PERM-20261014-05，当前定义、退役映射和实际子集提示同步；历史保留。
- [x] 浏览器培训课程/评估/发布及薪资声明/PDF 独立、问号提示、预览、Esc/保存刷新通过；三张图已查看，互链核对成功。只读复核首轮两处正文问题（下单限制提示/旧独立 CRUD 验收）已修正，第二轮 Approved；不自动提交或推送。

## Self-review

不通过通用 CRUD 模板填造功能。声明保存/发布还需组合编辑授权，岗位仅新增/修改、eMenu 仅删除/修改；原有限业务状态和范围不变。
