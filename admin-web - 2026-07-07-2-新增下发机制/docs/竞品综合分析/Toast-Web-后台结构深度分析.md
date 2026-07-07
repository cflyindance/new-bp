# Toast Web 后台管理系统结构深度分析

> 基于 Toast 官方 **Platform Guide**（`doc.toasttab.com`）、**Access permissions reference**、**Toast platform overview** 及 **Toast Central** 支持文档整理。Toast 未公开完整「左侧导航截图树」的单一权威页面，本文通过**权限文档中反复出现的 `Toast Web` 路径**与**平台概念域**进行**逆向还原**，用于对标自家产品信息架构。

---

## 一、Toast Web 是什么、与 POS 如何分工

| 维度 | 说明 |
|------|------|
| **定义** | Toast Web 是云端 **配置与报表站点**，用于控制、监控各门店的 Toast 产品与服务（官方表述：*configuration and reporting website*）。 |
| **入口** | 浏览器访问 `https://pos.toasttab.com`；或在 Toast POS App 上 **Setup > Other Setup** 进入。 |
| **鉴权** | 邮箱+密码；需具备 **Restaurant Admin** 等 Web 权限；实际可见菜单由 **Job（岗位）+ Permission（权限）** 裁剪。 |
| **与 POS 分工** | **收银、下单、收现金**等交易动作在 **POS 终端**完成；**菜单全量编辑、报表深度分析、厨房路由、外卖与在线订餐配置、员工与权限**等主要在 **Toast Web**；部分配置在 Web 改完后需 **Publish（发布）** 同步到门店设备。 |

**设计启示**：后台应明确 **「Web 配置中心」** 与 **「终端操作」** 边界，并保留 **发布/变更集（Change sets）** 类能力，避免与「即时生效」混用造成运营事故。

---

## 二、产品线套件（官网）与后台能力域的对应关系

Toast 官网将产品按 **Suite** 售卖，与 Toast Web 中的配置域大致对应：

| 官网 Suite | 在 Toast Web 中主要落点 |
|------------|-------------------------|
| **POS & Restaurant Operations** | Front of house、Kitchen、Payments（部分）、Employees（排班/工时相关与 Payroll 联动） |
| **Digital Storefront Suite** | Takeout & delivery（Branded online ordering、Online ordering）、Websites（独立能力，与外卖配置并列） |
| **Marketing Suite** | Marketing（如 Email Marketing）、Reports > Guest engagement（客人/礼品卡/忠诚度报表） |
| **Restaurant Management Suite** | Toast account > Groups、Reports > Benchmarking（多店对比）、Business and location management |
| **Team Management Suite** | Employees（Jobs、Shift review、Timesheet、Break types 等） |
| **Payroll Suite** | 薪资处理多在 **Toast Payroll** 产品内；权限说明中部分原 Accounting 入口已迁移至 **Financial Accounts / Toast Payroll 角色**（文档 2026 前后有废弃权限说明） |
| **Supplier & Accounting Suite** | 会计/应付等集成能力在文档中逐步收拢到 **Financial Accounts** 等账号级权限 |
| **Finance** | Instant Deposit、Toast Restaurant Card 等与 **Analytics > Accounts**、财务类报表联动 |

---

## 三、官方「平台概念」—— Toast 自己如何切分业务域

《Toast platform overview》将核心能力拆为以下**概念域**（与后台模块一一映射，便于理解 IA 哲学）：

1. **Toast Web** — 配置与报表总入口  
2. **Menu configuration** — 菜单层级、商品、修饰项  
3. **Integrations** — 第三方与 Data Extensions  
4. **Kitchen operations** — 出品站、KDS、路由、厨打  
5. **Toast POS hardware** — 终端与硬件（大量在 POS 上 Setup > Device Setup）  
6. **Restaurant location configuration** — 就餐方式、收入中心、岗位、营销信息等  
7. **Employees** — 岗位与权限  
8. **Off-premise dining** — 外带、外卖、Orders Hub 等  
9. **Payments** — 定价、服务费、税、现金与卡交易相关配置  
10. **Guests** — 客人数据、忠诚度等  

**设计启示**：Toast 的导航不是纯「功能列表」，而是 **运营域（Kitchen / FOH / Takeout / Payments）+ 支撑域（Menus / Employees / Reports / Account）** 的组合。

---

## 四、从权限文档逆推的 Toast Web 目录树（核心）

以下路径来自 **Access permissions reference** 中明确写出的 `xxx > yyy > zzz in Toast Web` 或等价描述，合并去重后形成**近似真实导航树**（子项可能随套餐与版本隐藏）。

### 4.1 Toast account（账号 / 集团 / 发布层）

- **Toast account**
  - **Publishing**：Publish Config、Publish Config V2、Publishing Center（变更集 / 定时发布）
  - **Business and location management**：Settings copy tool（配置复制）
  - **Groups**：Restaurant groups、Device groups
  - **Notifications & alerts**：Contact settings（邮件分发列表、夜间摘要等）
  - **Internal tools**：Publish config（与发布相关的高权限入口）
  - **Test orders**：Archive test orders（需 Edit Historical Data 等配合）

> 多店/集团场景下，**Groups** 与 **Benchmarking** 报表强相关。

### 4.2 Employees（员工与人事相关配置）

- **Employees**
  - **Employee management**
    - **Employees**（账号、基础信息、Passcode 等）
    - **Jobs**（岗位 = 权限包）
    - **Overtime rules**
  - **Shift review**
    - **Shift review setup**（如现金小费申报、负小费等策略）
  - **Timesheet management**
    - **Break types**

> 文档中常见路径：`Employees > Employee management > Jobs` 作为权限配置的锚点。

### 4.3 Menus（菜单）

- **Menus**
  - **Menu management**：Edit menus（经典编辑流）
  - **Menu manager**（新版菜单工具）
  - **Bulk management**
    - Advanced properties
    - Price editor
    - Items database（归档、恢复、版本）
  - **Settings**
    - Open items、Pre modifiers、Item tags、Price levels、Sales categories
    - Manage tax rates
    - Barcode config

### 4.4 Kitchen（后厨与就餐方式）

- **Kitchen**
  - **Printers, tickets, & KDS devices**：Kitchen
  - **Kitchen stations**
    - Prep stations
    - Production items
    - Item routing
  - **Pacing**
    - Courses
    - Meal pacing
  - **Dining options**：Dining options（堂食/外带等就餐类型配置）

### 4.5 Front of house（前厅）

- **Front of house**
  - **Tables & sections**
    - Tables
    - Service areas
    - Revenue centers
    - Send notifications
  - **Order screen setup**：UI options（点餐界面选项）
  - **POS notifications**：Notification setup  

另：**Toast Tables**（等位/预订）启用后，配置位于 **Front of house** 下（文档描述）。

### 4.6 Takeout & delivery（外带、外卖、在线订餐）

- **Takeout & delivery**
  - **Toast online ordering**：Restaurant info
  - **Availability**
    - Takeout/delivery
    - Prep/delivery times
    - Online ordering
    - Online ordering schedule
  - **Orders Hub**：Order ready messages
  - **Order ready board**：Order ready board settings
  - **Third party ordering**（第三方平台接单）
  - **Branded online ordering**：Branded online ordering configuration（网站品牌化在线点餐，与 Websites Setup 权限关联）

### 4.7 Payments（支付、优惠、小票、礼品卡）

- **Payments**
  - **Comps and promos**
    - Discounts and promo codes
    - Discount reasons
  - **Payment methods**
    - Payment options
    - Other payment options
  - **Transactions & refunds**
    - Void reasons、No sale reasons
    - **Find checks & issue refund**（Web 端发起退款）
  - **Checks & receipt setup**
    - Service charges
    - Guest receipt setup
    - Printers and cash drawers
    - Guest display
  - **Gift cards**
    - Gift card setup
    - Transfer gift cards

### 4.8 Marketing & Guest engagement（营销与客人触达）

- **Marketing**
  - **Email Marketing**（需开通对应营销产品）
- **Guest engagement**
  - **Guest feedback**：Guest feedback setup

（客人列表、礼品卡余额等更多在 **Reports > Guest engagement** 以报表形式呈现，见下节。）

### 4.9 Reports（报表与分析）

支持文档说明：左侧 **Reports**，可用 **「>」** 展开子导航；Reporting Dashboard 提供周览（销售、人工、客数、菜单表现等）。

权限文档中出现的 **Reports** 下分类包括：

- **Reports**
  - **Sales**
  - **Locations**
  - **Cash**
  - **Finance**
  - **Accounting**
  - **Kitchen**（厨房履行类报表）
  - **Guest engagement**：Guest feedback、Guests、礼品卡与忠诚度相关多张报表（Balances、Transactions、Liabilities、Rewards、失败电子礼品卡投递等）
  - **Employee performance**：Labor Summary
  - **Menus**
  - **Settings**：Hours/services
  - **Cash and loss management**（与钱箱、存现等配合权限）
  - **Benchmarking**：Group overview（集团多店对比、行业对标）
  - **Payments**：Gift card balances（报表路径）
  - **Accounts**：House Accounts（挂账等）

另：**Manager > Manager Log** 在 Toast Web 中用于运营/人事问题日志（可选功能）。

### 4.10 Integrations（集成）

- **Integrations**
  - **Data Extensions**：Manage data extensions

### 4.11 Analytics（财务账户级）

- **Analytics**
  - **Accounts**（需 **Financial Accounts** 权限：存款、费率、法人实体与银行账户信息等）

### 4.12 与 Web 并列的 POS 端 Setup（理解完整体验）

权限文档大量出现 **Setup > Device Setup**（在 POS 上，非 Web 左侧栏），例如：

- Receipt Printer、Digital Receipts、Allow Cash Payments、Revenue Center、Prep Stations、KDS 相关显示选项、Order Ready Board 等  

**设计启示**：若做「全功能后台」，需决定是否在 Web 端做 **设备镜像配置**，还是像 Toast 一样 **Web 管策略、POS 管设备细节**。

---

## 五、Toast 信息架构的若干「深层特征」

### 5.1 权限驱动 IA（动态导航）

- 权限通常挂在 **Job** 上，而非逐个员工；**同一菜单项**对不同 Job 可见性不同。  
- 存在 **Publishing / Change sets**：有权限才能创建变更集、定时发布——说明 **配置变更是「一等公民」**，与单纯 CRUD 页面不同。

### 5.2 Payments 既管「钱」也管「促销理由」

- **Discounts**、**Void / No sale reasons**、**Service charges**、**Gift cards** 均在 **Payments** 树下，体现 **「结账与调整规则」统一在支付域** 的思路，而不是单独做一个「促销管理」一级（营销类 Email 又在 Marketing）。

### 5.3 Takeout & delivery 与 Kitchen、Front of house 三角关系

- **就餐方式（Dining options）** 在 **Kitchen**；  
- **桌台、区域、收入中心** 在 **Front of house**；  
- **在线订餐、第三方外卖、备餐时间、Orders Hub** 在 **Takeout & delivery**。  

三家共同完成 **「订单从哪来 → 如何显示 → 如何出餐」** 的闭环。

### 5.4 Reports 极深、且与权限强绑定

- 销售、现金、会计、厨房、客人、员工、菜单、对标等多条线并列；**礼品卡**既在 Payments 配置，又在 Reports > Guest engagement / Payments 下出报表。  

对标自建产品时：**报表分类宜与「权限套餐」同步设计**，避免后期拆库困难。

### 5.5 Payroll 与 Web 的边界在演进

- 文档显示部分原 **Accounting * Setup** 权限已废弃，改由 **Financial Accounts** 或 **Toast Payroll HR+ 角色** 控制——说明 **薪资/会计集成** 正在向独立产品与角色模型迁移。  

自建产品若拆分 **Payroll 模块**，建议在 IA 上 **要么独立子域（payroll.xxx.com），要么 Web 内独立顶级「Payroll」**，与 **Employees** 清晰并列。

---

## 六、与《餐饮商家后台-导航与目录结构建议》的对照简表

| 本文档 Toast 域 | 我方建议一级/二级（参考） |
|-----------------|---------------------------|
| Menus | 菜单 (Menu) |
| Takeout & delivery + Marketing + Guest engagement | 智能点餐 + 促销与会员 |
| Kitchen + Front of house + 部分 Takeout | 运营 (Operations)：KDS、桌台、预约、设备 |
| Employees +（Payroll 产品） | 团队管理 (Team) |
| Reports + Analytics | 报表与财务 (Reports & Finance) |
| Payments + Toast account（Tax、Publishing） | 设置 + 部分订单退单/金额调整 |
| Integrations | 设置 > 集成 |

---

## 七、参考与免责声明

- Toast 官方文档会持续更新，菜单名称、归属路径以签约版本与 **Toast Central** 为准。  
- 本文路径主要来自 **Access permissions reference**（`adminPermissions.html`）中的功能路径描述，**不等价于** Toast 内部产品设计文档。  
- 若需截图级还原，建议在合法授权环境下对 **Toast Web** 进行 **角色矩阵走查**（Owner / Manager / Accountant）并归档为自家 PRD 附录。

---

**主要参考**  
- [Using Toast Web](https://doc.toasttab.com/doc/platformguide/adminAccessToastAdminBackend.html)  
- [Toast platform overview](https://doc.toasttab.com/doc/platformguide/platformToastPlatformOverview.html)  
- [Access permissions reference](https://doc.toasttab.com/doc/platformguide/adminPermissions.html)  
- [Get Started With Analytics and Reports](https://support.toasttab.com/en/article/Getting-Started-with-Analytics-and-Reports)  
- [Toast POS Products](https://pos.toasttab.com/products)  
