# 基础经营版演示菜单验证

基线main@d1f5af51，分支codex/basic-menu-demo-20261030，功能预览5285。默认演示包旧ID无法解析到当前菜单目录；沿用增长包保护机制，仅匹配未修改的默认包、旧v1、默认演示订阅及未改动草稿。

基础经营版v2从当前已发布菜单路由提取 /dashboard/、/orders/、/transactions/、/brand-products/、/brand-menu/、/menu/，当前38个有效节点。保留原v1、价格、订阅、账号及商业设置；不新增真实购买、不覆盖自定义或真实数据。重复执行不再迁移。

verify-basic-menu-demo.cjs通过四类菜单实际预览、长列表滚动、全部ID有效、v1不变、订阅不变、幂等和修改/草稿/真实订阅/审计/商业设置保护。TypeScript通过。截图basic-menu-preview.png和basic-menu-end.png为5285功能预览实采并视觉核验。

此为测试数据补齐，不变更产品业务定义；三份V1.11文档关联本验证记录，不递增业务版本。不自动补齐用户已自行修改的服务配置。

未提交、合并或推送。
