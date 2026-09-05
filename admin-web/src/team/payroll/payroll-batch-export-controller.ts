import { createBatchArtifact, downloadBatchArtifact } from "./payroll-batch-export-artifacts";
import { buildBatchExportInput, classifyBatchEmployee } from "./payroll-batch-export-data";
import { createPayrollBatchExportTask, loadBatchExportPreferences, saveBatchExportPreferences, type BatchTaskSnapshot } from "./payroll-batch-export-task";
import type { BatchEmployeeRecord, BatchExportInput, BatchExportOptions, PayrollBatchBridge } from "./payroll-batch-export-types";

export interface PayrollBatchExportControllerHandle { destroy(): void }

export function mountPayrollBatchExportController(
  shadowRoot: ShadowRoot,
  pageRoot: HTMLElement,
  bridge: PayrollBatchBridge,
): PayrollBatchExportControllerHandle {
  const controller = new AbortController();
  const selectedIds = new Set<string>();
  let options = loadBatchExportPreferences(localStorage);
  let records: BatchEmployeeRecord[] = [];
  let search = "";
  let currentInput: BatchExportInput | null = null;
  let downloadUrl = "";
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

  function inputValue(name: string): string {
    return shadowRoot.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? "";
  }

  function readOptions(): BatchExportOptions {
    return {
      scope: inputValue("payrollBatchScope") === "selected" ? "selected" : "all",
      detailType: inputValue("payrollBatchDetail") === "detailed" ? "detailed" : "summary",
      format: inputValue("payrollBatchFormat") === "csv" ? "csv" : "pdf",
      organization: inputValue("payrollBatchOrganization") === "zip" ? "zip" : "merged",
      summaryPagination: inputValue("payrollBatchPagination") === "auto-pages" ? "auto-pages" : "single-page",
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
    const snapshot = bridge.getSnapshot();
    const period = snapshot.data.periods.find((item) => item.id === snapshot.periodId);
    const employees = period ? snapshot.data.employees[period.id] ?? [] : [];
    const filter = String(snapshot.employeeStoreFilter ?? "").trim().toLowerCase();
    records = employees
      .filter((employee) => !filter || String(employee.store ?? "").toLowerCase().includes(filter) || filter.includes(String(employee.store ?? "").toLowerCase()))
      .map((employee) => classifyBatchEmployee(employee, period!));
  }

  function visibleRecords(): BatchEmployeeRecord[] {
    const needle = search.trim().toLowerCase();
    return needle ? records.filter((record) => [record.employee.name, record.employee.id, record.employee.role].some((value) => String(value ?? "").toLowerCase().includes(needle))) : records;
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
      return `<label class="payroll-batch-employee-row"><input type="checkbox" data-batch-employee-id="${escapeHtml(record.employee.id)}" ${checked ? "checked" : ""}><span><strong>${escapeHtml(record.employee.name)}</strong><small>${escapeHtml(record.employee.id)} · ${escapeHtml(record.employee.role ?? "未设置岗位")}</small></span><span class="payroll-batch-status ${statusClass}">${statusLabel(record)}</span></label>`;
    }).join("") || '<p style="padding:24px;text-align:center;color:#8c8c8c">没有匹配的员工</p>';
    const hidden = Array.from(selectedIds).filter((id) => !visibleRecords().some((record) => record.employee.id === id)).length;
    selectedCount.textContent = `已选 ${selectedIds.size} 人${hidden ? `，其中 ${hidden} 人不在当前搜索结果` : ""}`;
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
    if (startButton) startButton.disabled = chosen.length === 0 || chosen.length > 200;
  }

  function openModal(): void {
    loadRecords(); selectedIds.clear(); search = "";
    const searchInput = $("#payrollBatchEmployeeSearch") as HTMLInputElement | null;
    if (searchInput) searchInput.value = "";
    applyOptions({ ...loadBatchExportPreferences(localStorage), scope: "all" });
    renderEmployeePicker(); renderOptions();
    modal?.classList.add("show"); modal?.setAttribute("aria-hidden", "false");
  }

  function closeModal(): void { modal?.classList.remove("show"); modal?.setAttribute("aria-hidden", "true"); }

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
    if (failures) { failures.hidden = !value.result?.failures.length; failures.innerHTML = value.result?.failures.map((item) => `<div>${escapeHtml(item.employeeName)}：${escapeHtml(item.message)}</div>`).join("") ?? ""; }
  }

  async function start(): Promise<void> {
    options = readOptions();
    saveBatchExportPreferences(localStorage, options);
    try {
      currentInput = buildBatchExportInput(bridge.getSnapshot(), options, Array.from(selectedIds));
    } catch (error) {
      if (summary) summary.innerHTML = `<span style="color:#cf1322">${escapeHtml(error instanceof Error ? error.message : error)}</span>`;
      return;
    }
    closeModal(); await task.run(currentInput);
  }

  function beforeUnload(event: BeforeUnloadEvent): void {
    const status = task.getSnapshot().status;
    if (["preparing", "generating", "packaging", "cancelling"].includes(status)) { event.preventDefault(); event.returnValue = ""; }
  }

  pageRoot.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
    const action = target?.dataset.action;
    if (action === "open-batch-detail-export") openModal();
    if (action === "close-batch-detail-export") closeModal();
    if (action === "batch-select-results") { visibleRecords().forEach((record) => selectedIds.add(record.employee.id)); renderEmployeePicker(); renderSummary(); }
    if (action === "batch-clear-selection") { selectedIds.clear(); renderEmployeePicker(); renderSummary(); }
  }, { signal: controller.signal });
  pageRoot.addEventListener("change", (event) => {
    const input = event.target as HTMLInputElement;
    if (input.matches("input[name^='payrollBatch']")) renderOptions();
    if (input.dataset.batchEmployeeId) { input.checked ? selectedIds.add(input.dataset.batchEmployeeId) : selectedIds.delete(input.dataset.batchEmployeeId); renderEmployeePicker(); renderSummary(); }
  }, { signal: controller.signal });
  $("#payrollBatchEmployeeSearch")?.addEventListener("input", (event) => { search = (event.target as HTMLInputElement).value; renderEmployeePicker(); }, { signal: controller.signal });
  startButton?.addEventListener("click", () => { void start(); }, { signal: controller.signal });
  $("#payrollBatchTaskCancel")?.addEventListener("click", () => task.cancel(), { signal: controller.signal });
  $("#payrollBatchTaskDownload")?.addEventListener("click", () => { const result = task.getSnapshot().result; if (result) { if (downloadUrl) URL.revokeObjectURL(downloadUrl); downloadUrl = downloadBatchArtifact(result); } }, { signal: controller.signal });
  $("#payrollBatchTaskRetry")?.addEventListener("click", () => { const result = task.getSnapshot().result; if (!currentInput || !result) return; const ids = result.failures.map((item) => item.employeeId); currentInput = buildBatchExportInput(bridge.getSnapshot(), { ...currentInput.options, scope: "selected" }, ids); void task.retry(currentInput); }, { signal: controller.signal });
  $("#payrollBatchTaskClose")?.addEventListener("click", () => { if (taskPanel) taskPanel.hidden = true; }, { signal: controller.signal });
  const unsubscribe = task.subscribe(renderTask);
  window.addEventListener("beforeunload", beforeUnload);

  return { destroy() { controller.abort(); unsubscribe(); task.destroy(); window.removeEventListener("beforeunload", beforeUnload); if (downloadUrl) URL.revokeObjectURL(downloadUrl); } };
}

