# 菜单外部链接编辑设计

## 目标

在菜单路由配置的“菜单用途”中开放外部链接配置，并生成商家后台既有 external 消费契约所需的 `type/path/url`。编辑器预览不请求该网址。

本仓库当前可确认的实现范围是配置编辑、校验、导出和无请求预览；商家后台生产运行时不在当前可定位代码范围内。“external 在新窗口打开”作为下游消费者契约与验收依赖，本次不声明已经修改或验证生产运行时的 `window.open` 行为。

## JSON 约束

- 严格沿用参考 JSON 字段，不新增 `target`、`openMode` 等字段。
- 外部链接节点写入 `type: "external"`、`path` 和 `url`。
- `external` 的打开语义固定为新窗口，不提供当前窗口/新窗口切换。
- 模式切换规范：
  - `directory`：删除 `type`、`path`、`url`、`microAppConfig`，保留已有子菜单并确保存在 `children`。
  - `inner`：设置 `type: "inner"`，保留 `path`，删除 `url`、`microAppConfig`，保留子菜单。
  - `iframe`：设置 `type: "iframe"`，保留 `path` 和有效 `url`，删除 `microAppConfig`，保留子菜单。
  - `external`：设置 `type: "external"`，保留 `path` 和有效 `url`，删除 `microAppConfig`，保留子菜单。
- iframe 与 external 之间切换时复用同一个合法 HTTP(S) `url`，不主动清空。

## 表单

- 菜单用途顺序：仅目录、项目内页面、iframe 嵌入、外部链接。
- 外部链接展示两个必填字段：商家后台路由地址、外部链接地址。
- 外部链接地址仅接受 `http://` 或 `https://`。
- 外部链接可配置为一级、二级或三级菜单；一级、二级仍可同时包含子菜单。
- 编辑器菜单树和预览中，展开按钮只控制子菜单；选择菜单名称只切换当前配置/预览详情，不打开 URL。生产运行时如何同时提供“展开子菜单”和“打开外链”两个操作属于下游 external 消费契约，本仓库不新增或验证该交互。

## 校验与兼容

- `EditableMenuNodeType` 增加 `external`。
- 可打开菜单仍要求非空 `path`。
- 显式 `type: "external"` 的节点要求自身具有有效 HTTP(S) `url`，且不得生成 `microAppConfig`；错误信息和错误码使用 external 专属语义。
- 类型缺省但从 external 祖先继承有效类型的后代继续按原数据解析和导出，不因本次开放而被自动补写 `type/url`；只有用户切换用途并保存时才显式规范化当前节点。
- 所有可打开类型的 `path` 维持现有非空校验，不新增必须以 `/` 开头的规则，避免改变参考数据兼容性。
- 既有显式 `external` 节点不再仅因自身类型成为兼容保护节点，可在编辑器中修改。
- `micro-app` 和历史第四级节点继续只读保护。
- external 位于受保护 micro-app 祖先下或历史第四级时仍受保护；external 祖先包含受保护后代时，继续沿用现有“可编辑字段但不可删除、复制、切换类型或调整层级”的子树限制。
- `LEGACY_TYPE` 不再为 external 产生，仅对显式 micro-app 保留；解除 external 保护不得削弱 micro-app 或第四级保护。
- 导入、导出和发布不迁移旧数据。

## 树与预览

- 菜单树类型标签显示“外链”，使用独立的紫色弱强调样式。
- 详情面板、全屏商家菜单预览及紧凑预览均显示商家后台路由 `path`、外部 `url`、“外部链接”类型标签和“发布后由商家后台在新窗口打开”。不再显示“历史外部链接”。
- URL 仅渲染为转义后的不可交互文本；不得生成锚点、`iframe src`、`fetch` 或 `window.open`，确保预览不请求第三方页面。
- 商家后台运行时的 `_blank` 与 `noopener` 行为属于外部依赖和后续联调验收项，不计为本编辑器代码已完成能力。

## 验证

1. 新增或编辑外部链接节点可保存 `type/path/url`。
2. 非 HTTP(S) URL 被阻止并显示明确错误。
3. external 与 inner/iframe/directory 的每个切换方向均符合清理矩阵，保留 children；iframe ↔ external 复用合法 URL。
4. 既有显式 external 不再出现兼容警告并可编辑；micro-app、第四级、受保护祖先下 external 仍只读；external 上方或下方存在受保护子树时边界不弱化。
5. 类型缺省的 external 后代保持继承解析与原样导出，不自动补写字段。
6. 空白 path 被阻止；相对但非空 path 保持当前兼容行为。
7. external 有子菜单时，编辑器展开按钮与详情选择互不触发，预览不导航。
8. 详情、全屏和紧凑预览均显示 path、url、外部链接与新窗口契约文案；标记中不存在可导航链接、iframe、fetch 或 window.open。
9. 导出字段完全匹配参考 JSON，不包含打开方式新字段；未编辑参考 JSON 的业务数据往返等价。
10. 生产 `_blank/noopener` 明确记录为下游联调未验证范围。
11. 参考兼容、权限规则、菜单树问题状态和 TypeScript 回归通过。
