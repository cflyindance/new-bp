import { t } from "../i18n";
import {
  isKposMixedContentBlocked,
  isPublicHttpsTunnelHost,
  parseEmenuKposHostParts,
  readEmenuKposHost,
  reloadKposHostEmbedFrames,
  syncEmbedKposRouting,
  syncEmenuKposHostCookie,
  writeEmenuKposHostParts,
} from "./emenu-local-host-control";
import { ensureKioskEmbedSession } from "./kiosk-local-session-bridge";
import {
  clearKposFloorPlanConnection,
  connectKposFloorPlanAutomatically,
  readKposFloorPlanConnection,
} from "../config/kpos-floor-plan-client";

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMixedContentHint(): string {
  if (!isKposMixedContentBlocked()) return "";
  return `
    <p
      class="mt-2 text-[11px] leading-4 text-amber-700 dark:text-amber-300"
      data-kpos-host-mixed-content-hint
      title="${escapeHtml(t("shell.emenuLocalHostIpMixedContentHint"))}"
    >
      ${escapeHtml(t("shell.emenuLocalHostIpMixedContentHint"))}
    </p>`;
}

/**
 * Demo 视角切换面板内的主机 IP 独立区块（周边产品下方）。
 * 全局共用同一套存储与 /kpos 代理目标。
 */
export function renderFlatGlobalHostIpGroup(): string {
  const { hostname, port, isTunnel } = parseEmenuKposHostParts();
  const labelId = "demo-switch-host-ip-group-title";
  return `
    <div
      data-emenu-host-ip-control
      data-kpos-host-ip-control
      data-global-host-ip-control
      role="group"
      aria-labelledby="${labelId}"
    >
      <h2 id="${labelId}" class="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">${escapeHtml(t("shell.emenuLocalHostIp"))}</h2>
      <div class="mt-2 flex min-w-0 items-center gap-2">
        <label class="min-w-0 flex-1" for="global-host-ip-input">
          <span class="sr-only">${escapeHtml(t("shell.emenuLocalHostIpAddress"))}</span>
          <input
            id="global-host-ip-input"
            data-global-host-ip-input
            type="text"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHtml(hostname)}"
            placeholder="${escapeHtml(t("shell.emenuLocalHostIpAddressPlaceholder"))}"
            class="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="${escapeHtml(t("shell.emenuLocalHostIpAddress"))}"
          />
        </label>
        <span class="shrink-0 text-sm text-muted-foreground" aria-hidden="true">:</span>
        <label class="w-[4.75rem] shrink-0" for="global-host-port-input">
          <span class="sr-only">${escapeHtml(t("shell.emenuLocalHostIpPort"))}</span>
          <input
            id="global-host-port-input"
            data-global-host-port-input
            type="text"
            inputmode="numeric"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHtml(port)}"
            placeholder="${escapeHtml(t("shell.emenuLocalHostIpPortPlaceholder"))}"
            ${isTunnel ? "disabled" : ""}
            class="h-10 w-full rounded-xl border border-border bg-background px-2 text-center text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="${escapeHtml(t("shell.emenuLocalHostIpPort"))}"
          />
        </label>
        <button
          type="button"
          id="global-host-ip-apply"
          data-global-host-ip-apply
          class="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ${escapeHtml(t("shell.emenuLocalHostIpApply"))}
        </button>
      </div>
      ${renderMixedContentHint()}
    </div>`;
}

/** @deprecated 顶栏已不再展示；保留别名以免旧调用报错 */
export function renderGlobalHostIpControl(): string {
  return renderFlatGlobalHostIpGroup();
}

/** @deprecated 使用 renderFlatGlobalHostIpGroup / renderGlobalHostIpControl */
export const renderEmenuHostIpControl = renderGlobalHostIpControl;

/** 应用启动 / 每次 mount 时同步 cookie 与嵌入路由，保证任意页切换主机后 /kpos 指向正确 POS。 */
export function syncGlobalHostIpRouting(): void {
  syncEmenuKposHostCookie();
  syncEmbedKposRouting();
}

export function bindGlobalHostIpControl(): void {
  syncGlobalHostIpRouting();

  const root = document.querySelector<HTMLElement>("[data-global-host-ip-control]");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  const hostInput = root.querySelector<HTMLInputElement>("[data-global-host-ip-input]");
  const portInput = root.querySelector<HTMLInputElement>("[data-global-host-port-input]");
  const apply = root.querySelector<HTMLButtonElement>("[data-global-host-ip-apply]");
  if (!hostInput || !portInput || !apply) return;

  const syncPortDisabled = () => {
    const host = hostInput.value.trim().replace(/^https?:\/\//i, "").split("/")[0]?.split(":")[0] || "";
    const tunnel = isPublicHttpsTunnelHost(host);
    portInput.disabled = tunnel;
    if (tunnel) portInput.value = "";
  };

  const applyHost = () => {
    const next = writeEmenuKposHostParts(hostInput.value, portInput.value);
    if (!next) {
      hostInput.setCustomValidity(t("shell.emenuLocalHostIpInvalid"));
      hostInput.reportValidity();
      const parts = parseEmenuKposHostParts(readEmenuKposHost());
      hostInput.value = parts.hostname;
      portInput.value = parts.port;
      portInput.disabled = parts.isTunnel;
      return;
    }
    hostInput.setCustomValidity("");
    portInput.setCustomValidity("");
    const parts = parseEmenuKposHostParts(next);
    hostInput.value = parts.hostname;
    portInput.value = parts.port;
    portInput.disabled = parts.isTunnel;
    if (isKposMixedContentBlocked(next)) {
      hostInput.setCustomValidity(t("shell.emenuLocalHostIpMixedContentHint"));
      hostInput.reportValidity();
      hostInput.setCustomValidity("");
    }
    // 先登录当前主机并写回 cookie，再刷新 iframe，避免仍用旧 POS 的 session / 空 license
    void ensureKioskEmbedSession()
      .catch((err) => {
        console.warn("[kiosk-local] failed to warm POS session after host change", err);
      })
      .finally(() => {
        reloadKposHostEmbedFrames();
        clearKposFloorPlanConnection();
        void connectKposFloorPlanAutomatically().catch((error) => {
          console.warn("[kpos-floor-plan] failed to auto-connect current host", error);
        });
      });
  };

  apply.addEventListener("click", applyHost);
  const onEnter = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyHost();
    }
  };
  hostInput.addEventListener("keydown", onEnter);
  portInput.addEventListener("keydown", onEnter);
  hostInput.addEventListener("input", () => {
    hostInput.setCustomValidity("");
    syncPortDisabled();
  });
  portInput.addEventListener("input", () => portInput.setCustomValidity(""));

  if (!readKposFloorPlanConnection()) {
    void connectKposFloorPlanAutomatically().catch(() => {
      /* 主机尚未可用时由用户再次点击“应用”重试 */
    });
  }
}

/** @deprecated 使用 bindGlobalHostIpControl */
export const bindEmenuHostIpControl = bindGlobalHostIpControl;
