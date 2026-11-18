# 品牌管理列表UI验收

日期：2026-11-18；变更BRAND-LIST-UI-20261118-01。

## 基线与运行

- 独立目录：C:/Users/27273/.codex/worktrees/brand-management-ui-20261118/new-bp/admin-web。
- 分支：codex/brand-management-ui-20261118；起始main@a06ba365c6d63ef188db5f8cc284f5fc0d60546b。
- 开始前已fetch origin main；本地main包含origin/main@8db2d806，另有已合入的两条本地提交，未丢弃或退回远端版本。
- 功能服务：Vite源码，http://127.0.0.1:5336/#/m-platform/merchants；原有主线及其他任务服务未替换。
- 未提交、合并、推送。未改eMenu源码、嵌入包、依赖清单或构建产物。

## 界面与实现映射

用户参考图是商户管理中心品牌管理列表；按该页面实现。保留现有导航与品牌数据，不加入设计稿中的“占位”导航或虚构品牌。新增品牌、详情、菜单、关联门店和代登录继续原有业务上下文。

- `brand-management-list.ts/css`：列表、实时筛选、日期草稿、行操作浮层及作用域样式。
- `enterprise-merchant-ui.ts`：使用新列表；委托事件保持代登录Loading和现有会话处理。
- `m-platform-shell.ts`：仅品牌列表启用白色圆角内容区及灰色侧栏，主题按钮使用既有绑定。
- `m-platform-runtime.ts`：只读筛选与更多按钮允许浏览，原写入及代登录操作守卫保持。

## 验证

- TypeScript：`node node_modules/typescript/bin/tsc --noEmit`。
- 外部有界面Edge：`node scripts/verify-brand-management-ui.mjs`，使用隔离浏览器上下文，不修改用户现有账号权限或预览草稿。
- 覆盖默认17条既有品牌、忽略遗留隐藏筛选、搜索防抖/回车、空结果/重置、状态与阶段筛选、刷新保留、日期校验/放弃草稿/应用/清除、浮层位置/关闭/键盘焦点、详情/菜单/关联门店跳转、代登录、主题、窄屏、只读筛选与写入限制。
- 逐场景断言结果见[results.json](results.json)，不以截图替代业务断言。默认页、日期错误、操作浮层、空结果、只读、深色和窄屏图片在[截图目录](../../项目文档/assets/brand-management-ui-20261118)。
- 尝试使用外部Chrome工具自动打开交付预览超时；功能页面已在外部有界面Edge验证，可直接使用预览链接。

## 文档与边界

三份文档同步产品V1.74、研发V1.73、个人规范V1.73，更新有效列表定义与截图，移除已被当前定义覆盖的旧筛选/列表操作重复段。其他模块及无关历史图片未整体验收。当前原型既有M/B后端及订阅/权限存储接入缺口未因样式更新而解决；没有生产部署或物理设备验收。
