# 门店信息导航实施计划

基线：main@76150c32；分支 codex/store-information-navigation-20261016。
已确认设计：门店信息下为门店档案、营业时间、设置；LOGO 合入档案；结束提示归设置。
变更编号：STORE-INFO-20261016-01。

- [x] 使用公共滑层显示三个二级入口，原 catalog/字段/权限/订阅与草稿桶保持稳定。
- [x] 按页面筛选原设置项，档案分基本资料、联系与展示、内部编码、服务与授权信息；ADP 暂保留原位。
- [x] 更新旧书签和搜索跳转，保留字段锚点；修正营业规则引用文案。
- [x] 同步既有侧栏产品、研发、个人规范三份文档与历史方案状态。
- [x] 定向验证路由、保存桶、权限标识及真实浏览器三页、草稿跨页、离开保护和旧地址；保存截图。

验收边界：不改变时间、提示、LOGO 和主数据业务规则；额外时间沿用营业时间卡片内已有操作。用户未授权 Git 提交、合并或推送。

## 验证记录与交付状态

- TypeScript --noEmit 通过；verify-store-information-navigation、verify-permission-navigation、verify-subscription-service、verify-subscription-navigation-default 通过；git diff --check 通过。
- 浏览器：原生功能 worktree，端口 5201，三页内容、跨页网站草稿、取消离开、放弃恢复、旧 LOGO 书签及带 582 锚点书签通过。图片存于 docs/项目文档/assets/store-information-navigation。
- 额外发现并修复：空白文本首次编辑未记录草稿；带设置锚点的门店路径原本使标题／高亮失效。
- 未通过的既有检查：verify-hub-search-direct-setting-edit 在 beforeunload guard should be bound 断言失败，用 main 原始 guard 复现；catalog 生成器因 seq 558 一级导航映射缺失退出 1，用 main 原始生成器复现。生成器还产生无关 443 行差异，已保留本任务原 catalog，仅纳入所需生成模板修改，不带入无关生成结果。
- 文档：产品 V2.7、研发 V2.6、个人 V2.6，同一 STORE-INFO-20261016-01；ADP 暂留原位。
- 结束时重新 fetch：origin/main 已前进为 49549258，比本功能起始 main 多 1 个提交；本功能保持起始 76150c32 未自动合并或 rebase。未提交、未合并、未推送。
