/**
 * 图片素材库 localStorage（与 Configuration center / material.html、屏保页共用键名）。
 */

export const MATERIAL_IMAGES_STORAGE_KEY = "material_images";
export const MATERIAL_CATEGORIES_STORAGE_KEY = "material_categories";

export const DEFAULT_MATERIAL_CATEGORIES = ["全部", "屏保素材", "广告素材", "其他"] as const;

export type MaterialImageRecord = {
  id: string;
  name: string;
  category: string;
  url: string;
  tagColor?: string;
};

export function readMaterialCategories(): string[] {
  try {
    const raw = localStorage.getItem(MATERIAL_CATEGORIES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_MATERIAL_CATEGORIES];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_MATERIAL_CATEGORIES];
    return parsed.filter((c): c is string => typeof c === "string" && c.length > 0);
  } catch {
    return [...DEFAULT_MATERIAL_CATEGORIES];
  }
}

export function readMaterialImages(): MaterialImageRecord[] {
  try {
    const raw = localStorage.getItem(MATERIAL_IMAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeMaterialImage(item))
      .filter((item): item is MaterialImageRecord => item !== null);
  } catch {
    return [];
  }
}

export function writeMaterialImages(images: MaterialImageRecord[]): void {
  try {
    localStorage.setItem(MATERIAL_IMAGES_STORAGE_KEY, JSON.stringify(images));
  } catch {
    /* ignore quota */
  }
}

function normalizeMaterialImage(raw: unknown): MaterialImageRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<MaterialImageRecord>;
  if (typeof o.url !== "string" || !o.url) return null;
  return {
    id: typeof o.id === "string" && o.id ? o.id : `m${Date.now()}`,
    name: typeof o.name === "string" ? o.name : "未命名素材",
    category: typeof o.category === "string" ? o.category : "",
    url: o.url,
    tagColor: typeof o.tagColor === "string" ? o.tagColor : undefined,
  };
}

export function newMaterialImageId(): string {
  return `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

export function addMaterialImage(
  dataUrl: string,
  name?: string,
  category = "",
): MaterialImageRecord {
  const record: MaterialImageRecord = {
    id: newMaterialImageId(),
    name: name?.trim() || `图片_${new Date().toLocaleString()}`,
    category,
    url: dataUrl,
  };
  const images = readMaterialImages();
  images.unshift(record);
  writeMaterialImages(images);
  return record;
}

export function filterMaterialImagesByCategory(
  images: MaterialImageRecord[],
  category: string,
): MaterialImageRecord[] {
  if (category === "全部") return images;
  return images.filter((img) => img.category === category);
}

export function compressImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = (w * maxHeight) / h;
        h = maxHeight;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w));
      canvas.height = Math.max(1, Math.round(h));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image load failed"));
    };
    img.src = objectUrl;
  });
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}
