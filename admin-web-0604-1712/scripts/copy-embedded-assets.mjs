import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(projectRoot, "dist");

const EMBEDDED_DIRS = ["TipOut", "Configuration center"];

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

function copyDirToDist(dirName) {
  const src = path.resolve(projectRoot, dirName);
  const dest = path.resolve(distDir, dirName);

  if (!fs.existsSync(src)) {
    console.warn(`[copy-embedded-assets] Skip missing directory: ${dirName}`);
    return;
  }

  fs.rmSync(dest, { recursive: true, force: true });
  copyRecursive(src, dest);
  console.log(`[copy-embedded-assets] Copied: ${dirName}`);
}

if (!fs.existsSync(distDir)) {
  throw new Error(`[copy-embedded-assets] dist not found: ${distDir}`);
}

for (const dir of EMBEDDED_DIRS) {
  copyDirToDist(dir);
}

