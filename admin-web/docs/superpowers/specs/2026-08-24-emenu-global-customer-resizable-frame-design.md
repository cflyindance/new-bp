# eMenu 顾客流程统一可调整外框设计

## 范围

首页 `/`、开台页 `/setup` 和点餐页 `/order` 共用同一个最外层可调整页面外框。系统设置及其子路由不使用该外框，保持现有全屏管理布局。

## 目标

- 三个顾客页面使用一致的右边缘、底边缘和右下角拖动体验。
- 路由切换不改变外框宽高、显示比例或密度。
- 首页视频、页头、主按钮和页脚在外框内部布局，不再依赖 `100vw`、`100vh` 或 `position: fixed` 相对真实窗口定位。
- 登录、选桌、人数选择、购物车、海报、结账及系统提示等模态覆盖层相对真实屏幕显示，不缩放、不裁切。
- 新开台或顾客会话结束时恢复门店默认；同一会话返回首页继续保留当前尺寸。

## 架构

### `CustomerViewportLayout`

在 `Index` 顾客流程根布局中，使用 `useLocation().pathname` 与精确白名单 `['/', '/setup', '/order']` 判断是否启用统一外框；不得复用基于 hash `includes` 的 `useCheckLocation()`。它只包裹路由 `Outlet` 的顾客页面内容，现有全局弹窗、告警、网络提示和设置页面保持在外框外。进入 `/setting` 或任一 `/setting/*` 时 Provider 可以卸载，因为顾客尺寸必须在离开前同步持久化；返回白名单路由后从持久化记录恢复。

顾客路由启用时，结构为：

```text
真实屏幕宿主
├─ CustomerViewportProvider
│  └─ ResizableCustomerViewport
│     └─ Outlet（Landing / SetupOrder / Order）
└─ 全局模态、遮罩和告警
```

设置路由启用时直接渲染 `Outlet`，不创建边缘感应区。

### 状态归属

现有 `EmenuViewportProvider` 提升到 `Index`，作为顾客流程唯一尺寸状态源。`Order` 删除自己的 Provider 和可调整容器，只消费全局上下文。`Index` 通过 `useSystemConfig().getFinalConfigById(EMENU_DISPLAY_CONFIG_ID)` 取得门店默认，并显式区分“配置尚未加载”和“配置已加载但缺失”；配置晚到时，有任一会话覆盖值就保持覆盖值，无覆盖值才应用门店默认。

偏好继续使用现有单记录 `localStorage['emenu_viewport_preference']`。临时键固定为 `customer-flow:<licenseName>:<deviceUuid-or-browser>`；正式键优先级为 `order:<orderId>`、`table:<areaId>:<tableId>`、临时键。Provider 首次渲染采用同步 lazy initializer 读取当前正式键及临时键，不能先渲染默认后再在 effect 中切换。

键迁移顺序固定为：先把内存中的当前值写入新的正式键；再次读取并校验写入成功；成功后不需要另行删除临时记录，因为单记录存储已被正式键原子替换；失败则保留内存值和原记录并继续使用当前尺寸。正式键变化不得触发 defaults 覆盖当前内存状态。尺寸写入发生在每次合法调整提交时，因此进入设置页导致 Provider 卸载也不会丢失内存兜底。

重置接入点明确如下：清台在 `Landing.handleOpenClear` 的 `tableClear` 权限回调成功后调用 `clearEmenuViewportPreference()` 和 Provider reset；登录/license/table 校验失败在 `Index.onCheckErrorCB` 执行 `clearAllStorage()` 前调用；认证会话过期且重新登录成功后调用；新开台仅在确认创建新桌台/订单会话的成功回调中调用，不能在普通 `gotoSetup()` 导航时调用。普通路由跳转、返回首页、刷新菜单数据或恢复已有订单不清除。

### 页面适配

- `Landing`：根节点使用外框逻辑宽高；背景视频从 `position: fixed`、`100vw`、`100vh` 改为外框内绝对定位和 `100%`；主内容使用 `100%`；Logo 的 `vh/vw` 偏移与 `maxWidth: 96vw`、按钮及页脚尺寸改为容器查询或外框逻辑尺寸令牌；页头和页脚固定在外框内部。
- `SetupOrder`：页面根尺寸、海报、步骤内容和滚动区域消费外框逻辑宽高；选择流程弹窗仍通过真实屏幕 Portal 展示。扫描范围为 `pages/Landing/**`、`pages/SetupOrder/**`、`pages/Order/**` 及其直接布局依赖；仅真实屏幕 Portal/诊断代码可保留窗口尺寸读取，并须加入显式白名单注释。
- `Order`：TopBar、分类和菜品直接渲染到统一外框内容层；保留实测 TopBar 高度和剩余菜单高度计算，不再创建第二个 Provider 或 `ResizableMenuViewport`。

外框缩放时，页面内容使用现有逻辑坐标层映射；各页面仍须根据逻辑宽度主动换行、减列或调整间距，不能仅把固定桌面画面整体压缩。

## 交互规则

- 三个页面共用同一套边缘命中几何、4 px 启动阈值、Pointer Events 生命周期、触摸 `touch-action` 和活动高亮。
- 路由切换期间若正在拖动，先提交最后一个合法尺寸并结束捕获，再切换内容。
- 内部按钮、视频控制、页面滚动和表单不创建额外拖动区域。
- 模态层统一通过 `ViewportModalLockProvider` 注册，内部以 token 集合或引用计数实现 `acquireModalLock()` / `releaseModalLock()`；不能使用会被重叠弹窗提前解除的单一 boolean。MUI `Dialog`、Ant Modal 和既有 Portal 必须挂载到 `document.body`。非 Portal 的路由内覆盖层须提升到 `Index` 的真实屏幕覆盖层或显式指定 body portal。登录、选桌、人数选择、购物车、海报、结账、全局网络/业务时间提示均接入该注册机制；锁数量大于 0 时禁止拖动。
- 设置页面不显示缩放光标或边缘高亮。

## 异常与降级

- 默认配置尚未加载时使用全宽、全高、100% 显示，加载后只在没有会话覆盖值时应用门店默认。
- 临时会话键迁移失败时保留内存中的当前尺寸，本次路由切换不得跳回默认。
- 页面没有可测头部时头部高度为 0；点餐页出现 TopBar 后通过 `ResizeObserver` 更新剩余菜单高度。
- `ResizeObserver` 不可用时在路由切换和窗口尺寸变化后同步测量。

## 验收

- 首页右边、底边和右下角可调整整个首页外框；视频、页头、主按钮和页脚始终位于外框内。
- 首页调整后进入开台页和点餐页，外框 `getBoundingClientRect()` 的宽、高及中心坐标误差均不超过 1 px，显示比例不跳变；临时键迁移到桌台键和订单键的第一帧不得出现默认尺寸。
- 从点餐页返回首页仍保持当前会话尺寸；新开台或会话结束恢复门店默认。
- 点餐页 DOM 中只有一组 `data-emenu-resize-edge`，TopBar、分类和菜品属于同一个可调整外框。
- 开台页的表单与内部滚动不触发拖动，弹窗不被外框裁切。
- 登录、选桌、人数选择、购物车、海报、结账和全局告警的边界相对 `document.body`，祖先链不存在外框 `transform` 或 `overflow: hidden`，在三个页面中均不缩放、不裁切。
- 进入任一 `/setting` 路由后 `data-emenu-resize-edge` 数量为 0，页面恢复既有全屏管理布局；顾客白名单路由中数量恰为 3，返回后恢复当前顾客会话尺寸。
- 指定扫描范围内不再使用 `100vw`、`100vh`、`window.innerWidth` 或 `window.innerHeight` 计算内部布局；允许项必须有 `emenu-real-screen-exception` 注释并仅服务 Portal 或诊断。
- 使用请求 mock/spy 验证一次完整拖动期间菜单、桌台和订单请求增量均为 0。
- 新会话重置后外框等于当时已加载的门店默认；门店配置缺失时等于全宽、全高、100%。

## 验证

- 专项静态断言：Provider 仅存在于顾客流程根级，`Order` 无嵌套 Provider/拖动容器，顾客页面无窗口视口单位依赖。
- 浏览器矩阵：1024×768、1280×800、竖屏 768×1024，覆盖首页→开台→点餐→首页及设置页往返。
- 分别验证鼠标、触控笔和触摸拖动，以及模态打开、旋转、刷新和会话重置。
