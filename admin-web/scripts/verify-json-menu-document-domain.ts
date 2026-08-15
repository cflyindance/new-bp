import assert from "node:assert/strict";
import {
  cloneMenuSubtreeWithFreshIds,
  createEmptyMenuDocument,
  isMenuDirectory,
  moveMenuNode,
  resolveEffectiveMenuType,
  validateMenuDocument,
  type MenuDocument,
  type MenuNode,
} from "../src/config/json-menu-document-domain";
import { serializeMenuDocument } from "../src/config/json-menu-document-serializer";

const user = { userId: "qa", firstname: "QA", lastname: null };
const empty = createEmptyMenuDocument(user, new Date("2026-08-14T00:00:00.000Z"));
assert.match(empty._id, /^[0-9a-f]{24}$/);
assert.equal(empty.updatedBy.lastname, null);
assert.deepEqual(empty.menu, []);

const child: MenuNode = { id: "child", name: "Child", key: "child", path: "/child" };
const parent: MenuNode = { id: "parent", name: "Parent", key: "parent", path: "/parent", type: "micro-app", microAppConfig: { url: "https://example.com", iframe: false, routeType: "history" }, children: [child] };
assert.equal(resolveEffectiveMenuType(child, [parent]), "micro-app");

const emptyDirectory: MenuNode = { id: "dir", name: "Directory", key: "directory", children: [] };
assert.equal(isMenuDirectory(emptyDirectory), true);
assert.equal(resolveEffectiveMenuType(emptyDirectory, [parent]), undefined, "directory must not inherit a page type");

const cloned = cloneMenuSubtreeWithFreshIds(parent);
assert.notEqual(cloned.id, parent.id);
assert.notEqual(cloned.children?.[0]?.id, child.id);
assert.equal(cloned.key, parent.key);

const movable: MenuNode[] = [
  { id: "a", key: "a", name: "A", path: "/a", type: "inner", children: [{ id: "a1", key: "a1", name: "A1", path: "/a1" }] },
  { id: "b", key: "b", name: "B", path: "/b", type: "inner" },
];
assert.equal(moveMenuNode(movable, [0, 0], [1], 0), true);
assert.equal(movable[1]?.children?.[0]?.id, "a1");
assert.equal(moveMenuNode(movable, [1], [1, 0], 0), false, "cannot move a node under its own descendant");

const invalid: MenuDocument = {
  ...empty,
  name: "Invalid",
  menu: [
    { id: "same", key: "same", name: "One", path: "/same", type: "iframe", url: "not-a-url" },
    { id: "same", key: "same", name: "Two", path: "/same", type: "inner" },
  ],
};
const invalidIssues = validateMenuDocument(invalid);
assert(invalidIssues.some((issue) => issue.code === "DUPLICATE_ID" && issue.severity === "error"));
assert(invalidIssues.some((issue) => issue.code === "DUPLICATE_KEY" && issue.severity === "error"));
assert(invalidIssues.some((issue) => issue.code === "DUPLICATE_PATH" && issue.severity === "warning"));
assert(invalidIssues.some((issue) => issue.code === "INVALID_URL"));

const publishedWithDuplicate: MenuDocument = structuredClone(invalid);
publishedWithDuplicate.menu[0]!.url = "https://example.com";
const legacyIssues = validateMenuDocument(structuredClone(publishedWithDuplicate), publishedWithDuplicate);
assert(!legacyIssues.some((issue) => issue.code === "DUPLICATE_ID"));
assert(legacyIssues.some((issue) => issue.code === "LEGACY_DUPLICATE_ID" && issue.severity === "warning"));
const draftWithNewDuplicate = structuredClone(publishedWithDuplicate);
draftWithNewDuplicate.menu.push({ id: "same", key: "third", name: "Three", path: "/three", type: "inner" });
assert(validateMenuDocument(draftWithNewDuplicate, publishedWithDuplicate).some((issue) => issue.code === "DUPLICATE_ID" && issue.severity === "error"));

const directoryDocument: MenuDocument = { ...empty, name: "Directory", menu: [emptyDirectory] };
assert.deepEqual(serializeMenuDocument(directoryDocument).menu[0]?.children, [], "empty directory marker must survive serialization");

const valid: MenuDocument = { ...empty, name: "Valid", menu: [parent] };
const validIssues = validateMenuDocument(valid);
assert(!validIssues.some((issue) => issue.severity === "error"), JSON.stringify(validIssues));
assert.equal(parent.microAppConfig?.iframe, false, "explicit false must remain distinguishable");

console.log("json-menu domain verification passed");
