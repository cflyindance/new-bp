/**
 * 页面保存并下发 · 连锁范围确认弹窗
 */
import {
  countDevicesForStores,
  resolveDeploymentScopeOptions,
} from "./deployment-mock-devices";
import { resolveDomainsForPath } from "./deployment-config-domains";
import { peekPageConfigChanges } from "./deployment-change-buffer";
import { resolvePageSaveKey } from "./page-settings-draft";
import type { DeploymentScopeOption } from "./deployment-types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDevicePreview(storeIds: string[], pageKey: string): string {
  const domains = resolveDomainsForPath(pageKey);
  const productLines = domains.length > 0 ? domains[0]!.productLines : ["POS"];
  const counts = countDevicesForStores(storeIds, productLines);
  const parts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([line, n]) => `${line} ×${n}`);
  return parts.length > 0 ? parts.join("  ·  ") : "—";
}

export function shouldShowPageSaveConfirmDialog(): boolean {
  return resolveDeploymentScopeOptions().length > 1;
}

export function openPageSaveConfirmDialog(
  pageKey: string,
  changeCount: number,
): Promise<DeploymentScopeOption | null> {
  const key = resolvePageSaveKey(pageKey);
  const options = resolveDeploymentScopeOptions();
  if (options.length <= 1) {
    return Promise.resolve(options[0] ?? null);
  }

  const changes = peekPageConfigChanges(key);
  const previewLabels = changes.slice(0, 5).map((c) => c.label);
  const more = changes.length > 5 ? ` 等 ${changes.length} 项` : "";

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-[10040] flex items-center justify-center bg-black/40 p-4";
    overlay.setAttribute("role", "presentation");

    const defaultId = options[0]?.id ?? "current";
    const optionHtml = options
      .map(
        (opt, idx) => `
      <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40">
        <input
          type="radio"
          name="page-save-scope"
          value="${escapeHtml(opt.id)}"
          class="mt-0.5 accent-primary"
          ${idx === 0 ? "checked" : ""}
        />
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-medium text-foreground">${escapeHtml(opt.label)}</span>
          <span class="mt-0.5 block text-xs text-muted-foreground">预计影响：${escapeHtml(formatDevicePreview(opt.storeIds, key))}</span>
        </span>
      </label>`,
      )
      .join("");

    overlay.innerHTML = `
      <div
        class="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-save-confirm-title"
      >
        <div class="flex items-start justify-between gap-3">
          <h2 id="page-save-confirm-title" class="text-base font-semibold text-foreground">确认下发</h2>
          <button type="button" data-page-save-confirm-close class="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="关闭">×</button>
        </div>
        <p class="mt-2 text-sm text-muted-foreground">将保存 ${changeCount} 项变更并同步至终端。</p>
        ${
          previewLabels.length > 0
            ? `<ul class="mt-3 max-h-32 overflow-y-auto rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            ${previewLabels.map((l) => `<li class="truncate py-0.5">· ${escapeHtml(l)}</li>`).join("")}
            ${more ? `<li class="py-0.5">${escapeHtml(more.trim())}</li>` : ""}
          </ul>`
            : ""
        }
        <fieldset class="mt-4 space-y-2">
          <legend class="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">下发范围</legend>
          ${optionHtml}
        </fieldset>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" data-page-save-confirm-cancel class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/50">取消</button>
          <button type="button" data-page-save-confirm-ok class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">确认下发</button>
        </div>
      </div>`;

    const close = (result: DeploymentScopeOption | null) => {
      overlay.remove();
      resolve(result);
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });
    overlay.querySelector("[data-page-save-confirm-close]")?.addEventListener("click", () => close(null));
    overlay.querySelector("[data-page-save-confirm-cancel]")?.addEventListener("click", () => close(null));
    overlay.querySelector("[data-page-save-confirm-ok]")?.addEventListener("click", () => {
      const selected = overlay.querySelector<HTMLInputElement>('input[name="page-save-scope"]:checked');
      const opt = options.find((o) => o.id === selected?.value) ?? options.find((o) => o.id === defaultId);
      close(opt ?? null);
    });

    document.body.appendChild(overlay);
  });
}
