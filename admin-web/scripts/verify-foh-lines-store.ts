/**
 * 校验前厅适用产线的存储语义：
 * 「未配置 → 全选」「已配置为空 → 全部关闭」「存量裸数组兼容」。
 */

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  get length(): number {
    return this.map.size;
  }
}

const storage = new MemoryStorage();
const g = globalThis as Record<string, unknown>;
g.localStorage = storage;
g.window = {
  location: { hash: "#/" },
  localStorage: storage,
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
  setTimeout: (fn: () => void) => setTimeout(fn, 0),
  clearTimeout: (id: number) => clearTimeout(id),
  requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0),
};
g.location = (g.window as { location: unknown }).location;
g.CustomEvent = class {
  type: string;
  detail: unknown;
  constructor(type: string, init?: { detail?: unknown }) {
    this.type = type;
    this.detail = init?.detail;
  }
};
g.Event = g.CustomEvent;
g.requestAnimationFrame = (fn: () => void) => setTimeout(fn, 0);
g.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {} }),
  body: { classList: { add() {}, remove() {}, toggle() {} } },
};

const { moduleSettingStorageKey } = await import("../src/config/module-settings-form-ui");
const { readFohLines, resolveFohLines, isFohLinesConfigured, writeFohLines } = await import(
  "../src/config/foh-settings-lines-store"
);
const { fohLinesScopeForSeq } = await import("../src/config/foh-settings-lines-codec");
const { FOH_LINE_STORAGE_BY_SEQ } = await import("../src/config/foh-settings-line-storage-registry");
const { commitPageDraft, discardPageDraft, resolvePageSaveKey } = await import("../src/config/page-settings-draft");

const SEQ = 107;
const FIELD_ID = FOH_LINE_STORAGE_BY_SEQ[SEQ];
const KEY = moduleSettingStorageKey(FIELD_ID);
const SCOPE = fohLinesScopeForSeq(SEQ);
const FOH_PAGE_KEY = resolvePageSaveKey("/operations/queue-call/settings");

const failures: string[] = [];

function check(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${name}`);
    return;
  }
  failures.push(`${name}\n      期望 ${e}\n      实际 ${a}`);
  console.log(`  ✗ ${name}  期望 ${e}  实际 ${a}`);
}

function reset(): void {
  discardPageDraft(FOH_PAGE_KEY);
  storage.clear();
}

/** 前厅字段经批量保存草稿层落盘，测试中模拟「点保存」 */
function writeAndCommit(seq: number, lines: readonly string[]): void {
  writeFohLines(seq, lines);
  commitPageDraft(FOH_PAGE_KEY);
}

console.log(`前厅适用产线存储语义校验（seq ${SEQ}，字段 ${FIELD_ID}）`);
console.log(`  矩阵产线：${SCOPE.join(", ")}`);

console.log("\n[1] 未配置");
reset();
check("readFohLines 为 undefined", readFohLines(SEQ), undefined);
check("isFohLinesConfigured 为 false", isFohLinesConfigured(SEQ), false);
check("resolveFohLines 按矩阵全选", resolveFohLines(SEQ), SCOPE);

console.log("\n[2] 写入部分产线");
reset();
writeAndCommit(SEQ, ["pos", "kiosk"]);
check("落盘为结构体", JSON.parse(storage.getItem(KEY) ?? "null"), {
  v: 1,
  lines: SCOPE.filter((id) => ["pos", "kiosk"].includes(id)),
});
check("读回按矩阵顺序", readFohLines(SEQ), SCOPE.filter((id) => ["pos", "kiosk"].includes(id)));

console.log("\n[3] 全部关闭（本次修复的核心）");
reset();
writeAndCommit(SEQ, []);
check("已配置", isFohLinesConfigured(SEQ), true);
check("readFohLines 为空数组", readFohLines(SEQ), []);
check("resolveFohLines 不再复活为全选", resolveFohLines(SEQ), []);

console.log("\n[4] 存量裸数组（非空）");
reset();
storage.setItem(KEY, JSON.stringify(["pos", "paypad"]));
check("视为已配置", isFohLinesConfigured(SEQ), true);
check("值原样保留", resolveFohLines(SEQ), ["pos", "paypad"]);

console.log("\n[5] 存量裸空数组按未配置处理（升级不改变存量表现）");
reset();
storage.setItem(KEY, JSON.stringify([]));
check("视为未配置", isFohLinesConfigured(SEQ), false);
check("resolveFohLines 全选", resolveFohLines(SEQ), SCOPE);

console.log("\n[6] 在存量裸空数组上写入全关，需升级为结构体");
reset();
storage.setItem(KEY, JSON.stringify([]));
writeAndCommit(SEQ, []);
check("已升级为结构体", JSON.parse(storage.getItem(KEY) ?? "null"), { v: 1, lines: [] });
check("已配置", isFohLinesConfigured(SEQ), true);
check("resolveFohLines 为空", resolveFohLines(SEQ), []);

console.log("\n[7] 非产线字段不受编解码影响");
reset();
const { readModuleSettingJson, writeModuleSettingJson } = await import(
  "../src/config/module-settings-form-ui"
);
writeModuleSettingJson("999-not-a-line-field", { a: 1 });
commitPageDraft(FOH_PAGE_KEY);
check("对象原样落盘", JSON.parse(storage.getItem(moduleSettingStorageKey("999-not-a-line-field")) ?? "null"), {
  a: 1,
});
check("读回原样", readModuleSettingJson("999-not-a-line-field", null), { a: 1 });

console.log("\n[8] 全部关闭时同步全局镜像键为 0");
reset();
writeAndCommit(SEQ, []);
check(
  "镜像键为 0",
  storage.getItem(`bplant-module-setting-toggle:${SEQ}`),
  "0",
);
writeAndCommit(SEQ, ["pos"]);
check(
  "部分开启时镜像键为 1",
  storage.getItem(`bplant-module-setting-toggle:${SEQ}`),
  "1",
);

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} 项未通过：`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\n✓ 前厅适用产线存储语义校验通过");
