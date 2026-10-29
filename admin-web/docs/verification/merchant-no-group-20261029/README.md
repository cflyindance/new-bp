# 商户管理中心取消集团维度：验证与交付记录

变更编号：MERCHANT-NOGROUP-20261029-61。2026-10-29。

## 版本与范围

- 起始main：1716dfc44e950d383c35505d3d9cffbce7d5dc94；该本地主线含已确认但未推送的成果，不回退origin/main。
- 功能分支：codex/merchant-no-group-20261029；目录D:/Projects/new-bp-worktrees/merchant-no-group-20261029/admin-web。
- 预览：http://127.0.0.1:5256/#/m-platform/merchants；功能分支未提交状态，非main预览。
- 三份当前文档：产品V1.58、研发V1.57、个人规范V1.57；共同业务基线为M直接管理品牌与门店，Enterprise保留租户隔离，历史集团键仅兼容。
- 原三份全文保存在history目录，历史图链接指向原资产；不作为当前规则入口。

## 已验证

| 检查 | 结果与证据 |
| --- | --- |
| TypeScript | tsc --noEmit通过。 |
| M权限 | verify-m-platform-permissions.ts通过；6模块、19页面、50资源。旧集团grant不产生访问权。 |
| 筛选回归 | verify-management-filters.mjs通过；1600／1280／1024／768宽度、查询重置、日期校验、返回保留、品牌过滤和继承生效菜单组合。 |
| 页面 | 品牌／门店列表、品牌概览、创建三步、核对、创建成功、关联弹框均无集团控件或列。 |
| 创建 | 不传groupId创建成功；选取同Enterprise、不同历史集团的独立店成功；MID保留、新关联继承菜单。 |
| 门店关联 | 同Enterprise跨历史集团成功；跨Enterprise、已有其他品牌归属和过期版本拒绝，失败快照不变。 |
| 兼容 | 历史集团对象、前三品牌原集团键、菜单和Admin记录保留；旧筛选groupId不影响结果。 |
| 旧地址 | groups、groups/new、groups/legacy/edit均规范到品牌管理，不显示集团表单。 |
| 控制台 | 独立浏览器上下文全流程无pageerror；result.json保存关键布尔断言。 |
| 视觉检查 | 实采brands、create、association、org-tree截图检查，未见集团业务维度控件；Enterprise租户选择与数据名称中的集团字样不等于集团维度。 |

执行脚本：scripts/verify-merchant-no-group.cjs，使用独立临时浏览器上下文，关闭后销毁；仅修改该上下文演示数据。可用BRAND_PREVIEW_URL和PLAYWRIGHT_MODULE指定环境。截图置于docs/项目文档/assets/merchant-no-group-20261029。

## 独立缺口清单

1. 本轮重采品牌／门店列表、品牌概览、创建／核对／成功、关联、旧地址、组织树、报表及全局变更记录。其余文档中的旧操作截图可能包含已移除的集团导航或背景列；这些旧图片只供原操作定位，不能证明当前导航或集团字段仍存在。后续逐操作重采尚未覆盖，未声明全图最新。
2. 既有M/B菜单数据统一、两层门店授权上限、真实生产鉴权与外部资料同步等未闭合项沿用原文档清单，本任务不声称解决；不恢复已移除的申请／待办。
3. 历史集团键和底层兼容方法仍存在；未做破坏性迁移，也未调整商家后台其他集团视角。原集团权限grant只作未知旧键保留。
4. 未修改vendor/emenu-new，不涉及嵌入包重建。未执行生产构建、CI或部署验收。
5. Git交付状态以提交记录及交付回复为准；本次用户授权提交、合并，未授权推送。本轮功能预览仅提供外部浏览器URL，不打开Codex应用内预览。
