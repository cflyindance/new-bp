# 本地页面注册交付与操作覆盖

变更 LOCAL-PAGE-REG-20261106-03；产品 v1.4／研发 V1.3／个人 V1.3，功能基线 main@ec151927，codex/menu-routing-subnav-20261106 未提交工作区。端口 65263，实际截图与验证使用隔离演示会话，不是真实业务操作历史。

## 操作覆盖清单

| 页面／操作 | 入口 → 结果图片 | 验证结果／正文位置 |
| --- | --- | --- |
| 注册页面入口 | registry.png → create.png | 通过；个人版“页面注册中心 → 注册页面” |
| 项目内／iframe／外链／微应用切换 | create.png → iframe.png／external.png／micro-app.png | 通过；个人版“类型联动” |
| 必填为空 | create.png（同表单未提交） | valueMissing 断言通过；原生气泡截图限制见缺口 |
| 保存注册 | create.png → saved.png | 通过；个人版“保存与刷新” |
| 刷新读取 | saved.png → reload.png | 通过；个人版“保存与刷新” |
| 查看详情／关闭 | reload.png → detail.png → reload.png | 通过；不写目录或菜单 |
| 取消 | create.png → cancelled.png | 通过；没有写入 |
| 关闭按钮 | create.png → cancelled.png（相同目录结果） | 通过；正文分别定义 |
| Esc | create.png → cancelled.png（相同目录结果） | 通过；焦点回到注册入口 |
| 遮罩空白 | create.png → cancelled.png（相同目录结果） | 通过；弹框内部不会触发 |
| 标识重复 | create.png → duplicate.png | 通过；输入保留，原记录不变 |
| 路由重复 | create.png → duplicate-path.png | 通过；输入保留，原记录不变 |
| 微应用非法入口 | micro-app.png → micro-invalid.png | 通过；ftp 被拒绝 |
| 本地存储写入失败 | create.png → storage-failure.png | 通过；受控配额故障，存储原值及输入保留 |
| 本地存储损坏 | registry.png → corrupt-storage.png | 通过；受控无效 JSON，内置目录可用 |
| 损坏时再次保存 | corrupt-storage.png → corrupt-save-blocked.png | 通过；不覆盖原始无效数据 |
| 导航选择本地页面 | registry.png → selectable.png → bound-unpublished.png | 通过；身份、名称保留，不自动发布 |
| 只读浏览 | registry.png → readonly.png | 通过；隔离权限状态，注册禁用，搜索及详情可用 |

## 验证层次

- `verify-local-page-registration.ts`：存储往返、四类型、内置／本地标识及路径冲突、无浏览器环境、非法存储、拒绝访问、配额失败不覆盖、固定元信息。
- `verify-local-page-registration-browser.mjs`：上述操作的真实本地浏览器路径，verification.json 为通过且零 pageerror。
- TypeScript 全量检查退出 0；`verify-page-registration.ts` 内置目录 286 项及原 JSON 绑定合同回归通过。
- 现有页面注册浏览器全流程另行回归通过：二级导航、目录查询、取消／关联、菜单未保存提示、发布与刷新、空叶子校验。独立产物位于 D:/CodexOutputs/2026-11-06-local-page-registration-regression，不覆盖此前模块截图。
- 未修改菜单 JSON 合同、发布接口或 vendor/emenu-new；无嵌入包源码重建要求。

## 独立交付缺口

- 浏览器原生必填气泡可能不包含在页面截图中；必填阻止写入有 DOM validity 断言，不以自制提示替代。
- 系统默认浏览器已核对为 Chrome；自动外部预览分别遇到导航超时和会话被关闭，没有改用应用内浏览器。功能页面由隔离浏览器回归验证，交付提供已核验的 65263 链接手动打开。
- 只读使用隔离会话的演示权限状态；未使用真实员工、真实远端鉴权或跨设备账号验收。隐藏权限沿用既有门控，不声称新增隐藏账号实测。
- 本地存储不提供多人共享、同步、编辑／删除登记或服务器接口；这些不是当前承诺能力。同源多个窗口同时写入没有跨窗口事务保证。
- 旧蓝图矩阵等未由本轮注册操作涉及的历史文档章节未作全面治理；不能作为本地注册的有效规则或运行证明。当前新增规则以三个文档的本地注册章节为准。
- 代码仍在既有未提交功能分支；此前 Git 暂存／对象写入超时导致的提交合并未完成，本轮没有重试或扩大 Git 授权。

## 独立变更追溯

- 产品 v1.4／研发 V1.3／个人 V1.3：LOCAL-PAGE-REG-20261106-03，用户选择本地保存，注册表单、来源、存储和异常定义。
- 产品 v1.3／研发 V1.2／个人 V1.2：NAV-ROUTING-20261106-02，导航编排及页面注册中心为二级入口。
- 产品 v1.2／研发 V1.1／个人 V1.1：PAGE-REG-20261106-01，代码目录、选页与原技术快照合同。
- 目录默认树与旧蓝图方案的其他历史依据沿用 Git 历史及既有验证记录，不在当前注册规则正文重复决策。
