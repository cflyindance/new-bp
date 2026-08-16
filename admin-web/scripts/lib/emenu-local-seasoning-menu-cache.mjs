import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function menuCacheKeyForHost(host) {
  const normalized = String(host || "").trim().replace(/\/+$/, "").toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

function cachePath(cacheDir, host) {
  return path.join(cacheDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(host)}.json`);
}

export function readMenuCache(cacheDir, host) {
  const filePath = cachePath(cacheDir, host);
  if (!fs.existsSync(filePath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!parsed?.view?.products || !parsed?.view?.menuGroups) return null;
    return parsed.view;
  } catch {
    return null;
  }
}

export function writeMenuCache(cacheDir, host, view) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = cachePath(cacheDir, host);
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const payload = {
    host: String(host || "").trim().replace(/\/+$/, ""),
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
