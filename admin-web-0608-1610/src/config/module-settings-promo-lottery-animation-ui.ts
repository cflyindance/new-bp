/**
 * 促销中心 · 抽奖活动 · 自定义抽奖动画（原型 seq 672）。
 */

import {
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";

export const PROMO_LOTTERY_CUSTOM_ANIM_SEQ = 672;

export const PROMO_LOTTERY_CUSTOM_ANIM_CONFIG_FIELD = "672-lottery-custom-anim-config";

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/x-ms-wmv",
  "image/gif",
]);

const ALLOWED_EXT = /\.(mp4|mov|avi|mkv|wmv|gif)$/i;

export type LotteryAnimMedia = {
  dataUrl: string;
  fileName: string;
  kind: "video" | "gif";
  mimeType: string;
};

export type LotteryCustomAnimConfig = {
  fullscreen: boolean;
  win: LotteryAnimMedia | null;
  lose: LotteryAnimMedia | null;
};

const DEFAULT_CONFIG: LotteryCustomAnimConfig = {
  fullscreen: false,
  win: null,
  lose: null,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPromoLotteryCustomAnimSeq(seq: number): boolean {
  return seq === PROMO_LOTTERY_CUSTOM_ANIM_SEQ;
}

export function readLotteryCustomAnimConfig(): LotteryCustomAnimConfig {
  const raw = readModuleSettingJson<Partial<LotteryCustomAnimConfig>>(
    PROMO_LOTTERY_CUSTOM_ANIM_CONFIG_FIELD,
    DEFAULT_CONFIG,
  );
  return {
    fullscreen: Boolean(raw.fullscreen),
    win: normalizeMedia(raw.win),
    lose: normalizeMedia(raw.lose),
  };
}

export function writeLotteryCustomAnimConfig(config: LotteryCustomAnimConfig): void {
  writeModuleSettingJson(PROMO_LOTTERY_CUSTOM_ANIM_CONFIG_FIELD, config);
}

function normalizeMedia(value: unknown): LotteryAnimMedia | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<LotteryAnimMedia>;
  if (typeof v.dataUrl !== "string" || !v.dataUrl) return null;
  return {
    dataUrl: v.dataUrl,
    fileName: typeof v.fileName === "string" ? v.fileName : "",
    kind: v.kind === "gif" ? "gif" : "video",
    mimeType: typeof v.mimeType === "string" ? v.mimeType : "",
  };
}

function detectMediaKind(file: File): "video" | "gif" | null {
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) return "gif";
  if (file.type.startsWith("video/") || ALLOWED_EXT.test(file.name)) return "video";
  return null;
}

function isAllowedFile(file: File): boolean {
  if (ALLOWED_MIME.has(file.type)) return true;
  return ALLOWED_EXT.test(file.name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}

function renderMediaPreview(media: LotteryAnimMedia | null): string {
  if (!media) {
    return `<span class="text-2xl font-light leading-none text-muted-foreground">+</span>`;
  }
  if (media.kind === "gif") {
    return `<img src="${escapeHtml(media.dataUrl)}" alt="" class="h-full w-full object-cover" />`;
  }
  return `<video src="${escapeHtml(media.dataUrl)}" class="h-full w-full object-cover" muted playsinline></video>`;
}

function renderUploadSlot(slot: "win" | "lose", label: string, media: LotteryAnimMedia | null, enabled: boolean): string {
  const disabledCls = enabled ? "" : " pointer-events-none opacity-50";
  const preview = renderMediaPreview(media);
  const fileHint = media?.fileName
    ? `<p class="mt-1 max-w-[8rem] truncate text-[10px] text-muted-foreground">${escapeHtml(media.fileName)}</p>`
    : "";
  return `
    <div class="space-y-1.5">
      <p class="m-0 text-sm text-foreground">${escapeHtml(label)}</p>
      <div class="relative inline-block">
        <button
          type="button"
          class="lottery-anim-upload-slot flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/[0.04]${disabledCls}"
          data-lottery-anim-upload="${slot}"
          aria-label="上传${escapeHtml(label)}"
          ${enabled ? "" : "disabled"}
        >
          ${preview}
        </button>
        ${
          media
            ? `<button
          type="button"
          class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-xs text-muted-foreground shadow hover:bg-destructive/10 hover:text-destructive"
          data-lottery-anim-remove="${slot}"
          aria-label="删除${escapeHtml(label)}"
        >×</button>`
            : ""
        }
      </div>
      ${fileHint}
      <input
        type="file"
        class="hidden"
        accept=".mp4,.mov,.avi,.mkv,.wmv,.gif,video/*,image/gif"
        data-lottery-anim-file="${slot}"
        ${enabled ? "" : "disabled"}
      />
    </div>`;
}

export function renderPromoLotteryCustomAnimPanelHtml(seq: number, on: boolean, enabled = on): string {
  const cfg = readLotteryCustomAnimConfig();
  const hidden = on ? "" : "hidden";
  return `
    <div
      class="mt-3 space-y-4 rounded-lg bg-muted/50 p-3 ${hidden}"
      data-lottery-custom-anim-panel="${seq}"
      ${on ? "" : 'aria-hidden="true"'}
    >
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="size-4 shrink-0 rounded border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-lottery-anim-fullscreen
          ${cfg.fullscreen ? "checked" : ""}
          ${enabled ? "" : "disabled"}
        />
        <span>动画全屏展示</span>
      </label>
      <div class="flex flex-wrap gap-6" data-lottery-custom-anim-editor>
        ${renderEditorInner(enabled)}
      </div>
      <p class="m-0 text-xs leading-relaxed text-muted-foreground">
        动画大小：5M 内；动画格式：MP4、MOV、AVI、MKV、WMV、GIF
      </p>
    </div>`;
}

export function setPromoLotteryCustomAnimPanelVisible(seq: number, visible: boolean): void {
  document.querySelectorAll<HTMLElement>(`[data-lottery-custom-anim-panel="${seq}"]`).forEach((panel) => {
    panel.classList.toggle("hidden", !visible);
    if (visible) panel.removeAttribute("aria-hidden");
    else panel.setAttribute("aria-hidden", "true");
  });
  document.querySelectorAll<HTMLElement>("[data-lottery-custom-anim-editor]").forEach((editor) => {
    editor.querySelectorAll<HTMLInputElement>("[data-lottery-anim-fullscreen]").forEach((cb) => {
      cb.disabled = !visible;
    });
    editor.querySelectorAll<HTMLButtonElement>("[data-lottery-anim-upload]").forEach((btn) => {
      btn.disabled = !visible;
      btn.classList.toggle("pointer-events-none", !visible);
      btn.classList.toggle("opacity-50", !visible);
    });
    editor.querySelectorAll<HTMLInputElement>("[data-lottery-anim-file]").forEach((input) => {
      input.disabled = !visible;
    });
  });
}

function renderEditorInner(enabled: boolean): string {
  const cfg = readLotteryCustomAnimConfig();
  return `
        ${renderUploadSlot("win", "中奖动画", cfg.win, enabled)}
        ${renderUploadSlot("lose", "未中奖动画", cfg.lose, enabled)}`;
}

function rerenderEditorPanel(panel: HTMLElement): void {
  const enabled = !panel.classList.contains("hidden");
  const editor = panel.querySelector<HTMLElement>("[data-lottery-custom-anim-editor]");
  if (!editor) return;
  editor.innerHTML = renderEditorInner(enabled);
}

async function handleFileSelected(slot: "win" | "lose", file: File): Promise<void> {
  if (!isAllowedFile(file)) {
    window.alert("仅支持 MP4、MOV、AVI、MKV、WMV、GIF 格式");
    return;
  }
  if (file.size > MAX_BYTES) {
    window.alert("动画大小不能超过 5M");
    return;
  }
  const kind = detectMediaKind(file);
  if (!kind) {
    window.alert("无法识别文件格式");
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  const cfg = readLotteryCustomAnimConfig();
  const media: LotteryAnimMedia = {
    dataUrl,
    fileName: file.name,
    kind,
    mimeType: file.type,
  };
  if (slot === "win") cfg.win = media;
  else cfg.lose = media;
  writeLotteryCustomAnimConfig(cfg);
}

export function bindPromoLotteryCustomAnimUpload(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-lottery-custom-anim-panel]").forEach((panel) => {
    if (panel.dataset.lotteryAnimBound === "1") return;
    panel.dataset.lotteryAnimBound = "1";

    panel.addEventListener("change", (e) => {
      const fullscreen = (e.target as HTMLElement).closest<HTMLInputElement>("[data-lottery-anim-fullscreen]");
      if (fullscreen) {
        const cfg = readLotteryCustomAnimConfig();
        cfg.fullscreen = fullscreen.checked;
        writeLotteryCustomAnimConfig(cfg);
        return;
      }
      const input = (e.target as HTMLElement).closest<HTMLInputElement>("[data-lottery-anim-file]");
      if (!input) return;
      const slot = input.getAttribute("data-lottery-anim-file") as "win" | "lose" | null;
      const file = input.files?.[0];
      input.value = "";
      if (!slot || !file) return;
      void handleFileSelected(slot, file)
        .then(() => {
          rerenderEditorPanel(panel);
        })
        .catch((err: unknown) => {
          window.alert(err instanceof Error ? err.message : "上传失败");
        });
    });

    panel.addEventListener("click", (e) => {
      const uploadBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-lottery-anim-upload]");
      if (uploadBtn) {
        const slot = uploadBtn.getAttribute("data-lottery-anim-upload");
        const input = panel.querySelector<HTMLInputElement>(`[data-lottery-anim-file="${slot}"]`);
        input?.click();
        return;
      }
      const removeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-lottery-anim-remove]");
      if (!removeBtn) return;
      const slot = removeBtn.getAttribute("data-lottery-anim-remove") as "win" | "lose" | null;
      if (!slot) return;
      const cfg = readLotteryCustomAnimConfig();
      if (slot === "win") cfg.win = null;
      else cfg.lose = null;
      writeLotteryCustomAnimConfig(cfg);
      rerenderEditorPanel(panel);
    });
  });
}

export function renderPromoLotteryCustomAnimRowHtml(
  item: ModuleSettingCatalogItem,
  renderToggleSwitch: (item: ModuleSettingCatalogItem) => string,
  readToggleOn: (seq: number) => boolean,
): string {
  const on = readToggleOn(item.seq);
  return `
        <li class="list-none" data-module-setting-row-seq="${item.seq}">
          <div class="border-b border-border px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex flex-col gap-1">
                <span class="text-sm font-medium text-card-foreground">${escapeHtml(item.title)}</span>
                ${
                  item.sceneDesc.trim()
                    ? `<p class="m-0 text-xs leading-relaxed text-muted-foreground">${escapeHtml(item.sceneDesc.trim())}</p>`
                    : ""
                }
              </div>
              <div class="shrink-0 pt-0.5">${renderToggleSwitch(item)}</div>
            </div>
            ${renderPromoLotteryCustomAnimPanelHtml(item.seq, on)}
          </div>
        </li>`;
}
