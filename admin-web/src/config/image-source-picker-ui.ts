/**
 * 公共图片选择：本地上传 / 素材库选择（与门店 LOGO、品牌图片等共用）。
 */

import {
  addMaterialImage,
  compressImageFile,
  filterMaterialImagesByCategory,
  readImageFileAsDataUrl,
  readMaterialCategories,
  readMaterialImages,
} from "./image-material-library";

const ASSET_CENTER_MATERIALS_PATH = "/asset-center/materials";
const DEFAULT_MAX_BYTES = 1 * 1024 * 1024;
const DEFAULT_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/jpg", "image/gif"]);

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";
const BTN_OUTLINE =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ImageSourcePickerResult = {
  dataUrl: string;
  source: "upload" | "library";
  materialId?: string;
  name?: string;
};

export type ImageSourcePickerOptions = {
  /** 选择结果回调 */
  onSelect: (result: ImageSourcePickerResult) => void;
  /** 错误提示（勿用浏览器 alert；默认忽略） */
  onError?: (message: string) => void;
  maxBytes?: number;
  allowedMimeTypes?: ReadonlySet<string>;
  /** 弹层 z-index 基值，素材库为 base+10 */
  zIndexBase?: number;
};

function openModal(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove("hidden");
  el.classList.add("flex");
  el.removeAttribute("aria-hidden");
}

function closeModal(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("flex");
  el.setAttribute("aria-hidden", "true");
}

/** 渲染「本地上传 / 素材库」双弹层 HTML，挂到宿主容器内 */
export function renderImageSourcePickerModalsHtml(_opts?: { zIndexBase?: number }): string {
  return `
    <input type="file" accept="image/jpeg,image/png,image/jpg,image/gif" class="hidden" data-image-source-file-input />
    <div
      class="fixed inset-0 z-[120] hidden items-center justify-center bg-black/45 p-4"
      data-image-source-upload-modal
      aria-hidden="true"
    >
      <div class="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="image-source-upload-title">
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 id="image-source-upload-title" class="text-sm font-semibold text-foreground">选择上传方式</h3>
          <button type="button" class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-image-source-upload-close aria-label="关闭">×</button>
        </div>
        <div class="space-y-3 p-4">
          <div class="overflow-hidden rounded-lg border border-border">
            <button type="button" class="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50" data-image-source-choose-local>
              <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-lg" aria-hidden="true">↑</span>
              <span>
                <span class="block text-sm font-medium text-foreground">本地上传</span>
                <span class="block text-xs text-muted-foreground">从电脑选择图片文件</span>
              </span>
            </button>
            <div class="border-t border-border bg-muted/30 px-4 py-3">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" class="size-4 rounded-sm accent-primary" data-image-source-save-to-library />
                <span>同时保存到图片素材库</span>
              </label>
            </div>
          </div>
          <button type="button" class="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/50" data-image-source-choose-library>
            <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-lg" aria-hidden="true">▦</span>
            <span>
              <span class="block text-sm font-medium text-foreground">素材库选择</span>
              <span class="block text-xs text-muted-foreground">从图片素材库中选择</span>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div
      class="fixed inset-0 z-[130] hidden items-center justify-center bg-black/45 p-4"
      data-image-source-library-modal
      aria-hidden="true"
    >
      <div class="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="image-source-library-title">
        <div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h3 id="image-source-library-title" class="text-sm font-semibold text-foreground">选择素材</h3>
          <button type="button" class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-image-source-library-close aria-label="关闭">×</button>
        </div>
        <div class="flex min-h-0 flex-1">
          <div class="w-40 shrink-0 overflow-auto border-r border-border p-2" data-image-source-library-categories></div>
          <div class="min-h-0 flex-1 overflow-auto p-4">
            <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5" data-image-source-library-grid></div>
            <div class="hidden py-12 text-center text-sm text-muted-foreground" data-image-source-library-empty>
              <p class="m-0">该分类暂无素材</p>
              <p class="mt-2 m-0 text-xs">
                请先在
                <a href="#${ASSET_CENTER_MATERIALS_PATH}" class="font-medium text-primary hover:underline">素材中心 · 图片素材</a>
                中上传
              </p>
            </div>
          </div>
        </div>
        <div class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span class="text-xs text-muted-foreground">已选择 <span class="font-medium text-foreground" data-image-source-library-selected-count>0</span> 个素材</span>
          <div class="flex gap-2">
            <button type="button" class="${BTN_OUTLINE}" data-image-source-library-cancel>取消</button>
            <button type="button" class="${BTN_PRIMARY}" data-image-source-library-confirm>确定</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderCategoryButtons(host: HTMLElement, activeCategory: string): void {
  const list = host.querySelector<HTMLElement>("[data-image-source-library-categories]");
  if (!list) return;
  list.innerHTML = readMaterialCategories()
    .map((cat) => {
      const active = cat === activeCategory;
      return `
        <button
          type="button"
          class="w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
            active ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted"
          }"
          data-image-source-library-category="${escapeHtml(cat)}"
        >${escapeHtml(cat)}</button>`;
    })
    .join("");
}

function renderMaterialGrid(host: HTMLElement, category: string, selectedId: string | null): void {
  const grid = host.querySelector<HTMLElement>("[data-image-source-library-grid]");
  const empty = host.querySelector<HTMLElement>("[data-image-source-library-empty]");
  if (!grid || !empty) return;
  const images = filterMaterialImagesByCategory(readMaterialImages(), category);
  if (images.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = images
    .map((img) => {
      const selected = selectedId === img.id;
      return `
        <button
          type="button"
          class="group relative overflow-hidden rounded-lg border text-left transition-colors ${
            selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
          }"
          data-image-source-material-id="${escapeHtml(img.id)}"
          title="${escapeHtml(img.name)}"
        >
          <img src="${escapeHtml(img.url)}" alt="" class="aspect-square w-full object-cover" />
          <span class="block truncate px-2 py-1.5 text-xs text-foreground">${escapeHtml(img.name)}</span>
          ${
            selected
              ? '<span class="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">已选</span>'
              : ""
          }
        </button>`;
    })
    .join("");
}

function updateSelectedCount(host: HTMLElement, count: number): void {
  const el = host.querySelector<HTMLElement>("[data-image-source-library-selected-count]");
  if (el) el.textContent = String(count);
}

/** 打开公共「选择上传方式」弹层（宿主内需已渲染 renderImageSourcePickerModalsHtml） */
export function openImageSourcePicker(host: HTMLElement): void {
  openModal(host.querySelector<HTMLElement>("[data-image-source-upload-modal]"));
}

/**
 * 在宿主上绑定公共图片选择（幂等）。
 * 触发方式：调用 openImageSourcePicker(host)，或点击宿主内 [data-image-source-open]。
 */
export function bindImageSourcePicker(host: HTMLElement, options: ImageSourcePickerOptions): void {
  if (host.dataset.imageSourcePickerBound === "1") return;
  host.dataset.imageSourcePickerBound = "1";

  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const allowed = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME;
  const reportError = (msg: string) => options.onError?.(msg);

  let librarySelectedId: string | null = null;
  let libraryActiveCategory = readMaterialCategories()[0] ?? "全部";

  const getUploadModal = () => host.querySelector<HTMLElement>("[data-image-source-upload-modal]");
  const getLibraryModal = () => host.querySelector<HTMLElement>("[data-image-source-library-modal]");
  const getFileInput = () => host.querySelector<HTMLInputElement>("[data-image-source-file-input]");

  function openLibraryModal(): void {
    librarySelectedId = null;
    libraryActiveCategory = readMaterialCategories()[0] ?? "全部";
    renderCategoryButtons(host, libraryActiveCategory);
    renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
    updateSelectedCount(host, 0);
    openModal(getLibraryModal());
  }

  async function applyLocalFile(file: File): Promise<void> {
    const mime = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!allowed.has(file.type) && !allowed.has(mime)) {
      reportError("仅支持 JPG、JPEG、PNG、GIF 格式");
      return;
    }
    if (file.size > maxBytes) {
      reportError("图片大小不能超过 1MB");
      return;
    }
    let dataUrl: string;
    try {
      dataUrl = await compressImageFile(file, 800, 800, 0.88);
    } catch {
      dataUrl = await readImageFileAsDataUrl(file);
    }
    const saveToLibrary = host.querySelector<HTMLInputElement>("[data-image-source-save-to-library]")?.checked;
    let materialId: string | undefined;
    let name = file.name.replace(/\.[^.]+$/, "") || "图片";
    if (saveToLibrary) {
      const saved = addMaterialImage(dataUrl, name);
      materialId = saved.id;
      name = saved.name;
    }
    options.onSelect({
      dataUrl,
      source: saveToLibrary ? "library" : "upload",
      materialId,
      name,
    });
  }

  host.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-image-source-open]")) {
      openImageSourcePicker(host);
      return;
    }
    if (target.closest("[data-image-source-upload-close]")) {
      closeModal(getUploadModal());
      return;
    }
    const uploadModal = getUploadModal();
    if (uploadModal && target === uploadModal) {
      closeModal(uploadModal);
      return;
    }
    if (target.closest("[data-image-source-choose-local]")) {
      closeModal(getUploadModal());
      getFileInput()?.click();
      return;
    }
    if (target.closest("[data-image-source-choose-library]")) {
      closeModal(getUploadModal());
      openLibraryModal();
      return;
    }
    if (
      target.closest("[data-image-source-library-close]") ||
      target.closest("[data-image-source-library-cancel]")
    ) {
      closeModal(getLibraryModal());
      return;
    }
    const libraryModal = getLibraryModal();
    if (libraryModal && target === libraryModal) {
      closeModal(libraryModal);
      return;
    }
    const categoryBtn = target.closest<HTMLElement>("[data-image-source-library-category]");
    if (categoryBtn) {
      libraryActiveCategory =
        categoryBtn.getAttribute("data-image-source-library-category") ?? "全部";
      renderCategoryButtons(host, libraryActiveCategory);
      renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
      return;
    }
    const materialBtn = target.closest<HTMLElement>("[data-image-source-material-id]");
    if (materialBtn) {
      librarySelectedId = materialBtn.getAttribute("data-image-source-material-id");
      renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
      updateSelectedCount(host, librarySelectedId ? 1 : 0);
      return;
    }
    if (target.closest("[data-image-source-library-confirm]")) {
      if (!librarySelectedId) {
        reportError("请选择一个素材");
        return;
      }
      const material = readMaterialImages().find((m) => m.id === librarySelectedId);
      if (!material) {
        reportError("素材不存在或已删除");
        return;
      }
      options.onSelect({
        dataUrl: material.url,
        source: "library",
        materialId: material.id,
        name: material.name,
      });
      closeModal(getLibraryModal());
    }
  });

  host.addEventListener("change", async (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-image-source-file-input]")) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      await applyLocalFile(file);
    } catch {
      reportError("图片读取失败，请重试");
    }
  });

  host.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const libraryModal = getLibraryModal();
    if (libraryModal && !libraryModal.classList.contains("hidden")) {
      e.preventDefault();
      closeModal(libraryModal);
      return;
    }
    const uploadModal = getUploadModal();
    if (uploadModal && !uploadModal.classList.contains("hidden")) {
      e.preventDefault();
      closeModal(uploadModal);
    }
  });
}
