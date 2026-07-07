/**
 * 门店管理 · 品牌标识素材：餐厅 LOGO（seq 433）。
 * 支持本地上传或从图片素材库选择（与屏保上传逻辑共用 material_images）。
 */

import {
  addMaterialImage,
  compressImageFile,
  filterMaterialImagesByCategory,
  readImageFileAsDataUrl,
  readMaterialCategories,
  readMaterialImages,
  type MaterialImageRecord,
} from "./image-material-library";
import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";
import type { ModuleSettingCatalogItem } from "./module-settings-catalog";

export const STORE_RESTAURANT_LOGO_SEQ = 433;
export const STORE_RESTAURANT_LOGO_FIELD_ID = "433-restaurant-logo";

const ASSET_CENTER_MATERIALS_PATH = "/asset-center/materials";
const LOGO_MAX_BYTES = 1 * 1024 * 1024;
const LOGO_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif"]);

export type StoreRestaurantLogoValue = {
  dataUrl: string;
  source: "upload" | "library";
  materialId?: string;
  name?: string;
};

const BTN_PRIMARY =
  "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90";
const BTN_OUTLINE =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-muted";
const BTN_GHOST =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeLogoValue(raw: unknown): StoreRestaurantLogoValue | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<StoreRestaurantLogoValue>;
  if (typeof o.dataUrl !== "string" || !o.dataUrl) return null;
  return {
    dataUrl: o.dataUrl,
    source: o.source === "library" ? "library" : "upload",
    materialId: typeof o.materialId === "string" ? o.materialId : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
  };
}

export function readStoreRestaurantLogo(): StoreRestaurantLogoValue | null {
  return normalizeLogoValue(readModuleSettingJson<unknown>(STORE_RESTAURANT_LOGO_FIELD_ID, null));
}

export function writeStoreRestaurantLogo(value: StoreRestaurantLogoValue | null): void {
  writeModuleSettingJson(STORE_RESTAURANT_LOGO_FIELD_ID, value);
}

export function isStoreRestaurantLogoSeq(seq: number): boolean {
  return seq === STORE_RESTAURANT_LOGO_SEQ;
}

function renderLogoPreview(value: StoreRestaurantLogoValue | null): string {
  if (value?.dataUrl) {
    return `
      <div class="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
        <img
          src="${escapeHtml(value.dataUrl)}"
          alt=""
          class="size-24 rounded-lg border border-border bg-muted/30 object-contain p-1"
          data-store-logo-preview-img
        />
        <div class="min-w-0 text-xs text-muted-foreground">
          <p class="m-0 font-medium text-foreground">${escapeHtml(value.name ?? "餐厅 LOGO")}</p>
          <p class="mt-1 m-0">${value.source === "library" ? "来源：图片素材库" : "来源：本地上传"}</p>
        </div>
      </div>`;
  }
  return `
    <div
      class="flex size-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-center text-xs leading-snug text-muted-foreground"
      data-store-logo-preview-empty
    >
      暂未设置<br />LOGO
    </div>`;
}

function renderUploadSourceModal(): string {
  return `
    <div
      class="fixed inset-0 z-[80] hidden items-center justify-center bg-black/45 p-4"
      data-store-logo-upload-modal
      aria-hidden="true"
    >
      <div class="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="store-logo-upload-title">
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 id="store-logo-upload-title" class="text-sm font-semibold text-foreground">选择上传方式</h3>
          <button type="button" class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-store-logo-upload-close aria-label="关闭">×</button>
        </div>
        <div class="space-y-3 p-4">
          <div class="overflow-hidden rounded-lg border border-border">
            <button type="button" class="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50" data-store-logo-choose-local>
              <span class="text-2xl" aria-hidden="true">📁</span>
              <span>
                <span class="block text-sm font-medium text-foreground">本地上传</span>
                <span class="block text-xs text-muted-foreground">从电脑选择图片文件</span>
              </span>
            </button>
            <div class="border-t border-border bg-muted/30 px-4 py-3">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" class="size-4 rounded-sm accent-primary" data-store-logo-save-to-library />
                <span>同时保存到图片素材库</span>
              </label>
            </div>
          </div>
          <button type="button" class="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/50" data-store-logo-choose-library>
            <span class="text-2xl" aria-hidden="true">🖼️</span>
            <span>
              <span class="block text-sm font-medium text-foreground">素材库选择</span>
              <span class="block text-xs text-muted-foreground">从图片素材库中选择</span>
            </span>
          </button>
        </div>
      </div>
    </div>`;
}

function renderMaterialLibraryModal(): string {
  return `
    <div
      class="fixed inset-0 z-[90] hidden items-center justify-center bg-black/45 p-4"
      data-store-logo-library-modal
      aria-hidden="true"
    >
      <div class="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg" role="dialog" aria-modal="true" aria-labelledby="store-logo-library-title">
        <div class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h3 id="store-logo-library-title" class="text-sm font-semibold text-foreground">选择素材</h3>
          <button type="button" class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-store-logo-library-close aria-label="关闭">×</button>
        </div>
        <div class="flex min-h-0 flex-1">
          <div class="w-40 shrink-0 overflow-auto border-r border-border p-2" data-store-logo-library-categories></div>
          <div class="min-h-0 flex-1 overflow-auto p-4">
            <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5" data-store-logo-library-grid></div>
            <div class="hidden py-12 text-center text-sm text-muted-foreground" data-store-logo-library-empty>
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
          <span class="text-xs text-muted-foreground">已选择 <span class="font-medium text-foreground" data-store-logo-library-selected-count>0</span> 个素材</span>
          <div class="flex gap-2">
            <button type="button" class="${BTN_OUTLINE}" data-store-logo-library-cancel>取消</button>
            <button type="button" class="${BTN_PRIMARY}" data-store-logo-library-confirm>确定</button>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderStoreRestaurantLogoHtml(_item: ModuleSettingCatalogItem): string {
  const logo = readStoreRestaurantLogo();
  return `
    <div class="mt-3 space-y-3" data-store-restaurant-logo>
      <div data-store-logo-preview-slot>${renderLogoPreview(logo)}</div>
      <div class="flex flex-wrap items-center gap-2" data-store-logo-actions>
        <button type="button" class="${BTN_PRIMARY}" data-store-logo-change>${logo ? "更换 LOGO" : "上传 LOGO"}</button>
        ${logo ? `<button type="button" class="${BTN_GHOST}" data-store-logo-clear>清除</button>` : ""}
      </div>
      <p class="m-0 text-xs text-muted-foreground">支持 JPG、JPEG、PNG、GIF，单张不超过 1MB。</p>
      <input type="file" accept="image/jpeg,image/png,image/gif" class="hidden" data-store-logo-file-input />
      ${renderUploadSourceModal()}
      ${renderMaterialLibraryModal()}
    </div>`;
}

function refreshLogoPreview(host: HTMLElement): void {
  const logo = readStoreRestaurantLogo();
  const previewSlot = host.querySelector<HTMLElement>("[data-store-logo-preview-slot]");
  if (previewSlot) previewSlot.innerHTML = renderLogoPreview(logo);
  const changeBtn = host.querySelector<HTMLButtonElement>("[data-store-logo-change]");
  if (changeBtn) changeBtn.textContent = logo ? "更换 LOGO" : "上传 LOGO";
  const actions = host.querySelector<HTMLElement>("[data-store-logo-actions]");
  if (!actions) return;
  let clearBtn = actions.querySelector<HTMLButtonElement>("[data-store-logo-clear]");
  if (logo && !clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = BTN_GHOST;
    clearBtn.dataset.storeLogoClear = "";
    clearBtn.textContent = "清除";
    actions.appendChild(clearBtn);
  } else if (!logo && clearBtn) {
    clearBtn.remove();
  }
}

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

function renderMaterialCategoryButtons(host: HTMLElement, activeCategory: string): void {
  const list = host.querySelector<HTMLElement>("[data-store-logo-library-categories]");
  if (!list) return;
  const categories = readMaterialCategories();
  list.innerHTML = categories
    .map((cat) => {
      const active = cat === activeCategory;
      return `
        <button
          type="button"
          class="w-full rounded-md px-2 py-2 text-left text-sm transition-colors ${
            active
              ? "bg-primary/10 font-medium text-primary"
              : "text-foreground hover:bg-muted"
          }"
          data-store-logo-library-category="${escapeHtml(cat)}"
        >${escapeHtml(cat)}</button>`;
    })
    .join("");
}

function renderMaterialGrid(
  host: HTMLElement,
  category: string,
  selectedId: string | null,
): void {
  const grid = host.querySelector<HTMLElement>("[data-store-logo-library-grid]");
  const empty = host.querySelector<HTMLElement>("[data-store-logo-library-empty]");
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
          data-store-logo-material-id="${escapeHtml(img.id)}"
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

function updateLibrarySelectedCount(host: HTMLElement, count: number): void {
  const el = host.querySelector<HTMLElement>("[data-store-logo-library-selected-count]");
  if (el) el.textContent = String(count);
}

async function applyLocalLogoFile(host: HTMLElement, file: File): Promise<void> {
  if (!LOGO_ALLOWED_MIME_TYPES.has(file.type)) {
    window.alert("仅支持 JPG、JPEG、PNG、GIF 格式");
    return;
  }
  if (file.size > LOGO_MAX_BYTES) {
    window.alert("图片大小不能超过 1MB");
    return;
  }
  let dataUrl: string;
  try {
    dataUrl = await compressImageFile(file, 800, 800, 0.88);
  } catch {
    dataUrl = await readImageFileAsDataUrl(file);
  }
  const saveToLibrary = host.querySelector<HTMLInputElement>("[data-store-logo-save-to-library]")?.checked;
  let materialId: string | undefined;
  let name = file.name.replace(/\.[^.]+$/, "") || "餐厅 LOGO";
  if (saveToLibrary) {
    const saved = addMaterialImage(dataUrl, name);
    materialId = saved.id;
    name = saved.name;
  }
  writeStoreRestaurantLogo({
    dataUrl,
    source: saveToLibrary ? "library" : "upload",
    materialId,
    name,
  });
  refreshLogoPreview(host);
}

function bindHost(host: HTMLElement): void {
  if (host.dataset.storeLogoBound === "1") return;
  host.dataset.storeLogoBound = "1";

  let librarySelectedId: string | null = null;
  let libraryActiveCategory = readMaterialCategories()[0] ?? "全部";

  const getUploadModal = () => host.querySelector<HTMLElement>("[data-store-logo-upload-modal]");
  const getLibraryModal = () => host.querySelector<HTMLElement>("[data-store-logo-library-modal]");

  function openLibraryModal(): void {
    librarySelectedId = null;
    libraryActiveCategory = readMaterialCategories()[0] ?? "全部";
    renderMaterialCategoryButtons(host, libraryActiveCategory);
    renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
    updateLibrarySelectedCount(host, 0);
    openModal(getLibraryModal());
  }

  host.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    if (target.closest("[data-store-logo-change]")) {
      openModal(getUploadModal());
      return;
    }
    if (target.closest("[data-store-logo-clear]")) {
      writeStoreRestaurantLogo(null);
      refreshLogoPreview(host);
      return;
    }
    if (target.closest("[data-store-logo-upload-close]")) {
      closeModal(getUploadModal());
      return;
    }
    if (target.closest("[data-store-logo-upload-modal]") === getUploadModal() && target === getUploadModal()) {
      closeModal(getUploadModal());
      return;
    }
    if (target.closest("[data-store-logo-choose-local]")) {
      closeModal(getUploadModal());
      host.querySelector<HTMLInputElement>("[data-store-logo-file-input]")?.click();
      return;
    }
    if (target.closest("[data-store-logo-choose-library]")) {
      closeModal(getUploadModal());
      openLibraryModal();
      return;
    }
    if (target.closest("[data-store-logo-library-close]") || target.closest("[data-store-logo-library-cancel]")) {
      closeModal(getLibraryModal());
      return;
    }
    if (target.closest("[data-store-logo-library-modal]") === getLibraryModal() && target === getLibraryModal()) {
      closeModal(getLibraryModal());
      return;
    }
    const categoryBtn = target.closest<HTMLElement>("[data-store-logo-library-category]");
    if (categoryBtn) {
      libraryActiveCategory = categoryBtn.getAttribute("data-store-logo-library-category") ?? "全部";
      renderMaterialCategoryButtons(host, libraryActiveCategory);
      renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
      return;
    }
    const materialBtn = target.closest<HTMLElement>("[data-store-logo-material-id]");
    if (materialBtn) {
      librarySelectedId = materialBtn.getAttribute("data-store-logo-material-id");
      renderMaterialGrid(host, libraryActiveCategory, librarySelectedId);
      updateLibrarySelectedCount(host, librarySelectedId ? 1 : 0);
      return;
    }
    if (target.closest("[data-store-logo-library-confirm]")) {
      if (!librarySelectedId) {
        window.alert("请选择一个素材");
        return;
      }
      const material = readMaterialImages().find((m) => m.id === librarySelectedId);
      if (!material) {
        window.alert("素材不存在或已删除");
        return;
      }
      writeStoreRestaurantLogo({
        dataUrl: material.url,
        source: "library",
        materialId: material.id,
        name: material.name,
      });
      closeModal(getLibraryModal());
      refreshLogoPreview(host);
    }
  });

  host.addEventListener("change", async (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.matches("[data-store-logo-file-input]")) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      await applyLocalLogoFile(host, file);
    } catch {
      window.alert("图片读取失败，请重试");
    }
  });

  host.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeModal(getUploadModal());
    closeModal(getLibraryModal());
  });
}

export function bindStoreRestaurantLogoControls(): void {
  document.querySelectorAll<HTMLElement>("[data-store-restaurant-logo]").forEach(bindHost);
}
