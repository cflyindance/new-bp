import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeProductLineOptionMatrix,
  renderProductLineOptionMatrixHtml,
} from "../src/config/module-settings-product-line-option-matrix-ui";
import {
  TIMED_MENU_DISPLAY_ORDER_TYPES,
  TIMED_MENU_DISPLAY_PRODUCT_LINES,
  renderTimedMenuDisplayPanelHtml,
  writeTimedMenuDisplayOrderTypesByLine,
} from "../src/config/module-settings-timed-menu-display-ui";

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

const timedSource = read("src/config/module-settings-timed-menu-display-ui.ts");
const seatSource = read("src/config/module-settings-order-display-seat-ui.ts");
const mainSource = read("src/main.ts");
const toggleSource = read("src/config/module-settings-toggle-ui.ts");
const extractorSource = read("scripts/lib/foh-line-scope-extract.mjs");
const registrySource = read("src/config/foh-settings-line-storage-registry.ts");
const catalogSource = read("src/config/module-settings-catalog.ts");
const scope = JSON.parse(read("scripts/lib/foh-settings-line-scope.seed.json")) as Record<
  string,
  { lines?: string[] }
>;
const baseline = JSON.parse(read("scripts/lib/foh-settings-22-group-baseline.json")) as {
  items: Array<{ seq: number; sceneDesc: string }>;
  linesBySeq: Record<string, string[]>;
  storageBySeq: Record<string, string>;
};
const sharedPath = path.join(root, "src/config/module-settings-product-line-option-matrix-ui.ts");

const expectedLines = ["emenu", "kiosk", "pos", "pos-go", "paypad", "sdi"];
const expectedTypes = ["dine-in", "delivery", "pick-up", "to-go"];

check("seq 348 declares the exact six product lines", () => {
  assert.deepEqual(extractIds(timedSource, "TIMED_MENU_DISPLAY_PRODUCT_LINES"), expectedLines);
});

check("seq 348 keeps the exact four menu type ids", () => {
  assert.deepEqual(extractIds(timedSource, "TIMED_MENU_DISPLAY_ORDER_TYPES"), expectedTypes);
  assert.match(timedSource, /id:\s*"pick-up",\s*label:\s*"Pick Up"/);
});

check("shared matrix normalizes missing, duplicate and invalid values", () => {
  const normalized = normalizeProductLineOptionMatrix(
    {
      emenu: ["to-go", "invalid", "dine-in", "to-go"],
      kiosk: "dine-in",
      pos: ["pick-up", "delivery"],
      unknown: ["dine-in"],
    },
    TIMED_MENU_DISPLAY_PRODUCT_LINES,
    TIMED_MENU_DISPLAY_ORDER_TYPES,
  );
  assert.deepEqual(normalized, {
    emenu: ["dine-in", "to-go"],
    kiosk: [],
    pos: ["delivery", "pick-up"],
    "pos-go": [],
    paypad: [],
    sdi: [],
  });
});

check("shared matrix renders line-scoped rows and Pick Up labels", () => {
  const values = normalizeProductLineOptionMatrix(
    { emenu: ["pick-up"] },
    TIMED_MENU_DISPLAY_PRODUCT_LINES,
    TIMED_MENU_DISPLAY_ORDER_TYPES,
  );
  const html = renderProductLineOptionMatrixHtml(
    {
      id: "verification",
      lines: TIMED_MENU_DISPLAY_PRODUCT_LINES,
      options: TIMED_MENU_DISPLAY_ORDER_TYPES,
      optionColumnLabel: "订单类型（多选）",
    },
    values,
  );
  assert.equal((html.match(/data-foh-line-config-row=/g) ?? []).length, 6);
  assert.match(html, />Pick Up<\/span>/);
  assert.match(html, /data-foh-line-config-row="emenu"/);
  assert.doesNotMatch(html, /data-module-setting-toggle/);
});

check("legacy seq 348 toggle values neither affect rendering nor get rewritten", () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousLocation = globalThis.location;
  const previousWindow = globalThis.window;
  const values = new Map<string, string>();
  const fakeStorage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, String(value)),
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: fakeStorage,
  });
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { hash: "" },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent: () => true,
      location: { hash: "" },
      localStorage: fakeStorage,
    },
  });
  try {
    const toggleKey = "bplant-module-setting-toggle:348";
    values.set(toggleKey, "0");
    const offHtml = renderTimedMenuDisplayPanelHtml();
    values.set(toggleKey, "1");
    const onHtml = renderTimedMenuDisplayPanelHtml();
    assert.equal(offHtml, onHtml);

    writeTimedMenuDisplayOrderTypesByLine(
      normalizeProductLineOptionMatrix(
        { emenu: ["dine-in"] },
        TIMED_MENU_DISPLAY_PRODUCT_LINES,
        TIMED_MENU_DISPLAY_ORDER_TYPES,
      ),
    );
    assert.equal(values.get(toggleKey), "1");
  } finally {
    if (previousLocalStorage === undefined) {
      Reflect.deleteProperty(globalThis, "localStorage");
    } else {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: previousLocalStorage,
      });
    }
    if (previousLocation === undefined) {
      Reflect.deleteProperty(globalThis, "location");
    } else {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        value: previousLocation,
      });
    }
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
  }
});

check("shared product-line option matrix exists", () => {
  assert.equal(fs.existsSync(sharedPath), true);
});

check("seq 132 and seq 348 both consume the shared matrix", () => {
  assert.match(seatSource, /module-settings-product-line-option-matrix-ui/);
  assert.match(timedSource, /module-settings-product-line-option-matrix-ui/);
});

check("src/main.ts restores seq 348 render and bind entry points", () => {
  assert.match(mainSource, /isTimedMenuDisplaySeq/);
  assert.match(mainSource, /renderTimedMenuDisplayPanelHtml/);
  assert.match(mainSource, /bindTimedMenuDisplayUi\(\)/);
  assert.match(mainSource, /renderModuleSettingTimedMenuDisplayRow/);
});

check("seq 348 is not a toggle setting", () => {
  assert.doesNotMatch(toggleSource, /TIMED_MENU_DISPLAY_TOGGLE_SEQ/);
  assert.doesNotMatch(timedSource, /moduleSettingToggleStorageKey/);
  assert.doesNotMatch(mainSource, /setTimedMenuDisplayPanelVisible/);
});

check("seq 348 object matrix is excluded from the lines codec registry", () => {
  assert.doesNotMatch(extractorSource, /348:\s*"348-timed-menu-order-types-by-line"/);
  assert.doesNotMatch(registrySource, /348:\s*"348-timed-menu-order-types-by-line"/);
});

check("seq 348 scope is the exact six product lines", () => {
  assert.deepEqual(scope["348"]?.lines, expectedLines);
});

check("seq 348 catalog copy describes six lines and four menu types", () => {
  const line = catalogSource.split(/\r?\n/).find((value) => value.includes("seq: 348"));
  assert.ok(line);
  for (const label of ["eMenu", "Kiosk", "POS", "POS GO", "PayPad", "SDI"]) {
    assert.ok(line.includes(label), `catalog is missing ${label}`);
  }
  for (const label of ["Dinein", "Delivery", "Pick Up", "ToGo"]) {
    assert.ok(line.includes(label), `catalog is missing ${label}`);
  }
});

check("22-group baseline reflects seq 348 copy, scope and no lines storage", () => {
  const item = baseline.items.find((value) => value.seq === 348);
  assert.ok(item);
  assert.match(item.sceneDesc, /eMenu/);
  assert.match(item.sceneDesc, /Pick Up/);
  assert.deepEqual(baseline.linesBySeq["348"], [...expectedLines].sort());
  assert.equal(Object.hasOwn(baseline.storageBySeq, "348"), false);
});

if (failures.length > 0) {
  console.error(`\nTimed menu shared-matrix verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("\nTimed menu shared-matrix verification passed.");
