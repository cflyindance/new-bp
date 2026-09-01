import { pitApi, type PitApi } from "./pit-api";
import { parsePitListQuery } from "./pit-list-query";
import type { PitExportJob, PitRequirementListQuery, PitUser } from "./pit-types";
import { downloadPitResponse, escapePitFileText as esc, formatPitDate, pitFileErrorMessage } from "./pit-file-workflow-ui";

export function pitExportFilterFromPath(path: string): PitRequirementListQuery {
  const query = parsePitListQuery(path.split("?")[1] ?? "");
  const { page: _page, pageSize: _pageSize, ...filter } = query;
  return filter;
}

export function canDownloadPitExport(job: PitExportJob, now = new Date()): boolean {
  return job.downloadable && !job.expired && job.status === "completed" && (!job.expiresAt || new Date(job.expiresAt) > now);
}

export function renderPitExportPage(state: { user: PitUser; items?: PitExportJob[]; scope?: "mine" | "all"; currentFilter?: PitRequirementListQuery; busy?: string; error?: string }): string {
  const items = state.items ?? [];
  return `<section data-pit-export-page data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-mono text-[11px] uppercase tracking-[.22em] text-amber-700">Portable snapshots</p><h2 class="mt-2 text-2xl font-semibold">导出记录</h2><p class="mt-2 text-sm text-slate-500">按需求列表当前 URL 筛选条件生成快照，文件到期后可按原条件重新生成。</p></div><button data-pit-export-create ${state.busy ? "disabled" : ""} class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-amber-300 disabled:opacity-40">导出当前筛选</button></div>
  ${state.user.role === "admin" ? `<div class="mt-5 inline-flex rounded-xl border border-slate-200 bg-white p-1"><button data-pit-export-scope="mine" class="rounded-lg px-3 py-2 text-sm ${state.scope !== "all" ? "bg-amber-400 font-semibold" : ""}">我的导出</button><button data-pit-export-scope="all" class="rounded-lg px-3 py-2 text-sm ${state.scope === "all" ? "bg-amber-400 font-semibold" : ""}">全部用户</button></div>` : ""}
  ${state.error ? `<div role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">${esc(state.error)}</div>` : ""}
  <div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-5 py-3">创建时间</th><th>状态</th><th>行数</th><th>到期时间</th><th>筛选</th><th class="pr-5 text-right">操作</th></tr></thead><tbody>${items.map((job) => `<tr class="border-t"><td class="px-5 py-4">${formatPitDate(job.createdAt)}</td><td><span class="rounded-full px-2 py-1 text-xs ${job.expired ? "bg-slate-100 text-slate-500" : job.status === "completed" ? "bg-emerald-50 text-emerald-700" : job.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}">${job.expired ? "已过期" : esc(job.status)}</span></td><td>${job.rowCount ?? "—"}</td><td>${formatPitDate(job.expiresAt)}</td><td><code class="max-w-56 truncate text-xs">${esc(JSON.stringify(job.filter))}</code></td><td class="pr-5 text-right">${canDownloadPitExport(job) ? `<button data-pit-export-download="${esc(job.id)}" class="text-amber-700 underline">下载</button>` : ""}${job.expired || job.status === "failed" ? `<button data-pit-export-regenerate="${esc(job.id)}" class="ml-3 text-amber-700 underline">重新生成</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="px-5 py-10 text-center text-slate-400">暂无导出任务</td></tr>`}</tbody></table></div></div></section>`;
}

export function bindPitExportPage(root: HTMLElement, user: PitUser, currentPath: string, api: PitApi = pitApi): () => void {
  const controller = new AbortController(); let active = true; let generation = 0; let items: PitExportJob[] = []; let scope: "mine" | "all" = "mine"; let busy = ""; let error = "";
  const outlet = root.querySelector<HTMLElement>("[data-pit-export-page]")?.parentElement; if (!outlet) return () => controller.abort();
  const currentFilter = pitExportFilterFromPath(currentPath);
  const draw = () => { if (!active || !outlet.isConnected) return; outlet.innerHTML = renderPitExportPage({ user, items, scope, currentFilter, busy, error }); wire(); };
  const load = async () => { const requestGeneration = ++generation; const requestedScope = scope; try { const result = await api.listExports(requestedScope === "all" ? { scope: "all" } : {}, { signal: controller.signal }); if (!active || requestGeneration !== generation || requestedScope !== scope) return; items = result.items; error = ""; } catch (e) { if (requestGeneration === generation && !(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "导出记录加载失败"); } if (requestGeneration === generation) draw(); };
  const create = async (filter: PitRequirementListQuery) => { if (busy) return; busy = "create"; draw(); try { await api.createExport(filter, { signal: controller.signal }); await load(); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "导出创建失败"); } finally { busy = ""; draw(); } };
  const wire = () => {
    outlet.querySelector<HTMLButtonElement>("[data-pit-export-create]")?.addEventListener("click", () => void create(currentFilter));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-export-scope]").forEach((button) => button.addEventListener("click", () => { if (user.role !== "admin") return; scope = button.dataset.pitExportScope as "mine" | "all"; void load(); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-export-regenerate]").forEach((button) => button.addEventListener("click", () => { const job = items.find((item) => item.id === button.dataset.pitExportRegenerate); if (job) void create(job.filter); }));
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-export-download]").forEach((button) => button.addEventListener("click", async () => { if (busy) return; busy = "download"; draw(); try { const response = await api.downloadExport(button.dataset.pitExportDownload!, { signal: controller.signal }); await downloadPitResponse(response, "pit-requirements.xlsx"); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "下载失败"); } finally { busy = ""; draw(); } }));
  };
  draw(); void load(); return () => { active = false; controller.abort(); };
}
