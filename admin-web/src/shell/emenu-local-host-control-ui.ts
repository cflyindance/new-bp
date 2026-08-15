import { t } from "../i18n";
import {
  displayEmenuKposHost,
  isKposMixedContentBlocked,
  readEmenuKposHost,
  reloadKposHostEmbedFrames,
  syncEmbedKposRouting,
  syncEmenuKposHostCookie,
  writeEmenuKposHost,
} from "./emenu-local-host-control";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMixedContentHint(): string {
  if (!isKposMixedContentBlocked()) return "";
  return `
    <p
      class="max-w-[18rem] text-[11px] leading-4 text-amber-700 dark:text-amber-300 sm:max-w-xs"
      data-kpos-host-mixed-content-hint
      title="${escapeHtml(t("shell.emenuLocalHostIpMixedContentHint"))}"
    >
      ${escapeHtml(t("shell.emenuLocalHostIpMixedContentHint"))}
    </p>`;
}

/** 主题切换左侧的主机 IP 控件（eMenu / Kiosk 配置后台共用） */
export function renderEmenuHostIpControl(): string {
  const value = displayEmenuKposHost();
  return `
    <div class="flex min-w-0 flex-col items-end gap-1" data-emenu-host-ip-control data-kpos-host-ip-control>
      <div class="flex min-w-0 items-center gap-2">
        <label class="flex min-w-0 items-center gap-2" for="emenu-host-ip-input">
          <span class="hidden shrink-0 text-xs font-medium text-muted-foreground sm:inline">${escapeHtml(t("shell.emenuLocalHostIp"))}</span>
          <input
            id="emenu-host-ip-input"
            type="text"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHtml(value)}"
            placeholder="${escapeHtml(t("shell.emenuLocalHostIpPlaceholder"))}"
            class="h-10 w-[9.5rem] rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
            aria-label="${escapeHtml(t("shell.emenuLocalHostIp"))}"
          />
        </label>
        <button
          type="button"
          id="emenu-host-ip-apply"
          class="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ${escapeHtml(t("shell.emenuLocalHostIpApply"))}
        </button>
      </div>
      ${renderMixedContentHint()}
    </div>`;
}

export function bindEmenuHostIpControl(): void {
  syncEmenuKposHostCookie();
  syncEmbedKposRouting();

  const input = document.getElementById("emenu-host-ip-input") as HTMLInputElement | null;
  const apply = document.getElementById("emenu-host-ip-apply");
  if (!input || !apply) return;

  const applyHost = () => {
    const next = writeEmenuKposHost(input.value);
    if (!next) {
      input.setCustomValidity(t("shell.emenuLocalHostIpInvalid"));
      input.reportValidity();
      input.value = displayEmenuKposHost(readEmenuKposHost());
      return;
    }
    input.setCustomValidity("");
    input.value = displayEmenuKposHost(next);
    if (isKposMixedContentBlocked(next)) {
      input.setCustomValidity(t("shell.emenuLocalHostIpMixedContentHint"));
      input.reportValidity();
      input.setCustomValidity("");
    }
    reloadKposHostEmbedFrames();
  };

  apply.addEventListener("click", applyHost);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyHost();
    }
  });
  input.addEventListener("input", () => input.setCustomValidity(""));
}
