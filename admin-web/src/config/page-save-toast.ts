/**
 * 页面保存并下发 · 成功提示
 */
const TOAST_DURATION_MS = 5000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function showPageSaveSuccessToast(batchId: string, changeCount: number): void {
  if (typeof document === "undefined") return;

  const existing = document.getElementById("page-save-success-toast");
  existing?.remove();

  const detailPath = `/settings/deployment-log/${encodeURIComponent(batchId)}`;
  const toast = document.createElement("div");
  toast.id = "page-save-success-toast";
  toast.setAttribute("role", "status");
  toast.className =
    "fixed bottom-20 right-4 z-[10050] max-w-sm rounded-lg border border-primary/30 bg-card px-4 py-3 text-sm text-card-foreground shadow-lg";
  toast.innerHTML = `
    <p class="font-medium text-foreground">已保存并下发</p>
    <p class="mt-1 text-xs text-muted-foreground">${changeCount} 项变更已提交同步</p>
    <a
      href="#${escapeHtml(detailPath)}"
      class="mt-2 inline-block text-xs font-medium text-primary hover:underline"
      data-page-save-toast-detail
    >查看下发记录</a>`;

  document.body.appendChild(toast);

  toast.querySelector("[data-page-save-toast-detail]")?.addEventListener("click", () => {
    toast.remove();
  });

  window.setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
