/**
 * 构建前暂存 dist 内嵌静态资源，避免 vite emptyOutDir 清空后丢失。
 * SSOT：dist/TipOut、dist/Configuration center、dist/emenu-pro
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(projectRoot, "dist");
const stashRoot = path.resolve(projectRoot, ".cache", "embedded-assets-build-stash");
const mode = process.argv[2] === "restore" ? "restore" : "stash";

/** @type {readonly string[]} */
const EMBEDDED_DIST_DIRS = ["emenu-pro", "TipOut", "Configuration center"];

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

function stashEmbeddedDirs() {
  let stashed = 0;
  fs.rmSync(stashRoot, { recursive: true, force: true });
  for (const dirName of EMBEDDED_DIST_DIRS) {
    const src = path.resolve(distDir, dirName);
    if (!fs.existsSync(src)) {
      console.log(`[stash-embedded-assets] Skip stash: dist/${dirName} not found`);
      continue;
    }
    copyRecursive(src, path.resolve(stashRoot, dirName));
    stashed += 1;
    console.log(`[stash-embedded-assets] Stashed dist/${dirName}`);
  }
  if (stashed === 0) {
    console.log("[stash-embedded-assets] Nothing stashed");
  }
}

function restoreEmbeddedDirs() {
  if (!fs.existsSync(stashRoot)) {
    console.log("[stash-embedded-assets] Skip restore: stash not found");
    return;
  }
  for (const dirName of EMBEDDED_DIST_DIRS) {
    const src = path.resolve(stashRoot, dirName);
    const dest = path.resolve(distDir, dirName);
    if (!fs.existsSync(src)) continue;
    fs.rmSync(dest, { recursive: true, force: true });
    copyRecursive(src, dest);
    console.log(`[stash-embedded-assets] Restored dist/${dirName}`);
  }
}

if (mode === "stash") {
  stashEmbeddedDirs();
  process.exit(0);
}

restoreEmbeddedDirs();
