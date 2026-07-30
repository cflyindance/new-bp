/**
 * 云产品入口提示：点击已由云产品承载的中心 / 页面时，说明该能力通过路由配置接入。
 * 一级入口按 NAV_MODULES id 命中，二级入口按路由命中。
 */
interface CloudProductNotice {
  title: string;
  message: string;
}

/** 点击一级导航即提示的中心 */
const NAV_MODULE_NOTICES: Record<string, CloudProductNotice> = {
  "product-center-main": { title: "商品中心", message: "云产品-商品中心-通过路由配置" },
  members: { title: "会员中心", message: "云产品-会员中心-通过路由配置" },
  reviews: { title: "评价中心", message: "云产品-评价中心-通过路由配置" },
  reservations: { title: "预约等位中心", message: "云产品-云等位-通过路由配置" },
  "reports-finance": { title: "报表中心", message: "云产品-云报表-通过路由配置" },
  "gift-cards": { title: "礼品卡中心", message: "云产品-E-Card-通过路由配置" },
};

/** 点击二级入口才提示的页面 */
const NAV_PATH_NOTICES: Record<string, CloudProductNotice> = {
  "/promotions/campaigns": { title: "促销活动", message: "云产品-促销中心-通过路由配置" },
  "/print-templates/decoration": { title: "打印装修", message: "云产品-打印模板-通过路由配置" },
  "/marketing/campaigns": { title: "营销活动", message: "云产品-营销活动-通过路由配置" },
  "/marketing/manual": { title: "手动营销", message: "云产品-营销活动-通过路由配置" },
  "/marketing/screensaver": { title: "屏保", message: "云产品-云屏保-通过路由配置" },
  "/notifications/templates": { title: "消息模板", message: "云产品-消息中心-通过路由配置" },
  "/notifications/scene-config": { title: "消息配置", message: "云产品-消息中心-通过路由配置" },
  "/notifications/quota": { title: "消息额度", message: "云产品-消息中心-通过路由配置" },
};

let activeNotice: CloudProductNotice | null = null;
let clickDelegateBound = false;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function matchPathNotice(path: string): CloudProductNotice | null {
  for (const [prefix, notice] of Object.entries(NAV_PATH_NOTICES)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return notice;
  }
  return null;
}

function resolveNoticeFromClick(target: HTMLElement): CloudProductNotice | null {
  const link = target.closest<HTMLAnchorElement>('a[href^="#/"]');
  if (link) {
    const pathNotice = matchPathNotice(link.getAttribute("href")!.slice(1));
    if (pathNotice) return pathNotice;
  }
  const moduleRow = target.closest<HTMLElement>("[data-nav-module]");
  const moduleId = moduleRow?.getAttribute("data-nav-module") ?? "";
  return NAV_MODULE_NOTICES[moduleId] ?? null;
}

export function renderCloudProductRouteNoticeDialog(): string {
  if (!activeNotice) return "";
  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" data-cloud-product-notice-dialog role="dialog" aria-modal="true" aria-labelledby="cloud-product-notice-title">
      <button type="button" class="absolute inset-0 bg-black/40" data-cloud-product-notice-backdrop aria-label="关闭"></button>
      <div class="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 id="cloud-product-notice-title" class="text-base font-semibold">${escapeHtml(activeNotice.title)}</h2>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">${escapeHtml(activeNotice.message)}</p>
        <div class="mt-5 flex justify-end">
          <button type="button" data-cloud-product-notice-close class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">知道了</button>
        </div>
      </div>
    </div>`;
}

export function bindCloudProductRouteNoticeUi(remount: () => void): void {
  if (!clickDelegateBound) {
    clickDelegateBound = true;
    // 捕获阶段仅记录待提示内容；重挂载延后到导航 / 滑层自身处理完成之后
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (!target || target.closest("[data-cloud-product-notice-dialog]")) return;
        const notice = resolveNoticeFromClick(target);
        if (!notice) return;
        activeNotice = notice;
        setTimeout(remount, 0);
      },
      true,
    );
  }

  const dialog = document.querySelector<HTMLElement>("[data-cloud-product-notice-dialog]");
  if (!dialog || dialog.dataset.cloudProductNoticeBound === "1") return;
  dialog.dataset.cloudProductNoticeBound = "1";

  const close = () => {
    activeNotice = null;
    remount();
  };
  dialog.querySelector("[data-cloud-product-notice-backdrop]")?.addEventListener("click", close);
  dialog.querySelector("[data-cloud-product-notice-close]")?.addEventListener("click", close);
}
