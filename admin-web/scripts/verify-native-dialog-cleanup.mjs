/**
 * 验收：src 与 Configuration center 原型页不得再调用原生 alert/confirm/prompt
 */
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PATTERN = /window\.(alert|confirm|prompt)\s*\(/g;

async function walk(dir, exts, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      await walk(full, exts, out);
      continue;
    }
    if (exts.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const hits = [];

const srcFiles = await walk(path.join(root, "src"), new Set([".ts", ".tsx"]));
const distFiles = (
  await walk(path.join(root, "dist", "Configuration center"), new Set([".html", ".js"]))
).filter((f) => path.basename(f) !== "app-dialogs.js");

for (const file of [...srcFiles, ...distFiles]) {
  const text = await readFile(file, "utf8");
  const matches = [...text.matchAll(PATTERN)];
  if (!matches.length) continue;
  hits.push({
    file: path.relative(root, file).replaceAll("\\", "/"),
    count: matches.length,
    kinds: [...new Set(matches.map((m) => m[1]))].join(","),
  });
}

if (hits.length) {
  console.error("Native dialog cleanup verification FAILED:");
  for (const hit of hits) {
    console.error(`  ${hit.file}: ${hit.count} (${hit.kinds})`);
  }
  process.exit(1);
}

// sanity: helpers exist
for (const rel of [
  "src/ui/app-toast.ts",
  "src/ui/app-confirm-dialog.ts",
  "src/ui/app-prompt-dialog.ts",
  "dist/Configuration center/assets/app-dialogs.js",
]) {
  const st = await stat(path.join(root, rel)).catch(() => null);
  assert.ok(st?.isFile(), `missing required file: ${rel}`);
}

console.log("Native dialog cleanup verification passed");
