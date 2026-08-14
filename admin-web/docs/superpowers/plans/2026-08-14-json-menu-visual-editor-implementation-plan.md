# JSON 菜单可视化编辑器实施计划

日期：2026-08-14  
对应规格：`docs/superpowers/specs/2026-08-14-json-menu-visual-editor-design.md`

## 1. 实施目标

在现有 M 平台“菜单路由配置”入口中，用严格匹配参考 JSON 的三栏可视化编辑器替换当前导航蓝图/应用注册中心组合界面。实现自动加载、共享草稿、四级树编辑、动态字段表单、实时菜单预览、校验、直接发布和无损 JSON 导出。

生产路径通过 HTTP 仓储契约读写共享草稿和当前发布配置。本地开发与自动化测试使用依赖注入的演示仓储；演示仓储数据不进入业务 JSON，生产构建默认使用 HTTP 仓储。

## 2. 实施原则

- 业务文档只允许规格第 3 节中的字段。
- 先写领域/序列化验证，再写界面。
- 每个阶段均运行 TypeScript 构建和专项验证。
- 只清理本次误方向产生的 `visual-route-*`代码；保留所有不相关工作区修改。
- 不把参考文件复制为产品初始化数据，也不建设 JSON 导入功能。

## 3. 文件变更总览

### 3.1 删除误方向实现

- `src/config/visual-route-domain.ts`
- `src/config/visual-route-store.ts`
- `src/config/visual-route-ui.ts`
- `src/config/visual-route-runtime.ts`
- `scripts/verify-visual-route-configuration.ts`

同时从以下文件移除对应引用和扩展字段：

- `src/main.ts`
- `src/config/nav-blueprint-store.ts`
- `src/config/nav-blueprint-ui.ts`

### 3.2 新增领域与数据层

- `src/config/json-menu-document-domain.ts`
- `src/config/json-menu-document-serializer.ts`
- `src/config/json-menu-document-repository.ts`
- `src/config/json-menu-editor-store.ts`

### 3.3 新增界面层

- `src/config/json-menu-editor-ui.ts`
- `src/config/json-menu-tree-ui.ts`
- `src/config/json-menu-node-form-ui.ts`
- `src/config/json-menu-preview-ui.ts`

### 3.4 新增验证

- `scripts/verify-json-menu-document-domain.ts`
- `scripts/verify-json-menu-reference-compatibility.ts`

## 4. 分步实施

### 阶段一：清理错误方向并建立安全基线

1. 记录当前 `git status --short`，区分本任务代码与用户已有修改。
2. 从 `nav-blueprint-store.ts`移除 `RoutePageRef、RouteAccessPolicy、enabled、pageRef、accessPolicy`。
3. 从 `nav-blueprint-ui.ts`移除应用注册中心、节点页面绑定、路由预检和路由发布快照逻辑。
4. 从 `main.ts`移除动态路由运行时导入、渲染和绑定。
5. 删除五个 `visual-route-*`任务文件。
6. 运行 `npm.cmd run build`，确认恢复到原导航蓝图基线且不破坏其他功能。

完成标准：代码库不再包含 `RouteApplication、pageRef、route release`等偏平台化概念；构建通过。

### 阶段二：严格 JSON 领域模型

在 `json-menu-document-domain.ts`中实现：

1. `MenuDocument、MenuNode、MenuI18nInfo、MicroAppConfig、AccessControl、PermissionRule`类型。
2. 根、节点和嵌套对象字段白名单常量。
3. `walkMenuNodes()`：保留父链、深度和数组位置的遍历器。
4. `resolveEffectiveMenuType()`：自身类型优先，否则向最近祖先继承。
5. `createEmptyMenuDocument(currentUser)`：生成稳定 24 位十六进制 `_id`、空菜单、完整 `updatedBy`和毫秒 `createdDate`。
6. `createEmptyMenuNode()`：只初始化 `id`，其他字段由用户填写。
7. `cloneMenuSubtreeWithFreshIds()`：递归复制并生成新 ID，不修改 Key。
8. `moveMenuNode()`：阻止循环和第五级，只调整数组位置。
9. `validateMenuDocument()`：输出带节点定位信息的错误和警告。

先在 `verify-json-menu-document-domain.ts`覆盖：

- 四种显式类型与类型继承。
- 父微应用子路径不重复要求入口。
- ID/Key重复阻断、路径重复警告。
- 第五级和循环移动被阻止。
- `hash/history`及`some`枚举限制。
- 新文档根结构完整。
- 三态布尔属性缺失与显式 false 的差异。

完成标准：专项脚本全部通过，模块不依赖 DOM或浏览器存储。

### 阶段三：无损序列化器

在 `json-menu-document-serializer.ts`中实现：

1. 递归按白名单复制业务字段，禁止内部字段泄漏。
2. 保留属性缺失、显式 `false`和`updatedBy.lastname: null`。
3. 省略未配置的可选字段和空对象。
4. 保持 `menu / children`数组顺序。
5. 输出根字段顺序 `_id、name、menu、updatedBy、createdDate`。
6. `serializeMenuDocument()`返回普通对象；`stringifyMenuDocument()`输出两空格缩进 JSON。

在 `verify-json-menu-reference-compatibility.ts`中：

1. 接受可选输入参数，开发验收时传入 `C:\Users\27273\Desktop\edit jason.txt`。
2. 读取参考文件，执行解析→序列化→重新解析。
3. 递归比较 91 个节点、15 个顶层节点、最大四级、字段值、数据类型和数组顺序。
4. 断言 66 个未填写 `type`的节点仍不含该属性。
5. 递归断言不存在白名单之外的业务字段。
6. 断言 `updatedBy.lastname`仍为显式 `null`。

完成标准：参考文件无损兼容测试通过；格式差异仅限缩进和规范字段顺序。

### 阶段四：仓储与编辑状态

在 `json-menu-document-repository.ts`中定义 `MenuDocumentRepository`：

- `readPublished()`
- `readDraft()`
- `saveDraft()`
- `deleteDraft()`
- `publish()`

实现：

1. `HttpMenuDocumentRepository`：使用项目现有请求封装调用菜单配置 API；请求和响应体均为严格 `MenuDocument`。
2. ETag并发控制：读取时保留响应 ETag，保存/发布通过 `If-Match`提交；409/412转为可识别冲突错误。ETag只存在于仓储状态，不写入业务文档。
3. `DemoMenuDocumentRepository`：只在显式本地演示启动参数下启用，使用浏览器存储模拟共享草稿/发布配置。
4. 仓储注入入口，生产默认 HTTP实现。

在 `json-menu-editor-store.ts`中实现：

1. 当前文档、发布基线、选中节点、脏状态和校验结果。
2. 启动时优先恢复共享草稿，否则加载已发布文档。
3. 更新字段、三态字段开关、树增删复制移动。
4. 保存草稿、放弃草稿、发布和导出动作。
5. 发布时先阻断错误，再确认警告，更新当前用户 `updatedBy`。
6. 冲突时保留本地内容，提示重新加载或导出备份，不自动覆盖他人草稿。

完成标准：仓储契约、ETag冲突和草稿恢复通过纯逻辑测试；业务 JSON中无仓储元数据。

### 阶段五：三栏编辑器骨架

在 `json-menu-editor-ui.ts`中替换 M 平台现有编辑页主体：

1. 顶部根字段区：可编辑 `_id、name`，只读 `updatedBy、createdDate`。
2. 三栏响应式布局：树 28%、表单 42%、预览 30%；小屏按树→表单→预览纵向排列。
3. 底部固定操作栏：保存草稿、保存并发布、导出 JSON、放弃修改。
4. 加载、空白、新建、失败和共享草稿恢复状态。
5. 离开脏页面保护。

现有 M 平台路径继续使用 `/m-platform/nav-blueprint/system-default/edit`，避免修改入口和导航权限；页面标题和正文改为“菜单路由可视化编辑器”。列表页保留“编辑当前菜单”和“新建空白菜单”两个入口。

完成标准：编辑页能加载参考形状数据并渲染三栏，原 M 平台壳层和返回逻辑保持可用。

### 阶段六：左侧菜单树

在 `json-menu-tree-ui.ts`实现：

1. 最多四级树、折叠状态和当前选中状态。
2. 节点图标、当前语言名称、类型、路径和校验徽标。
3. 新增同级/子级、复制、删除确认。
4. 拖拽同级排序和跨层移动；显示插入线并调用领域移动函数。
5. 名称/Key/路径搜索及祖先自动展开。
6. 错误/警告统计与“下一问题”定位。

完成标准：鼠标和键盘均可选择节点；所有树操作只通过 store/领域函数修改数据。

### 阶段七：中间动态节点表单

在 `json-menu-node-form-ui.ts`实现：

1. 常用字段：`id、name、key、path、icon、type、i18nInfo`。
2. `type`选项：继承父节点、inner、external、iframe、micro-app。
3. external/iframe显示 `url`。
4. micro-app显示 `microAppConfig.url/defaultPage/iframe/routeType`。
5. 高级配置：`i18nKey、display、accessControl`。
6. `display、iframe、accessControl.bool`三态控件。
7. `permission.rule`固定 `some`，`permission.value`用标签列表编辑。
8. 图标名称或图片 URL预览。
9. 与类型不匹配但来自原始文档的字段以“保留原始字段”区展示，只有用户明确删除才移除。

完成标准：切换类型不会静默删除原字段；未填写类型不会被序列化器补写。

### 阶段八：右侧菜单预览

在 `json-menu-preview-ui.ts`实现：

1. `zh-CN / zh-HK / en-US`切换。
2. 缺失翻译回退 `name`。
3. 按当前数组顺序和层级渲染菜单。
4. 节点选中与树/表单双向联动。
5. inner、external、iframe、micro-app状态标识和目标摘要。
6. 不创建 iframe、不导航、不请求任何第三方 URL。

完成标准：参考文档 91 个节点均可在预览中展开定位，切换语言不修改文档。

### 阶段九：保存、发布和导出闭环

1. 保存草稿调用严格序列化后写仓储，成功后显示保存时间。
2. 发布前展示错误列表或警告确认摘要。
3. 发布成功刷新发布基线、清除共享草稿并清除脏状态。
4. 导出当前文档为 UTF-8 `.json`，文件名使用根 `name`的安全化结果。
5. 放弃修改删除共享草稿并重新读取已发布文档。
6. 保存/发布/导出错误均保留当前编辑内容。

完成标准：三个出口使用同一 `serializeMenuDocument()`结果；发布和导出内容无额外字段。

### 阶段十：综合验证与浏览器验收

按顺序运行：

1. `npx.cmd --yes tsx scripts/verify-json-menu-document-domain.ts`
2. `npx.cmd --yes tsx scripts/verify-json-menu-reference-compatibility.ts "C:\Users\27273\Desktop\edit jason.txt"`
3. `npm.cmd run build`
4. 本地浏览器交互验收：自动加载、91 节点树、三种语言、四种类型表单、复制/删除/拖拽、错误定位、保存草稿恢复、发布确认和 JSON下载。
5. 检查浏览器控制台无错误。
6. `git diff --check`并确认没有覆盖任务外工作区修改。

## 5. 交付检查表

- [ ] 旧 `visual-route-*`误方向实现已完全移除。
- [ ] 业务模型没有参考文件外字段。
- [ ] 参考文件 91 节点无损往返通过。
- [ ] 三栏编辑器完整可用。
- [ ] 四类型及继承逻辑正确。
- [ ] 重复 ID/Key阻断、重复路径警告。
- [ ] 保存草稿、发布、放弃和导出闭环可用。
- [ ] HTTP仓储与ETag冲突处理完成。
- [ ] 本地演示仓储只在显式开发模式启用。
- [ ] 生产构建和浏览器验收通过。

