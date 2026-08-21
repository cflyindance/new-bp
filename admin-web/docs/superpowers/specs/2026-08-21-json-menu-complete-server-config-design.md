# 菜单路由完整服务端配置设计

## 1. 背景与目标

现有菜单路由编辑器已支持目录、项目内页面、iframe、外部链接、菜单树、服务权限、预览、保存发布和 JSON 导出，但尚未完整覆盖新的 `MenuItemServerConfig` 与 `MenuMicroAppServerConfig`。

本次在现有 JSON 结构上增量补齐能力，不替换或删除现有 `accessControl` 等业务字段。目标用户仍是产品、测试、技术运维和研发。编辑器必须通过动态表单降低技术字段的理解成本，同时保证导出 JSON 使用接口原生字段，不引入额外存储字段。

## 2. 范围

### 2.1 新增节点字段

- `targetKey?: string`
- `parentKey?: string`
- `externalConfig?: { target?: string; features?: string }`
- `disabled?: boolean`
- `extraInfo?: any`

### 2.2 扩展节点类型

`MenuNode.type` 扩展为：

- `inner`
- `iframe`
- `external`
- `link`
- `micro-app`

目录继续通过无页面地址且存在 `children` 表达，不新增目录类型字段。

### 2.3 补齐微应用字段

`microAppConfig` 支持：

- `name?: string`
- `url: string`
- `iframe?: boolean`
- `keepAlive?: boolean`
- `path?: string`
- `defaultPage?: string`
- `routeType?: "history" | "hash"`

现有服务与权限、多语言、显示控制及根文档字段继续保留。

## 3. 数据兼容原则

1. 新接口作为当前结构的增量扩展，不移除 `accessControl` 等既有字段。
2. 可选字段只有在用户主动配置后才输出。编辑器不物化接口注释中的默认值。
3. 切换用途时只清理与目标用途冲突的字段，始终保留 `children`。
4. 未编辑的合法已有字段原样往返。
5. `extraInfo` 在表单中以 JSON 编辑器维护，保存为原生 JSON 对象或数组，不保存为字符串。
6. 字段白名单同步扩展到本设计列出的接口字段，仍拒绝未知节点字段。

## 4. parentKey 自动维护

`parentKey` 不提供手工输入入口。

- 一级菜单不输出 `parentKey`。
- 二、三级菜单的 `parentKey` 等于直接父节点的 `key`。
- 新增、调整父级、拖拽、复制、保存、发布和导出时均重新规范化整棵树。
- 父节点 `key` 修改后，所有直接子节点的 `parentKey` 同步更新。
- 如果父节点缺少 `key`，现有 Key 校验阻止保存或发布，不能输出陈旧 `parentKey`。

## 5. 动态编辑表单

保留“点击左侧菜单后在右侧直接编辑”的工作流。菜单用途依次展示：

1. 仅目录
2. 项目内页面
3. iframe 嵌入
4. 链接菜单
5. 外部链接
6. 微应用

### 5.1 用途字段矩阵

| 用途 | 必填字段 | 可选字段 | 清理字段 |
|---|---|---|---|
| 仅目录 | `children` | 通用字段 | `type`、`path`、`url`、`targetKey`、`externalConfig`、`microAppConfig` |
| 项目内页面 | `path` | 通用字段 | `url`、`targetKey`、`externalConfig`、`microAppConfig` |
| iframe | `path`、HTTP(S) `url` | 通用字段 | `targetKey`、`externalConfig`、`microAppConfig` |
| link | `targetKey` | 通用字段 | `path`、`url`、`externalConfig`、`microAppConfig` |
| external | `path`、HTTP(S) `url` | `externalConfig`、通用字段 | `targetKey`、`microAppConfig` |
| micro-app | `path`、显式根配置的 `microAppConfig.url` | 其他微应用参数、通用字段 | 节点 `url`、`targetKey`、`externalConfig` |

通用字段包含基础信息、多语言、服务与权限、`display`、`disabled`、`extraInfo` 和 `children`。

### 5.2 微应用配置区

选择微应用后，在“层级与页面”下展示独立配置区：

- 访问地址 `url` 必填。
- `name`、`path`、`defaultPage` 使用普通文本输入。
- `routeType` 使用“未配置 / history / hash”选择器。
- `iframe`、`keepAlive` 使用三态选择器，支持“不输出字段”。
- 每个可选字段显示运行时默认值说明，但默认值不写入 JSON。

### 5.3 微应用继承与覆盖

- 子节点未显式配置 `type` 与 `microAppConfig` 时，继承最近的显式 `micro-app` 祖先。
- 只编辑继承节点的名称、权限、显示或禁用状态，不得物化 `type` 或 `microAppConfig`。
- 用户主动选择微应用或编辑微应用参数后，节点成为显式微应用配置。
- 显式根微应用只要求 `microAppConfig.url`，其他字段可依赖运行时默认值。
- 继承节点主动覆盖 `microAppConfig` 时，不再依赖父级默认补全；必须明确填写 `name`、`url`、`iframe`、`keepAlive`、`path`、`defaultPage`、`routeType`，否则阻止保存。
- 后代存在显式覆盖时，父节点仍可修改非结构信息；会破坏继承/覆盖边界的类型切换、删除和移动应被阻止或要求先处理后代配置。

## 6. link 目标菜单

选择“链接菜单”后使用树形选择弹窗配置目标：

- 展示菜单名称、层级路径和 Key。
- 自动写入目标节点 `key` 到 `targetKey`。
- 禁止选择自身、目录、其他 `link`、已禁用/已删除节点。
- 禁止形成直接或间接循环引用。
- 目标 Key 修改时，引用该节点的 `targetKey` 自动同步；目标节点删除前必须提示存在引用并阻止删除，或由用户先修改引用。
- 保存与发布时再次解析目标；找不到目标或目标不可用时产生节点级错误。

`link` 不要求 `path`，其最终页面由目标菜单决定。

## 7. externalConfig

仅 `external` 展示“新窗口设置”：

- `target` 提供 `_blank`、`_self`、`_parent`、`_top` 和“自定义窗口名”。
- `features` 使用普通文本输入，与 `window.open` 参数保持一致。
- 两项均为空时不输出 `externalConfig`。
- 只有一个字段有值时只输出该字段。
- 切换到非 `external` 用途时删除 `externalConfig`。

编辑器和预览均不得执行 `window.open` 或请求外部 URL。

## 8. disabled 与 display

- `display: false`：菜单在商家后台预览中隐藏，编辑树仍展示“隐藏”标记。
- `disabled: true`：菜单仍在编辑树和商家后台预览中展示，显示“已禁用”标记，预览中不可点击或展开页面。
- 两个字段相互独立，均使用三态设置，未配置时不输出。
- 禁用目录仍可在编辑器展开结构，但商家预览不得进入其子级。

## 9. extraInfo 编辑

- 高级设置新增 JSON 编辑器。
- 空内容删除 `extraInfo`。
- 非空内容必须能被 `JSON.parse`，且顶层为对象或数组。
- 解析成功后以原生 JSON 值写入节点。
- 解析失败、顶层为字符串、数字、布尔或 `null` 时显示字段级错误并阻止写入。
- 显示格式使用两空格缩进，重新打开时稳定格式化。

## 10. 树、详情与预览

### 10.1 树标签

- `inner`：项目内
- `iframe`：iframe
- `external`：外链
- `link`：链接
- `micro-app`：微应用
- 目录：目录

各类型使用可区分的边框和浅色背景。`disabled` 追加“已禁用”状态，错误和警告沿用现有节点级标记。

### 10.2 详情与预览

- `link` 显示目标菜单名称、目标 Key、最终解析用途与地址。
- 微应用显示“继承自某节点”或“当前节点覆盖”，以及实际生效配置。
- 外链显示 URL、`target`、`features` 和新窗口说明。
- 禁用菜单显示但所有选择动作无效。
- 预览只渲染转义后的文本，不创建外链 `<a>`、远程 `<iframe>`，不调用 `fetch` 或 `window.open`。

## 11. 校验与错误定位

新增或扩展以下节点级校验：

- 用途必填字段缺失。
- iframe/external URL 非 HTTP(S)。
- 显式微应用缺少 URL。
- 子微应用覆盖配置不完整。
- link 的目标缺失、不可选或构成循环。
- `externalConfig` 出现在非 external 节点。
- `microAppConfig` 出现在非 micro-app 节点。
- `targetKey` 出现在非 link 节点。
- `parentKey` 与树结构不一致时由规范化自动修正；无法修正时产生错误。
- `extraInfo` 不是对象或数组。

错误显示在顶部计数、菜单节点标记和右侧字段区域。点击问题必须定位对应菜单和字段，并保持菜单树滚动位置。

## 12. 保存、发布和导出数据流

1. 用户修改右侧表单草稿。
2. 用途规范化器清理冲突字段并校验当前节点。
3. 树规范化器重算所有 `parentKey`。
4. 文档校验器执行字段白名单、类型、引用、继承、循环和 JSON 值校验。
5. 保存草稿允许警告但不允许错误。
6. 发布和导出对当前完整文档重新执行步骤 3、4。
7. 导出的 JSON 保持既有根结构和字段省略规则。

## 13. 测试要求

### 13.1 领域测试

- 节点和微应用字段白名单。
- 六种用途规范化矩阵及 `children` 保留。
- 可选字段不物化默认值。
- `parentKey` 在新增、移动、复制、父 Key 修改后的自动更新。
- link 目标过滤、失效引用、直接和间接循环。
- 微应用根配置、继承、不物化、显式覆盖与完整覆盖校验。
- externalConfig 条件输出和类型切换清理。
- extraInfo 对象、数组、空值和非法顶层值。
- disabled/display 独立语义。

### 13.2 渲染与交互测试

- 六种用途按钮及动态字段。
- link 树形选择弹窗。
- 微应用配置区及默认提示。
- 树标签、禁用标记、错误定位。
- 详情、普通预览和全屏预览。
- 预览 HTML 不包含可执行外链、远程 iframe 或脚本调用。

### 13.3 回归测试

- 现有参考 JSON 往返一致性。
- 服务与权限规则。
- 菜单树滚动保持。
- 问题状态与定位。
- TypeScript 类型检查和生产构建的主应用编译阶段。

## 14. 非目标

- 不实现商家后台运行时的微应用加载器、link 跳转器或 `window.open` 执行逻辑。
- 不迁移旧数据，不主动为旧节点补写默认字段。
- 不新增接口之外的持久化字段。
- 不允许手工维护 `parentKey`。
