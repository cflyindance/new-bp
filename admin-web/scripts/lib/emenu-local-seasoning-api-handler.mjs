import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createEmenuSeasoningSeedDb } from "./emenu-local-seasoning-seed.mjs";

const API_PREFIX = "/api/v1/emenu-local/seasoning";
const ACTIONS = ["ADD", "LESS", "MORE", "NONE"];
const previewTokens = new Map();
const productSelectionTokens = new Map();
const PRODUCT_SELECTION_TTL_MS = 15 * 60_000;
const PREVIEW_TTL_MS = 15 * 60_000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function loadDb(dbPath) {
  if (!fs.existsSync(dbPath)) return createEmenuSeasoningSeedDb();
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    if (!parsed || !Array.isArray(parsed.options) || !Array.isArray(parsed.relations)) throw new Error("invalid_db");
    if (!Array.isArray(parsed.menuGroups) || !parsed.menuGroups.length) parsed.menuGroups = createEmenuSeasoningSeedDb().menuGroups;
    return parsed;
  } catch {
    return createEmenuSeasoningSeedDb();
  }
}

function saveDbAtomic(dbPath, db) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const next = { ...db, updatedAt: new Date().toISOString() };
  const tempPath = `${dbPath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(next, null, 2), "utf8");
    JSON.parse(fs.readFileSync(tempPath, "utf8"));
    fs.renameSync(tempPath, dbPath);
  } finally {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
  }
  return next;
}

function normalizeText(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function normalizePrice(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw new Error("invalid_price_delta");
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function strictDecimalHundredths(value, errorCode) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(errorCode);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new Error(errorCode);
  const scaled = BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  if (scaled > MAX_SAFE_BIGINT) throw new Error(errorCode);
  return Number(scaled);
}

function normalizePreviewPricing(option) {
  const hasInputPrice = Object.prototype.hasOwnProperty.call(option, "inputPrice");
  const hasCoefficient = Object.prototype.hasOwnProperty.call(option, "markupCoefficient");
  const hasPriceDelta = Object.prototype.hasOwnProperty.call(option, "priceDelta");
  const usesNewFormat = hasInputPrice || hasCoefficient;
  if (usesNewFormat && (!hasInputPrice || !hasCoefficient || !hasPriceDelta || option.inputPrice === null || option.markupCoefficient === null || option.priceDelta === null)) throw new Error("invalid_price_fields");
  if (!usesNewFormat && (!hasPriceDelta || option.priceDelta === null)) throw new Error("invalid_price_fields");

  if (!usesNewFormat) {
    const legacyCents = strictDecimalHundredths(option.priceDelta, "invalid_price_delta");
    const legacyPrice = legacyCents / 100;
    return { inputPrice: legacyPrice, markupCoefficient: 1, priceDelta: legacyPrice };
  }

  const inputCents = strictDecimalHundredths(option.inputPrice, "invalid_input_price");
  const coefficientHundredths = strictDecimalHundredths(option.markupCoefficient, "invalid_markup_coefficient");
  if (coefficientHundredths < 50 || coefficientHundredths > 200) throw new Error("invalid_markup_coefficient");
  const suppliedActualCents = strictDecimalHundredths(option.priceDelta, "invalid_price_delta");
  const product = BigInt(inputCents) * BigInt(coefficientHundredths);
  if (product > MAX_SAFE_BIGINT) throw new Error("invalid_price_delta");
  const calculatedActualCents = (product + 50n) / 100n;
  if (calculatedActualCents > MAX_SAFE_BIGINT) throw new Error("invalid_price_delta");
  if (BigInt(suppliedActualCents) !== calculatedActualCents) throw new Error("invalid_price_calculation");
  return { inputPrice: inputCents / 100, markupCoefficient: coefficientHundredths / 100, priceDelta: Number(calculatedActualCents) / 100 };
}

function completeCandidatePricing(item) {
  const pricing = normalizePreviewPricing({
    ...(item.inputPrice !== undefined ? { inputPrice: item.inputPrice } : {}),
    ...(item.markupCoefficient !== undefined ? { markupCoefficient: item.markupCoefficient } : {}),
    priceDelta: item.priceDelta,
  });
  return { ...item, ...pricing };
}

function encodeCursor(key) {
  return Buffer.from(JSON.stringify({ after: key }), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")).after ?? null;
  } catch {
    return null;
  }
}

function paginate(items, url, keyOf) {
  const requested = Number(url.searchParams.get("limit") || 20);
  const limit = Math.max(1, Math.min(100, Number.isFinite(requested) ? Math.floor(requested) : 20));
  const after = decodeCursor(url.searchParams.get("cursor"));
  const found = after ? items.findIndex((item) => keyOf(item) > after) : 0;
  const start = after && found < 0 ? items.length : Math.max(0, found);
  const page = items.slice(start, start + limit);
  const hasMore = start + limit < items.length;
  return {
    items: page,
    nextCursor: hasMore && page.length ? encodeCursor(keyOf(page[page.length - 1])) : null,
    total: items.length,
  };
}

function optionKey(option) {
  return `${String(option.sortOrder).padStart(8, "0")}::${normalizeText(option.name)}::${option.id}`;
}

function productKey(product, categoryOrder) {
  return `${String(categoryOrder.get(product.categoryId) ?? 999999).padStart(8, "0")}::${String(product.sortOrder).padStart(8, "0")}::${normalizeText(product.name)}::${product.id}`;
}

function relationKey(productId, action, optionId) {
  return `${productId}::${action}::${optionId}`;
}

function assertExpectedVersion(db, expectedVersion) {
  if (Number(expectedVersion) !== db.version) {
    const error = new Error("version_conflict");
    error.statusCode = 409;
    error.payload = { error: "version_conflict", currentVersion: db.version };
    throw error;
  }
}

function appendAudit(db, operation, detail) {
  db.auditLog.unshift({
    id: crypto.randomUUID(),
    operation,
    operator: "Local administrator",
    timestamp: new Date().toISOString(),
    version: db.version,
    detail,
  });
  db.auditLog = db.auditLog.slice(0, 500);
}

function mutateDb(dbPath, current, operation, detail, mutate) {
  const next = structuredClone(current);
  const result = mutate(next);
  next.version = current.version + 1;
  appendAudit(next, operation, detail);
  const saved = saveDbAtomic(dbPath, next);
  return { db: saved, result };
}

function filterProducts(db, filter = {}) {
  const query = normalizeText(filter.query);
  return db.products.filter((product) => {
    if (filter.categoryId && product.categoryId !== filter.categoryId) return false;
    if (filter.status && product.status !== filter.status) return false;
    if (filter.sellableOnly && !product.emenuSellable) return false;
    if (!query) return true;
    return normalizeText(`${product.name} ${product.code}`).includes(query);
  });
}

function menuGroups(db) {
  if (Array.isArray(db.menuGroups) && db.menuGroups.length) return db.menuGroups;
  return [{
    id: "group-main",
    name: "常规菜单",
    sortOrder: 10,
    categories: db.categories.map((category) => ({
      ...category,
      productIds: db.products.filter((product) => product.categoryId === category.id).map((product) => product.id),
    })),
  }];
}

function menuSelectionFingerprint(db) {
  const menu = menuGroups(db).map((group) => ({
    id: group.id,
    name: group.name,
    sortOrder: group.sortOrder,
    categories: group.categories.map((category) => ({
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      productIds: category.productIds,
    })),
  }));
  const products = db.products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    status: product.status,
    emenuSellable: product.emenuSellable,
    sortOrder: product.sortOrder,
  }));
  return crypto.createHash("sha256").update(JSON.stringify({ menu, products })).digest("hex");
}

function productSelectionError(code) {
  const error = new Error(code);
  error.statusCode = 409;
  error.payload = { error: code };
  return error;
}

function requestSession(req) {
  return String(req.headers?.["x-seasoning-session"] || "emenu-local-admin");
}

function resolveProductSelectionDraft(db, token, scope, session) {
  const draft = productSelectionTokens.get(String(token));
  if (!draft || draft.expiresAt < Date.now()) {
    productSelectionTokens.delete(String(token));
    throw productSelectionError("product_selection_expired");
  }
  if (draft.scope !== scope || draft.session !== session) throw productSelectionError("product_selection_store_mismatch");
  if (menuSelectionFingerprint(db) !== draft.menuVersion) {
    productSelectionTokens.delete(String(token));
    throw productSelectionError("product_selection_stale");
  }
  return draft;
}

function isSelectableProduct(product) {
  return product?.status === "active" && product.emenuSellable === true;
}

function matchingMenuProductIds(db, { groupId = "", categoryId = "", query = "" } = {}) {
  const normalizedQuery = normalizeText(query);
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const ids = new Set();
  for (const group of menuGroups(db)) {
    if (groupId && group.id !== groupId) continue;
    for (const category of group.categories) {
      if (categoryId && category.id !== categoryId) continue;
      for (const productId of category.productIds) {
        const product = productById.get(productId);
        if (!product) continue;
        if (normalizedQuery && !normalizeText(`${product.name} ${product.code}`).includes(normalizedQuery)) continue;
        ids.add(product.id);
      }
    }
  }
  return ids;
}

function createCandidates(db, body, scope, session) {
  const requestedActionOptions = Array.isArray(body.actionOptions)
    ? body.actionOptions
    : (body.action ? [{ action: body.action, optionPrices: body.optionPrices }] : []);
  if (!requestedActionOptions.length) throw new Error("actions_required");
  const seenActions = new Set();
  const actionOptions = requestedActionOptions.map((entry) => {
    if (!ACTIONS.includes(entry?.action) || seenActions.has(entry.action)) throw new Error("invalid_action");
    seenActions.add(entry.action);
    const optionPrices = Array.isArray(entry.optionPrices) ? entry.optionPrices : [];
    if (!optionPrices.length) throw new Error("options_required");
    const uniqueOptions = new Map();
    for (const option of optionPrices) uniqueOptions.set(String(option.optionId), { optionId: String(option.optionId), ...normalizePreviewPricing(option) });
    return { action: entry.action, optionPrices: [...uniqueOptions.values()] };
  }).sort((left, right) => ACTIONS.indexOf(left.action) - ACTIONS.indexOf(right.action));
  const draft = resolveProductSelectionDraft(db, body.productSelectionToken, scope, session);
  const products = db.products.filter((product) => draft.selectedIds.has(product.id));
  if (!products.length) throw new Error("products_required");
  const optionById = new Map(db.options.map((option) => [option.id, option]));
  const relationByKey = new Map(db.relations.map((relation) => [relationKey(relation.productId, relation.action, relation.optionId), relation]));
  const items = [];
  for (const product of products) {
    for (const actionEntry of actionOptions) {
      let nextOrder = db.relations
        .filter((relation) => relation.productId === product.id && relation.action === actionEntry.action)
        .reduce((max, relation) => Math.max(max, relation.sortOrder), 0) + 10;
      const orderedOptions = actionEntry.optionPrices
        .map((entry) => ({ ...entry, option: optionById.get(entry.optionId) }))
        .sort((left, right) => (left.option?.sortOrder ?? 0) - (right.option?.sortOrder ?? 0) || left.optionId.localeCompare(right.optionId));
      for (const entry of orderedOptions) {
        const existing = relationByKey.get(relationKey(product.id, actionEntry.action, entry.optionId));
        let kind = "new";
        let reason;
        if (product.status !== "active") {
          kind = "unavailable";
          reason = "product_inactive";
        } else if (!product.emenuSellable) {
          kind = "unavailable";
          reason = "product_not_sellable";
        } else if (!entry.option || entry.option.status !== "active") {
          kind = "unavailable";
          reason = "option_inactive";
        } else if (existing?.status === "inactive") {
          kind = "inactive";
        } else if (existing) {
          kind = normalizePrice(existing.priceDelta) === entry.priceDelta ? "same" : "different";
        }
        items.push({
          candidateId: `${relationKey(product.id, actionEntry.action, entry.optionId)}::candidate`,
          productId: product.id,
          productName: product.name,
          optionId: entry.optionId,
          optionName: entry.option?.name ?? entry.optionId,
          action: actionEntry.action,
          inputPrice: entry.inputPrice,
          markupCoefficient: entry.markupCoefficient,
          priceDelta: entry.priceDelta,
          existingPriceDelta: existing?.priceDelta,
          sortOrder: existing?.sortOrder ?? nextOrder,
          status: existing?.status ?? "active",
          kind,
          reason,
        });
        if (!existing) nextOrder += 10;
      }
    }
  }
  return { products, items, actionOptions };
}

function optionList(db, url) {
  const query = normalizeText(url.searchParams.get("query"));
  const status = url.searchParams.get("status");
  const relationCounts = new Map();
  for (const relation of db.relations) relationCounts.set(relation.optionId, (relationCounts.get(relation.optionId) ?? 0) + 1);
  const orderSnapshots = new Set(db.orderSnapshots.map((snapshot) => snapshot.optionId));
  const items = db.options
    .filter((option) => (!status || option.status === status) && (!query || normalizeText(`${option.name} ${option.nameEn ?? ""} ${option.code}`).includes(query)))
    .map((option) => ({
      ...option,
      relationCount: relationCounts.get(option.id) ?? 0,
      deletable: !relationCounts.has(option.id) && !orderSnapshots.has(option.id),
    }))
    .sort((left, right) => optionKey(left).localeCompare(optionKey(right)));
  return paginate(items, url, optionKey);
}

function productList(db, url) {
  const categoryOrder = new Map(db.categories.map((category) => [category.id, category.sortOrder]));
  const action = url.searchParams.get("action");
  const optionIds = new Set((url.searchParams.get("optionIds") || "").split(",").filter(Boolean));
  const filter = {
    query: url.searchParams.get("query") || "",
    categoryId: url.searchParams.get("categoryId") || "",
  };
  const items = filterProducts(db, filter)
    .map((product) => {
      const relations = db.relations.filter((relation) => relation.productId === product.id && (!action || relation.action === action));
      return {
        ...product,
        relationCount: relations.length,
        selectedOptionCount: relations.filter((relation) => optionIds.has(relation.optionId)).length,
      };
    })
    .sort((left, right) => productKey(left, categoryOrder).localeCompare(productKey(right, categoryOrder)));
  return paginate(items, url, (item) => productKey(item, categoryOrder));
}

function selectionCounts(db, draft, ids) {
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const uniqueIds = new Set(ids);
  let selectableCount = 0;
  let selectedCount = 0;
  for (const id of uniqueIds) {
    const product = productById.get(id);
    if (!isSelectableProduct(product)) continue;
    selectableCount += 1;
    if (draft?.selectedIds.has(id)) selectedCount += 1;
  }
  return { selectedCount, selectableCount };
}

function menuStructure(db, url, scope, session) {
  const query = String(url.searchParams.get("query") || "");
  const token = url.searchParams.get("selectionToken");
  const draft = token ? resolveProductSelectionDraft(db, token, scope, session) : null;
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const relationCounts = new Map();
  for (const relation of db.relations) relationCounts.set(relation.productId, (relationCounts.get(relation.productId) ?? 0) + 1);
  const groupsWithMatches = menuGroups(db)
    .map((group) => {
      const categories = group.categories.filter((category) => matchingMenuProductIds(db, { groupId: group.id, categoryId: category.id, query }).size > 0);
      return { ...group, categories };
    })
    .filter((group) => group.categories.length > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  const requestedGroup = String(url.searchParams.get("groupId") || "");
  const activeGroup = groupsWithMatches.find((group) => group.id === requestedGroup) ?? groupsWithMatches[0];
  const requestedCategory = String(url.searchParams.get("categoryId") || "");
  const activeCategory = activeGroup?.categories.find((category) => category.id === requestedCategory) ?? activeGroup?.categories[0];
  const groups = groupsWithMatches.map((group) => {
    const ids = matchingMenuProductIds(db, { groupId: group.id, query });
    return { id: group.id, name: group.name, categoryCount: group.categories.length, ...selectionCounts(db, draft, ids) };
  });
  const categories = (activeGroup?.categories ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map((category) => {
      const ids = matchingMenuProductIds(db, { groupId: activeGroup.id, categoryId: category.id, query });
      return { id: category.id, groupId: activeGroup.id, name: category.name, dishCount: ids.size, ...selectionCounts(db, draft, ids) };
    });
  const dishIds = activeGroup && activeCategory
    ? [...matchingMenuProductIds(db, { groupId: activeGroup.id, categoryId: activeCategory.id, query })]
    : [];
  const dishes = dishIds
    .map((id) => productById.get(id))
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder || normalizeText(left.name).localeCompare(normalizeText(right.name)) || left.id.localeCompare(right.id))
    .map((product) => ({
      ...product,
      groupId: activeGroup.id,
      groupName: activeGroup.name,
      categoryId: activeCategory.id,
      categoryName: activeCategory.name,
      relationCount: relationCounts.get(product.id) ?? 0,
      selectable: isSelectableProduct(product),
      selected: isSelectableProduct(product) && Boolean(draft?.selectedIds.has(product.id)),
      unavailableReason: product.status !== "active" ? "product_inactive" : !product.emenuSellable ? "product_not_sellable" : undefined,
    }));
  return {
    groups,
    categories,
    dishes: paginate(dishes, url, (item) => `${String(item.sortOrder).padStart(8, "0")}::${normalizeText(item.name)}::${item.id}`),
    activeGroupId: activeGroup?.id ?? "",
    activeCategoryId: activeCategory?.id ?? "",
    query,
    selectedTotal: draft?.selectedIds.size ?? 0,
  };
}

function relationSummary(db, url) {
  const query = normalizeText(url.searchParams.get("query"));
  const actionFilter = url.searchParams.get("action");
  const categoryId = url.searchParams.get("categoryId");
  const statusFilter = url.searchParams.get("status");
  const optionById = new Map(db.options.map((option) => [option.id, option]));
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const groups = new Map();
  for (const relation of db.relations) {
    if (actionFilter && relation.action !== actionFilter) continue;
    const option = optionById.get(relation.optionId);
    const product = productById.get(relation.productId);
    if (!option || !product) continue;
    if (categoryId && product.categoryId !== categoryId) continue;
    if (query && !normalizeText(`${option.name} ${option.code} ${product.name} ${product.code}`).includes(query)) continue;
    const key = `${relation.action}::${relation.optionId}`;
    const group = groups.get(key) ?? { action: relation.action, optionId: option.id, optionCode: option.code, optionName: option.name, optionStatus: option.status, relations: [], products: new Set() };
    group.relations.push(relation);
    group.products.add(product.id);
    groups.set(key, group);
  }
  const actionOrder = new Map(ACTIONS.map((action, index) => [action, index]));
  const items = [...groups.values()].map((group) => {
    const active = group.relations.filter((relation) => relation.status === "active");
    const prices = [...new Set(group.relations.map((relation) => normalizePrice(relation.priceDelta)))].sort((a, b) => a - b);
    const status = active.length === group.relations.length ? "active" : active.length ? "mixed" : "inactive";
    return {
      action: group.action,
      optionId: group.optionId,
      optionCode: group.optionCode,
      optionName: group.optionName,
      optionStatus: group.optionStatus,
      activeProductCount: new Set(active.map((relation) => relation.productId)).size,
      totalProductCount: group.products.size,
      activeRelationCount: active.length,
      inactiveRelationCount: group.relations.length - active.length,
      minPrice: prices[0] ?? 0,
      maxPrice: prices[prices.length - 1] ?? 0,
      distinctPriceCount: prices.length,
      status,
    };
  }).filter((item) => !statusFilter || item.status === statusFilter)
    .sort((left, right) => (actionOrder.get(left.action) ?? 99) - (actionOrder.get(right.action) ?? 99) || optionKey(optionById.get(left.optionId)).localeCompare(optionKey(optionById.get(right.optionId))));
  return paginate(items, url, (item) => `${String(actionOrder.get(item.action) ?? 99).padStart(2, "0")}::${optionKey(optionById.get(item.optionId))}`);
}

function relationProducts(db, url) {
  const action = url.searchParams.get("action");
  const optionId = url.searchParams.get("optionId");
  if (!ACTIONS.includes(action) || !optionId) throw new Error("action_and_option_required");
  const categoryOrder = new Map(db.categories.map((category) => [category.id, category.sortOrder]));
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const query = normalizeText(url.searchParams.get("query"));
  const categoryId = url.searchParams.get("categoryId");
  const items = db.relations.filter((relation) => relation.action === action && relation.optionId === optionId)
    .map((relation) => ({ ...relation, product: productById.get(relation.productId) }))
    .filter((item) => item.product && (!categoryId || item.product.categoryId === categoryId) && (!query || normalizeText(`${item.product.name} ${item.product.code}`).includes(query)))
    .sort((left, right) => productKey(left.product, categoryOrder).localeCompare(productKey(right.product, categoryOrder)));
  return paginate(items, url, (item) => productKey(item.product, categoryOrder));
}

function previewError() {
  const error = new Error("preview_expired");
  error.statusCode = 409;
  error.payload = { error: "preview_expired" };
  return error;
}

function resolvePreview(db, token, scope, session) {
  const preview = previewTokens.get(String(token));
  if (!preview || preview.expiresAt < Date.now() || preview.version !== db.version) {
    previewTokens.delete(String(token));
    throw previewError();
  }
  if (preview.scope !== scope || preview.session !== session) throw previewError();
  resolveProductSelectionDraft(db, preview.productSelectionToken, scope, session);
  return preview;
}

function previewSummary(preview) {
  const summary = { new: 0, same: 0, different: 0, inactive: 0, unavailable: 0 };
  for (const item of preview.items) summary[item.kind] += 1;
  return summary;
}

function previewUnresolvedCount() {
  return 0;
}

function stableTextCompare(left, right) {
  const first = String(left ?? "");
  const second = String(right ?? "");
  return first < second ? -1 : first > second ? 1 : 0;
}

function buildPreviewProductIndex(items) {
  const candidatesByProduct = new Map();
  const productIdsByKind = { new: new Set(), same: new Set(), different: new Set(), inactive: new Set(), unavailable: new Set() };
  for (const item of items) {
    if (!candidatesByProduct.has(item.productId)) candidatesByProduct.set(item.productId, []);
    candidatesByProduct.get(item.productId).push(item);
    if (!productIdsByKind[item.kind]) productIdsByKind[item.kind] = new Set();
    productIdsByKind[item.kind].add(item.productId);
  }
  return {
    indexVersion: crypto.randomUUID(),
    candidatesByProduct,
    productIds: [...candidatesByProduct.keys()].sort(stableTextCompare),
    productIdsByKind: Object.fromEntries(Object.entries(productIdsByKind).map(([kind, productIds]) => [kind, [...productIds].sort(stableTextCompare)])),
  };
}

function invalidProductCursor() {
  const error = new Error("invalid_cursor");
  error.statusCode = 400;
  error.payload = { error: "invalid_cursor" };
  throw error;
}

function encodeProductCursor(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeProductCursor(cursor) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") invalidProductCursor();
    return parsed;
  } catch (error) {
    if (error?.message === "invalid_cursor") throw error;
    invalidProductCursor();
  }
}

function actionOrder(action) {
  const index = ACTIONS.indexOf(action);
  return index >= 0 ? index : ACTIONS.length;
}

function previewCandidateCompare(left, right) {
  const leftOrder = Number.isFinite(Number(left.sortOrder)) ? Number(left.sortOrder) : Number.POSITIVE_INFINITY;
  const rightOrder = Number.isFinite(Number(right.sortOrder)) ? Number(right.sortOrder) : Number.POSITIVE_INFINITY;
  return leftOrder - rightOrder || stableTextCompare(left.optionName, right.optionName) || stableTextCompare(left.candidateId, right.candidateId);
}

function previewProductGroups(preview, productIds, kind) {
  return productIds.map((productId) => {
    const candidates = (preview.candidatesByProduct.get(productId) ?? [])
      .filter((item) => !kind || item.kind === kind)
      .map((item) => ({ ...completeCandidatePricing(item), decision: preview.decisions[item.candidateId] }));
    const grouped = new Map();
    for (const item of candidates) {
      if (!grouped.has(item.action)) grouped.set(item.action, []);
      grouped.get(item.action).push(item);
    }
    const actions = [...grouped.entries()]
      .sort(([left], [right]) => actionOrder(left) - actionOrder(right) || stableTextCompare(left, right))
      .map(([action, actionItems]) => ({ action, items: actionItems.sort(previewCandidateCompare) }));
    return { productId, productName: candidates[0]?.productName ?? productId, optionCount: candidates.length, unresolvedCount: 0, actions };
  });
}

function previewProductsPage(preview, url, previewToken) {
  const kind = url.searchParams.get("kind") || "";
  const pageValues = url.searchParams.getAll("page");
  const cursorValues = url.searchParams.getAll("cursor");
  const limitValues = url.searchParams.getAll("limit");
  if (pageValues.length) {
    if (pageValues.length !== 1) throw new Error("invalid_page");
    if (cursorValues.length) throw new Error("invalid_pagination");
    if (limitValues.length > 1) throw new Error("invalid_page_size");
    const pageText = pageValues[0];
    if (!/^[1-9]\d*$/.test(pageText)) throw new Error("invalid_page");
    const page = Number(pageText);
    if (!Number.isSafeInteger(page)) throw new Error("invalid_page");
    const pageSize = limitValues.length ? Number(limitValues[0]) : 5;
    if (!Number.isInteger(pageSize) || ![5, 10, 20, 50].includes(pageSize)) throw new Error("invalid_page_size");
    const offset = (page - 1) * pageSize;
    if (!Number.isSafeInteger(offset)) throw new Error("invalid_page");
    const productIds = kind ? (preview.productIdsByKind[kind] ?? []) : preview.productIds;
    const totalProducts = productIds.length;
    const totalPages = Math.ceil(totalProducts / pageSize);
    const responsePage = totalProducts === 0 ? 1 : page;
    const pageProductIds = totalProducts === 0 ? [] : productIds.slice(offset, offset + pageSize);
    return {
      items: previewProductGroups(preview, pageProductIds, kind),
      page: responsePage,
      pageSize,
      totalPages,
      totalProducts,
      unresolvedCount: previewUnresolvedCount(preview),
      summary: previewSummary(preview),
    };
  }
  const requestedLimit = Number(url.searchParams.get("limit") || 5);
  const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 5));
  const productIds = kind ? (preview.productIdsByKind[kind] ?? []) : preview.productIds;
  const cursorValue = url.searchParams.get("cursor");
  let start = 0;
  if (cursorValue) {
    const cursor = decodeProductCursor(cursorValue);
    if (cursor.previewToken !== previewToken || cursor.indexVersion !== preview.indexVersion || cursor.kind !== kind || cursor.limit !== limit || typeof cursor.afterProductId !== "string") invalidProductCursor();
    const afterIndex = productIds.indexOf(cursor.afterProductId);
    if (afterIndex < 0) invalidProductCursor();
    start = afterIndex + 1;
  }
  const pageProductIds = productIds.slice(start, start + limit);
  const items = previewProductGroups(preview, pageProductIds, kind);
  const hasMore = start + limit < productIds.length;
  const nextCursor = hasMore && pageProductIds.length
    ? encodeProductCursor({ previewToken, indexVersion: preview.indexVersion, kind, limit, afterProductId: pageProductIds[pageProductIds.length - 1] })
    : null;
  return { items, nextCursor, total: productIds.length, unresolvedCount: previewUnresolvedCount(preview), summary: previewSummary(preview) };
}

function previewItemsPage(preview, url) {
  const kind = url.searchParams.get("kind");
  const items = preview.items
    .filter((item) => !kind || item.kind === kind)
    .map((item) => ({ ...completeCandidatePricing(item), decision: preview.decisions[item.candidateId] }))
    .sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  return {
    ...paginate(items, url, (item) => item.candidateId),
    unresolvedCount: previewUnresolvedCount(preview),
    summary: previewSummary(preview),
  };
}

function cleanPreviewTokens() {
  const now = Date.now();
  for (const [token, preview] of previewTokens) if (preview.expiresAt < now) previewTokens.delete(token);
  for (const [token, snapshot] of productSelectionTokens) if (snapshot.expiresAt < now) productSelectionTokens.delete(token);
}

function requireEditable(db) {
  if (!db.permissions?.canEdit) {
    const error = new Error("forbidden");
    error.statusCode = 403;
    throw error;
  }
}

export async function handleEmenuSeasoningApi(req, res, dbPath) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "http://local");
  if (!url.pathname.startsWith(API_PREFIX)) return false;
  const sub = url.pathname.slice(API_PREFIX.length) || "/";
  const session = requestSession(req);
  cleanPreviewTokens();

  try {
    let db = loadDb(dbPath);
    if (method === "GET" && sub === "/health") {
      sendJson(res, 200, { ok: true, service: "emenu-local-seasoning", version: db.version });
      return true;
    }
    if (method === "GET" && sub === "/bootstrap") {
      sendJson(res, 200, { version: db.version, permissions: db.permissions, categories: db.categories.map(({ id, name }) => ({ id, name })) });
      return true;
    }
    if (method === "GET" && sub === "/options") {
      sendJson(res, 200, optionList(db, url));
      return true;
    }
    if (method === "POST" && sub === "/options") {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const name = String(body.name ?? "").trim();
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!name || !/^[A-Z0-9_\-]{2,40}$/.test(code)) throw new Error("invalid_option");
      if (db.options.some((option) => option.code === code)) throw new Error("duplicate_option_code");
      const createdAt = new Date().toISOString();
      const option = { id: `o-${crypto.randomUUID()}`, code, name, nameEn: String(body.nameEn ?? "").trim(), status: "active", sortOrder: Number(body.sortOrder) || (db.options.length + 1) * 10, createdAt, updatedAt: createdAt };
      const mutated = mutateDb(dbPath, db, "option_created", { optionId: option.id }, (next) => next.options.push(option));
      sendJson(res, 201, { option, version: mutated.db.version });
      return true;
    }
    const optionMatch = sub.match(/^\/options\/([^/]+)$/);
    if (method === "PATCH" && optionMatch) {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const option = db.options.find((item) => item.id === optionMatch[1]);
      if (!option) {
        sendJson(res, 404, { error: "option_not_found" });
        return true;
      }
      const mutated = mutateDb(dbPath, db, "option_updated", { optionId: option.id }, (next) => {
        const target = next.options.find((item) => item.id === option.id);
        if (body.name !== undefined) target.name = String(body.name).trim();
        if (body.nameEn !== undefined) target.nameEn = String(body.nameEn).trim();
        if (body.sortOrder !== undefined) target.sortOrder = Number(body.sortOrder) || target.sortOrder;
        if (body.status === "active" || body.status === "inactive") target.status = body.status;
        target.updatedAt = new Date().toISOString();
      });
      sendJson(res, 200, { option: mutated.db.options.find((item) => item.id === option.id), version: mutated.db.version });
      return true;
    }
    if (method === "GET" && sub === "/relations/summary") {
      sendJson(res, 200, relationSummary(db, url));
      return true;
    }
    if (method === "GET" && sub === "/relations/products") {
      sendJson(res, 200, relationProducts(db, url));
      return true;
    }
    if (method === "GET" && sub === "/products") {
      sendJson(res, 200, productList(db, url));
      return true;
    }
    if (method === "GET" && sub === "/menu-structure") {
      sendJson(res, 200, menuStructure(db, url, dbPath, session));
      return true;
    }
    if (method === "POST" && sub === "/product-selections") {
      const token = crypto.randomUUID();
      const expiresAt = Date.now() + PRODUCT_SELECTION_TTL_MS;
      const menuVersion = menuSelectionFingerprint(db);
      productSelectionTokens.set(token, { scope: dbPath, session, selectedIds: new Set(), menuVersion, expiresAt });
      sendJson(res, 201, { token, total: 0, expiresAt: new Date(expiresAt).toISOString(), menuVersion });
      return true;
    }
    const productSelectionMatch = sub.match(/^\/product-selections\/([^/]+)$/);
    if (method === "GET" && productSelectionMatch) {
      const draft = resolveProductSelectionDraft(db, productSelectionMatch[1], dbPath, session);
      sendJson(res, 200, { token: productSelectionMatch[1], total: draft.selectedIds.size, expiresAt: new Date(draft.expiresAt).toISOString(), menuVersion: draft.menuVersion });
      return true;
    }
    if (method === "PATCH" && productSelectionMatch) {
      const draft = resolveProductSelectionDraft(db, productSelectionMatch[1], dbPath, session);
      const body = await readBody(req);
      const selected = body.selected === true;
      let ids;
      if (body.operation === "dish") {
        ids = new Set([String(body.productId || "")]);
      } else if (body.operation === "scope") {
        const level = String(body.level || "");
        if (!new Set(["group", "category", "search"]).has(level)) throw new Error("invalid_selection_scope");
        ids = matchingMenuProductIds(db, {
          groupId: level === "group" || level === "category" ? String(body.groupId || "") : "",
          categoryId: level === "category" ? String(body.categoryId || "") : "",
          query: String(body.query || ""),
        });
      } else {
        throw new Error("invalid_selection_operation");
      }
      for (const id of ids) {
        const product = db.products.find((item) => item.id === id);
        if (!isSelectableProduct(product)) continue;
        if (selected) draft.selectedIds.add(id);
        else draft.selectedIds.delete(id);
      }
      sendJson(res, 200, { token: productSelectionMatch[1], total: draft.selectedIds.size, expiresAt: new Date(draft.expiresAt).toISOString(), menuVersion: draft.menuVersion });
      return true;
    }
    if (method === "DELETE" && productSelectionMatch) {
      resolveProductSelectionDraft(db, productSelectionMatch[1], dbPath, session);
      productSelectionTokens.delete(productSelectionMatch[1]);
      res.statusCode = 204;
      res.end();
      return true;
    }
    const productRelationsMatch = sub.match(/^\/products\/([^/]+)\/relations$/);
    if (method === "GET" && productRelationsMatch) {
      const product = db.products.find((item) => item.id === productRelationsMatch[1]);
      if (!product) {
        sendJson(res, 404, { error: "product_not_found" });
        return true;
      }
      sendJson(res, 200, { product, relations: db.relations.filter((relation) => relation.productId === product.id), version: db.version });
      return true;
    }
    if (method === "PUT" && productRelationsMatch) {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const productId = productRelationsMatch[1];
      const product = db.products.find((item) => item.id === productId);
      if (!product) throw new Error("product_not_found");
      const requested = Array.isArray(body.relations) ? body.relations : [];
      const seen = new Set();
      for (const relation of requested) {
        const key = relationKey(productId, relation.action, relation.optionId);
        if (!ACTIONS.includes(relation.action) || seen.has(key)) throw new Error("invalid_or_duplicate_relation");
        seen.add(key);
        normalizePrice(relation.priceDelta);
      }
      const mutated = mutateDb(dbPath, db, "product_relations_updated", { productId, count: requested.length }, (next) => {
        const existing = new Map(next.relations.filter((relation) => relation.productId === productId).map((relation) => [relationKey(productId, relation.action, relation.optionId), relation]));
        next.relations = next.relations.filter((relation) => relation.productId !== productId);
        const timestamp = new Date().toISOString();
        requested.forEach((relation, index) => {
          const previous = existing.get(relationKey(productId, relation.action, relation.optionId));
          next.relations.push({
            id: previous?.id ?? `r-${crypto.randomUUID()}`,
            productId,
            action: relation.action,
            optionId: relation.optionId,
            priceDelta: normalizePrice(relation.priceDelta),
            sortOrder: Number(relation.sortOrder) || (index + 1) * 10,
            status: relation.status === "inactive" ? "inactive" : "active",
            createdAt: previous?.createdAt ?? timestamp,
            updatedAt: timestamp,
          });
        });
      });
      sendJson(res, 200, { version: mutated.db.version, relations: mutated.db.relations.filter((relation) => relation.productId === productId) });
      return true;
    }
    if (method === "POST" && sub === "/relations/preview") {
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const preview = createCandidates(db, body, dbPath, session);
      const previewToken = crypto.randomUUID();
      const stored = {
        ...preview,
        ...buildPreviewProductIndex(preview.items),
        scope: dbPath,
        session,
        actionOptions: preview.actionOptions,
        productSelectionToken: String(body.productSelectionToken),
        decisions: {},
        version: db.version,
        expiresAt: Date.now() + PREVIEW_TTL_MS,
      };
      previewTokens.set(previewToken, stored);
      const previewUrl = new URL("http://local?limit=20");
      sendJson(res, 200, {
        previewToken,
        version: db.version,
        actualProductCount: preview.products.length,
        total: preview.items.length,
        unresolvedCount: previewUnresolvedCount(stored),
        summary: previewSummary(stored),
        page: previewItemsPage(stored, previewUrl),
      });
      return true;
    }
    const previewItemsMatch = sub.match(/^\/relation-previews\/([^/]+)\/items$/);
    if (method === "GET" && previewItemsMatch) {
      const preview = resolvePreview(db, previewItemsMatch[1], dbPath, session);
      sendJson(res, 200, previewItemsPage(preview, url));
      return true;
    }
    const previewProductsMatch = sub.match(/^\/relation-previews\/([^/]+)\/products$/);
    if (method === "GET" && previewProductsMatch) {
      const preview = resolvePreview(db, previewProductsMatch[1], dbPath, session);
      sendJson(res, 200, previewProductsPage(preview, url, previewProductsMatch[1]));
      return true;
    }
    if (method === "PATCH" && previewItemsMatch) {
      const preview = resolvePreview(db, previewItemsMatch[1], dbPath, session);
      const body = await readBody(req);
      const item = preview.items.find((candidate) => candidate.candidateId === String(body.candidateId));
      if (!item) throw new Error("candidate_not_found");
      const allowed = new Set(["keep", "use", "reactivate", "remove"]);
      const resolution = body.resolution ? String(body.resolution) : undefined;
      if (resolution && !allowed.has(resolution)) throw new Error("invalid_decision");
      if (resolution) preview.decisions[item.candidateId] = { candidateId: item.candidateId, resolution };
      if (body.priceDelta !== undefined) {
        const priceDelta = strictDecimalHundredths(body.priceDelta, "invalid_price_delta") / 100;
        preview.decisions[item.candidateId] = { ...(preview.decisions[item.candidateId] ?? { candidateId: item.candidateId }), priceDelta };
        item.inputPrice = priceDelta;
        item.markupCoefficient = 1;
        item.priceDelta = priceDelta;
      }
      sendJson(res, 200, { candidate: { ...completeCandidatePricing(item), decision: preview.decisions[item.candidateId] }, unresolvedCount: previewUnresolvedCount(preview), summary: previewSummary(preview) });
      return true;
    }
    const previewMatch = sub.match(/^\/relation-previews\/([^/]+)$/);
    if (method === "DELETE" && previewMatch) {
      resolvePreview(db, previewMatch[1], dbPath, session);
      previewTokens.delete(previewMatch[1]);
      res.statusCode = 204;
      res.end();
      return true;
    }
    if (method === "POST" && sub === "/relations/batch") {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const preview = resolvePreview(db, body.previewToken, dbPath, session);
      const decisions = new Map(Object.entries(preview.decisions));
      const summary = { created: 0, updated: 0, reactivated: 0, skipped: 0 };
      const mutated = mutateDb(dbPath, db, "relations_batch_saved", { candidateCount: preview.items.length }, (next) => {
        const relationByKey = new Map(next.relations.map((relation) => [relationKey(relation.productId, relation.action, relation.optionId), relation]));
        const timestamp = new Date().toISOString();
        for (const item of preview.items) {
          const candidate = completeCandidatePricing(item);
          const decision = decisions.get(item.candidateId);
          if (decision?.resolution === "remove" || candidate.kind === "unavailable") {
            summary.skipped += 1;
            continue;
          }
          const key = relationKey(candidate.productId, candidate.action, candidate.optionId);
          const existing = relationByKey.get(key);
          if (!existing) {
            const relation = { id: `r-${crypto.randomUUID()}`, productId: candidate.productId, action: candidate.action, optionId: candidate.optionId, priceDelta: candidate.priceDelta, sortOrder: candidate.sortOrder, status: "active", createdAt: timestamp, updatedAt: timestamp };
            next.relations.push(relation);
            relationByKey.set(key, relation);
            summary.created += 1;
          } else if (candidate.kind === "same" || decision?.resolution === "keep") {
            summary.skipped += 1;
          } else if (candidate.kind === "different") {
            existing.priceDelta = candidate.priceDelta;
            existing.updatedAt = timestamp;
            summary.updated += 1;
          } else if (candidate.kind === "inactive") {
            existing.status = "active";
            existing.priceDelta = candidate.priceDelta;
            existing.updatedAt = timestamp;
            summary.reactivated += 1;
          } else {
            summary.skipped += 1;
          }
        }
      });
      previewTokens.delete(String(body.previewToken));
      productSelectionTokens.delete(preview.productSelectionToken);
      sendJson(res, 200, { version: mutated.db.version, ...summary });
      return true;
    }
    if (method === "GET" && sub === "/audit-log") {
      const requested = Number(url.searchParams.get("limit") || 50);
      const limit = Math.max(1, Math.min(100, Number.isFinite(requested) ? requested : 50));
      sendJson(res, 200, { items: db.auditLog.slice(0, limit), total: db.auditLog.length });
      return true;
    }
    if (method === "GET" && sub === "/snapshot") {
      const activeOptions = db.options.filter((option) => option.status === "active");
      const optionIds = new Set(activeOptions.map((option) => option.id));
      const activeProducts = db.products.filter((product) => product.status === "active" && product.emenuSellable);
      const productIds = new Set(activeProducts.map((product) => product.id));
      const relations = db.relations.filter((relation) => relation.status === "active" && optionIds.has(relation.optionId) && productIds.has(relation.productId));
      const checksum = crypto.createHash("sha256").update(JSON.stringify({ version: db.version, options: activeOptions, products: activeProducts, relations })).digest("hex");
      sendJson(res, 200, { version: db.version, generatedAt: db.updatedAt, checksum, options: activeOptions, products: activeProducts, relations });
      return true;
    }
    sendJson(res, 404, { error: "not_found", path: sub });
    return true;
  } catch (error) {
    const status = error.statusCode || (String(error.message).includes("not_found") ? 404 : 400);
    sendJson(res, status, error.payload ?? { error: String(error.message || "request_failed") });
    return true;
  }
}

export function attachEmenuSeasoningApi(middlewares, projectRoot) {
  const dbPath = path.join(projectRoot, ".cache", "emenu-local-seasoning-db.json");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!pathname.startsWith(API_PREFIX)) {
      next();
      return;
    }
    handleEmenuSeasoningApi(req, res, dbPath).then((handled) => {
      if (!handled) next();
    }).catch((error) => {
      sendJson(res, 500, { error: "internal", message: String(error?.message || error) });
    });
  });
}
