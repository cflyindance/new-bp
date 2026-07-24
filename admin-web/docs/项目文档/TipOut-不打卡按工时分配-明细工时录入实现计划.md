# TipOut · 不打卡按工时分配 · 明细工时录入 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.
>
> **依据**：`docs/项目文档/TipOut-不打卡按工时分配-明细工时录入设计方案.md`（v1.0）  
> **日期**：2026-07-24  
> **状态**：已实现（Tasks 1–6 已完成）

**Goal:** 在小费分配明细（legacy 池汇总卡）中，当规则为「不打卡 + 按工作时长占比」时，于【员工分配比例】左侧增加可编辑【工时】列，并按工时重算比例与金额。

**Architecture:** 仅改 `dist/TipOut/detail.html` 的 UI 联动：用 `rule.clockin === 'noclock' && rule.distribution === 'hours'` 控制列渲染；`onEmpHoursChange` 按同表工时重写比例后复用 `recalcDetailLegacyCard`；用独立 class 区分工时/比例输入，避免误读。

**Tech Stack:** 原生 HTML / JS（TipOut 演示页，无单测框架；以浏览器冒烟验收）

---

## 文件与职责

| 文件 | 职责 |
|------|------|
| `dist/TipOut/detail.html` | 唯一改动面：helper、表头/行渲染、重算、增删行 |
| `dist/TipOut/ruleData.js` | **只读参考**；冒烟前可临时造一条 `clockin:'noclock'` + `distribution:'hours'` 规则（测完可还原，或保留作演示） |

不改：`rule-add.html`、`tipAllocation.js`、订单小费卡 `buildOrderTipDetailCardHtml`。

---

## 任务拆分

### Task 1: 工时模式判定与数值 helper

**Files:**
- Modify: `dist/TipOut/detail.html`（约在 `recalcDetailLegacyCard` 之前插入）

- [x] **Step 1: 增加 helper**

在 `toggleDetailFold` 与 `recalcDetailLegacyCard` 之间加入：

```javascript
function isManualHoursDistMode(rule) {
  return !!(rule && rule.clockin === 'noclock' && rule.distribution === 'hours');
}

function parseHoursInput(val) {
  if (val == null || val === '') return 0;
  var n = parseFloat(val);
  if (isNaN(n) || n < 0) return 0;
  return n;
}

function roundPct(x) {
  return Math.round(x * 10) / 10;
}
```

- [x] **Step 2: 自检**

在浏览器控制台临时调用：`isManualHoursDistMode({clockin:'noclock',distribution:'hours'}) === true`，其它组合为 `false`。

---

### Task 2: 修正金额重算的输入选择器

**Files:**
- Modify: `dist/TipOut/detail.html` → `recalcDetailLegacyCard`

**背景：** 现网用 `td.input-cell input` 取比例；工时列加入后会误读第一个 input。

- [x] **Step 1: 改写 `recalcDetailLegacyCard` 员工比例汇总与写金额**

将员工比例相关查询改为 `.detail-emp-pct-input`；金额格为比例单元格的下一格：

```javascript
function recalcDetailLegacyCard(card) {
  if (!card || card.getAttribute('data-order-tip-mode') === '1') return;
  var pool = parseFloat(card.getAttribute('data-pool')) || 0;
  card.querySelectorAll('.detail-result-section[data-role]').forEach(function(section) {
    var pctInp = section.querySelector('.detail-role-pct-input');
    var amtEl = section.querySelector('.role-amount');
    var pct = pctInp ? (parseFloat(pctInp.value) || 0) : 0;
    var roleAmt = +(pool * pct / 100).toFixed(2);
    if (amtEl) amtEl.textContent = money(roleAmt);
    var table = section.querySelector('table.detail-employee-table');
    if (!table) return;
    var empPctSum = 0;
    table.querySelectorAll('tbody tr').forEach(function(tr) {
      var ic = tr.querySelector('.detail-emp-pct-input');
      if (ic) empPctSum += parseFloat(ic.value) || 0;
    });
    table.querySelectorAll('tbody tr').forEach(function(tr) {
      var empInp = tr.querySelector('.detail-emp-pct-input');
      var pctCell = empInp ? empInp.closest('td') : null;
      var amtCell = pctCell && pctCell.nextElementSibling;
      var empPct = empInp ? (parseFloat(empInp.value) || 0) : 0;
      var empAmt = empPctSum > 0 ? +(roleAmt * empPct / empPctSum).toFixed(2) : 0;
      if (amtCell) amtCell.textContent = money(empAmt);
    });
  });
}
```

- [x] **Step 2: 冒烟（非工时模式回归）**

打开 `detail.html`，选一条非 `noclock+hours` 规则，改员工比例，确认金额仍按比例分摊。

---

### Task 3: 渲染【工时】列（首次不按工时重算比例）

**Files:**
- Modify: `dist/TipOut/detail.html` → `buildLegacyDetailCardHtml`

- [x] **Step 1: 在函数开头取模式标志，并给 card/table 打标**

```javascript
var manualHours = isManualHoursDistMode(rule);
```

卡片根节点增加（便于增删行判断）：

```javascript
// data-pool 那行改为同时带 data-manual-hours
'<div class="card detail-card" data-rule-id="' + escHtml(rid) +
  '" data-pool="' + (+data.pool || 0) +
  '" data-manual-hours="' + (manualHours ? '1' : '0') + '">' +
```

- [x] **Step 2: 条件表头**

```javascript
var headHours = manualHours ? '<th>工时</th>' : '';
// ...
'<thead><tr><th>分配员工</th>' + headHours +
  '<th>员工分配比例</th><th>员工分配金额</th><th>操作</th></tr></thead><tbody>';
```

- [x] **Step 3: 条件行单元格；比例加 class；工时默认 0 且不触发重算**

```javascript
var hoursCell = manualHours
  ? '<td class="input-cell"><input type="number" class="detail-emp-hours-input" value="0" min="0" step="0.1" ' +
    'onchange="onEmpHoursChange(\'' + tidJs + '\')"> h</td>'
  : '';
html += '<tr>' +
  '<td><select class="form-control" style="width:140px;height:28px;font-size:13px">' + opts + '</select></td>' +
  hoursCell +
  '<td class="input-cell"><input type="number" class="detail-emp-pct-input" value="' + empPcts[ei] +
    '" onchange="recalcRoleAmount(\'' + tidJs + '\')"> %</td>' +
  '<td>' + money(empAmount) + '</td>' +
  '<td class="action-cell">' +
  '<a href="javascript:void(0)" onclick="addDetailRow(\'' + tidJs + '\',this)">新增行</a>' +
  '<a href="javascript:void(0)" class="danger" onclick="removeDetailRow(\'' + tidJs + '\',this)">删除行</a></td>' +
  '</tr>';
```

注意：首次渲染**不要**调用 `onEmpHoursChange`；沿用种子 `empPcts`。

- [x] **Step 4: 冒烟**

准备规则：`clockin: 'noclock'`, `distribution: 'hours'`（可在 `ruleData.js` 临时改一条）。打开明细：应出现【工时】列且值为 0，比例仍为种子值（非全 0）。其它规则无工时列。

---

### Task 4: `onEmpHoursChange` — 改工时覆盖比例

**Files:**
- Modify: `dist/TipOut/detail.html`（放在 `recalcRoleAmount` 附近）

- [x] **Step 1: 实现按工时重算比例**

```javascript
function onEmpHoursChange(tableId) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var card = table.closest('.detail-card');
  if (!card || card.getAttribute('data-manual-hours') !== '1') return;

  var rows = table.querySelectorAll('tbody tr');
  var hoursList = [];
  var sumH = 0;
  rows.forEach(function(tr) {
    var hInp = tr.querySelector('.detail-emp-hours-input');
    var h = parseHoursInput(hInp ? hInp.value : 0);
    hoursList.push(h);
    sumH += h;
  });

  rows.forEach(function(tr, i) {
    var pctInp = tr.querySelector('.detail-emp-pct-input');
    if (!pctInp) return;
    var pct = sumH > 0 ? roundPct(hoursList[i] / sumH * 100) : 0;
    pctInp.value = pct;
  });

  // 可选：把最后一行比例微调到合计 100，避免四舍五入误差
  if (sumH > 0 && rows.length > 1) {
    var sumPct = 0;
    rows.forEach(function(tr, i) {
      if (i < rows.length - 1) {
        sumPct += parseFloat(tr.querySelector('.detail-emp-pct-input').value) || 0;
      }
    });
    var lastPctInp = rows[rows.length - 1].querySelector('.detail-emp-pct-input');
    if (lastPctInp) lastPctInp.value = roundPct(100 - sumPct);
  }

  recalcRoleAmount(tableId);
}
```

- [x] **Step 2: 冒烟（对照设计 §3.4）**

角色金额 `$100`（或调角色比例使之为 100）：Alice=6、Bob=10 → 比例约 37.5% / 62.5%，金额 `$37.50` / `$62.50`。  
先手改 Alice 比例为 60%，再改 Alice 工时 → 比例被工时覆盖重算。

---

### Task 5: 增删行对齐工时列

**Files:**
- Modify: `dist/TipOut/detail.html` → `addDetailRow` / `removeDetailRow`

- [x] **Step 1: `addDetailRow` 按 card 标志拼工时单元格**

```javascript
function addDetailRow(tableId, triggerEl) {
  var currentRow = triggerEl.closest('tr');
  var role = getRoleFromRow(currentRow);
  if (!role) return;
  var allEmployees = getEmployeesForRoleGroup(role);
  var selectedEmployees = getSelectedEmployeesInRole(tableId, role);
  var available = allEmployees.filter(function(e) { return selectedEmployees.indexOf(e) === -1; });
  if (available.length === 0) { showNotification('该角色下所有员工已被分配，无可选员工', 'warning'); return; }
  var options = available.map(function(e) { return '<option>' + e + '</option>'; }).join('');
  var lastRow = getLastRowOfRole(tableId, role);
  var table = document.getElementById(tableId);
  var card = table ? table.closest('.detail-card') : null;
  var manualHours = card && card.getAttribute('data-manual-hours') === '1';
  var hoursCell = manualHours
    ? '<td class="input-cell"><input type="number" class="detail-emp-hours-input" value="0" min="0" step="0.1" onchange="onEmpHoursChange(\'' + tableId + '\')"> h</td>'
    : '';
  var newRow = document.createElement('tr');
  newRow.innerHTML =
    '<td><select class="form-control" style="width:140px;height:28px;font-size:13px">' + options + '</select></td>' +
    hoursCell +
    '<td class="input-cell"><input type="number" class="detail-emp-pct-input" value="0" onchange="recalcRoleAmount(\'' + tableId + '\')"> %</td>' +
    '<td>$0.00</td>' +
    '<td class="action-cell"><a href="javascript:void(0)" onclick="addDetailRow(\'' + tableId + '\',this)">新增行</a>' +
    '<a href="javascript:void(0)" class="danger" onclick="removeDetailRow(\'' + tableId + '\',this)">删除行</a></td>';
  lastRow.after(newRow);
  if (manualHours) onEmpHoursChange(tableId);
  else recalcRoleAmount(tableId);
  showNotification('已在 ' + role + ' 角色组新增员工行');
}
```

说明：新增行工时默认 0；若其它行已有工时，调用 `onEmpHoursChange` 会按合计重算全员比例（符合设计「之后改工时 / 增删触达」；新增即触达一次重算可接受）。若希望「仅改工时/删行才重算」，可把 `onEmpHoursChange` 换成 `recalcRoleAmount`，等用户改工时再算——**采用前者**（与设计「新增后改工时按合计重算」一致，且新增 0 工时行立即反映到比例更直观）。

- [x] **Step 2: `removeDetailRow` 删后按模式重算**

```javascript
setTimeout(function() {
  row.remove();
  var card2 = document.getElementById(tableId) && document.getElementById(tableId).closest('.detail-card');
  if (card2 && card2.getAttribute('data-manual-hours') === '1') onEmpHoursChange(tableId);
  else recalcRoleAmount(tableId);
}, 200);
```

- [x] **Step 3: 冒烟**

工时模式下新增行有工时列且默认 0；删除一行后剩余员工比例按工时重算；非工时模式增删无工时列、行为不变。

---

### Task 6: 全量冒烟验收（对照设计）

- [x] **显示条件**
  - `noclock` + `hours` → 有【工时】列，顺序：员工 | 工时 | 比例 | 金额 | 操作
  - 其它组合 → 无工时列
- [x] **首次渲染** 工时为 0，比例为种子值（非因 Σ工时=0 全清零）
- [x] **改工时** 覆盖手改比例；金额跟比例
- [x] **只改比例** 工时不变，金额变
- [x] **Σ工时=0**（全部清空）→ 比例 0、金额 `$0.00`
- [x] **非法/负值** 按 0
- [x] **非工时规则** 改比例/角色比例仍正常
- [x] **订单小费卡** 未误加工时列

完成后将设计方案状态改为「已落地」，实现计划状态改为「已实现」。

---

## Spec 覆盖自检

| 设计章节 | 对应任务 |
|----------|----------|
| §二 触发与列顺序 | Task 3 |
| §3.1–3.3 交互与公式 | Task 4 |
| §3.4 示例 | Task 4 Step 2 / Task 6 |
| §四 边界（含首次不重算） | Task 3、4、5、6 |
| §五 落点与选择器修正 | Task 2、3、4、5 |
| §1.3 非目标 | 未纳入任何任务 |

无 TBD / 占位步骤。
