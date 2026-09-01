import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  menuCacheKeyForHost,
  normalizeMenuProduct,
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

assert(normalizeMenuProduct("kiosk") === "KIOSK", "normalize kiosk");
assert(normalizeMenuProduct("EMENU") === "EMENU", "normalize emenu");
assert(normalizeMenuProduct("nope") === "EMENU", "invalid product defaults EMENU");

writeMenuCache(dir, hostA, { ...view, fingerprint: "emenu-fp" }, "EMENU");
writeMenuCache(dir, hostA, { ...view, fingerprint: "kiosk-fp" }, "KIOSK");
assert(readMenuCache(dir, hostA, "EMENU")?.fingerprint === "emenu-fp", "emenu cache");
assert(readMenuCache(dir, hostA, "KIOSK")?.fingerprint === "kiosk-fp", "kiosk isolated");
assert(readMenuCache(dir, hostA, "POS") === null, "missing product null");

const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), "seasoning-menu-legacy-"));
const legacyPath = path.join(legacyDir, `emenu-local-seasoning-menu-${menuCacheKeyForHost(hostA)}.json`);
fs.writeFileSync(legacyPath, JSON.stringify({ host: hostA, view: { ...view, fingerprint: "legacy-fp" } }), "utf8");
assert(readMenuCache(legacyDir, hostA, "EMENU")?.fingerprint === "legacy-fp", "legacy file is EMENU only");
assert(readMenuCache(legacyDir, hostA, "KIOSK") === null, "legacy not reused for KIOSK");

console.log("verify-emenu-local-seasoning-menu-cache: ok");
