/**
 * 通用页面内 Toast（替代 window.alert）
 */

export type AppToastVariant = "info" | "success" | "error";

const TOAST_ID = "app-toast";
const DEFAULT_DURATION_MS = 4000;

const VARIANT_CLASS: Record<AppToastVariant, string> = {
  info: "border-border",
  success: "border-primary/30",
  error: "border-destructive/40",
};

export function showAppToast(
  message: string,
  opts?: { variant?: AppToastVariant; durationMs?: number },
): void {
  if (typeof document === "undefined") return;

  const variant = opts?.variant ?? "info";
  const durationMs = opts?.durationMs ?? DEFAULT_DURATION_MS;
  const text = String(message ?? "").trim();
  if (!text) return;

  document.getElementById(TOAST_ID)?.remove();

  const toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.setAttribute("role", "status");
  toast.className = `fixed bottom-20 right-4 z-[10060] max-w-sm rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground shadow-lg ${VARIANT_CLASS[variant]}`;
  toast.textContent = text.length > 200 ? `${text.slice(0, 200)}…` : text;

  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), durationMs);
}
