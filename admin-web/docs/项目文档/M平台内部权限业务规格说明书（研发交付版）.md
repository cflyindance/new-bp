# M 平台内部权限业务规格说明书（研发交付版）

版本：V1.17；日期：2026-11-03；变更编号：ROLE-NAMES-20261103-01。
共同基线：平台管理／商户访问角色命名及既有列表和工作台；起始 main@44cb0cf7。
配套：[产品权威 V1.17](M平台内部权限产品权威需求文档.md) · [研发交付 V1.17](M平台内部权限业务规格说明书（研发交付版）.md) · [个人规范 V1.17](M平台内部权限需求文档（个人规范版）.md)。
状态：按本次确认实现的本地原型；生产服务端鉴权、真实账号服务尚未接入。三份采用同一业务定义。

本文件展开产品权威的字段、计算、状态、存储与测试，不新增业务规则。


测试资料（非产品权限规则）：[Demo 数据与验证记录](../验证记录/权限管理中心Demo数据与验证记录.md)。演示样例清单及操作实测状态以此记录为准。

## 角色与权限命名

| 位置 | 平台管理 | 商户访问 |
| --- | --- | --- |
| 二级导航 | 平台管理角色 | 商户访问角色 |
| 列表及应用页头标题 | 平台管理角色与权限 | 商户访问角色与权限 |
| 员工配置维度 | 平台管理 | 商户访问 |
| 角色配置标题 | 平台管理角色 | 商户访问授权 |
| 生效权限标题 | 平台管理生效权限 | 商户访问权限 |
| 变更记录类型 | 平台管理权限 | 商户访问权限 |

平台管理角色定义员工在M平台可访问的菜单与操作；商户访问角色定义员工进入商户后台后的菜单与操作，实际对象仍结合品牌／门店授权范围。用户自建角色名称不自动替换。当前维度仍独立保存，平台管理保存入口显示“保存平台管理角色”，商户维度仍为“保存商户访问授权”。
路由、菜单id、角色id、资源键、surface=m/merchant及type=m/provider保持原值，不迁移授权或改写历史审计。产品名称“M平台”和真实目标“商户后台”保持原含义。

实现：展示常量统一位于 `m-platform-catalog.ts` 的 `PERMISSION_ROLE_LABELS`；目录及侧栏复用短名，精确列表路由映射使用完整页名。只改标题和值标签，不变更校验、记录action内容或存储结构。

## 两类角色列表

页面名称、固定表头、操作顺序与视觉口径见配套产品文档本节；以下定义仅说明字段映射与实现边界，不另行决定授权。

| 字段 | 类型／来源／默认 |
| --- | --- |
| role.id | string，各类角色快照的原标识，必须存在；不因展示统一而迁移 |
| 角色名称 | string，role.name；展示转义，系统标识保留 |
| 描述 | string，role.description，空值显示“—” |
| 关联员工标识 | 派生string数组，仅取当前类别角色的显式关联，按员工标识去重，不存储新副本 |
| 关联员工数 | 非负整数，去重数组length，空数组为0，与只读名单同一口径 |
| 员工姓名 | string，按employeeId匹配账号目录；缺失／空值显示“—”，不丢失关联工号 |
| 工号 | string，原employeeId；文本转义展示，不以邮箱替代 |
| 操作槽位 | 原href或data事件标识及禁用／隐藏状态；仅以公共名称和顺序渲染 |

### 关联字段与只读边界

- M 角色按 `employees[].roleIds.includes(role.id)` 选取 `employees[].id`；商户访问角色按 `employees[].bindings.some(binding.roleId === role.id)` 选取 `employeeId`。两者各自使用独立快照，再以Set按员工标识去重；不按品牌／门店绑定数量累加，不跨类别合并。
- 员工目录按 `employeeId` 匹配 `employeeName`，未找到或姓名为空时显示“—”，仍保留原工号；不展示邮箱／电话。成员计数不影响删除校验与权限计算。
- 公共组件 `role-list-ui.ts` 只渲染表头、外框、操作槽位、人数和名单；调用方传入原事件属性、href及禁用／隐藏结果。标签和操作顺序共用，原审计操作标识不改。
- 名单使用原生dialog，标题id唯一，关闭按钮和Esc都通过close事件移除弹框并恢复原触发按钮焦点；无form、submit或存储写入，不改变草稿与离开保护。原表单及记录页面不修改。

| 算例 | 结果 |
| --- | --- |
| 同一商户角色，员工A绑定两家门店、员工B绑定一家 | 2 人，名单A／B各一行 |
| 一个员工分别关联M角色和商户角色 | 各列表只计算自己的角色关联，不互相补计 |
| 空角色 | 0 人，可打开空名单，无保存操作 |
| 员工目录缺少工号ent9 | 仍计1 人，姓名“—”、工号ent9 |
| 角色名或员工名含HTML字符 | 按文本转义，不执行HTML |
| 系统角色／无编辑权限 | 原删除保护及按钮权限保持；人数查看不触发写权限判断 |

## 独立页面页头

角色权限编辑、商户访问角色配置及员工工作台遵守[公共页头规则](独立页面头部布局产品权威需求文档.md)：主返回在标题左，页面级保存/预览在右；底部只保留状态。员工工作台维度保存随当前配置维度显示在页头右侧，两个维度仍分别保存；添加授权保持在内容区域；权限和草稿保护不变。

## 员工权限工作台（EMPLOYEE-WORKBENCH-20261103-01）

共同基线：本地 main@750b4cb3，功能分支 codex/employee-access-tabs-20261103，外部 Chrome 功能预览 5318。用户已授权提交并合并本地 main，未授权推送；实际提交和合并结果以 Git 核验为准。本节替代 V1.13 上下双区及独立预览跳转的交互定义；两类角色、范围、保存校验和演示数据不迁移。

截图来源统一为 2026-11-03 当前功能分支、外部 Chrome、5318 端口的隔离本地演示数据。临时角色和范围修改用于验收，已恢复原配置，保留本地测试日志，不代表真实商户授权历史。

### 逐操作覆盖清单

| 页面 / 操作 | 入口 → 界面 / 结果截图 | 当前结果 |
| --- | --- | --- |
| 员工工作台入口 | returned-list → config-m / legacy-merchant | 身份、状态、两组页签定位正确 |
| 切换角色配置 / 生效权限 | both-drafts → merchant-saved-snapshot / m-saved-snapshot → m-draft-retained / merchant-draft-retained | 两类草稿保留，预览只取保存快照 |
| 切换 M / 商户维度 | cross-dimension-draft / both-drafts / effective-m / effective-merchant | 四种组合，保留当前工作方式 |
| 键盘右箭头切换维度 | M 草稿 → remove-draft | 已实测；Home / End / 左箭头未单独截图 |
| M 角色勾选及取消 | config-m → m-draft-retained；returned-list 显示恢复结果 | 已选数量、未保存标记正确 |
| M 角色保存确认 | m-draft-retained → m-save-confirm → m-saved-refreshed | 只更新 M；商户草稿仍在 |
| 商户添加授权 | config-merchant → add-binding → required-binding | 标题右侧入口，空角色/范围不能加入草稿 |
| 商户编辑授权 | config-merchant → edit-binding → both-drafts | 原角色、两门店回填；加入待保存配置后才成为草稿 |
| 商户移除 | config-merchant → remove-draft | 只移除草稿，保存快照仍可预览 |
| 商户保存确认 | merchant-draft-retained → merchant-save-confirm → merchant-saved-refreshed | 保存后再次切入预览取新角色 |
| 系统管理员商户区 | config-m → system-merchant | 只读说明，不显示添加/保存按钮 |
| 点击菜单 | effective-m → menu-detail | 详情随所选菜单更新 |
| 搜索菜单 | effective-m → menu-search / menu-search-empty | 定位菜单与无匹配空态；清空恢复列表 |
| 显示全部权限 | m-saved-snapshot → all-permissions | 含不可见菜单和禁止操作 |
| 展开 / 收起操作组 | effective-m → action-groups / all-permissions | 允许默认展开，禁止默认收起，状态可切换 |
| 切换商户目标 | merchant-saved-snapshot → target-switch | 仅所授权两店，目标角色与菜单上限联动 |
| 返回列表 / 继续编辑 | remove-draft → leave-confirm → leave-cancel | 单一双维提示，取消留页保留草稿 |
| 返回列表 / 放弃并离开 | leave-confirm → returned-list | 一次确认后离开，已保存授权未变 |
| 旧链接 | merchant-access → legacy-merchant；旧 staff/:id → final-workbench | 商户配置 / M 生效的默认定位正确 |

本次没有全量重跑历史模块的每项异常操作；缺少本版本的多角色（超过 5 个）搜索截图、受限员工真实登录、停用画面、保存取消/并发/写入失败和原生刷新关闭确认截图，保留原规则并登记为截图缺口，不声明全部操作或异常截图完整。

### 工作台身份与双层页签

![角色配置 M 平台](images/employee-workbench/config-m.png)
![角色配置商户后台](images/employee-workbench/config-merchant.png)

| 元素 | 逻辑说明 |
| --- | --- |
| 返回列表 | 位于标题左；真正离开当前员工时检查全部维度草稿，不因为当前面板没有修改就忽略隐藏维度 |
| 标题 / 邮箱 / 启停 | 标题为员工权限及姓名；账号目录提供邮箱、enabled。不存在提示员工不存在；停用角色配置保留，但生效权限不可访问 |
| 工作方式 | 角色配置、生效权限。仅切换当前内容，不提交、不丢草稿、不弹离开提示；维持当前 M / 商户维度 |
| 权限维度 | M 平台、商户后台。独立保存；有草稿的维度标注未保存，切换后标记仍保留；支持左右箭头及 Home / End 焦点和选择 |
| 生效提示 | 任一维草稿存在且正在看生效权限时显示“存在未保存的修改，当前仅展示已保存的生效权限。”；没有草稿或返回配置时不展示 |
| 内容与滚动 | 一次只展示当前组合；生效页左树和右详情各自滚动，避免把所有菜单/操作纵向平铺到页面底部 |

### 平台管理角色配置与独立保存

![角色修改并跨页签保留](images/employee-workbench/m-draft-retained.png)
![独立保存确认](images/employee-workbench/m-save-confirm.png)
![保存后生效页刷新，商户草稿仍在](images/employee-workbench/m-saved-refreshed.png)

| 字段 / 操作 | 逻辑说明 |
| --- | --- |
| 角色多选 | 回填已保存 M roleIds，默认 []；已选数为当前草稿 ID 数。清空后该员工无 M 平台权限，不删除商户绑定 |
| 搜索角色 | 角色数超过 5 个才展示，按名称匹配；筛选不清除未显示的已选角色。无匹配显示没有匹配角色。本版本没有构造超过 5 个角色的浏览器截图 |
| 保存与状态 | 每维一个保存按钮；无变更显示无未保存修改并禁用。无 staff/assign 时只读、不显示可保存按钮。确认弹框沿用员工、待保存角色及保存范围说明 |
| 成功 | saveMState 仍校验当前操作者、revision、授权上限及最后管理员；仅更新 M 保存快照、revision、日志、脏状态。切回生效页读取新保存结果 |
| 取消 / 失败 | 原取消、并发冲突、最后管理员、持久化错误规则保留，草稿不丢、不把失败标成已保存；其弹框本版本截图待补，不将上一版截图冒充本版 |

### 商户角色、品牌 / 门店范围与独立保存

![商户配置入口](images/employee-workbench/config-merchant.png)
![添加授权弹框](images/employee-workbench/add-binding.png)
![必填失败结果](images/employee-workbench/required-binding.png)
![编辑现有角色与两店回填](images/employee-workbench/edit-binding.png)
![加入商户草稿，另一维草稿保留](images/employee-workbench/both-drafts.png)

添加授权位于区域标题右。继续要求一个有效访问角色和至少一个当前操作者可授权的品牌/门店；空选提示请选择访问角色和至少一个品牌／门店。编辑保持原绑定 ID、scope.mode、scope.ids 的回填；加入待保存配置不直接生效。范围搜索、切换清空确认和取消弹框沿用原规则。

![移除仅改变草稿](images/employee-workbench/remove-draft.png)
![保存确认](images/employee-workbench/merchant-save-confirm.png)
![保存后角色刷新且无未保存提示](images/employee-workbench/merchant-saved-refreshed.png)

移除仍只修改本维草稿；在保存前，生效页继续取原绑定。保存沿用 saveProviderState 的 manage 动作、revision、目标和菜单上限、系统兼容 ID 及有效角色校验，原会话重校验与日志写入不变。只影响商户源，不能清除 M 草稿。已保存后再次切入生效页显示新角色；失败/取消保留草稿，当前版本异常截图待补。

![系统管理员的商户授权只读](images/employee-workbench/system-merchant.png)

系统兼容员工显示全部品牌/门店、按商户菜单上限访问；不显示添加或保存商户授权按钮。普通只读用户也不显示可保存按钮；没有 provider-roles 查看权限不读取/挂载商户明细，只显示无查看权限说明。不因选择 M 管理员角色自动获得系统兼容商户身份。

### 生效权限：保存快照与草稿隔离

![未保存商户改成财务角色，生效页仍为已保存订单角色](images/employee-workbench/merchant-saved-snapshot.png)
![M 勾选管理员但未保存，生效页仍未分配](images/employee-workbench/m-saved-snapshot.png)
![返回配置仍保留原 M 勾选](images/employee-workbench/m-draft-retained.png)
![返回商户配置仍保留财务角色草稿](images/employee-workbench/merchant-draft-retained.png)

角色配置的两个 DOM 和草稿在页签间保留；生效页不接收配置草稿。每次从角色配置切入生效权限，重新取已保存快照；同一轮生效页内换维度不重建已挂载预览，不丢其搜索/选择。生效页读取新版本不能覆盖配置区的并发基线，返回配置后仍按原 revision 保存，冲突时仍拒绝覆盖。

### M 生效权限：菜单树、搜索与详情

![M 菜单树与操作分组](images/employee-workbench/effective-m.png)
![点击服务包管理切换详情](images/employee-workbench/menu-detail.png)
![搜索定位全量设备](images/employee-workbench/menu-search.png)
![搜索无匹配](images/employee-workbench/menu-search-empty.png)
![不可见菜单与禁止操作](images/employee-workbench/all-permissions.png)
![分组展开收起](images/employee-workbench/action-groups.png)

| 元素 | 逻辑说明 |
| --- | --- |
| 角色摘要 | 仅取已保存员工 M 角色名称；没有显示未分配角色，不读取勾选草稿 |
| 搜索菜单 | 按模块名、菜单名匹配，不改变授权；没有匹配显示空态，清空恢复当前显示范围的菜单 |
| 显示范围 | 默认可访问菜单，即 mResolve 页面结果非 hidden；全部权限包含不可见菜单。切换不新增授权 |
| 菜单树 | 按 M 模块分组，点击叶子在右侧显示菜单，当前项高亮；过滤导致原选择消失时选择第一个匹配菜单 |
| 详情状态 | 用已保存角色并集、上级门槛与 enabled 计算可编辑/可查看/不可见。隐藏菜单说明下级操作不生效，无独立操作时给出说明 |
| 允许 / 禁止操作 | 每项按 mResolve(action) 是否 edit 分组，允许默认展开，禁止默认收起；显示组内数量，可展开/收起，空组显示无。仍允许页面只读但获独立输出动作（如导出）的既有规则 |

### 商户生效权限：范围和目标菜单上限

![商户菜单树预览](images/employee-workbench/effective-merchant.png)
![切换第二家授权门店](images/employee-workbench/target-switch.png)

复用商户权限菜单树与详情。预览目标同时满足员工已保存范围和当前操作者可访问范围；展示当前目标匹配的已保存角色（去重），系统兼容身份显示系统管理员。切换目标重新计算角色并集与品牌 ceiling、门店 enabledKeys 映射资源集的交集。停用、无匹配范围、未开通菜单均不能产生可访问结果；截图中演示订单/财务角色受目标菜单上限限制为空态，不为演示开放权限。

### 真正离开员工：一次确认、保留保存结果

![统一列出两维草稿的离开确认](images/employee-workbench/leave-confirm.png)
![继续编辑结果](images/employee-workbench/leave-cancel.png)
![放弃后返回列表，原授权保留](images/employee-workbench/returned-list.png)

普通页签切换不提示。返回列表、进入其他员工或其他实际 hash 路由时，如存在任一维草稿，统一工作台弹框列出受影响维度。继续编辑留在原页签和地址、保留全部草稿；放弃并离开清除离开拦截后执行原目标导航，只丢未保存内容，不回退已保存的角色、范围或日志，也不再连弹第二个维度确认。刷新/关闭仍使用浏览器 beforeunload，当前原生层截图待补。

### 旧入口与当前地址

![旧 merchant-access 默认商户配置](images/employee-workbench/legacy-merchant.png)
![旧 staff/:id 默认 M 生效权限](images/employee-workbench/final-workbench.png)

/roles 默认角色配置＋M；/roles/preview 与旧 /staff/:id 默认生效权限＋M；旧 /merchant-access 默认角色配置＋商户；surface=merchant 定位商户维度。内部页签通过 replaceState 更新同员工地址，不触发 hashchange 或重挂配置区；更新离开保护的返回地址。真实导航、刷新与关闭继续受草稿保护，旧链接原路由可见性检查不放宽。

### 当前验证状态与边界

类型检查与员工路由/摘要、M 菜单及动作分组（含只读页独立输出动作）、停用/未知员工、快照不可变测试通过；原演示数据保护、M 角色、商户访问 16 项及集中日志隔离回归通过。外部 Chrome 实测四种组合、键盘维度切换、两类草稿跨页签、生效只取保存数据、保存刷新、两维标记、系统只读无保存、树搜索/空态/全部过滤、操作折叠、目标切换、统一离开取消/放弃与旧入口。当前测试未覆盖项见清单；不把前端演示验证等同于生产服务端鉴权或部署验证。

### 研发实现契约

employee-access-ui.ts 保留 M 配置根及惰性挂载的商户配置根，仅切换 hidden；mode 为 config/effective，surface 为 m/merchant，不持久化到授权存储。进入 effective 时 generation 加一，M/商户预览按本轮代数各挂载一次，预览子根重新创建避免重复事件监听；配置 saved revision 不因预览读取而变更。

employee-access-domain.ts 的 mEmployeePermissionPages 输出 M_PAGE 及其 mResolve 结果和动作 allowed 布尔值；不写源对象。employeeWorkbenchSurface 解析 surface=merchant 与旧 merchant-access，未知 surface 回退 m。employee-m-preview.ts 只读 readMState 快照，过滤/搜索/选择只作用于本地视图。provider-access-ui.ts 的 workbench 选项只调整嵌入布局、添加位置与只读保存可见性，employeePreview 仍从保存态及账号状态计算，不接受编辑草稿。

统一离开拦截以两类 dirty 的并集为条件，弹框不写存储。确认放弃先解除全局拦截再恢复原导航；内部 replaceState 后重新登记保护地址，避免取消导航回到其他页签的旧地址。beforeunload 仍只在有草稿时注册有效拦截。


## 历史布局：员工统一角色与权限配置（EMPLOYEE-ACCESS-CONFIG-20261103-01）

本节记录 V1.13 历史布局；当前页签、保存态预览和离开提示以 EMPLOYEE-WORKBENCH-20261103-01 为准。原角色与范围规则保留。既有两类角色、员工绑定、演示数据及授权校验继续有效，不迁移或合并存储。共同基线 main@a0ed2503，功能分支 codex/employee-role-config-20261103，外部 Chrome 功能验收端口 5317；用户已授权提交并合并本地 main，未授权推送；实际结果以 Git 交付核验为准。

图注统一：2026-11-03 当前功能分支，外部 Chrome 真实截图；独立端口的本地演示数据，不是真实商户授权操作。测试中的临时 M 角色和商户绑定已恢复，保留测试操作的本地审计记录。

### 本次逐操作覆盖清单

| 操作 | 入口 → 操作界面 → 结果 | 验证情况 |
| --- | --- | --- |
| 配置角色与权限 | staff → config / final-config | 两维同页、员工与原绑定回填 |
| 查看权限 / 权限预览 | config → preview / m-admin-preview | 已保存状态，只读，两维独立 |
| 切换预览对象 | preview → preview-target | 仅员工与当前操作者可访问目标，两家门店切换 |
| 勾选 / 取消 M 角色 | config → both-dirty | M 草稿独立，清空后无 M 权限 |
| 保存 M 角色，取消确认 | both-dirty → m-confirm → m-cancel | 不写入，保留两类草稿 |
| 保存 M 角色，确认 | m-confirm → m-saved-provider-dirty | 仅 M 维度已保存，商户草稿仍在 |
| 添加商户授权，必填校验 | brand → binding-add → binding-required | 空角色/范围不能加入草稿 |
| 编辑商户授权，取消 | config → binding-edit → binding-cancel | 回填角色与两门店，取消不修改绑定 |
| 编辑商户授权，加入草稿 | binding-edit → both-dirty | 待保存，不立即生效 |
| 移除商户绑定 | brand → binding-remove-draft | 仅草稿移除，保存前原授权继续生效 |
| 保存商户授权，取消确认 | both-dirty → provider-confirm → provider-cancel | 不写入，保留两类草稿 |
| 保存商户授权，确认 | provider-confirm → provider-saved-m-dirty | 仅商户维度已保存，M 草稿仍在 |
| M 保存失败：最后管理员 | m-confirm → last-admin-error | 拒绝保存，保留草稿 |
| M 保存失败：并发冲突 | m-confirm → concurrent-error → concurrent-draft | 拒绝覆盖，取消弹框后草稿仍在 |
| 商户草稿离开：取消 / 放弃 | binding-remove-draft → provider-leave → provider-stay / returned-list | 取消留页，放弃丢草稿并返回 |
| M 草稿离开：取消 | M 角色修改 → 系统确认框 | 已验证不跳转；原生层截图待补 |
| 返回列表 / 返回配置 | config → returned-list；preview → config | 页面与目标员工保持正确 |
| 旧商户授权链接 | 旧 merchant-access URL → legacy | 进入同一统一页面 |

覆盖边界：本次没有补齐旧模块全部操作截图。受限员工真实登录、账号停用画面、存储损坏/写入失败、商户保存并发失败、范围搜索与切换确认的异常截图待补；其既有规则保留。原生确认框无法用网页截图代替，未声称全部操作或全部异常截图完整。

### 员工列表：双维摘要与统一入口

![员工列表](images/employee-access-config/staff.png)

| 元素 | 逻辑说明 |
| --- | --- |
| 角色摘要 / M 平台 | 来源为 MState.employees.roleIds，通过角色 ID 映射名称；无角色显示未分配，失效引用显示失效角色；不根据商户授权推导 M 角色 |
| 角色摘要 / 商户访问 | 来源为该员工每条 ProviderBinding，逐条显示访问角色名和 scope.ids.length；brands 单位为个品牌，stores 为家门店，多条用分号连接，不将不同范围合成一个总数量 |
| 系统员工摘要 | systemEmployeeIds 中的员工显示“系统管理员 · 全部品牌／门店”，仍受商户菜单上限限制 |
| 空值与异常 | 无绑定显示未配置；无商户角色页权限显示无查看权限，不读取该明细；数据解析失败显示数据读取失败，保留独立 M 维度 |
| 配置角色与权限 | 替换旧分配角色按钮和独立商户访问授权链接；导航到 /m-platform/permissions/staff/:id/roles；员工页可见即可进入查看，各维写操作另校验 |
| 查看权限 | 旧 /staff/:id 继续可用，展示双维只读预览，不能编辑或将草稿当作已生效权限 |

### 配置页：M 平台角色与商户访问授权

![统一配置页](images/employee-access-config/final-config.png)
![品牌范围回填](images/employee-access-config/brand.png)
![另一品牌回填](images/employee-access-config/finance-brand.png)

| 元素 / 字段 | 逻辑说明 |
| --- | --- |
| 返回列表 / 标题 / 权限预览 | 返回在页面标题左，权限预览在右；返回员工列表，预览带当前 employeeId。存在任一维草稿均先执行离开保护 |
| 员工信息 | 由既有员工账号目录按 ID 查询姓名、邮箱、enabled。不存在则提示员工不存在；停用显示全部权限不生效，不删除原角色与范围 |
| M 平台角色 | string[] 角色 ID，多选，默认已保存 roleIds 或 []；清空即无 M 角色。仅 staff/assign 可编辑。角色并集、上级菜单约束与最后管理员保护沿用 |
| 商户授权区域 | provider-roles 页不可见时仅显示无查看权限，不调用商户编辑器或读取该区域明细；可见但无 manage 动作时只读。系统兼容员工不显示可修改绑定 |
| 商户访问角色 | 每条绑定一个有效商户角色 roleId；配置入口不修改角色本身的菜单定义 |
| 品牌 / 门店范围 | 保持 scope.mode=brands 或 stores、非空且不重复的 scope.ids，角色与范围必须同时指定。品牌含新增门店，指定门店不自动包含新门店，也不能提升为品牌访问 |
| 两类保存与状态 | 每区独立按钮、独立已保存/未保存状态。无变更或无对应动作权限时禁用。成功仅更新本区快照、revision、日志并解除本区脏状态；另一维草稿保留 |

### M 平台角色：勾选、保存、取消与失败

![修改角色后的两类草稿](images/employee-access-config/both-dirty.png)
![确认 M 角色变更](images/employee-access-config/m-confirm.png)
![取消确认后草稿保留](images/employee-access-config/m-cancel.png)

确认弹框列员工和待保存角色，空选择显示未分配。取消仅关闭弹框，不写存储；确认调用 saveMState，gate=staff/assign，沿用授权上限、有效账号、revision 与最后一名启用管理员检查。保存对象为员工 ID，日志动作沿用分配角色，不含账号凭据。成功无跨维事务，不保存商户草稿。

![仅 M 保存成功，商户仍为草稿](images/employee-access-config/m-saved-provider-dirty.png)
![最后管理员校验失败](images/employee-access-config/last-admin-error.png)
![并发版本校验失败](images/employee-access-config/concurrent-error.png)
![关闭错误弹框后草稿仍在](images/employee-access-config/concurrent-draft.png)

失败不关闭弹框，不更新本区保存状态、不写入成功日志，保留勾选。并发失败须重新打开获取新快照后复核，不自动覆盖其他窗口，不自动合并未确认配置。

### 商户授权：添加、编辑、取消与移除

![添加入口](images/employee-access-config/brand.png)
![新增授权弹框](images/employee-access-config/binding-add.png)
![角色与范围必填校验](images/employee-access-config/binding-required.png)

新增默认指定门店、未选择角色/对象；至少选择一个有效角色和一个当前操作者可授权品牌/门店。失败提示“请选择访问角色和至少一个品牌／门店。”，留在弹框，不增加绑定。范围搜索、切换时清空确认沿用原交互，无新增范围语义。

![编辑入口](images/employee-access-config/config.png)
![角色和两家门店回填](images/employee-access-config/binding-edit.png)
![取消编辑结果](images/employee-access-config/binding-cancel.png)

编辑复用原绑定 ID；加入待保存配置仅更新商户草稿。取消只关闭，不修改已有绑定，也不清空 M 草稿。

![移除后的待保存状态](images/employee-access-config/binding-remove-draft.png)

移除只影响本区草稿；提交前原保存绑定有效。要恢复可放弃本区草稿并重新进入，不在点击移除时直接写日志。

### 商户授权：保存确认、取消及独立结果

![确认入口的商户草稿](images/employee-access-config/both-dirty.png)
![商户授权保存确认](images/employee-access-config/provider-confirm.png)
![取消确认后两类草稿保留](images/employee-access-config/provider-cancel.png)
![仅商户保存成功，M 仍为草稿](images/employee-access-config/provider-saved-m-dirty.png)

确认仍调用 saveProviderState，校验 provider-roles/manage、当前操作者、expected revision、有效角色和目标、可授权对象与菜单上限、系统兼容 ID 不变。成功更新商户源 revision 和日志，动作沿用更新商户访问范围，触发既有会话重校验。失败保留草稿并展示原错误，不修改 M 状态；写入失败与商户并发错误截图待补。正常保存后的两个状态见下图。

![两类保存完成且演示配置恢复](images/employee-access-config/saved.png)

### 离开保护、返回及旧链接

![商户草稿离开确认](images/employee-access-config/provider-leave.png)
![取消离开，草稿仍在](images/employee-access-config/provider-stay.png)
![放弃修改后返回列表，原授权保留](images/employee-access-config/returned-list.png)

任一维未保存都阻止直接跳走。M 草稿使用既有浏览器原生确认，准确文案“M 平台角色有未保存的修改，确定放弃并离开？”；取消留页，确认继续检查另一维。商户草稿沿用自定义放弃弹框，取消留页；确认放弃后仅丢未保存内容并执行原目标导航。已保存内容与记录不回退；刷新/关闭页签仍有 beforeunload 保护。M 原生确认的真实截图待补。

![旧 merchant-access 地址进入统一配置](images/employee-access-config/legacy.png)

旧地址兼容到统一配置实现，不进行数据迁移；旧链接仍保留原路由权限检查。角色定义入口仍在角色与权限菜单，不并入员工账号编辑。

### 权限预览与切换目标

![从统一配置进入预览](images/employee-access-config/config.png)
![员工双维权限预览](images/employee-access-config/preview.png)
![M 管理员已保存菜单与操作](images/employee-access-config/m-admin-preview.png)
![切换到第二家已授权门店](images/employee-access-config/preview-target.png)

| 元素 / 计算 | 逻辑说明 |
| --- | --- |
| M 平台访问权限 | 仅取已保存 M 角色并集及账号 enabled，用 mResolve 计算菜单与动作；隐藏菜单不列出，无允许动作显示无，无菜单显示暂无可访问的 M 平台菜单 |
| 预览品牌／门店 | 对象必须同时匹配员工已保存绑定与当前操作者可访问范围；指定门店绑定不出现品牌层目标，不出现未授权门店；默认第一个有效目标，无目标显示暂无可预览范围 |
| 商户访问权限 | providerRoleAccess 的角色并集与所选品牌 ceiling、门店 enabledKeys 映射资源集求交；账号停用、范围不匹配或任一上限不含该资源均不可见。不把预览结果自动作为 M 入口或代登录动作授权 |
| 空态 | 角色有配置但目标菜单未开通时显示当前对象暂无可访问菜单；不为演示强行开放。截图中两店订单角色受实际菜单上限限制出现此状态 |
| 只读与保存源 | 预览没有保存按钮、不写日志；未保存修改须先保存或明确放弃才能离开配置页。两类配置各自成功后才进入各自已保存预览源 |
| 返回配置 | 回到同一员工的 /roles，不重置另一员工数据 |

### 实现与验证记录

复用 m-platform-store.ts 与 provider-access-store.ts，不改变存储键、schema、日志来源或系统兼容 ID。新 employee-access-ui.ts 组合两区及离开保护；provider-access-ui.ts 增加嵌入和员工只读预览；employee-access-domain.ts 负责路由解析、摘要与员工权限/上限交集。

类型检查、统一/旧路由、摘要、范围与双上限、停用预览测试通过；M 平台角色与动作回归、商户访问 16 项、预设演示数据保护、集中日志隔离回归通过。外部 Chrome 实测双向保存隔离、确认取消、最后管理员拒绝、双窗口并发拒绝且草稿保留、添加必填、编辑回填、移除草稿与放弃、旧链接、预览目标切换。未验证项见覆盖清单，不宣称生产服务鉴权或全部异常截图完成。


## 员工商户访问授权演示数据（PROVIDER-EMP-DEMO-20261103-01）

演示数据规则继续有效；本节独立授权页截图与入口属于历史，当前统一配置入口见 EMPLOYEE-ACCESS-CONFIG-20261103-01。

基线本地 main@8505040b；分支 codex/provider-employee-demo-20261103；外部 Chrome 功能验收端口 5316。用户已授权提交并合并本地 main；未授权推送，实际提交与合并结果以 Git 交付核验为准。本次在尚无保存授权数据的演示环境补充员工绑定，不覆盖已有角色、员工范围或日志，不修改员工的 M 平台内部角色。

### 逐操作覆盖清单

| 页面 / 操作 | 入口与结果图片 | 状态 |
| --- | --- | --- |
| 员工列表进入商户访问授权 | staff → ent002 / ent003 / ent004 | 三位员工各自页面已验证 |
| 编辑已有演示绑定 | ent003 → edit-binding | 角色、范围类型和两店选中状态已验证 |
| 取消编辑 | edit-binding → ent003 | 保留原绑定，未产生保存日志 |
| 刷新授权页 | ent003 → ent003-refresh | 内容保留，无真实草稿提示 |
| 查看角色关联人数 | role-members | 三个角色各 1 人 |
| 查看集中日志 | logs | 6 条演示记录 |
| 按订单角色查看日志 | role-members → role-logs | 角色预设与员工授权预设共 2 条 |

图注统一为 2026-11-03 当前功能分支外部 Chrome 真实截图。所有带“演示”的角色和记录为本地测试数据，不代表真实授权操作历史。本次未新增页面操作，其他保存、删除和异常交互沿用；未对历史全量操作截图作完整性结论。

### 员工与账号入口

![入口：员工与账号](images/provider-employee-demo/staff.png)

点击员工行“商户访问授权”查看其访问角色与品牌/门店范围。列表“角色”仍为 M 平台内部角色，不因本次商家访问绑定自动分配 M 平台角色、代登录动作或其他菜单权限。

### 周预设的品牌授权

![周预设授权](images/provider-employee-demo/ent002.png)

| 字段 | 逻辑说明 |
| --- | --- |
| 员工 | 周预设，ent002 |
| 访问角色 | 演示·经营概览查看员，仅查看权限 |
| 适用范围 | 品牌（含新增门店）：默认演示目录的张记火锅 |
| 数据来源 | 仅匹配现有启用的系统演示账号 acct-ent002；不存在、被替换或停用时不生成该预设绑定 |

### 吴蓝图的指定门店授权

![吴蓝图授权](images/provider-employee-demo/ent003.png)

| 字段 | 逻辑说明 |
| --- | --- |
| 员工 | 吴蓝图，ent003 |
| 访问角色 | 演示·订单查看员 |
| 适用范围 | 指定门店：上海陆家嘴店 M00000001、广州天河店 M00000002 |
| 范围边界 | 仅所选门店；不自动包含新门店，不提供品牌层访问；仍受目标菜单上限和既有入口权限约束 |

### 郑审计的另一品牌授权

![郑审计授权](images/provider-employee-demo/ent004.png)

| 字段 | 逻辑说明 |
| --- | --- |
| 员工 | 郑审计，ent004 |
| 访问角色 | 演示·财务查看员 |
| 适用范围 | 品牌（含新增门店）：茶语一家，与周预设的品牌分离 |
| 管理员边界 | ent001 既有系统兼容范围不变，不创建新系统管理员 |

### 编辑回填与取消

![入口：吴蓝图授权](images/provider-employee-demo/ent003.png)
![结果：指定门店编辑回填](images/provider-employee-demo/edit-binding.png)

角色回填订单查看员，范围类型为指定门店，两家对应门店选中，其余未选。原校验及“加入待保存配置→保存授权”流程不变。

![取消结果：授权保持](images/provider-employee-demo/ent003.png)

取消不变更草稿、绑定或记录。仅查看页面也不产生真实授权日志。

### 刷新、关联人数与日志

![刷新结果](images/provider-employee-demo/ent003-refresh.png)
![角色关联人数](images/provider-employee-demo/role-members.png)

初始演示环境中，每个角色关联 1 位员工。更新角色描述，移除旧“未关联员工”表述；既有删除时绑定校验仍生效，不能直接删除仍有员工绑定的演示角色。

![集中演示日志](images/provider-employee-demo/logs.png)
![订单角色对应记录](images/provider-employee-demo/role-logs.png)

| 字段 / 初始化规则 | 逻辑说明 |
| --- | --- |
| 初始化边界 | 仅 provider-merchant-access:v1 存储键不存在时生成；已有合法空/非空快照原样读取，损坏数据仍报错，不追加演示授权 |
| 有效对象 | 从默认演示企业 enterprise-miju 的现有目录按 BID 排序取前两个品牌；门店按 MID 取前两店；仅绑定 ent002/003/004 的既有启用系统演示账号。目录缺失时跳过对应空范围，不虚构品牌或门店 |
| 角色权限 | 继续使用现有三个演示查看角色，不授予 action 或 setting 编辑权限；员工绑定只声明对象范围 |
| 日志数量 | 原 3 条角色预设，加 3 条员工授权预设，共 6 条；具体数量随有效演示账号和目录是否存在而减少 |
| 授权预设日志 | 固定演示时间 2026-11-03 10:01 / 10:02 / 10:03（UTC+8），操作“演示：预设商户访问授权”，操作人“演示数据（非真实操作人）”，对象为员工姓名及 ID |
| 前后快照 | 只含角色与员工绑定；按样例顺序记录加入绑定前后的员工数组，不含账号密码 |
| 持久化 | 初始化和查看不写授权存储，revision 保持 0；后续用户正常保存仍经原授权、并发版本和目标范围校验 |
| 无自动迁移 | 已有保存数据不会被本次样例扩展，包括曾保存空授权的账号；不自动将之前保存的零员工状态改成已授权 |

### 验证结果

类型检查通过；领域测试覆盖 3 员工/6 日志、品牌隔离、指定门店与新增门店边界、只读权限、缺失账号/目标跳过、既有快照不迁移；原授权 16 项与集中日志隔离回归通过。浏览器验证三位员工详情、编辑回填/取消、刷新、三个角色各 1 人、集中 6 条及单角色 2 条。生产身份服务、CI/部署、受限员工真实登录及保存失败路径未验证。


## 商家访问权限编辑标题栏统一（PROVIDER-EDITOR-HEADER-20261103-01）

基线本地 main@fb1f7bc8；分支 codex/provider-editor-heading-20261103；外部 Chrome 预览 5315。按用户授权提交并合并本地 main，不推送远端；实际提交号以 Git 交付核验为准。范围仅为商家访问角色编辑、预览及共用员工商户授权页的标题栏，不修改 M 平台自身编辑页面或其他业务模块的返回入口。

### 编辑页面标题栏

![编辑状态标题栏](images/provider-editor-heading/edit.png)

图注：2026-11-03，当前功能分支真实画面，演示·订单查看员，无员工绑定。旧截图中返回入口位于右上、预览按钮位于标题下的布局不再作为当前要求。

| 元素 | 逻辑说明 |
| --- | --- |
| 返回列表 | 放在页面标题左侧，保留原链接样式和文字；角色页返回商家访问角色列表，员工授权页返回员工与账号 |
| 标题 | 跟随返回入口显示在左侧一组，名称仍使用当前角色或员工名称 |
| 权限预览 | 放在同一标题栏右侧；沿用 data-provider-preview 和原切换逻辑，不保存或修改授权 |
| 返回编辑 | 预览后在相同右侧位置替换按钮文案，不占用左侧返回列表的位置 |
| 预览对象 | 保留在预览内容区；原目标范围和权限计算不变 |
| 保存与草稿 | 底部保存授权按钮、原禁用规则和未保存离开保护沿用；本次不增加确认流程 |

### 点击权限预览 / 返回编辑

![入口：编辑页](images/provider-editor-heading/edit.png)
![结果：预览页](images/provider-editor-heading/preview.png)

点击权限预览切换为原只读预览，右侧按钮变为返回编辑，左侧返回列表始终保持。预览对象筛选仍位于内容区。

![返回编辑结果](images/provider-editor-heading/edit.png)

点击返回编辑恢复原编辑状态；仅切换视图，不改变草稿和保存状态。

### 点击返回列表

![入口：角色编辑页](images/provider-editor-heading/edit.png)
![结果：商家访问角色列表](images/provider-editor-heading/list.png)

返回仍使用现有列表地址。无修改时直接返回；真实未保存修改仍按原离开保护处理，该异常分支本次未改动或重测。

### 共用员工授权页返回

![入口：员工商户访问授权](images/provider-editor-heading/employee-access.png)
![结果：员工与账号](images/provider-editor-heading/staff-list.png)

共用标题栏将原返回列表入口同样左置。员工页不新增权限预览按钮，不修改员工范围绑定。

### 本次操作覆盖与验证

| 操作 | 前后图片 | 状态 |
| --- | --- | --- |
| 查看标题栏 | edit.png | 实测返回在标题左侧，预览在右侧且同行 |
| 权限预览 | edit.png → preview.png | 已验证 |
| 返回编辑 | preview.png → edit.png | 已验证 |
| 角色返回列表 | edit.png → list.png | 已验证 |
| 员工授权返回列表 | employee-access.png → staff-list.png | 已验证 |

TypeScript 与差异检查通过。验证期间未保存授权、未产生未保存提示；原权限计算、范围、真实草稿放弃确认和保存异常未重测，不对历史全部操作截图完整性作结论。


## 历史：演示数据接回统一角色导航（PROVIDER-DEMO-FIX-20261103-01）

本节保留历史。无员工绑定与三条初始日志的口径已由 PROVIDER-EMP-DEMO-20261103-01 替代；已有存储保护仍沿用。

基线 main@39a417fb；分支 codex/provider-demo-fix-20261103；外部 Chrome 预览 5313。修正前，演示数据代码只留在未合并分支，主线缺少初始化逻辑；本次将其接回最新导航与集中记录，不回退导航、不复制旧文档覆盖新版。本次按用户授权提交并合并本地 main，不推送远端；实际提交号以 Git 交付核验为准。

### 本次操作覆盖清单

| 页面 / 操作 | 入口与结果截图 | 完成状态 |
| --- | --- | --- |
| 进入商家后台访问角色 | before-empty → roles | 已验证，3 个演示角色 |
| 从角色查看记录 | roles → role-log | 已验证，带入对应角色和商家类型 |
| 清除角色条件 | role-log → provider-logs | 已验证，恢复 3 条 |
| 类型选全部 | provider-logs → all-logs | 已验证 |
| 类型选 M 平台权限 | all-logs → m-logs-empty | 已验证，演示商家记录不混入 M 来源 |
| 类型选商家后台访问权限 | m-logs-empty → provider-logs | 已验证 |
| 刷新记录页 | provider-logs → provider-logs | 已验证，仍为 3 条，筛选保留 |

本次均为读取或筛选，无保存、确认或取消弹框；原权限编辑操作沿用，不纳入本次截图完整性结论。存储损坏仍由既有错误流程处理，自动测试覆盖不回退演示；未采集损坏数据的浏览器截图，不声称异常截图完整。

### 进入商家后台访问角色

![修正前：主线无演示数据](images/provider-demo-fix/before-empty.png)
![修正后：演示角色](images/provider-demo-fix/roles.png)

图注：2026-11-03，外部 Chrome，修正分支真实画面；演示角色不是实际员工权限。

| 元素 / 规则 | 逻辑说明 |
| --- | --- |
| 初始化条件 | 仅 localStorage 的 menusifu:provider-merchant-access:v1 不存在时生成演示状态；已有合法数据优先，包括已经保存的空列表，不增补或覆盖 |
| 角色 | 演示·订单查看员 / 演示·财务查看员 / 演示·经营概览查看员；ID 分别 provider-demo-orders / provider-demo-finance / provider-demo-dashboard，3 个普通非系统角色 |
| 权限配置 | 对应模块现有目录的非 action、非 setting、非兼容隐藏资源预设 read；不预设操作或设置编辑权限 |
| 关联员工 | 全部 0；employees 为空，不给任何员工绑定角色或目标，不改变 ent001 既有系统兼容范围 |
| 描述 / 提示 | 角色描述及记录演示标识保留；列表顶部提示已按 PROVIDER-HEADER-20261103-01 删除，集中记录页提示保留 |
| 持久化 | 查看、刷新不写存储，初始化 revision=0；用户后续正常保存仍走既有授权和并发校验 |
| 既有记录 | 已有角色、员工、日志、revision 与系统兼容范围均原样读取；已删除演示角色不会因刷新补回 |
| 损坏数据 | JSON 解析或结构校验失败仍报错，保留原值，不静默用演示覆盖 |

### 从角色查看记录

![入口：演示角色列表](images/provider-demo-fix/roles.png)
![结果：指定角色记录](images/provider-demo-fix/role-log.png)

使用现有查看变更记录入口，进入集中页并带 type=provider 与角色 ID。三个角色各自对应一条预设事件，不新增独立日志页面或权限。

| 字段 | 逻辑说明 |
| --- | --- |
| 类型 | 商家后台访问权限 |
| 时间 | 固定 2026-11-03 09:00 / 08:00 / 07:00（UTC+8），按浏览器本地格式展示，不声称为当前操作时间 |
| 操作人 | 演示数据（非真实操作人） |
| 操作 | 演示：预设访问角色 |
| 对象 | 对应三个演示角色名，按时间倒序 |
| 快照 | 每条 before 为角色与员工空数组；after 为对应演示角色和空员工数组；不含密码 |

### 清除角色条件 / 类型筛选

![入口：单角色条件](images/provider-demo-fix/role-log.png)
![清除结果：三条商家演示日志](images/provider-demo-fix/provider-logs.png)

清除仅去掉角色条件，保留商家类型，显示 3 条；统一记录页就近提示演示性质。

![切换全部结果](images/provider-demo-fix/all-logs.png)
![切换 M 类型结果](images/provider-demo-fix/m-logs-empty.png)

全部仍遵守原来源查看权限；本隔离上下文 M 来源无记录，商家演示记录不混入该类型。选回商家后台访问权限恢复上方三条画面。

### 刷新记录页

![刷新后记录](images/provider-demo-fix/provider-logs.png)

保留 URL 类型筛选；未保存上下文从固定演示状态重建，仍有 3 条，时间不漂移。不产生真实审计。

### 验证

RED：外部 Chrome 主线演示角色数为 0，空态可见。GREEN：修正预览 3 角色、关联员工均 0；角色条件 1 条，清除及刷新后 3 条；类型隔离正常。领域测试覆盖无员工授权、无动作/设置授权、独立副本、已有空/非空状态保留、损坏 JSON 不降级；原访问授权 16 项和集中日志隔离回归通过。生产接口、CI/部署未验证。


## 角色与权限统一入口（ROLE-HUB-20261103-01）

当前有效结构：权限管理中心 → 权限总览 / 角色与权限 / 员工与账号 / 变更记录；“角色与权限”下并列为“平台管理角色”“商户访问角色”。两类角色、员工绑定和权限资源独立，未迁移或合并数据。基线 main@1e84e5e9，功能分支 codex/role-permission-hub-20261103，端口 5312；按用户授权提交、合并 main 并推送，实际提交号及远端状态以 Git 交付核验为准。演示初始化已由 PROVIDER-DEMO-FIX-20261103-01 接回，原角色与记录授权规则不变。

### 本次逐操作覆盖清单

| 操作 | 入口及结果图片 | 状态 |
| --- | --- | --- |
| 点击角色与权限 | permission-parent → m-roles | 已验证，默认 平台管理角色 |
| 切换商户访问角色 | m-roles → provider-roles | 已验证 |
| 切换 平台管理角色 | provider-roles → m-roles | 已验证 |
| 返回上一级 | m-roles → back-parent | 已验证，只退一层 |
| 点击独立变更记录 | permission-parent → audit-all | 已验证 |
| 选择 M 平台权限 | audit-all → audit-m | 已验证 |
| 选择商户访问权限 | audit-all → audit-provider | 已验证 |
| 选择全部 | audit-provider → audit-all | 已验证 |
| M 角色查看变更记录 | m-roles → m-role-audit | 已验证，含无匹配记录状态 |
| 商家角色查看变更记录 | provider-roles → provider-role-audit | 已验证 |
| 清除角色筛选 | provider-role-audit → audit-provider | 已验证 |
| 展开 / 收起前后值 | audit-m ↔ audit-details | 已验证，沿用 M 日志明细 |
| 旧地址访问 | legacy-audit | 已验证，兼容商家日志类型 |
| 无权限类型 / 读取异常 | 待补页面图片 | 权限隔离领域测试通过；受限账号与损坏数据浏览器截图未采集，不声称异常截图完整 |

截图均为 2026-11-03 功能分支实际画面；“导航验收·M空白角色”“导航验收·商家空白角色”为本地隔离验收数据，无权限、无员工绑定；不代表生产操作历史。本次导航及筛选不写数据，无保存、确认或取消弹框。原角色编辑等完整操作截图不在本次调整范围内。

### 点击角色与权限 / 切换两类角色

![入口：权限中心](images/role-permission-hub/permission-parent.png)
![默认结果：平台管理角色](images/role-permission-hub/m-roles.png)

| 元素 | 逻辑说明 |
| --- | --- |
| 角色与权限 | 父菜单整行点击进入公共子导航滑层，默认进入现有 `/m-platform/permissions/roles`；仅有商家角色权限时回落到可访问的商家角色页 |
| 平台管理角色 | 页内标题“平台管理角色与权限”；配置服务商员工在 M 平台内的菜单和操作，沿用 roles 页面、动作权限 |
| 商户访问角色 | 页内标题“商户访问角色与权限”；沿用 provider-roles 地址及动作权限；不将品牌、门店范围合并进 平台管理角色 |
| 当前项 | 切换、直接访问与刷新后恢复子导航并高亮；角色配置的既有草稿保护沿用 |

![切换结果：商户访问角色](images/role-permission-hub/provider-roles.png)

点击“平台管理角色”返回上方 M 角色列表；不修改任一类角色或关联员工。

### 返回上一级

![入口：角色与权限子层](images/role-permission-hub/m-roles.png)
![结果：权限中心层](images/role-permission-hub/back-parent.png)

只返回一层侧栏，保留当前业务内容；再次返回主层沿用公共逻辑。

### 独立变更记录 / 类型筛选

![入口：权限中心](images/role-permission-hub/permission-parent.png)
![结果：全部类型](images/role-permission-hub/audit-all.png)

| 字段 / 操作 | 逻辑说明 |
| --- | --- |
| 地址 | `/m-platform/permissions/change-log`；支持 type=all、m、provider 及 role 参数；默认 all |
| 权限类型 | 全部 / M 平台权限 / 商户访问权限；仅列出原有权限允许的类型，不读取无权来源。全部是允许来源的并集 |
| M 日志查看权 | 沿用 permission-log 页面可见权限；拥有角色编辑权限不自动获得 M 日志查看权 |
| 商家日志查看权 | 沿用 provider-roles 页面可见权限；不增加新授权资源或默认赋权 |
| 切换类型 | 即时重新筛选并清除角色条件，URL 同步，不写日志或授权 |
| 权限类型列 | 标识记录原始来源，两个来源相同 id 不去重，不混淆 |
| 时间列 | 沿用 at 字段，以浏览器本地时间格式展示；合并后按时间倒序 |
| 操作人列 | 沿用 actor 字段，不改为当前浏览者 |
| 操作列 / 对象列 | 沿用 action、object，分别展示并 HTML 转义 |
| 变更详情 | M 来源保留前后值折叠；商家来源保持原展示范围，仅显示摘要，不新增原始快照入口 |
| 空值 / 失败 | 无匹配时“暂无匹配变更记录”；无权请求类型不给记录并提示；某来源解析失败单独提示，保留存储，其他有权来源继续展示 |

![筛选结果：M 平台权限](images/role-permission-hub/audit-m.png)
![筛选结果：商户访问权限](images/role-permission-hub/audit-provider.png)

切回“全部”恢复上方全部类型画面，仅恢复当前允许来源。原权限总览的“最近变更”仍为原 M 权限摘要，本次未扩大范围。

### 从角色查看记录 / 清除角色条件

![M 角色入口](images/role-permission-hub/m-roles.png)
![M 角色结果：带入角色且无匹配](images/role-permission-hub/m-role-audit.png)

M 角色行入口仅在具备原 M 日志权限时展示，带入 type=m、role=角色 ID。

![商家角色入口](images/role-permission-hub/provider-roles.png)
![商家角色结果：带入角色及类型](images/role-permission-hub/provider-role-audit.png)

商家角色带入 type=provider。优先依据前后快照中对应角色的变化或关联员工的角色绑定变化匹配；旧摘要记录可按当前角色名称与对象精确匹配。已删除角色若无可识别快照或名称依据，不猜测关联记录。无匹配仍显示空态，不回退展示全部。

![清除角色条件后的结果](images/role-permission-hub/audit-provider.png)

清除按钮仅移除 role 条件，保留类型；筛选不是编辑，不触发未保存提示。

### 展开 / 收起前后值

![入口与收起状态](images/role-permission-hub/audit-m.png)
![展开结果](images/role-permission-hub/audit-details.png)

只展开当前 M 记录的原始前后值，不新增快照存储；再次点击原位置收起。

### 旧地址兼容

![旧地址结果](images/role-permission-hub/legacy-audit.png)

`/m-platform/permissions/provider-roles/change-log` 继续按商家来源权限进入统一记录界面，默认 type=provider；旧侧栏独立商家日志菜单移除。正常入口统一到权限中心“变更记录”。

### 验证与边界

类型检查、公共导航回归、原商户访问授权 16 项断言、M 平台权限回归、统一日志来源隔离/角色匹配/同 ID/排序测试通过。浏览器验证正常列表、切换、带参、清除、空态、旧地址与明细收起展开。生产服务端、CI/部署、受限账号和损坏数据的浏览器路径尚未验证。


## 历史：商家后台访问角色子导航（M-ACCESS-NAV-20261102-02）

本节为历史版本，导航与日志入口已由 ROLE-HUB-20261103-01 替代，不作为现行导航要求。

本次范围：权限管理中心内的商家后台访问角色拆为两个子菜单。沿用 provider-roles 可见权限和原管理动作；不新增权限资源、不迁移角色或员工绑定。当前功能分支 codex/merchant-access-nav-20261102；main 基线 8b9b3837，端口 5194；按 2026-11-03 用户授权提交、合并 main 并推送，实际提交号和远端核验见 Git 交付记录。

### 操作覆盖清单（本次变更）

| 操作 | 入口 / 后续状态 | 图片 | 状态 |
| --- | --- | --- | --- |
| 打开商家后台访问角色 | 权限中心 → 子导航，默认角色访问设置 | permission-parent / settings-rows | 已验证 |
| 点击角色访问设置 | 日志页 → 角色列表 | logs-rows / settings-rows | 已验证 |
| 点击变更记录 | 设置页 → 独立日志页 | settings-rows / logs-rows、logs-empty | 已验证，有数据及空态 |
| 子层返回 | 商家访问子层 → 权限中心层 | logs-rows / permission-parent | 已验证，只退一层 |
| 权限中心返回 | 权限中心 → 主层 | permission-parent / root | 已验证 |
| M 平台权限变更记录 | 权限中心 → M 平台内部权限记录 | permission-parent / m-platform-logs | 已验证，不混入访问角色日志 |

本清单仅覆盖本次新增或调整的导航操作；历史角色编辑、复制、删除等操作截图完整性不在本次验收结论内。导航无确认或取消弹框；无网络写入，因此不存在新增的保存成功/失败状态。

### 打开商家后台访问角色 / 默认角色访问设置

![入口：权限管理中心](images/provider-access-nav/permission-parent.png)
![结果：角色访问设置](images/provider-access-nav/settings-rows.png)

图注：2026-11-02，5194 功能分支真实截图；“导航验收演示角色”为隔离演示数据，无授权、无员工绑定，不代表真实操作历史。

点击父菜单整行，公共子导航滑层覆盖权限中心层；默认进入角色访问设置，原地址 `/m-platform/permissions/provider-roles` 沿用。新建、配置权限、编辑、复制、删除仍沿用原校验与草稿保护。列表底部不再显示折叠日志。

### 点击变更记录

![入口：角色访问设置](images/provider-access-nav/settings-rows.png)
![结果：独立日志列表](images/provider-access-nav/logs-rows.png)

图注：同一隔离演示分支；记录来自通过现有新建入口保存空白角色的实际操作。

| 字段 / 操作 | 逻辑说明 |
| --- | --- |
| 菜单名称 | 变更记录，仅指商家后台访问角色及商户访问范围的授权变更 |
| 地址 | `/m-platform/permissions/provider-roles/change-log`；刷新和直接访问均恢复商家访问子导航，当前项高亮 |
| 权限 | 继承现有 provider-roles 页面可见性；不可见者不能因拆分菜单获得访问权 |
| 时间 | 原日志 at 字段，由浏览器本地时间格式展示，不改存储值 |
| 操作人 | 原 actor 字段，沿用真实记录，不替换为当前浏览者 |
| 操作 | 原 action 字段，不改变日志事件类型 |
| 对象 | 原 object 字段，HTML 转义，不显示密码 |
| 数量与顺序 | 展示原保存日志数组全部记录，沿用其顺序，不再截取前 30 条；不新增分页或筛选 |

![结果：日志为空](images/provider-access-nav/logs-empty.png)

没有记录时显示“暂无商家后台访问角色变更记录”，不生成示例日志。浏览页面不写入日志或授权。

### 点击角色访问设置

![入口：访问角色日志](images/provider-access-nav/logs-rows.png)
![结果：角色列表](images/provider-access-nav/settings-rows.png)

切换后显示现有角色列表，保留两项子菜单并高亮设置项；不修改角色数据。

### 子层返回 / 权限中心返回

![入口：商家访问子层](images/provider-access-nav/logs-rows.png)
![第一次返回：权限中心](images/provider-access-nav/permission-parent.png)

只切换侧栏层级，保留当前内容。继续点击返回到主层；原业务草稿离开保护沿用。

![第二次返回：主层](images/provider-access-nav/root.png)

### 点击 M 平台权限变更记录

![入口：权限中心](images/provider-access-nav/permission-parent.png)
![结果：M 平台权限变更记录](images/provider-access-nav/m-platform-logs.png)

原 `/m-platform/permissions/change-log` 地址与 permission-log 权限资源不变，仅入口和页面标题改名。数据仍为 M 平台内部角色、员工权限日志，不混入商家后台访问角色日志。


## 商户访问授权字段与执行链

业务口径与页面操作参照[产品权威 V1.17](M平台内部权限产品权威需求文档.md#授权业务口径)，不另行决定业务。

| 字段 | 类型、来源与约束 |
| --- | --- |
| 本地存储键 | menusifu:provider-merchant-access:v1，与 平台管理角色、商家内部员工授权隔离。 |
| schema | 固定 1；损坏或不支持格式拒绝访问，保留原值，不初始化成全部允许。 |
| revision | 非负整数；默认 0；成功写入加 1；expected 和当前持久化值不同则拒绝覆盖。 |
| systemEmployeeIds | 明确的既有系统身份 ent001；独立管理界面不允许修改或复制。账号停用或 M 进入动作关闭仍拒绝。 |
| roles[].id | UUID，稳定唯一；复制新建 ID。 |
| roles[].name | 去首尾空格，1–30 字，忽略大小写判重。 |
| roles[].description | 0–160 字，可为空。 |
| roles[].grants | 统一商家资源键到 hidden/read/edit 的稀疏映射；未知键保留但不生效；动作不允许 read，普通目录不允许 edit。 |
| employees[].employeeId | 服务商账号 employeeId；不使用品牌账号 ID；普通员工默认无绑定。 |
| bindings[].id | 单员工内唯一稳定 ID；编辑保持 ID。 |
| bindings[].roleId | 必须引用存在的访问角色；删除被引用角色拒绝。 |
| bindings[].scope.mode | brands 或 stores；不引入集团、区域维度。 |
| bindings[].scope.ids | 非空、去重字符串数组；brands 为 merchantId，stores 为 MID；空绑定列表才表示撤销全部。 |
| logs | 事件 ID、ISO 时间、真实操作邮箱、对象、操作、前后授权摘要；与授权写入同一 JSON，不含账号密码。 |
| operatorEmployeeId | 代管会话新增真实员工 ID；缺失的历史会话不能回退成品牌 Admin。 |
| operatorEmail | 来自已认证员工账号，不能通过调用参数伪造其他操作者。 |
| impersonatedAsEmail | 历史字段保留兼容结构，新会话为真实操作者；不作为品牌管理员权限解析依据。 |

计算顺序：
1. 读取启用的服务商账号、M 页面与独立进入动作。
2. 校验品牌所属当前服务商、门店存在及品牌归属；品牌入口只匹配品牌绑定。
3. 只筛选 scope 匹配当前目标的 bindings，合并其角色 grants，复用商家资源的祖先、内容和操作依赖解析。
4. 叠加已发布目录、品牌菜单上限，门店视角再叠加该店上限；目标没有可见菜单则拒绝创建代管会话。
5. 构建真实员工 UserSessionContext 和当前目标范围；不写品牌内部账号或角色。
6. 已有商业权益运行时继续计算服务可用性；角色授权不代替试用、免费、付费和到期校验。
7. 导航、直接地址及操作事件读取当前有效授权；相关本窗口事件和跨窗口 storage 事件重算。
8. 撤权时先清除代管会话，再记录结束日志，防止日志通知再次触发退出；重入保护确保同一退出流程不递归执行。

目录缓存仅限同步渲染周期，微任务后失效；授权 JSON 按实际存储内容比较，外部变更不能长期沿用旧快照。角色预览使用草稿、目标菜单上限，不创建代管或订阅。

保存校验涵盖管理动作、revision、角色引用、重复标识、目标归属、授权者自身范围和 grants 上限。写入成功前不发成功事件；写入失败不提高持久化 revision，不产生假审计。浏览器本地乐观版本比较不替代生产事务锁或服务端授权。

| 测试输入 | 预期 |
| --- | --- |
| 甲订单→M01，财务→M02 | M01 无财务，M02 无订单；不计算角色与门店的笛卡尔积。 |
| 乙财务→M01 | 与甲进入同店时菜单不同。 |
| 仅 M01 范围，直接输入 M02 或品牌详情 | 拒绝；不会创建代管会话。 |
| 只读 M 页面＋进入动作 | 可以按范围进入后台；不能保存品牌／门店菜单。 |
| 没有管理商户访问授权动作 | 直接调用保存授权函数仍拒绝。 |
| 过期 revision、存储配额失败 | 保留原记录与草稿；不产生假成功。 |
| 授权 JSON 损坏 | 目标访问拒绝，原始值保留。 |
| 另一窗口撤销当前目标绑定 | 停止业务访问、清除代管会话、显示失效提示，无日志递归。 |
| 品牌／门店关闭菜单 | 相应角色菜单不生效，原角色配置保留。 |


## 系统使用分析独立权限目录

![系统使用分析权限目录](./assets/usage-analysis-entry-20261029/permissions.png)

图注：2026-10-29，codex/usage-analysis-entry-20261029，main@f30e8451起始，5257实采；角色编辑中系统使用分析与商户管理中心分别设置模块门槛。

入口：权限管理中心 → 角色与功能权限 → 编辑权限。

| 字段／操作 | 逻辑说明 |
| --- | --- |
| 系统使用分析模块 | m:module:activity-analysis，可见／不可见；独立于m:module:merchants。导航、角色目录与实际资源树一致。 |
| 门店活跃分析 | m:page:merchant-activity，可见／不可见，无业务写操作；父资源为系统使用分析模块。 |
| 设备活跃分析 | m:page:device-activity，可见／不可见；与门店活跃分析分别授权，共用分析模块门槛。 |
| 详情中的使用情况 | 品牌或门店详情权限与门店活跃分析权限同时满足才可进入；单有商户管理编辑权不代表可读分析。 |
| 仅分析角色 | 可查看本人获准范围内的全局分析；无商户管理权限时不显示品牌/门店管理跳转，也不能直达管理详情的使用情况页。 |
| 多角色与停用 | 保留角色允许并集及祖先门槛；停用账号、缺页权和缺模块权均拒绝。浏览期间撤权后下次交互/重渲染不继续访问。 |
| 历史角色兼容 | 缺目录版本标记的旧记录，按角色复制原商户模块门槛到缺失的新分析模块门槛，不新增或修改任何分析页grant。已显式配置的新门槛（包括不可见）不覆盖。 |
| 新角色 | 默认不可见；不因商户管理可见而自动拥有分析权限。 |
| 旧路由 | /m-platform/merchants/activity与device-activity及原明细地址继续使用；地址保留不表示权限仍归商户中心。 |

### 目录兼容字段与验收算例

| 字段／操作 | 逻辑说明 |
| --- | --- |
| MState.catalogVersion | 可选字面量2或3；缺失表示旧目录。readMState返回目录3兼容副本，不因浏览直接写localStorage或递增revision。仅既有 m-system-admin 系统角色缺失的新访问角色页、管理动作和门店进入动作补齐；显式拒绝保留，普通角色默认不新增授权。授权保存写为3。 |
| 旧角色模块门槛 | 新分析模块键缺失时，原m:module:merchants为read则设read，否则hidden；已有新键保留。各角色分析页grant、员工roleIds、日志与revision不变。 |
| 分离后计算 | 分析页父键仅为m:module:activity-analysis；目录版本为2或3时再次读取不复制原商户门槛，防止撤权后重新授予。 |
| 跨角色算例 | A仅有旧商户模块read，B仅有分析页read，员工绑定A+B：旧有效分析可见；兼容后新模块read与页面read并集，仍可见。只绑定B仍不可见。 |
| 隐藏算例 | 旧模块hidden且有分析页read：兼容后仍不可见。主动隐藏新分析模块后保存/刷新也不可见。 |
| 不扩权算例 | 只有商户模块read而无任何分析页grant：复制模块门槛后分析页仍不可见；新创建角色的商户模块read不会自动转换。 |
| 范围算例 | brand=demo-a仅返回该品牌两个预设门店；试图下钻demo-b门店拒绝。store上下文仅允许本店，缺数据的M00000001不匹配demo-all。 |


### M 平台外壳返回入口（M-PERM-EXIT-20261022-05）

![M 平台移除两处返回商家按钮](images/m-platform-permissions/no-merchant-return-buttons.png)

图注：2026-10-22，V1.4 功能分支，实际页面验证截图；此前截图中的右上角、左下角返回商家按钮为历史展示。

| 元素 | 规则与验收 |
| --- | --- |
| 右上角返回商家后台 | 从 M 平台公共页头移除，主题切换保留 |
| 左下角返回商家后台 | 从侧栏移除整个按钮及底部容器，不留空白边框 |
| 子菜单返回箭头 | 保持返回上一级菜单，父菜单名与箭头同行 |
| 权限与数据 | 本次不改变授权、角色、数据加载或业务路由；无权页原有返回链接沿用 |

验证：实际页面两处按钮均不存在；主题切换和侧栏导航仍可操作。TypeScript 与公共递归导航回归通过。本次 V1.3/V1.4 修改按用户授权提交、合并 main 并推送；实际提交号和远端核验结果以 Git 交付记录为准。


## 1. 数据对象与来源

| 字段 | 类型与约束 |
|---|---|
| schema | 固定整数 1；不支持格式不静默覆盖 |
| revision | 非负整数；初始化为 0；每次成功保存加 1，保存前与当前持久化值比较 |
| roles[].id | 稳定字符串，唯一，不随名称改变；新角色使用 UUID |
| roles[].name | 字符串；去首尾空格；1–30 字；忽略大小写判重 |
| roles[].description | 字符串；0–160 字；空串合法 |
| roles[].system | 可选布尔；初始系统角色为 true；不可删除或移除该标记 |
| roles[].grants | 资源键到 hidden/read/edit 的稀疏映射；未配置为 hidden；未知旧键保留但永不生效 |
| employees[].id | 企业账号的 employeeId；与商家员工命名空间隔离 |
| employees[].roleIds | 去重角色 ID 数组；默认空；保存拒绝失效角色；无个人例外字段 |
| logs[] | 新记录置顶；id、at、actor、action、object、before、after；时间为 ISO 字符串，页面按浏览器本地时区显示 |
| 企业账号 | 复用 enterprise-staff-account-store；employeeId、employeeName、loginEmail、enabled 及既有凭据规则；账号审计排除 password |

主存储键为 menusifu:m-platform-permissions:v1，企业账号沿用 menusifu:enterprise-staff-login-accounts:v1。前者不读取旧 menusifu:enterprise-rbac-v1 的商家资源授权。初次读取生成初始系统管理员草稿但不写权限存储，第一次成功修改才持久化。初始系统角色绑定既有演示 ent001；其他账号无自动授予。新增员工账号不自动分配角色。

### 默认演示账号身份解析（M-PERM-DEFAULT-20261022-02）

currentMAccount：先按已认证邮箱查询企业账号；精确命中既有账号时优先使用该账号。无命中且邮箱归一化后等于 DEMO_LOGIN_ACCOUNT（demo.menusifu.cn）时，使用现有企业账号列表中 employeeId=ent001 的初始管理员；其他账号返回空。仍由 mResolve 计算其持久化角色并校验 enabled，不直接返回全允许，不创建新角色、员工绑定或业务数据。

故障根因：前版默认账号缺少企业身份，导致 currentMAccess 全部 hidden；并非业务数据被删除。浏览器先执行新增默认账号测试得到 RED，再实施该单点修改得到 GREEN。

8 项新增回归：默认身份、品牌页、角色页、未知资源、未授权真实员工、未知账号、初始管理员停用、权限存储不被改写。当前用户内置浏览器实际点击默认登录，进入 M 平台并打开品牌列表，确认既有品牌数据可见。未改变登录校验、真实员工角色、商家权限或业务数据范围。Build skipped：本次仅身份解析修复，不触及入口、依赖、构建或资源边界；TypeScript 和浏览器 E2E 通过，CI 未验证。

## 2. 资源与计算

资源目录：src/permissions/m-platform-catalog.ts。键分别为 m:module:<模块ID>、m:page:<页面ID>、m:action:<页面ID>:<动作ID>；角色编辑和侧栏共用 M_MODULES，路由由 mPageForPath 归属。服务包和商家订阅先于权限中心通配路径解析；品牌、门店详情归属各自业务页面；使用情况还受门店活跃分析权限校验，集团旧地址归品牌目的页。

1. 确认企业账号存在且 enabled=true，员工绑定存在。
2. 对每一资源，合并员工 roleIds 中仍有效角色的原始权限，取 hidden=0、read=1、edit=2 的最大值。
3. 对有效上级递归计算；上级 hidden 时当前 hidden，但不改写下级存储。
4. 修改型 action 还要求有效页面为 edit；输出型 action 要求页面可见且该 action=edit。
5. 未知资源、无账号、停用账号、无绑定或循环引用均返回 hidden。

目录仅 hidden/read；可设置页面 hidden/read/edit；纯查看页面 hidden/read；action hidden/edit。校验拒绝目录 edit、只读页面 edit、action read。页面一般编辑与独立 action 分开校验。

### 可复算测试例

| 输入 | 预期 |
|---|---|
| A：预设目录 read，页面 read；员工仅绑定 A | 预设页面只读，发布禁止 |
| B：页面 edit、发布 edit；员工绑定 A+B | 目录由 A 放行，页面编辑与发布由 B 放行，最终允许发布 |
| A+B，但所有角色的目录均 hidden | 页面及发布 hidden，下级存储保留 |
| A+B，但页面最终 read | 发布型动作 hidden，即使动作原值 edit |
| 设备目录 read、设备页 read、导出 edit | 允许导出；无任何设备编辑能力 |
| 新员工 roleIds=[] | 全部 M 平台页面 hidden |
| 账号停用，原角色不变 | 全部 hidden；重新启用后按当前角色计算 |
| 未知资源或商家 page:/team/payroll-report | hidden |

## 3. 保存、事务与异常

- saveMState：重新读取当前账号和动作权限；校验 revision、对象结构、名称唯一、失效绑定、系统角色和最后管理员。角色授权增改及新角色绑定不得超过操作者有效权限上限。成功一次 setItem 写入新 revision 和审计；失败抛错，UI 保留输入，不提前修改已保存状态。
- 最后管理员定义：账号启用，角色页和员工页均 edit，编辑角色动作及分配角色动作均允许。保护范围为最后管理员的停用和关键授权移除，不要求每个角色均为管理员。
- 企业账号存储开启 strictPersistence 和 refreshOnRead；写入成功后才更新缓存，查询从存储刷新。商家账号存储沿用原有选项默认值，不启用该行为变更。
- 账号修改先保存脱敏审计，再更新账号；账号写失败时恢复本事务权限快照及 revision。新增失败不向账号缓存追加对象。多键 localStorage 不具备跨进程事务保证，生产端需提供事务；本原型不宣称解决两个标签页同时写账号的数据库级原子性。
- 修改自身登录邮箱成功后更新当前会话邮箱；密码输入留空不写 password。账号停用不删除角色绑定。
- 配置本地数据损坏时显示不可读取或按无权处理，不重建覆盖已存权限。新目录节点未登记授权时默认拒绝。
- 搜索、选择菜单、预览和初始化不标记 dirty；权限值相对已保存值存在语义差异才 dirty。取消权限确认保留草稿；恢复全部原值清除 dirty。关闭页面 beforeunload 和 hash 离开由浏览器确认保护真实草稿。

## 4. 前端执行控制点

### 菜单主层重复文案删除（M-PERM-LABEL-20261022-04）

![菜单主层当前展示](images/m-platform-permissions/root-menu-no-label.png)
图注：2026-10-22，功能分支 V1.3，主层菜单。

仅删除 m-platform-runtime.ts 的 data-m-nav-root 内 h2“ M 平台”节点；不修改品牌区标题、导航容器 accessible name、数据目录或事件处理。不留空白占位，第一子元素即菜单路由配置。无需数据迁移。浏览器确认主层标题数为 0、首项为菜单路由配置、保留 6 个入口，品牌标题仍为 M 平台；进入权限子层和返回验证通过。本次不新增镜像字符串测试，执行 TypeScript 与现有公共导航回归。

### M 平台子层头部（M-PERM-NAV-20261022-03）

![导航头部验收](images/m-platform-permissions/nav-heading-staff.png)
图注：2026-10-22，V1.2 功能分支，权限子层与员工页面。

m-platform-runtime.ts 在各 data-m-nav-layer 顶部渲染同一行 header：保留 data-m-nav-back、data-navigation-sheet-back 和 aria-label=返回上一级菜单，按钮内部仅含 aria-hidden SVG，无可见文本；紧随其后的 h2 显示经过转义的 module.title。沿用商家后台 h-14、size-10、18px SVG、text-sm/font-semibold 及对应边线、悬停和 focus 样式。

m-platform.css 仅将子层容器 padding 设为 0、overflow 设为 hidden，菜单列表在独立滚动区使用 px-2/py-3；主层样式与父子事件处理不变。浏览器实测 header 56px、button 40×40px、icon 18px、title 14px/600；箭头可见文本为空，标题与按钮中心线一致。真实点击返回及重入、当前叶子高亮已验证。本次不新增镜像样式测试；执行 TypeScript 和公共导航回归。


![只读设置页](images/m-platform-permissions/readonly-settings.png)
图注：2026-10-22 功能分支，受限员工查看 POS 预设，复选框与发布禁用。

navigation-submenu-actions.ts 为商家后台与 M 平台共用父子菜单点击、返回、叶子保持处理；商家原递归堆栈与渲染保持不变。m-platform-runtime.ts：侧栏过滤、路由 mCanVisit、捕获阶段 click/submit/change/input/keydown/dragstart/drop 拦截以及动态 DOM 控件禁用。只读白名单仅允许导航、搜索、筛选、关闭及浏览；嵌套 data-pp-enable 和 data-rbac-l4-editable 优先按修改处理，不能从父级导航按钮继承放行。配置预设的 /edit 地址可只读查看；新增/创建和业务编辑地址要求编辑权限。独立动作使用真实 data-* 选择器登记。对未授权路由不挂载原业务处理器。

src/auth/login.ts：企业账号在品牌和演示回退前校验，停用及密码错误直接拒绝。src/main.ts：企业账号成功登录转至首个可访问 M 页面；M 页面不进入商家首次业态向导，其他商家进入流程保留。src/shell/m-platform-shell.ts：接入四入口及独立全屏详情。

边界：这些是原型前端执行点，不是后端权限校验。业务 API、手动调用业务 store、多服务商租户隔离、逐商户数据范围仍需相应生产实现。

## 5. 验证证据

- scripts/verify-m-platform-permissions.ts：多角色合并、父级门禁、默认拒绝、页面只读、独立导出、授权上限、角色判重、失效绑定和路由归属。
- scripts/verify-m-platform-persistence.browser.ts：真实浏览器内执行 11 项检查：过期 revision、最后管理员移除、最后管理员停用、权限存储失败、原值保留、账号写失败、审计回滚、缓存不污染、工号判重、跨窗口停用及停用账号登录拒绝。脚本 finally 恢复任务浏览器的测试前数据。
- 公共导航浏览器检查：父项打开、递归进入、返回一层、叶子保持并阻止外层关闭、返回父层共 5 项通过。
- 人工浏览器流程：创建“客服只读”角色；设置品牌/设备/预设为只读；保存并绑定 ent004；员工预览仅 3 页；受限员工直接访问角色页被拒绝；预设控件和发布禁用，设备导出未授权时禁用。
- TypeScript：tsc --noEmit。商家仅角色授权回归和公共导航回归通过。verify-permission-center.ts 的“Operation page cannot be selected: /team/shift-scheduling”断言失败；在 main@48c9c24b 的独立干净源码快照复现同一失败（第 37 行），属于基线问题，本次未修改商家权限目录，不宣称该脚本全通过。未运行 CI/部署。

## 6. 版本记录

- V1.17（2026-11-03，EMPLOYEE-WORKBENCH-20261103-01）：三份配对版本均为 V1.17。改为同员工双层页签，保留草稿、保存快照预览、M 菜单树及分组操作、系统只读无保存、统一离开确认；附逐操作截图和未覆盖项。

- V1.13（2026-11-03，EMPLOYEE-ACCESS-CONFIG-20261103-01）：三份配对版本均 V1.13，统一员工配置入口、双维摘要、独立保存与双维已保存权限预览；附当前逐操作截图及边界验证。

- V1.12（2026-11-03，PROVIDER-EMP-DEMO-20261103-01）：三份配对版本均为 V1.12。补充三位员工品牌/门店演示绑定及授权预设记录，保留已有保存快照，附当前操作截图与验证结果。

V1.3，M-PERM-LABEL-20261022-04：仅移除菜单主层重复平台标题；配对产品/个人 V1.3。

V1.2，M-PERM-NAV-20261022-03：导航头部同排，样式及尺寸对齐商家后台；配对产品/个人 V1.2。

V1.1，M-PERM-DEFAULT-20261022-02：默认演示账号复用现有初始管理员身份，补默认访问与隔离回归；配对产品/个人 V1.1。

V1.0，M-PERM-20261022-01：与产品/个人 V1.0 同步建立。无金额计算、舍入或业务订单状态变更；相关规则不适用。

本轮独立分析模块的验证及未闭合项见[USAGE-ENTRY-20261029-62](../verification/usage-analysis-entry-20261029/README.md)。
