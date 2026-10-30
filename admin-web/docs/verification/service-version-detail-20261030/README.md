# 服务包版本详情验证

基线main@19470be0（含远端CI构建提交）；分支codex/service-version-detail-20261030；预览端口5300；2026-10-30。

verify-service-version-detail.cjs通过：精确所选版本菜单ID、旧目录分组、快照价格与中文周期、路由文案隐藏、当前／历史标签、搜索及折叠、关闭焦点及无写入、未知历史项、只读及窄屏。

三份需求文档V1.26，变更编号SERVICE-VERSION-DETAIL-20261030-99。旧版本不包含完整历史菜单结构快照，按当前及保留目录精确ID解析，不将其他菜单补入历史集合。

原verify-service-detail-layout.cjs回归、TypeScript和git diff --check均通过；三份文档图片引用无缺失。
