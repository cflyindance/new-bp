import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MENU_PRODUCTS = ["EMENU", "KIOSK", "POS", "SDI"];

export function menuCacheKeyForHost(host) {
  const normalized = String(host || "").trim().replace(/\/+$/, "").toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

export function normalizeMenuProduct(value) {
  const raw = String(value || "EMENU").trim().toUpperCase();
  return MENU_PRODUCTS.includes(raw) ? raw : "EMENU";
}

function cachePath(cacheDir, host, product) {
  const prod = normalizeMenuProduct(product);
  return path.join(cacheDir, `emenu-local-menu-${menuCacheKeyForHost(host)}-${prod}.json`);
}

function legacyCachePath(cacheDir, host) {
  return path.join(cacheDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(host)}.json`);
}

function readCacheFile(filePath, product) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed?.view?.products || !parsed?.view?.menuGroups) return null;
    if (parsed.product && normalizeMenuProduct(parsed.product) !== product) return null;
    return parsed.view;
  } catch {
    return null;
  }
}

export function readMenuCache(cacheDir, host, product = "EMENU") {
  const prod = normalizeMenuProduct(product);
  const current = readCacheFile(cachePath(cacheDir, host, prod), prod);
  if (current) return current;
  if (prod === "EMENU") return readCacheFile(legacyCachePath(cacheDir, host), prod);
  return null;
}

export function writeMenuCache(cacheDir, host, view, product = "EMENU") {
  const prod = normalizeMenuProduct(product);
  fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = cachePath(cacheDir, host, prod);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const payload = {
    host: String(host || "").trim().replace(/\/+$/, ""),
    product: prod,
    savedAt: new Date().toISOString(),
    view,
  };
  try {
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
  }
  return view;
}
