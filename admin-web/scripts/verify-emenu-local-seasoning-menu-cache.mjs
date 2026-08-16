import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  menuCacheKeyForHost,
  readMenuCache,
  writeMenuCache,
} from "./lib/emenu-local-seasoning-menu-cache.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seasoning-menu-cache-"));
const hostA = "http://192.168.1.10:22080";
const hostB = "http://192.168.1.11:22080";
assert(menuCacheKeyForHost(hostA) !== menuCacheKeyForHost(hostB), "hosts must isolate");
assert(readMenuCache(dir, hostA) === null, "missing cache is null");

const view = {
  menuGroups: [{ id: "g1", name: "G", sortOrder: 10, categories: [] }],
  products: [{ id: "1", code: "A", name: "菜", categoryId: "c", categoryName: "C", status: "active", emenuSellable: true, sortOrder: 10 }],
  categories: [],
  sourceMenuVersion: "v1",
  fingerprint: "fp1",
};
writeMenuCache(dir, hostA, view);
const loaded = readMenuCache(dir, hostA);
assert(loaded?.fingerprint === "fp1" && loaded.products[0].id === "1", "roundtrip");
assert(readMenuCache(dir, hostB) === null, "other host empty");

console.log("verify-emenu-local-seasoning-menu-cache: ok");
