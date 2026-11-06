# 页面注册与导航编排实施计划

**Goal:** 按已确认可视化伴侣，将普通菜单的技术参数录入替换为注册页面选择。
**Architecture:** 代码清单提供只读页面目录；绑定时将技术参数转换为现有 MenuNode 字段快照。JSON 合同、原仓库、权限、订阅、发布和草稿保护不变。
**Tech Stack:** TypeScript、现有原生 DOM 编辑器、Tailwind、tsx。
**Spec:** 本轮确认的可视化伴侣 V2；产品入口为 docs/项目文档/M平台-菜单路由可视化配置设计方案.md。
**Baseline:** main@cb2549c4；codex/page-registration-navigation-20261106。

## 约束

- 页面注册不授予访问权限，不放宽订阅或平台预设。
- 不在业务 JSON 新增 pageId 字段；用精确技术快照识别注册页面，未匹配的历史数据保留兼容入口。
- 目录有子导航时不展示页面选择；新叶子必须选择页面或显式配置特殊接入。
- 新菜单自动生成 ID/Key，发布后继续锁定。普通编排隐藏技术录入，只读详情可查看。
- 本轮不提交、合并、推送；不修改 main 预览。

## Task 1：注册合同与绑定

- [ ] 新建 src/config/page-registration-domain.ts：PageRegistration、校验、搜索、精确匹配、快照绑定。
- [ ] 新建 src/config/page-registration-catalog.ts 与 page-registrations.ts：复用已有路由目录，研发清单可显式覆盖同路径元信息，冲突阻止构建目录。
- [ ] scripts/verify-page-registration.ts：断言重复标识/路径、停用项、搜索、绑定不丢权限和扩展、切换清理不兼容字段、序列化字段兼容。

## Task 2：实际编辑器交互

- [ ] 新建 page-registration-ui.ts：只读目录、详情、规范、搜索筛选和选择弹框。
- [ ] json-menu-node-form-ui.ts：关联卡片、只读技术信息、特殊接入折叠入口、自动标识只读展示。
- [ ] json-menu-editor-ui.ts：导航/注册中心视角；保留编辑草稿；确认关联写入草稿并启用发布；取消不写入；Esc/遮罩/焦点约束；新建叶子取消占位路由。
- [ ] 运行 npx tsc --noEmit、注册绑定回归与现有 JSON 编辑器回归。

## Task 3：文档与实际页面验收

- [ ] 同步现有产品 v1.2、研发 V1.1、个人 V1.1，同一变更 PAGE-REG-20261106-01；逐操作清单列入个人版。
- [ ] 功能端口 65262 从本工作树启动。浏览器验证目录、搜索、只读详情、选页/取消/发布状态/刷新后识别、特殊兼容与旧 JSON。
- [ ] 将真实功能页面截图置于对应操作章节；无法验证项明确记录，不用原型图冒充。
- [ ] 核对本任务 diff 与源工作树；交付目录、基线、功能预览 URL 和未闭合项。
