# 小费管理新增能力产品发布会 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一份可用于 15–20 分钟内部产品宣讲、包含销售话术与演讲者备注的 16 页小费管理新增能力 PPT。

**Architecture:** 使用 PptxGenJS 从代码生成独立 `.pptx`，复用现有 Payroll 发布会的深色舞台、橙色强调和一页一观点风格。内容与版式由单一生成脚本维护，最终通过文本提取、LibreOffice 渲染和逐页视觉检查完成闭环验收。

**Tech Stack:** Node.js、PptxGenJS、Microsoft YaHei、MarkItDown、LibreOffice、Poppler。

**Spec:** `docs/superpowers/specs/2026-09-09-tip-management-capabilities-launch-deck-design.md`

## Global Constraints

- 输出 16:9 `.pptx`，共 16 页，适配 15–20 分钟宣讲。
- 主视觉使用深黑/深灰舞台、橙色强调、大字号与“规则筛选器”视觉母题。
- 每项能力必须包含业务场景、方案、客户价值和可复述的销售表达。
- 能力一明确“实际打卡时长与配置的最大时长取较小值”。
- 能力三完整列出支付方式和可叠加条件，并明确支付方式为多选、菜单条件隐藏。
- 能力四严格使用信用卡小费/现金小费/其他小费口径，案例金额使用美元。
- 每页演讲者备注包含转场、必讲事实和建议时长。
- 视觉 QA 至少包含一轮发现问题、修正和复验。

---

### Task 1: 实现 PPT 生成脚本与完整内容

**Files:**
- Create: `scripts/generate-tip-management-launch-ppt.mjs`
- Create: `docs/产品发布会/小费管理-新增能力产品发布会.pptx`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-09-09-tip-management-capabilities-launch-deck-design.md` 中的 16 页结构、文案与口径。
- Produces: `generateDeck(): Promise<void>`，将成稿写入 `docs/产品发布会/小费管理-新增能力产品发布会.pptx`。

- [ ] **Step 1: 建立生成脚本骨架**

在 `scripts/generate-tip-management-launch-ppt.mjs` 中初始化 `pptxgenjs`、`LAYOUT_16x9`、主题字体和输出路径，并定义 `stage()`、`hero()`、`title()`、`card()`、`pill()`、`notes()` 等基础函数。

- [ ] **Step 2: 实现第 1–5 页开场与能力总览**

依次生成封面、开场记忆点、四个客户现实、正式发布和四项能力总览。备注按设计稿写入转场、必讲事实和建议时间。

- [ ] **Step 3: 实现第 6–10 页四项能力**

使用比较尺表现 `min(实际打卡 7h, 最大时长 5h) = 5h`；使用数据流表现加收服务费自动入池；使用筛选标签展示六种支付方式与七类可叠加条件；使用订单卡片展示 `$100 + $10 tip`、`$50 no tip` 和 `$150` 默认合计。

- [ ] **Step 4: 实现第 11–16 页销售与收束**

生成整体价值、客户识别、30 秒销售话术、FAQ、现场演示导航与总结页。确保销售话术可直接照读，FAQ 覆盖最大工时、条件叠加、含小费定义与手动上报边界。

- [ ] **Step 5: 生成 PPT**

Run: `node scripts/generate-tip-management-launch-ppt.mjs`

Expected: 命令退出码为 0，输出 `docs/产品发布会/小费管理-新增能力产品发布会.pptx`，文件大小大于 0。

- [ ] **Step 6: 提交生成脚本与初版 PPT**

```bash
git add scripts/generate-tip-management-launch-ppt.mjs docs/产品发布会/小费管理-新增能力产品发布会.pptx
git commit -m "docs: add tip management launch presentation"
```

### Task 2: 内容与结构验收

**Files:**
- Verify: `docs/产品发布会/小费管理-新增能力产品发布会.pptx`
- Modify if needed: `scripts/generate-tip-management-launch-ppt.mjs`

**Interfaces:**
- Consumes: Task 1 输出的 PPT。
- Produces: 无缺页、无口径错误、无占位符的内容成稿。

- [ ] **Step 1: 提取 PPT 文本**

Run: `python -m markitdown "docs/产品发布会/小费管理-新增能力产品发布会.pptx"`

Expected: 按顺序出现 16 页内容，并包含“最大时长”“加收服务费”“支付方式”“订单小费状态”“$100”“$50”“$150”。

- [ ] **Step 2: 检查页数与演讲者备注**

解包 PPT，确认 `ppt/slides` 中有 16 个 slide XML，并确认每页存在 notesSlide 关系；检查备注中包含转场、必讲事实和建议时长。

- [ ] **Step 3: 扫描占位符与错误口径**

Run: `python -m markitdown "docs/产品发布会/小费管理-新增能力产品发布会.pptx" | Select-String -Pattern 'xxxx|lorem|ipsum|100元|50元|二选一'`

Expected: 无匹配。

- [ ] **Step 4: 修正文案问题并重新生成**

若步骤 1–3 发现问题，仅修改 `scripts/generate-tip-management-launch-ppt.mjs` 的对应页面内容，重新运行生成命令，再重复步骤 1–3 直至通过。

### Task 3: 视觉 QA、修正与复验

**Files:**
- Verify: `docs/产品发布会/小费管理-新增能力产品发布会.pptx`
- Modify: `scripts/generate-tip-management-launch-ppt.mjs`
- Temporary: `.tmp-tip-management-launch-qa/`

**Interfaces:**
- Consumes: Task 2 内容验收通过的 PPT。
- Produces: 无明显重叠、截断、低对比度和边距问题的最终 PPT。

- [ ] **Step 1: 渲染逐页图片**

使用技能提供的 `scripts/office/soffice.py` 将 PPT 转换为 PDF，再用 `pdftoppm -jpeg -r 150` 输出 16 张逐页图片到 `.tmp-tip-management-launch-qa/`。

- [ ] **Step 2: 执行首次视觉检查并记录问题**

逐页检查重叠、溢出、边缘截断、低对比度、元素间距小于 0.3 英寸、列宽不一致和视觉重复。必须记录至少一个可改进点，重点检查第 3、8、9、10、13、14 页的高信息密度区域。

- [ ] **Step 3: 修正生成脚本并重新生成**

针对记录的问题修改具体坐标、字号、间距或文案长度，再次运行 `node scripts/generate-tip-management-launch-ppt.mjs`。

- [ ] **Step 4: 复验受影响页面及全套缩略图**

重新渲染 PPT，先逐页复验所有受影响页面，再生成全套缩略图检查整体节奏、风格一致性与页面密度。Expected: 不再发现新的重叠、截断或明显版式问题。

- [ ] **Step 5: 最终内容回归**

再次运行 MarkItDown 文本提取和占位符扫描，确认视觉修正未造成内容丢失或口径变化。

- [ ] **Step 6: 提交最终修正**

```bash
git add scripts/generate-tip-management-launch-ppt.mjs docs/产品发布会/小费管理-新增能力产品发布会.pptx
git commit -m "docs: polish tip management launch presentation"
```
