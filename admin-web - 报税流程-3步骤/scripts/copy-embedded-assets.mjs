import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(projectRoot, "dist");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(distDir)) {
  throw new Error(`[copy-embedded-assets] dist not found: ${distDir}`);
}

spawnSync(process.execPath, ["scripts/stash-emenu-pro-for-build.mjs", "restore"], {
  cwd: projectRoot,
  stdio: "inherit",
});

const emenuIconSrc = path.resolve(projectRoot, "dist", "emenu-pro", "images");
const emenuIconDest = path.resolve(distDir, "kpos", "emenuPro", "images");
if (fs.existsSync(emenuIconSrc)) {
  fs.rmSync(emenuIconDest, { recursive: true, force: true });
  copyRecursive(emenuIconSrc, emenuIconDest);
  console.log("[copy-embedded-assets] Copied: kpos/emenuPro/images");
} else {
  console.warn("[copy-embedded-assets] Skip missing directory: dist/emenu-pro/images");
}
