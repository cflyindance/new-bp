# 业态菜单模板实现计划

基线main@812692fe；分支codex/business-menu-templates-20261029；变更BUSINESS-MENU-TEMPLATES-20261029-69。

1. business-menu-template-store：维度、默认模板、草稿/发布历史、启停、并发校验与发布权限；单独于原平台推荐运行时。
2. business-menu-template-ui：批量选择工具栏、只读树、替换/补充差异确认与收费提醒、手动差异来源；不改变服务权益。
3. business-menu-template-manager：平台预设管理入口与编辑器，复用菜单选择器；发布操作权限独立，取消保护草稿。
4. brand-access-ui与merchant-store：创建/品牌编辑/独立门店接入、继承隐藏、门店视角存储上限、最终保存审计来源。
5. verify-business-menu-templates浏览器回归、类型检查、品牌授权及菜单重复回归；截图与三份当前态文档同步，记录后端差距。本任务未获Git提交/合并/推送授权。
