/**
 * 从 EMenu Pro dist 同步静态资源到 admin-web/dist/emenu-pro。
 * 保留 embedded-shell.css、embedded-mock-api.js，并写入带嵌入钩子的 index.html。
 *
 * 用法（在项目根或 admin-web 下）：
 *   node scripts/sync-emenu-pro-from-dist.mjs "f:/米聚/EMenu/emenuPro v0.0.7 (2)/emenuPro v0.0.7/dist"
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminWebRoot = path.resolve(__dirname, "..");
const targetDir = path.resolve(adminWebRoot, "dist", "emenu-pro");
const preserveNames = new Set([
  "embedded-shell.css",
  "embedded-mock-api.js",
  "embedded-block-icons.js",
  "embedded-viewport-fit.js",
  "embedded-header-more.js",
  "embedded-resolution-header.js",
  "images",
]);

const sourceDist = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(adminWebRoot, "..", "..", "EMenu", "emenuPro v0.0.7 (2)", "emenuPro v0.0.7", "dist");

if (!fs.existsSync(sourceDist)) {
  console.error(`[sync-emenu-pro] Source dist not found: ${sourceDist}`);
  process.exit(1);
}

function shouldPreserve(relPath) {
  const parts = relPath.split(path.sep).filter(Boolean);
  return parts.some((part) => preserveNames.has(part));
}

function copyRecursive(src, dest, rel = "") {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      const nextRel = rel ? path.join(rel, entry) : entry;
      if (shouldPreserve(nextRel)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry), nextRel);
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const assetsSrc = path.join(sourceDist, "assets");
const assetsDest = path.join(targetDir, "assets");

if (fs.existsSync(assetsDest)) {
  for (const entry of fs.readdirSync(assetsDest)) {
    if (preserveNames.has(entry)) continue;
    fs.rmSync(path.join(assetsDest, entry), { recursive: true, force: true });
  }
}

copyRecursive(assetsSrc, assetsDest);

const sourceIndexPath = path.join(sourceDist, "index.html");
const sourceIndex = fs.readFileSync(sourceIndexPath, "utf8");
const entryJs =
  sourceIndex.match(/src="\.\/assets\/([^"]+\.js)"/)?.[1] ?? "index-4fN21jTT.js";
const entryCss =
  sourceIndex.match(/href="\.\/assets\/([^"]+\.css)"/)?.[1] ?? "index-BOKRIb5n.css";

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="./favicon.ico" />
    <meta name="description" content="Menusifu E-menu Pro Admin" />
    <title>E-menu Shopping guide template</title>
    <script>
      (function () {
        var params = new URLSearchParams(window.location.search);
        var embedded = params.get("embedded");
        var inIframe = false;
        try {
          inIframe = window.self !== window.top;
        } catch (e) {
          inIframe = true;
        }
        if (embedded === "1" || embedded === "true" || inIframe) {
          document.documentElement.classList.add("menusifu-embedded");
        }
      })();
    </script>
    <link rel="stylesheet" href="./embedded-shell.css" />
    <script src="./embedded-mock-api.js"></script>
    <script src="./embedded-block-icons.js"></script>
    <script src="./embedded-viewport-fit.js"></script>
    <script type="module" crossorigin src="./assets/${entryJs}"></script>
    <link rel="stylesheet" crossorigin href="./assets/${entryCss}">
  </head>
  <body>
    <div id="root"></div>
    <script src="./embedded-header-more.js"></script>
    <script src="./embedded-resolution-header.js"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(targetDir, "index.html"), indexHtml, "utf8");

console.log(`[sync-emenu-pro] Synced from: ${sourceDist}`);
console.log(`[sync-emenu-pro] Target: ${targetDir}`);
console.log(
  "[sync-emenu-pro] Preserved: embedded-shell.css, embedded-mock-api.js, embedded-block-icons.js, embedded-viewport-fit.js, embedded-header-more.js, embedded-resolution-header.js, images/"
);
