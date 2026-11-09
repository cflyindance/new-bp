# 自助餐列表限购周期可选列验证

基线：main@5253b17f；分支：codex/buffet-period-column-20261109。变更编号：BUFFET-LIST-20261109-03。

## 修改计划

根因：周期投影和列宽已经存在，但columnDefinitions依赖的COLUMN_GROUPS未登记period，字段设置无法展示，偏好白名单也会剔除period。

范围：在“更多信息”登记period可选列；默认隐藏，保持默认7列及固定3列。复用现有周期投影、确认／取消和version=2偏好写入。恢复默认时阻止当前点击冒泡，避免按钮重绘后被document的外部点击监听误判为关闭，保证临时默认选择可以确认。不改变规则、额度、筛选、权限或生效状态。

验证：先运行verify-buffet-period-column取得RED，再添加登记，运行该测试和列表回归；真实浏览器核对确认、取消、刷新、恢复默认及存储失败。同步唯一三份文档及字段弹层截图。

Build：skipped，局部运行时JS登记，不涉及依赖、构建、入口、资源导入或嵌入包边界。CI Build：unknown。E2E：required。

## 结果

- RED：verify-buffet-period-column在未修改源码时因“字段设置必须包含限购周期”失败。
- GREEN：登记period后专项测试通过；覆盖默认隐藏、版本1/2偏好保留及去重、单周期、组合周期、旧配置回退、非法／缺失值。
- E2E首次在“恢复默认→确认”失败。原因是renderColumns替换按钮后，冒泡至document的外部点击检测将已脱离DOM的按钮当作外部目标。阻止该次点击冒泡后，同一脚本通过。
- node scripts/verify-buffet-period-column-browser.cjs：Chrome隔离会话通过12项字段、取消不生效、确认显示、周期值、刷新保留、取消隐藏不生效、确认隐藏、恢复默认、配额失败保留旧偏好及重试。
- 87项verify-buffet-*.mjs通过；第二处修复后重新运行列表默认UI、无高级筛选及专项测试通过。TypeScript --noEmit通过，git diff --check通过。
- 外部用户Chrome实际打开5305功能预览并确认周期列显示；截图为[字段设置](../../superpowers/specs/assets/buffet-period-columns-20261109.png)。自动化另有output/playwright/buffet-period-column下截图，不作为生产资产提交。
- 生产构建未执行（未触及构建边界），CI、部署及真实POS执行未验证。规则数据、权限、保存与启用逻辑未修改。
- 首次工作区创建请求长时间停留准备阶段，改用当前干净检出创建同一main基线的独立工作区；实际实现路径为buffet-period-column-current-20261109/new-bp/admin-web，分支及基线见顶部。
