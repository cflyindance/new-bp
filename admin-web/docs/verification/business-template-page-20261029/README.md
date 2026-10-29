# 业态与菜单模板独立页面验证

BUSINESS-TEMPLATE-PAGE-20261029-71。接续未提交的BUSINESS-TYPE-MAINTENANCE-20261029-70；目录D:/Projects/new-bp-worktrees/business-type-maintenance-20261029/admin-web；分支codex/business-type-maintenance-20261029；基线main@55f13b06，远端main@812692fe仅缺本地已授权合并的业态模板功能。本次保留本地main，不回退远端。

页面：http://127.0.0.1:5270/#/m-platform/business-menu-templates，功能分支未提交预览，不是main。

## 实现

- M侧栏同级入口“业态与菜单模板”，独立路由与标题，左侧业态右侧模板；新增/改名直接操作，空业态显示引导。
- 模板编辑仍复用原菜单树、草稿、发布快照和启停逻辑；新增/编辑保存后定位相应业态。
- 原平台预设入口变为链接；品牌菜单工具栏有“管理业态与模板”，沿用当前业务草稿保护。
- 权限沿用presets模块/页面及publish操作，不新增自动授权。新地址映射到同一资源，查看隐藏时导航与直达均拒绝，只读可选择业态并查看发布模板。
- 原自定义业态与模板存储键、稳定ID、发布历史和商户菜单不变，无数据迁移。

## 验证

verify-business-template-page.cjs：独立侧栏与标题/布局、原入口链接跳转、刷新存储完全一致、新增自定义业态、品牌管理链接、只读业态切换、无查看权限隐藏与直达拒绝；无pageerror。

verify-business-menu-templates.cjs已更新使用独立页面，继续验证模板草稿/发布/启停、品牌创建/编辑、独立门店范围、审计来源及版本冲突。

verify-business-type-maintenance.cjs已更新使用左侧业态管理，继续验证新增/改名/菜单绑定、品牌选项和只读写入拒绝。

tsc --noEmit、verify-m-platform-permissions.ts（资源仍为7模块/19页面/51资源）、diff检查。

![独立页面](./standalone-page.png)

![自定义业态](./custom-type-page.png)

## 边界

沿用项目本地存储原型，正式后端鉴权/并发事务/跨设备同步仍未实现；编辑弹框继续保留未保存保护。没有独立新增一套角色资源；若需要单独授权“平台预设”和“业态模板”，应单独定义权限迁移，默认拒绝新增资源，不能自动扩大角色。

用户已授权提交、合并及推送，交付提交以Git历史为准。文档：业态菜单模板三份V1.2、商户管理产品V1.68/研发及个人规范V1.67、平台预设入口v1.3。
