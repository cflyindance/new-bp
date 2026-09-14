import { mountDemoSwitchFab } from "./demo-switch-control";
import { bindViewSwitchControl, switchLegacyBToBrandView } from "./view-switch-control";

type LegacyBMerchant = {
  name: string;
  locations: number;
  permissions: readonly string[];
  gradient: string;
};

const LEGACY_B_MERCHANTS: readonly LegacyBMerchant[] = [
  {
    name: "大飞鸽-AD",
    locations: 1,
    permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report BO - Overview"],
    gradient: "from-[#aecafb] via-[#f8eadf] to-[#e9afb6]",
  },
  {
    name: "敦煌",
    locations: 1,
    permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"],
    gradient: "from-[#f4c990] via-[#efd8dc] to-[#a9c8fb]",
  },
  {
    name: "小飞鸽-连锁集团-13041自…",
    locations: 3,
    permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"],
    gradient: "from-[#a8c6f7] via-[#edd9d5] to-[#f7d39c]",
  },
  {
    name: "小飞鸽-联想PC",
    locations: 1,
    permissions: ["Cloud Report Full Access", "Cloud Report Open API Full Access", "Cloud Report - Payment Internal Access"],
    gradient: "from-[#e4aeb9] via-[#ecdadd] to-[#9fc1f7]",
  },
] as const;

let legacyBDialogDismissedForVisit = false;

export function beginLegacyBVisit(): void {
  legacyBDialogDismissedForVisit = false;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PERSON_ICON = `<svg class="size-7 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7.2" r="4.1"/><path d="M4.8 18.2c0-3.8 3.2-6.2 7.2-6.2s7.2 2.4 7.2 6.2c0 1.8-2.9 3.3-7.2 3.3s-7.2-1.5-7.2-3.3Z"/></svg>`;

const BRAND_MARK = `<svg class="size-full" viewBox="0 0 96 96" fill="none" aria-hidden="true"><circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8"/><path d="M28 41 43 26l12 12-9 9 10 10 9-9 11 11-22 22-27-27 10-10 17 17" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function renderMerchantCard(merchant: LegacyBMerchant): string {
  const locations = `${merchant.locations} Locations`;
  return `
    <li class="min-w-0">
      <article class="relative min-h-[340px] overflow-hidden rounded-[20px] bg-gradient-to-br ${merchant.gradient} px-12 py-7 text-[#100044] sm:min-h-[300px] sm:px-12 sm:py-7 lg:min-h-[340px]">
        <div class="pointer-events-none absolute -bottom-20 -right-12 size-[390px] rotate-[15deg] text-[#7c77bb]/10" aria-hidden="true">${BRAND_MARK}</div>
        <div class="relative z-10">
          <p class="text-lg font-medium text-white">${escapeHtml(locations)}</p>
          <h2 class="mt-5 truncate text-[clamp(2rem,3vw,3rem)] font-black leading-tight tracking-[-0.035em]">${escapeHtml(merchant.name)}</h2>
          <div class="mt-4 flex items-start gap-4">
            <div class="mt-1 text-[#160052]">${PERSON_ICON}</div>
            <ul class="min-w-0 flex-1 space-y-1 font-serif text-base sm:text-lg">
              ${merchant.permissions.map((permission) => `<li class="truncate border-b border-white/25 bg-white/15 px-2 py-2 leading-6">${escapeHtml(permission)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </article>
    </li>`;
}

function renderLegacyBUpgradeDialog(): string {
  return `
    <div data-legacy-b-upgrade-dialog class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div data-legacy-b-upgrade-backdrop class="absolute inset-0 bg-[#080018]/70 backdrop-blur-[2px]" aria-hidden="true"></div>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="legacy-b-upgrade-title"
        aria-describedby="legacy-b-upgrade-description"
        class="relative w-full max-w-[520px] rounded-3xl bg-white p-6 text-[#160052] shadow-2xl sm:p-8"
      >
        <div class="flex size-12 items-center justify-center rounded-2xl bg-[#fff3cd] text-[#160052]" aria-hidden="true">
          <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
          </svg>
        </div>
        <h2 id="legacy-b-upgrade-title" class="mt-5 text-2xl font-extrabold tracking-[-0.02em] sm:text-[1.75rem]">全新后台已上线</h2>
        <p id="legacy-b-upgrade-description" class="mt-3 text-base leading-7 text-[#51466d]">操作更顺、加载更快、数据更清晰。您当前的旧版入口即将停止维护，建议现在花 1 分钟切换体验。</p>
        <p data-legacy-b-upgrade-error role="alert" class="mt-3 hidden rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">暂无可切换的品牌，请联系管理员</p>
        <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" data-legacy-b-upgrade-dismiss class="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8d3e3] bg-white px-5 py-2.5 text-sm font-semibold text-[#30234f] transition-colors hover:bg-[#f7f5fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5ca7] focus-visible:ring-offset-2">暂不切换</button>
          <button type="button" data-legacy-b-upgrade-confirm class="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#160052] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2a1267] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d5ca7] focus-visible:ring-offset-2">立即切换到新版</button>
        </div>
      </section>
    </div>`;
}

function bindLegacyBUpgradeDialog(onMount: () => void): void {
  const dialogRoot = document.querySelector<HTMLElement>("[data-legacy-b-upgrade-dialog]");
  const confirmButton = dialogRoot?.querySelector<HTMLButtonElement>("[data-legacy-b-upgrade-confirm]");
  const dismissButton = dialogRoot?.querySelector<HTMLButtonElement>("[data-legacy-b-upgrade-dismiss]");
  const errorMessage = dialogRoot?.querySelector<HTMLElement>("[data-legacy-b-upgrade-error]");
  const pageContent = document.querySelector<HTMLElement>("[data-legacy-b-page-content]");
  const demoSwitch = document.querySelector<HTMLElement>("[data-demo-switch-root]");
  if (!dialogRoot || !confirmButton || !dismissButton) return;

  pageContent?.setAttribute("inert", "");
  pageContent?.setAttribute("aria-hidden", "true");
  demoSwitch?.setAttribute("inert", "");
  demoSwitch?.setAttribute("aria-hidden", "true");

  const dismissDialog = (): void => {
    legacyBDialogDismissedForVisit = true;
    dialogRoot.remove();
    pageContent?.removeAttribute("inert");
    pageContent?.removeAttribute("aria-hidden");
    demoSwitch?.removeAttribute("inert");
    demoSwitch?.removeAttribute("aria-hidden");
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-legacy-b-heading]")?.focus({ preventScroll: true });
    });
  };

  dialogRoot.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismissDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const target = event.target as Node | null;
    if (event.shiftKey && target === dismissButton) {
      event.preventDefault();
      confirmButton.focus();
    } else if (!event.shiftKey && target === confirmButton) {
      event.preventDefault();
      dismissButton.focus();
    }
  });

  dismissButton.addEventListener("click", dismissDialog);

  confirmButton.addEventListener("click", () => {
    if (switchLegacyBToBrandView(onMount)) return;
    errorMessage?.classList.remove("hidden");
    confirmButton.focus({ preventScroll: true });
  });
  requestAnimationFrame(() => confirmButton.focus({ preventScroll: true }));
}

export function mountLegacyBShell(): string {
  return `
    <div class="min-h-dvh w-full overflow-x-hidden bg-[#10002f] text-white">
      <div data-legacy-b-page-content class="mx-auto min-h-dvh w-full max-w-[1480px] px-5 pb-16 pt-5 sm:px-8 lg:px-10">
        <header class="flex items-start justify-between gap-6">
          <div class="flex items-center gap-3" aria-label="MenuSifu">
            <div class="flex size-12 items-center justify-center rounded-[10px] bg-[#ffbf00] p-1.5 text-[#100044]">${BRAND_MARK}</div>
            <span class="text-[2.125rem] font-extrabold tracking-[-0.03em]">MenuSifu</span>
          </div>
          <div class="flex items-center gap-3 pt-2 text-base font-semibold">
            <span class="text-white">${PERSON_ICON}</span>
            <span>Fei Chen</span>
          </div>
        </header>

        <main class="pt-7 sm:pt-5">
          <div class="mx-auto w-full max-w-[193px]">
            <p class="text-2xl font-bold">请选择</p>
            <h1 tabindex="-1" data-legacy-b-heading class="mt-2 whitespace-nowrap text-[3.25rem] font-black leading-none tracking-[-0.05em] focus:outline-none">您的商户</h1>
          </div>
          <ul class="mt-24 grid grid-cols-1 gap-5 sm:-mx-2.5 sm:mt-[6.5rem] lg:grid-cols-2" aria-label="商户列表">
            ${LEGACY_B_MERCHANTS.map(renderMerchantCard).join("")}
          </ul>
        </main>
      </div>
      ${legacyBDialogDismissedForVisit ? "" : renderLegacyBUpgradeDialog()}
    </div>`;
}

export function bindLegacyBShell(onMount: () => void): void {
  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);
  bindLegacyBUpgradeDialog(onMount);
}
