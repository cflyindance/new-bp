# 门店近30天营业状态验证

- 变更：STORE-BUSINESS-30D-20261110-01；2026-11-10。
- 基线：main@fd787a4009aa9b6834a6193bb889469187857f99。
- 分支：codex/store-business-status-20261110；未提交、合并或推送。
- 功能服务：http://127.0.0.1:5315/#/m-platform/merchants/stores 。目录为本 worktree 的 admin-web，不替换主线服务。

## 通过的检查

1. TypeScript：`node node_modules/typescript/bin/tsc --noEmit`。
2. 纯业务边界：`npm exec --offline -- tsx scripts/verify-store-business-status.ts`。覆盖第30日、窗外和未来日期、单独销售/小费/有效打卡、手工与不完整打卡、缺日、非法金额、过期零数据、正向证据优先、人工状态覆盖、时区跨日、MID隔离。
3. 隔离Edge集成：`node scripts/verify-store-business-integration.mjs`。覆盖写入失败快照与日志回滚、人工优先、筛选一致、MID日志、重复保存不写日志、关闭/恢复、未授权拒绝、坏事实缓存返回未知。
4. 外部有界面Edge：登录后进入真实门店列表；看到正常营业、无记录和未知；详情切换暂停成功，原有正向演示事实不覆盖暂停；恢复后重新计算；筛选无记录仅返回对应门店；创建第二步同时显示正常营业、无记录和筹备中，未创建品牌。

浏览器CLI中途发生一次会话请求超时；重新登录恢复后核对了列表。功能页面及关键交互已实采，超时不计为页面功能通过证据。

## 页面证据

- [门店管理](../../项目文档/assets/store-business-status-20261110/stores.png)
- [门店概览与状态维护](../../项目文档/assets/store-business-status-20261110/overview.png)
- [选择品牌门店](../../项目文档/assets/store-business-status-20261110/selection.png)

- [品牌门店](../../项目文档/assets/store-business-status-20261110/brand-stores.png)
- [只读详情弹框](../../项目文档/assets/store-business-status-20261110/readonly.png)

隔离Edge补采品牌门店和只读弹框，并断言只读弹框不含状态编辑控件。

## 交付边界

三份文档同步产品V1.72、研发V1.71、个人规范V1.71。当前没有生产销售、小费与考勤接口；显式演示MID使用合成事实，其他未接入门店显示未知，生产接口与定时同步仍是交付缺口。状态在页面渲染和查询时计算，未新增后台任务。旧章节无关图片未重新验收；本任务新定义以顶部近30天经营状态章节与新图为准。没有修改小费模块、eMenu或构建产物；未做生产部署验证。
