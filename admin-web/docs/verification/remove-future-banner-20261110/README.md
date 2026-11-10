# M/B顶部未来版本说明条移除验证

变更：SHELL-BANNER-REMOVE-20261110-01；日期：2026-11-10。
基线main@ec3da845519c9ff920c16106017757ec86ef0eb8；分支codex/remove-future-banner-20261110。
实际目录：C:/Users/27273/.codex/worktrees/remove-future-banner-20261110/new-bp/admin-web。
功能预览：http://127.0.0.1:5316/#/m-platform/merchants 。未提交、合并或推送；原有主线服务未替换。

## 实际验证

- TypeScript检查通过：`node node_modules/typescript/bin/tsc --noEmit`。
- 源码搜索确认没有共享提示组件引用、渲染节点或中英文专用文案。
- 外部有界面Edge完成正常登录和首次业态/产线引导，再验证实际后台；最初未完成引导的等待超时不计作功能失败或通过。
- M列表、M独立详情、B复杂版本、英文、MVP及代登录六种场景均没有提示节点或文案，壳层顶部偏移为0；页面没有未捕获异常。
- 代管业务提示仍存在且位于顶部；没有改变版本过滤、导航标记或菜单授权。
- 四张真实页面截图分别位于[截图目录](../../项目文档/assets/remove-future-banner-20261110)，场景结果见[results.json](results.json)。

三份商户管理中心文档同步产品V1.73、研发V1.72、个人规范V1.72。旧章节历史截图没有批量重拍，新顶部效果以本次页面顶部章节和新图为准。未修改eMenu源码或构建产物，未进行生产部署验证。
