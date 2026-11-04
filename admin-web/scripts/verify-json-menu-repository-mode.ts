import { strict as assert } from "node:assert";
import { resolveMenuDocumentRepositoryMode } from "../src/config/json-menu-document-repository-mode";

assert.equal(resolveMenuDocumentRepositoryMode(true, "localhost"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "cflyindance.github.io"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "preview.github.io"), "demo");
assert.equal(resolveMenuDocumentRepositoryMode(false, "admin.menusifu.com"), "http");

for (const host of ["localhost", "LOCALHOST", "127.0.0.1", "::1", "[::1]"]) {
  assert.equal(resolveMenuDocumentRepositoryMode(false, host), "demo", `Static loopback preview must use demo: ${host}`);
}
for (const host of ["admin.menusifu.com", "localhost.example.com", "127.0.0.1.example.com", "192.168.1.20", "example.github.io.attacker.test", ""]) {
  assert.equal(resolveMenuDocumentRepositoryMode(false, host), "http", `Non-demo hosts must retain HTTP repository: ${host}`);
}

console.log("json-menu repository mode verification passed");
