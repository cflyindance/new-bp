/**
 * Patch dist/kiosklite/.embed-build so embedded Kiosk uses same-origin /kpos/
 * (Vite cookie proxy) instead of hardcoded http://localhost:22080/kpos/.
 *
 * Usage:
 *   node scripts/patch-kiosklite-embed-kpos-base.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsDir = path.join(root, "dist", "kiosklite", ".embed-build", "static", "js");

function fail(message) {
  console.error(`[patch-kiosklite-embed-kpos-base] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(jsDir)) {
  fail(`Missing ${jsDir} — run sync:kiosklite-embed or build:kiosklite-embed first`);
}

let patchedFiles = 0;

for (const name of fs.readdirSync(jsDir)) {
  if (!name.endsWith(".js")) continue;
  const filePath = path.join(jsDir, name);
  let source = fs.readFileSync(filePath, "utf8");
  const before = source;

  // Default serverURL constant → same-origin /kpos/ at runtime
  source = source.replaceAll(
    '"http://localhost:22080/kpos/"',
    '((typeof location!=="undefined"&&location.origin)?(location.origin+"/kpos/"):"http://localhost:22080/kpos/")',
  );

  // Prefer kioskServerIP whenever set; do not require cookie to contain "22080"
  // webpack often emits: (0,be.Ri)("kioskServerIP").includes("22080")?(0,be.Ri)("kioskServerIP"):fallback
  source = source.replace(
    /(\(0,[a-zA-Z_$][\w$.]*\))\("kioskServerIP"\)\.includes\("22080"\)\?\1\("kioskServerIP"\):/g,
    '$1("kioskServerIP")||',
  );
  source = source.replace(
    /([a-zA-Z_$][\w$]*)\("kioskServerIP"\)\.includes\("22080"\)\?\1\("kioskServerIP"\):/g,
    '$1("kioskServerIP")||',
  );

  if (source !== before) {
    fs.writeFileSync(filePath, source, "utf8");
    patchedFiles += 1;
    console.log(`[patch-kiosklite-embed-kpos-base] patched ${name}`);
  }
}

if (!patchedFiles) {
  fail("No embed JS matched localhost:22080 / includes(22080) patterns");
}

const mainJs = fs
  .readdirSync(jsDir)
  .filter((n) => n.startsWith("main.") && n.endsWith(".js"))
  .map((n) => fs.readFileSync(path.join(jsDir, n), "utf8"))
  .join("\n");
if (mainJs.includes('.includes("22080")')) {
  fail('Embed still contains .includes("22080") — update patch patterns');
}

console.log(`[patch-kiosklite-embed-kpos-base] Done (${patchedFiles} file(s)).`);
