# JSON 菜单可视化编辑器设计

日期：2026-08-14  
状态：已由用户确认，待实施规划  
参考文件：`C:\Users\27273\Desktop\edit jason.txt`

## 1. 背景与目标

当前菜单通过 JSON 代码维护，只能由研发修改。新功能要把同一份配置转换为面向产品经理、测试和技术运维的可视化编辑器，使非研发用户能够维护菜单层级、路由地址、页面类型、多语言、微应用参数和访问控制。

编辑器必须提供两个结果出口：

1. 保存草稿并直接发布生效。
2. 导出可交给研发发布的 JSON 文件。

导出的 JSON 必须与参考文件使用完全相同的字段、嵌套关系和数据类型。编辑器不得向业务 JSON 增加参考文件中不存在的字段。本设计取代此前“应用注册中心、路由发布平台”等偏平台化方案；本期只建设 JSON 菜单可视化编辑器。

## 2. 范围

### 2.1 本期范围

- 自动加载当前已发布菜单作为编辑基线。
- 新建空白菜单配置。
- 可视化编辑最多四级的 `menu / children` 树。
- 新增、复制、删除、拖拽排序和搜索节点。
- 按节点类型动态编辑字段。
- 实时预览三种语言下的菜单效果。
- 保存草稿、校验、直接发布和导出 JSON。
- 不修改参考文件业务字段的无损读取与序列化。

### 2.2 明确不做

- 不提供旧 JSON 文件导入或旧数据迁移。
- 不建设应用注册中心、独立页面目录、发布范围或额外权限模型。
- 不在编辑器预览中实际加载第三方页面或微应用。
- 不向导出 JSON 写入草稿版本、发布状态、校验状态、编辑器选中节点等内部数据。

草稿状态、发布记录等编辑器基础设施数据必须与业务 JSON 分开存储，不参与导出。

## 3. 参考数据结构

参考文件根结构包含且只包含：

```ts
interface MenuDocument {
  _id: string;
  name: string;
  menu: MenuNode[];
  updatedBy: {
    userId: string;
    timestamp: string;
    firstname: string;
    lastname: string | null;
  };
  createdDate: number;
}
```

菜单节点允许的字段为：

```ts
interface MenuNode {
  id?: string;
  name?: string;
  key?: string;
  path?: string;
  icon?: string;
  i18nKey?: string;
  i18nInfo?: {
    "zh-CN"?: string;
    "zh-HK"?: string;
    "en-US"?: string;
  };
  type?: "inner" | "external" | "iframe" | "micro-app";
  url?: string;
  microAppConfig?: {
    url?: string;
    defaultPage?: string;
    iframe?: boolean;
    routeType?: string;
  };
  accessControl?: {
    bool?: boolean;
    serviceName?: string;
    permission?: {
      rule?: string;
      value?: string[];
    };
  };
  display?: boolean;
  children?: MenuNode[];
}
```

参考文件现状：15 个顶层菜单、91 个节点、最多四级；显式类型包括 20 个 `micro-app`、2 个 `inner`、2 个 `external` 和 1 个 `iframe`，另有 66 个节点未填写 `type`。未填写 `type` 是合法状态，子节点沿用父节点页面逻辑，序列化时不得自动补写。

参考文件还存在重复 ID、重复 Key 和重复路径。因此编辑器不能假设基线数据天然合法，必须区分阻断错误与可确认警告。

## 4. 页面信息架构

编辑器使用三栏布局。

### 4.1 左栏：菜单结构

- 用树展示 `menu → children`，最多四级。
- 节点显示图标、当前语言名称、类型和路径。
- 支持展开/折叠、新增同级、添加子级、复制、删除和拖拽排序。
- 支持按名称、Key、路径搜索；命中后自动展开祖先并选中节点。
- 节点显示错误或警告标记，栏头显示错误和警告总数。
- 拖拽显示插入位置；禁止拖入自身、后代或超过第四级。

### 4.2 中栏：节点配置

采用“常用配置 + 高级配置”分层。

常用配置：

- `id`
- `name`
- `key`
- `path`
- `icon`
- `type`
- `i18nInfo.zh-CN`
- `i18nInfo.zh-HK`
- `i18nInfo.en-US`

高级配置按已有字段和类型动态显示：

- `i18nKey`
- `display`
- `url`
- `microAppConfig`
- `accessControl`

`display`只有原节点已经配置或用户主动启用该字段时才写入 JSON；关闭“配置此字段”后删除该属性，而不是写入默认值。其他可选对象同样遵循“未配置即省略”。

`id`使用普通文本输入框展示，新增时自动生成字符串值但允许用户修改。重复 ID 的错误可从左侧树点击定位，并在此输入框直接修复。

`display`、`microAppConfig.iframe`和`accessControl.bool`使用“未配置 / true / false”三态控件，以区分属性缺失与显式 `false`。

### 4.3 右栏：菜单预览

- 模拟商家后台菜单层级和选中状态，不加载业务页面。
- 支持 `zh-CN、zh-HK、en-US` 切换。
- 文案优先读取当前语言的 `i18nInfo`，缺失时回退到 `name`。
- 显示节点的内部路由、外链、iframe 或微应用标识。
- 微应用摘要显示入口、默认页面、路由模式和 iframe 状态。

### 4.4 顶部与底部操作

顶部编辑根字段 `_id` 和 `name`，并只读展示 `updatedBy`、`createdDate`。新建整份配置时生成 `createdDate`；编辑现有配置时保持原值。

底部固定操作栏包含：

- 保存草稿
- 保存并发布
- 导出 JSON
- 放弃修改

## 5. 节点类型联动

### 5.1 `inner`

- `path`作为系统内部路由。
- 不显示 `url` 和 `microAppConfig`。
- 若原数据含与该类型不匹配的字段，字段仍保留在草稿中并在高级配置显示“原始字段”，除非用户明确删除，避免无损读取被破坏。

### 5.2 `external`

- 显示并要求填写 `url`。
- 预览显示外链标识，不实际跳转。

### 5.3 `iframe`

- 显示并要求填写 `url`。
- 预览显示嵌入标识和目标 URL，不实际加载。

### 5.4 `micro-app`

- 显示 `microAppConfig.url`、`defaultPage`、`iframe`、`routeType`。
- `defaultPage`可选。
- `routeType`使用参考文件实际出现的 `hash / history`选项，不接受其他值。
- 子节点可显式填写 `type: "micro-app"`，也可省略并继承父节点逻辑。

### 5.5 未填写类型

- 类型选择器显示“继承父节点”。
- 编辑器通过最近的有类型祖先解释预览行为。
- 若祖先也没有类型，仅显示警告，不自动补写字段。

## 6. 图标、多语言与访问控制

### 6.1 图标

`icon`支持参考文件中的两种值：Ant Design 图标名称和图片 URL。编辑器提供预览；无法识别时保留原值并显示警告。

### 6.2 多语言

固定编辑参考文件中出现的 `zh-CN、zh-HK、en-US`。不增加新的语言字段。缺失翻译只警告，预览回退到 `name`。

### 6.3 访问控制

高级配置严格映射：

- `accessControl.bool`
- `accessControl.serviceName`
- `accessControl.permission.rule`
- `accessControl.permission.value`

`permission.value`使用可增删字符串标签编辑，序列化为字符串数组。`serviceName`与`permission`可以按参考数据单独存在或同时存在，编辑器不增加新的组合逻辑或包装字段。

`permission.rule`仅允许参考文件实际出现的 `some`。界面以只读选项展示该值；启用 `permission`时默认选择 `some`，关闭整个 `permission`配置后删除该对象。

## 7. 树操作规则

### 7.1 新增

新节点自动生成字符串 `id`，用户可以编辑。新增时只创建用户实际填写的字段；未配置字段不输出空值。

### 7.2 复制

复制当前节点及其全部后代和已有字段。每个复制节点生成新的 `id`；`key`保留原值并立即显示重复错误，要求用户修改后才能发布。

### 7.3 删除

删除叶子节点直接确认。删除带后代节点的菜单时，弹窗显示将删除的后代数量；确认后删除整个子树。

### 7.4 拖拽

同级拖拽只改变对应 `menu`或`children`数组顺序。跨层拖拽改变节点所在数组，但不得形成循环或超过四级。拖拽不修改节点的其他字段。

### 7.5 表单切换与离开保护

切换节点前将当前表单内容写入页面草稿。离开存在未保存修改的页面时提示用户保存、放弃或留在当前页。

## 8. 保存、发布与导出

### 8.1 自动加载与草稿

打开编辑器时读取当前已发布配置并创建编辑会话。保存草稿不影响当前生效菜单。新建空白配置与编辑当前配置是两个明确入口。本期不提供文件导入。

新建空白配置时初始化全部必需根字段：

- `_id`：由服务端创建文档时生成字符串 ID；在首次保存前由客户端生成临时字符串 ID，服务端可在创建响应中返回最终值。
- `name`：默认为空字符串，保存、发布和导出前都必须填写非空值。
- `menu`：空数组。
- `updatedBy`：使用当前登录用户的 `userId、firstname、lastname`，并生成 ISO 时间字符串 `timestamp`。
- `createdDate`：当前毫秒时间戳。

新建文档在导出前也执行根结构校验；缺少 `_id`、`name`、`menu`、`updatedBy`或`createdDate`，或数据类型错误时阻止导出。

### 8.2 保存并发布

发布执行完整校验。存在阻断错误时停止发布，保留全部编辑内容并定位第一个错误节点。只有警告时展示确认弹窗，用户确认后立即发布当前配置。

发布时更新参考结构中的：

- `updatedBy.userId`
- `updatedBy.timestamp`
- `updatedBy.firstname`
- `updatedBy.lastname`

不得增加 `updatedDate`、版本号、发布状态等根字段。

### 8.3 导出 JSON

导出当前编辑版本，不要求先发布。导出和发布必须调用同一套业务 JSON 序列化逻辑。

序列化规则：

- 根字段顺序为 `_id、name、menu、updatedBy、createdDate`。
- 节点保持当前 `menu / children`顺序和嵌套关系。
- 保留已有字段及其数据类型。
- 未配置的可选字段省略，不输出空对象或编辑器内部字段。参考结构明确允许的 `updatedBy.lastname: null`必须原样保留；不得把该显式 `null`当作缺失字段删除。
- `permission.value`保持字符串数组。
- `microAppConfig.iframe`、`accessControl.bool`、`display`保持布尔值。
- 不修改数据直接导出时，业务字段、值、结构和数组顺序与读取内容一致；允许格式化缩进和根字段规范顺序不同于原始文本排版。

## 9. 校验规则

### 9.1 阻断发布

- `id`缺失或重复。
- `key`缺失或重复。
- 树深度超过四级。
- `external`或`iframe`的有效类型来源确定后缺少合法 HTTP(S) `url`。
- `micro-app`的有效类型来源确定后缺少合法 HTTP(S) `microAppConfig.url`。
- 配置了 `permission.rule`但`permission.value`为空。
- 字段数据类型与参考结构不一致。
- 根字段缺失、`name`为空或根字段数据类型与参考结构不一致。
- `microAppConfig.routeType`不是 `hash`或`history`。
- `accessControl.permission.rule`不是 `some`。

对子节点的类型校验使用“自身显式类型优先，否则最近祖先类型”的有效类型。父微应用下的普通子路由不要求重复配置 `microAppConfig.url`；它使用父节点入口和自身 `path`。

### 9.2 警告但允许确认发布

- 路径重复。
- `path`为空。
- 图标名称或图片 URL无法预览。
- 三种语言内容不完整。
- 节点及其祖先均未配置类型。
- 参考数据存在与当前类型不匹配但为保证无损而保留的字段。

## 10. 内部组件与数据流

实现拆分为以下边界清晰的模块：

1. `menu-document-domain`：只定义参考 JSON 模型、有效类型继承、树遍历和校验。
2. `menu-document-serializer`：从编辑状态生成业务 JSON，并保证不泄漏内部字段。
3. `menu-editor-store`：管理当前文档、选中节点、脏状态、撤销前快照和校验结果。内部状态不写入业务 JSON。
4. `menu-tree-editor`：树操作和搜索。
5. `menu-node-form`：常用/高级动态表单。
6. `menu-live-preview`：只读菜单预览。
7. `menu-document-repository`：封装读取当前发布版本、保存草稿和发布。正式交付使用服务端持久化，保证产品、测试和运维看到同一份草稿/发布结果；浏览器存储只允许用于自动化测试替身，不属于验收实现。

本期服务端仓储契约固定为：

- `readPublished(): Promise<MenuDocument>`：读取当前生效文档。
- `saveDraft(document: MenuDocument): Promise<void>`：保存共享草稿，不改变线上菜单。
- `publish(document: MenuDocument): Promise<MenuDocument>`：原子替换当前生效文档并返回服务端写入最终 `updatedBy`后的文档。

接口请求和响应中的业务文档均使用第 3 节的 `MenuDocument`，不得向文档增加版本号或发布状态。并发控制、草稿所有者和审计信息属于 HTTP 标头或服务端存储元数据，不进入业务 JSON。导出由浏览器直接下载当前序列化结果，不依赖服务端。

数据流为：读取发布配置 → 解析为领域文档 → 编辑状态操作 → 实时校验和预览 → 序列化 → 保存草稿、发布或导出。

## 11. 错误处理

- 读取失败：显示明确错误和重试入口，不创建空文档覆盖线上配置。
- 草稿保存失败：保留页面状态并允许重试。
- 发布失败：保留草稿，展示服务端错误，不把本地状态标记为已发布。
- 导出失败：不影响草稿或已发布配置。
- 非法参考数据：尽可能读取并标记问题；只有用户执行发布时应用阻断规则。
- 新建文档根字段不完整：阻止保存、发布和导出，并聚焦顶部对应字段。

## 12. 验收与测试

### 12.1 参考文件兼容性

- 91 个节点全部可读取和呈现。
- 15 个顶层节点及四级层级保持不变。
- 不修改直接导出时，业务字段、值、数据类型、层级和数组顺序保持一致。
- 未填写 `type`的 66 个节点不会被自动补写。
- 所有参考文件字段均可保留，不出现参考文件外的业务字段。

### 12.2 类型与表单

- 四种显式类型正确联动表单。
- 子节点类型继承正确。
- 微应用子节点不会被错误要求重复配置父级入口。
- 权限数组和布尔字段序列化类型正确。
- 三态布尔字段能区分属性缺失、`true`和`false`。
- `routeType`只接受 `hash / history`，`permission.rule`只接受 `some`。

### 12.3 树操作

- 新增、复制、删除、同级和跨级拖拽行为正确。
- 循环嵌套和第五级被阻止。
- 拖拽只改变目标数组结构和顺序。

### 12.4 校验与出口

- 重复 ID/Key阻止发布。
- 重复路径只警告并允许确认发布。
- 类型必填项按有效继承类型校验。
- 发布和导出使用同一序列化结果。
- 新建空白配置生成完整根结构，根字段不完整时无法导出。
- `updatedBy.lastname: null`在读取、编辑和导出后仍保留为显式 `null`。
- 发布失败或离开提醒不会丢失编辑内容。

### 12.5 可用性

产品、测试和技术运维无需阅读或编辑 JSON，即可定位节点、修改路由、理解类型配置、处理校验问题并完成发布或导出。
