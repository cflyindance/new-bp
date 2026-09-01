import type { PitRequirement, PitRequirementPatchInput } from "./pit-types";
import { escapePitHtml } from "./pit-ui";

export type PitConflictDiff = { field: string; label: string; submitted: unknown; current: unknown };
const LABELS: Record<string, string> = {
  title: "标题", description: "需求描述", useCase: "使用场景", notes: "补充说明", jiraTicket: "Jira Ticket",
  priority: "优先级", productLineIds: "产品线", mids: "MID", assignees: "人员分配", isHighlighted: "重点需求",
};
const normalize = (value: unknown): string => JSON.stringify(value ?? null);

export function calculatePitConflictDiff(submitted: PitRequirementPatchInput, current: PitRequirement): PitConflictDiff[] {
  return Object.entries(submitted).flatMap(([field, value]) => {
    if (field === "rowVersion") return [];
    let currentValue: unknown = (current as unknown as Record<string, unknown>)[field];
    if (field === "productLineIds") currentValue = current.productLines.map((item) => item.id);
    if (field === "assignees") currentValue = current.assignees.map(({ role, userId, displayName }) => ({ role, userId, displayName }));
    return normalize(value) === normalize(currentValue) ? [] : [{ field, label: LABELS[field] ?? field, submitted: value, current: currentValue }];
  });
}

function display(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join("、") || "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

export function renderPitConflictDialog(diff: PitConflictDiff[]): string {
  return `<div data-pit-conflict-dialog class="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="pit-conflict-title"><div class="w-full max-w-2xl rounded-2xl border border-amber-300 bg-white p-6 shadow-2xl dark:border-amber-700 dark:bg-slate-900"><p class="font-mono text-[10px] uppercase tracking-[.2em] text-amber-700">Version conflict</p><h2 id="pit-conflict-title" class="mt-2 text-xl font-bold">需求已被其他人更新</h2><p class="mt-2 text-sm text-slate-500">为避免覆盖他人修改，请加载最新版本后重新编辑。</p><div class="mt-5 max-h-72 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">${diff.length ? diff.map((item) => `<div class="grid gap-2 border-b border-slate-100 p-3 text-sm last:border-0 dark:border-slate-800 sm:grid-cols-[8rem_1fr_1fr]"><strong>${escapePitHtml(item.label)}</strong><span><small class="block text-slate-400">你的提交</small>${escapePitHtml(display(item.submitted))}</span><span><small class="block text-slate-400">服务器最新</small>${escapePitHtml(display(item.current))}</span></div>`).join("") : `<p class="p-4 text-sm text-slate-500">行版本已变化。</p>`}</div><div class="mt-6 flex justify-end gap-3"><button data-pit-conflict-cancel type="button" class="rounded-xl border px-4 py-2 text-sm font-bold">取消</button><button data-pit-conflict-load type="button" class="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">加载最新数据</button></div></div></div>`;
}
