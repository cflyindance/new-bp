import { PitApiError } from "./pit-api-error";
import { pitApi, type PitApi } from "./pit-api";
import { getPitCsrfToken } from "./pit-session";
import type { PitDictionaryItem, PitDictionaryType, PitImportDecisionsInput, PitImportDetail, PitImportIssue, PitImportJob, PitImportRowAction, PitRequirementStatus, PitUser } from "./pit-types";
import { escapePitFileText as esc, formatPitDate, pitFileErrorMessage } from "./pit-file-workflow-ui";

export const PIT_IMPORT_ACCEPT = ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const PIT_IMPORT_MAX_BYTES = 20 * 1024 * 1024;

export function validatePitImportFile(file: Pick<File, "name" | "size">): string | null {
  if (!/\.xlsx$/i.test(file.name)) return "仅支持 .xlsx 工作簿";
  if (file.size <= 0) return "工作簿为空";
  if (file.size > PIT_IMPORT_MAX_BYTES) return "工作簿不能超过 20 MiB";
  return null;
}

export function mergePitImportDecisions(current: PitImportDecisionsInput, patch: PitImportDecisionsInput): PitImportDecisionsInput {
  const merge = <T>(left: T[] = [], right: T[] = [], key: (value: T) => string): T[] => {
    const values = new Map(left.map((value) => [key(value), value]));
    right.forEach((value) => values.set(key(value), value));
    return [...values.values()];
  };
  return {
    rows: merge(current.rows, patch.rows, (item) => item.rowId),
    duplicateGroups: merge(current.duplicateGroups, patch.duplicateGroups, (item) => item.jiraTicket),
    statusMappings: merge(current.statusMappings, patch.statusMappings, (item) => item.source),
    dictionaryMappings: merge(current.dictionaryMappings, patch.dictionaryMappings, (item) => `${item.type}\0${item.source}`),
    highlights: merge(current.highlights, patch.highlights, (item) => String(item.rowNumber)),
  };
}

export function isPitInitialImportLocked(items: PitImportJob[]): boolean {
  return items.some((item) => item.status === "committed" || Boolean(item.committedAt));
}

export function orderedPitDuplicateRows(rowIds: string[], saved?: string[]): string[] {
  return saved?.length === rowIds.length && new Set(saved).size === rowIds.length && saved.every((id) => rowIds.includes(id)) ? [...saved] : [...rowIds];
}

export function movePitPriority(ids: string[], id: string, direction: -1 | 1): string[] {
  const next = [...ids]; const index = next.indexOf(id); const target = index + direction;
  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]]; return next;
}

type UploadOptions = { signal?: AbortSignal; onProgress?: (percent: number) => void };
export function uploadPitImport(file: File, options: UploadOptions = {}): Promise<{ job: PitImportJob }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    xhr.open("POST", "/api/v1/pit/imports/preview");
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    xhr.setRequestHeader("X-PIT-File-Name", encodeURIComponent(file.name));
    const csrf = getPitCsrfToken();
    if (csrf) xhr.setRequestHeader("X-CSRF-Token", csrf);
    xhr.upload.onprogress = (event) => options.onProgress?.(event.lengthComputable ? Math.round(event.loaded / event.total * 100) : 0);
    xhr.onerror = () => reject(new PitApiError(0, { code: "network_unavailable", message: "无法连接 PIT 服务，请检查服务是否启动。" }));
    xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300) reject(new PitApiError(xhr.status, payload.error ?? { code: "request_failed", message: "导入预检失败" }));
        else resolve(payload.data);
      } catch { reject(new PitApiError(xhr.status, { code: "invalid_response", message: "PIT 服务返回了无效响应" })); }
    };
    xhr.send(file);
  });
}

type ImportReadApi = Pick<PitApi, "getImport">;
const PIT_IMPORT_WORKSET_MAX_ROWS = 250_000;
export async function loadPitImportDecisionWorkset(api: ImportReadApi, id: string, signal?: AbortSignal, onProgress?: (loaded: number, total: number) => void): Promise<PitImportDetail> {
  const first = await api.getImport(id, { page: 1, pageSize: 100 }, { signal });
  if (!Number.isSafeInteger(first.total) || first.total < 0 || first.total > PIT_IMPORT_WORKSET_MAX_ROWS
    || !Number.isSafeInteger(first.pageSize) || first.pageSize < 1 || first.pageSize > 100
    || first.page !== 1 || first.rows.length > first.pageSize || first.rows.length > first.total) {
    throw new Error("导入分页响应超出安全范围");
  }
  const rows = [...first.rows];
  onProgress?.(rows.length, first.total);
  const pageCount = Math.ceil(first.total / first.pageSize);
  for (let page = 2; page <= pageCount; page += 1) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const next = await api.getImport(id, { page, pageSize: first.pageSize }, { signal });
    if (next.job.id !== first.job.id || next.total !== first.total || next.page !== page || next.pageSize !== first.pageSize || next.rows.length > first.pageSize || rows.length + next.rows.length > first.total) throw new Error("导入批次在加载期间发生变化，请重新打开");
    rows.push(...next.rows);
    onProgress?.(rows.length, first.total);
  }
  if (rows.length !== first.total) throw new Error("导入分页响应行数不完整");
  const globalIssues = first.issues.filter((issue) => !("rowId" in issue) && !("rowNumber" in issue));
  return { ...first, rows, page: 1, pageSize: rows.length || first.pageSize, issues: [...globalIssues, ...rows.flatMap((row) => row.issues)] };
}

export function createPitSingleFlight<T extends unknown[], R>(operation: (...args: T) => Promise<R>): (...args: T) => Promise<R | undefined> {
  let current: Promise<R> | null = null;
  return (...args: T) => {
    if (current) return Promise.resolve(undefined);
    current = operation(...args).finally(() => { current = null; });
    return current;
  };
}

function issueKind(issue: PitImportIssue): string { return issue.severity === "blocking" ? "阻断" : "提醒"; }
function options(values: readonly string[], selected = ""): string { return values.map((value) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(value)}</option>`).join(""); }
const STATUSES: PitRequirementStatus[] = ["review_pending", "design_pending", "scheduling_pending", "development", "testing", "completed", "paused", "rejected"];

export function renderPitImportPage(state: { user: PitUser; items?: PitImportJob[]; detail?: PitImportDetail | null; dictionaries?: PitDictionaryItem[]; busy?: string; progress?: number; worksetLoaded?: number; worksetTotal?: number; error?: string; issueFilter?: string; confirming?: boolean }): string {
  const items = state.items ?? [];
  const locked = isPitInitialImportLocked(items);
  const detail = locked ? null : state.detail;
  const historyJob = locked ? items.find((item) => item.status === "committed" || item.committedAt) : null;
  const blockers = detail?.job.summary.blockingIssueCount ?? 0;
  const historyDetail = historyJob ? `<div data-pit-import-history-detail class="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h3 class="font-semibold">已提交决策 · ${esc(historyJob.fileName)}</h3><dl class="mt-4 grid gap-3 text-sm">
    ${(historyJob.decisions.rows ?? []).map((item) => `<div><dt class="text-slate-500">行 ${esc(item.rowId)}</dt><dd>${esc(item.action)}${item.mergeTargetRowId ? ` → ${esc(item.mergeTargetRowId)}` : ""}${item.existingRequirementId ? ` → 已有需求 ${esc(item.existingRequirementId)}` : ""}${item.fieldPriority?.length ? ` · 优先顺序 ${item.fieldPriority.map(esc).join(" → ")}` : ""}${item.fieldStrategy ? ` · 字段策略 ${esc(JSON.stringify(item.fieldStrategy))}` : ""}</dd></div>`).join("")}
    ${(historyJob.decisions.duplicateGroups ?? []).map((item) => `<div><dt class="text-slate-500">重复组 ${esc(item.jiraTicket)}</dt><dd>${esc(item.action)}${item.targetRowId ? ` · 主记录 ${esc(item.targetRowId)}` : ""}${item.fieldPriority?.length ? ` · 字段优先顺序 ${item.fieldPriority.map(esc).join(" → ")}` : ""}</dd></div>`).join("")}
    ${(historyJob.decisions.statusMappings ?? []).map((item) => `<div><dt class="text-slate-500">状态 ${esc(item.source)}</dt><dd>映射为 ${esc(item.status)}</dd></div>`).join("")}
    ${(historyJob.decisions.dictionaryMappings ?? []).map((item) => `<div><dt class="text-slate-500">字典 ${esc(item.type)} / ${esc(item.source)}</dt><dd>${esc(item.action)}${item.dictionaryId ? ` → ${esc(item.dictionaryId)}` : ""}${item.label ? ` · ${esc(item.label)}` : ""}</dd></div>`).join("")}
    ${(historyJob.decisions.highlights ?? []).map((item) => `<div><dt class="text-slate-500">高亮第 ${item.rowNumber} 行</dt><dd>${esc(item.action)}${item.targetRowId ? ` → ${esc(item.targetRowId)}` : ""}</dd></div>`).join("")}
  </dl></div>` : "";
  return `<section data-pit-import-page data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8"><div data-pit-import-workspace ${state.confirming ? "inert aria-hidden=\"true\"" : ""}>
    <div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-mono text-[11px] uppercase tracking-[.22em] text-amber-700">One-time migration gate</p><h2 class="mt-2 text-2xl font-semibold tracking-tight">首次导入</h2><p class="mt-2 text-sm text-slate-500">选择 → 预检 → 决策 → 确认提交。所有阻断项必须先持久化处理。</p></div><span class="rounded-full border px-3 py-1 text-xs ${locked ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}">${locked ? "首次导入已完成" : "导入窗口开放"}</span></div>
    ${state.error ? `<div role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">${esc(state.error)}</div>` : ""}
    ${state.busy === "load-workset" ? `<div role="status" class="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">正在顺序读取决策工作集：${state.worksetLoaded ?? 0} / ${state.worksetTotal ?? "…"} 行</div>` : ""}
    ${locked ? `<div data-pit-import-locked class="mt-6 rounded-2xl border border-emerald-200 bg-white p-6"><h3 class="font-semibold text-emerald-900">首次导入已完成</h3><p class="mt-2 text-sm text-slate-500">导入入口已永久锁定。以下记录保留原始映射与决策，供审计追溯。</p></div>` : `<div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><label class="block text-sm font-semibold">历史需求工作簿（.xlsx，最大 20 MiB）</label><input data-pit-import-file type="file" accept="${PIT_IMPORT_ACCEPT}" class="mt-3 block w-full rounded-xl border border-slate-200 p-3 text-sm" ${state.busy ? "disabled" : ""}/><button data-pit-import-upload type="button" class="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-amber-300 disabled:opacity-40" disabled>开始预检</button>${state.busy === "upload" ? `<div class="mt-4"><div class="h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full bg-amber-500" style="width:${Math.max(0, Math.min(100, state.progress ?? 0))}%"></div></div><p class="mt-2 text-xs text-slate-500">上传 ${state.progress ?? 0}% · 服务端正在安全解析，不执行公式</p></div>` : ""}</div>`}
    ${detail ? `<div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">${[["来源行", detail.job.summary.totalRows], ["可导入", detail.job.summary.importableRows], ["重复组", detail.job.summary.duplicateGroupCount], ["未知状态", detail.job.summary.unknownStatusCount], ["未处理阻断", blockers]].map(([label,value]) => `<div class="rounded-2xl border border-slate-200 bg-white p-4"><p class="text-xs text-slate-500">${label}</p><p class="mt-2 font-mono text-2xl font-semibold">${value}</p></div>`).join("")}</div>
      <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><div class="flex flex-wrap items-center justify-between gap-3"><h3 class="font-semibold">问题与决策</h3><select data-pit-issue-filter class="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="all">全部问题</option><option value="blocking" ${state.issueFilter === "blocking" ? "selected" : ""}>仅阻断</option><option value="warning" ${state.issueFilter === "warning" ? "selected" : ""}>仅提醒</option></select></div>
      <div class="mt-4 space-y-3">${detail.issues.filter((issue) => !state.issueFilter || state.issueFilter === "all" || issue.severity === state.issueFilter).map((issue) => `<div class="rounded-xl border border-slate-200 p-3 text-sm"><span class="mr-2 rounded px-2 py-1 text-[10px] font-bold ${issue.severity === "blocking" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}">${issueKind(issue)}</span>${esc(issue.message ?? issue.code)} ${issue.sourceValue ? `<code>${esc(issue.sourceValue)}</code>` : ""}</div>`).join("") || `<p class="text-sm text-slate-400">当前筛选下没有问题</p>`}</div>
      ${detail.duplicateGroups.map((group) => { const saved = detail.job.decisions.duplicateGroups?.find((item) => item.jiraTicket === group.jiraTicket); const order = orderedPitDuplicateRows(group.rowIds, saved?.fieldPriority); return `<div class="mt-4 rounded-xl bg-slate-50 p-4"><div class="grid gap-3 sm:grid-cols-[1fr_10rem_12rem_auto]"><div><p class="text-xs text-slate-500">重复 Jira</p><p class="font-mono text-sm">${esc(group.jiraTicket)}</p></div><select data-pit-duplicate="${esc(group.jiraTicket)}" class="rounded-lg border p-2 text-sm">${options(["", "keep_separate", "merge", "skip"], saved?.action)}</select><select data-pit-duplicate-target="${esc(group.jiraTicket)}" class="rounded-lg border p-2 text-sm"><option value="">合并主记录</option>${group.rowIds.map((id) => `<option value="${esc(id)}" ${id === saved?.targetRowId ? "selected" : ""}>${esc(id)}</option>`).join("")}</select><button data-pit-save-duplicate="${esc(group.jiraTicket)}" class="rounded-lg border px-3 text-sm">保存决策</button></div><fieldset class="mt-3" data-pit-priority-list="${esc(group.jiraTicket)}"><legend class="text-xs text-slate-500">字段优先顺序（前者优先，必须包含全部来源行）</legend>${order.map((id, index) => `<div data-pit-priority-row="${esc(id)}" class="mt-2 flex items-center gap-2 rounded-lg border bg-white p-2"><span class="w-6 font-mono text-xs">${index + 1}</span><code class="flex-1 text-xs">${esc(id)}</code><button type="button" data-pit-priority-move="up" aria-label="上移 ${esc(id)}" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-pit-priority-move="down" aria-label="下移 ${esc(id)}" ${index === order.length - 1 ? "disabled" : ""}>↓</button></div>`).join("")}</fieldset></div>`; }).join("")}
      ${[...new Map(detail.issues.filter((i) => i.code === "unknown_status" && i.sourceValue).map((i) => [i.sourceValue!, i])).keys()].map((source) => `<div class="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_12rem_auto]"><span>未知状态：${esc(source)}</span><select data-pit-status-source="${esc(source)}" class="rounded-lg border p-2 text-sm">${options(["", ...STATUSES], detail.job.decisions.statusMappings?.find((item) => item.source === source)?.status)}</select><button data-pit-save-status="${esc(source)}" class="rounded-lg border px-3 text-sm">保存映射</button></div>`).join("")}
      ${[...new Map(detail.issues.filter((i) => i.code === "unknown_dictionary" && i.sourceValue && i.dictionaryType).map((i) => [`${i.dictionaryType}\0${i.sourceValue}`, i])).values()].map((issue) => { const saved = detail.job.decisions.dictionaryMappings?.find((item) => item.type === issue.dictionaryType && item.source === issue.sourceValue); return `<div class="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_10rem_12rem_auto]"><span>${esc(issue.dictionaryType)}：${esc(issue.sourceValue)}</span><select data-pit-dictionary-source="${esc(issue.sourceValue)}" data-pit-dictionary-type="${esc(issue.dictionaryType)}" class="rounded-lg border p-2 text-sm">${options(["", "create", "clear", "map"], saved?.action)}</select><select data-pit-dictionary-target class="rounded-lg border p-2 text-sm"><option value="">选择已有字典值</option>${(state.dictionaries ?? []).filter((item) => item.type === issue.dictionaryType && item.active).map((item) => `<option value="${esc(item.id)}" ${item.id === saved?.dictionaryId ? "selected" : ""}>${esc(item.label)}</option>`).join("")}</select><button data-pit-save-dictionary class="rounded-lg border px-3 text-sm">保存映射</button></div>`; }).join("")}
      ${detail.rows.filter((row) => row.issues.some((issue) => issue.severity === "blocking" && !["unknown_status", "unknown_dictionary"].includes(issue.code))).map((row) => `<div class="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_12rem_auto]"><span>${esc(row.sheetName)} · 第 ${row.rowNumber} 行 · ${esc(row.normalized.title ?? "无标题")}</span><select data-pit-row-action="${esc(row.id)}" class="rounded-lg border p-2 text-sm">${options(["", "keep_separate", "skip"], detail.job.decisions.rows?.find((item) => item.rowId === row.id)?.action)}</select><button data-pit-save-row="${esc(row.id)}" class="rounded-lg border px-3 text-sm">保存行决策</button></div>`).join("")}
      ${detail.highlights.filter((highlight) => highlight.issues.some((issue) => issue.severity === "blocking")).map((highlight) => { const saved = detail.job.decisions.highlights?.find((item) => item.rowNumber === highlight.rowNumber); return `<div class="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_10rem_12rem_auto]"><span>高亮清单第 ${highlight.rowNumber} 行 · ${esc(highlight.match)}</span><select data-pit-highlight-action="${highlight.rowNumber}" class="rounded-lg border p-2 text-sm">${options(["", "skip", "match"], saved?.action)}</select><select data-pit-highlight-target="${highlight.rowNumber}" class="rounded-lg border p-2 text-sm"><option value="">选择目标行</option>${[...new Set([...highlight.matchedRowIds, ...detail.rows.map((row) => row.id)])].map((id) => `<option value="${esc(id)}" ${id === saved?.targetRowId ? "selected" : ""}>${esc(id)}</option>`).join("")}</select><button data-pit-save-highlight="${highlight.rowNumber}" class="rounded-lg border px-3 text-sm">保存高亮决策</button></div>`; }).join("")}
      <div class="mt-5 flex items-center justify-between border-t pt-5"><p class="text-sm ${blockers ? "text-red-700" : "text-emerald-700"}">${blockers ? `仍有 ${blockers} 个阻断项` : "所有阻断项已处理"}</p><button data-pit-import-commit type="button" ${blockers || locked || state.busy ? "disabled" : ""} class="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">确认提交导入</button></div></div>` : ""}
    <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><h3 class="font-semibold">导入历史</h3><div class="mt-4 overflow-x-auto"><table class="w-full text-left text-sm"><thead class="text-xs text-slate-500"><tr><th class="py-2">文件</th><th>状态</th><th>创建时间</th><th>提交时间</th><th>决策</th></tr></thead><tbody>${items.map((item) => `<tr class="border-t"><td class="py-3">${esc(item.fileName)}</td><td>${esc(item.status)}</td><td>${formatPitDate(item.createdAt)}</td><td>${formatPitDate(item.committedAt)}</td><td><button data-pit-open-import="${esc(item.id)}" class="text-amber-700 underline">查看映射</button></td></tr>`).join("") || `<tr><td colspan="5" class="py-8 text-center text-slate-400">暂无导入记录</td></tr>`}</tbody></table></div></div>${historyDetail}</div>
    ${state.confirming && detail ? `<div data-pit-import-confirm-dialog role="dialog" aria-modal="true" aria-labelledby="pit-import-confirm-title" class="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4"><div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><p class="font-mono text-[10px] uppercase tracking-[.2em] text-red-700">Irreversible gate</p><h3 id="pit-import-confirm-title" class="mt-2 text-xl font-semibold">确认提交首次导入？</h3><p class="mt-3 text-sm leading-6 text-slate-600">将导入 ${detail.job.summary.importableRows} 条需求并创建导入前备份。成功后上传与提交入口永久锁定。</p><div class="mt-6 flex justify-end gap-3"><button data-pit-import-cancel-confirm class="rounded-xl border px-4 py-2 text-sm">取消</button><button data-pit-import-confirm class="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">确认并锁定</button></div></div></div>` : ""}
  </section>`;
}

export function bindPitImportPage(root: HTMLElement, user: PitUser, api: PitApi = pitApi): () => void {
  if (user.role !== "admin") return () => undefined;
  const controller = new AbortController(); let active = true; let generation = 0; let items: PitImportJob[] = []; let detail: PitImportDetail | null = null; let dictionaries: PitDictionaryItem[] = []; let file: File | null = null; let busy = ""; let progress = 0; let worksetLoaded = 0; let worksetTotal = 0; let error = ""; let issueFilter = "all"; let confirming = false;
  const outlet = root.querySelector<HTMLElement>("[data-pit-import-page]")?.parentElement; if (!outlet) return () => controller.abort();
  const draw = () => { if (!active || !outlet.isConnected) return; outlet.innerHTML = renderPitImportPage({ user, items, detail, dictionaries, busy, progress, worksetLoaded, worksetTotal, error, issueFilter, confirming }); wire(); };
  const load = async () => { const requestGeneration = ++generation; try { const [history, dictionaryResult] = await Promise.all([api.listImports({ signal: controller.signal }), api.listDictionaries({ includeInactive: true }, { signal: controller.signal })]); if (!active || requestGeneration !== generation) return; items = history.items; dictionaries = dictionaryResult.items; draw(); } catch (e) { if (!active || requestGeneration !== generation || (e instanceof Error && e.name === "AbortError")) return; error = pitFileErrorMessage(e, "导入历史加载失败"); draw(); } };
  const readWorkset = (id: string, requestGeneration: number) => loadPitImportDecisionWorkset(api, id, controller.signal, (loaded, total) => { if (active && requestGeneration === generation) { worksetLoaded = loaded; worksetTotal = total; busy = "load-workset"; draw(); } });
  const open = async (id: string) => { if (isPitInitialImportLocked(items)) return; const requestGeneration = ++generation; worksetLoaded = 0; worksetTotal = 0; busy = "load-workset"; draw(); try { const result = await readWorkset(id, requestGeneration); if (!active || requestGeneration !== generation) return; detail = result; error = ""; } catch (e) { if (requestGeneration === generation && !(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "预检详情加载失败"); } finally { if (requestGeneration === generation) { busy = ""; draw(); } } };
  const save = async (patch: PitImportDecisionsInput) => { if (!detail) return; const requestGeneration = ++generation; const id = detail.job.id; busy = "save"; draw(); try { const decisions = mergePitImportDecisions(detail.job.decisions, patch); await api.saveImportDecisions(id, decisions, { signal: controller.signal }); const result = await readWorkset(id, requestGeneration); if (!active || requestGeneration !== generation) return; detail = result; error = ""; } catch (e) { if (requestGeneration !== generation || (e instanceof Error && e.name === "AbortError")) return; if (e instanceof PitApiError && e.status === 409 && e.code === "initial_import_completed") { detail = null; await load(); return; } error = pitFileErrorMessage(e, "决策保存失败"); } finally { if (requestGeneration === generation) { busy = ""; draw(); } } };
  const runExclusive = createPitSingleFlight(async (operation: () => Promise<void>) => operation());
  const wire = () => {
    const decisionControls = outlet.querySelectorAll<HTMLButtonElement | HTMLSelectElement>("[data-pit-import-upload], [data-pit-open-import], [data-pit-import-confirm], [data-pit-save-duplicate], [data-pit-save-status], [data-pit-save-dictionary], [data-pit-save-row], [data-pit-save-highlight], [data-pit-priority-move], [data-pit-duplicate], [data-pit-duplicate-target], [data-pit-status-source], [data-pit-dictionary-source], [data-pit-dictionary-target], [data-pit-row-action], [data-pit-highlight-action], [data-pit-highlight-target]");
    if (busy) decisionControls.forEach((control) => { control.disabled = true; control.setAttribute("aria-disabled", "true"); control.setAttribute("aria-busy", "true"); });
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-duplicate], [data-pit-save-status], [data-pit-save-dictionary], [data-pit-save-row], [data-pit-save-highlight]").forEach((button) => button.addEventListener("click", (event) => { if (busy) { event.preventDefault(); event.stopImmediatePropagation(); } }, { capture: true }));
    const input = outlet.querySelector<HTMLInputElement>("[data-pit-import-file]"); const upload = outlet.querySelector<HTMLButtonElement>("[data-pit-import-upload]");
    input?.addEventListener("change", () => { file = input.files?.[0] ?? null; error = file ? validatePitImportFile(file) ?? "" : ""; if (upload) upload.disabled = !file || Boolean(error); });
    upload?.addEventListener("click", () => { void runExclusive(async () => { if (!file) return; const validation = validatePitImportFile(file); if (validation) { error = validation; draw(); return; } const requestGeneration = ++generation; busy = "upload"; progress = 0; draw(); try { const result = await uploadPitImport(file, { signal: controller.signal, onProgress: (value) => { if (requestGeneration === generation) { progress = value; draw(); } } }); const history = await api.listImports({ signal: controller.signal }); const resultDetail = await readWorkset(result.job.id, requestGeneration); if (!active || requestGeneration !== generation) return; items = history.items; detail = resultDetail; error = ""; } catch (e) { if (requestGeneration !== generation || (e instanceof Error && e.name === "AbortError")) return; if (e instanceof PitApiError && e.status === 409 && e.code === "initial_import_completed") { detail = null; await load(); } else error = pitFileErrorMessage(e, "导入预检失败"); } finally { if (requestGeneration === generation) { busy = ""; draw(); } } }); });
    outlet.querySelector<HTMLSelectElement>("[data-pit-issue-filter]")?.addEventListener("change", (event) => { issueFilter = (event.currentTarget as HTMLSelectElement).value; draw(); });
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-open-import]").forEach((button) => button.addEventListener("click", () => { void runExclusive(() => open(button.dataset.pitOpenImport!)); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-priority-move]").forEach((button) => button.addEventListener("click", () => { const row = button.closest<HTMLElement>("[data-pit-priority-row]"); if (!row) return; if (button.dataset.pitPriorityMove === "up") row.previousElementSibling?.before(row); else row.nextElementSibling?.after(row); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-duplicate]").forEach((button) => button.addEventListener("click", () => { const jiraTicket = button.dataset.pitSaveDuplicate!; const select = outlet.querySelector<HTMLSelectElement>(`[data-pit-duplicate="${CSS.escape(jiraTicket)}"]`); const target = outlet.querySelector<HTMLSelectElement>(`[data-pit-duplicate-target="${CSS.escape(jiraTicket)}"]`); const fieldPriority = [...(outlet.querySelector(`[data-pit-priority-list="${CSS.escape(jiraTicket)}"]`)?.querySelectorAll<HTMLElement>("[data-pit-priority-row]") ?? [])].map((row) => row.dataset.pitPriorityRow!); if (select?.value && (select.value !== "merge" || target?.value)) void runExclusive(() => save({ duplicateGroups: [{ jiraTicket, action: select.value as PitImportRowAction, ...(select.value === "merge" ? { targetRowId: target!.value, fieldPriority } : {}) }] })); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-status]").forEach((button) => button.addEventListener("click", () => { const source = button.dataset.pitSaveStatus!; const select = outlet.querySelector<HTMLSelectElement>(`[data-pit-status-source="${CSS.escape(source)}"]`); if (select?.value) void runExclusive(() => save({ statusMappings: [{ source, status: select.value as PitRequirementStatus }] })); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-dictionary]").forEach((button) => button.addEventListener("click", () => { const select = button.parentElement?.querySelector<HTMLSelectElement>("[data-pit-dictionary-source]"); const target = button.parentElement?.querySelector<HTMLSelectElement>("[data-pit-dictionary-target]"); if (select?.value && (select.value !== "map" || target?.value)) void runExclusive(() => save({ dictionaryMappings: [{ type: select.dataset.pitDictionaryType as PitDictionaryType, source: select.dataset.pitDictionarySource!, action: select.value as "create" | "clear" | "map", ...(select.value === "map" ? { dictionaryId: target!.value } : {}) }] })); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-row]").forEach((button) => button.addEventListener("click", () => { const rowId = button.dataset.pitSaveRow!; const select = outlet.querySelector<HTMLSelectElement>(`[data-pit-row-action="${CSS.escape(rowId)}"]`); if (select?.value) void runExclusive(() => save({ rows: [{ rowId, action: select.value as PitImportRowAction }] })); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-save-highlight]").forEach((button) => button.addEventListener("click", () => { const rowNumber = Number(button.dataset.pitSaveHighlight); const action = outlet.querySelector<HTMLSelectElement>(`[data-pit-highlight-action="${rowNumber}"]`); const target = outlet.querySelector<HTMLSelectElement>(`[data-pit-highlight-target="${rowNumber}"]`); if (action?.value && (action.value !== "match" || target?.value)) void runExclusive(() => save({ highlights: [{ rowNumber, action: action.value as "match" | "skip", ...(action.value === "match" ? { targetRowId: target!.value } : {}) }] })); }));
    outlet.querySelector<HTMLButtonElement>("[data-pit-import-commit]")?.addEventListener("click", () => { if (!detail || detail.job.summary.blockingIssueCount) return; confirming = true; draw(); });
    const dialog = outlet.querySelector<HTMLElement>("[data-pit-import-confirm-dialog]"); if (dialog) { const focusables = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled])")]; queueMicrotask(() => focusables.at(-1)?.focus()); dialog.addEventListener("keydown", (event) => { if (event.key === "Escape") { event.preventDefault(); confirming = false; draw(); queueMicrotask(() => outlet.querySelector<HTMLButtonElement>("[data-pit-import-commit]")?.focus()); return; } if (event.key !== "Tab" || !focusables.length) return; const first = focusables[0]; const last = focusables.at(-1)!; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }); }
    outlet.querySelector<HTMLButtonElement>("[data-pit-import-cancel-confirm]")?.addEventListener("click", () => { confirming = false; draw(); queueMicrotask(() => outlet.querySelector<HTMLButtonElement>("[data-pit-import-commit]")?.focus()); });
    outlet.querySelector<HTMLButtonElement>("[data-pit-import-confirm]")?.addEventListener("click", () => { void runExclusive(async () => { if (!detail || busy) return; const requestGeneration = ++generation; const id = detail.job.id; confirming = false; busy = "commit"; draw(); try { await api.commitImport(id, { signal: controller.signal }); const history = await api.listImports({ signal: controller.signal }); if (!active || requestGeneration !== generation) return; items = history.items; detail = null; error = ""; } catch (e) { if (requestGeneration !== generation || (e instanceof Error && e.name === "AbortError")) return; if (e instanceof PitApiError && e.status === 409 && e.code === "initial_import_completed") { detail = null; await load(); } else error = pitFileErrorMessage(e, "提交导入失败"); } finally { if (requestGeneration === generation) { busy = ""; draw(); } } }); });
  };
  draw(); void runExclusive(load); return () => { active = false; controller.abort(); };
}
