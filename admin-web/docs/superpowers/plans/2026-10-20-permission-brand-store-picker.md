# 品牌分组门店选择 Implementation Plan

**Goal:** 品牌真实名称与门店左右选择，保存静态门店范围，保持旧动态授权。

**Architecture:** center-brand-store-selection.ts纯状态/投影函数；center-scope-picker.ts弹框控制器；center-ui接入read()与确认摘要；center-store读取品牌名称元数据。不改权限求值或存储schema。

**Tech Stack:** TypeScript、原生DOM、Vite、tsx。

**Spec:** ../specs/2026-10-20-permission-brand-store-picker-design.md

## Global Constraints

- 起始main@1673ea2a，独立codex/permission-brand-store-picker-20261020。
- UI brand-stores只能生成Scope.mode=stores；旧brands动态范围不自动转换。
- 已有角色、区域范围、deny及草稿保存不变；未授权Git交付。

## Tasks

执行记录：规格审查Approved；新专项先因模块不存在失败，实现后通过。11项专项/相关回归（brand-store-picker、staff-role-scope、staff-effective、staff-role-only、assign-confirm-label、role-view、authorization、navigation、no-local-copy、drawer-backdrop、staff-effective-drawer）、TypeScript、diff检查及Vite隔离构建均通过。构建只有原动态/静态导入及包体警告。新预览端口58214，基线/HEAD为1673ea2a，当前改动未提交。实际路径admin-web/.cache/permission-brand-store-picker-20261020/admin-web；main预览58183未改为功能目录。未进行真实浏览器交互或新截图验收，不能用纯模型/模板断言声称实页已通过。

- [ ] 测试先行：verify-permission-brand-store-picker.ts验证分组、默认全选/半选/清空/重访/跨品牌/空提交/静态未来门店隔离、旧动态范围保留及接入契约。
- [ ] 新增BrandStoreSelection，接口groups/active/selected/visited，activate(brand)、setBrand(brand,checked)、setStore(id,checked)、state(brand)、scope():Scope；renderBrandGroupsSummary(scope,stores,names)只读输出。
- [ ] bindScopePicker(dialog,initial,stores,names):()=>Scope管理模式和搜索，品牌栏控件不冒用name=scope，原stores/regions/旧brands读值保持；模式变化保存各自选择。
- [ ] center-store.centerBrands按当前store.brand补真实名称；center-ui分配/编辑改读controller，品牌静态摘要，原brands明确转换先确认；center.css左右布局及半选。
- [ ] 三份权限文档产品V3.43/研发V2.43/个人V2.43更新有效范围定义、逐元素/算例及图片缺口。
- [ ] 运行专项、既有员工/授权/角色/弹框回归，tsc、diff检查、Vite隔离构建；新端口58214功能预览，标注未提交和实页验证边界。
