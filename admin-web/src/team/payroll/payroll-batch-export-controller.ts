import { createBatchArtifact, downloadBatchArtifact } from "./payroll-batch-export-artifacts";
import { attachBatchDeclarationPresentations, buildBatchExportInput, classifyBatchEmployee } from "./payroll-batch-export-data";
import { createPayrollBatchExportTask, loadBatchExportPreferences, saveBatchExportPreferences, type BatchTaskSnapshot } from "./payroll-batch-export-task";
import type { BatchEmployeeRecord, BatchExportInput, BatchExportOptions, PayrollBatchBridge } from "./payroll-batch-export-types";
import type { PayrollPageContext } from "./payroll-context";
import { getBatchStoreId, scopeBatchSnapshot, filterBatchEmployees } from "./payroll-batch-export-filters";

export interface PayrollBatchExportControllerHandle { destroy(): void }

export function mountPayrollBatchExportController(
  shadowRoot: ShadowRoot,
  pageRoot: HTMLElement,
  bridge: PayrollBatchBridge,
  context: Pick<PayrollPageContext, "getScope">,
): PayrollBatchExportControllerHandle {
  const controller = new AbortController();
  const selectedIds = new Set<string>();
  let options = loadBatchExportPreferences(localStorage);
  let records: BatchEmployeeRecord[] = [];
  let search = "";
  let selectedStoreId = "";
  let selectedRole = "";
  const selectedRoles = new Set<string>();
  let unifiedPicker = false;
  let focusedEmployeeId = "";
  let taskStoreId = "";
  let currentInput: BatchExportInput | null = null;
  let downloadUrl = "";
  let openingContext = "";
  let starting = false;
  let taskContext = "";
  const task = createPayrollBatchExportTask({ bridge, createArtifact: createBatchArtifact });
  const $ = <T extends HTMLElement>(selector: string): T | null => shadowRoot.querySelector<T>(selector);
  const $$ = <T extends HTMLElement>(selector: string): T[] => Array.from(shadowRoot.querySelectorAll<T>(selector));
  const modal = $("#payrollBatchExportModal");
  const picker = $("#payrollBatchEmployeePicker");
  const employeeList = $("#payrollBatchEmployeeList");
  const selectedCount = $("#payrollBatchSelectedCount");
  const summary = $("#payrollBatchExportSummary");
  const startButton = $("#payrollBatchExportStart") as HTMLButtonElement | null;
  const taskPanel = $("#payrollBatchExportTaskPanel");

  function readOptions(): BatchExportOptions {
    return {
      scope: "selected",
      detailType: options.detailType,
      format: "pdf",
      organization: "merged",
      summaryPagination: options.summaryPagination === "auto-pages" ? "auto-pages" : "single-page",
    };
  }

  function applyOptions(next: BatchExportOptions): void {
    const values: Record<string, string> = {
      payrollBatchScope: next.scope,
      payrollBatchDetail: next.detailType,
      payrollBatchFormat: next.format,
      payrollBatchOrganization: next.organization,
      payrollBatchPagination: next.summaryPagination,
    };
    Object.entries(values).forEach(([name, value]) => {
      const input = shadowRoot.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    });
    options = next;
  }

  function loadRecords(): void {
    records = [];
    if (!selectedStoreId) return;
    const snapshot = scopeBatchSnapshot(bridge.getSnapshot(), context.getScope(), selectedStoreId);
    const period = snapshot.data.periods.find((item) => item.id === snapshot.periodId);
    const employees = period ? snapshot.data.employees[period.id] ?? [] : [];
    records = employees.map((employee) => classifyBatchEmployee(employee, period!));
  }

  function employeeRoles(employee: BatchEmployeeRecord["employee"]): string[] {
    const roleRecords = Array.isArray(employee.roleRecords) ? employee.roleRecords as { role?: unknown }[] : [];
    return Array.from(new Set([...roleRecords.map(record => record.role), ...employee.segments.map(segment => segment.role), employee.role, employee.department].map(value => String(value ?? "").trim()).filter(value => value && value !== "—")));
  }
  function availableRoles(): string[] {
    return Array.from(new Set(records.flatMap(record => employeeRoles(record.employee).length ? employeeRoles(record.employee) : [""]))).sort();
  }
  function renderEmployeeRoles(): void {
    const roleList = $("#payrollBatchRolesList");
    const employee = records.find(record => record.employee.id === focusedEmployeeId)?.employee;
    if (roleList) roleList.innerHTML = employee ? `<strong>${escapeHtml(employee.name)}</strong>` + (employeeRoles(employee).map(role => `<p class="payroll-batch-owned-role">${escapeHtml(role)}</p>`).join("") || "<p>未设置角色</p>") : "<p>请点击左侧员工查看角色</p>";
  }

  function selectAllRoles(): void {
    selectedRoles.clear();
    for (const role of availableRoles()) selectedRoles.add(role);
  }

  function renderFilters(): void {
    const storeSelect = $<HTMLSelectElement>("#payrollBatchStoreFilter");
    if (storeSelect) {
      storeSelect.innerHTML = '<option value="">请选择门店</option>' + context.getScope().stores.map(store => `<option value="${escapeHtml(store.id)}">${escapeHtml(store.labelZh || store.labelEn || store.id)}</option>`).join("");
      storeSelect.value = selectedStoreId;
    }
    const roleSelect = $<HTMLSelectElement>("#payrollBatchRoleFilter");
    if (roleSelect) {
      const roles = Array.from(new Set(records.map(record => String(record.employee.role ?? "").trim()).filter(Boolean))).sort();
      roleSelect.innerHTML = '<option value="">全部角色</option>' + roles.map(role => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`).join("");
      roleSelect.value = selectedRole;
    }
    const roleList = $("#payrollBatchRoleFilterOptions");
    if (roleList) {
      const roles = availableRoles();
      const allSelected = roles.length > 0 && roles.every(role => selectedRoles.has(role));
      roleList.innerHTML = `<label class="payroll-employee-picker-role${allSelected ? " is-selected" : ""}"><input type="checkbox" id="payrollBatchAllRoles" ${allSelected ? "checked" : ""} ${roles.length ? "" : "disabled"}><span>全选角色</span></label>` + roles.map(role => `<label class="payroll-employee-picker-role${selectedRoles.has(role) ? " is-selected" : ""}"><input type="checkbox" data-batch-role="${escapeHtml(role)}" ${selectedRoles.has(role) ? "checked" : ""}><span>${escapeHtml(role || "未设置角色")}</span></label>`).join("");
      const all = $<HTMLInputElement>("#payrollBatchAllRoles");
      if (all) all.indeterminate = selectedRoles.size > 0 && !allSelected;
      const heading = $("#payrollBatchRoleMultiFilter summary");
      if (heading) heading.textContent = `角色筛选：${allSelected ? "全部角色" : selectedRoles.size ? `已选 ${selectedRoles.size} 项` : "未选择"}`;
    }
  }

  function visibleRecords(): BatchEmployeeRecord[] {
    const candidates = filterBatchEmployees(records.map(record => record.employee), unifiedPicker ? "" : selectedRole, search);
    const employees = new Set(candidates.filter(employee => !unifiedPicker || (employeeRoles(employee).length ? employeeRoles(employee) : [""]).some(role => selectedRoles.has(role))));
    return records.filter(record => employees.has(record.employee));
  }

  function statusLabel(record: BatchEmployeeRecord): string {
    if (record.status === "no_data") return "无数据";
    if (record.status === "incomplete") return "Draft · 信息不完整";
    if (record.status === "unconfirmed") return "Draft · 未确认";
    return "可导出";
  }

  function renderEmployeePicker(): void {
    if (!employeeList || !selectedCount) return;
    employeeList.innerHTML = visibleRecords().map((record) => {
      const checked = selectedIds.has(record.employee.id);
      const statusClass = record.status === "no_data" ? "is-empty" : record.status === "ready" ? "" : "is-draft";
      if (unifiedPicker) return `<div class="payroll-employee-picker-item${checked ? " is-selected" : ""}"><input type="checkbox" aria-label="选择 ${escapeHtml(record.employee.name)}" data-batch-employee-id="${escapeHtml(record.employee.id)}" ${checked ? "checked" : ""} ${!checked && selectedIds.size >= 10 ? "disabled" : ""}><span class="payroll-employee-picker-avatar" aria-hidden="true">${escapeHtml(Array.from(record.employee.name || "—")[0])}</span><button type="button" class="payroll-batch-view-roles" data-action="batch-view-roles" data-employee-id="${escapeHtml(record.employee.id)}" aria-pressed="${focusedEmployeeId === record.employee.id}"><strong>${escapeHtml(record.employee.name)}</strong><small>${escapeHtml(employeeRoles(record.employee).join("、") || "—")}</small></button><span class="payroll-employee-picker-arrow" aria-hidden="true">›</span></div>`;
      return `<label class="payroll-batch-employee-row"><input type="checkbox" aria-label="选择 ${escapeHtml(record.employee.name)}" data-batch-employee-id="${escapeHtml(record.employee.id)}" ${checked ? "checked" : ""} ${!checked && selectedIds.size >= 10 ? "disabled" : ""}><strong>${escapeHtml(record.employee.name)}</strong><span>${escapeHtml(record.employee.id || "—")}</span><span>${escapeHtml(record.employee.role || "—")}</span><span class="payroll-batch-status ${statusClass}">${statusLabel(record)}</span></label>`;
    }).join("") || `<p style="padding:24px;text-align:center;color:#8c8c8c">${records.length ? "没有符合筛选条件的员工" : selectedStoreId ? "所选门店在当前薪资周期内暂无员工" : "请先选择门店"}</p>`;
    const hidden = Array.from(selectedIds).filter((id) => !visibleRecords().some((record) => record.employee.id === id)).length;
    selectedCount.textContent = `已选 ${selectedIds.size} / 10 人${hidden ? `，其中 ${hidden} 人不在当前筛选结果` : ""}${selectedIds.size === 10 ? "（已达上限）" : ""}`;
    if (!visibleRecords().some(record => record.employee.id === focusedEmployeeId)) focusedEmployeeId = "";
    renderEmployeeRoles();
  }

  function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderOptions(): void {
    options = readOptions();
    if (picker) picker.hidden = options.scope !== "selected";
    const pagination = $("#payrollBatchPaginationSection");
    if (pagination) pagination.hidden = !(options.detailType === "summary" && options.format === "pdf");
    renderSummary();
  }

  function renderSummary(): void {
    const chosen = options.scope === "all" ? records : records.filter((record) => selectedIds.has(record.employee.id));
    const count = (status: BatchEmployeeRecord["status"]) => chosen.filter((record) => record.status === status).length;
    const draft = count("incomplete") + count("unconfirmed");
    if (summary) summary.innerHTML = `将处理 <strong>${chosen.length}</strong> 名员工：可正常导出 ${count("ready")} 人，Draft ${draft} 人，无数据 ${count("no_data")} 人。预计生成 <strong>${options.organization === "merged" ? (chosen.length ? 1 : 0) : chosen.filter((record) => record.status !== "no_data").length}</strong> 个文件。`;
    if (startButton) startButton.disabled = starting || chosen.length === 0 || chosen.length > 10;
  }

  function contextKey(): string {
    const snapshot = bridge.getSnapshot();
    return JSON.stringify([snapshot.periodId, snapshot.employeeStoreFilter, snapshot.data.periods.find(item => item.id === snapshot.periodId)]);
  }

  function setMenu(open: boolean): void {
    const menu = $("#payroll-adp-export-menu");
    if (menu) menu.hidden = !open;
    $("#btn-payroll-adp-menu-toggle")?.setAttribute("aria-expanded", String(open));
  }

  function openModal(detailType: "summary" | "detailed", unified = false): void {
    unifiedPicker = unified;
    focusedEmployeeId = "";
    const roleMulti = $("#payrollBatchRoleMultiFilter"); if (roleMulti) { roleMulti.hidden = !unified; roleMulti.removeAttribute("open"); }
    selectedRoles.clear();
    modal?.classList.toggle("is-employee-picker", unified);
    const types = $("#payrollBatchDetailTypes"); if (types) types.hidden = !unified;
    const rolesColumn = $("#payrollBatchRolesColumn"); if (rolesColumn) rolesColumn.hidden = !unified;
    const columnLabel = $(".payroll-batch-column-label"); if (columnLabel) columnLabel.hidden = !unified;
    const dialog = modal?.querySelector<HTMLElement>(".modal");
    dialog?.classList.toggle("payroll-employee-picker", unified);
    dialog?.querySelector(".modal-header")?.classList.toggle("payroll-employee-picker-header", unified);
    if (startButton) { (dialog?.querySelector(unified ? ".modal-header" : ".modal-footer"))?.append(startButton); startButton.textContent = unified ? "确认导出" : "导出 PDF"; }
    for (const input of $$<HTMLInputElement>('input[name="batchPickerDetail"]')) input.checked = input.value === detailType;
    setMenu(false);
    openingContext = contextKey();
    selectedStoreId = getBatchStoreId(bridge.getSnapshot(), context.getScope());
    selectedRole = ""; selectedIds.clear(); search = "";
    try { loadRecords(); } catch { records = []; selectedStoreId = ""; }
    selectAllRoles();
    renderFilters();
    const searchInput = $("#payrollBatchEmployeeSearch") as HTMLInputElement | null;
    if (searchInput) searchInput.value = "";
    applyOptions({ ...loadBatchExportPreferences(localStorage), scope: "selected", detailType, format: "pdf", organization: "merged" });
    const title = $("#payrollBatchExportTitle");
    if (title) title.textContent = unified ? "批量导出员工信息" : detailType === "summary" ? "导出精简明细" : "导出详细明细";
    renderEmployeePicker(); renderOptions();
    modal?.classList.add("show"); modal?.setAttribute("aria-hidden", "false");
    searchInput?.focus();
  }

  function closeModal(): void { modal?.classList.remove("show"); modal?.setAttribute("aria-hidden", "true"); $("#btn-payroll-adp-menu-toggle")?.focus(); }

  function renderTask(value: BatchTaskSnapshot): void {
    if (!taskPanel) return;
    taskPanel.hidden = value.status === "idle";
    const percent = value.total ? Math.round(value.completed / value.total * 100) : 0;
    const progress = $("#payrollBatchExportTaskProgress");
    progress?.setAttribute("aria-valuenow", String(percent));
    const bar = progress?.querySelector<HTMLElement>("span"); if (bar) bar.style.width = `${percent}%`;
    const statusMap: Record<string, string> = { preparing: "准备数据", generating: "正在生成", packaging: "正在合并或打包", completed: "已完成", partial: "部分成功", failed: "失败", cancelling: "取消中", cancelled: "已取消" };
    const status = $("#payrollBatchTaskStatus"); if (status) status.textContent = statusMap[value.status] ?? value.status;
    const message = $("#payrollBatchTaskMessage");
    if (message) message.textContent = value.errorMessage || (value.status === "completed" || value.status === "partial" ? `${value.result?.succeededIds.length ?? 0} 名员工已生成，${value.result?.skippedIds.length ?? 0} 名无数据。` : `已处理 ${value.completed} / ${value.total} 名员工`);
    const cancel = $("#payrollBatchTaskCancel") as HTMLButtonElement | null; if (cancel) { cancel.hidden = !["preparing", "generating", "packaging", "cancelling"].includes(value.status); cancel.disabled = !task.canCancel(); cancel.title = value.status === "packaging" ? "正在合并或打包，暂时不能取消" : ""; }
    const download = $("#payrollBatchTaskDownload") as HTMLButtonElement | null; if (download) download.hidden = !value.result;
    const retry = $("#payrollBatchTaskRetry") as HTMLButtonElement | null; if (retry) retry.hidden = !(value.status === "partial" && value.result?.failures.length);
    const close = $("#payrollBatchTaskClose") as HTMLButtonElement | null; if (close) close.hidden = !["completed", "partial", "failed", "cancelled"].includes(value.status);
    const failures = $("#payrollBatchTaskFailures");
    if (failures) {
      const items = value.result?.failures.map(item => `<div>${escapeHtml(item.employeeName)}：${escapeHtml(item.message)}</div>`) ?? [];
      for (const id of value.result?.skippedIds ?? []) items.push(`<div>${escapeHtml(currentInput?.records.find(record => record.employee.id === id)?.employee.name ?? id)}：无薪资数据，未生成</div>`);
      failures.hidden = items.length === 0; failures.innerHTML = items.join("");
    }
  }

  async function start(): Promise<void> {
    if (starting) return;
    options = readOptions();
    try {
      if (openingContext !== contextKey()) throw new Error("门店或薪资周期已变化，请关闭后重新选择");
      if (["preparing", "generating", "packaging", "cancelling"].includes(task.getSnapshot().status)) throw new Error("已有导出任务正在执行，请完成或取消后再试");
      currentInput = attachBatchDeclarationPresentations(buildBatchExportInput(scopeBatchSnapshot(bridge.getSnapshot(), context.getScope(), selectedStoreId), options, Array.from(selectedIds)), bridge.getDetailPayload);
      taskContext = openingContext;
      taskStoreId = selectedStoreId;
      starting = true;
      renderSummary();
      try { saveBatchExportPreferences(localStorage, options); } catch { /* Storage is optional. */ }
      const running = task.run(currentInput);
      closeModal();
      await running;
    } catch (error) {
      if (summary) summary.innerHTML = `<span style="color:#cf1322">${escapeHtml(error instanceof Error ? error.message : error)}</span>`;
    } finally {
      starting = false;
      if (startButton) startButton.disabled = selectedIds.size === 0 || selectedIds.size > 10;
    }
  }

  function beforeUnload(event: BeforeUnloadEvent): void {
    const status = task.getSnapshot().status;
    if (["preparing", "generating", "packaging", "cancelling"].includes(status)) { event.preventDefault(); event.returnValue = ""; }
  }

  pageRoot.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    const action = target?.dataset.action;
    if (action === "open-batch-detail-export") openModal(target?.dataset.detailType === "detailed" ? "detailed" : "summary", target?.dataset.pickerLayout === "unified");
    if (!(event.target as HTMLElement).closest(".payroll-adp-export-dropdown")) setMenu(false);
    if (action === "close-batch-detail-export") closeModal();
    if (action === "batch-view-roles") { focusedEmployeeId = target?.dataset.employeeId || ""; renderEmployeePicker(); }
    if (action === "batch-clear-selection") { selectedIds.clear(); renderEmployeePicker(); renderSummary(); }
  }, { signal: controller.signal });
  pageRoot.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.name === "batchPickerDetail") { options = { ...options, detailType: input.value === "detailed" ? "detailed" : "summary" }; renderOptions(); return; }
    if (input.id === "payrollBatchAllRoles") { if (input.checked) selectAllRoles(); else selectedRoles.clear(); renderFilters(); renderEmployeePicker(); return; }
    if (input.dataset.batchRole !== undefined) { if (input.checked) selectedRoles.add(input.dataset.batchRole); else selectedRoles.delete(input.dataset.batchRole); renderFilters(); renderEmployeePicker(); return; }
    if (input.id === "payrollBatchStoreFilter") {
      selectedStoreId = input.value; selectedRole = ""; search = ""; selectedIds.clear();
      selectedRoles.clear();
      const searchInput = $<HTMLInputElement>("#payrollBatchEmployeeSearch"); if (searchInput) searchInput.value = "";
      try { loadRecords(); } catch { records = []; selectedStoreId = ""; }
      selectAllRoles();
      renderFilters(); renderEmployeePicker(); renderSummary(); return;
    }
    if (input.id === "payrollBatchRoleFilter") { selectedRole = input.value; renderEmployeePicker(); renderSummary(); return; }
    if (input.matches("input[name^='payrollBatch']")) renderOptions();
    if (input.dataset.batchEmployeeId) { if (!input.checked) selectedIds.delete(input.dataset.batchEmployeeId); else if (selectedIds.size < 10) selectedIds.add(input.dataset.batchEmployeeId); renderEmployeePicker(); renderSummary(); }
  }, { signal: controller.signal });
  $("#payrollBatchEmployeeSearch")?.addEventListener("input", (event) => { search = (event.target as HTMLInputElement).value; renderEmployeePicker(); }, { signal: controller.signal });
  startButton?.addEventListener("click", () => { void start(); }, { signal: controller.signal });
  $("#payrollBatchTaskCancel")?.addEventListener("click", () => task.cancel(), { signal: controller.signal });
  $("#payrollBatchTaskDownload")?.addEventListener("click", () => { const result = task.getSnapshot().result; if (result) { if (downloadUrl) URL.revokeObjectURL(downloadUrl); downloadUrl = downloadBatchArtifact(result); } }, { signal: controller.signal });
  $("#payrollBatchTaskRetry")?.addEventListener("click", () => {
    const result = task.getSnapshot().result;
    if (!currentInput || !result) return;
    if (taskContext !== contextKey()) { const message = $("#payrollBatchTaskMessage"); if (message) message.textContent = "请返回原门店和薪资周期后重试"; return; }
    const ids = result.failures.map(item => item.employeeId);
    try {
      const permitted = scopeBatchSnapshot(bridge.getSnapshot(), context.getScope(), taskStoreId);
      buildBatchExportInput(permitted, currentInput.options, ids);
    } catch (error) { const message = $("#payrollBatchTaskMessage"); if (message) message.textContent = String(error); return; }
    currentInput = attachBatchDeclarationPresentations({ ...currentInput, records: currentInput.records.filter(record => ids.includes(record.employee.id)) }, bridge.getDetailPayload);
    void task.retry(currentInput).catch(error => { const message = $("#payrollBatchTaskMessage"); if (message) message.textContent = String(error); });
  }, { signal: controller.signal });
  pageRoot.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { setMenu(false); if (modal?.classList.contains("show")) closeModal(); }
    if (event.key === "Tab" && modal?.classList.contains("show")) {
      const items = Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')).filter(item => item.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && shadowRoot.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && shadowRoot.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }, { signal: controller.signal });
  $("#payrollBatchTaskClose")?.addEventListener("click", () => { if (taskPanel) taskPanel.hidden = true; }, { signal: controller.signal });
  const unsubscribe = task.subscribe(renderTask);
  window.addEventListener("beforeunload", beforeUnload);

  return { destroy() { controller.abort(); unsubscribe(); task.destroy(); window.removeEventListener("beforeunload", beforeUnload); if (downloadUrl) URL.revokeObjectURL(downloadUrl); } };
}

