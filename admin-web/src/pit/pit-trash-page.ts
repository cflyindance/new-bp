import { isPitApiError } from "./pit-api-error";
import { pitApi, type PitApi } from "./pit-api";
import { bindPitAdminModalAccessibility, openPitAdminModal } from "./pit-admin-modal";
import type { PitRequirementList, PitRequirementListItem, PitUser } from "./pit-types";
import { createPitPageLifetime, escapePitHtml, formatPitDate, renderPitBanner, renderPitStatusBadge, showPitToast } from "./pit-ui";

type TrashApi = Pick<PitApi, "listRequirements" | "restoreRequirement">;
export function pitTrashDetailHref(id: string): string { return `/pit/requirements/${encodeURIComponent(id)}?view=trash`; }

function renderTrashRows(items: PitRequirementListItem[]): string {
  return items.map((item) => `<tr data-pit-trash-id="${escapePitHtml(item.id)}" class="border-t border-slate-100 dark:border-slate-800">
    <td class="py-4"><a href="#${pitTrashDetailHref(item.id)}" class="font-semibold hover:text-amber-700">${escapePitHtml(item.requirementNo)} · ${escapePitHtml(item.title)}</a><p class="mt-1 line-clamp-1 text-xs text-slate-500">${escapePitHtml(item.summary)}</p></td>
    <td>${renderPitStatusBadge(item.status, item.sourceStatus)}</td><td class="text-xs text-slate-500">${formatPitDate(item.deletedAt)}</td>
    <td class="text-xs text-slate-500">${escapePitHtml(item.deletedBy?.displayName?.trim() || "历史记录未保留")}</td>
    <td class="text-right"><button data-pit-trash-restore class="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-700">恢复</button></td>
  </tr>`).join("");
}

export function renderPitTrashPage(input: { user: PitUser; data?: PitRequirementList; loading?: boolean; error?: string }): string {
  if (input.user.role !== "admin") return `<section data-pit-trash-page>${renderPitBanner("无权访问回收站。", "danger")}</section>`;
  const data = input.data; let content = `<p role="status" class="py-16 text-center text-sm text-slate-500">正在读取已删除需求…</p>`;
  if (input.error) content = renderPitBanner(input.error, "danger");
  else if (!input.loading && data?.items.length === 0) content = `<p class="py-16 text-center text-sm text-slate-500">回收站为空。</p>`;
  else if (!input.loading && data) content = `<div class="overflow-x-auto"><table class="w-full min-w-[880px] text-left text-sm"><thead class="text-xs text-slate-500"><tr><th class="pb-3">需求</th><th>状态</th><th>删除时间</th><th>删除人</th><th class="text-right">操作</th></tr></thead><tbody>${renderTrashRows(data.items)}</tbody></table></div><div class="mt-5 flex items-center justify-between"><span class="text-xs text-slate-500">共 ${data.total} 条</span><div class="flex gap-2"><button data-pit-trash-page-number="${data.page - 1}" ${data.page <= 1 ? "disabled" : ""} class="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-30">上一页</button><button data-pit-trash-page-number="${data.page + 1}" ${data.page * data.pageSize >= data.total ? "disabled" : ""} class="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-30">下一页</button></div></div>`;
  return `<section data-pit-trash-page data-pit-route-page class="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><div class="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"><div class="border-b border-slate-200 p-5 dark:border-slate-800"><p class="font-mono text-[10px] uppercase tracking-[.22em] text-amber-700">Soft-deleted records</p><h2 class="mt-2 text-2xl font-bold">回收站</h2><p class="mt-1 text-sm text-slate-500">这里只显示已软删除需求；可恢复，不提供永久删除。</p></div><div data-pit-trash-content class="p-5">${content}</div></div><div data-pit-trash-dialog-host></div></section>`;
}

function confirmRestore(item: PitRequirementListItem): string { return `<div data-pit-trash-dialog data-pit-trash-confirm-id="${escapePitHtml(item.id)}" class="fixed inset-0 z-[130] grid place-items-center bg-slate-950/55 p-4"><div role="dialog" aria-modal="true" aria-labelledby="pit-trash-confirm-title" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"><h3 id="pit-trash-confirm-title" class="text-lg font-bold">恢复需求</h3><p class="mt-3 text-sm leading-6 text-slate-500">确定将“${escapePitHtml(item.title)}”恢复到需求池吗？恢复后会重新出现在普通列表中。</p><div class="mt-6 flex justify-end gap-2"><button data-pit-trash-dialog-cancel class="rounded-xl border px-4 py-2">取消</button><button data-pit-trash-confirm-submit class="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">确认恢复</button></div></div></div>`; }

export function bindPitTrashPage(root: HTMLElement, user: PitUser, api: TrashApi = pitApi): void {
  const host = root.querySelector<HTMLElement>("[data-pit-trash-page]"); if (!host || user.role !== "admin") return;
  const lifetime = createPitPageLifetime(host); let data: PitRequirementList | undefined; let page = 1; let generation = 0;
  const active = (g?: number) => !lifetime.signal.aborted && host.isConnected && (g === undefined || g === generation);
  const paint = (error?: string) => { if (!active()) return; const wrapper = document.createElement("div"); wrapper.innerHTML = renderPitTrashPage({ user, data, error }); const next = wrapper.firstElementChild; if (next) host.replaceChildren(...Array.from(next.childNodes)); };
  bindPitAdminModalAccessibility(root, lifetime.signal);
  const load = async () => { const g = ++generation; try { const result = await api.listRequirements({ deleted: "only", page, pageSize: 20, sort: "-updatedAt" }, { signal: lifetime.signal }); if (active(g)) { data = result; paint(); } } catch (error) { if (active(g) && (error as Error).name !== "AbortError") paint(isPitApiError(error) ? error.message : "读取回收站失败"); } };
  root.addEventListener("click", (event) => { const target = event.target as Element; if (target.closest("[data-pit-trash-dialog-cancel]")) { target.closest("[data-pit-trash-dialog]")?.remove(); return; } const pageButton = target.closest<HTMLButtonElement>("[data-pit-trash-page-number]"); if (pageButton && !pageButton.disabled) { page = Number(pageButton.dataset.pitTrashPageNumber); void load(); return; } const row = target.closest<HTMLElement>("[data-pit-trash-id]"); const item = data?.items.find((entry) => entry.id === row?.dataset.pitTrashId); if (item && target.closest("[data-pit-trash-restore]")) { const dialogHost = root.querySelector<HTMLElement>("[data-pit-trash-dialog-host]"); if (dialogHost) openPitAdminModal(dialogHost, confirmRestore(item), target.closest<HTMLElement>("button")); } }, { signal: lifetime.signal });
  root.addEventListener("click", (event) => { const button = (event.target as Element).closest<HTMLButtonElement>("[data-pit-trash-confirm-submit]"); const dialog = button?.closest<HTMLElement>("[data-pit-trash-confirm-id]"); if (!button || !dialog) return; button.disabled = true; const g = ++generation; void api.restoreRequirement(dialog.dataset.pitTrashConfirmId ?? "", { signal: lifetime.signal }).then(() => { if (active(g)) { dialog.remove(); showPitToast("需求已恢复", "success"); void load(); } }).catch((error) => { if (active(g)) { button.disabled = false; showPitToast(isPitApiError(error) ? error.message : "恢复失败", "danger"); } }); }, { signal: lifetime.signal });
  void load();
}
