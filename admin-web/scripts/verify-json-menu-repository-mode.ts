import { strict as assert } from "node:assert";
import { resolveMenuDocumentRepositoryMode } from "../src/config/json-menu-document-repository-mode";

assert.equal(resolveMenuDocumentRepositoryMode(true, "localhost"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "cflyindance.github.io"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "preview.github.io"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "admin.menusifu.com"), "http");

console.log("json-menu repository mode verification passed");
