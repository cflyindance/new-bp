# “菜单与购物车展示”排序与产线范围实施计划

> 依据：`docs/superpowers/specs/2026-08-10-guest-menu-cart-display-order-line-scope-design.md`

## 实施顺序

1. 保存目标文件当前差异基线，新增聚焦验证脚本，断言 18 项顺序、逐项产线、枚举文案、唯一 scope owner、registry 类型、三态读取和 seq 607 开关镜像隔离；先运行取得 RED。
2. 新增本分组 18 项的显式产线范围 SSOT 和 presence-aware JSON 三态读取辅助能力。
3. 将菜单结构、类名、图片模式、菜详情、字体、账户积分、积分菜及购物车组件改为读取逐 seq 范围；保留各自专用交互。
4. 为 seq 517、526 增加 enabled-lines 字段与迁移；把 seq 607 改为行内启用唯一控制，移除可见总开关。
5. 在表单草稿、持久化草稿和按产线/AI 写入链路中统一排除 seq 607 的 lines→toggle 镜像。
6. 更新前厅分组排序 SSOT、目录描述、scope 抽取器和 storage registry 生成规则；生成后检查仅目标 18 项发生预期漂移。
7. 运行聚焦验证取得 GREEN，再运行前厅 scope、22 组 IA、lines store、类型检查和生产构建。
8. 使用本地浏览器验证完整分组顺序、代表性产线范围、三个枚举设置、保存/刷新/放弃修改、按产线视图、seq 607 旧开关键不变和控制台日志。

## 目标文件

- `src/config/module-settings-guest-menu-body-line-scope.ts`（新增）
- `src/config/module-setting-storage-state.ts`（新增）
- `src/config/module-settings-guest-menu-structure-ui.ts`
- `src/config/module-settings-guest-menu-class-name-display-ui.ts`
- `src/config/module-settings-guest-menu-image-mode-ui.ts`
- `src/config/module-settings-guest-dish-detail-display-ui.ts`
- `src/config/module-settings-guest-menu-dish-name-font-ui.ts`
- `src/config/module-settings-guest-menu-line-toggle-ui.ts`
- `src/config/module-settings-member-points-rewards-ui.ts`
- `src/config/module-settings-guest-menu-cart-ui.ts`
- `src/config/module-settings-form-ui.ts`
- `src/config/page-settings-draft.ts`
- `src/config/foh-settings-by-line-toggle.ts`
- `src/config/module-settings-toggle-ui.ts`
- `src/main.ts`
- `scripts/lib/foh-settings-groups.mjs`
- `scripts/lib/foh-line-scope-extract.mjs`
- `src/config/module-settings-catalog.ts`
- scope/registry/baseline 生成产物
- `scripts/verify-guest-menu-body-order-line-scope.ts`（新增）

## 验证命令

- `npx.cmd --yes tsx scripts/verify-guest-menu-body-order-line-scope.ts`
- `npm.cmd run generate:foh-line-scope`
- `npm.cmd run verify:foh-line-scope`
- `npx.cmd --yes tsx scripts/verify-foh-settings-22-group-ia.ts`
- `npx.cmd --yes tsx scripts/verify-foh-lines-store.ts`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `npm.cmd run build`
Build：required（修改 `src/main.ts` 中 seq 607 的设置项分派）。CI Build：unknown。
