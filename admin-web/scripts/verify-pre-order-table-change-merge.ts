import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Stored = Map<string, string>;

class LocalStorageMock {
  private readonly values: Stored = new Map();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

const storage = new LocalStorageMock();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: storage,
});
Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { hash: "#/operations/queue-call/settings/foh-table-start-flow" },
});
const windowMock = new EventTarget();
Object.defineProperty(windowMock, "location", { value: globalThis.location });
Object.defineProperty(windowMock, "localStorage", { value: storage });
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: windowMock,
});
Object.defineProperty(globalThis, "CustomEvent", {
  configurable: true,
  value: class CustomEventMock extends Event {
    public readonly detail: unknown;

    constructor(
      type: string,
      public readonly init?: { detail?: unknown },
    ) {
      super(type);
      this.detail = init?.detail;
    }
  },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function pass(label: string): void {
  console.log(`PASS ${label}`);
}

function assert(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(`FAIL ${label}`);
  pass(label);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `FAIL ${label}\nexpected: ${JSON.stringify(expected)}\nactual:   ${JSON.stringify(actual)}`,
    );
  }
  pass(label);
}

function fieldKey(fieldId: string): string {
  return `bplant-module-setting-field:${fieldId}`;
}

function toggleKey(seq: number): string {
  return `bplant-module-setting-toggle:${seq}`;
}

let readStoredField: (fieldId: string) => unknown = (fieldId) => {
  const raw = storage.getItem(fieldKey(fieldId));
  return raw ? JSON.parse(raw) : undefined;
};

function readStoredLines(fieldId: string): string[] {
  const parsed = readStoredField(fieldId);
  if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === "string");
  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { lines?: unknown }).lines)
  ) {
    return (parsed as { lines: unknown[] }).lines.filter(
      (id): id is string => typeof id === "string",
    );
  }
  return [];
}

const ui = await import("../src/config/module-settings-pre-order-table-change-ui.ts");
const byLine = await import("../src/config/foh-settings-by-line-toggle.ts");
const formUi = await import("../src/config/module-settings-form-ui.ts");
const pageDraft = await import("../src/config/page-settings-draft.ts");
readStoredField = formUi.readModuleSettingJsonRaw;

const expectedLines = ["pos", "pos-go", "paypad", "emenu", "sdi"];
assertEqual(
  ui.PRE_ORDER_TABLE_CHANGE_PRODUCT_LINES.map((line) => line.id),
  expectedLines,
  "三态矩阵固定为五条目标产线",
);
assertEqual(ui.PRE_ORDER_TABLE_CHANGE_SEQS, [643], "仅 seq 643 是可见三态功能");
assert(ui.isPreOrderTableChangeSeq(643), "seq 643 使用专用三态渲染");
assert(!ui.isPreOrderTableChangeSeq(644), "seq 644 不再使用可见渲染");

storage.clear();
storage.setItem(fieldKey("643-pre-order-change-table-lines"), JSON.stringify(["pos", "emenu"]));
storage.setItem(
  fieldKey("644-pre-order-must-change-table-lines"),
  JSON.stringify(["emenu", "paypad"]),
);
const migrated = ui.readPreOrderTableChangeModeByLine();
assertEqual(
  migrated,
  {
    pos: "optional",
    "pos-go": "disabled",
    paypad: "required",
    emenu: "required",
    sdi: "disabled",
  },
  "旧配置迁移且必须换桌优先",
);
assert(storage.getItem(fieldKey("643-pre-order-change-table-mode-by-line")), "迁移后写入三态主配置");

storage.clear();
storage.setItem(fieldKey("643-pre-order-change-table-lines"), JSON.stringify([]));
storage.setItem(fieldKey("644-pre-order-must-change-table-lines"), JSON.stringify([]));
storage.setItem(toggleKey(643), "1");
storage.setItem(toggleKey(644), "1");
assertEqual(
  ui.readPreOrderTableChangeModeByLine(),
  Object.fromEntries(expectedLines.map((line) => [line, "disabled"])),
  "显式空旧数组不会被旧总开关复活",
);

storage.clear();
storage.setItem(toggleKey(643), "1");
storage.setItem(toggleKey(644), "0");
assertEqual(
  ui.readPreOrderTableChangeModeByLine(),
  {
    pos: "optional",
    "pos-go": "optional",
    paypad: "optional",
    emenu: "optional",
    sdi: "disabled",
  },
  "仅旧数组缺失时按旧总开关回填四条历史产线",
);

ui.writePreOrderTableChangeMode("pos", "required");
assertEqual(ui.readPreOrderTableChangeMode("pos"), "required", "专用接口写入必须换桌");
assertEqual(
  pageDraft.getPageDraftChangeCount("/operations/queue-call/settings"),
  1,
  "兼容镜像不作为 seq 644 独立变更进入保存预览",
);
assertEqual(
  readStoredLines("643-pre-order-change-table-lines"),
  ["pos", "pos-go", "paypad", "emenu"],
  "seq 643 镜像包含可选和必须换桌产线",
);
assertEqual(
  readStoredLines("644-pre-order-must-change-table-lines"),
  ["pos"],
  "seq 644 镜像只包含必须换桌产线",
);
assertEqual(storage.getItem(toggleKey(643)), "1", "seq 643 旧总开关镜像开启");
assertEqual(storage.getItem(toggleKey(644)), "1", "seq 644 旧总开关镜像开启");

const beforeBooleanWrite = ui.readPreOrderTableChangeModeByLine();
byLine.writeFohByLineToggleState(643, "pos", false);
byLine.writeFohByLineToggleState(644, "pos", false);
assertEqual(
  ui.readPreOrderTableChangeModeByLine(),
  beforeBooleanWrite,
  "seq 643/644 通用布尔按产线写入被拒绝",
);

for (const lineId of expectedLines) {
  ui.writePreOrderTableChangeMode(lineId, "disabled");
}
assertEqual(readStoredLines("643-pre-order-change-table-lines"), [], "全部关闭后 seq 643 镜像为空");
assertEqual(readStoredLines("644-pre-order-must-change-table-lines"), [], "全部关闭后 seq 644 镜像为空");
assertEqual(storage.getItem(toggleKey(643)), "0", "全部关闭后 seq 643 旧总开关关闭");
assertEqual(storage.getItem(toggleKey(644)), "0", "全部关闭后 seq 644 旧总开关关闭");

const html = ui.renderPreOrderTableChangePanelHtml();
for (const lineId of expectedLines) {
  assert(html.includes(`data-pre-order-table-change-line="${lineId}"`), `矩阵渲染 ${lineId}`);
}
for (const mode of ["disabled", "optional", "required"]) {
  assert(html.includes(`value="${mode}"`), `矩阵渲染 ${mode} 状态`);
}

const groupsSource = fs.readFileSync(path.join(root, "scripts/lib/foh-settings-groups.mjs"), "utf8");
assert(
  groupsSource.includes('"foh-table-start-flow": [107, 619, 111, 625, 621, 643, 592]'),
  "选桌与开台流程只保留 seq 643",
);
const exclusionsSource = fs.readFileSync(
  path.join(root, "scripts/lib/settings-catalog-exclusions.mjs"),
  "utf8",
);
assert(/\[644,\s*"已并入 seq 643/.test(exclusionsSource), "seq 644 被目录排除并标注合并原因");
const supplementSource = fs.readFileSync(
  path.join(root, "scripts/lib/settings-catalog-scene-supplement.mjs"),
  "utf8",
);
assert(/\[643,\s*"开单前，换桌"\]/.test(supplementSource), "seq 643 标题统一为中文逗号");

console.log("\n✓ 开单前换桌三态合并聚焦验证通过");
