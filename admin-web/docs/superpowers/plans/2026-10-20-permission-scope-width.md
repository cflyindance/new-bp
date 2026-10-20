# 授权范围宽度与选项调整

已确认：指定门店与品牌的选择弹框宽度一致；新范围移除动态区域。基线main@c97b1534，含已合并未推送品牌选择功能，不回退origin/main。不自动提交/合并/推送。

范围：bindScopePicker创建即应用统一920px/96vw宽度，不随模式切换缩放；scopePickerOptions新分配仅stores/brand-stores。旧regions绑定只显示禁用选项“原授权范围（保留）”及只读原范围ID，readScope仍返回原regions，不转换或清空；用户明确选stores/brand-stores后确认转换。旧brands兼容不变。

执行记录：新增断言先因仍含regions选项失败；实现后6项专项/相关回归、TypeScript、diff检查及Vite隔离构建通过（仅原包体/混合导入提示）。基线/HEAD c97b1534，分支codex/permission-scope-width-20261020，改动未提交。功能预览58215来源本worktree；main仍为原58183，不覆盖旧功能58214。浏览器实页宽度、交互及新截图待补，脚本不代替实页验收。

- [ ] 扩展brand-store-picker专项：新选项无regions，旧regions仅禁用保留项，初始只读无checkbox读取导致清空，宽度类固定。
- [ ] 修改picker及动态旧范围转换确认，其他选中/搜索/跨品牌快照行为不变。
- [ ] 更新产品V3.44/研发V2.44/个人V2.44，替换动态区域作为新选项的有效定义。
- [ ] 回归、tsc、diff、隔离构建；功能预览58215，原main58183及品牌预览58214保持隔离，实页截图待补。
