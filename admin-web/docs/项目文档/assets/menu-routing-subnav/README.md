# 二级导航验证记录

2026-11-06，NAV-ROUTING-20261106-02。基线 main@ec151927，codex/menu-routing-subnav-20261106 未提交功能工作区，http://127.0.0.1:65263/，隔离演示会话。

| 操作 | 入口／结果图片 | 结果 |
| --- | --- | --- |
| 父入口→二级滑层 | root.png → children.png | 通过；覆盖式导航，无内嵌展开 |
| 子层返回 | children.png → root.png | 通过；业务内容不变 |
| 导航编排入口／旧地址默认 | children.png → navigation-page.png | 通过；独立地址，无页内 Tab，唯一高亮 |
| 页面注册中心入口 | children.png → registry.png | 通过；独立地址，唯一高亮 |
| 刷新／浏览器前进后退 | navigation-page.png ↔ registry.png | 通过；地址和页面同步，结果画面与对应页面相同 |
| 注册搜索／状态 | registry.png → registry-search.png／registry-empty.png | 通过 |
| 详情／规范／Esc 关闭 | registry-search.png → detail.png／spec.png → registry-search.png | 通过；关闭不写绑定 |
| 选页取消／Esc／遮罩 | navigation.png → picker.png → cancel-result.png | 通过；绑定不变 |
| 关联后跨子页返回 | linked.png → registry.png → draft-retained.png | 通过；原菜单身份、名称、关联和未发布状态保留 |
| 编辑后切换菜单 | linked.png → leave-warning.png | 通过；原未保存提示仍在 |
| 保存并发布／刷新 | leave-warning.png → publish-warning.png → published.png | 通过；原校验发布，刷新保留关联 |
| 新空叶子发布 | navigation.png → new-empty-validation.png | 通过；原选页校验仍阻止发布 |

证据：verification.json（通过、零 pageerror）、verify-menu-routing-navigation.ts（旧地址、枚举、无新权限资源）、verify-page-registration.ts（286 项目录／JSON 合同）、verify-json-menu-merchant-parity.ts（29 根／277 节点整树双向一致）、tsc --noEmit（退出 0）。静态复核通过；只读白名单不包括弹框写操作后代。

边界：浏览器使用演示管理账号，未切换真实只读／隐藏账号做完整 RBAC 验收；相关边界由共享 routing 资源断言和静态复核覆盖。未验证 HTTP 故障、线上发布或全部业务页面运行情况。初轮因隔离检出遗漏配置导致样式未加载，恢复基线文件并以明确 vite.config.ts 重启后重跑通过，不计初轮为通过。

工作区是从已核验 main 新建的独立 Git worktree；应用登记因初始化卡住失败后在同一目录恢复稀疏检出。主线目录和 65260 服务未改为功能分支。没有修改 vendor/emenu-new，无嵌入包重建要求。本轮已获本地提交、合并授权，不推送远端；主线整合与预览同步需以 Git 交付核验为准。
