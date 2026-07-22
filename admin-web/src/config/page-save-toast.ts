/**
 * 页面保存并下发 · 成功提示
 */
const TOAST_DURATION_MS = 5000;

export function showPageSaveSuccessToast(_batchId: string, changeCount: number): void {
  if (typeof document === "undefined") return;

  const existing = document.getElementById("page-save-success-toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.id = "page-save-success-toast";
  toast.setAttribute("role", "status");
  toast.className =
    "fixed bottom-20 right-4 z-[10050] max-w-sm rounded-lg border border-primary/30 bg-card px-4 py-3 text-sm text-card-foreground shadow-lg";
  toast.innerHTML = `
    <p class="font-medium text-foreground">已保存并下发</p>
    <p class="mt-1 text-xs text-muted-foreground">${changeCount} 项变更已提交同步</p>`;

  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
