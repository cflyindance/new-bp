# 薪资管理（Payroll）— PRD 背景与场景说明

> **文档性质**：产品需求文档（PRD）开篇章节  
> **归属模块**：团队管理 → 薪资管理（`/team/payroll-report`）  
> **产品代号**：TipOut Payroll / 薪酬报税  
> **归属品牌**：MenuSifu  
> **依据文档**：`payroll-需求分析.md`、`payroll-报表功能设计.md`、`7shifts-Payroll-BD合作与需求梳理.md`、KOI Palace 客户样例  
> **文档版本**：v0.1 · 2026-06-17

---

## 一、What — 背景说明：我们要做什么

### 1.1 产品定义

**薪资管理**是 MenuSifu 餐饮商家后台「团队管理」模块下的核心能力，定位为面向北美餐饮场景的 **薪酬数据准备与报税导出工具**（Payroll Preparation），而非完整发薪系统。

产品明确边界（见 `payroll.html` 页头说明）：

> **仅计算 Gross · 不发薪、不代报税 · 导出供 ADP/会计师使用**

也就是说，我们解决的是商户在 **双周发薪周期（Bi-weekly Pay Period）** 内，如何把散落在 POS 打卡、小费分配、人工调整中的数据，整理成 **可审计、可签字、可导入 ADP** 的标准化报表——而不是替代 ADP/Gusto 完成预扣税、ACH 出款或 W-2 申报。

### 1.2 在整体产品中的位置

```
POS 打卡（含 Break）
    ↓ 约 5 分钟同步
7Shifts 工时统计
    ↓
TipOut 小费分配（先做 tipout，再做 payroll）
    ↓ 桥接同步 Tips / SVCW
┌─────────────────────────────────────┐
│  薪资管理（Manage Payroll）          │  ← 本期 PRD 范围
│  · 考勤 In/Out 编辑与汇总            │
│  · Regular / OT / OT2 工时与金额     │
│  · 宽表：SVCW、Tips、扣款等 12 列     │
└──────────────┬──────────────────────┘
               ↓ 确认后生成
┌──────────────────────────────────────┐
│  Employees Payroll Detail            │
│  · 员工可打印明细 + 加州休息/用餐声明  │
│  · 员工签字留存                       │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│  ADP PAYROLL REPORT（CSV 导出）       │
│  · CO CODE、BATCH ID、FILE# 等        │
│  · 与客户 ADP 模板列对齐              │
└──────────────────────────────────────┘
               ↓
         ADP / 会计师 → 实际发薪与报税
```

在 `admin-web` 中，该模块以 iframe 形式嵌入 **团队管理 → 薪资管理**（`navigation.ts` 路径 `/team/payroll-report`），与 **小费管理**（TipOut）、**员工列表**、**7Shifts 对接** 同属团队域，形成「人 → 工时 → 小费 → 薪酬」闭环。

### 1.3 首期能力范围（P0）

基于 KOI Palace 客户真实需求与当前工程实现，首期聚焦 **「算薪准备 + 三层报表 + ADP 导出」**：

| 能力域 | 具体内容 | 首期状态 |
|--------|----------|----------|
| **Payroll 期管理** | 一年约 26 个双周期；期列表（区间、Paycheck Date、草稿/部分确认/已确认） | 已实现（演示层） |
| **Manage Payroll（主编辑面）** | 双周内多段考勤（Date / In / Out / Meal）；Regular / OT / OT2 工时与金额汇总；宽表 12 列可手工编辑 | 已实现 |
| **In/Out 考勤编辑** | 直接修改打卡时间，影响本期工时与金额 | 已实现 |
| **宽表字段** | Exempt、Incentive、餐次、Sick、**SVCW**、**Tips**、Child sup、Med Ded、Eee/Eer 等 | 已实现，均可手工覆盖 |
| **员工确认与快照** | 按员工 × 期确认；确认后 Detail / ADP 读快照；修改需解锁留痕 | 设计已定，审计日志已有 |
| **Employees Payroll Detail** | 打印友好；含 service charge / tips 声明；员工签字区 | 已实现 |
| **ADP CSV 导出** | 可配置列映射（`adp_column_mapping`）；CO CODE、BATCH ID = Paycheck Date、FILE# | 已实现 |
| **TipOut 桥接** | 小费分配结果 → Tips；加收服务费 → SVCW（`tipout-payroll-bridge.js`） | 演示层已通，生产 API 待接 |
| **员工 ADP 映射** | 员工主档 `adpFileNumber` 字段 | 已实现 |
| **操作审计** | 关键修改记录操作者与时间（`payroll_audit_log`） | 已实现 |

### 1.4 明确不在首期范围

| 排除项 | 说明 |
|--------|------|
| **实际发薪（ACH/DD）** | 由 ADP 或 7shifts Payroll（合作 Check Technologies）承担 |
| **预扣税、雇主税、YTD 计算** | 导出 Gross 数据，税务计算在 ADP 侧 |
| **W-2 / 1099 年度申报** | 非本系统职责 |
| **完整加州加班合规引擎** | OT/OT2 首期支持手工填报或半自动；规则引擎后续迭代 |
| **替代 7shifts 排班/打卡** | 已对接 POS↔7shifts 员工信息与打卡同步，排班仍以 7shifts 为主 |
| **员工自助登录查工资单** | 员工不登录系统；通过纸质签字页获取明细 |

### 1.5 典型业务节奏

以 KOI Palace 为代表的客户，报税节奏为 **每两周一次**，一年约 **26 期 Payroll**。每期标准流程：

1. **TipOut 小费分配**（前置）：完成本期小费池计算与员工分配  
2. **Manage Payroll 核对**：薪酬专员按员工逐人核对考勤、工时、SVCW/Tips  
3. **员工确认**：打印 Employees Payroll Detail，员工签字留存  
4. **ADP 导出**：批量导出 CSV，导入 ADP 完成报税与发薪  
5. **封账**：该员工该期数据锁定，后续修改需解锁并留痕  

---

## 二、Why — 为什么要做，价值如何呈现

### 2.1 战略动因

| 动因 | 说明 |
|------|------|
| **团队域闭环缺口** | MenuSifu 已有 POS 打卡、TipOut 小费分配、7Shifts 排班对接，但 **「算薪准备 → ADP 报税」** 仍是 Excel 手工环节，数据链断裂 |
| **头部客户真实需求** | KOI Palace 等客户已提供完整 ADP 模板样例与三期报表字段要求，属于 **可落地的付费场景**，而非纯概念 |
| **7shifts Payroll 边界** | 7shifts 2025 年推出 Payroll（合作 Check），但小费规则偏简化、API 开放度有限；复杂分账与 POS 深耦合场景仍需 **TipOut + 自研 Payroll 准备层** |
| **合规与纠纷风险** | 北美餐饮（尤其加州）对 **休息/用餐声明、小费进薪口径、员工签字确认** 有强运营刚需；Excel 手工易错、难审计 |
| **降低客户 TCO** | 减少「POS 导表 → Excel 改数 → ADP 手录 → 打印签字」四步人工，降低错账与代账返工 |

### 2.2 价值呈现（分角色）

#### 对商家（经营者 / GM）

- **时间成本**：每期 Payroll 从「数小时 Excel」压缩到「系统内核对 + 一键导出」，目标节省 **50%+ 人工整理时间**（待上线度量）
- **错账风险**：单一事实来源（Manage Payroll 保存库 → Detail / ADP 投影），避免三套表数字不一致
- **纠纷可追溯**：员工签字页与系统数据同源，争议时可钻取到日考勤与小费分配明细
- **合规留痕**：确认/解锁/导出均有审计日志，满足内控与会计师抽查

#### 对薪酬/报税专员

- **一站式工作台**：选期 → 选员工 → 改考勤 → 调 SVC/Tips → 确认 → 导出，无需切换 4 个系统
- **灵活覆盖**：系统建议值与人工最终值可区分；OT/OT2、SVCW、Tips 均可手工修正
- **批量效率**：一期数百员工可批量导出 ADP CSV；缺失 ADP File# 的行可拦截或标红
- **TipOut 联动**：小费分配完成后一键导入 Tips/SVCW，减少重复录入

#### 对财务/外包代账

- **标准 ADP 格式**：导出 CSV 与客户现有 ADP 模板列对齐（CO CODE、BATCH ID、Earnings Code 等）
- **可审计链路**：从 ADP 汇总行可追溯到 Manage Payroll 宽表 → 考勤段 → TipOut 分配记录
- **预览 vs 定稿**：未确认状态带「非最终」水印，避免误用草稿数据报税

#### 对 MenuSifu（产品与公司）

- **团队域产品深度**：从「小费工具」升级为「工时 + 小费 + 薪酬准备」完整链路，提升客单价与续约率
- **与 7shifts 差异化共存**：排班/打卡对接 7shifts，薪酬准备与小费分账自研深耦合，形成 **「7shifts 管人效，MenuSifu 管钱」** 的清晰分工
- **能力储备**：为后续评估自研 Payroll 或深化 7shifts Payroll 对接提供 **已验证的数据模型与报表模板**（`payroll-p0.schema.sql`）
- **客户案例可复制**：KOI Palace 模式可推广至其他使用 ADP 的北美中餐/亚裔餐饮连锁

### 2.3 与竞品的差异化

| 竞品/方案 | 其做法 | 我们的机会 |
|-----------|--------|------------|
| **纯 Excel + ADP 手录** | 灵活但易错、无审计、TipOut 数据需手抄 | 系统内闭环 + 自动桥接 + 审计留痕 |
| **7shifts Payroll** | 排班/打卡/小费/发薪一体化；小费规则简化 | 复杂 TipOut 规则 + ADP 模板定制 + 与 POS 支付流水强绑定 |
| **Toast Payroll** | 套件内闭环，适合 Toast 生态客户 | MenuSifu 现有 POS 客户零迁移；TipOut 小费深度优于 Toast 基础池化 |
| **Gusto/ADP 直连** | 完整报税发薪，但工时/小费需外部准备 | 我们做 **ADP 前的数据准备层**，而非重复造 Payroll 轮子 |

### 2.4 成功指标（建议）

| 指标 | 目标方向 |
|------|----------|
| 每期 Payroll 从打开到 ADP 导出完成的 **中位时长** | 下降 ≥ 40% |
| ADP 导出后 **返工率**（因字段错误需重新导出） | < 5% |
| TipOut → Payroll **自动导入覆盖率**（Tips/SVCW 无需手填的比例） | ≥ 80%（API 接通后） |
| 员工签字页与系统数据 **一致性投诉率** | 趋近 0 |
| 使用薪资管理模块的 **客户续约率** vs 未使用者 | 显著更高 |

---

## 三、用户画像

### 3.1 核心用户

#### 画像 1：薪酬/报税专员（Payroll Administrator）

| 属性 | 描述 |
|------|------|
| **典型角色** | 总部薪酬专员、外包代账助理、门店兼职会计 |
| **使用频率** | **每两周一次高峰**（26 期/年），每期耗时 2–8 小时（视门店数） |
| **技术熟练度** | 熟悉 ADP 操作与 Excel；对餐饮 OT 规则有基本了解 |
| **核心目标** | 按期完成 ADP 导入数据准备，确保 FILE#、工时、SVC/Tips 准确，员工签字页可打印 |
| **常用功能** | 期列表 → 员工列表 → Manage Payroll 编辑 → 确认 → ADP 批量导出 |
| **权限** | 可编辑报税相关字段、可确认/解锁、可导出 |
| **痛点** | TipOut 数据要手抄；OT 不会自动算；三套表要对齐；ADP 列经常填错 |
| **典型话术** | 「这期小费分配完了，能不能直接带进 Payroll？」 |

#### 画像 2：店长 / 排班经理（Store Manager）

| 属性 | 描述 |
|------|------|
| **典型角色** | 门店 GM、值班经理 |
| **使用频率** | 每期 Payroll 前 1–2 次，主要修正考勤 |
| **核心目标** | 修正员工 In/Out 打卡错误，确保本期工时准确 |
| **常用功能** | Manage Payroll 考勤段 In/Out 编辑（权限可限制为仅考勤） |
| **权限** | **仅考勤编辑**，不接触 SVC/Tips/ADP 导出（可配置） |
| **痛点** | 员工忘打卡要在多个系统改；改完不知道 Payroll 那边有没有同步 |
| **典型话术** | 「Jason 周三忘了打下班卡，我能在 Payroll 里直接改吗？」 |

#### 画像 3：财务总监 / 外包会计师（Finance / External Accountant）

| 属性 | 描述 |
|------|------|
| **典型角色** | 公司 CFO、外部 CPA、ADP 操作顾问 |
| **使用频率** | 每期抽查 + 月末/季末深度对账 |
| **核心目标** | ADP 导入数据准确、可追溯到原始打卡与小费；审计时能提供完整凭证链 |
| **常用功能** | ADP CSV 导出、审计日志、Employees Detail 打印样张抽查 |
| **权限** | 查看 + 导出；通常不直接编辑 |
| **痛点** | 商户给的 CSV 列对不上 ADP 模板；数字和 POS 对不上不知道信谁 |
| **典型话术** | 「这批 ADP 数据的 BATCH ID 和 Paycheck Date 一致吗？」 |

#### 画像 4：员工（Employee）— 非系统用户

| 属性 | 描述 |
|------|------|
| **典型角色** | Server、Bartender、Kitchen、Busser 等 |
| **交互方式** | **不登录系统**；领取纸质 Employees Payroll Detail 签字页 |
| **核心目标** | 核对本期工时、小费、service charge 是否与认知一致；签字确认 |
| **关注点** | 声明中的 gratuity / tips 金额是否加粗清晰；Regular/OT 工时是否正确 |
| **痛点** | 签字表上的数和实际到手不一致 → 劳动纠纷 |
| **典型话术** | 「我签字的 tips 怎么和 TipOut 分的不一样？」 |

### 3.2 次要用户

- **品牌运营/总部 GM**：查看各店 Payroll 期确认进度，不直接编辑  
- **MenuSifu 实施顾问**：新店上线时配置 ADP 列映射、声明模板、期次日历  
- **IT 管理员**：维护员工 ADP File#、7Shifts 同步状态、权限矩阵  

---

## 四、核心痛点

### 4.1 现状痛点（无系统 / Excel 时代）

| 编号 | 痛点 | 现状影响 | 本产品应对 |
|------|------|----------|------------|
| **P1** | **多系统数据割裂** | POS 打卡在 POS/7shifts，小费在 TipOut，薪酬在 Excel，ADP 再录一遍 | 统一在 Manage Payroll 汇聚；TipOut 桥接自动导入 Tips/SVCW |
| **P2** | **流程顺序易乱** | 文档明确要求 **先 TipOut 后 Payroll**；实际常先做 Payroll 导致 SVC/Tips 空缺 | 产品引导 + TipOut 完成状态校验 + 一键导入 |
| **P3** | **OT/OT2 无自动计算** | 加州每日>8h、每周>40h 等规则复杂；现只能靠人工填 OT 列 | 首期：手工填报 + 系统建议值；后续：可配置加班规则引擎 |
| **P4** | **ADP 模板对齐难** | 每个客户 ADP 列序、Earnings Code 不同；手填易错 FILE#、BATCH ID | 可配置 `adp_column_mapping`；导出前校验；CO CODE / BATCH ID 自动生成 |
| **P5** | **员工签字合规** | 加州休息/用餐声明、小费/service charge 表述需固定法务文案 | Employees Detail 内置声明模板（版本化管理）；金额动态填入 |
| **P6** | **三套表数字不一致** | Manage Payroll、员工签字页、ADP CSV 各改各的 | **单一事实来源**：Manage Payroll 保存库 → Detail / ADP 为投影视图 |
| **P7** | **修改无留痕** | Excel 改数不知道谁改的、何时改的 | `payroll_audit_log` + 确认后锁定 + 解锁需授权 |
| **P8** | **考勤修正入口分散** | 改打卡要在 POS 或 7shifts，改完 Payroll 不知道 | Manage Payroll 内直接改 In/Out；提示「将影响本期金额与 ADP 导出」 |

### 4.2 集成层痛点（与 7Shifts / POS / TipOut）

| 编号 | 痛点 | 说明 | 应对策略 |
|------|------|------|----------|
| **I1** | **TipOut 数据未自动接入** | 需求文档明确：本地报表 **拿不到 tipout 分配后的 service charge & tips** | 首期：手工维护 + CSV 导入；并行：`tipout-payroll-bridge` API 化 |
| **I2** | **POS↔7shifts 字段不全** | 仅同步 First/Last/Mobile；Department 不对等；删除不同步 | 员工主档补 ADP File#；Department 映射规则；运维 SOP 双端删除 |
| **I3** | **打卡延迟** | POS→7shifts 约 5 分钟批量；Payroll 取数时点需明确 | 期封账前校验同步完成；展示「最后同步时间」 |
| **I4** | **小费 master 归属** | 7shifts 内 tip 可能简化；TipOut 为复杂分账权威 | 材料中主动写清：**分配后小费以 TipOut 为准** |
| **I5** | **7shifts Payroll API 未开放** | 无 sandbox；Payroll 产品 API 与 Scheduling 可能分离 | 首期走 **ADP 导出** 路径；并行 BD 摸清 7shifts Payroll 对接边界 |

### 4.3 客户侧硬需求（KOI Palace 提炼）

| 需求 | 重要度 | 说明 |
|------|--------|------|
| 双周 26 期管理 | 必须 | 与客户 Pay Schedule 一致 |
| Manage Payroll 13 列可编辑 | 必须 | 含 SVCW、Tips、扣款等 |
| In/Out 直接改考勤 | 必须 | 不要求回写 POS，但 Payroll 内可改 |
| Employees Detail 签字声明 | 必须 | 含加州休息/用餐表述；service charge / tips 来源注明 Manage Payroll |
| ADP CSV 与客户模板一致 | 必须 | CO CODE = X0L；BATCH ID = Paycheck Date；FILE# = 员工 ADP 编号 |
| 员工 ADP ID 存储 | 高 | 员工主档字段，非纯备注 |
| 按员工确认（非整期一次性） | 高 | 先完成大部分员工，争议项后处理 |

---

## 五、典型场景描述

### 场景 A — 薪酬专员：每期例行 Payroll（核心场景）

**角色**：总部薪酬专员 Linda  
**触发**：每两周一次的 Payroll 截止日（如第 12 期，区间 5/26–6/8，Paycheck 6/13）

1. 确认 TipOut 本期各店小费分配已完成（前置检查）  
2. 打开 **薪资管理 → 期列表**，筛选 2026 年第 12 期，状态「部分未确认」  
3. 进入员工列表，按门店筛选「KOI Palace Daly City」  
4. 点开员工 Maria Garcia → **Manage Payroll 工作区**  
5. 核对双周考勤段：发现 6/3  Out 时间有误，直接修改 In/Out  
6. 点击「从 TipOut 导入」→ Tips / SVCW 自动填入宽表（可手工覆盖）  
7. 确认 Regular 32h / OT 4h / OT2 0h 与金额汇总  
8. 点击「确定并保存」→ 该员工本期状态变为「已确认」  
9. 预览 **Employees Detail** → 打印供 Maria 签字  
10. 全部员工确认后，点击「批量导出 ADP」→ 下载 CSV  
11. 将 CSV 导入 ADP，完成本期报税数据提交  

**成功标准**：ADP 导入无报错；Maria 签字页金额与系统一致；BATCH ID = 06.13.26。

### 场景 B — 店长：修正考勤（受限权限）

**角色**：店长 Mike  
**触发**：员工 Jason 反馈本周三忘记打下班卡

1. Mike 仅有「考勤编辑」权限，打开第 12 期 Jason 的 Manage Payroll  
2. 找到 6/4（周三）考勤段，补录 Out 时间为 22:30  
3. 系统提示：「将影响本期工时与 ADP 导出」  
4. 保存后 Regular/OT 工时自动重算（或 Mike 手工调整 OT 列）  
5. Mike **无法**修改 Tips/SVCW 或导出 ADP  

### 场景 C — 员工签字与纠纷处理

**角色**：Server Emily + 薪酬专员 Linda  
**触发**：Emily 认为本期 Tips 金额不对

1. Linda 打印 Emily 的 Employees Payroll Detail  
2. Emily 核对声明区 **Tips $XXX**（加粗下划线）与宽表一致  
3. Emily 发现差异 → 拒绝签字  
4. Linda 回到 Manage Payroll，检查 TipOut 导入记录 vs 手工值  
5. 修正 Tips 后「解锁」已确认状态 → 重新确认 → 重新打印  
6. Emily 签字留存；审计日志记录修改人与时间  

### 场景 D — 财务抽查与 ADP 对账

**角色**：外包 CPA  
**触发**：季度税务抽查

1. 导出第 10–12 期全部 ADP CSV 存档  
2. 抽查 FILE# 与员工主档一致性  
3. 对某员工钻取：ADP 行 `Earnings 3 Code = SVC` ← Manage Payroll `svcw` ← TipOut 分配记录  
4. 审计日志显示：svcw 于 6/10 由 Linda 从 TipOut 导入，6/11 手工调整为最终值  

### 场景 E — 新店上线配置

**角色**：MenuSifu 实施顾问  
**触发**：新客户签约，使用 ADP 报税

1. 录入公司信息：Legal Name、FEIN、ADP CO CODE  
2. 配置 `adp_column_mapping`（对照客户提供的 ADP 模板 CSV）  
3. 导入员工花名册，维护每人 ADP File#  
4. 生成 2026 年 26 期 Payroll 日历（起止日、Paycheck Date）  
5. 配置 Employees Detail 声明模板（法务审核版本号）  
6. 培训客户薪酬专员完成首期试运行  

---

## 六、产品原则与约束

### 6.1 设计原则

1. **不算税、不发薪**：明确产品边界，避免客户误以为可替代 ADP  
2. **单一事实来源**：Manage Payroll 保存库为准；Detail 与 ADP 为只读投影  
3. **先 TipOut，后 Payroll**：流程顺序在产品中可感知、可校验  
4. **人工最终值优先**：系统建议值可覆盖；OT/SVC/Tips 均支持手工修正  
5. **按员工确认**：支持分批确认，不必等全店完成再导出  
6. **审计优先**：报税相关字段修改必留痕；确认后修改需解锁  

### 6.2 技术约束（已知）

| 约束 | 影响 | 缓解 |
|------|------|------|
| TipOut 生产 API 未通 | SVC/Tips 需手工或 CSV 导入 | 桥接层已演示；API 列为 P1 |
| 加班规则未实现 | OT/OT2 依赖人工填报 | 页内允许直接编辑工时分类 |
| 7shifts Payroll 无 sandbox | 无法验证双向 pay run 同步 | 首期走 ADP 导出；BD 并行推进 |
| 员工数据仅部分同步 | Department 等字段需人工维护 | 员工主档扩展字段 + 映射配置 |

---

## 七、一句话总结

**我们要做的**，是在 MenuSifu 团队管理域内建设 **「薪酬数据准备 + ADP 报税导出 + 员工签字凭证」** 三层报表能力，把 POS 打卡、TipOut 小费分配与 ADP 报税之间的 Excel 手工环节系统化。

**之所以要做**，是因为北美餐饮客户（如 KOI Palace）每两周面临 **考勤核对、小费进薪、ADP 导入、员工签字** 四重压力，现有工具链数据割裂、易错、难审计；而 7shifts Payroll 等竞品在复杂小费规则与 ADP 模板定制上无法完全覆盖 MenuSifu 客户需求。

**价值**在于：为商户节省每期数小时人工、降低错账与劳动纠纷风险、形成「工时 → 小费 → 薪酬 → 报税」可审计闭环，并巩固 MenuSifu 在团队与财务域的产品深度。

---

## 参考文档

- [payroll-需求分析.md](./payroll-需求分析.md)
- [payroll-报表功能设计.md](./payroll-报表功能设计.md)
- [7shifts-Payroll-BD合作与需求梳理.md](./7shifts-Payroll-BD合作与需求梳理.md)
- [PRD_产品需求文档.md](./PRD_产品需求文档.md)（TipOut 小费分配）

## 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-06-17 | v0.1 | 初稿：背景、价值、用户画像、痛点、场景 |
