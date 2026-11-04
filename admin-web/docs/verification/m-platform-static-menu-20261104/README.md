# M 平台静态预览菜单读取修复

编号：MENU-LOCAL-PREVIEW-20261104-01；起始 main：2de36aed。

## 根因与范围
实际入口 http://127.0.0.1:5190/#/m-platform/nav-blueprint，Python 静态服务器只托管 main/dist。生产构建的 DEV=false，旧模式函数只允许开发环境和 *.github.io 使用演示仓库，因此本机静态预览误请求 /api/m-platform/menu-document/published 并收到 404。

## 修复计划
只为 localhost、127.0.0.1、IPv6 回环 ::1 / [::1] 选择现有演示仓库。保留 GitHub Pages 与开发环境行为；其他主机仍使用 HTTP，不对接口失败做自动降级。不更改草稿、发布、菜单权限与业务数据。先失败测试，再最小修复，再测试和构建后浏览器验收。生产构建验证为 required；CI 结果 unknown。

## 验证记录
- RED：静态 localhost 应为 demo，实际 http，AssertionError。
- GREEN：verify-json-menu-repository-mode.ts 通过，覆盖回环和伪装域名、生产域名及内网地址。
- verify-json-menu-merchant-parity.ts 通过：29 个一级、277 个节点；自定义草稿与原件保留。
- verify-subscription-published-menu-tree.ts 在 Node 启动阶段报 window is not defined，未执行断言；不修改无关运行时代码。
- 主线开发预览 5197 已实际加载导航结构与 277 个节点；与静态构建验收分开记录。
- npm run build 成功（含 TypeScript），Vite 生产构建 37.37 秒；使用生成的 index-C__Iuw28.js 静态资源实测，非开发模式。
- 静态构建端口 5303：演示账号登录 → M 菜单配置 277 节点 → 刷新仍为 277，加载失败标题 0 个。
- 服务包管理 → 基础经营版菜单能力：弹框显示主页、商品中心、订单中心、支付中心等真实菜单。
- Node 订阅脚本在未修改的 main 同样报 window is not defined，确认为既有测试设施问题；主要消费者已由实际页面验证。
- 构建提示缺少未跟踪的 kiosklite/.embed-build，不影响主应用构建；本次未验证 kiosk 嵌入页面。构建产物保存到隔离 .cache/static-preview，受版本管理的生成产物已恢复到本任务基线，未改主线产物。
- 工作区：codex/m-platform-static-menu-fix-20261104，基线 main@2de36aed，开发验收时未提交；Git 交付状态以提交、合并和推送回执为准。主线开发预览 5197，功能分支静态预览 5303。

## 文档核对
配对三份菜单路由文档同步环境读取规则，版本和原菜单业务规则不变；本记录承接纯修复验证。原三份文档中的旧蓝图历史内容及截图年代问题不属于本次清理范围。
