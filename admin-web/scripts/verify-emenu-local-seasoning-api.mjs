import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { handleEmenuSeasoningApi, loadEmenuSeasoningDb } from "./lib/emenu-local-seasoning-api-handler.mjs";
import {
  createEmenuSeasoningSeedDb,
  DEFAULT_OPTION_CATEGORY_BACKFILL_ITEMS,
  DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION,
  UNCATEGORIZED_OPTION_CATEGORY_ID,
} from "./lib/emenu-local-seasoning-seed.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeDb(filePath, db) {
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf8");
}

function readDb(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function migrationAuditCount(db) {
  return db.auditLog.filter((entry) => entry.operation === "migrate_option_categories").length;
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
  assert(firstPage.items.every((option) => option.categoryId && option.categoryName), "Option pages must expose category identity and name");
  const optionPicker = await fetch(`${base}/option-picker`).then((response) => response.json());
  assert(optionPicker.version === 1 && optionPicker.categories.length >= 4 && optionPicker.items.length === 19, "Option picker must return one complete active categorized snapshot");
  assert(optionPicker.categories.at(-1)?.code === "UNCATEGORIZED", "Uncategorized system category must remain last");

  const relationGroups = await fetch(`${base}/relations/product-groups`).then((response) => response.json());
  assert(relationGroups.page === 1 && relationGroups.pageSize === 10, "Relation product groups must default to page one with ten products");
  assert(relationGroups.totalProducts > 0 && relationGroups.items.length <= 10, "Relation product group pagination metadata is incomplete");
  assert(relationGroups.items.every((product) => product.actions.length > 0 && product.visibleRelationCount === product.actions.reduce((count, action) => count + action.items.length, 0)), "Relation product groups must contain complete visible action details");
  assert(relationGroups.items.every((product) => product.actions.map((action) => action.action).join(",") === product.actions.map((action) => action.action).slice().sort((left, right) => ["ADD", "LESS", "MORE", "NONE"].indexOf(left) - ["ADD", "LESS", "MORE", "NONE"].indexOf(right)).join(",")), "Relation product actions must use the fixed order");
  assert(relationGroups.items.every((product) => product.actions.every((action) => action.items.every((item) => typeof item.optionName === "string" && Number.isFinite(item.priceDelta)))), "Relation product options must expose names and actual prices");

  const productSearchGroups = await fetch(`${base}/relations/product-groups?query=${encodeURIComponent("宫保")}&page=1&limit=5`).then((response) => response.json());
  assert(productSearchGroups.totalProducts === 1 && productSearchGroups.items[0].actions.length > 1, "Product search must preserve every matching product action");
  const optionSearchGroups = await fetch(`${base}/relations/product-groups?query=CHILI&page=1&limit=5`).then((response) => response.json());
  assert(optionSearchGroups.totalProducts > 0 && optionSearchGroups.items.every((product) => product.actions.every((action) => action.items.every((item) => item.optionId === "o-chili"))), "Option search must trim each product to matching options");
  const addGroups = await fetch(`${base}/relations/product-groups?action=ADD&page=1&limit=50`).then((response) => response.json());
  assert(addGroups.items.length > 0 && addGroups.items.every((product) => product.actions.length === 1 && product.actions[0].action === "ADD"), "Action filtering must hide unmatched actions and products");
  const mixedGroups = await fetch(`${base}/relations/product-groups?status=mixed&page=1&limit=50`).then((response) => response.json());
  assert(mixedGroups.items.length > 0 && mixedGroups.items.every((product) => product.status === "mixed"), "Relation product status filtering is incorrect");
  for (const pageSize of [5, 10, 20, 50]) {
    const sizedGroups = await fetch(`${base}/relations/product-groups?page=1&limit=${pageSize}`).then((response) => response.json());
    assert(sizedGroups.pageSize === pageSize && sizedGroups.totalPages === Math.ceil(sizedGroups.totalProducts / pageSize), `Relation product page size ${pageSize} failed`);
  }
  const invalidRelationPageSize = await fetch(`${base}/relations/product-groups?page=1&limit=6`);
  assert(invalidRelationPageSize.status === 400 && (await invalidRelationPageSize.json()).error === "invalid_page_size", "Relation product groups must reject unsupported page sizes");
  const invalidRelationPage = await fetch(`${base}/relations/product-groups?page=0&limit=10`);
  assert(invalidRelationPage.status === 400 && (await invalidRelationPage.json()).error === "invalid_page", "Relation product groups must reject invalid pages");
  const beyondRelationPage = await fetch(`${base}/relations/product-groups?page=999&limit=5`).then((response) => response.json());
  assert(beyondRelationPage.page === 999 && beyondRelationPage.totalPages > 0 && beyondRelationPage.items.length === 0, "Relation product groups must echo beyond-last-page requests as empty pages");

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
  const mainGroupBefore = menuBefore.groups.find((group) => group.id === "group-main");
  const hotCategoryBefore = menuBefore.categories.find((category) => category.id === "cat-hot");
  assert(mainGroupBefore?.selectableCount === 11, "Menu group counts must exclude inactive and non-eMenu products");
  assert(hotCategoryBefore?.dishCount === 4 && hotCategoryBefore.selectableCount === 4, "Menu category counts must only include selectable products");
  assert(menuBefore.dishes.items.every((dish) => dish.selectable && !["p-retired", "p-not-sellable"].includes(dish.id) && !Object.prototype.hasOwnProperty.call(dish, "unavailableReason")), "Menu dishes must not expose unavailable products or reasons");

  const fullHotMenu = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&groupId=group-main&categoryId=cat-hot&limit=50`, { headers: sessionHeaders }).then((response) => response.json());
  assert(fullHotMenu.dishes.items.length === 4 && fullHotMenu.dishes.items.every((dish) => dish.status === "active" && dish.emenuSellable === true), "Complete dish pages must contain selectable products only");
  const codeMenu = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&query=D1001&limit=50`, { headers: sessionHeaders }).then((response) => response.json());
  assert(codeMenu.query === "D1001" && codeMenu.dishes.items.length === 1 && codeMenu.dishes.items[0].id === "p-kungpao", "Internal product code search must remain supported without exposing unavailable products");
  for (const unavailableQuery of ["已停用菜品", "D9998", "非 eMenu 菜品", "D9999"]) {
    const unavailableMenu = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&query=${encodeURIComponent(unavailableQuery)}&limit=50`, { headers: sessionHeaders }).then((response) => response.json());
    assert(unavailableMenu.groups.length === 0 && unavailableMenu.categories.length === 0 && unavailableMenu.dishes.items.length === 0, `Unavailable product query ${unavailableQuery} must return no menu results`);
  }

  const partialSelection = await fetch(`${base}/product-selections`, { method: "POST", headers: sessionHeaders, body: "{}" }).then((response) => response.json());
  await fetch(`${base}/product-selections/${partialSelection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "dish", productId: "p-kungpao", selected: true }),
  });
  const partialMenu = await fetch(`${base}/menu-structure?selectionToken=${partialSelection.token}&groupId=group-main&categoryId=cat-hot&limit=3`, { headers: sessionHeaders }).then((response) => response.json());
  const partialGroup = partialMenu.groups.find((group) => group.id === "group-main");
  const partialCategory = partialMenu.categories.find((category) => category.id === "cat-hot");
  assert(partialGroup?.selectedCount === 1 && partialGroup.selectableCount === 11, "Group counts must expose a partial selection across unloaded dishes");
  assert(partialCategory?.selectedCount === 1 && partialCategory.selectableCount === 4, "Category counts must expose a partial selection across unloaded dishes");
  const activeGroup = menuBefore.activeGroupId;

  const selectedGroupResponse = await fetch(`${base}/product-selections/${selection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "scope", level: "group", groupId: activeGroup, query: "", selected: true }),
  });
  assert(selectedGroupResponse.ok, "Selecting a group draft scope failed");
  const selectedGroup = await selectedGroupResponse.json();
  assert(selectedGroup.total === 11, "Group cascade must include every unloaded selectable descendant and exclude unavailable products");

  const menuAfter = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&groupId=${activeGroup}&limit=3`, {
    headers: sessionHeaders,
  }).then((response) => response.json());
  const selectedGroupNode = menuAfter.groups.find((group) => group.id === activeGroup);
  assert(selectedGroupNode.selectedCount === selectedGroupNode.selectableCount, "Group selected counts must drive checked state");
  assert(menuAfter.dishes.items.every((dish) => !dish.selectable || dish.selected), "Visible dish states must follow the server draft");
  const otherGroupAfterMain = menuAfter.groups.find((group) => group.id !== activeGroup);
  assert(otherGroupAfterMain && otherGroupAfterMain.selectedCount === 0, "Selecting one group must not mark overlapping products as selected in another group path");
  const featuredAfterMain = await fetch(`${base}/menu-structure?selectionToken=${selection.token}&groupId=group-featured&limit=50`, {
    headers: sessionHeaders,
  }).then((response) => response.json());
  assert(featuredAfterMain.groups.find((group) => group.id === "group-featured")?.selectedCount === 0, "Featured group path must stay unselected after selecting main group");
  assert(featuredAfterMain.dishes.items.every((dish) => !dish.selected), "Featured dishes must stay unchecked when selected only via another group path");

  const searchSelection = await fetch(`${base}/product-selections`, { method: "POST", headers: sessionHeaders, body: "{}" }).then((response) => response.json());
  const searchScopeResponse = await fetch(`${base}/product-selections/${searchSelection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "scope", level: "search", query: "宫保", selected: true }),
  }).then((response) => response.json());
  assert(searchScopeResponse.total === 1, "Search-scoped selection must only freeze matching products and deduplicate repeated paths");
  const legacyCodeScopeResponse = await fetch(`${base}/product-selections/${searchSelection.token}`, {
    method: "PATCH",
    headers: sessionHeaders,
    body: JSON.stringify({ operation: "scope", level: "search", query: "D1001", selected: true }),
  }).then((response) => response.json());
  assert(legacyCodeScopeResponse.total === 1, "Legacy search-scope selection must keep code matching and deduplicate repeated menu paths");

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
  assert(!Object.prototype.hasOwnProperty.call(productPreview, "page") && !Object.prototype.hasOwnProperty.call(productPreview, "totalPages"), "Cursor pages must not expose number-pagination metadata");
  assert(productPreview.items.every((product) => product.finalRelationCount === product.actions.reduce((total, group) => total + group.items.length, 0)), "Final relation counts must match complete action groups");
  assert(productPreview.items.every((product) => product.actions.slice(0, 3).map((group) => group.action).join(",") === "ADD,LESS,NONE"), "Configured available actions must preserve request order");
  assert(productPreview.items.every((product) => product.excludedCandidates.some((item) => item.optionId === "o-mustard" && item.includedInFinal === false)), "Unavailable candidates must be excluded from final relations");
  assert(productPreview.items.every((product) => product.actions.every((group) => group.items.every((item) => item.includedInFinal === true && Number.isFinite(item.inputPrice) && Number.isFinite(item.markupCoefficient)))), "Final preview relations must expose complete discriminated pricing fields");
  const firstProductIds = new Set(productPreview.items.map((product) => product.productId));
  const nextProductPreview = await fetch(`${base}/relation-previews/${preview.previewToken}/products?limit=2&cursor=${encodeURIComponent(productPreview.nextCursor)}`, { headers: sessionHeaders }).then((response) => response.json());
  assert(nextProductPreview.items.every((product) => !firstProductIds.has(product.productId)), "Product cursor pages must not overlap");
  const wrongScopeCursor = await fetch(`${base}/relation-previews/${preview.previewToken}/products?kind=different&limit=2&cursor=${encodeURIComponent(productPreview.nextCursor)}`, { headers: sessionHeaders });
  assert(wrongScopeCursor.status === 400, "Product cursors must be scoped to the active filter");

  const numberPageResponse = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=2&limit=5`, { headers: sessionHeaders });
  assert(numberPageResponse.ok, "Direct product number pagination failed");
  const numberPage = await numberPageResponse.json();
  assert(numberPage.page === 2 && numberPage.pageSize === 5 && numberPage.totalProducts === selectedGroup.total && numberPage.totalPages === Math.ceil(selectedGroup.total / 5), "Number pagination metadata is incomplete");
  assert(numberPage.items.length === Math.min(5, Math.max(0, selectedGroup.total - 5)), "Number pagination product slice is incorrect");
  assert(!Object.prototype.hasOwnProperty.call(numberPage, "nextCursor"), "Number pages must not expose cursor metadata");

  const defaultNumberPage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1`, { headers: sessionHeaders }).then((response) => response.json());
  assert(defaultNumberPage.pageSize === 5 && defaultNumberPage.items.length === Math.min(5, selectedGroup.total), "Number pagination must default to five products");
  for (const pageSize of [5, 10, 20, 50]) {
    const sizedPage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1&limit=${pageSize}`, { headers: sessionHeaders }).then((response) => response.json());
    assert(sizedPage.pageSize === pageSize && sizedPage.totalPages === Math.ceil(selectedGroup.total / pageSize), `Page size ${pageSize} metadata failed`);
  }

  const paginationConflict = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1&cursor=anything`, { headers: sessionHeaders });
  assert(paginationConflict.status === 400 && (await paginationConflict.json()).error === "invalid_pagination", "Page and cursor parameters must be mutually exclusive");
  const invalidPageSize = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1&limit=6`, { headers: sessionHeaders });
  assert(invalidPageSize.status === 400 && (await invalidPageSize.json()).error === "invalid_page_size", "Unsupported page sizes must be rejected");
  const duplicatePageSize = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1&limit=5&limit=10`, { headers: sessionHeaders });
  assert(duplicatePageSize.status === 400 && (await duplicatePageSize.json()).error === "invalid_page_size", "Repeated page sizes must be rejected");
  const invalidPage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=0&limit=5`, { headers: sessionHeaders });
  assert(invalidPage.status === 400 && (await invalidPage.json()).error === "invalid_page", "Non-positive page numbers must be rejected");
  const duplicatePage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=1&page=2&limit=5`, { headers: sessionHeaders });
  assert(duplicatePage.status === 400 && (await duplicatePage.json()).error === "invalid_page", "Repeated page numbers must be rejected");
  const unsafePage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=999999999999999999999&limit=50`, { headers: sessionHeaders });
  assert(unsafePage.status === 400 && (await unsafePage.json()).error === "invalid_page", "Unsafe page offsets must be rejected");
  const beyondLastPage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?page=999&limit=5`, { headers: sessionHeaders }).then((response) => response.json());
  assert(beyondLastPage.page === 999 && beyondLastPage.items.length === 0 && beyondLastPage.totalPages > 0, "Non-empty previews must echo beyond-last-page requests as empty pages");

  const emptyNumberPage = await fetch(`${base}/relation-previews/${preview.previewToken}/products?kind=missing&page=9&limit=5`, { headers: sessionHeaders }).then((response) => response.json());
  assert(emptyNumberPage.page === 1 && emptyNumberPage.totalProducts === 0 && emptyNumberPage.totalPages === 0 && emptyNumberPage.items.length === 0, "Zero-product number pages must normalize to page one");

  const differences = await fetch(`${base}/relation-previews/${preview.previewToken}/items?kind=different&limit=10`, { headers: sessionHeaders }).then((response) => response.json());
  assert(differences.items.length >= 1, "Difference filter must return unresolved candidates");
  const groupedDifferences = await fetch(`${base}/relation-previews/${preview.previewToken}/products?kind=different&limit=10`, { headers: sessionHeaders }).then((response) => response.json());
  assert(groupedDifferences.items.length >= 1, "Grouped kind filter must return products containing matching candidates");
  assert(groupedDifferences.items.some((product) => product.actions.some((group) => group.items.some((item) => item.source === "configured" && item.kind === "different" && item.candidateId === differences.items[0].candidateId))), "Grouped kind filter must preserve matching candidate membership inside the complete final relation set");
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
  const committedKungpao = committedDb.relations.filter((relation) => relation.productId === "p-kungpao");
  assert(new Set(committedKungpao.map((relation) => relation.sortOrder)).size === committedKungpao.length && committedKungpao.every((relation) => Number.isSafeInteger(relation.sortOrder) && relation.sortOrder >= 10_000_010), "Batch commit must atomically assign unique encoded sort orders");

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

  const reorderProductResponse = await fetch(`${base}/products/p-kungpao/relations`, {
    method: "PUT",
    headers: sessionHeaders,
    body: JSON.stringify({ expectedVersion: 3, relations: [
      { action: "NONE", optionId: "o-soy", priceDelta: 0.2, sortOrder: -9, status: "active" },
      { action: "NONE", optionId: "o-chili", priceDelta: 0, sortOrder: 1.5, status: "inactive" },
      { action: "ADD", optionId: "o-peanut", priceDelta: 1, sortOrder: 10, status: "active" },
    ] }),
  });
  assert(reorderProductResponse.ok, "Single-product ordered replacement failed");
  const reorderedProduct = await reorderProductResponse.json();
  assert(reorderedProduct.version === 4 && reorderedProduct.relations.map((relation) => relation.action).join(",") === "NONE,NONE,ADD", "Single-product PUT must preserve ordered payload actions");
  assert(reorderedProduct.relations.map((relation) => relation.sortOrder).join(",") === "10000010,10000020,11000010", "Server must generate encoded sort orders instead of trusting client values");
  assert(reorderedProduct.relations[1].status === "inactive", "Single-product status must round-trip");
  const reorderedGroups = await fetch(`${base}/relations/product-groups?query=D1001&page=1&limit=10`).then((response) => response.json());
  assert(reorderedGroups.items[0].actions.map((group) => group.action).join(",") === "NONE,ADD", "Product-group API must return saved action order");
  assert(reorderedGroups.items[0].actions[0].items.map((item) => item.optionId).join(",") === "o-soy,o-chili", "Product-group API must return saved option order");

  const deleteProductRelationsResponse = await fetch(`${base}/products/p-kungpao/relations`, {
    method: "PUT",
    headers: sessionHeaders,
    body: JSON.stringify({ expectedVersion: 4, relations: [] }),
  });
  assert(deleteProductRelationsResponse.ok, "Deleting a complete product association row failed");
  const deleteProductRelations = await deleteProductRelationsResponse.json();
  assert(deleteProductRelations.version === 5 && deleteProductRelations.relations.length === 0, "Complete product deletion must increment the version and return no relations");
  const deletedProductGroups = await fetch(`${base}/relations/product-groups?query=${encodeURIComponent("宫保")}&page=1&limit=10`).then((response) => response.json());
  assert(deletedProductGroups.totalProducts === 0 && deletedProductGroups.page === 1 && deletedProductGroups.totalPages === 0, "Deleted products must disappear from product-group pagination");

  const audit = await fetch(`${base}/audit-log?limit=10`).then((response) => response.json());
  assert(audit.items.length >= 4, "Each successful mutation must create an audit record");

  const createdCategoryResponse = await fetch(`${base}/option-categories`, { method: "POST", headers: sessionHeaders, body: JSON.stringify({ expectedVersion: 5, name: "Test category", code: "TEST_CATEGORY" }) });
  assert(createdCategoryResponse.status === 201, "Option category creation failed");
  const createdCategory = await createdCategoryResponse.json();
  assert(createdCategory.version === 6 && createdCategory.category.code === "TEST_CATEGORY", "Option category creation must increment version once");
  const categoriesBeforeOrder = await fetch(`${base}/option-categories?includeInactive=1`).then((response) => response.json());
  const movableCategoryIds = categoriesBeforeOrder.items.filter((category) => !category.system).map((category) => category.id).reverse();
  const reorderCategoriesResponse = await fetch(`${base}/option-categories/order`, { method: "PUT", headers: sessionHeaders, body: JSON.stringify({ expectedVersion: 6, categoryIds: movableCategoryIds }) });
  assert(reorderCategoriesResponse.ok, "Option category reorder failed");
  const reorderedCategories = await reorderCategoriesResponse.json();
  assert(reorderedCategories.version === 7 && reorderedCategories.items.filter((category) => !category.system).map((category) => category.id).join(",") === movableCategoryIds.join(","), "Server must persist the complete category order atomically");
  const deleteCategoryResponse = await fetch(`${base}/option-categories/${createdCategory.category.id}`, { method: "DELETE", headers: sessionHeaders, body: JSON.stringify({ expectedVersion: 7 }) });
  assert(deleteCategoryResponse.ok && (await deleteCategoryResponse.json()).version === 8, "Unused Option category deletion failed");
  const inUseDeleteResponse = await fetch(`${base}/option-categories/option-category-aromatics`, { method: "DELETE", headers: sessionHeaders, body: JSON.stringify({ expectedVersion: 8 }) });
  assert(inUseDeleteResponse.status === 409 && (await inUseDeleteResponse.json()).error === "option_category_in_use", "Referenced Option category deletion must be blocked with a stable error");

  const legacyDb = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const migrationAuditsBefore = migrationAuditCount(legacyDb);
  delete legacyDb.migrations;
  delete legacyDb.optionCategories;
  legacyDb.options.forEach((option) => { delete option.categoryId; });
  fs.writeFileSync(dbPath, JSON.stringify(legacyDb, null, 2), "utf8");
  const migratedHealth = await fetch(`${base}/health`).then((response) => response.json());
  const migratedOnce = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const expectedCategoryByOptionId = new Map(DEFAULT_OPTION_CATEGORY_BACKFILL_ITEMS.map((item) => [item.optionId, item.categoryId]));
  assert(migratedHealth.version === 9, "Legacy Option category migration must increment the version once");
  assert(migratedOnce.options.every((option) => option.categoryId === (expectedCategoryByOptionId.get(option.id) ?? UNCATEGORIZED_OPTION_CATEGORY_ID)), "Legacy system Options must backfill into their fixed default categories");
  assert(migratedOnce.migrations?.[DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION] === true, "Legacy Option category migration must persist its completion marker");
  assert(migrationAuditCount(migratedOnce) === migrationAuditsBefore + 1, "Legacy Option category migration must append one audit record");
  const secondHealth = await fetch(`${base}/health`).then((response) => response.json());
  const migratedTwice = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  assert(secondHealth.version === 9 && migrationAuditCount(migratedTwice) === migrationAuditsBefore + 1, "Option category migration must be idempotent");

  const manualPath = path.join(tempDir, "manual-category-db.json");
  const manualDb = createEmenuSeasoningSeedDb();
  delete manualDb.migrations;
  manualDb.options.forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  manualDb.options.find((option) => option.id === "o-cilantro").categoryId = "option-category-sauces";
  manualDb.options.find((option) => option.id === "o-garlic").code = "STORE_GARLIC";
  manualDb.options.push({ id: "store-cilantro", code: "CILANTRO", name: "门店香菜", nameEn: "Store cilantro", categoryId: UNCATEGORIZED_OPTION_CATEGORY_ID, status: "active", sortOrder: 999, createdAt: manualDb.updatedAt, updatedAt: manualDb.updatedAt });
  writeDb(manualPath, manualDb);
  const manualMigrated = loadEmenuSeasoningDb(manualPath);
  assert(manualMigrated.options.find((option) => option.id === "o-cilantro").categoryId === "option-category-sauces", "A manually categorized system Option must not be moved");
  assert(manualMigrated.options.find((option) => option.id === "o-garlic").categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID, "A fixed system Option ID with a changed code must not be moved");
  assert(manualMigrated.options.find((option) => option.id === "store-cilantro").categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID, "A store Option with a reserved code but different ID must not be moved");
  const manualVersion = manualMigrated.version;
  const manualAudits = migrationAuditCount(manualMigrated);
  manualMigrated.options.find((option) => option.id === "o-salt").categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID;
  writeDb(manualPath, manualMigrated);
  const manualReloaded = loadEmenuSeasoningDb(manualPath);
  assert(manualReloaded.options.find((option) => option.id === "o-salt").categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID, "A completed migration must respect a later manual move to uncategorized");
  assert(manualReloaded.version === manualVersion && migrationAuditCount(manualReloaded) === manualAudits, "A completed migration must not increment version or audit again");

  const removedDefaultPath = path.join(tempDir, "removed-default-category-db.json");
  const removedDefaultDb = createEmenuSeasoningSeedDb();
  removedDefaultDb.options.filter((option) => option.categoryId === "option-category-sauces").forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  removedDefaultDb.optionCategories = removedDefaultDb.optionCategories.filter((category) => category.id !== "option-category-sauces");
  writeDb(removedDefaultPath, removedDefaultDb);
  const removedDefaultReloaded = loadEmenuSeasoningDb(removedDefaultPath);
  assert(!removedDefaultReloaded.optionCategories.some((category) => category.id === "option-category-sauces") && removedDefaultReloaded.version === removedDefaultDb.version, "A completed migration must not recreate a deleted default category");

  const inactivePath = path.join(tempDir, "inactive-default-category-db.json");
  const inactiveDb = createEmenuSeasoningSeedDb();
  delete inactiveDb.migrations;
  inactiveDb.options.forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  inactiveDb.optionCategories.find((category) => category.id === "option-category-aromatics").status = "inactive";
  writeDb(inactivePath, inactiveDb);
  const inactiveMigrated = loadEmenuSeasoningDb(inactivePath);
  assert(inactiveMigrated.optionCategories.find((category) => category.id === "option-category-aromatics").status === "inactive", "Backfill must not re-enable an inactive default category");
  assert(inactiveMigrated.options.filter((option) => expectedCategoryByOptionId.get(option.id) === "option-category-aromatics").every((option) => option.categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID), "Backfill must not move Options into an inactive category");

  const occupiedCodePath = path.join(tempDir, "occupied-default-code-db.json");
  const occupiedCodeDb = createEmenuSeasoningSeedDb();
  delete occupiedCodeDb.migrations;
  occupiedCodeDb.options.forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  occupiedCodeDb.optionCategories = occupiedCodeDb.optionCategories.filter((category) => category.id !== "option-category-aromatics");
  occupiedCodeDb.optionCategories.push({ id: "store-aromatics", code: "AROMATICS", name: "门店香料", status: "active", sortOrder: 40, system: false, createdAt: occupiedCodeDb.updatedAt, updatedAt: occupiedCodeDb.updatedAt });
  writeDb(occupiedCodePath, occupiedCodeDb);
  const occupiedCodeMigrated = loadEmenuSeasoningDb(occupiedCodePath);
  assert(occupiedCodeMigrated.optionCategories.filter((category) => category.code === "AROMATICS").length === 1 && !occupiedCodeMigrated.optionCategories.some((category) => category.id === "option-category-aromatics"), "Backfill must not create a duplicate default category code");
  assert(occupiedCodeMigrated.options.filter((option) => expectedCategoryByOptionId.get(option.id) === "option-category-aromatics").every((option) => option.categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID), "Backfill must not move system Options into a store category that owns the default code");
  assert(occupiedCodeMigrated.auditLog[0].detail.categoryConflicts.some((conflict) => conflict.code === "AROMATICS" && conflict.occupiedByCategoryId === "store-aromatics"), "Backfill audit must record a default category code conflict");

  const mismatchedCodePath = path.join(tempDir, "mismatched-default-code-db.json");
  const mismatchedCodeDb = createEmenuSeasoningSeedDb();
  delete mismatchedCodeDb.migrations;
  mismatchedCodeDb.options.forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  mismatchedCodeDb.optionCategories.find((category) => category.id === "option-category-aromatics").code = "CUSTOM_AROMATICS";
  writeDb(mismatchedCodePath, mismatchedCodeDb);
  const mismatchedCodeMigrated = loadEmenuSeasoningDb(mismatchedCodePath);
  assert(mismatchedCodeMigrated.optionCategories.find((category) => category.id === "option-category-aromatics").code === "CUSTOM_AROMATICS", "Backfill must not rewrite a mismatched ordinary default category code");
  assert(mismatchedCodeMigrated.options.filter((option) => expectedCategoryByOptionId.get(option.id) === "option-category-aromatics").every((option) => option.categoryId === UNCATEGORIZED_OPTION_CATEGORY_ID), "Backfill must skip Options when the fixed default category ID has a mismatched code");

  const uncategorizedConflictPath = path.join(tempDir, "uncategorized-code-conflict-db.json");
  const uncategorizedConflictDb = createEmenuSeasoningSeedDb();
  delete uncategorizedConflictDb.migrations;
  uncategorizedConflictDb.optionCategories = uncategorizedConflictDb.optionCategories.filter((category) => category.id !== UNCATEGORIZED_OPTION_CATEGORY_ID);
  uncategorizedConflictDb.optionCategories.push({ id: "store-uncategorized", code: "UNCATEGORIZED", name: "门店未分类", status: "active", sortOrder: 999, system: false, createdAt: uncategorizedConflictDb.updatedAt, updatedAt: uncategorizedConflictDb.updatedAt });
  uncategorizedConflictDb.options.forEach((option) => { delete option.categoryId; });
  writeDb(uncategorizedConflictPath, uncategorizedConflictDb);
  const uncategorizedConflictOriginal = fs.readFileSync(uncategorizedConflictPath, "utf8");
  let uncategorizedConflictError;
  try {
    loadEmenuSeasoningDb(uncategorizedConflictPath);
  } catch (error) {
    uncategorizedConflictError = error;
  }
  assert(uncategorizedConflictError?.message === "option_category_migration_conflict" && uncategorizedConflictError?.statusCode === 500, "An uncategorized ID/code conflict must fail migration with a stable server error");
  assert(fs.readFileSync(uncategorizedConflictPath, "utf8") === uncategorizedConflictOriginal, "An uncategorized ID/code conflict must not modify the database");

  const persistenceFailurePath = path.join(tempDir, "migration-persistence-failure-db.json");
  const persistenceFailureDb = createEmenuSeasoningSeedDb();
  delete persistenceFailureDb.migrations;
  persistenceFailureDb.options.forEach((option) => { option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID; });
  writeDb(persistenceFailurePath, persistenceFailureDb);
  const persistenceFailureOriginal = fs.readFileSync(persistenceFailurePath, "utf8");
  let persistenceFailureError;
  try {
    loadEmenuSeasoningDb(persistenceFailurePath, () => { throw new Error("simulated_write_failure"); });
  } catch (error) {
    persistenceFailureError = error;
  }
  assert(persistenceFailureError?.message === "seasoning_db_migration_failed" && persistenceFailureError?.statusCode === 500, "Migration persistence failure must surface as a stable server error");
  assert(fs.readFileSync(persistenceFailurePath, "utf8") === persistenceFailureOriginal, "Migration persistence failure must preserve the original database file");

  fs.writeFileSync(dbPath, uncategorizedConflictOriginal, "utf8");
  const conflictHealthResponse = await fetch(`${base}/health`);
  const conflictHealth = await conflictHealthResponse.json();
  assert(conflictHealthResponse.status === 500 && conflictHealth.error === "option_category_migration_conflict", "A migration conflict must be returned to the caller as a server error");
  assert(fs.readFileSync(dbPath, "utf8") === uncategorizedConflictOriginal, "A request-time migration conflict must not replace the database with seed data");

  console.log("eMenu local seasoning API verification passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
}
