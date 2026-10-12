# Payroll 更多菜单实施计划

目标：按用户已确认方案排列“更新数据｜切换员工｜更多”，菜单依次为薪资明细、导出 ADP、编辑。

架构：保留现有 data-action 事件；新增局部开关状态与右对齐菜单。无薪资数据、导出状态或权限规则变化，不自动提交。

- [ ] 修改布局契约测试，验证按钮顺序和三个菜单项顺序，先运行失败。
- [ ] 更新 native 与 standalone 模板；添加菜单样式、中文／英文标签。复用 preview-employees-detail、preview-adp-report、open-employee-identity-edit。
- [ ] 在现有 delegated click 入口处理展开／选择关闭；空白点击和 Escape 关闭，Escape 将焦点还给更多。
- [ ] 运行布局回归、类型检查和浏览器展开／关闭／原功能入口验证。
- [ ] 同步三份权威正文 V1.28，真实截图就近内嵌；如未验证则明确记录缺口。
