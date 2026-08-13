import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { handleEmenuSeasoningApi } from "./lib/emenu-local-seasoning-api-handler.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "emenu-seasoning-api-"));
const dbPath = path.join(tempDir, "db.json");
const server = http.createServer((req, res) => {
  handleEmenuSeasoningApi(req, res, dbPath).then((handled) => {
    if (!handled) {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const base = `http://127.0.0.1:${address.port}/api/v1/emenu-local/seasoning`;
const sessionHeaders = { "Content-Type": "application/json", "X-Seasoning-Session": "verify-session" };

try {
  const bootstrap = await fetch(`${base}/bootstrap`).then((response) => response.json());
  assert(bootstrap.version === 1, "Initial config version must be 1");
  assert(bootstrap.permissions?.canEdit === true, "Demo API must expose edit permission");

  const firstPage = await fetch(`${base}/options?limit=5`).then((response) => response.json());
  assert(firstPage.items.length === 5, "Option cursor page size failed");
  assert(firstPage.nextCursor, "Option page must provide next cursor");

  const selectionResponse = await fetch(`${base}/product-selections`, {
    method: "POST",
    headers: sessionHeaders,
    body: "{}",
  });
  assert(selectionResponse.status === 201, "Product selection draft request failed");
  const selection = await selectionResponse.json();
  assert(selection.token && selection.total === 0 && selection.expiresAt && selection.menuVersion, "Product selection draft is incomplete");

  const wrongSessionResponse = await fetch(`${base}/product-selections/${selection.token}`, {
    headers: { "X-Seasoning-Session": "another-session" },
  });
  assert(wrongSessionResponse.status === 409, "Product selection must be isolated by operator session");

  const menuBefore = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&limit=3`, {
    headers: sessionHeaders,
  }).then((response) => response.json());
  assert(menuBefore.groups.length >= 2, "Menu structure must expose real groups");
  assert(menuBefore.categories.length > 0, "Active group categories are missing");
  assert(menuBefore.dishes.items.length > 0, "Active category dishes are missing");
  assert(menuBefore.dishes.nextCursor, "Dish column must support cursor pagination");
  const activeGroup = menuBefore.activeGroupId;

  const selectedGroupResponse = await fetch(`${base}/product-selections/${selection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "scope", level: "group", groupId: activeGroup, query: "", selected: true }),
  });
  assert(selectedGroupResponse.ok, "Selecting a group draft scope failed");
  const selectedGroup = await selectedGroupResponse.json();
  assert(selectedGroup.total > 3, "Group cascade must include unloaded descendants");

  const menuAfter = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&groupId=${activeGroup}&limit=3`, {
    headers: sessionHeaders,
  }).then((response) => response.json());
  const selectedGroupNode = menuAfter.groups.find((group) => group.id === activeGroup);
  assert(selectedGroupNode.selectedCount === selectedGroupNode.selectableCount, "Group selected counts must drive checked state");
  assert(menuAfter.dishes.items.every((dish) => !dish.selectable || dish.selected), "Visible dish states must follow the server draft");

  const searchSelection = await fetch(`${base}/product-selections`, { method: "POST", headers: sessionHeaders, body: "{}" }).then((response) => response.json());
  const searchScopeResponse = await fetch(`${base}/product-selections/${searchSelection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "scope", level: "search", query: "宫保", selected: true }),
  }).then((response) => response.json());
  assert(searchScopeResponse.total === 1, "Search-scoped selection must only freeze matching products and deduplicate repeated paths");

  const previewResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({
      actionOptions: [
        { action: "ADD", optionPrices: [{ optionId: "o-chili", inputPrice: 1.01, markupCoefficient: 1.5, priceDelta: 1.52 }] },
        { action: "LESS", optionPrices: [{ optionId: "o-salt", inputPrice: 0, markupCoefficient: 1.38, priceDelta: 0 }] },
        { action: "NONE", optionPrices: [{ optionId: "o-garlic", inputPrice: 1, markupCoefficient: 2, priceDelta: 2 }] },
        { action: "MORE", optionPrices: [{ optionId: "o-mustard", inputPrice: 2, markupCoefficient: 1.5, priceDelta: 3 }] },
      ],
      productSelectionToken: selection.token,
      expectedVersion: bootstrap.version,
    }),
  });
  assert(previewResponse.ok, "Batch preview request failed");
  const preview = await previewResponse.json();
  assert(preview.actualProductCount === selectedGroup.total && preview.page.items.length > 0, "Selection draft did not expand on the server");
  assert(preview.total === selectedGroup.total * 4 && preview.summary.different >= 1 && preview.summary.inactive >= 1 && preview.summary.unavailable >= 1, "Multi-action preview summary is incomplete");
  assert(new Set(preview.page.items.map((item) => item.action)).size >= 4, "Preview must contain candidates for every configured action");
  assert(preview.page.items.every((item) => Number.isFinite(item.inputPrice) && Number.isFinite(item.markupCoefficient)), "Preview candidates must return complete pricing fields");
  const preciseCandidate = preview.page.items.find((item) => item.action === "ADD" && item.optionId === "o-chili");
  assert(preciseCandidate?.inputPrice === 1.01 && preciseCandidate.markupCoefficient === 1.5 && preciseCandidate.priceDelta === 1.52, "Preview pricing fields must preserve the fixed-point calculation");

  const previewPage = await fetch(`${base}/relation-previews/${preview.previewToken}/items?limit=2`, { headers: sessionHeaders }).then((response) => response.json());
  assert(previewPage.items.length === 2 && previewPage.nextCursor, "Preview candidates must use cursor pagination");

  const partialPricingResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-chili", inputPrice: 1, priceDelta: 1 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(partialPricingResponse.status === 400 && (await partialPricingResponse.json()).error === "invalid_price_fields", "Partial pricing fields must be rejected");

  const inconsistentPricingResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-chili", inputPrice: 1.01, markupCoefficient: 1.5, priceDelta: 1.51 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(inconsistentPricingResponse.status === 400 && (await inconsistentPricingResponse.json()).error === "invalid_price_calculation", "Inconsistent actual prices must be rejected");

  const overPreciseInputResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-chili", inputPrice: 1.005, markupCoefficient: 1, priceDelta: 1.01 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(overPreciseInputResponse.status === 400 && (await overPreciseInputResponse.json()).error === "invalid_input_price", "Option base prices with more than two decimals must be rejected");

  const invalidCoefficientResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-chili", inputPrice: 1, markupCoefficient: 0.495, priceDelta: 0.5 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(invalidCoefficientResponse.status === 400 && (await invalidCoefficientResponse.json()).error === "invalid_markup_coefficient", "Markup coefficients must enforce precision before range normalization");

  const halfCentPreviewResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-cilantro", inputPrice: 0.05, markupCoefficient: 0.5, priceDelta: 0.03 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(halfCentPreviewResponse.ok, "Fixed-point half-cent pricing must be accepted");
  const halfCentPreview = await halfCentPreviewResponse.json();
  assert(halfCentPreview.page.items.every((item) => item.inputPrice === 0.05 && item.markupCoefficient === 0.5 && item.priceDelta === 0.03), "Half-cent pricing must round once in the response");

  const legacyPreviewResponse = await fetch(`${base}/relations/preview`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ actionOptions: [{ action: "ADD", optionPrices: [{ optionId: "o-cilantro", priceDelta: 2.25 }] }], productSelectionToken: selection.token, expectedVersion: bootstrap.version }),
  });
  assert(legacyPreviewResponse.ok, "Legacy price-only previews must remain supported");
  const legacyPreview = await legacyPreviewResponse.json();
  assert(legacyPreview.page.items.every((item) => item.inputPrice === 2.25 && item.markupCoefficient === 1 && item.priceDelta === 2.25), "Legacy previews must return complete pricing fields");
  const legacyCandidateId = legacyPreview.page.items[0].candidateId;
  const invalidLegacyPatch = await fetch(`${base}/relation-previews/${legacyPreview.previewToken}/items`, { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ candidateId: legacyCandidateId, priceDelta: -1 }) });
  assert(invalidLegacyPatch.status === 400 && (await invalidLegacyPatch.json()).error === "invalid_price_delta", "Legacy price patches must use strict price validation");
  const overPreciseLegacyPatch = await fetch(`${base}/relation-previews/${legacyPreview.previewToken}/items`, { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ candidateId: legacyCandidateId, priceDelta: 2.345 }) });
  assert(overPreciseLegacyPatch.status === 400 && (await overPreciseLegacyPatch.json()).error === "invalid_price_delta", "Legacy price patches must reject more than two decimals");
  const legacyPatch = await fetch(`${base}/relation-previews/${legacyPreview.previewToken}/items`, { method: "PATCH", headers: sessionHeaders, body: JSON.stringify({ candidateId: legacyCandidateId, priceDelta: 2.34 }) });
  assert(legacyPatch.ok, "Valid legacy price patches must remain supported");
  const patchedLegacyCandidate = (await legacyPatch.json()).candidate;
  assert(patchedLegacyCandidate.inputPrice === 2.34 && patchedLegacyCandidate.markupCoefficient === 1 && patchedLegacyCandidate.priceDelta === 2.34, "Legacy price patches must restore the pricing invariant");

  const productPreviewResponse = await fetch(`${base}/relation-previews/${preview.previewToken}/products?limit=2`, { headers: sessionHeaders });
  assert(productPreviewResponse.ok, "Grouped product preview request failed");
  const productPreview = await productPreviewResponse.json();
  assert(productPreview.items.length === 2 && productPreview.nextCursor, "Grouped preview must paginate by product");
  assert(productPreview.items.every((product) => product.actions.map((group) => group.action).join(",") === "ADD,LESS,MORE,NONE"), "Each product must contain complete ordered action groups");
  assert(productPreview.items.every((product) => product.optionCount === 4 && product.actions.every((group) => group.items.length === 1)), "Grouped preview counts are incomplete");
  const firstProductIds = new Set(productPreview.items.map((product) => product.productId));
  const nextProductPreview = await fetch(`${base}/relation-previews/${preview.previewToken}/products?limit=2&cursor=${encodeURIComponent(productPreview.nextCursor)}`, { headers: sessionHeaders }).then((response) => response.json());
  assert(nextProductPreview.items.every((product) => !firstProductIds.has(product.productId)), "Product cursor pages must not overlap");
  const wrongScopeCursor = await fetch(`${base}/relation-previews/${preview.previewToken}/products?kind=different&limit=2&cursor=${encodeURIComponent(productPreview.nextCursor)}`, { headers: sessionHeaders });
  assert(wrongScopeCursor.status === 400, "Product cursors must be scoped to the active filter");

  const differences = await fetch(`${base}/relation-previews/${preview.previewToken}/items?kind=different&limit=10`, { headers: sessionHeaders }).then((response) => response.json());
  assert(differences.items.length >= 1, "Difference filter must return unresolved candidates");
  const groupedDifferences = await fetch(`${base}/relation-previews/${preview.previewToken}/products?kind=different&limit=10`, { headers: sessionHeaders }).then((response) => response.json());
  assert(groupedDifferences.items.length >= 1 && groupedDifferences.items.every((product) => product.actions.every((group) => group.items.every((item) => item.kind === "different"))), "Grouped kind filter must only include matching candidates");
  assert(groupedDifferences.items.some((product) => product.actions.some((group) => group.items.some((item) => item.candidateId === differences.items[0].candidateId))), "Grouped kind filter must preserve candidate membership");
  assert(preview.unresolvedCount === 0 && productPreview.unresolvedCount === 0, "Automatic preview policy must not require manual conflict decisions");

  const commitResponse = await fetch(`${base}/relations/batch`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ expectedVersion: bootstrap.version, previewToken: preview.previewToken }),
  });
  assert(commitResponse.ok, "Atomic batch commit failed");
  const commit = await commitResponse.json();
  assert(commit.version === 2, "Successful transaction must increment version once");
  assert(commit.updated >= 1, "Different prices must automatically use the current batch value");
  assert(commit.reactivated >= 1, "Inactive relations must automatically reactivate");

  const committedDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const reactivatedGarlic = committedDb.relations.find((relation) => relation.productId === "p-yuxiang" && relation.action === "NONE" && relation.optionId === "o-garlic");
  assert(reactivatedGarlic?.status === "active" && reactivatedGarlic.priceDelta === 2, "Reactivated relation must use the current batch price");
  assert(!committedDb.relations.some((relation) => relation.optionId === "o-mustard"), "Unavailable options must be skipped during commit");

  const conflictResponse = await fetch(`${base}/relations/batch`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ expectedVersion: bootstrap.version, previewToken: preview.previewToken }),
  });
  assert(conflictResponse.status === 409, "Stale version must return 409");

  const staleSelection = await fetch(`${base}/product-selections`, { method: "POST", headers: sessionHeaders, body: "{}" }).then((response) => response.json());
  const persisted = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const changedProduct = persisted.products.find((product) => product.status === "active" && product.emenuSellable);
  assert(changedProduct, "Stale product-selection test needs an active product");
  changedProduct.name = `${changedProduct.name}（已调整）`;
  fs.writeFileSync(dbPath, JSON.stringify(persisted, null, 2), "utf8");
  const staleSelectionResponse = await fetch(`${base}/product-selections/${staleSelection.token}`, { headers: sessionHeaders });
  assert(staleSelectionResponse.status === 409, "Menu selection changes must invalidate a product draft");
  const staleSelectionError = await staleSelectionResponse.json();
  assert(staleSelectionError.error === "product_selection_stale", "Stale product selection must return a stable error code");
  changedProduct.name = changedProduct.name.replace("（已调整）", "");
  fs.writeFileSync(dbPath, JSON.stringify(persisted, null, 2), "utf8");

  const snapshot = await fetch(`${base}/snapshot`).then((response) => response.json());
  assert(snapshot.version === 2 && Array.isArray(snapshot.relations), "Terminal snapshot is incomplete");

  const createdOptionResponse = await fetch(`${base}/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedVersion: 2, name: "测试调味", code: "TEST_OPTION", sortOrder: 999 }),
  });
  assert(createdOptionResponse.status === 201, "Atomic replacement of an existing database file failed");
  const createdOption = await createdOptionResponse.json();
  assert(createdOption.version === 3, "Second transaction must increment the version once");

  const audit = await fetch(`${base}/audit-log?limit=10`).then((response) => response.json());
  assert(audit.items.length >= 2, "Each successful mutation must create an audit record");

  console.log("eMenu local seasoning API verification passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
}
