/**
 * 设置页 · 页脚保存栏
 */
import { confirmAndTriggerPageSaveAndDeploy } from "./deployment-page-trigger";
import { getStoreConfigCursor } from "./deployment-store";
import { resolveDomainsForPath } from "./deployment-config-domains";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import {
  getPageSavePendingCount,
  isPageSavePending,
} from "./page-save-registry";
import {
  discardPageDraft,
  getPageDraftChangeCount,
  initPageSaveSession,
  isPageBatchSavePath,
  listPageDraftFohToggles,
  listPageDraftToggles,
  resolvePageSaveKey,
} from "./page-settings-draft";
import { readFohByLineToggleState } from "./foh-settings-by-line-toggle";
import type { FohLineNavId } from "./foh-settings-line-scope";
import { readModuleSettingToggleOn } from "./module-settings-toggle-ui";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDeployedHint(pageKey: string): string {
  const scope = resolveAutoDeploymentScope();
  const storeId = scope?.storeIds[0];
  if (!storeId) return "上次下发：—";

  const domains = resolveDomainsForPath(pageKey);
  const domainKey = domains[0]?.domainKey ?? "module.settings";
  const cursor = getStoreConfigCursor(storeId);
  const domain = cursor.domains[domainKey];
  if (!domain?.lastDeployedAt) return "尚未下发";

  try {
    const when = new Date(domain.lastDeployedAt).toLocaleString("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `上次下发 v${domain.deployedVersion}（${when}）`;
  } catch {
    return `上次下发 v${domain.deployedVersion ?? "—"}`;
  }
}

export function renderPageSaveBar(path: string): string {
  const pageKey = resolvePageSaveKey(path);
  if (!isPageBatchSavePath(pageKey)) return "";

  const count = getPageSavePendingCount(pageKey);
  const dirty = count > 0;
  const deployedHint = formatDeployedHint(pageKey);

  return `
    <div
      class="sticky bottom-0 z-10 shrink-0 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-card/80"
      data-page-save-bar
      data-page-save-key="${escapeHtml(pageKey)}"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0 text-sm text-muted-foreground">
          <span data-page-save-count ${dirty ? "" : 'class="hidden"'}>
            <span class="font-medium text-foreground" data-page-save-count-num>${count}</span>
            项待保存
          </span>
          <span data-page-save-count-sep ${dirty ? "" : 'class="hidden"'}> · </span>
          <span data-page-save-deployed-hint>${escapeHtml(deployedHint)}</span>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            data-page-save-discard
            class="rounded-lg border border-border px-3 py-2 text-sm text-card-foreground hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
            ${dirty ? "" : "disabled"}
          >
            放弃修改
          </button>
          <button
            type="button"
            data-page-save-commit
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            ${dirty ? "" : "disabled"}
          >
            保存并下发
          </button>
        </div>
      </div>
    </div>`;
}

export function wrapPageWithSaveBar(path: string, contentHtml: string): string {
  const bar = renderPageSaveBar(path);
  if (!bar) return contentHtml;
  return `<div class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto">${contentHtml}</div>
    ${bar}
  </div>`;
}

function syncPageSaveBarDom(pageKey: string): void {
  const bar = document.querySelector<HTMLElement>(`[data-page-save-bar][data-page-save-key="${pageKey}"]`);
  if (!bar) return;

  const count = getPageSavePendingCount(pageKey);
  const dirty = count > 0;

  const countWrap = bar.querySelector("[data-page-save-count]");
  const countNum = bar.querySelector("[data-page-save-count-num]");
  const sep = bar.querySelector("[data-page-save-count-sep]");
  const discardBtn = bar.querySelector<HTMLButtonElement>("[data-page-save-discard]");
  const commitBtn = bar.querySelector<HTMLButtonElement>("[data-page-save-commit]");

  if (countNum) countNum.textContent = String(count);
  countWrap?.classList.toggle("hidden", !dirty);
  sep?.classList.toggle("hidden", !dirty);
  if (discardBtn) discardBtn.disabled = !dirty;
  if (commitBtn) commitBtn.disabled = !dirty;
}

export function refreshPageSaveBar(pageKey?: string): void {
  const key =
    pageKey ??
    document.querySelector<HTMLElement>("[data-page-save-bar]")?.dataset.pageSaveKey;
  if (!key) return;
  syncPageSaveBarDom(key);
}

function syncToggleDom(seq: number, on: boolean): void {
  document
    .querySelectorAll<HTMLElement>(`[data-module-setting-toggle="${seq}"]`)
    .forEach((el) => {
      el.setAttribute("aria-checked", on ? "true" : "false");
      const span = el.querySelector("span");
      if (span) {
        span.classList.toggle("translate-x-5", on);
        span.classList.toggle("translate-x-0.5", !on);
      }
    });
}

function revertToggleDomToPersisted(pageKey: string): void {
  for (const { seq } of listPageDraftToggles(pageKey)) {
    syncToggleDom(seq, readModuleSettingToggleOn(seq));
  }
  for (const { seq, lineId } of listPageDraftFohToggles(pageKey)) {
    syncToggleDom(seq, readFohByLineToggleState(seq, lineId as FohLineNavId));
  }
}

let bound = false;

export function bindPageSaveBar(remount: () => void): void {
  if (typeof document === "undefined") return;

  if (!bound) {
    bound = true;

    window.addEventListener("menusifu:page-settings-dirty", () => {
      refreshPageSaveBar();
    });

    document.body.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const commitBtn = target.closest<HTMLElement>("[data-page-save-commit]");
      if (commitBtn) {
        const bar = commitBtn.closest<HTMLElement>("[data-page-save-bar]");
        const pageKey = bar?.dataset.pageSaveKey;
        if (!pageKey || !isPageSavePending(pageKey)) return;
        void confirmAndTriggerPageSaveAndDeploy(pageKey).then((batch) => {
          if (batch) {
            refreshPageSaveBar(pageKey);
            remount();
          }
        });
        return;
      }

      const discardBtn = target.closest<HTMLElement>("[data-page-save-discard]");
      if (discardBtn) {
        const bar = discardBtn.closest<HTMLElement>("[data-page-save-bar]");
        const pageKey = bar?.dataset.pageSaveKey;
        if (!pageKey || !isPageSavePending(pageKey)) return;
        if (!window.confirm("放弃当前页未保存的修改？")) return;
        revertToggleDomToPersisted(pageKey);
        discardPageDraft(pageKey);
        window.dispatchEvent(
          new CustomEvent("menusifu:page-settings-discard", { detail: { pageKey } }),
        );
        refreshPageSaveBar(pageKey);
        remount();
      }
    });
  }

  const bar = document.querySelector<HTMLElement>("[data-page-save-bar]");
  const pageKey = bar?.dataset.pageSaveKey;
  if (pageKey) {
    initPageSaveSession(pageKey);
    refreshPageSaveBar(pageKey);
  }
}

export function shouldRenderPageSaveBar(path: string): boolean {
  return isPageBatchSavePath(resolvePageSaveKey(path));
}
