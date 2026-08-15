/**
 * Build vendor/emenu-new for iframe embed and publish into dist/emenu-new.
 *
 * Usage:
 *   node scripts/build-emenu-new-embed.mjs
 *   node scripts/build-emenu-new-embed.mjs --skip-install
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "vendor", "emenu-new");
const buildDir = path.join(appDir, "build");
const publishDir = path.join(root, "dist", "emenu-new");
const skipInstall = process.argv.includes("--skip-install");
const EMBED_BASE = "/emenu-new/";

function fail(message) {
  console.error(`[build-emenu-new-embed] ${message}`);
  process.exit(1);
}

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    fail(`Command failed (${command} ${args.join(" ")})`);
  }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
}

if (!fs.existsSync(path.join(appDir, "package.json"))) {
  fail(`Missing emenu-new source at ${appDir}. Copy the app into vendor/emenu-new first.`);
}

if (!skipInstall) {
  console.log("[build-emenu-new-embed] Installing dependencies in vendor/emenu-new …");
  if (fs.existsSync(path.join(appDir, "yarn.lock"))) {
    run("yarn", ["install"], appDir);
  } else {
    run("npm", ["install"], appDir);
  }
}

console.log(`[build-emenu-new-embed] Building with base=${EMBED_BASE} …`);
if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
run(
  "npx",
  ["vite", "build", "--base", EMBED_BASE],
  appDir,
  {
    VITE_ENABLE_IMAGEMIN: "false",
    VITE_BUILD_REPORT: "false",
    VITE_USE_PWA: "false",
    VITE_BUILD_COMPRESS: "none",
  },
);

if (!fs.existsSync(path.join(buildDir, "index.html"))) {
  fail(`Build output missing index.html at ${buildDir}`);
}

console.log(`[build-emenu-new-embed] Publishing to ${publishDir} …`);
emptyDir(publishDir);
copyRecursive(buildDir, publishDir);
fs.writeFileSync(
  path.join(publishDir, ".emenu-embed-build.json"),
  `${JSON.stringify({ base: EMBED_BASE, builtAt: new Date().toISOString(), source: "vendor/emenu-new" }, null, 2)}\n`,
  "utf8",
);

console.log("[build-emenu-new-embed] Done. Entry: ./emenu-new/index.html");
