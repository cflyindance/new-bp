import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FOH_SETTINGS_ASSIGN_MAP } from "./lib/foh-settings-groups.mjs";
import {
  DINING_DURATION_LIMIT_BY_LINE_FIELD_ID,
  DINING_DURATION_LIMIT_LINES_STORAGE_ID,
  createDefaultDiningDurationLimitByLine,
  normalizeDiningDurationLimitByLine,
  normalizeDiningDurationMinutes,
  readDiningDurationLimitByLine,
  readGuestDiningDurationLines,
} from "../src/config/module-settings-guest-dining-duration-ui";
import { moduleSettingStorageKey } from "../src/config/module-settings-form-ui";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function extractIds(source: string, constName: string): string[] {
  const match = source.match(
    new RegExp(`export const ${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`),
  );
  if (!match) return [];
  return [...match[1].matchAll(/id:\s*"([^"]+)"/g)].map((item) => item[1]);
}

const failures: string[] = [];

function check(name: string, assertion: () => void): void {
  try {
    assertion();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL ${name}: ${message}`);
  }
}

const durationSource = read("src/config/module-settings-guest-dining-duration-ui.ts");
const mainSource = read("src/main.ts");
const toggleSource = read("src/config/module-settings-toggle-ui.ts");
const byLineSource = read("src/config/foh-settings-by-line-toggle.ts");
const formSource = read("src/config/module-settings-form-ui.ts");
const draftSource = read("src/config/page-settings-draft.ts");
const mirrorPolicySource = read("src/config/module-settings-guest-menu-body-line-scope.ts");
const virtualItemsSource = read("scripts/lib/settings-catalog-virtual-items.mjs");
const sceneSource = read("scripts/lib/settings-catalog-scene-supplement.mjs");
const catalogSource = read("src/config/module-settings-catalog.ts");
const scope = JSON.parse(read("scripts/lib/foh-settings-line-scope.seed.json")) as Record<
  string,
  { lines?: string[]; storage?: string }
>;
const registrySource = read("src/config/foh-settings-line-storage-registry.ts");

const expectedLines = ["pos", "pos-go", "paypad", "emenu", "sdi"];

check("duration group inserts seq 674 immediately before seq 577", () => {
  assert.deepEqual(FOH_SETTINGS_ASSIGN_MAP["foh-guest-duration-scenarios"], [
    571,
    674,
    577,
    578,
    579,
    580,
  ]);
});

check("duration module declares seq 674 and exact five-line order", () => {
  assert.match(durationSource, /GUEST_DINING_DURATION_LIMIT_SEQ\s*=\s*674/);
  assert.deepEqual(
    extractIds(durationSource, "GUEST_DINING_DURATION_PRODUCT_LINES"),
    expectedLines,
  );
});

check("seq 674 declares canonical object, mirror, range and default", () => {
  assert.match(durationSource, /674-dining-duration-limit-by-line/);
  assert.match(durationSource, /674-dining-duration-limit-lines/);
  assert.match(durationSource, /DINING_DURATION_MINUTES_DEFAULT\s*=\s*120/);
  assert.match(durationSource, /DINING_DURATION_MINUTES_MIN\s*=\s*1/);
  assert.match(durationSource, /DINING_DURATION_MINUTES_MAX\s*=\s*1440/);
  assert.match(durationSource, /readModuleSettingJsonState/);
});

check("seq 674 renders a line-scoped table without a generic toggle", () => {
  assert.match(durationSource, /data-guest-dining-duration-limit-enabled/);
  assert.match(durationSource, /data-guest-dining-duration-limit-minutes/);
  assert.match(durationSource, /FOH_LINE_CONFIG_ROW_ATTR/);
  assert.match(mainSource, /renderModuleSettingGuestDiningDurationLimitRow/);
  assert.match(mainSource, /isGuestDiningDurationLimitSeq/);
  assert.doesNotMatch(toggleSource, /674/);
});

check("linked settings retain stored values and reapply the limit dependency", () => {
  assert.match(durationSource, /refreshGuestDiningDurationLimitDependencies/);
  assert.match(durationSource, /需先启用该产线的用餐时长限制/);
  assert.match(durationSource, /aria-disabled/);
  assert.match(mainSource, /refreshGuestDiningDurationLimitDependencies/);
});

check("seq 674 is excluded from generic lines-to-toggle mirrors", () => {
  assert.match(mirrorPolicySource, /seq\s*===\s*607/);
  assert.match(mirrorPolicySource, /seq\s*===\s*674/);
  assert.match(formSource, /isFohLinesToggleMirrorExcludedSeq/);
  assert.match(draftSource, /isFohLinesToggleMirrorExcludedSeq/);
  assert.match(byLineSource, /isFohLinesToggleMirrorExcludedSeq/);
});

check("by-line reads and writes use the seq 674 canonical synchronizer", () => {
  assert.match(byLineSource, /readDiningDurationLimitByLine/);
  assert.match(byLineSource, /syncDiningDurationLimitEnabledFromLines/);
  assert.match(byLineSource, /isGuestDiningDurationLineLimitEnabled/);
});

check("catalog metadata contains seq 674 and five-line copy for seq 577–580", () => {
  assert.match(virtualItemsSource, /seq:\s*674/);
  assert.match(virtualItemsSource, /title:\s*"用餐时长限制"/);
  for (const seq of [577, 578, 579, 580]) {
    const sceneLine = sceneSource.split(/\r?\n/).find((line) => line.includes(`[${seq},`));
    assert.ok(sceneLine, `scene supplement missing seq ${seq}`);
    for (const label of ["POS", "POS GO", "PayPad", "eMenu", "SDI"]) {
      assert.ok(sceneLine.includes(label), `seq ${seq} missing ${label}`);
    }
  }
  assert.match(catalogSource, /seq:\s*674/);
});

check("scope and storage registry contain seq 674 and expanded linked settings", () => {
  for (const seq of [674, 577, 578, 579, 580]) {
    assert.deepEqual(scope[String(seq)]?.lines, expectedLines, `scope mismatch for seq ${seq}`);
  }
  assert.match(registrySource, /674:\s*"674-dining-duration-limit-lines"/);
});

check("minute and per-line normalization is deterministic", () => {
  assert.equal(normalizeDiningDurationMinutes(""), 120);
  assert.equal(normalizeDiningDurationMinutes("abc"), 120);
  assert.equal(normalizeDiningDurationMinutes(null), 120);
  assert.equal(normalizeDiningDurationMinutes(-4), 1);
  assert.equal(normalizeDiningDurationMinutes(2000), 1440);
  assert.equal(normalizeDiningDurationMinutes(90.6), 91);

  const normalized = normalizeDiningDurationLimitByLine({
    pos: { enabled: true, minutes: 60 },
    "pos-go": { enabled: "yes", minutes: 0 },
    emenu: { enabled: true, minutes: "bad" },
    unknown: { enabled: true, minutes: 30 },
  });
  assert.deepEqual(normalized.pos, { enabled: true, minutes: 60 });
  assert.deepEqual(normalized["pos-go"], { enabled: false, minutes: 1 });
  assert.deepEqual(normalized.paypad, { enabled: false, minutes: 120 });
  assert.deepEqual(normalized.emenu, { enabled: true, minutes: 120 });
});

check("canonical object is authoritative and loading never repairs mirrors", () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, String(value)),
  } satisfies Storage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  try {
    const canonicalKey = moduleSettingStorageKey(DINING_DURATION_LIMIT_BY_LINE_FIELD_ID);
    const mirrorKey = moduleSettingStorageKey(DINING_DURATION_LIMIT_LINES_STORAGE_ID);

    const missing = readDiningDurationLimitByLine();
    assert.deepEqual(missing, createDefaultDiningDurationLimitByLine());
    assert.equal(values.has(canonicalKey), false);
    assert.equal(values.has(mirrorKey), false);

    values.set(
      canonicalKey,
      JSON.stringify({ pos: { enabled: true, minutes: 60 } }),
    );
    values.set(mirrorKey, JSON.stringify(["emenu"]));
    const configured = readDiningDurationLimitByLine();
    assert.deepEqual(configured.pos, { enabled: true, minutes: 60 });
    assert.equal(configured.emenu.enabled, false);
    assert.equal(values.get(mirrorKey), JSON.stringify(["emenu"]));

    values.delete(canonicalKey);
    const orphanMirror = readDiningDurationLimitByLine();
    assert.equal(Object.values(orphanMirror).some((item) => item.enabled), false);
    assert.equal(values.get(mirrorKey), JSON.stringify(["emenu"]));

    values.set(canonicalKey, "{");
    const invalid = readDiningDurationLimitByLine();
    assert.equal(Object.values(invalid).some((item) => item.enabled), false);
    assert.equal(values.get(canonicalKey), "{");
  } finally {
    if (previousStorage === undefined) Reflect.deleteProperty(globalThis, "localStorage");
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousStorage });
  }
});

check("linked settings preserve explicit empty and invalid values", () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, String(value)),
  } satisfies Storage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  try {
    const linesKey = moduleSettingStorageKey("577-guest-dining-duration-lines");
    values.set("bplant-module-setting-toggle:577", "1");
    values.set(linesKey, "[]");
    assert.deepEqual(readGuestDiningDurationLines(577), []);
    assert.equal(values.get(linesKey), "[]");

    values.set(linesKey, "{");
    assert.deepEqual(readGuestDiningDurationLines(577), []);
    assert.equal(values.get(linesKey), "{");
  } finally {
    if (previousStorage === undefined) Reflect.deleteProperty(globalThis, "localStorage");
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousStorage });
  }
});

if (failures.length > 0) {
  console.error(`\nGuest dining duration verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nGuest dining duration verification passed.");
