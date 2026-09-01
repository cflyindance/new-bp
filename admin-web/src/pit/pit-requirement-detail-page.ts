import { isPitApiError } from "./pit-api-error";
import { pitApi, type PitApi } from "./pit-api";
import { calculatePitConflictDiff, renderPitConflictDialog } from "./pit-conflict-dialog";
import {
  emptyPitRequirementForm, formToCreateOrPatchBody, getPitRequirementActions, requirementToForm,
  validatePitRequirementForm, type PitRequirementForm,
} from "./pit-requirement-form";
import type { PitDictionaryItem, PitRequirement, PitUser } from "./pit-types";
import { createPitPageLifetime, escapePitHtml, formatPitDate, pitPriorityLabel, pitStatusLabel, renderPitBanner, renderPitStatusBadge, showPitToast } from "./pit-ui";
import { confirmPitDiscard, setPitDirtyNavigation } from "./pit-navigation-guard";

type AssignableUser = Pick<PitUser, "id" | "username" | "displayName">;
type PageData = { requirement?: PitRequirement; dictionaries: PitDictionaryItem[]; users: AssignableUser[]; user: PitUser; deletedOnly?: boolean };
type DetailApi = Pick<PitApi, "createRequirement" | "getRequirement" | "updateRequirement" | "transitionRequirement" | "deleteRequirement" | "restoreRequirement" | "listDictionaries" | "listAssignableUsers">;

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const SOURCE_TRACE: Array<[keyof PitRequirement | "developers" | "testers", string]> = [
  ["jiraTicket", "Jira Ticket"], ["title", "产品需求名称"], ["description", "需求描述"], ["useCase", "使用场景"],
  ["notes", "补充说明"], ["source", "需求来源"], ["requirementType", "需求类别"], ["industry", "业态"],
  ["customerManager", "客户经理"], ["sourceStatus", "原始状态"], ["productLines", "产品线"], ["implementationSide", "前后端"],
  ["developers", "研发"], ["testers", "测试"], ["priority", "优先级"], ["problemCategory", "问题分类"], ["mids", "MID"],
  ["proposedAt", "提出时间"], ["versionNo", "版本号"], ["developmentStartedAt", "研发开始"],
  ["developmentCompletedAt", "研发完成"], ["posMergeVersion", "合入 POS"],
];

function label(text: string, name: string, control: string, wide = false): string {
  return `<label class="${wide ? "md:col-span-2" : ""} text-xs font-bold text-slate-600 dark:text-slate-300">${escapePitHtml(text)}${control.replace("$NAME", escapePitHtml(name))}<span data-pit-field-error="${escapePitHtml(name)}" class="mt-1 hidden text-xs font-medium text-rose-600"></span></label>`;
}
function options(items: PitDictionaryItem[], type: PitDictionaryItem["type"], selected = ""): string {
  return `<option value="">未设置</option>${items.filter((item) => item.type === type && item.active).map((item) => `<option value="${escapePitHtml(item.id)}" ${item.id === selected ? "selected" : ""}>${escapePitHtml(item.label)}</option>`).join("")}`;
}
function assigneeOptionValue(userId: string | null | undefined, displayName: string): string { return userId ? `user:${userId}` : `legacy:${encodeURIComponent(displayName)}`; }
function assigneeOptions(form: PitRequirementForm, data: PageData, role: "owner" | "developer" | "tester"): string {
  const assigned = form.assignees.filter((item) => item.role === role);
  const selected = new Set(assigned.map((item) => assigneeOptionValue(item.userId, item.displayName)));
  const active = data.users.map((item) => ({ value: `user:${item.id}`, label: `${item.displayName} (${item.username})` }));
  const historical = assigned.filter((item) => !item.userId || !data.users.some((user) => user.id === item.userId)).map((item) => ({ value: assigneeOptionValue(item.userId, item.displayName), label: `${item.displayName}（历史分配）` }));
  return [...active, ...historical.filter((item, index, all) => all.findIndex((other) => other.value === item.value) === index)].map((item) => `<option value="${escapePitHtml(item.value)}" ${selected.has(item.value) ? "selected" : ""}>${escapePitHtml(item.label)}</option>`).join("");
}

export function renderPitRequirementForm(form: PitRequirementForm, data: PageData, mode: "create" | "edit"): string {
  const d = data.dictionaries;
  const productIds = new Set(form.productLineIds);
  return `<form data-pit-requirement-form data-pit-form-mode="${mode}" class="space-y-7" novalidate>
    <div class="grid gap-4 md:grid-cols-2">
      ${label("需求标题 *", "title", `<input class="${inputClass}" name="$NAME" maxlength="500" value="${escapePitHtml(form.title)}">`, true)}
      ${label("需求描述 *", "description", `<textarea class="${inputClass} min-h-32" name="$NAME">${escapePitHtml(form.description)}</textarea>`, true)}
      ${label("使用场景", "useCase", `<textarea class="${inputClass} min-h-24" name="$NAME">${escapePitHtml(form.useCase)}</textarea>`)}
      ${label("补充说明", "notes", `<textarea class="${inputClass} min-h-24" name="$NAME">${escapePitHtml(form.notes)}</textarea>`)}
      ${label("Jira Ticket", "jiraTicket", `<input class="${inputClass}" name="$NAME" value="${escapePitHtml(form.jiraTicket)}">`)}
      ${label("客户经理", "customerManager", `<input class="${inputClass}" name="$NAME" value="${escapePitHtml(form.customerManager)}">`)}
      ${label("优先级", "priority", `<select class="${inputClass}" name="$NAME"><option value="">未设置</option>${[["urgent","紧急"],["high","高"],["medium","中"],["low","低"]].map(([value,text]) => `<option value="${value}" ${form.priority === value ? "selected" : ""}>${text}</option>`).join("")}</select>`)}
      ${label("实现端", "implementationSide", `<select class="${inputClass}" name="$NAME"><option value="">未设置</option><option value="frontend" ${form.implementationSide === "frontend" ? "selected" : ""}>前端</option><option value="backend" ${form.implementationSide === "backend" ? "selected" : ""}>后端</option><option value="both" ${form.implementationSide === "both" ? "selected" : ""}>前后端</option></select>`)}
      ${label("需求来源", "sourceId", `<select class="${inputClass}" name="$NAME">${options(d,"requirement_source",form.sourceId)}</select>`)}
      ${label("需求类别", "requirementTypeId", `<select class="${inputClass}" name="$NAME">${options(d,"requirement_type",form.requirementTypeId)}</select>`)}
      ${label("问题分类", "problemCategoryId", `<select class="${inputClass}" name="$NAME">${options(d,"problem_category",form.problemCategoryId)}</select>`)}
      ${label("业态", "industryId", `<select class="${inputClass}" name="$NAME">${options(d,"industry",form.industryId)}</select>`)}
      <fieldset class="md:col-span-2"><legend class="text-xs font-bold text-slate-600 dark:text-slate-300">产品线</legend><div class="mt-2 flex flex-wrap gap-2">${d.filter((item) => item.type === "product_line" && item.active).map((item) => `<label class="rounded-full border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700"><input class="mr-1.5 accent-amber-500" type="checkbox" name="productLineIds" value="${escapePitHtml(item.id)}" ${productIds.has(item.id) ? "checked" : ""}>${escapePitHtml(item.label)}</label>`).join("") || `<span class="text-xs text-slate-400">暂无可用产品线</span>`}<span data-pit-field-error="productLineIds" class="hidden text-xs text-rose-600"></span></div></fieldset>
      ${label("MID（逗号/换行分隔）", "mids", `<textarea class="${inputClass}" name="$NAME">${escapePitHtml(form.mids.join("\n"))}</textarea>`, true)}
      ${label("负责人（最多一人）", "owner", `<select class="${inputClass}" name="ownerAssignment"><option value="">未分配</option>${assigneeOptions(form,data,"owner")}</select>`)}
      ${label("研发（可多人）", "developers", `<select class="${inputClass} min-h-28" name="developerAssignments" multiple>${assigneeOptions(form,data,"developer")}</select>`)}
      ${label("测试（可多人）", "testers", `<select class="${inputClass} min-h-28" name="testerAssignments" multiple>${assigneeOptions(form,data,"tester")}</select>`)}
      ${label("提出日期（YYYY-MM 或 YYYY-MM-DD）", "proposedAt", `<input class="${inputClass}" name="$NAME" placeholder="2026-09" value="${escapePitHtml(form.proposedAt)}">`)}
      ${label("计划年度", "plannedYear", `<input class="${inputClass}" name="$NAME" inputmode="numeric" value="${escapePitHtml(form.plannedYear)}">`)}
      ${label("计划月份", "plannedMonth", `<input class="${inputClass}" name="$NAME" inputmode="numeric" value="${escapePitHtml(form.plannedMonth)}">`)}
      ${label("版本号", "versionNo", `<input class="${inputClass}" name="$NAME" value="${escapePitHtml(form.versionNo)}">`)}
      ${label("研发开始", "developmentStartedAt", `<input class="${inputClass}" name="$NAME" type="date" value="${escapePitHtml(form.developmentStartedAt ?? "")}">`)}
      ${label("研发完成", "developmentCompletedAt", `<input class="${inputClass}" name="$NAME" type="date" value="${escapePitHtml(form.developmentCompletedAt ?? "")}">`)}
      ${label("POS 合并版本", "posMergeVersion", `<input class="${inputClass}" name="$NAME" value="${escapePitHtml(form.posMergeVersion)}">`)}
      <label class="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-bold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30"><input type="checkbox" name="isHighlighted" class="accent-amber-500" ${form.isHighlighted ? "checked" : ""}>重点需求</label>
    </div>
    <div class="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white/95 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"><button type="button" data-pit-form-cancel class="rounded-xl border px-4 py-2.5 text-sm font-bold">取消</button><button type="submit" class="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950">${mode === "create" ? "创建需求" : "保存修改"}</button></div>
  </form>`;
}

function valueDisplay(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" && item ? ((item as { label?: string; displayName?: string }).label ?? (item as { displayName?: string }).displayName ?? "—") : String(item)).join("、") || "—";
  if (value && typeof value === "object") return (value as { label?: string }).label ?? "—";
  return value === null || value === undefined || value === "" ? "—" : String(value);
}
function eventLabel(action: string): string { return action.replace("requirement.create", "创建需求").replace("requirement.update", "编辑需求").replace("requirement.delete", "移入回收站").replace("requirement.restore", "恢复需求").replace("requirement.transition.", "状态动作："); }

export type PitRequirementDetailMode = "page" | "drawer";
export type PitRequirementDetailContext = { mode: PitRequirementDetailMode; deleted?: "only"; closeHref: string; path: string };
export function pitRequirementDetailContext(path: string, role: PitUser["role"], mode: PitRequirementDetailMode = "page"): PitRequirementDetailContext {
  const queryIndex = path.indexOf("?"); const params = new URLSearchParams(queryIndex >= 0 ? path.slice(queryIndex + 1) : "");
  const trash = params.get("view") === "trash" && role === "admin";
  if (trash) { params.delete("view"); const query=params.toString(); return {mode,deleted:"only",closeHref:`#/pit/trash${query?`?${query}`:""}`,path}; }
  const query=params.toString(); return {mode,closeHref:`#/pit/requirements${query?`?${query}`:""}`,path};
}

export function renderPitRequirementDetailPage(data: PageData, mode: PitRequirementDetailMode = "page"): string {
  const r = data.requirement!;
  const actions = r.deletedAt ? [] : getPitRequirementActions(r.status, data.user.role);
  const assignees = (role: string) => r.assignees.filter((item) => item.role === role).map((item) => item.displayName).join("、") || "—";
  return `<section data-pit-requirement-detail data-pit-detail-mode="${mode}" data-pit-route-page data-pit-requirement-id="${escapePitHtml(r.id)}" class="${mode === "drawer" ? "fixed inset-0 z-[105] bg-slate-950/45 p-0 md:pl-[18rem]" : "mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8"}"><div class="${mode === "drawer" ? "ml-auto h-full w-full max-w-5xl overflow-y-auto bg-slate-50 p-4 shadow-2xl dark:bg-slate-950 sm:p-6" : ""}">${mode === "drawer" ? `<button data-pit-close-detail type="button" class="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">← 返回需求列表</button>` : ""}
    <div data-pit-detail-connection></div><div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-4"><div><div class="flex flex-wrap items-center gap-2">${renderPitStatusBadge(r.status,r.sourceStatus)}<span class="font-mono text-xs text-slate-400">${escapePitHtml(r.requirementNo)}</span>${r.isHighlighted ? `<span class="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">★ 重点</span>` : ""}</div><h2 class="mt-4 text-2xl font-bold tracking-tight">${escapePitHtml(r.title)}</h2><p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">${escapePitHtml(r.description)}</p></div><div class="flex gap-2">${data.user.role !== "viewer" && !r.deletedAt ? `<button data-pit-open-edit class="rounded-xl border px-4 py-2 text-sm font-bold">编辑</button>` : ""}${data.user.role === "admin" ? r.deletedAt ? `<button data-pit-restore class="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">恢复</button>` : `<button data-pit-delete class="rounded-xl border border-rose-300 px-4 py-2 text-sm font-bold text-rose-700">删除</button>` : ""}</div></div>
      ${r.deletedAt ? `<div class="mt-5">${renderPitBanner(`已于 ${formatPitDate(r.deletedAt)} 由 ${r.deletedBy?.displayName ?? "未知用户"}移入回收站。`,"warning")}</div>` : ""}
      <div class="mt-7 grid gap-5 md:grid-cols-2"><div><h3 class="text-xs font-black uppercase tracking-[.16em] text-amber-700">内容补充</h3><dl class="mt-3 space-y-3 text-sm"><div><dt class="text-slate-400">使用场景</dt><dd class="mt-1 whitespace-pre-wrap">${escapePitHtml(r.useCase ?? "—")}</dd></div><div><dt class="text-slate-400">补充说明</dt><dd class="mt-1 whitespace-pre-wrap">${escapePitHtml(r.notes ?? "—")}</dd></div></dl></div><div><h3 class="text-xs font-black uppercase tracking-[.16em] text-amber-700">分类与客户</h3><dl class="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt class="text-slate-400">产品线</dt><dd>${escapePitHtml(valueDisplay(r.productLines))}</dd></div><div><dt class="text-slate-400">优先级</dt><dd>${escapePitHtml(pitPriorityLabel(r.priority))}</dd></div><div><dt class="text-slate-400">来源 / 类别</dt><dd>${escapePitHtml(`${r.source?.label ?? "—"} / ${r.requirementType?.label ?? "—"}`)}</dd></div><div><dt class="text-slate-400">问题 / 业态</dt><dd>${escapePitHtml(`${r.problemCategory?.label ?? "—"} / ${r.industry?.label ?? "—"}`)}</dd></div><div><dt class="text-slate-400">MID</dt><dd>${escapePitHtml(r.mids.join("、") || "—")}</dd></div><div><dt class="text-slate-400">Jira</dt><dd>${escapePitHtml(r.jiraTicket ?? "—")}</dd></div></dl></div></div>
      <div class="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800"><h3 class="text-xs font-black uppercase tracking-[.16em] text-amber-700">执行信息</h3><dl class="mt-4 grid gap-4 text-sm sm:grid-cols-3"><div><dt class="text-slate-400">负责人</dt><dd>${escapePitHtml(assignees("owner"))}</dd></div><div><dt class="text-slate-400">研发</dt><dd>${escapePitHtml(assignees("developer"))}</dd></div><div><dt class="text-slate-400">测试</dt><dd>${escapePitHtml(assignees("tester"))}</dd></div><div><dt class="text-slate-400">实现端</dt><dd>${escapePitHtml(r.implementationSide ?? "—")}</dd></div><div><dt class="text-slate-400">计划</dt><dd>${escapePitHtml([r.plannedYear,r.plannedMonth].filter(Boolean).join("-") || "—")}</dd></div><div><dt class="text-slate-400">版本 / POS 合并</dt><dd>${escapePitHtml(`${r.versionNo ?? "—"} / ${r.posMergeVersion ?? "—"}`)}</dd></div></dl></div>
      <details class="mt-8 rounded-xl border border-slate-200 dark:border-slate-700"><summary class="cursor-pointer px-4 py-3 text-sm font-bold">导入追溯 · 22 个源字段</summary><div class="grid gap-px bg-slate-100 p-px dark:bg-slate-800 sm:grid-cols-2">${SOURCE_TRACE.map(([key,name]) => { const value=key === "developers" ? r.assignees.filter((item)=>item.role==="developer").map((item)=>item.displayName) : key === "testers" ? r.assignees.filter((item)=>item.role==="tester").map((item)=>item.displayName) : r[key]; return `<div class="bg-white p-3 text-xs dark:bg-slate-900"><span class="text-slate-400">${escapePitHtml(name)}</span><p class="mt-1 break-words">${escapePitHtml(valueDisplay(value))}</p></div>`; }).join("")}</div><p class="px-4 py-3 text-xs text-slate-400">原工作表 ${escapePitHtml(r.sourceSheet ?? "—")} · 行 ${escapePitHtml(r.sourceRow ?? "—")} · 导入批次 ${escapePitHtml(r.importJobId ?? "—")}</p></details>
    </article><aside class="space-y-5"><section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h3 class="text-sm font-bold">推进需求</h3><p class="mt-1 text-xs text-slate-400">当前：${escapePitHtml(pitStatusLabel(r.status))}</p><div class="mt-4 grid gap-2">${actions.map((a) => `<button data-pit-transition="${a.action}" data-pit-target-status="${a.targetStatus ?? ""}" data-pit-reason-required="${a.reasonRequired}" class="rounded-xl border px-3 py-2 text-left text-sm font-bold ${a.danger ? "border-rose-300 text-rose-700" : "border-slate-200"}">${escapePitHtml(a.label)}</button>`).join("") || `<p class="text-xs text-slate-400">当前没有可执行的状态动作。</p>`}</div></section><section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h3 class="text-sm font-bold">最近操作</h3><ol class="mt-4 space-y-4">${(r.recentEvents ?? []).map((e) => `<li class="border-l-2 border-amber-300 pl-3 text-xs"><strong>${escapePitHtml(eventLabel(e.action))}</strong><p class="mt-1 text-slate-400">${escapePitHtml(e.actor?.displayName ?? "系统")} · ${escapePitHtml(formatPitDate(e.createdAt))}</p>${e.metadata && typeof e.metadata === "object" && "reason" in e.metadata ? `<p class="mt-1 text-slate-500">原因：${escapePitHtml(String((e.metadata as {reason?:unknown}).reason ?? "—"))}</p>` : ""}</li>`).join("") || `<li class="text-xs text-slate-400">暂无操作记录</li>`}</ol></section></aside></div><div data-pit-detail-overlay></div></div></section>`;
}

export function renderPitRequirementCreatePage(): string {
  return `<section data-pit-requirement-create data-pit-route-page class="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8"><div class="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"><p class="font-mono text-[10px] uppercase tracking-[.2em] text-amber-700">New intake</p><h2 class="mt-2 text-2xl font-bold">新建需求</h2><div data-pit-create-content class="mt-7"><p class="text-sm text-slate-400">正在准备表单…</p></div></div></section>`;
}

function splitNames(value: string): string[] { return [...new Set(value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean))]; }
export function resolvePitAssigneeSelections(values: string[], role: "owner"|"developer"|"tester", prior: PitRequirementForm["assignees"], users: AssignableUser[]): PitRequirementForm["assignees"] {
  const userMap = new Map(users.map((user) => [user.id, user])); const previousMap = new Map(prior.map((item) => [assigneeOptionValue(item.userId,item.displayName),item]));
  return values.map((value) => { if(value.startsWith("user:")){const user=userMap.get(value.slice(5));if(user)return {role,userId:user.id,displayName:user.displayName};}const historical=previousMap.get(value);return historical?{role,userId:historical.userId??null,displayName:historical.displayName}:null; }).filter((item):item is NonNullable<typeof item>=>Boolean(item));
}
function readForm(formElement: HTMLFormElement, prior: PitRequirementForm, users: AssignableUser[]): PitRequirementForm {
  const fd = new FormData(formElement); const text = (name: string) => String(fd.get(name) ?? "").trim();
  const assignees = [...resolvePitAssigneeSelections(fd.getAll("ownerAssignment").map(String).filter(Boolean).slice(0,1),"owner",prior.assignees,users), ...resolvePitAssigneeSelections(fd.getAll("developerAssignments").map(String),"developer",prior.assignees,users), ...resolvePitAssigneeSelections(fd.getAll("testerAssignments").map(String),"tester",prior.assignees,users)];
  return { ...prior, jiraTicket:text("jiraTicket"), title:text("title"), description:text("description"), useCase:text("useCase"), notes:text("notes"), priority:text("priority") as PitRequirementForm["priority"], requirementTypeId:text("requirementTypeId"), sourceId:text("sourceId"), problemCategoryId:text("problemCategoryId"), industryId:text("industryId"), customerManager:text("customerManager"), implementationSide:text("implementationSide") as PitRequirementForm["implementationSide"], proposedAt:text("proposedAt"), plannedYear:text("plannedYear"), plannedMonth:text("plannedMonth"), versionNo:text("versionNo"), developmentStartedAt:text("developmentStartedAt"), developmentCompletedAt:text("developmentCompletedAt"), posMergeVersion:text("posMergeVersion"), isHighlighted:fd.has("isHighlighted"), productLineIds:fd.getAll("productLineIds").map(String), mids:splitNames(text("mids")), assignees };
}
function showErrors(form: HTMLFormElement, errors: ReturnType<typeof validatePitRequirementForm>): void { form.querySelectorAll<HTMLElement>("[data-pit-field-error]").forEach((el) => { const message = errors[el.dataset.pitFieldError as keyof typeof errors]; el.textContent = message ?? ""; el.classList.toggle("hidden", !message); }); }

export function bindPitRequirementPage(
  root: HTMLElement,
  user: PitUser,
  requirementId?: string,
  api: DetailApi = pitApi,
  context: PitRequirementDetailContext = pitRequirementDetailContext(location.hash.slice(1), user.role),
): void {
  const host = root.querySelector<HTMLElement>(requirementId ? "[data-pit-requirement-detail]" : "[data-pit-requirement-create]");
  if (!host || host.dataset.pitBound) return;
  host.dataset.pitBound = "1";
  const lifetime = createPitPageLifetime(host);
  let data: PageData = { user, dictionaries: [], users: [] };
  let requirement: PitRequirement | undefined;
  let dirty = false;
  let editorOpen = false;
  let currentForm = emptyPitRequirementForm();
  let loadController = new AbortController();
  let mutationController: AbortController | null = null;
  let mutationGeneration = 0;
  const isActive = () => !lifetime.signal.aborted && host.isConnected;

  const setDirty = (value: boolean): void => {
    dirty = value;
    setPitDirtyNavigation(value ? { currentHash: location.hash, onDiscard: () => { dirty = false; } } : null);
  };
  const navigate = (href: string): void => { if (confirmPitDiscard()) location.hash = href.slice(1); };
  const closeDetail = (): void => {
    if (!confirmPitDiscard()) return;
    if (context.mode === "drawer") history.back();
    else location.hash = context.closeHref.slice(1);
  };
  const beginMutation = (): { signal: AbortSignal; generation: number } => {
    mutationController?.abort(); mutationController = new AbortController();
    return { signal: mutationController.signal, generation: ++mutationGeneration };
  };
  const mutationIsCurrent = (generation: number) => isActive() && generation === mutationGeneration && !mutationController?.signal.aborted;

  const load = async (): Promise<void> => {
    loadController.abort(); loadController = new AbortController(); const signal = loadController.signal;
    try {
      const [dictResult, userResult, detailResult] = await Promise.all([
        api.listDictionaries({}, { signal }),
        user.role === "viewer" ? Promise.resolve({ items: [] as AssignableUser[] }) : api.listAssignableUsers({ signal }),
        requirementId ? api.getRequirement(requirementId, { ...(context.deleted ? { deleted: context.deleted } : {}), signal }) : Promise.resolve(undefined),
      ]);
      if (!isActive() || signal.aborted) return;
      data = { user, dictionaries: dictResult.items, users: userResult.items, requirement: detailResult?.requirement, deletedOnly: context.deleted === "only" };
      requirement = detailResult?.requirement;
      if (requirementId) {
        host.outerHTML = renderPitRequirementDetailPage(data, context.mode);
        bindPitRequirementPage(root, user, requirementId, api, context);
      } else {
        const content = host.querySelector<HTMLElement>("[data-pit-create-content]");
        if (content) content.innerHTML = renderPitRequirementForm(emptyPitRequirementForm(), data, "create");
      }
    } catch (error) {
      if (signal.aborted || !isActive()) return;
      host.innerHTML = renderPitBanner(isPitApiError(error) ? error.message : "无法读取需求详情。", "danger");
    }
  };

  const closeEditor = (): void => {
    if (!confirmPitDiscard()) return;
    editorOpen = false; setDirty(false); host.querySelector("[data-pit-edit-drawer]")?.remove();
  };

  host.addEventListener("input", (event) => {
    if ((event.target as Element).closest("[data-pit-requirement-form]")) setDirty(true);
  }, { signal: lifetime.signal });

  host.addEventListener("click", (event) => {
    const target = event.target as Element;
    if (target.closest("[data-pit-close-detail]")) { closeDetail(); return; }
    if (target.closest("[data-pit-open-edit]") && requirement) {
      currentForm = requirementToForm(requirement); editorOpen = true; setDirty(false);
      const overlay = host.querySelector<HTMLElement>("[data-pit-detail-overlay]");
      if (overlay) overlay.innerHTML = `<div data-pit-edit-drawer class="fixed inset-0 z-[110] bg-slate-950/40"><aside class="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900"><h2 class="mb-6 text-xl font-bold">编辑需求</h2>${renderPitRequirementForm(currentForm, data, "edit")}</aside></div>`;
      return;
    }
    if (target.closest("[data-pit-form-cancel]")) { editorOpen ? closeEditor() : navigate(context.closeHref); return; }
    if (target.closest("[data-pit-conflict-cancel]")) { host.querySelector("[data-pit-conflict-dialog]")?.remove(); return; }
    if (target.closest("[data-pit-conflict-load]")) { setDirty(false); editorOpen = false; void load(); return; }

    const actionButton = target.closest<HTMLButtonElement>("[data-pit-transition]");
    if (actionButton && requirement) {
      const reasonRequired = actionButton.dataset.pitReasonRequired === "true";
      const reason = reasonRequired ? window.prompt(`执行“${actionButton.textContent?.trim()}”必须填写原因：`)?.trim() : undefined;
      if (reasonRequired && !reason) return;
      const operation = beginMutation(); actionButton.disabled = true;
      const targetStatus = actionButton.dataset.pitTargetStatus || undefined;
      void api.transitionRequirement(requirement.id, { action: actionButton.dataset.pitTransition as never, targetStatus: targetStatus as never, reason, rowVersion: requirement.rowVersion }, { signal: operation.signal }).then(() => {
        if (mutationIsCurrent(operation.generation)) { window.dispatchEvent(new CustomEvent("pit:requirements-changed")); void load(); }
      }).catch((error) => {
        if (!mutationIsCurrent(operation.generation)) return;
        if (isPitApiError(error) && error.status === 409) {
          const current = error.fields?.current as PitRequirement | undefined;
          if (current) { (host.querySelector<HTMLElement>("[data-pit-detail-overlay]") ?? host).insertAdjacentHTML("beforeend", renderPitConflictDialog([{ field: "status", label: "当前状态", submitted: pitStatusLabel(requirement!.status), current: pitStatusLabel(current.status) }])); return; }
        }
        showPitToast(isPitApiError(error) ? error.message : "状态更新失败", "danger");
      });
      return;
    }
    if (target.closest("[data-pit-delete]") && requirement && window.confirm("确定将该需求移入回收站吗？")) {
      const operation = beginMutation(); void api.deleteRequirement(requirement.id, { signal: operation.signal }).then(() => { if (mutationIsCurrent(operation.generation)) { window.dispatchEvent(new CustomEvent("pit:requirements-changed")); closeDetail(); } }).catch((error) => { if (mutationIsCurrent(operation.generation)) showPitToast(isPitApiError(error) ? error.message : "删除失败", "danger"); }); return;
    }
    if (target.closest("[data-pit-restore]") && requirement && window.confirm("确定恢复该需求吗？")) {
      const operation = beginMutation(); void api.restoreRequirement(requirement.id, { signal: operation.signal }).then((result) => { if (mutationIsCurrent(operation.generation)) location.hash = `#/pit/requirements/${encodeURIComponent(result.requirement.id)}`; }).catch((error) => { if (mutationIsCurrent(operation.generation)) showPitToast(isPitApiError(error) ? error.message : "恢复失败", "danger"); });
    }
  }, { signal: lifetime.signal });

  host.addEventListener("submit", (event) => {
    const form = event.target as HTMLFormElement; if (!form.matches("[data-pit-requirement-form]")) return; event.preventDefault();
    currentForm = readForm(form, requirement ? requirementToForm(requirement) : emptyPitRequirementForm(), data.users);
    const errors = validatePitRequirementForm(currentForm); showErrors(form, errors); if (Object.keys(errors).length) return;
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]"); if (button) button.disabled = true;
    const operation = beginMutation();
    const request = requirement
      ? api.updateRequirement(requirement.id, formToCreateOrPatchBody(currentForm, "patch"), { signal: operation.signal })
      : api.createRequirement(formToCreateOrPatchBody(currentForm, "create"), { signal: operation.signal });
    void request.then((result) => {
      if (!mutationIsCurrent(operation.generation)) return;
      setDirty(false); window.dispatchEvent(new CustomEvent("pit:requirements-changed"));
      if (requirement) { editorOpen = false; void load(); }
      else location.hash = `#/pit/requirements/${encodeURIComponent(result.requirement.id)}`;
    }).catch((error) => {
      if (!mutationIsCurrent(operation.generation)) return;
      if (isPitApiError(error) && error.status === 409 && requirement) {
        const current = error.fields?.current as PitRequirement | undefined;
        if (current) { (host.querySelector<HTMLElement>("[data-pit-detail-overlay]") ?? host).insertAdjacentHTML("beforeend", renderPitConflictDialog(calculatePitConflictDiff(formToCreateOrPatchBody(currentForm, "patch"), current))); return; }
      }
      showPitToast(isPitApiError(error) ? error.message : "保存失败", "danger");
    }).finally(() => { if (mutationIsCurrent(operation.generation) && button?.isConnected) button.disabled = false; });
  }, { signal: lifetime.signal });

  host.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (editorOpen) { event.preventDefault(); closeEditor(); }
    else if (context.mode === "drawer") { event.preventDefault(); closeDetail(); }
    else if (!requirementId) { event.preventDefault(); navigate(context.closeHref); }
  }, { signal: lifetime.signal });
  const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
  window.addEventListener("beforeunload", beforeUnload, { signal: lifetime.signal });
  lifetime.signal.addEventListener("abort", () => { loadController.abort(); mutationController?.abort(); mutationGeneration += 1; }, { once: true });
  const refresh = window.setInterval(() => { if (!editorOpen && !dirty && requirementId) void load(); }, 30_000);
  lifetime.signal.addEventListener("abort", () => window.clearInterval(refresh), { once: true });
  void load();
}
