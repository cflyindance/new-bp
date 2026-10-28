# 商户管理中心命名核验

变更编号：MERCHANT-LABELS-20261028-56。
共同基线：main@e24e492f；功能分支codex/merchant-center-labels-20261028，5252。
文档版本：产品V1.53、研发V1.52、个人规范V1.52。

范围：M平台模块与子导航标题、品牌与门店入口名称、页面所属模块和相关中英文文案。merchants/brands/stores资源ID、路由、权限和保存逻辑均不变化。B平台菜单名称不在范围内。

| 操作 | 实际结果 | 截图 |
| --- | --- | --- |
| 进入商户管理中心 | 子导航标题商户管理中心，显示品牌管理与门店管理 | navigation.png |
| 点击门店管理 | 地址/m-platform/merchants/stores，标题门店管理 | stores.png |
| 点击品牌管理 | 地址/m-platform/merchants，标题品牌管理 | brands.png |

截图目录：../../项目文档/assets/merchant-center-labels-20261028/；三份正文已就近内嵌。本轮导航不产生保存或取消弹框，失败及权限受限仍使用既有规则。
验证：TypeScript noEmit、M权限域回归及隔离浏览器导航检查通过，页面错误0。图像已人工查看。
既有生产认证、外部同步及M/B授权分层缺口未在本轮修复；旧页面操作图含当时导航文案，不作为本轮新命名的截图证据。
未提交、合并或推送；Word未重新导出。
