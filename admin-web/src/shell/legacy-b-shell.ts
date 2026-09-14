import { mountDemoSwitchFab } from "./demo-switch-control";
import { bindViewSwitchControl } from "./view-switch-control";

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

export function mountLegacyBShell(): string {
  return `
    <div class="min-h-dvh w-full overflow-x-hidden bg-[#10002f] text-white">
      <div class="mx-auto min-h-dvh w-full max-w-[1480px] px-5 pb-16 pt-5 sm:px-8 lg:px-10">
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
            <h1 class="mt-2 whitespace-nowrap text-[3.25rem] font-black leading-none tracking-[-0.05em]">您的商户</h1>
          </div>
          <ul class="mt-24 grid grid-cols-1 gap-5 sm:-mx-2.5 sm:mt-[6.5rem] lg:grid-cols-2" aria-label="商户列表">
            ${LEGACY_B_MERCHANTS.map(renderMerchantCard).join("")}
          </ul>
        </main>
      </div>
    </div>`;
}

export function bindLegacyBShell(onMount: () => void): void {
  mountDemoSwitchFab({ showVersionSwitch: false });
  bindViewSwitchControl(onMount);
}
