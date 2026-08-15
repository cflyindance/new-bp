/**
 * Patch dist/emenu-new so API base can be overridden via window.__MENUSIFU_KPOS_BASE__
 * (set by admin-web host IP control / ?kposBase=).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "dist", "emenu-new", "assets");
const indexHtml = path.join(root, "dist", "emenu-new", "index.html");

const BOOTSTRAP = `<script>(function(){try{var q=new URLSearchParams(location.search).get("kposBase");var stored=localStorage.getItem("menusifu:emenu-local:kpos-host");var parentBase=null;try{parentBase=window.parent&&window.parent.__MENUSIFU_KPOS_BASE__}catch(e){}var base=q||parentBase||(stored?String(stored).replace(/\\/$/,"")+"/kpos/":null);if(base){if(base.slice(-1)!=="/")base+="/";window.__MENUSIFU_KPOS_BASE__=base}}catch(e){}})();</script>`;

function fail(message) {
  console.error(`[patch-emenu-new-kpos-base] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  fail(`Missing ${assetsDir}`);
}

let patched = 0;
for (const name of fs.readdirSync(assetsDir)) {
  if (!name.endsWith(".js")) continue;
  const filePath = path.join(assetsDir, name);
  let source = fs.readFileSync(filePath, "utf8");
  const before = source;
  source = source.replaceAll(
    'window.location.origin+"/kpos/"',
    '((window.__MENUSIFU_KPOS_BASE__)||(window.location.origin+"/kpos/"))',
  );
  source = source.replaceAll(
    "window.location.origin+'/kpos/'",
    "((window.__MENUSIFU_KPOS_BASE__)||(window.location.origin+'/kpos/'))",
  );
  if (source !== before) {
    fs.writeFileSync(filePath, source, "utf8");
    patched += 1;
    console.log(`[patch-emenu-new-kpos-base] patched ${name}`);
  }
}

if (fs.existsSync(indexHtml)) {
  let html = fs.readFileSync(indexHtml, "utf8");
  if (!html.includes("__MENUSIFU_KPOS_BASE__")) {
    html = html.replace("<head>", `<head>${BOOTSTRAP}`);
    fs.writeFileSync(indexHtml, html, "utf8");
    console.log("[patch-emenu-new-kpos-base] injected bootstrap into index.html");
  }
}

if (!patched) {
  console.warn("[patch-emenu-new-kpos-base] no asset matched origin+/kpos/ (may already be patched)");
} else {
  console.log(`[patch-emenu-new-kpos-base] Done (${patched} asset file(s)).`);
}
