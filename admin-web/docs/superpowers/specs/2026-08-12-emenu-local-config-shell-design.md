# eMenu 本地配置后台独立壳层设计

## 目标

在 Demo 视角切换中新增“eMenu本地配置后台”。用户进入后看到独立于商家后台和 M 平台的后台壳层，并可在五个一级导航之间切换。本期只实现壳层、导航和占位页，不接入任何真实配置数据或保存能力。

## 范围

- Demo 视角切换新增“eMenu本地配置后台”入口和当前视角状态。
- 新增独立 eMenu 本地配置 Shell、路由识别和五个一级导航。
- 五个导航分别展示对应占位页。
- 浏览器刷新保留当前 eMenu 本地配置路由。
- eMenu Shell 内继续挂载 Demo 视角切换浮球，可返回门店版、品牌多门店、集团总部或 M 平台。
- 增加中英文界面文案。

不在本期范围内：

- 不复用或迁移商家后台现有 eMenu 配置表单。
- 不读写本地配置、商家配置、设备数据或 API。
- 不新增二级导航、表格、筛选、编辑弹窗、保存和发布流程。
- 不调整商家后台、M 平台已有导航信息架构。
- eMenu Shell 不展示 MVP / 未来版本切换。

## 信息架构与路由

使用独立路由前缀 `/emenu-local`，避免与商家后台 `/ordering/tablet/*` 和 M 平台 `/m-platform/*` 混用。

| 一级导航 | 路由 | 占位页说明 |
| --- | --- | --- |
| 设备设置 | `/emenu-local/device-settings` | eMenu 本地设备与终端相关配置占位 |
| 全局设置 | `/emenu-local/global-settings` | eMenu 本地通用配置占位 |
| 品类设置 | `/emenu-local/category-settings` | eMenu 品类配置占位 |
| 菜单分类设置 | `/emenu-local/menu-category-settings` | eMenu 菜单分类配置占位 |
| 调味设置 | `/emenu-local/seasoning-settings` | eMenu 调味配置占位 |

占位页使用以下稳定文案，便于中英文界面和结构验证：

| 页面 | 中文说明 | English title | English description |
| --- | --- | --- | --- |
| 设备设置 | 管理 eMenu 本地设备与终端配置。 | Device settings | Manage local eMenu device and terminal configuration. |
| 全局设置 | 管理 eMenu 本地通用配置。 | Global settings | Manage shared local eMenu configuration. |
| 品类设置 | 管理 eMenu 本地品类配置。 | Category settings | Manage local eMenu category configuration. |
| 菜单分类设置 | 管理 eMenu 本地菜单分类配置。 | Menu category settings | Manage local eMenu menu-category configuration. |
| 调味设置 | 管理 eMenu 本地调味配置。 | Seasoning settings | Manage local eMenu seasoning configuration. |

进入规则：

- 从任意其他视角点击“eMenu本地配置后台”时进入 `/emenu-local/device-settings`。
- `/emenu-local` 或未知的 `/emenu-local/*` 地址规范化到设备设置。
- 五个合法路由通过 Hash 导航切换；刷新后继续渲染当前合法页面。
- 从 eMenu Shell 切到商家后台任一视角时退出 eMenu Shell，并进入商家后台首页。
- 从 eMenu Shell 切到 M 平台时退出 eMenu Shell，并进入 M 平台默认页。

## Shell 状态与边界

扩展现有应用 Shell 模式，使其可区分：

- `merchant`
- `m-platform`
- `emenu-local`

eMenu 路由是该 Shell 的主要事实来源，Shell 模式用于让 Demo 视角控件正确显示当前状态并协调跨 Shell 跳转。实现必须提供集中式的进入、退出、判断函数，避免在页面组件中直接散写 `sessionStorage`。

主挂载流程按以下顺序识别页面：

1. 登录守卫与现有产品版本守卫；
2. eMenu 本地配置路由或 Shell 模式；
3. M 平台路由或 Shell 模式；
4. 商家后台现有路由。

进入 eMenu Shell 后只挂载 eMenu 自身的标题栏、侧栏、内容区、Demo 浮球和视角切换事件，不绑定商家后台业务页面控件。退出时清理 eMenu Shell 模式，避免影响其他 Shell。

## 页面结构

### 桌面端

- 页面背景使用现有应用的浅灰背景色。
- 左侧为约 240px 的固定白色导航区，顶部显示 eMenu 标识与“本地配置后台”。
- 五个一级导航平铺展示，不设置折叠分组；当前项使用浅蓝底、蓝色文字和清晰的选中标识。
- 右侧为一体化工作区：顶部标题栏与内容区在同一白色圆角画布内，避免多层卡片嵌套。
- 顶部标题栏显示当前页面名称和简短说明；右上不放置虚假的保存、发布或同步按钮。
- 内容区居中展示占位状态卡，包含与当前模块对应的简洁线性图标、模块标题、“功能建设中”和一行模块说明。

### 视觉基线

视觉借鉴只用于样式语言，不复制现有业务布局：

- 薪资管理：使用明确的页面标题层级、紧凑工具栏、一体化白色工作区、浅灰信息分区和稳定间距。
- 屏保：使用 12–16px 圆角、1px 中性描边、极轻阴影、蓝色强调色，以及带媒体预览感的占位图形。
- 不使用大面积渐变、重阴影、玻璃拟态或装饰性仪表盘。
- 占位卡不伪造配置值、统计数据、设备状态或可点击业务操作。
- 所有交互元素保留清晰的 hover、focus-visible 和选中状态；文本和背景满足现有主题的对比度习惯。

### 响应式

- 宽屏保持左侧固定导航和右侧工作区。
- 中等宽度缩窄侧栏与内容边距，但不改变五个导航的顺序。
- 窄屏将侧栏改为顶部可展开导航或现有项目一致的抽屉模式；当前页面标题始终可见。
- 占位卡宽度自适应，避免横向滚动。

## 组件与职责

### eMenu 路由模块

- 声明路由前缀、五个导航项和默认路由。
- 提供合法路由判断、默认页解析、当前导航解析和页面标题解析。
- 导航数据是 Shell 和占位页的唯一来源，避免重复维护名称与路径。

### eMenu Shell 模块

- 渲染独立 Shell、侧栏和当前占位页。
- 根据当前 Hash 设置导航选中状态和页面标题。
- 挂载 Demo 浮球并绑定视角切换。
- 本期不拥有业务状态和持久化逻辑。

### Demo 视角切换

- 视角类型增加 `emenu-local`。
- 菜单增加“eMenu本地配置后台”选项，并在 eMenu Shell 内显示为当前项。
- eMenu 入口在 MVP 与未来版本中均可见，本期不将它归类为产品版本差异功能。
- eMenu 入口继续服从现有 `isViewSwitchRestricted()` 代登录门控；代登录锁定时不显示该入口，直接访问 eMenu 路由也返回商家后台品牌多门店首页，不绕过数据范围限制。
- eMenu Shell 内的其他视角选项继续服从现有产品版本与权限门控：MVP 下不恢复集团总部和 M 平台，未来版本下按现有规则展示；不得为了本功能放宽既有守卫。
- 进入和退出操作统一处理其他 Shell 模式，保证任一时刻只有一个 Shell 生效。
- eMenu Shell 调用 Demo 浮球时关闭版本切换，与 M 平台行为一致。

### 国际化

所有新增可见文案进入现有 i18n：入口名称、Shell 名称、五个导航名称、五个页面说明、“功能建设中”和无障碍标签。中文名称以本设计为准；英文使用一致的 eMenu Local Configuration 语义。

## 异常与降级

- 未知 eMenu 子路由重定向到设备设置，不渲染空白页。
- 缺少挂载节点时安全返回，不写入业务数据。
- `sessionStorage` 不可用时仍依据当前 Hash 渲染 eMenu Shell；跨 Shell 点击通过路由完成跳转。
- 占位页不发起网络请求，因此不设计加载、失败或重试状态。

## 预计修改边界

- `src/shell/app-shell-mode.ts`：增加 eMenu Shell 模式及进入/退出判断。
- `src/shell/view-switch-control.ts`：增加 eMenu 视角项与跨 Shell 切换。
- `src/shell/emenu-local-shell.ts`：新增独立 Shell、路由数据和占位页渲染；若文件过大，再将路由常量拆成独立小模块。
- `src/shell/demo-switch-control.ts`：仅在现有参数不足时补充语义，不重写浮球交互。
- `src/main.ts`：接入 eMenu 路由识别、挂载与退出流程。
- `src/i18n.ts`：新增中英文文案。
- `src/styles/app.css`：仅添加确有必要且 Tailwind 类无法稳定表达的 Shell 级样式。
- 新增针对路由、视角切换和 Shell 输出的验证脚本或测试。

实现时必须保留当前工作区中与本需求无关的未提交修改；若目标行发生重叠，先重新核对差异再编辑。

## 验证与验收

1. Demo 视角切换中出现“eMenu本地配置后台”，点击后进入设备设置占位页。
2. eMenu Shell 只显示五个一级导航，名称和顺序严格为：设备设置、全局设置、品类设置、菜单分类设置、调味设置。
3. 五个导航均可点击，URL、选中态、页面标题、说明和占位内容同步变化。
4. 在任意合法 eMenu 页面刷新，仍停留在该页面并保持正确选中态。
5. 访问 `/emenu-local` 或未知 eMenu 子路由时落到设备设置，而不是空白页。
6. eMenu Shell 内显示 Demo 视角切换，不显示 MVP / 未来版本切换。
7. 从 eMenu Shell 可切到当前产品版本与账号权限允许的其他视角；未来版本普通账号覆盖门店版、品牌多门店、集团总部和 M 平台，MVP 与代登录继续遵守现有隐藏/锁定规则；目标 Shell 与默认页面正确，旧 eMenu 选中态不残留。
8. 从商家后台和 M 平台均可再次进入 eMenu Shell。
9. 桌面与窄屏下导航、标题和占位卡可用，无溢出、遮挡或双重 Shell。
10. 视觉采用薪资管理与屏保的参考语言：浅灰背景、一体化白色画布、轻描边、低阴影、圆角与蓝色强调；无伪造业务控件。
11. 中英文切换后新增入口、导航、标题和占位文案完整显示。
12. TypeScript、相关结构验证和浏览器主路径 E2E 通过，控制台无新增错误。
13. MVP、未来版本和代登录三种门控状态下，eMenu 入口及其他视角的显隐不绕过现有产品版本和数据范围限制。
