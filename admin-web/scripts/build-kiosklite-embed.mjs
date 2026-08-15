/**
 * Build dist/kiosklite for iframe embed (relative asset base) into dist/kiosklite/.embed-build.
 * Keeps source tree intact for local development.
 *
 * Usage:
 *   node scripts/build-kiosklite-embed.mjs
 *   node scripts/build-kiosklite-embed.mjs --skip-install
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "dist", "kiosklite");
const embedDir = path.join(appDir, ".embed-build");
const skipInstall = process.argv.includes("--skip-install");
const EMBED_BASE = "./";

function fail(message) {
  console.error(`[build-kiosklite-embed] ${message}`);
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

if (!fs.existsSync(path.join(appDir, "package.json"))) {
  fail(`Missing kiosklite source at ${appDir}`);
}

if (!skipInstall) {
  console.log("[build-kiosklite-embed] Installing dependencies in dist/kiosklite …");
  // package engines pin node <23; allow local Node 23 for embed builds
  run("npm", ["install", "--engine-strict=false"], appDir, {
    npm_config_engine_strict: "false",
  });
}

if (fs.existsSync(embedDir)) {
  fs.rmSync(embedDir, { recursive: true, force: true });
}

console.log(`[build-kiosklite-embed] Building with base=${EMBED_BASE} → .embed-build …`);
run(
  "npx",
  ["vite", "build", "--mode", "production", "--base", EMBED_BASE, "--outDir", ".embed-build"],
  appDir,
);

const postbuildUrl = pathToFileURL(path.join(appDir, "scripts", "postbuild.mjs")).href;
const { runPostbuild } = await import(postbuildUrl);
await runPostbuild({ distDir: embedDir, mode: "production" });

if (!fs.existsSync(path.join(embedDir, "index.html"))) {
  fail(`Build output missing index.html at ${embedDir}`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf8"));
fs.writeFileSync(
  path.join(embedDir, ".kiosk-embed-build.json"),
  `${JSON.stringify(
    {
      base: EMBED_BASE,
      builtAt: new Date().toISOString(),
      source: "dist/kiosklite",
      packageVersion: pkg.version,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log("[build-kiosklite-embed] Done. Entry: ./kiosklite/index.html (from dist/kiosklite/.embed-build)");
