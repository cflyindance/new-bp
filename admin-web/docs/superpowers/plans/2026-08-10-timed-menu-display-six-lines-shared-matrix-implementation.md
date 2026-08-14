# “按照时段显示菜单”六产线共享矩阵实施计划

> 依据：`docs/superpowers/specs/2026-08-10-timed-menu-display-six-lines-shared-matrix-design.md`

## 实施顺序

1. 新增聚焦验证脚本，先断言当前代码缺少 seq 348 应用入口、仍为三产线、仍注册为开关和 lines 数组存储，运行取得 RED。
2. 新增通用“产线 × 选项”矩阵模块，提供纯值规范化、渲染、收集与幂等绑定能力，不直接持久化。
3. 将 seq 132 的重复矩阵代码迁至共享模块，保留其旧数据与主开关迁移、存储键和显隐行为。
4. 将 seq 348 扩展为六产线，使用共享模块；移除其开关语义并直接渲染矩阵。
5. 在 `src/main.ts` 恢复 seq 348 专用渲染和挂载绑定，不添加开关联动。
6. 从通用 toggle 集合和 lines 数组存储注册来源移除 seq 348；更新 Catalog 场景说明。
7. 重新生成前厅产线 scope/registry，并更新 22 组基线中的 seq 348 场景、范围和存储注册快照。
8. 运行聚焦验证取得 GREEN，再运行共享消费者、产线范围、22 组、lines store、类型检查和生产构建回归。
9. 运行浏览器 E2E：完整设置页六行矩阵、草稿保存/取消、刷新持久化；按产线页仅当前行；seq 132 无回归。

## 目标文件

- `src/config/module-settings-product-line-option-matrix-ui.ts`（新增）
- `src/config/module-settings-order-display-seat-ui.ts`
- `src/config/module-settings-timed-menu-display-ui.ts`
- `src/config/module-settings-toggle-ui.ts`
- `src/main.ts`
- `src/config/module-settings-catalog.ts`
- `scripts/lib/foh-line-scope-extract.mjs`
- `scripts/lib/foh-settings-line-scope.seed.json`（生成）
- `src/config/foh-settings-line-scope.ts`（生成）
- `src/config/foh-settings-line-storage-registry.ts`（生成）
- `scripts/lib/foh-settings-22-group-baseline.json`
- `scripts/verify-timed-menu-display-shared-matrix.ts`（新增）

## 验证命令

- `npx.cmd --yes tsx scripts/verify-timed-menu-display-shared-matrix.ts`
- `npm.cmd run generate:foh-line-scope`
- `npm.cmd run verify:foh-line-scope`
- `npm.cmd run verify:foh-settings-22-group-ia`
- `npm.cmd run verify:foh-lines-store`
- `.\node_modules\.bin\tsc.cmd --noEmit`
- `npm.cmd run build`

Build：required（修改应用入口 `src/main.ts`）。CI Build：unknown。
