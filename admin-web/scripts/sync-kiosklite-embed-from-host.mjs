/**
 * Seed dist/kiosklite/.embed-build from the local POS kiosklite build,
 * rewriting absolute /kpos/kiosklite → /kiosklite so admin-web can serve pages locally
 * while /kpos APIs still proxy to the host.
 *
 * Prefer `node scripts/build-kiosklite-embed.mjs` when npm install works.
 *
 * Usage:
 *   node scripts/sync-kiosklite-embed-from-host.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const embedDir = path.join(root, "dist", "kiosklite", ".embed-build");
const publicDir = path.join(root, "dist", "kiosklite", "public");
const hostBase = (process.env.EMENU_KPOS_PROXY_TARGET || "http://localhost:22080").replace(/\/$/, "");
const remotePrefix = "/kpos/kiosklite";
const localPrefix = "/kiosklite";

function fail(message) {
  console.error(`[sync-kiosklite-embed] ${message}`);
  process.exit(1);
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

/** Normalize any href/src under kiosklite into a remote path under /kpos/kiosklite */
function toRemotePath(ref) {
  const cleaned = ref.split("?")[0].split("#")[0].trim();
  if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("blob:")) return null;
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const u = new URL(cleaned);
      if (u.pathname.startsWith(`${remotePrefix}/`) || u.pathname === remotePrefix) {
        return u.pathname === remotePrefix ? `${remotePrefix}/` : u.pathname;
      }
    } catch {
      return null;
    }
    return null;
  }
  if (cleaned.startsWith(`${remotePrefix}/`) || cleaned === remotePrefix) {
    return cleaned === remotePrefix ? `${remotePrefix}/` : cleaned;
  }
  if (cleaned.startsWith(`${localPrefix}/`) || cleaned === localPrefix) {
    return cleaned.replace(localPrefix, remotePrefix);
  }
  // relative to kiosklite root: ./static/..., static/..., bridge.js
  if (cleaned.startsWith("../") || cleaned.startsWith("/")) return null;
  const rel = cleaned.replace(/^\.\//, "");
  if (!rel || rel.includes("://")) return null;
  return `${remotePrefix}/${rel}`;
}

function toLocalPath(remotePath) {
  const rel = remotePath.slice(remotePrefix.length).replace(/^\//, "") || "index.html";
  return path.join(embedDir, ...rel.split("/"));
}

function collectRefs(content) {
  const refs = new Set();
  const re = /(?:src|href)=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(content))) {
    const remote = toRemotePath(match[1]);
    if (remote) refs.add(remote);
  }
  const re2 = /["'](\/(?:kpos\/)?kiosklite\/[^"']+)["']/g;
  while ((match = re2.exec(content))) {
    const remote = toRemotePath(match[1]);
    if (remote) refs.add(remote);
  }
  return refs;
}

async function downloadRemote(remotePath) {
  const url =
    remotePath.endsWith("/") || remotePath === remotePrefix
      ? `${hostBase}${remotePrefix}/`
      : `${hostBase}${remotePath}`;
  const localPath = toLocalPath(remotePath.endsWith("/") ? `${remotePrefix}/index.html` : remotePath);
  ensureParent(localPath);
  const buf = await fetchBuffer(url);
  let out = buf;
  const lower = localPath.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".js") || lower.endsWith(".css") || lower.endsWith(".json") || lower.endsWith(".map")) {
    let text = buf.toString("utf8").split(remotePrefix).join(localPrefix);
    // Host HTML uses ../js/... relative to /kpos/kiosklite; under /kiosklite that becomes /js (404).
    // Point those shared host scripts at the POS /kpos/js tree via Vite proxy.
    if (lower.endsWith(".html")) {
      text = text.replace(/(["'])\.\.\/js\//g, `$1/kpos/js/`);
    }
    out = Buffer.from(text, "utf8");
    fs.writeFileSync(localPath, out);
    return text;
  }
  fs.writeFileSync(localPath, out);
  return "";
}

function enqueueManifestFiles(text, queue, seen) {
  try {
    const manifest = JSON.parse(text);
    const files = manifest.files ? Object.values(manifest.files) : Object.values(manifest);
    for (const f of files) {
      if (typeof f !== "string") continue;
      const remote = toRemotePath(f);
      if (remote && !seen.has(remote)) queue.push(remote);
    }
  } catch {
    /* ignore */
  }
}

if (fs.existsSync(embedDir)) {
  fs.rmSync(embedDir, { recursive: true, force: true });
}
fs.mkdirSync(embedDir, { recursive: true });

console.log(`[sync-kiosklite-embed] Fetching ${hostBase}${remotePrefix}/ …`);
let html;
try {
  html = await downloadRemote(`${remotePrefix}/`);
} catch (err) {
  fail(`Cannot reach POS kiosklite (${err.message}). Start the host or run build-kiosklite-embed.mjs.`);
}

const queue = [...collectRefs(html)];
const seen = new Set([`${remotePrefix}/`, `${remotePrefix}/index.html`]);
for (const extra of [
  `${remotePrefix}/version.json`,
  `${remotePrefix}/asset-manifest.json`,
  `${remotePrefix}/bridge.js`,
  `${remotePrefix}/favicon.ico`,
]) {
  if (!seen.has(extra)) queue.push(extra);
}

while (queue.length) {
  const remotePath = queue.shift();
  if (!remotePath || seen.has(remotePath)) continue;
  seen.add(remotePath);
  try {
    const text = await downloadRemote(remotePath);
    if (text) {
      for (const ref of collectRefs(text)) {
        if (!seen.has(ref)) queue.push(ref);
      }
      if (remotePath.endsWith("asset-manifest.json")) {
        enqueueManifestFiles(text, queue, seen);
      }
    }
    process.stdout.write(".");
  } catch (err) {
    console.warn(`\n[sync-kiosklite-embed] skip ${remotePath}: ${err.message}`);
  }
}

// Prefer local package version (same idea as emenu local version.json)
const localVersion = path.join(publicDir, "version.json");
if (fs.existsSync(localVersion)) {
  fs.copyFileSync(localVersion, path.join(embedDir, "version.json"));
  console.log("\n[sync-kiosklite-embed] Overlaid local public/version.json");
}

fs.writeFileSync(
  path.join(embedDir, ".kiosk-embed-build.json"),
  `${JSON.stringify(
    {
      base: `${localPrefix}/`,
      builtAt: new Date().toISOString(),
      source: "host-sync",
      host: `${hostBase}${remotePrefix}/`,
      note: "Seeded from POS build; replace via npm run build:kiosklite-embed when local build works",
    },
    null,
    2,
  )}\n`,
  "utf8",
);

if (!fs.existsSync(path.join(embedDir, "index.html"))) {
  fail("Sync finished but index.html is missing");
}
if (!fs.existsSync(path.join(embedDir, "static"))) {
  fail("Sync finished but static/ assets are missing — check host asset paths");
}

console.log(`\n[sync-kiosklite-embed] Done → ${embedDir}`);
