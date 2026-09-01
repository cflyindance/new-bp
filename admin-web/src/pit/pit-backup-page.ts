import { pitApi, type PitApi } from "./pit-api";
import type { PitBackupRecord, PitUser } from "./pit-types";
import { downloadPitResponse, escapePitFileText as esc, formatPitBytes, formatPitDate, pitFileErrorMessage } from "./pit-file-workflow-ui";

export function publicPitBackup(record: PitBackupRecord): Omit<PitBackupRecord, "fileName" | "manifestName"> {
  const { fileName: _fileName, manifestName: _manifestName, ...publicRecord } = record;
  return publicRecord;
}

export function renderPitBackupPage(state: { user: PitUser; items?: PitBackupRecord[]; busy?: boolean; error?: string }): string {
  if (state.user.role !== "admin") return `<section data-pit-backup-page data-pit-route-page><p role="alert">无权访问备份管理</p></section>`;
  return `<section data-pit-backup-page data-pit-route-page class="mx-auto w-full max-w-[94rem] p-4 sm:p-6 lg:p-8"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="font-mono text-[11px] uppercase tracking-[.22em] text-amber-700">Local recovery points</p><h2 class="mt-2 text-2xl font-semibold">备份管理</h2><p class="mt-2 text-sm text-slate-500">备份保存在本机服务端。页面仅展示校验信息，不公开物理路径。</p></div><button data-pit-backup-create ${state.busy ? "disabled" : ""} class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-amber-300 disabled:opacity-40">${state.busy ? "正在创建…" : "创建手动备份"}</button></div>${state.error ? `<div role="alert" class="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">${esc(state.error)}</div>` : ""}<div class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="px-5 py-3">类型</th><th>创建时间</th><th>大小</th><th>Schema</th><th>SHA-256</th><th class="pr-5 text-right">操作</th></tr></thead><tbody>${(state.items ?? []).map((raw) => { const item = publicPitBackup(raw); return `<tr class="border-t"><td class="px-5 py-4">${esc(item.kind)}</td><td>${formatPitDate(item.createdAt)}</td><td>${formatPitBytes(item.byteSize)}</td><td>v${item.schemaVersion}</td><td><code title="${esc(item.sha256)}" class="font-mono text-xs">${esc(item.sha256.slice(0, 12))}…</code></td><td class="pr-5 text-right"><button data-pit-backup-download="${esc(item.id)}" class="text-amber-700 underline">下载</button></td></tr>`; }).join("") || `<tr><td colspan="6" class="px-5 py-10 text-center text-slate-400">暂无备份记录</td></tr>`}</tbody></table></div></div></section>`;
}

export function bindPitBackupPage(root: HTMLElement, user: PitUser, api: PitApi = pitApi): () => void {
  if (user.role !== "admin") return () => undefined;
  const controller = new AbortController(); let active = true; let items: PitBackupRecord[] = []; let busy = false; let error = "";
  const outlet = root.querySelector<HTMLElement>("[data-pit-backup-page]")?.parentElement; if (!outlet) return () => controller.abort();
  const draw = () => { if (!active || !outlet.isConnected) return; outlet.innerHTML = renderPitBackupPage({ user, items, busy, error }); wire(); };
  const load = async () => { try { items = (await api.listBackups({ signal: controller.signal })).items; error = ""; } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "备份列表加载失败"); } draw(); };
  const wire = () => {
    outlet.querySelector<HTMLButtonElement>("[data-pit-backup-create]")?.addEventListener("click", async () => { if (busy) return; busy = true; draw(); try { await api.createBackup({ signal: controller.signal }); await load(); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "手动备份创建失败"); } finally { busy = false; draw(); } });
    outlet.querySelectorAll<HTMLButtonElement>("[data-pit-backup-download]").forEach((button) => button.addEventListener("click", async () => { if (busy) return; busy = true; draw(); try { const response = await api.downloadBackup(button.dataset.pitBackupDownload!, { signal: controller.signal }); await downloadPitResponse(response, "pit-backup.sqlite3"); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) error = pitFileErrorMessage(e, "备份下载失败"); } finally { busy = false; draw(); } }));
  };
  draw(); void load(); return () => { active = false; controller.abort(); };
}
