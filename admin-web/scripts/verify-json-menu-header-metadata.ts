import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serializeMenuDocument } from "../src/config/json-menu-document-serializer";
import type { MenuDocument } from "../src/config/json-menu-document-domain";

const document: MenuDocument = {
  _id: "root-document-id",
  name: "B Platform Menu",
  menu: [{ id: "home", name: "首页", key: "home", path: "/home", type: "inner" }],
  updatedBy: { userId: "demo", firstname: "Demo", lastname: null, timestamp: "2026-08-21T06:32:00.000Z" },
  createdDate: 0,
};

const editorSource = readFileSync(fileURLToPath(new URL("../src/config/json-menu-editor-ui.ts", import.meta.url)), "utf8");
assert.doesNotMatch(editorSource, /data-jme-root-field="name"/);
assert.doesNotMatch(editorSource, />配置名称</);
assert.doesNotMatch(editorSource, />ID \$\{escapeHtml\(document\._id\)\}/);
assert.match(editorSource, /最后更新 \$\{escapeHtml\(document\.updatedBy\.firstname\)\}/);

const serialized = serializeMenuDocument(document);
assert.equal(serialized.name, document.name);
assert.equal(serialized._id, document._id);

console.log("json-menu header metadata verification passed");
