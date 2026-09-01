import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  setItem(key: string, value: string): void { this.map.set(key, String(value)); }
  removeItem(key: string): void { this.map.delete(key); }
  clear(): void { this.map.clear(); }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null; }
  get length(): number { return this.map.size; }
}

const storage = new MemoryStorage();
const g = globalThis as Record<string, unknown>;
const windowListeners = new Map<string, Array<(event: Record<string, unknown>) => void>>();
g.localStorage = storage;
g.window = {
  location: { hash: "#/operations/queue-call/settings" },
  localStorage: storage,
  addEventListener(type: string, listener: (event: Record<string, unknown>) => void) {
    const listeners = windowListeners.get(type) ?? [];
    listeners.push(listener);
    windowListeners.set(type, listeners);
  },
  removeEventListener() {},
  dispatchEvent: () => true,
  setTimeout,
  clearTimeout,
};
g.location = (g.window as { location: unknown }).location;
g.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  documentElement: { lang: "zh-CN" },
};

const {
  getActiveSettingEditContext,
  hubSearchEditScopeKey,
  setActiveSettingEditContext,
} = await import("../src/config/module-setting-edit-context");
const {
  discardPageDraft,
  isPageBatchSavePath,
  readPageDraftToggleForCurrentPath,
  resolveCurrentPageSaveKey,
  setPageDraftToggle,
  trackPageConfigChange,
} = await import("../src/config/page-settings-draft");
const {
  buildHubSearchIndex,
  queryHubSearchIndex,
  renderHubSearchResultsPane,
} = await import("../src/config/hub-sheet-search");
const { bindPageSaveGuard } = await import("../src/config/page-save-guard");

const hubId = "queue-call";
const scopeKey = hubSearchEditScopeKey(hubId);

console.log("滑层搜索结果直接编辑 · 聚焦验证");

console.log("\n[1] 显式搜索编辑上下文");
setActiveSettingEditContext({
  mode: "search",
  scopeKey,
  settingsPath: "/operations/queue-call/settings",
  hubId,
});
assert.equal(getActiveSettingEditContext()?.scopeKey, scopeKey);
assert.equal(isPageBatchSavePath(scopeKey), true);
assert.equal(resolveCurrentPageSaveKey(), scopeKey);
console.log("  ✓ 搜索 scopeKey 可作为批量保存桶");

console.log("\n[2] 搜索草稿与页面路径隔离");
discardPageDraft(scopeKey);
setPageDraftToggle(scopeKey, 118, false);
assert.equal(readPageDraftToggleForCurrentPath(118), false);
setActiveSettingEditContext(null);
assert.equal(readPageDraftToggleForCurrentPath(118), undefined);
console.log("  ✓ 当前 URL 不会吞掉或串用搜索会话草稿");

console.log("\n[3] 设置命中携带真实来源路径");
const index = buildHubSearchIndex(hubId);
assert.ok(index, "前厅 Hub 应可构建搜索索引");
const hits = queryHubSearchIndex(index!, "搜索菜单");
const settingHit = hits.find((hit) => hit.kind === "setting");
assert.ok(settingHit, "应命中设置项");
assert.equal(settingHit?.settingsPath, "/operations/queue-call/settings");
assert.equal(settingHit?.seq, 118);
console.log("  ✓ 命中项包含 settingsPath + seq");

console.log("\n[4] 设置结果使用完整设置表面插槽");
const html = renderHubSearchResultsPane(hubId, "搜索菜单", hits, (hit) =>
  `<div data-test-setting-surface="${hit.seq}">完整功能设置</div>`,
);
assert.match(html, /data-hub-search-setting-result/);
assert.match(html, /data-test-setting-surface="118"/);
assert.doesNotMatch(html, /data-hit-seq="118"[\s\S]*data-hit-kind="setting"/);

setActiveSettingEditContext({
  mode: "search",
  scopeKey,
  settingsPath: "/operations/queue-call/settings",
  hubId,
});
setPageDraftToggle(scopeKey, 118, true);
trackPageConfigChange(scopeKey, "/operations/queue-call/settings", {
  fieldKey: "toggle:118",
  label: "search menu",
  before: "off",
  after: "on",
});
bindPageSaveGuard();
const beforeUnload = windowListeners.get("beforeunload")?.[0];
assert.equal(beforeUnload, undefined, "browser refresh must not register a beforeunload prompt");
console.log("  ✓ 设置命中不再降级为跳转按钮");

setActiveSettingEditContext(null);
discardPageDraft(scopeKey);
console.log("\n✓ 滑层搜索直接编辑基础纵切通过");
