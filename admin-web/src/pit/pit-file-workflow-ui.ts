import { PitApiError } from "./pit-api-error";

export function escapePitFileText(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

export function formatPitBytes(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

export function formatPitDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function pitFileErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof PitApiError) return error.message;
  if (error instanceof Error && error.name !== "AbortError") return error.message;
  return fallback;
}

export function pitDownloadFileName(disposition: string | null, fallbackName: string): string {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition ?? "")?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition ?? "")?.[1];
  let candidate = plain || fallbackName;
  if (encoded) { try { candidate = decodeURIComponent(encoded); } catch { candidate = fallbackName; } }
  return candidate.replace(/[\\/\u0000-\u001f\u007f]+/g, "_").replace(/^\.+/, "").trim() || fallbackName;
}

export async function downloadPitResponse(response: Response, fallbackName: string): Promise<void> {
  const blob = await response.blob();
  const fileName = pitDownloadFileName(response.headers.get("content-disposition"), fallbackName);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
