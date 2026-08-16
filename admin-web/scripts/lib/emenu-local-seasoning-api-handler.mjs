import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  createEmenuSeasoningSeedDb,
  DEFAULT_OPTION_CATEGORIES,
  DEFAULT_OPTION_CATEGORY_BACKFILL_ITEMS,
  DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION,
  UNCATEGORIZED_OPTION_CATEGORY_ID,
} from "./emenu-local-seasoning-seed.mjs";
import { createLiveMenuProvider } from "./emenu-local-seasoning-menu-provider.mjs";

const API_PREFIX = "/api/v1/emenu-local/seasoning";
const ACTIONS = ["ADD", "LESS", "MORE", "NONE"];
const SEASONING_SORT_MARKER = 10_000_000;
const SEASONING_ACTION_SORT_SPAN = 1_000_000;
const SEASONING_OPTION_SORT_STEP = 10;
const SEASONING_MAX_OPTIONS_PER_ACTION = 10_000;
const previewTokens = new Map();
const productSelectionTokens = new Map();
const PRODUCT_SELECTION_TTL_MS = 15 * 60_000;
const PREVIEW_TTL_MS = 15 * 60_000;
const MAX_ACTIVE_OPTIONS = 10_000;
const UNCATEGORIZED_OPTION_CATEGORY_CODE = "UNCATEGORIZED";

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

export function loadEmenuSeasoningDb(dbPath, persistDb = saveDbAtomic) {
  if (!fs.existsSync(dbPath)) return createEmenuSeasoningSeedDb();
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    if (!parsed || !Array.isArray(parsed.options) || !Array.isArray(parsed.relations)) throw new Error("invalid_db");
    if (!Array.isArray(parsed.menuGroups) || !parsed.menuGroups.length) parsed.menuGroups = createEmenuSeasoningSeedDb().menuGroups;
  } catch {
    return createEmenuSeasoningSeedDb();
  }
  const normalization = normalizeOptionCategoryDb(parsed);
  if (!normalization.changed) return parsed;
  parsed.version = Number(parsed.version || 0) + 1;
  appendAudit(parsed, "migrate_option_categories", {
    uncategorizedCategoryId: UNCATEGORIZED_OPTION_CATEGORY_ID,
    [DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION]: normalization.backfillEvaluated,
    movedOptionCount: normalization.movedOptionCount,
    categoryConflicts: normalization.categoryConflicts,
  });
  try {
    return persistDb(dbPath, parsed);
  } catch {
    throw apiError("seasoning_db_migration_failed", 500);
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

function optionCategoryKey(category) {
  return `${category.system ? "1" : "0"}::${String(category.sortOrder).padStart(8, "0")}::${normalizeText(category.name)}::${category.id}`;
}

function apiError(code, statusCode = 400, payload = {}) {
  const error = new Error(code);
  error.statusCode = statusCode;
  error.payload = { error: code, ...payload };
  return error;
}

function optionCategoryItems(db, includeInactive = true) {
  const counts = new Map();
  for (const option of db.options) counts.set(option.categoryId, (counts.get(option.categoryId) ?? 0) + 1);
  return db.optionCategories
    .filter((category) => includeInactive || category.status === "active")
    .map((category) => ({ ...category, optionCount: counts.get(category.id) ?? 0 }))
    .sort((left, right) => optionCategoryKey(left).localeCompare(optionCategoryKey(right)));
}

function activeOptionCategory(db, categoryId) {
  return db.optionCategories.find((category) => category.id === categoryId && category.status === "active");
}

function assertConfigurableOption(db, optionId) {
  const option = db.options.find((item) => item.id === optionId);
  let reason = "";
  let categoryId = option?.categoryId ?? "";
  if (!option) reason = "option_not_found";
  else if (option.status !== "active") reason = "option_inactive";
  else {
    const category = db.optionCategories.find((item) => item.id === option.categoryId);
    if (!category) reason = "category_not_found";
    else if (category.status !== "active") reason = "category_inactive";
  }
  if (reason) throw apiError("option_configuration_invalid", 409, { items: [{ optionId, categoryId, reason }] });
  return option;
}

function assertActiveOptionLimit(db, activating = 1) {
  const activeCount = db.options.filter((option) => option.status === "active").length;
  if (activeCount + activating > MAX_ACTIVE_OPTIONS) throw apiError("option_active_limit_exceeded", 409, { limit: MAX_ACTIVE_OPTIONS });
}

function optionPickerSnapshot(db, url) {
  const query = normalizeText(url.searchParams.get("query"));
  const categories = optionCategoryItems(db, false);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const active = db.options.filter((option) => option.status === "active" && categoryById.has(option.categoryId));
  if (active.length > MAX_ACTIVE_OPTIONS) throw apiError("option_picker_limit_exceeded", 409, { limit: MAX_ACTIVE_OPTIONS });
  const matched = active.filter((option) => {
    if (!query) return true;
    const category = categoryById.get(option.categoryId);
    return normalizeText(category?.name).includes(query) || normalizeText(`${option.name} ${option.nameEn ?? ""} ${option.code}`).includes(query);
  });
  const matchedCategoryIds = new Set(matched.map((option) => option.categoryId));
  return {
    version: db.version,
    categories: categories.filter((category) => !query || matchedCategoryIds.has(category.id)).map((category) => ({ ...category, optionCount: matched.filter((option) => option.categoryId === category.id).length })),
    items: matched.map((option) => ({ ...option, categoryName: categoryById.get(option.categoryId)?.name ?? "未分类" })).sort((left, right) => optionCategoryKey(categoryById.get(left.categoryId)).localeCompare(optionCategoryKey(categoryById.get(right.categoryId))) || optionKey(left).localeCompare(optionKey(right))),
  };
}

function normalizedCategoryCode(category) {
  return String(category?.code ?? "").trim().toUpperCase();
}

function categoryMigrationConflict(reason, detail = {}) {
  throw apiError("option_category_migration_conflict", 500, { reason, ...detail });
}

function normalizeOptionCategoryDb(db) {
  let changed = false;
  let movedOptionCount = 0;
  const categoryConflicts = [];
  const hasMigrationState = db.migrations && typeof db.migrations === "object" && !Array.isArray(db.migrations);
  const backfillRequired = !hasMigrationState || db.migrations[DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION] !== true;

  if (!Array.isArray(db.optionCategories)) {
    db.optionCategories = [];
    changed = true;
  }

  let uncategorized = db.optionCategories.find((category) => category.id === UNCATEGORIZED_OPTION_CATEGORY_ID);
  const uncategorizedCodeOwners = db.optionCategories.filter((category) => normalizedCategoryCode(category) === UNCATEGORIZED_OPTION_CATEGORY_CODE);
  const conflictingUncategorizedOwner = uncategorizedCodeOwners.find((category) => category.id !== UNCATEGORIZED_OPTION_CATEGORY_ID);
  if ((!uncategorized && uncategorizedCodeOwners.length) || conflictingUncategorizedOwner) {
    categoryMigrationConflict("uncategorized_code_conflict", { occupiedByCategoryId: conflictingUncategorizedOwner?.id ?? uncategorizedCodeOwners[0]?.id });
  }
  if (!uncategorized) {
    const timestamp = new Date().toISOString();
    uncategorized = { id: UNCATEGORIZED_OPTION_CATEGORY_ID, code: UNCATEGORIZED_OPTION_CATEGORY_CODE, name: "未分类", status: "active", sortOrder: 999999, system: true, createdAt: timestamp, updatedAt: timestamp };
    db.optionCategories.push(uncategorized);
    changed = true;
  }
  if (uncategorized.code !== UNCATEGORIZED_OPTION_CATEGORY_CODE || uncategorized.name !== "未分类" || uncategorized.status !== "active" || uncategorized.system !== true || uncategorized.sortOrder !== 999999) {
    Object.assign(uncategorized, { code: UNCATEGORIZED_OPTION_CATEGORY_CODE, name: "未分类", status: "active", system: true, sortOrder: 999999 });
    changed = true;
  }

  const backfillTargets = new Map();
  if (backfillRequired) {
    const timestamp = new Date().toISOString();
    for (const definition of DEFAULT_OPTION_CATEGORIES) {
      let category = db.optionCategories.find((item) => item.id === definition.id);
      const codeOwners = db.optionCategories.filter((item) => normalizedCategoryCode(item) === definition.code);
      const conflictingCodeOwner = codeOwners.find((item) => item.id !== definition.id);
      if (!category && codeOwners.length) {
        categoryConflicts.push({ categoryId: definition.id, code: definition.code, reason: "code_owned_by_other_id", occupiedByCategoryId: codeOwners[0].id });
        continue;
      }
      if (category && (normalizedCategoryCode(category) !== definition.code || conflictingCodeOwner)) {
        categoryConflicts.push({ categoryId: definition.id, code: definition.code, reason: conflictingCodeOwner ? "duplicate_code_owner" : "fixed_id_code_mismatch", occupiedByCategoryId: conflictingCodeOwner?.id ?? null });
        continue;
      }
      if (!category) {
        category = { ...structuredClone(definition), createdAt: timestamp, updatedAt: timestamp };
        db.optionCategories.push(category);
        changed = true;
      } else if (category.code !== definition.code) {
        category.code = definition.code;
        category.updatedAt = timestamp;
        changed = true;
      }
      backfillTargets.set(category.id, category);
    }
  }

  const validIds = new Set(db.optionCategories.map((category) => category.id));
  for (const option of db.options) {
    if (!option.categoryId || !validIds.has(option.categoryId)) {
      option.categoryId = UNCATEGORIZED_OPTION_CATEGORY_ID;
      changed = true;
    }
  }

  if (backfillRequired) {
    const assignmentByOptionId = new Map(DEFAULT_OPTION_CATEGORY_BACKFILL_ITEMS.map((item) => [item.optionId, item]));
    for (const option of db.options) {
      const assignment = assignmentByOptionId.get(option.id);
      const target = assignment ? backfillTargets.get(assignment.categoryId) : null;
      if (option.categoryId !== UNCATEGORIZED_OPTION_CATEGORY_ID || !assignment || String(option.code ?? "").trim().toUpperCase() !== assignment.code || target?.status !== "active") continue;
      option.categoryId = target.id;
      movedOptionCount += 1;
      changed = true;
    }
    if (!hasMigrationState) db.migrations = {};
    db.migrations[DEFAULT_OPTION_CATEGORY_BACKFILL_MIGRATION] = true;
    changed = true;
  }

  return { changed, backfillEvaluated: backfillRequired, movedOptionCount, categoryConflicts };
}

function encodeRelationSortOrder(actionIndex, optionIndex) {
  if (!Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex >= ACTIONS.length) throw new Error("invalid_action_order");
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= SEASONING_MAX_OPTIONS_PER_ACTION) throw new Error("too_many_options");
  return SEASONING_SORT_MARKER + actionIndex * SEASONING_ACTION_SORT_SPAN + (optionIndex + 1) * SEASONING_OPTION_SORT_STEP;
}

function hasEncodedRelationOrder(relations) {
  if (!relations.length) return false;
  const bucketsByAction = new Map();
  const usedBuckets = new Set();
  const usedOrders = new Set();
  for (const relation of relations) {
    const order = relation.sortOrder;
    if (!Number.isSafeInteger(order) || order < SEASONING_SORT_MARKER + SEASONING_OPTION_SORT_STEP || usedOrders.has(order)) return false;
    const encoded = order - SEASONING_SORT_MARKER;
    const bucket = Math.floor(encoded / SEASONING_ACTION_SORT_SPAN);
    const within = encoded - bucket * SEASONING_ACTION_SORT_SPAN;
    if (bucket < 0 || bucket >= ACTIONS.length || within < SEASONING_OPTION_SORT_STEP || within % SEASONING_OPTION_SORT_STEP !== 0 || within / SEASONING_OPTION_SORT_STEP > SEASONING_MAX_OPTIONS_PER_ACTION) return false;
    const existingBucket = bucketsByAction.get(relation.action);
    if (existingBucket !== undefined && existingBucket !== bucket) return false;
    if (existingBucket === undefined && usedBuckets.has(bucket)) return false;
    bucketsByAction.set(relation.action, bucket);
    usedBuckets.add(bucket);
    usedOrders.add(order);
  }
  return true;
}

function orderedRelationActions(relations) {
  const actions = [...new Set(relations.map((relation) => relation.action))];
  if (!hasEncodedRelationOrder(relations)) return actions.sort((left, right) => ACTIONS.indexOf(left) - ACTIONS.indexOf(right));
  const minimums = new Map();
  for (const relation of relations) minimums.set(relation.action, Math.min(minimums.get(relation.action) ?? Number.POSITIVE_INFINITY, relation.sortOrder));
  return actions.sort((left, right) => minimums.get(left) - minimums.get(right));
}

function sortProductRelations(relations) {
  const actions = new Map(orderedRelationActions(relations).map((action, index) => [action, index]));
  return [...relations].sort((left, right) => (actions.get(left.action) ?? 99) - (actions.get(right.action) ?? 99) || left.sortOrder - right.sortOrder || stableTextCompare(left.optionId, right.optionId));
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

function applyMenuView(db, view) {
  return {
    ...db,
    products: view.products,
    menuGroups: view.menuGroups,
    categories: view.categories?.length ? view.categories : db.categories,
    __menuFingerprint: view.fingerprint,
    __menuFromCache: Boolean(view.fromCache),
    __menuSource: view.source,
  };
}

function isMenuDependentPath(method, sub) {
  if (sub === "/menu-structure") return true;
  if (sub === "/products") return true;
  if (sub.startsWith("/products/")) return true;
  if (sub.startsWith("/product-selections")) return true;
  if (sub.startsWith("/relation-previews")) return true;
  if (sub.startsWith("/relations")) return true;
  if (sub === "/snapshot") return true;
  if (method === "POST" && sub === "/relations/batch") return true;
  return false;
}

function menuSelectionFingerprint(db) {
  if (db.__menuFingerprint) return db.__menuFingerprint;
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

function ensureSelectionSources(draft) {
  if (!(draft.selectionSources instanceof Map)) draft.selectionSources = new Map();
  return draft.selectionSources;
}

function sourceBelongsToGroup(source, groupId) {
  return source === `group:${groupId}`
    || source.startsWith(`category:${groupId}::`)
    || source.startsWith(`dish:${groupId}:`);
}

function isProductSelectedInGroup(draft, groupId, productId) {
  if (!draft?.selectedIds?.has(productId)) return false;
  const sources = draft.selectionSources?.get(productId);
  if (!sources || sources.size === 0) return true;
  for (const source of sources) {
    if (sourceBelongsToGroup(source, groupId) || source.startsWith("search:")) return true;
    // Dish toggles without group context remain visible across every menu path.
    if (source.startsWith("dish:") && source.split(":").length === 2) return true;
  }
  return false;
}

function pruneProductSelection(draft, productId) {
  const sources = draft.selectionSources?.get(productId);
  if (!sources || sources.size === 0) {
    draft.selectionSources?.delete(productId);
    draft.selectedIds.delete(productId);
  }
}

function addProductSelectionSource(draft, productId, sourceKey) {
  const sources = ensureSelectionSources(draft);
  let set = sources.get(productId);
  if (!set) {
    set = new Set();
    sources.set(productId, set);
  }
  set.add(sourceKey);
  draft.selectedIds.add(productId);
}

function expandGroupSelectionToDishes(draft, db, groupId, exceptProductId = "") {
  const groupSource = `group:${groupId}`;
  for (const id of matchingMenuProductIds(db, { groupId })) {
    const sources = draft.selectionSources?.get(id);
    if (!sources?.has(groupSource)) continue;
    sources.delete(groupSource);
    if (id !== exceptProductId) sources.add(`dish:${groupId}:${id}`);
    pruneProductSelection(draft, id);
  }
}

function expandCategorySelectionToDishes(draft, db, groupId, categoryId, exceptProductId = "") {
  const categorySource = `category:${groupId}::${categoryId}`;
  for (const id of matchingMenuProductIds(db, { groupId, categoryId })) {
    const sources = draft.selectionSources?.get(id);
    if (!sources?.has(categorySource)) continue;
    sources.delete(categorySource);
    if (id !== exceptProductId) sources.add(`dish:${groupId}:${id}`);
    pruneProductSelection(draft, id);
  }
}

function clearGroupPathSources(draft, groupId, productIds) {
  for (const id of productIds) {
    const sources = draft.selectionSources?.get(id);
    if (!sources) {
      draft.selectedIds.delete(id);
      continue;
    }
    for (const source of [...sources]) {
      if (sourceBelongsToGroup(source, groupId)) sources.delete(source);
    }
    pruneProductSelection(draft, id);
  }
}

function applyProductSelectionPatch(db, draft, body) {
  const selected = body.selected === true;
  ensureSelectionSources(draft);

  if (body.operation === "dish") {
    const productId = String(body.productId || "");
    const groupId = String(body.groupId || "");
    const product = db.products.find((item) => item.id === productId);
    if (!isSelectableProduct(product)) return;
    const dishSource = groupId ? `dish:${groupId}:${productId}` : `dish:${productId}`;
    if (selected) {
      addProductSelectionSource(draft, productId, dishSource);
      return;
    }
    if (groupId) {
      expandGroupSelectionToDishes(draft, db, groupId, productId);
      for (const group of menuGroups(db)) {
        if (group.id !== groupId) continue;
        for (const category of group.categories) {
          if (!category.productIds.includes(productId)) continue;
          expandCategorySelectionToDishes(draft, db, groupId, category.id, productId);
        }
      }
      const sources = draft.selectionSources.get(productId);
      if (sources) {
        for (const source of [...sources]) {
          if (sourceBelongsToGroup(source, groupId)) sources.delete(source);
        }
        pruneProductSelection(draft, productId);
      } else {
        draft.selectedIds.delete(productId);
      }
      return;
    }
    draft.selectionSources.delete(productId);
    draft.selectedIds.delete(productId);
    return;
  }

  if (body.operation !== "scope") throw new Error("invalid_selection_operation");
  const level = String(body.level || "");
  if (!new Set(["group", "category", "search"]).has(level)) throw new Error("invalid_selection_scope");
  const groupId = level === "group" || level === "category" ? String(body.groupId || "") : "";
  const categoryId = level === "category" ? String(body.categoryId || "") : "";
  const query = String(body.query || "");
  const ids = matchingMenuProductIds(db, { groupId, categoryId, query });
  const sourceKey = level === "group"
    ? `group:${groupId}`
    : level === "category"
      ? `category:${groupId}::${categoryId}`
      : `search:${query}`;

  if (selected) {
    for (const id of ids) {
      const product = db.products.find((item) => item.id === id);
      if (!isSelectableProduct(product)) continue;
      addProductSelectionSource(draft, id, sourceKey);
    }
    return;
  }

  if (level === "group") {
    clearGroupPathSources(draft, groupId, ids);
    return;
  }

  if (level === "category") {
    expandGroupSelectionToDishes(draft, db, groupId);
    for (const id of ids) {
      const product = db.products.find((item) => item.id === id);
      if (!isSelectableProduct(product)) continue;
      const sources = draft.selectionSources.get(id);
      if (!sources) {
        draft.selectedIds.delete(id);
        continue;
      }
      sources.delete(sourceKey);
      sources.delete(`dish:${groupId}:${id}`);
      pruneProductSelection(draft, id);
    }
    return;
  }

  for (const id of ids) {
    const product = db.products.find((item) => item.id === id);
    if (!isSelectableProduct(product)) continue;
    const sources = draft.selectionSources.get(id);
    if (!sources) {
      draft.selectedIds.delete(id);
      continue;
    }
    sources.delete(sourceKey);
    pruneProductSelection(draft, id);
  }
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
        if (!isSelectableProduct(product)) continue;
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
    if (optionPrices.length > SEASONING_MAX_OPTIONS_PER_ACTION) throw new Error("too_many_options");
    const uniqueOptions = new Set();
    const normalizedOptions = optionPrices.map((option) => {
      const optionId = String(option.optionId);
      if (uniqueOptions.has(optionId)) throw new Error("invalid_or_duplicate_relation");
      uniqueOptions.add(optionId);
      const configuredOption = db.options.find((item) => item.id === optionId);
      if (configuredOption?.status === "active") assertConfigurableOption(db, optionId);
      return { optionId, ...normalizePreviewPricing(option) };
    });
    return { action: entry.action, optionPrices: normalizedOptions };
  });
  const draft = resolveProductSelectionDraft(db, body.productSelectionToken, scope, session);
  const products = db.products.filter((product) => draft.selectedIds.has(product.id));
  if (!products.length) throw new Error("products_required");
  const optionById = new Map(db.options.map((option) => [option.id, option]));
  const relationByKey = new Map(db.relations.map((relation) => [relationKey(relation.productId, relation.action, relation.optionId), relation]));
  const items = [];
  for (const product of products) {
    for (const [actionIndex, actionEntry] of actionOptions.entries()) {
      const orderedOptions = actionEntry.optionPrices.map((entry) => ({ ...entry, option: optionById.get(entry.optionId) }));
      for (const [optionIndex, entry] of orderedOptions.entries()) {
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
          sortOrder: encodeRelationSortOrder(actionIndex, optionIndex),
          requestActionIndex: actionIndex,
          requestOptionIndex: optionIndex,
          status: existing?.status ?? "active",
          kind,
          reason,
        });
      }
    }
  }
  return { products, items, actionOptions };
}

function optionList(db, url) {
  const query = normalizeText(url.searchParams.get("query"));
  const status = url.searchParams.get("status");
  const categoryId = url.searchParams.get("categoryId");
  const categoryById = new Map(db.optionCategories.map((category) => [category.id, category]));
  const relationCounts = new Map();
  for (const relation of db.relations) relationCounts.set(relation.optionId, (relationCounts.get(relation.optionId) ?? 0) + 1);
  const orderSnapshots = new Set(db.orderSnapshots.map((snapshot) => snapshot.optionId));
  const items = db.options
    .filter((option) => (!status || option.status === status) && (!categoryId || option.categoryId === categoryId) && (!query || normalizeText(`${option.name} ${option.nameEn ?? ""} ${option.code} ${categoryById.get(option.categoryId)?.name ?? ""}`).includes(query)))
    .map((option) => ({
      ...option,
      categoryName: categoryById.get(option.categoryId)?.name ?? "未分类",
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

function selectionCounts(db, draft, ids, groupId = "") {
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const uniqueIds = new Set(ids);
  let selectableCount = 0;
  let selectedCount = 0;
  for (const id of uniqueIds) {
    const product = productById.get(id);
    if (!isSelectableProduct(product)) continue;
    selectableCount += 1;
    if (groupId ? isProductSelectedInGroup(draft, groupId, id) : draft?.selectedIds.has(id)) selectedCount += 1;
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
    return { id: group.id, name: group.name, categoryCount: group.categories.length, ...selectionCounts(db, draft, ids, group.id) };
  });
  const categories = (activeGroup?.categories ?? [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .map((category) => {
      const ids = matchingMenuProductIds(db, { groupId: activeGroup.id, categoryId: category.id, query });
      return { id: category.id, groupId: activeGroup.id, name: category.name, dishCount: ids.size, ...selectionCounts(db, draft, ids, activeGroup.id) };
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
      selectable: true,
      selected: Boolean(activeGroup && isProductSelectedInGroup(draft, activeGroup.id, product.id)),
    }));
  return {
    groups,
    categories,
    dishes: paginate(dishes, url, (item) => `${String(item.sortOrder).padStart(8, "0")}::${normalizeText(item.name)}::${item.id}`),
    activeGroupId: activeGroup?.id ?? "",
    activeCategoryId: activeCategory?.id ?? "",
    query,
    selectedTotal: draft?.selectedIds.size ?? 0,
    menuSource: db.__menuSource ?? null,
    menuFromCache: Boolean(db.__menuFromCache),
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

function parseRelationProductPage(url) {
  const pageValues = url.searchParams.getAll("page");
  const limitValues = url.searchParams.getAll("limit");
  if (pageValues.length > 1) throw new Error("invalid_page");
  if (limitValues.length > 1) throw new Error("invalid_page_size");
  const pageText = pageValues[0] ?? "1";
  if (!/^[1-9]\d*$/.test(pageText)) throw new Error("invalid_page");
  const page = Number(pageText);
  if (!Number.isSafeInteger(page)) throw new Error("invalid_page");
  const pageSize = limitValues.length ? Number(limitValues[0]) : 10;
  if (!Number.isInteger(pageSize) || ![5, 10, 20, 50].includes(pageSize)) throw new Error("invalid_page_size");
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) throw new Error("invalid_page");
  return { page, pageSize, offset };
}

function relationProductGroups(db, url) {
  const { page, pageSize, offset } = parseRelationProductPage(url);
  const query = normalizeText(url.searchParams.get("query"));
  const actionFilter = url.searchParams.get("action") || "";
  const categoryId = url.searchParams.get("categoryId") || "";
  const statusFilter = url.searchParams.get("status") || "";
  if (actionFilter && !ACTIONS.includes(actionFilter)) throw new Error("invalid_action");
  if (statusFilter && !["active", "mixed", "inactive"].includes(statusFilter)) throw new Error("invalid_status");

  const categoryOrder = new Map(db.categories.map((category) => [category.id, category.sortOrder]));
  const productById = new Map(db.products.map((product) => [product.id, product]));
  const optionById = new Map(db.options.map((option) => [option.id, option]));
  const grouped = new Map();

  for (const relation of db.relations) {
    if (actionFilter && relation.action !== actionFilter) continue;
    const product = productById.get(relation.productId);
    const option = optionById.get(relation.optionId);
    if (!product || !option || (categoryId && product.categoryId !== categoryId)) continue;
    const productMatches = !query || normalizeText(`${product.name} ${product.code}`).includes(query);
    const optionMatches = !query || normalizeText(`${option.name} ${option.nameEn ?? ""} ${option.code}`).includes(query);
    if (!productMatches && !optionMatches) continue;
    const group = grouped.get(product.id) ?? { product, relations: [] };
    group.relations.push({ relation, option });
    grouped.set(product.id, group);
  }

  const items = [...grouped.values()].map((group) => {
    const activeCount = group.relations.filter(({ relation }) => relation.status === "active").length;
    const status = activeCount === group.relations.length ? "active" : activeCount ? "mixed" : "inactive";
    const actionGroups = new Map();
    for (const entry of group.relations) {
      if (!actionGroups.has(entry.relation.action)) actionGroups.set(entry.relation.action, []);
      actionGroups.get(entry.relation.action).push(entry);
    }
    const relationActionOrder = new Map(orderedRelationActions(group.relations.map(({ relation }) => relation)).map((action, index) => [action, index]));
    const actions = [...actionGroups.entries()]
      .sort(([left], [right]) => (relationActionOrder.get(left) ?? 99) - (relationActionOrder.get(right) ?? 99) || stableTextCompare(left, right))
      .map(([action, entries]) => ({
        action,
        items: entries.sort((left, right) => {
          const leftRelationOrder = Number.isFinite(Number(left.relation.sortOrder)) ? Number(left.relation.sortOrder) : Number.POSITIVE_INFINITY;
          const rightRelationOrder = Number.isFinite(Number(right.relation.sortOrder)) ? Number(right.relation.sortOrder) : Number.POSITIVE_INFINITY;
          const leftOptionOrder = Number.isFinite(Number(left.option.sortOrder)) ? Number(left.option.sortOrder) : Number.POSITIVE_INFINITY;
          const rightOptionOrder = Number.isFinite(Number(right.option.sortOrder)) ? Number(right.option.sortOrder) : Number.POSITIVE_INFINITY;
          return leftRelationOrder - rightRelationOrder || leftOptionOrder - rightOptionOrder || stableTextCompare(normalizeText(left.option.name), normalizeText(right.option.name)) || stableTextCompare(left.relation.id, right.relation.id);
        }).map(({ relation, option }) => ({
          relationId: relation.id,
          optionId: option.id,
          optionName: option.name,
          priceDelta: normalizePrice(relation.priceDelta),
          sortOrder: relation.sortOrder,
          status: relation.status,
        })),
      }));
    return { product: group.product, visibleRelationCount: group.relations.length, status, actions };
  }).filter((item) => !statusFilter || item.status === statusFilter)
    .sort((left, right) => productKey(left.product, categoryOrder).localeCompare(productKey(right.product, categoryOrder)));

  const totalProducts = items.length;
  const totalPages = Math.ceil(totalProducts / pageSize);
  const responsePage = totalProducts === 0 ? 1 : page;
  return {
    items: totalProducts === 0 ? [] : items.slice(offset, offset + pageSize),
    page: responsePage,
    pageSize,
    totalPages,
    totalProducts,
  };
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

function preservedPreviewRelation(relation, option, preservedReason) {
  const priceDelta = normalizePrice(relation.priceDelta);
  return {
    source: "preserved",
    includedInFinal: true,
    relationId: relation.id,
    action: relation.action,
    optionId: relation.optionId,
    optionName: option?.name ?? relation.optionId,
    inputPrice: priceDelta,
    markupCoefficient: 1,
    priceDelta,
    status: relation.status === "inactive" ? "inactive" : "active",
    preservedReason,
    createdAt: relation.createdAt,
  };
}

function configuredPreviewRelation(candidate, existing) {
  const complete = completeCandidatePricing(candidate);
  return {
    source: "configured",
    includedInFinal: true,
    candidateId: complete.candidateId,
    ...(existing ? { relationId: existing.id, createdAt: existing.createdAt } : {}),
    action: complete.action,
    optionId: complete.optionId,
    optionName: complete.optionName,
    inputPrice: complete.inputPrice,
    markupCoefficient: complete.markupCoefficient,
    priceDelta: complete.priceDelta,
    status: "active",
    kind: complete.kind,
  };
}

function excludedPreviewCandidate(candidate, existing) {
  const complete = completeCandidatePricing(candidate);
  return {
    source: "configured",
    includedInFinal: false,
    candidateId: complete.candidateId,
    action: complete.action,
    optionId: complete.optionId,
    optionName: complete.optionName,
    inputPrice: complete.inputPrice,
    markupCoefficient: complete.markupCoefficient,
    priceDelta: complete.priceDelta,
    kind: "unavailable",
    reason: complete.reason,
    ...(existing ? { existingRelationId: existing.id } : {}),
  };
}

function buildBatchFinalProducts(db, preview) {
  const optionById = new Map(db.options.map((option) => [option.id, option]));
  const relationByKey = new Map(db.relations.map((relation) => [relationKey(relation.productId, relation.action, relation.optionId), relation]));
  const products = new Map();
  for (const product of preview.products) {
    const currentRelations = sortProductRelations(db.relations.filter((relation) => relation.productId === product.id));
    const candidates = preview.items.filter((candidate) => candidate.productId === product.id);
    const excludedCandidates = candidates.filter((candidate) => candidate.kind === "unavailable").map((candidate) => excludedPreviewCandidate(candidate, relationByKey.get(relationKey(product.id, candidate.action, candidate.optionId))));
    const productUnavailable = product.status !== "active" || !product.emenuSellable;
    if (productUnavailable) {
      const actions = orderedRelationActions(currentRelations).map((action, actionIndex) => ({
        action,
        items: currentRelations.filter((relation) => relation.action === action).map((relation, optionIndex) => ({
          ...preservedPreviewRelation(relation, optionById.get(relation.optionId), "product_unavailable"),
          sortOrder: encodeRelationSortOrder(actionIndex, optionIndex),
        })),
      }));
      products.set(product.id, { productId: product.id, productName: product.name, disposition: "unchanged_unavailable", actions, excludedCandidates, finalRelationCount: currentRelations.length });
      continue;
    }

    const validCandidates = candidates.filter((candidate) => candidate.kind !== "unavailable");
    const configuredActions = preview.actionOptions.map((entry) => entry.action).filter((action) => validCandidates.some((candidate) => candidate.action === action));
    const actionSequence = [...configuredActions, ...orderedRelationActions(currentRelations).filter((action) => !configuredActions.includes(action))];
    const actions = actionSequence.map((action, actionIndex) => {
      const configured = validCandidates.filter((candidate) => candidate.action === action).sort((left, right) => left.requestOptionIndex - right.requestOptionIndex);
      const configuredKeys = new Set(configured.map((candidate) => relationKey(product.id, candidate.action, candidate.optionId)));
      const preserved = currentRelations.filter((relation) => relation.action === action && !configuredKeys.has(relationKey(product.id, relation.action, relation.optionId)));
      const items = [
        ...configured.map((candidate) => configuredPreviewRelation(candidate, relationByKey.get(relationKey(product.id, candidate.action, candidate.optionId)))),
        ...preserved.map((relation) => {
          const unavailable = candidates.some((candidate) => candidate.kind === "unavailable" && candidate.action === relation.action && candidate.optionId === relation.optionId);
          return preservedPreviewRelation(relation, optionById.get(relation.optionId), unavailable ? "configured_but_unavailable" : "not_configured");
        }),
      ].map((item, optionIndex) => ({ ...item, sortOrder: encodeRelationSortOrder(actionIndex, optionIndex) }));
      return { action, items };
    }).filter((group) => group.items.length);
    products.set(product.id, { productId: product.id, productName: product.name, disposition: "merge", actions, excludedCandidates, finalRelationCount: actions.reduce((total, group) => total + group.items.length, 0) });
  }
  return products;
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

function previewProductGroups(preview, productIds) {
  return productIds.map((productId) => preview.finalProducts.get(productId)).filter(Boolean);
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
      items: previewProductGroups(preview, pageProductIds),
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
  const items = previewProductGroups(preview, pageProductIds);
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

export async function handleEmenuSeasoningApi(req, res, dbPath, options = {}) {
  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "http://local");
  if (!url.pathname.startsWith(API_PREFIX)) return false;
  const sub = url.pathname.slice(API_PREFIX.length) || "/";
  const session = requestSession(req);
  cleanPreviewTokens();
  const menuProvider = options.menuProvider ?? createLiveMenuProvider();
  const cacheDir = options.cacheDir ?? path.dirname(dbPath);

  try {
    let db = loadEmenuSeasoningDb(dbPath);
    if (isMenuDependentPath(method, sub)) {
      const view = await menuProvider.resolve({ req, cacheDir });
      db = applyMenuView(db, view);
      if (view.fromCache) res.setHeader("X-Seasoning-Menu-Cache", "1");
    }
    if (method === "GET" && sub === "/health") {
      sendJson(res, 200, { ok: true, service: "emenu-local-seasoning", version: db.version });
      return true;
    }
    if (method === "GET" && sub === "/bootstrap") {
      sendJson(res, 200, { version: db.version, permissions: db.permissions, categories: db.categories.map(({ id, name }) => ({ id, name })) });
      return true;
    }
    if (method === "GET" && sub === "/option-picker") {
      sendJson(res, 200, optionPickerSnapshot(db, url));
      return true;
    }
    if (method === "GET" && sub === "/option-categories") {
      sendJson(res, 200, { version: db.version, items: optionCategoryItems(db, url.searchParams.get("includeInactive") !== "0") });
      return true;
    }
    if (method === "POST" && sub === "/option-categories") {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const name = String(body.name ?? "").trim();
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!name || !/^[A-Z0-9_\-]{2,40}$/.test(code)) throw apiError("invalid_option_category");
      if (db.optionCategories.some((category) => category.code === code)) throw apiError("option_category_code_conflict", 409);
      const timestamp = new Date().toISOString();
      const category = { id: `option-category-${crypto.randomUUID()}`, code, name, status: "active", sortOrder: Math.max(0, ...db.optionCategories.filter((item) => !item.system).map((item) => Number(item.sortOrder) || 0)) + 10, system: false, createdAt: timestamp, updatedAt: timestamp };
      const mutated = mutateDb(dbPath, db, "option_category_created", { categoryId: category.id }, (next) => next.optionCategories.push(category));
      sendJson(res, 201, { version: mutated.db.version, category });
      return true;
    }
    if (method === "PUT" && sub === "/option-categories/order") {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const requested = Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : [];
      const editableIds = db.optionCategories.filter((category) => !category.system).map((category) => category.id);
      if (requested.length !== editableIds.length || new Set(requested).size !== requested.length || requested.some((id) => !editableIds.includes(id))) throw apiError("invalid_option_category_order");
      const mutated = mutateDb(dbPath, db, "option_categories_reordered", { categoryIds: requested }, (next) => {
        const order = new Map(requested.map((id, index) => [id, (index + 1) * 10]));
        next.optionCategories.forEach((category) => { category.sortOrder = category.system ? 999999 : order.get(category.id); category.updatedAt = new Date().toISOString(); });
      });
      sendJson(res, 200, { version: mutated.db.version, items: optionCategoryItems(mutated.db, true) });
      return true;
    }
    const optionCategoryMatch = sub.match(/^\/option-categories\/([^/]+)$/);
    if (method === "PATCH" && optionCategoryMatch) {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const category = db.optionCategories.find((item) => item.id === optionCategoryMatch[1]);
      if (!category) throw apiError("option_category_not_found", 404);
      if (category.system) throw apiError("option_category_system_locked", 409);
      const mutated = mutateDb(dbPath, db, "option_category_updated", { categoryId: category.id }, (next) => {
        const target = next.optionCategories.find((item) => item.id === category.id);
        if (body.name !== undefined) {
          const name = String(body.name).trim();
          if (!name) throw apiError("invalid_option_category");
          target.name = name;
        }
        if (body.status === "active" || body.status === "inactive") target.status = body.status;
        target.updatedAt = new Date().toISOString();
      });
      sendJson(res, 200, { version: mutated.db.version, category: optionCategoryItems(mutated.db, true).find((item) => item.id === category.id) });
      return true;
    }
    if (method === "DELETE" && optionCategoryMatch) {
      requireEditable(db);
      const body = await readBody(req);
      assertExpectedVersion(db, body.expectedVersion);
      const category = db.optionCategories.find((item) => item.id === optionCategoryMatch[1]);
      if (!category) throw apiError("option_category_not_found", 404);
      if (category.system) throw apiError("option_category_system_locked", 409);
      const optionCount = db.options.filter((option) => option.categoryId === category.id).length;
      if (optionCount) throw apiError("option_category_in_use", 409, { optionCount });
      const mutated = mutateDb(dbPath, db, "option_category_deleted", { categoryId: category.id }, (next) => { next.optionCategories = next.optionCategories.filter((item) => item.id !== category.id); });
      sendJson(res, 200, { version: mutated.db.version });
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
      const categoryId = String(body.categoryId || UNCATEGORIZED_OPTION_CATEGORY_ID);
      if (!activeOptionCategory(db, categoryId)) throw apiError("option_category_inactive", 409, { categoryId });
      assertActiveOptionLimit(db);
      const createdAt = new Date().toISOString();
      const option = { id: `o-${crypto.randomUUID()}`, code, name, nameEn: String(body.nameEn ?? "").trim(), categoryId, status: "active", sortOrder: Number(body.sortOrder) || (db.options.length + 1) * 10, createdAt, updatedAt: createdAt };
      const mutated = mutateDb(dbPath, db, "option_created", { optionId: option.id, legacyCategoryFallback: !body.categoryId }, (next) => next.options.push(option));
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
        if (body.categoryId !== undefined && body.categoryId !== target.categoryId) {
          if (!activeOptionCategory(db, String(body.categoryId))) throw apiError("option_category_inactive", 409, { categoryId: body.categoryId });
          target.categoryId = String(body.categoryId);
        }
        if (body.status === "active" && target.status !== "active") assertActiveOptionLimit(db);
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
    if (method === "GET" && sub === "/relations/product-groups") {
      sendJson(res, 200, relationProductGroups(db, url));
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
      productSelectionTokens.set(token, { scope: dbPath, session, selectedIds: new Set(), selectionSources: new Map(), menuVersion, expiresAt });
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
      applyProductSelectionPatch(db, draft, body);
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
      const actionIndexes = new Map();
      const optionIndexes = new Map();
      for (const relation of requested) {
        const key = relationKey(productId, relation.action, relation.optionId);
        if (!ACTIONS.includes(relation.action) || seen.has(key)) throw new Error("invalid_or_duplicate_relation");
        seen.add(key);
        normalizePrice(relation.priceDelta);
        assertConfigurableOption(db, relation.optionId);
        if (!actionIndexes.has(relation.action)) actionIndexes.set(relation.action, actionIndexes.size);
        optionIndexes.set(relation.action, (optionIndexes.get(relation.action) ?? 0) + 1);
        if (optionIndexes.get(relation.action) > SEASONING_MAX_OPTIONS_PER_ACTION) throw new Error("too_many_options");
      }
      const mutated = mutateDb(dbPath, db, "product_relations_updated", { productId, count: requested.length }, (next) => {
        const existing = new Map(next.relations.filter((relation) => relation.productId === productId).map((relation) => [relationKey(productId, relation.action, relation.optionId), relation]));
        next.relations = next.relations.filter((relation) => relation.productId !== productId);
        const timestamp = new Date().toISOString();
        const nextOptionIndexes = new Map();
        requested.forEach((relation) => {
          const previous = existing.get(relationKey(productId, relation.action, relation.optionId));
          const optionIndex = nextOptionIndexes.get(relation.action) ?? 0;
          nextOptionIndexes.set(relation.action, optionIndex + 1);
          next.relations.push({
            id: previous?.id ?? `r-${crypto.randomUUID()}`,
            productId,
            action: relation.action,
            optionId: relation.optionId,
            priceDelta: normalizePrice(relation.priceDelta),
            sortOrder: encodeRelationSortOrder(actionIndexes.get(relation.action), optionIndex),
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
      const finalProducts = buildBatchFinalProducts(db, preview);
      const previewToken = crypto.randomUUID();
      const stored = {
        ...preview,
        ...buildPreviewProductIndex(preview.items),
        scope: dbPath,
        session,
        actionOptions: preview.actionOptions,
        finalProducts,
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
        for (const product of preview.finalProducts.values()) {
          for (const group of product.actions) {
            const finalItem = group.items.find((entry) => entry.source === "configured" && entry.candidateId === item.candidateId);
            if (finalItem) {
              finalItem.inputPrice = priceDelta;
              finalItem.markupCoefficient = 1;
              finalItem.priceDelta = priceDelta;
            }
          }
        }
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
      for (const item of preview.items) if (item.kind !== "unavailable") assertConfigurableOption(db, item.optionId);
      const decisions = new Map(Object.entries(preview.decisions));
      const summary = { created: 0, updated: 0, reactivated: 0, skipped: 0 };
      for (const item of preview.items) {
        const decision = decisions.get(item.candidateId);
        if (item.kind === "unavailable" || decision?.resolution === "remove" || decision?.resolution === "keep") summary.skipped += 1;
        else if (item.kind === "new") summary.created += 1;
        else if (item.kind === "different") summary.updated += 1;
        else if (item.kind === "inactive") summary.reactivated += 1;
        else summary.skipped += 1;
      }
      const mutated = mutateDb(dbPath, db, "relations_batch_saved", { candidateCount: preview.items.length }, (next) => {
        const relationByKey = new Map(next.relations.map((relation) => [relationKey(relation.productId, relation.action, relation.optionId), relation]));
        const timestamp = new Date().toISOString();
        for (const product of preview.finalProducts.values()) {
          if (product.disposition === "unchanged_unavailable") continue;
          const preparedGroups = product.actions.map((group) => ({
            action: group.action,
            items: group.items.map((item) => {
              const existing = relationByKey.get(relationKey(product.productId, item.action, item.optionId));
              if (item.source === "configured") {
                const decision = decisions.get(item.candidateId);
                if (decision?.resolution === "remove" || decision?.resolution === "keep") return existing ? { item, existing, preserve: true } : null;
              }
              return { item, existing, preserve: item.source === "preserved" };
            }).filter(Boolean),
          })).filter((group) => group.items.length);
          next.relations = next.relations.filter((relation) => relation.productId !== product.productId);
          preparedGroups.forEach((group, actionIndex) => {
            group.items.forEach(({ item, existing, preserve }, optionIndex) => {
              const sortOrder = encodeRelationSortOrder(actionIndex, optionIndex);
              const priceDelta = preserve && existing ? normalizePrice(existing.priceDelta) : normalizePrice(item.priceDelta);
              const status = preserve && existing ? existing.status : "active";
              const changed = !existing || existing.sortOrder !== sortOrder || normalizePrice(existing.priceDelta) !== priceDelta || existing.status !== status;
              next.relations.push({
                id: existing?.id ?? `r-${crypto.randomUUID()}`,
                productId: product.productId,
                action: group.action,
                optionId: item.optionId,
                priceDelta,
                sortOrder,
                status,
                createdAt: existing?.createdAt ?? timestamp,
                updatedAt: changed ? timestamp : existing.updatedAt,
              });
            });
          });
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
  const cacheDir = path.join(projectRoot, ".cache");
  middlewares.use((req, res, next) => {
    const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
    if (!pathname.startsWith(API_PREFIX)) {
      next();
      return;
    }
    handleEmenuSeasoningApi(req, res, dbPath, { cacheDir }).then((handled) => {
      if (!handled) next();
    }).catch((error) => {
      const status = error.statusCode || 500;
      sendJson(res, status, error.payload ?? { error: "internal", message: String(error?.message || error) });
    });
  });
}
