import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { writeLegacyPagesRedirect } from "./generate-github-pages-legacy-route.mjs";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pages-legacy-route-"));
try {
  const outputFile = writeLegacyPagesRedirect(tempRoot);
  assert.equal(outputFile, path.join(tempRoot, "admin-web", "dist", "index.html"));
  const html = fs.readFileSync(outputFile, "utf8");
  assert.match(html, /window\.location\.replace\(target \+ window\.location\.search \+ window\.location\.hash\)/);
  assert.match(html, /const target = "\.\.\/\.\.\/\.\.\/index\.html"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/index\.html"/);
  console.log("verify-github-pages-legacy-route: OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
