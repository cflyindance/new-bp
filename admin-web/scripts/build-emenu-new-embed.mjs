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
const EMBED_BASE = "./";

function fail(message) {
  console.error(`[build-emenu-new-embed] ${message}`);
  process.exit(1);
}

async function writeFileWithRetry(filePath, content, attempts = 20) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      fs.writeFileSync(filePath, content, "utf8");
      return;
    } catch (error) {
      const retryable = ["UNKNOWN", "EPERM", "EACCES", "EBUSY"].includes(
        error?.code,
      );
      if (!retryable || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
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

function normalizePagesAssetNames(dir) {
  const renames = [];
  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const source = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(source);
        continue;
      }
      if (!entry.name.startsWith("_")) continue;
      const targetName = `pages-${entry.name.slice(1)}`;
      const target = path.join(currentDir, targetName);
      fs.renameSync(source, target);
      renames.push([entry.name, targetName]);
    }
  };

  visit(dir);
  if (renames.length === 0) return;

  const replaceReferences = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const target = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        replaceReferences(target);
        continue;
      }
      if (!/\.(?:css|html|js|json|map)$/.test(entry.name)) continue;
      const source = fs.readFileSync(target, "utf8");
      const updated = renames.reduce(
        (content, [oldName, newName]) => content.replaceAll(oldName, newName),
        source,
      );
      if (updated !== source) fs.writeFileSync(target, updated, "utf8");
    }
  };

  replaceReferences(dir);
  console.log(`[build-emenu-new-embed] Renamed ${renames.length} Pages-incompatible asset(s).`);
}

if (!fs.existsSync(path.join(appDir, "package.json"))) {
  fail(`Missing emenu-new source at ${appDir}. Copy the app into vendor/emenu-new first.`);
}

if (!skipInstall) {
  console.log("[build-emenu-new-embed] Installing dependencies in vendor/emenu-new …");
  if (fs.existsSync(path.join(appDir, "yarn.lock"))) {
    const yarnRelease = path.join(appDir, ".yarn", "releases", "yarn-3.4.1.cjs");
    const yarnEnv = fs.existsSync(yarnRelease)
      ? {}
      : { YARN_RC_FILENAME: ".yarnrc.runtime.yml", YARN_NODE_LINKER: "node-modules" };
    run("yarn", ["install"], appDir, yarnEnv);
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
normalizePagesAssetNames(publishDir);
await writeFileWithRetry(
  path.join(publishDir, ".emenu-embed-build.json"),
  `${JSON.stringify({ base: EMBED_BASE, builtAt: new Date().toISOString(), source: "vendor/emenu-new" }, null, 2)}\n`,
);

console.log("[build-emenu-new-embed] Done. Entry: ./emenu-new/index.html");
