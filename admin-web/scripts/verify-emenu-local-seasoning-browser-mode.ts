import { strict as assert } from "node:assert";
import { resolveSeasoningApiMode } from "../src/emenu-local/seasoning/seasoning-api-mode";
import { createBrowserSeasoningRequest } from "../src/emenu-local/seasoning/seasoning-browser-transport";
import { createSeasoningApi, SeasoningApiError } from "../src/emenu-local/seasoning/seasoning-api";

assert.equal(resolveSeasoningApiMode(undefined, "127.0.0.1"), "http");
assert.equal(resolveSeasoningApiMode("auto", "localhost"), "http");
assert.equal(resolveSeasoningApiMode(undefined, "cflyindance.github.io"), "browser");
assert.equal(resolveSeasoningApiMode("auto", "preview.github.io"), "browser");
assert.equal(resolveSeasoningApiMode("browser", "127.0.0.1"), "browser");
assert.equal(resolveSeasoningApiMode("http", "cflyindance.github.io"), "http");
assert.throws(
  () => resolveSeasoningApiMode("fallback", "cflyindance.github.io"),
  /invalid_emenu_seasoning_mode/,
);

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

class SerialLockManager {
  private tail: Promise<unknown> = Promise.resolve();
  request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const result = this.tail.then(callback);
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }
}

async function expectApiError(action: () => Promise<unknown>, status: number, code: string): Promise<void> {
  try {
    await action();
    assert.fail(`Expected ${code}`);
  } catch (error) {
    assert(error instanceof SeasoningApiError);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    if (code.startsWith("browser_")) assert.deepEqual(error.payload, { error: code, mode: "browser" });
  }
}

const storage = new MemoryStorage();
const lockManager = new SerialLockManager();
const browserRequest = createBrowserSeasoningRequest({ storage, lockManager });
const bootstrap = await browserRequest<{ version: number; permissions: { canEdit: boolean } }>("/bootstrap");
assert.equal(bootstrap.version, 1);
assert.equal(bootstrap.permissions.canEdit, true);

const created = await browserRequest<{ version: number; option: { code: string } }>("/options", {
  method: "POST",
  body: JSON.stringify({ expectedVersion: bootstrap.version, name: "Browser option", code: "BROWSER_OPTION", categoryId: "option-category-seasoning" }),
});
assert.equal(created.version, 2);
assert.equal(created.option.code, "BROWSER_OPTION");

const afterReload = createBrowserSeasoningRequest({ storage, lockManager });
const options = await afterReload<{ items: Array<{ code: string }> }>("/options?limit=50");
assert(options.items.some((option) => option.code === "BROWSER_OPTION"));

const contractStorage = new MemoryStorage();
const contractApi = createSeasoningApi(createBrowserSeasoningRequest({ storage: contractStorage, lockManager: new SerialLockManager() }));
let contractBootstrap = await contractApi.bootstrap();
assert((await contractApi.summaries({ limit: 5 })).items.length > 0);
assert((await contractApi.relationProductGroups({ page: 1, limit: 5 })).items.length > 0);
assert((await contractApi.options({ limit: 5 })).items.length === 5);
assert((await contractApi.optionPicker()).items.length > 0);

let categories = await contractApi.optionCategories(true);
const categoryCreated = await contractApi.createOptionCategory({ expectedVersion: contractBootstrap.version, name: "Browser category", code: "BROWSER_CATEGORY" });
const categoryUpdated = await contractApi.updateOptionCategory(categoryCreated.category.id, { expectedVersion: categoryCreated.version, name: "Browser category updated" });
categories = await contractApi.optionCategories(true);
const movableCategoryIds = categories.items.filter((category) => !category.system).map((category) => category.id).reverse();
const categoriesReordered = await contractApi.reorderOptionCategories({ expectedVersion: categoryUpdated.version, categoryIds: movableCategoryIds });
const optionCreated = await contractApi.createOption({ expectedVersion: categoriesReordered.version, name: "Browser matrix option", code: "BROWSER_MATRIX", categoryId: categoryCreated.category.id });
const optionUpdated = await contractApi.updateOption(optionCreated.option.id, { expectedVersion: optionCreated.version, nameEn: "Browser matrix", categoryId: "option-category-seasoning" });
const categoryDeleted = await contractApi.deleteOptionCategory(categoryCreated.category.id, { expectedVersion: optionUpdated.version });
contractBootstrap = await contractApi.bootstrap();
assert.equal(categoryDeleted.version, contractBootstrap.version);
assert((await contractApi.products({ limit: 5 })).items.length === 5);

const selection = await contractApi.createProductSelection();
assert.equal((await contractApi.productSelection(selection.token)).total, 0);
const menu = await contractApi.menuStructure({ selectionToken: selection.token, limit: 5 });
assert(menu.dishes.items.length > 0);
const selectedProductId = menu.dishes.items[0].id;
const selected = await contractApi.updateProductSelection(selection.token, { operation: "dish", productId: selectedProductId, selected: true });
assert.equal(selected.total, 1);

const productRelations = await contractApi.productRelations(selectedProductId);
const savedRelations = await contractApi.saveProductRelations(selectedProductId, {
  expectedVersion: contractBootstrap.version,
  relations: productRelations.relations.map(({ action, optionId, priceDelta, sortOrder, status }) => ({ action, optionId, priceDelta, sortOrder, status })),
});
assert.equal(savedRelations.version, contractBootstrap.version + 1);
contractBootstrap = await contractApi.bootstrap();
assert((await contractApi.relationProducts({ action: "ADD", optionId: "o-cilantro", limit: 5 })).items.length >= 0);

const preview = await contractApi.previewBatch({
  expectedVersion: contractBootstrap.version,
  productSelectionToken: selection.token,
  actionOptions: [{ action: "ADD", optionPrices: [{ optionId: optionCreated.option.id, inputPrice: 1, markupCoefficient: 1.5, priceDelta: 1.5 }] }],
});
const previewItems = await contractApi.previewItems(preview.previewToken, { limit: 5 });
assert(previewItems.items.length > 0);
assert((await contractApi.previewProducts(preview.previewToken, { page: 1, limit: 5 })).items.length === 1);
await contractApi.updatePreviewDecision(preview.previewToken, { candidateId: previewItems.items[0].candidateId, resolution: "use" });
const committed = await contractApi.commitBatch({ expectedVersion: contractBootstrap.version, previewToken: preview.previewToken });
assert.equal(committed.version, contractBootstrap.version + 1);

const discardSelection = await contractApi.createProductSelection();
await contractApi.updateProductSelection(discardSelection.token, { operation: "dish", productId: selectedProductId, selected: true });
const discardPreview = await contractApi.previewBatch({
  expectedVersion: committed.version,
  productSelectionToken: discardSelection.token,
  actionOptions: [{ action: "LESS", optionPrices: [{ optionId: "o-salt", inputPrice: 0, markupCoefficient: 1, priceDelta: 0 }] }],
});
await contractApi.discardPreview(discardPreview.previewToken);
await contractApi.discardProductSelection(discardSelection.token);

const concurrentStorage = new MemoryStorage();
const concurrentApi = createSeasoningApi(createBrowserSeasoningRequest({ storage: concurrentStorage, lockManager: new SerialLockManager() }));
const concurrentVersion = (await concurrentApi.bootstrap()).version;
const concurrentWrites = await Promise.allSettled([
  concurrentApi.createOption({ expectedVersion: concurrentVersion, name: "Concurrent A", code: "CONCURRENT_A", categoryId: "option-category-seasoning" }),
  concurrentApi.createOption({ expectedVersion: concurrentVersion, name: "Concurrent B", code: "CONCURRENT_B", categoryId: "option-category-seasoning" }),
]);
assert.equal(concurrentWrites.filter((result) => result.status === "fulfilled").length, 1);
const rejectedWrite = concurrentWrites.find((result): result is PromiseRejectedResult => result.status === "rejected");
assert(rejectedWrite?.reason instanceof SeasoningApiError);
assert.equal(rejectedWrite.reason.code, "version_conflict");

const invalidStorage = new MemoryStorage();
invalidStorage.setItem("emenu-local:seasoning-demo:v1", "{invalid-json");
await expectApiError(() => createBrowserSeasoningRequest({ storage: invalidStorage, lockManager: new SerialLockManager() })("/bootstrap"), 500, "browser_demo_data_invalid");
const unavailableStorage = { ...new MemoryStorage(), getItem: () => { throw new Error("blocked"); } } as Storage;
await expectApiError(() => createBrowserSeasoningRequest({ storage: unavailableStorage, lockManager: new SerialLockManager() })("/bootstrap"), 503, "browser_storage_unavailable");
const quotaStorage = { ...new MemoryStorage(), getItem: () => null, setItem: () => { throw new Error("quota"); } } as Storage;
await expectApiError(() => createBrowserSeasoningRequest({ storage: quotaStorage, lockManager: new SerialLockManager() })("/bootstrap"), 507, "browser_storage_write_failed");
const noLockStorage = new MemoryStorage();
await createBrowserSeasoningRequest({ storage: noLockStorage, lockManager: new SerialLockManager() })("/bootstrap");
await expectApiError(() => createBrowserSeasoningRequest({ storage: noLockStorage })("/options", { method: "POST", body: "{}" }), 503, "browser_lock_unavailable");

console.log("eMenu seasoning browser mode verification passed");
