# 员工薪资双明细与 A4 导出设计

## 目标

员工详情同时支持“详细明细”和“精简明细”。详细明细保留现有内容与结构；精简明细参照纸质 Payroll Report，在 A4 纵向纸张中集中展示身份、周期、薪资汇总、两周考勤、声明与签名。打印与导出允许选择明细版本，并支持可记忆的“强制一页 / 按内容分页”策略。

## 已确认决策

- 员工详情标题栏使用“详细明细 / 精简明细”两个页签。
- 初次进入默认详细明细；同一次页面会话内记住最后查看的页签。
- 打印分页设置提供“强制一页”和“按内容分页”，跨会话记住最后选择。
- 打印按钮打印当前页签对应版本。
- 导出采用两步选择：先选明细版本，再选 PDF、CSV 或邮箱。
- 导出面板默认选中当前查看版本，但允许独立切换，不强制改变页面页签。
- 分页设置作用于直接打印、PDF，以及邮箱发送的 PDF 附件；CSV 不应用分页设置。

## 页面结构

员工详情弹窗保持现有全屏/大弹窗容器、独立正文滚动和固定底部操作栏。

标题栏在标题右侧增加分段页签：

```text
Employees Payroll Detail   [详细明细] [精简明细]                    [×]
```

正文包含两个互斥面板：

- `detail`：复用当前 `employeesDetailModalBody` 详细明细，不删字段，不改变现有计算和展示。
- `compact`：新增只读的 A4 预览容器，由当前员工与 Period 的同一份派生数据渲染。

底栏结构：

```text
打印分页  [强制一页 | 按内容分页]  已记住        [打印] [导出结果] [关闭]
```

窄屏时分页设置独占一行，操作按钮换行但不被裁切。

## 精简明细字段

精简版仅包含：

- 员工姓名、岗位、入职日期、时薪、SSN。
- Payroll 期数、发薪日、薪资区间。
- Regular、OT、OT2 的工时与金额，以及合计。
- Week 1、Week 2 的日期范围。
- 每日 Date、最多三组 In/Out、Hours、Regular、OT、OT2。
- 每周 Total、Rate、Amount 汇总行。
- 声明正文，其中 gratuity 与 tips 金额使用现有计算结果。
- Employee Signature、Date 签名线及门店名称/地址。

ADP File、调整项输入框、保存/确认状态、审计信息和页面操作按钮不进入精简打印内容。无打卡的日期仍保留行；超过三组 In/Out 时，第三列显示第三组及其余组数提示，详细数据仍可在详细明细查看。

精简版不单列 Paid Break。为保证可见分项与合计完全一致，Paid Break 合并进 Regular：`compactRegularHours = regH + paidBreakH`，`compactRegularAmount = regAmt + paidBreakAmt`。页面总工时、总金额、每日/每周汇总和精简 CSV 使用合并后的 Regular；声明中的 gratuity/service charge 与 tips 继续使用现有独立计算结果，不受 Paid Break 合并影响。详细明细和详细 CSV 继续将 Paid Break 独立展示。

## 状态模型与持久化

新增 UI 状态：

```ts
type PayrollDetailVariant = "detail" | "compact";
type PayrollPrintPagination = "fit-one-page" | "paginate";

interface PayrollDetailPresentationState {
  activeVariant: PayrollDetailVariant;
  exportVariant: PayrollDetailVariant;
  printPagination: PayrollPrintPagination;
  operationId: number;
  busyOperation: null | "print" | "pdf" | "email";
}

interface PayrollEmailExportSnapshot {
  variant: PayrollDetailVariant;
  format: "pdf" | "csv";
  pagination: PayrollPrintPagination;
  periodId: string;
  employeeId: string;
  payload: PayrollDetailExportPayload;
}
```

`activeVariant` 与 `exportVariant` 只属于当前挂载会话，不写入薪资业务快照。`printPagination` 使用独立 localStorage 键 `menusifu.payroll.detail.print-pagination.v1` 保存，读取到未知值时回退为 `fit-one-page`。存储不可用时使用内存默认值，不阻断详情展示、打印或导出。

员工、Period 或门店切换后，两个明细面板都从最新状态重新派生。切换页签只改变可见面板，不复制或修改薪资数据。

## A4 打印策略

两种版本均使用 A4 portrait，打印内容排除弹窗标题栏、页签、底栏、菜单和遮罩。直接打印、下载 PDF 和邮件 PDF 共用 `buildPayrollDetailPages(payload, variant, pagination)`，其输出是已经分页的 A4 page DOM 列表；三个出口不得各自分页。

分页文档在同源、视口外的打印 iframe 中构建。iframe 写入完整独立 HTML、Payroll 打印样式、`@page { size: A4 portrait; margin: 0; }` 和绝对资源 URL，不依赖 Shadow DOM 样式继承。iframe 使用 `position: fixed; left: -10000px; top: 0; width: 210mm; height: 297mm; pointer-events: none`，始终保持 `display:block`、`visibility:visible`、`opacity:1`，保证可布局、可测量并可被 html2canvas 捕获；禁止通过 display、visibility 或 opacity 隐藏。测量样式与 `@media print` 的几何尺寸必须一致。每个 `.payroll-a4-page` 固定为 `210mm × 297mm`，自身 padding 为 `8mm`，内容区为 `194mm × 281mm`，`box-sizing: border-box`。非最后一页使用 `break-after: page`，最后一页显式为 `break-after: auto`，防止空白尾页。直接打印调用 iframe 的 `contentWindow.print()`；native Shadow DOM 与 standalone 页面走完全相同路径。

调用测量前等待 iframe `load`、`document.fonts.ready` 以及文档内全部图片完成或失败。实现和测试假设浏览器打印对话框关闭额外页眉页脚；应用自身不输出浏览器 URL、日期或页码头。若用户在系统打印设置中强制开启浏览器页眉页脚，应用不承诺 8mm 安全边距。

### 强制一页

- 在 iframe 的离屏测量容器中以固定 `194mm` 宽度渲染完整内容，等待字体和图片稳定后读取自然宽高。
- 为避免亚像素进位产生第二页，计算 `scale = min(1, availableWidth/contentWidth, availableHeight/contentHeight) * 0.995`。
- 页面内设置绝对定位的 `.payroll-a4-scale-layer`，使用 `transform-origin: top left` 和 `transform: scale(var(--print-scale))`；外层 `.payroll-a4-page` 保持固定物理尺寸，缩放层不参与分页流。
- 缩放层的逻辑宽高显式设置为 `contentWidth × contentHeight`；测量并应用 scale 后再把缩放层装入 `.payroll-a4-page` 并开始打印或捕获。iframe 全程保持视口外、可布局、可绘制状态。
- `overflow: hidden` 仅作为浮点误差保护；验收必须断言缩放后边界小于内容区，不能用裁切掩盖失败。
- 不设置最小缩放阈值；当数据极多时仍以“一页”为最高优先级。

### 按内容分页

- 保持设计字号与行高，不整体缩放。分页器以 281mm 内容高度逐块测量和装箱，而不是依赖浏览器自动拆分。
- 员工/周期头与薪资汇总组成不可拆分首块。
- 每个 Week 由周标题、表头、数据行、汇总行组成。整周可放入剩余空间时不拆；否则从新页开始。单周仍超过一页时按数据行拆分，每个续页重复周标题和表头，周汇总只出现在该周最后一页。
- 声明、签名和门店信息组成不可拆分尾块；空间不足时整体进入新页。
- 详细版宽表使用唯一的均匀缩放规则：当自然宽度超过 194mm 时，表格包装层使用 `tableScale = 194mm/naturalWidth`，同时按该比例缩放宽度和高度；包装层占位高度显式设置为 `naturalHeight × tableScale` 后再参与纵向装箱。非表格内容、精简版表格以及无需缩放的详细表格保持设计字号与行高。时间和数字列禁止换行，文本列允许换行；不得使用非均匀 `scaleX`，不得横向裁切。

PDF 不再对一张超长 canvas 按页高盲切。它逐页对分页器输出的 `.payroll-a4-page` 调用 html2canvas，每个 page canvas 作为一整页加入 jsPDF；`fit-one-page` 恰好加入一页，`paginate` 按 page DOM 数量加入多页。直接打印打印同一 iframe 文档。邮件 PDF 在当前模拟发送流程中生成同一 PDF artifact 元数据后再显示成功提示；本次不新增真实邮件 API 或网络附件上传。

若 html2canvas/jsPDF 不可用或 reject，PDF 与邮件 PDF 显示失败并保持弹窗，不回退到打印窗口。直接打印只使用 iframe + `window.print()`，popup blocked 不适用。

所有操作由递增 `operationId` 管理，同一时刻只允许一个 print/pdf/email 任务；操作期间相关按钮进入 busy/disabled。每个异步阶段检查 token，路由离开或组件卸载时使 token 失效。成功、取消打印、测量异常、字体/图片等待失败、PDF reject 和卸载统一通过 `finally` 移除 iframe、打印 class、缩放变量与事件监听。`afterprint` 是完成信号之一，但另设可取消的超时兜底；旧任务不得清理或修改新任务 DOM。

## 导出交互

点击“导出结果”打开两步选择面板：

1. 选择详细明细或精简明细，默认当前页签。
2. 选择 PDF、CSV 或邮箱。

PDF 直接使用所选版本及已记住分页策略。CSV 为两个明确 schema：

- 详细 CSV：列、行、编码、BOM、换行和字段格式保持当前实现不变，原文件名也保持不变，作为向后兼容出口。
- 精简 CSV：UTF-8 with BOM，CRLF 换行，RFC 4180 双引号转义；日期 `MM/DD/YYYY`，时间 `HH:mm`，工时保留两位小数，rate/amount 为不带货币符号的两位十进制字符串，缺失值为空字符串。

精简 CSV 使用固定列顺序：

```text
section,employee_name,role,hire_date,rate,ssn,period_number,pay_date,
period_start,period_end,week,date,in_1,out_1,in_2,out_2,in_3,out_3,
additional_clock_pairs,hours,regular_hours,ot_hours,ot2_hours,
regular_rate,ot_rate,ot2_rate,regular_amount,ot_amount,ot2_amount,
total_amount,declaration,store_name,store_address
```

所有行共享上述列集合：一行 `meta`；一行 `summary`；每日一行 `week-1` 或 `week-2`；每周一行 `week-1-total` / `week-2-total`；一行 `declaration`。前三组打卡分别进入 `in_1/out_1` 至 `in_3/out_3`；其余完整打卡对以 `HH:mm-HH:mm|HH:mm-HH:mm` 写入 `additional_clock_pairs`，不丢数据。无值列保持空字符串。精简 CSV 的 `regular_hours` 与 `regular_amount` 使用合并 Paid Break 后的值，确保 `hours = regular_hours + ot_hours + ot2_hours` 且 `total_amount = regular_amount + ot_amount + ot2_amount`。

选择邮箱后打开现有邮箱弹窗，并显示当前明细版本。邮箱弹窗继续允许 PDF/CSV 格式：PDF 使用分页设置；CSV 使用相应版本 schema。

状态流固定如下：

| 事件 | 版本与数据行为 |
| --- | --- |
| 打开导出面板 | `exportVariant` 重置为当前 `activeVariant`，格式无默认执行 |
| 在面板切换版本 | 只更新 `exportVariant`，不切换页面页签 |
| 选择 PDF/CSV | 立即冻结当前 employee、period、payload、variant、pagination 并启动任务 |
| 选择邮箱 | 创建 `PayrollEmailExportSnapshot`，冻结 employee、period、payload、variant、pagination；邮箱内切换 PDF/CSV 只更新 snapshot.format |
| 邮箱打开期间切页签或外部状态变化 | 本次发送继续使用冻结 snapshot；界面显示员工与 Period 摘要防止误发 |
| 校验或模拟发送失败 | 保留 snapshot、地址和格式，允许重试；解除 busy |
| 取消邮箱 | 销毁 snapshot；下次打开导出面板仍按当前页签重置版本 |
| 发送成功 | 销毁 snapshot，关闭邮箱弹窗；保留全局分页设置 |

发送按钮在任务运行时禁用，重复点击不得启动第二个任务。现有邮件能力是本地模拟成功通知，本次只保证选择、生成和提示使用正确版本，不声称真实发送附件；未来接入邮件 API 时直接消费冻结 snapshot 与生成的 artifact。

精简导出文件名为 `PayrollDetail_P2_Bowen-one_Compact`，扩展名按格式追加。为兼容现有消费者，详细 CSV 保持当前文件名；详细 PDF 可在 UI 显示 Detail，但下载文件名同样保持当前实现。本次允许的文件名变化仅为新增 Compact 文件。

## 数据与模块边界

详细和精简渲染器共同消费现有 `buildDetailExportPayload(emp, period)` 的规范化数据。该 payload 扩展每周日期范围、完整 `clockPairs[]` 和门店地址等字段，但现有字段保持兼容。精简渲染器从完整数组派生前三组和 `remainingCount`；详细页面与详细 CSV 继续消费完整数组，不得重新读取或截断原始考勤。

打印、PDF、CSV、邮箱不得各自重新计算薪资。所有金额、工时、Period 编号和日期都来自同一 payload；不同版本仅负责选择字段和布局。

独立 `dist/TipOut/payroll.html` 是行为源，相关 HTML/CSS/JS 修改后同步到 `src/team/payroll` 原生模板、样式和 legacy runtime，继续通过现有一致性校验。主应用 Shell、左侧导航和顶部账号栏不变。

## 错误与边界处理

- 员工或 Period 缺失：两个面板显示同一空状态，禁用打印和导出。
- PDF 能力不可用：显示现有失败提示，不回退成错误版本。
- 邮箱为空或格式无效：沿用现有校验，保留版本选择。
- 无考勤：精简版仍展示身份、周期、零值汇总、两周空表、声明和签名。
- 单日超过三组 In/Out：精简版提示存在更多记录，详细版与详细 CSV 保留全部数据。
- localStorage 读写失败：仅不记忆分页设置，不影响本次操作。
- 字体或图片在限定等待时间内未完成：无图片依赖的文本内容继续生成；测量不稳定或内容边界校验失败时终止并提示，不输出可能裁切的文件。

## 验收标准

- 员工详情可在两个页签间切换，详细明细与当前实现一致。精简明细以用户提供的纸质 Payroll Report 为视觉方向，但验收以本文档为准：A4 使用 8mm 页边距；身份/周期头 10–12pt，表格 7–9pt，声明 7–8pt；字段顺序严格为“身份与周期 → 汇总 → Week 1 → Week 2 → 声明 → 签名 → 门店”。
- 切换员工或 Period 后两个版本显示同一工时、金额、日期和身份数据。
- “打印”始终打印当前页签版本。
- “强制一页”在包含完整 14 天、每天最多三组打卡的测试数据下只生成一张 A4。
- “按内容分页”保持字号，并优先在周边界分页，表头在续页重复。
- 分页设置刷新后仍保持；非法持久值安全回退。
- 导出两步面板支持详细/精简 × PDF/CSV/邮箱完整矩阵。
- 详细 CSV 与现有输出兼容；精简 CSV 包含确认的核心字段与 section 标记。
- 邮件 PDF/CSV 使用面板选择的版本，邮件 PDF 使用已记住分页设置。
- 文件名可区分 Detail 与 Compact。
- 直接打印、PDF、邮箱和 CSV 操作后弹窗仍可滚动，底栏按钮完整可见，无重复监听或控制台错误。
- 自动化分页 fixture 覆盖：详细版宽表、每天超过三组打卡、长员工名/门店地址/声明、中英文、字体延迟、浏览器 80%/100%/125% 缩放。分别断言直接打印 DOM、下载 PDF 和邮件 PDF 的页数一致、缩放后边界不越界、无横纵裁切、分页块边界正确且续页表头存在。
- 使用与 iframe 完全相同 HTML/CSS 的 headless Chromium `printToPDF` 生成真实打印 PDF，并断言页数、MediaBox 为 A4、无空白尾页；`fit-one-page` 必须为 1 页，`paginate` 页数必须与 page DOM 数量一致。至少再在 Chrome 或 Edge 打印预览中人工核对一次页数与边界。
- 错误与生命周期 fixture 覆盖：取消打印、PDF 库缺失/reject、连续双击、路由离开和组件卸载；最终不存在残留 iframe、打印 class、监听器或 busy 状态。
