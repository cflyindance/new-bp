# 商家订阅“更多”Popover 验证记录

- 日期：2026-10-30
- 变更编号：`SUBSCRIPTION-MORE-POPOVER-20261030-101`
- 功能分支：`codex/subscription-more-popover-20261030`
- 起始基线：`main@e7d38635`
- 工作目录：`C:\Users\27273\.codex\worktrees\subscription-more-popover-20261030\new-bp\admin-web`
- 功能预览：`http://127.0.0.1:61437/#/subscription-service/merchant-subscriptions`
- 服务进程：PID `86060`，Vite `6.4.1`，严格绑定端口 `61437`
- Git 状态：未提交、未合并、未推送

## 已完成验证

1. `npm.cmd run verify:subscription-service`：通过；品牌向门店继承、门店增配与历史集团忽略规则无回归。
2. `npm.cmd run verify:subscription-operations-ui`：通过；Popover DOM、共享样式类、ARIA、键盘、滚动关闭与页面绑定静态契约通过。
3. `npx.cmd tsc --noEmit`：通过；当前 worktree 通过只读 `node_modules` junction 复用同版本依赖，未修改依赖或锁文件。
4. `git diff --check`：通过。
5. 预览源核验：`/src/config/subscription-operations-ui.ts` 返回 HTTP 200，响应包含当前分支的 `data-sub-more` 与 `bindSubscriptionMoreMenus`，确认端口 61437 由本功能源码提供。

## 浏览器验收阻塞

使用 Playwright CLI 的独立 headed Chrome 会话打开目标地址后，应用按认证规则跳转到 `/#/login`。本任务约束为不使用或保存任何密码，因此未点击登录，也未绕过认证或复用其他任务身份。

以下项目尚未完成真实业务页面验收：

- 默认向下展开、视口底部向上展开及行高不变。
- 表格／页面外层滚动关闭与菜单内部滚动保持。
- 鼠标外部点击、重复点击、窗口缩放、路由切换和单实例。
- 触发器及菜单完整键盘矩阵、`Tab`／`Shift+Tab` 顺序与禁用原因读屏关联。
- 可用操作关闭菜单后进入原确认弹框／抽屉。
- `more-open-down.png` 与 `more-open-up.png` 实采截图。

三份 V1.28 需求文档继续保留本功能“待补页面图片”标记；未使用登录页、示意图或其他分支截图冒充验收证据。用户在外部浏览器完成登录后，可复用端口 61437 补齐上述验收和截图。
