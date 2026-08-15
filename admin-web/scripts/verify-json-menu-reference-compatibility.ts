import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MENU_ACCESS_FIELDS,
  MENU_I18N_FIELDS,
  MENU_MICRO_APP_FIELDS,
  MENU_NODE_FIELDS,
  MENU_PERMISSION_FIELDS,
  MENU_ROOT_FIELDS,
  walkMenuNodes,
  type MenuDocument,
  type MenuNode,
} from "../src/config/json-menu-document-domain";
import { serializeMenuDocument } from "../src/config/json-menu-document-serializer";

const inputPath = process.argv[2] ?? "C:\\Users\\27273\\Desktop\\edit jason.txt";
const original = JSON.parse(readFileSync(inputPath, "utf8")) as MenuDocument;
const serialized = serializeMenuDocument(original);

assert.equal(original.menu.length, 15);
assert.equal(walkMenuNodes(original.menu).length, 91);
assert.equal(Math.max(...walkMenuNodes(original.menu).map((visit) => visit.depth)), 4);
assert.deepEqual(serialized, original, "parse and serialize must preserve reference business data");
assert.equal(serialized.updatedBy.lastname, null);
assert.equal(walkMenuNodes(serialized.menu).filter((visit) => !Object.prototype.hasOwnProperty.call(visit.node, "type")).length, 66);

function assertAllowed(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  assert.deepEqual(extras, [], `${label} contains fields outside the reference schema`);
}

function checkNode(node: MenuNode, label: string): void {
  assertAllowed(node as unknown as Record<string, unknown>, MENU_NODE_FIELDS, label);
  if (node.i18nInfo) assertAllowed(node.i18nInfo as Record<string, unknown>, MENU_I18N_FIELDS, `${label}.i18nInfo`);
  if (node.microAppConfig) assertAllowed(node.microAppConfig as Record<string, unknown>, MENU_MICRO_APP_FIELDS, `${label}.microAppConfig`);
  if (node.accessControl) {
    assertAllowed(node.accessControl as Record<string, unknown>, MENU_ACCESS_FIELDS, `${label}.accessControl`);
    if (node.accessControl.permission) assertAllowed(node.accessControl.permission as Record<string, unknown>, MENU_PERMISSION_FIELDS, `${label}.accessControl.permission`);
  }
  node.children?.forEach((child, index) => checkNode(child, `${label}.children[${index}]`));
}

assertAllowed(serialized as unknown as Record<string, unknown>, MENU_ROOT_FIELDS, "root");
serialized.menu.forEach((node, index) => checkNode(node, `menu[${index}]`));

console.log("json-menu reference compatibility passed: 91 nodes, 15 roots, 4 levels");
