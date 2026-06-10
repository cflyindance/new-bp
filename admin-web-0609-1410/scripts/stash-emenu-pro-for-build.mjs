/**
 * 构建前暂存 dist/emenu-pro，避免 vite emptyOutDir 清空后丢失嵌入资源。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distEmenuPro = path.resolve(projectRoot, "dist", "emenu-pro");
const stashDir = path.resolve(projectRoot, ".cache", "emenu-pro-build-stash");
const mode = process.argv[2] === "restore" ? "restore" : "stash";

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (mode === "stash") {
  if (!fs.existsSync(distEmenuPro)) {
    console.log("[stash-emenu-pro] Skip stash: dist/emenu-pro not found");
    process.exit(0);
  }
  fs.rmSync(stashDir, { recursive: true, force: true });
  copyRecursive(distEmenuPro, stashDir);
  console.log("[stash-emenu-pro] Stashed dist/emenu-pro");
  process.exit(0);
}

if (!fs.existsSync(stashDir)) {
  console.log("[stash-emenu-pro] Skip restore: stash not found");
  process.exit(0);
}

fs.rmSync(distEmenuPro, { recursive: true, force: true });
copyRecursive(stashDir, distEmenuPro);
console.log("[stash-emenu-pro] Restored dist/emenu-pro");
