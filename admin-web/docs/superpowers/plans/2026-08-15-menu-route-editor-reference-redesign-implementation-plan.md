# 菜单路由编辑器参考稿重设计实施计划

## 目标

将现有三栏 JSON 菜单编辑器改为参考 HTML 的“顶部操作栏 + 左侧树 + 右侧详情 + 底部预览 + 独立新增/编辑弹窗”，同时保持原 JSON 白名单、旧四级和旧类型子树无损兼容。

## 实施步骤

### 1. 领域规则与兼容保护

涉及：

- `src/config/json-menu-document-domain.ts`
- `scripts/verify-json-menu-document-domain.ts`
- `scripts/verify-json-menu-reference-compatibility.ts`

任务：

- 增加目录判定：存在 `children` 且无 `path`/`url` 时为目录。
- 类型继承在目录判定之后执行。
- 新增兼容子树识别：显式 `external`/`micro-app` 及后代、第四级及后代。
- 将新增/移动最大深度调整为三级。
- 校验器接收已发布版本基线，区分历史重复警告与新增重复错误。
- 增加三级目录、iframe 路径和 URL、兼容节点提示等校验。

### 2. 严格序列化

涉及：

- `src/config/json-menu-document-serializer.ts`
- `scripts/verify-json-menu-reference-compatibility.ts`

任务：

- 保留目录的空 `children: []`。
- 保持旧数据原字段、顺序、显式 `false`/`null`。
- 验证 iframe 不生成 `microAppConfig`。
- 验证参考文件无修改往返完全一致。

### 3. 编辑状态与安全操作

涉及：

- `src/config/json-menu-editor-store.ts`

任务：

- 新增原子化添加、替换节点操作，供弹窗确认后提交。
- 保护兼容子树及包含兼容后代的祖先，阻止危险结构操作。
- 保存/发布校验始终以已发布版本为基线。
- 放弃修改改为重新读取共享草稿；不存在草稿时读取发布版本，不删除草稿。
- 拖拽和新增限制为三级。

### 4. 参考稿页面结构

涉及：

- `src/config/json-menu-editor-ui.ts`
- `src/config/json-menu-tree-ui.ts`
- `src/config/json-menu-node-form-ui.ts`
- `src/config/json-menu-preview-ui.ts`

任务：

- 重构顶部操作栏和状态提示。
- 左侧树加入搜索、展开/收起、新增、节点悬停动作和拖拽。
- 右侧改为节点只读摘要和快捷操作。
- 底部改为浅色商家后台菜单预览，并保留三语言切换。
- 实现统一新增/编辑弹窗：目录、项目内、iframe 两段式配置，高级设置折叠。
- 对兼容子树显示只读标识和原因。
- 视觉对齐屏保、薪资管理页面的白底、细边框、紧凑工具栏和青绿色主按钮。

### 5. 集成与验收

任务：

- 运行领域测试和参考 JSON 兼容性测试。
- 运行 `npm.cmd run build`。
- 在本地浏览器验证新增一级/二级/三级、空目录、两类页面、编辑弹窗、删除确认、拖拽限制、保存发布、导出及预览。
- 验证旧类型/第四级只读、历史重复不阻断正常修改、新增重复持续阻断。
- 检查浏览器控制台错误并保留最终可查看页面。

