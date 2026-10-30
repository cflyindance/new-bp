# 商业权益统一操作验证

- 变更编号：SUBSCRIPTION-ENTITLEMENT-ACTIONS-20261030-102；三份需求文档V1.29。
- 起始main：2692eae7（包含本地尚未推送的“更多”浮层功能）；远端核验origin/main为e7d38635。
- 功能分支：codex/subscription-entitlement-actions-20261030；提交、合并与推送结果以Git日志及交付记录为准。
- 目录：C:/Users/27273/.codex/worktrees/subscription-entitlement-actions-20261030/new-bp/admin-web。
- 服务：Vite，PID19820，端口61438；目标URL：http://127.0.0.1:61438/#/m-platform/permissions/merchant-subscriptions。
- 浏览器：Playwright CLI独立headed Chrome；通过页面预填演示登录按钮登录；验收写入仅发生在该隔离浏览器的演示存储。

## 已验证

1. TypeScript --noEmit、verify:subscription-service、verify:subscription-operations-ui通过。
2. npx.cmd tsx scripts/verify-subscription-entitlement-actions.ts：免费/试用/付费/赠送操作矩阵、下架、无效日期、到期边界与指定门店影响测试通过。
3. npx.cmd tsx scripts/verify-service-entitlements.ts：现有免费/试用/正式权益、范围、价格快照与菜单隔离回归通过。
4. Playwright CLI执行scripts/verify-subscription-entitlement-browser.js：鼠标打开更多、赠送空白原因拒绝且不写入、有效原因延期及审计、付费续期取消、试用转付费弹框、到期新ID及历史空档、停用影响提示、详情/操作记录、免费/试用/到期续期存储拒绝、只读浏览与写入拒绝全部通过。
5. 指定门店提供A/B两菜单：停用时provided=2/lost=2/retained=0；存在同范围其他来源时为2/0/2。全部品牌及两店为6/6/0，未把指定门店扩大到品牌或其他门店。

## 图片与交付缺口

| 操作 | 实采图片 | 覆盖状态 |
| --- | --- | --- |
| 四种方式操作布局 | list.png | 已采集 |
| 更多浮层 | more.png | 已采集免费记录展开态 |
| 付费续期 | paid-renewal.png | 已采集确认前；取消不写入已验证 |
| 延长赠送 | gift-extension.png | 已采集确认前；原因校验及成功审计已验证 |
| 试用转付费 | trial-paid.png | 已采集确认前 |
| 到期再次开通 | expired-reopen.png | 已采集确认前；新ID与原记录不变已验证 |
| 停用 | disable.png | 已采集确认前；取消已验证 |
| 详情/操作记录 | detail.png / audit.png | 已采集 |

独立截图缺口：各写操作的成功结果、字段错误、只读状态、再次赠送及免费重新开通的独立结果图未逐项采集；不据此宣称全部操作截图完整。其他既有文档截图缺口保留。

浏览器无业务脚本pageerror。控制台存在预览环境KPOS profile接口502及公网IP服务失败，这些不是本功能写入依赖；未进行真实合同、付款或线上验证。
