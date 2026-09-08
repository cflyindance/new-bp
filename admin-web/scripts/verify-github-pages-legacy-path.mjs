import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const sourcePath = new URL("../public/admin-web/dist/index.html", import.meta.url);
assert.equal(existsSync(sourcePath), true, "legacy Pages entry must exist in Vite public assets");

const html = readFileSync(sourcePath, "utf8");
assert.match(html, /location\.replace/);
assert.match(html, /\.\.\/\.\.\//);
assert.match(html, /location\.search/);
assert.match(html, /location\.hash/);
console.log("verify-github-pages-legacy-path: PASS");
