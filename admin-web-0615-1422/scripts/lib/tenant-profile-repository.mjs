/**
 * 租户画像持久化层（P5）— JSON 文件 / SQLite
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { defaultTenantProfileDb, mergeProfileLayers } from "./tenant-profile-defaults.mjs";
import { migrateLegacyProfileKeys, profileKey, tenantLayerKey } from "./tenant-scope.mjs";

function nowIso() {
  return new Date().toISOString();
}

/** 与 feature-presets-line-templates.ts PRODUCT_LINE_KEY_IDS 对齐 */
const PRODUCT_LINE_KEY_IDS = [
  "emenu-only",
  "sdi-only",
  "kiosk-only",
  "pos-suite",
  "pos-go-only",
  "online-order",
  "kds",
  "paypad",
];

function loadPresetsSeed(cacheDir) {
  const presetsPath = path.join(cacheDir, "feature-presets-seed.json");
  if (fs.existsSync(presetsPath)) {
    return JSON.parse(fs.readFileSync(presetsPath, "utf8"));
  }
  return { businessTypes: [], variants: [], variantOverrides: {} };
}

function cloneSeedVariantForCustomBusinessType(seed, bt, lineKey) {
  const source = (seed.variants ?? []).find((v) => v.id === `general:${lineKey}`);
  if (!source) return null;
  const titleSuffix = String(source.title).includes(" · ")
    ? String(source.title).split(" · ").pop()
    : lineKey;
  const titleEnSuffix = String(source.titleEn ?? source.title).includes(" · ")
    ? String(source.titleEn ?? source.title)
        .split(" · ")
        .pop()
    : titleSuffix;
  return {
    ...JSON.parse(JSON.stringify(source)),
    id: `${bt.id}:${lineKey}`,
    businessType: bt.id,
    productLinePresetId: lineKey,
    title: `${bt.title} · ${titleSuffix}`,
    titleEn: `${bt.titleEn || bt.title} · ${titleEnSuffix}`,
    version: 1,
  };
}

/** 为历史自定义业态补全缺失产线变体（含 sdi-only / pos-go-only） */
function backfillCustomBusinessTypeVariants(db, seed) {
  db.customBusinessTypes = db.customBusinessTypes ?? [];
  db.customVariants = db.customVariants ?? [];
  const variantIds = new Set(db.customVariants.map((v) => v.id));
  let changed = false;
  for (const bt of db.customBusinessTypes) {
    for (const lineKey of PRODUCT_LINE_KEY_IDS) {
      const variantId = `${bt.id}:${lineKey}`;
      if (variantIds.has(variantId)) continue;
      const created = cloneSeedVariantForCustomBusinessType(seed, bt, lineKey);
      if (!created) continue;
      db.customVariants.push(created);
      variantIds.add(variantId);
      changed = true;
    }
  }
  return changed;
}

function mergeVariantRows(seedVariants, variantOverrides) {
  const byId = new Map((seedVariants ?? []).map((v) => [v.id, { ...v }]));
  for (const [id, patch] of Object.entries(variantOverrides ?? {})) {
    const base = byId.get(id);
    if (!base) continue;
    if (Array.isArray(patch.features)) base.features = patch.features;
    if (Array.isArray(patch.excludes)) base.excludes = patch.excludes;
    if (Array.isArray(patch.includes)) base.includes = patch.includes;
    if (Array.isArray(patch.l2Includes)) base.l2Includes = patch.l2Includes;
    if (Array.isArray(patch.l3Includes)) base.l3Includes = patch.l3Includes;
    if (Array.isArray(patch.l2Excludes)) base.l2Excludes = patch.l2Excludes;
    if (Array.isArray(patch.l3Excludes)) base.l3Excludes = patch.l3Excludes;
    if (patch.settingConfigs && typeof patch.settingConfigs === "object") {
      base.settingConfigs = patch.settingConfigs;
    }
    if (patch.version) base.version = patch.version;
  }
  return [...byId.values()];
}

function buildMergedPresetsPayload(db, cacheDir, { persistBackfill = false, saveDb } = {}) {
  const seed = loadPresetsSeed(cacheDir);
  if (persistBackfill && backfillCustomBusinessTypeVariants(db, seed)) {
    saveDb?.(db);
  }
  const variantOverrides = db.variantOverrides ?? {};
  const customBusinessTypes = db.customBusinessTypes ?? [];
  const customVariants = db.customVariants ?? [];
  return {
    businessTypes: [...(seed.businessTypes ?? []), ...customBusinessTypes],
    variants: mergeVariantRows([...(seed.variants ?? []), ...customVariants], variantOverrides),
    variantOverrides,
    updatedAt: db.updatedAt,
  };
}

function updateCustomBusinessTypeInDb(db, id, { title, titleEn }) {
  const list = db.customBusinessTypes ?? [];
  const idx = list.findIndex((b) => b.id === id);
  if (idx < 0) return false;
  const bt = list[idx];
  bt.title = title;
  bt.titleEn = titleEn;
  bt.version = (bt.version ?? 1) + 1;
  for (const v of db.customVariants ?? []) {
    if (v.businessType !== id) continue;
    const suffix = String(v.title).includes(" · ")
      ? String(v.title).split(" · ").slice(1).join(" · ")
      : v.productLinePresetId;
    const suffixEn = String(v.titleEn ?? v.title).includes(" · ")
      ? String(v.titleEn ?? v.title)
          .split(" · ")
          .slice(1)
          .join(" · ")
      : suffix;
    v.title = `${title} · ${suffix}`;
    v.titleEn = `${titleEn} · ${suffixEn}`;
  }
  return true;
}

function deleteCustomBusinessTypeFromDb(db, id) {
  db.customBusinessTypes = (db.customBusinessTypes ?? []).filter((b) => b.id !== id);
  db.customVariants = (db.customVariants ?? []).filter((v) => v.businessType !== id);
  if (db.variantOverrides) {
    for (const key of Object.keys(db.variantOverrides)) {
      if (key.startsWith(`${id}:`)) delete db.variantOverrides[key];
    }
  }
}

function isCustomBusinessTypeInDb(db, id) {
  return (db.customBusinessTypes ?? []).some((b) => b.id === id);
}

const AUDIT_LOG_MAX = 500;

function normalizeAuditEntry(entry) {
  const detail = entry.detail && typeof entry.detail === "object" ? entry.detail : {};
  return {
    id: entry.id ?? `audit-${entry.createdAt ?? nowIso()}`,
    createdAt: entry.createdAt ?? nowIso(),
    actor: entry.actor ?? "system",
    action: entry.action,
    path: entry.path,
    variantId: entry.variantId ?? detail.variantId,
    businessTypeId: entry.businessTypeId ?? detail.businessTypeId ?? detail.id,
    version: entry.version ?? detail.version,
    title: entry.title ?? detail.title,
    cloneFrom: entry.cloneFrom ?? detail.cloneFrom,
    changes: entry.changes ?? detail.changes,
  };
}

function appendAuditToDb(db, entry) {
  db.auditLog = db.auditLog ?? [];
  db.auditLog.unshift(normalizeAuditEntry(entry));
  if (db.auditLog.length > AUDIT_LOG_MAX) {
    db.auditLog = db.auditLog.slice(0, AUDIT_LOG_MAX);
  }
}

function listAuditLogFromDb(db, { variantId, businessTypeId, limit = 50 } = {}) {
  let rows = (db.auditLog ?? []).map(normalizeAuditEntry);
  if (variantId) rows = rows.filter((r) => r.variantId === variantId);
  if (businessTypeId) {
    rows = rows.filter(
      (r) =>
        r.businessTypeId === businessTypeId ||
        (r.variantId && r.variantId.startsWith(`${businessTypeId}:`)),
    );
  }
  return rows.slice(0, limit);
}

function cloneBusinessTypeCatalog(seed, db, { id, title, titleEn, cloneFrom }) {
  const allBt = [...(seed.businessTypes ?? []), ...(db.customBusinessTypes ?? [])];
  const sourceBt = allBt.find((b) => b.id === cloneFrom) ?? allBt.find((b) => b.id === "general");
  if (!sourceBt) return null;
  const newBt = {
    id,
    title,
    titleEn: titleEn || title,
    version: 1,
    features: JSON.parse(JSON.stringify(sourceBt.features ?? [])),
  };
  const allVariants = [...(seed.variants ?? []), ...(db.customVariants ?? [])];
  const newVariants = [];
  for (const lineKey of PRODUCT_LINE_KEY_IDS) {
    const sourceId = `${cloneFrom}:${lineKey}`;
    const source =
      allVariants.find((v) => v.id === sourceId) ??
      (seed.variants ?? []).find((v) => v.id === `general:${lineKey}`);
    if (!source) continue;
    const titleSuffix = String(source.title).includes(" · ")
      ? String(source.title).split(" · ").pop()
      : lineKey;
    const titleEnSuffix = String(source.titleEn ?? source.title).includes(" · ")
      ? String(source.titleEn ?? source.title)
          .split(" · ")
          .pop()
      : titleSuffix;
    newVariants.push({
      ...JSON.parse(JSON.stringify(source)),
      id: `${id}:${lineKey}`,
      businessType: id,
      productLinePresetId: lineKey,
      title: `${title} · ${titleSuffix}`,
      titleEn: `${titleEn || title} · ${titleEnSuffix}`,
      version: 1,
    });
  }
  return { businessType: newBt, variants: newVariants };
}

/** @param {string} dbPath */
export function createJsonTenantProfileRepository(dbPath) {
  const cacheDir = path.dirname(dbPath);

  function loadDb() {
    if (!fs.existsSync(dbPath)) {
      const db = defaultTenantProfileDb();
      saveDb(db);
      return db;
    }
    try {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      if (!db.profiles) return defaultTenantProfileDb();
      if (!db.presetOverrides) db.presetOverrides = {};
      if (!db.variantOverrides) db.variantOverrides = {};
      if (!db.customBusinessTypes) db.customBusinessTypes = [];
      if (!db.customVariants) db.customVariants = [];
      if (!db.auditLog) db.auditLog = [];
      db.profiles = migrateLegacyProfileKeys(db.profiles);
      const seed = loadPresetsSeed(cacheDir);
      if (backfillCustomBusinessTypeVariants(db, seed)) {
        saveDb(db);
      }
      return db;
    } catch {
      return defaultTenantProfileDb();
    }
  }

  function saveDb(db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db.updatedAt = nowIso();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  }

  return {
    driver: "json",
    cacheDir,
    loadDb,
    saveDb,
    buildPresetsPayload(db) {
      return buildMergedPresetsPayload(db, cacheDir, { persistBackfill: true, saveDb });
    },
    cloneBusinessTypeCatalog(db, input) {
      return cloneBusinessTypeCatalog(loadPresetsSeed(cacheDir), db, input);
    },
    updateCustomBusinessType(db, id, input) {
      return updateCustomBusinessTypeInDb(db, id, input);
    },
    deleteCustomBusinessType(db, id) {
      deleteCustomBusinessTypeFromDb(db, id);
    },
    isCustomBusinessType(db, id) {
      return isCustomBusinessTypeInDb(db, id);
    },
    resolveProfile(db, { tenantId = "demo-tenant", brandId = "", storeId = "" } = {}) {
      const defaults = defaultTenantProfileDb().profiles;
      const tenant = db.profiles[tenantLayerKey(tenantId)] ?? defaults[tenantLayerKey(tenantId)];
      let merged = { ...tenant };
      if (brandId) {
        const brand = db.profiles[profileKey(tenantId, "brand", brandId)];
        if (brand) merged = mergeProfileLayers(merged, brand);
      }
      if (storeId) {
        const store = db.profiles[profileKey(tenantId, "store", "", storeId)];
        if (store) merged = mergeProfileLayers(merged, store);
      }
      merged.tenantId = tenantId;
      merged.brandId = brandId || merged.brandId;
      merged.storeId = storeId || merged.storeId;
      return merged;
    },
    appendAudit(entry) {
      const db = loadDb();
      appendAuditToDb(db, entry);
      saveDb(db);
    },
    listAuditLog(dbState, query) {
      return listAuditLogFromDb(dbState, query);
    },
  };
}

/** @param {string} sqlitePath */
export function createSqliteTenantProfileRepository(sqlitePath) {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  const cacheDir = path.dirname(sqlitePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS profiles (
      profile_key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS preset_overrides (
      preset_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      action TEXT NOT NULL,
      path TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const countRow = db.prepare("SELECT COUNT(*) AS c FROM profiles").get();
  const jsonFallback = path.join(cacheDir, "tenant-profile-mock-db.json");

  if (!countRow?.c) {
    if (fs.existsSync(jsonFallback)) {
      try {
        const legacy = JSON.parse(fs.readFileSync(jsonFallback, "utf8"));
        const insert = db.prepare(
          "INSERT OR REPLACE INTO profiles (profile_key, payload, updated_at) VALUES (?, ?, ?)",
        );
        const ts = nowIso();
        for (const [key, profile] of Object.entries(legacy.profiles ?? {})) {
          insert.run(key, JSON.stringify(profile), ts);
        }
        for (const [presetId, patch] of Object.entries(legacy.presetOverrides ?? {})) {
          db.prepare(
            "INSERT OR REPLACE INTO preset_overrides (preset_id, payload, updated_at) VALUES (?, ?, ?)",
          ).run(presetId, JSON.stringify(patch), ts);
        }
        db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("updatedAt", ts);
      } catch {
        /* ignore bad legacy */
      }
    } else {
      const seed = defaultTenantProfileDb();
      const insert = db.prepare(
        "INSERT INTO profiles (profile_key, payload, updated_at) VALUES (?, ?, ?)",
      );
      const ts = nowIso();
      for (const [key, profile] of Object.entries(seed.profiles)) {
        insert.run(key, JSON.stringify(profile), ts);
      }
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("version", "1");
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run("updatedAt", ts);
    }
  }

  const upsertMissingDefaults = db.prepare(
    "INSERT OR IGNORE INTO profiles (profile_key, payload, updated_at) VALUES (?, ?, ?)",
  );
  const tsDefaults = nowIso();
  for (const [key, profile] of Object.entries(defaultTenantProfileDb().profiles)) {
    upsertMissingDefaults.run(key, JSON.stringify(profile), tsDefaults);
  }

  function loadDb() {
    let profiles = {};
    for (const row of db.prepare("SELECT profile_key, payload FROM profiles").all()) {
      profiles[row.profile_key] = JSON.parse(row.payload);
    }
    profiles = migrateLegacyProfileKeys(profiles);
    const presetOverrides = {};
    for (const row of db.prepare("SELECT preset_id, payload FROM preset_overrides").all()) {
      presetOverrides[row.preset_id] = JSON.parse(row.payload);
    }
    const readMetaJson = (key, fallback) => {
      const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key);
      if (!row?.value) return fallback;
      try {
        return JSON.parse(row.value);
      } catch {
        return fallback;
      }
    };
    const updatedAt =
      db.prepare("SELECT value FROM meta WHERE key = 'updatedAt'").get()?.value ?? nowIso();
    const state = {
      version: 1,
      updatedAt,
      presetOverrides,
      profiles,
      variantOverrides: readMetaJson("variantOverrides", {}),
      customBusinessTypes: readMetaJson("customBusinessTypes", []),
      customVariants: readMetaJson("customVariants", []),
    };
    const seed = loadPresetsSeed(cacheDir);
    if (backfillCustomBusinessTypeVariants(state, seed)) {
      saveDb(state);
    }
    return state;
  }

  function saveDb(state) {
    const ts = nowIso();
    const upsertProfile = db.prepare(
      "INSERT OR REPLACE INTO profiles (profile_key, payload, updated_at) VALUES (?, ?, ?)",
    );
    for (const [key, profile] of Object.entries(state.profiles ?? {})) {
      upsertProfile.run(key, JSON.stringify(profile), ts);
    }
    const upsertOverride = db.prepare(
      "INSERT OR REPLACE INTO preset_overrides (preset_id, payload, updated_at) VALUES (?, ?, ?)",
    );
    for (const [presetId, patch] of Object.entries(state.presetOverrides ?? {})) {
      upsertOverride.run(presetId, JSON.stringify(patch), ts);
    }
    const upsertMeta = db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)");
    upsertMeta.run("updatedAt", ts);
    upsertMeta.run("variantOverrides", JSON.stringify(state.variantOverrides ?? {}));
    upsertMeta.run("customBusinessTypes", JSON.stringify(state.customBusinessTypes ?? []));
    upsertMeta.run("customVariants", JSON.stringify(state.customVariants ?? []));
    state.updatedAt = ts;
  }

  return {
    driver: "sqlite",
    cacheDir,
    sqlitePath,
    loadDb,
    saveDb,
    buildPresetsPayload(dbState) {
      return buildMergedPresetsPayload(dbState, cacheDir, { persistBackfill: true, saveDb });
    },
    cloneBusinessTypeCatalog(dbState, input) {
      return cloneBusinessTypeCatalog(loadPresetsSeed(cacheDir), dbState, input);
    },
    updateCustomBusinessType(db, id, input) {
      return updateCustomBusinessTypeInDb(db, id, input);
    },
    deleteCustomBusinessType(db, id) {
      deleteCustomBusinessTypeFromDb(db, id);
    },
    isCustomBusinessType(db, id) {
      return isCustomBusinessTypeInDb(db, id);
    },
    resolveProfile(dbState, { tenantId = "demo-tenant", brandId = "", storeId = "" } = {}) {
      const defaults = defaultTenantProfileDb().profiles;
      const tenant = dbState.profiles[tenantLayerKey(tenantId)] ?? defaults[tenantLayerKey(tenantId)];
      let merged = { ...tenant };
      if (brandId) {
        const brand = dbState.profiles[profileKey(tenantId, "brand", brandId)];
        if (brand) merged = mergeProfileLayers(merged, brand);
      }
      if (storeId) {
        const store = dbState.profiles[profileKey(tenantId, "store", "", storeId)];
        if (store) merged = mergeProfileLayers(merged, store);
      }
      merged.tenantId = tenantId;
      merged.brandId = brandId || merged.brandId;
      merged.storeId = storeId || merged.storeId;
      return merged;
    },
    appendAudit({ actor, action, path: reqPath, detail }) {
      const payload = detail && typeof detail === "object" ? detail : {};
      db.prepare(
        "INSERT INTO audit_log (actor, action, path, detail, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(actor ?? null, action, reqPath ?? null, JSON.stringify(payload), nowIso());
    },
    listAuditLog(_dbState, { variantId, businessTypeId, limit = 50 } = {}) {
      const rows = db
        .prepare(
          "SELECT id, actor, action, path, detail, created_at FROM audit_log ORDER BY id DESC LIMIT 500",
        )
        .all();
      let entries = rows.map((row) => {
        let detail = {};
        try {
          detail = row.detail ? JSON.parse(row.detail) : {};
        } catch {
          detail = {};
        }
        return normalizeAuditEntry({
          id: String(row.id),
          createdAt: row.created_at,
          actor: row.actor,
          action: row.action,
          path: row.path,
          ...detail,
        });
      });
      if (variantId) entries = entries.filter((r) => r.variantId === variantId);
      if (businessTypeId) {
        entries = entries.filter(
          (r) =>
            r.businessTypeId === businessTypeId ||
            (r.variantId && r.variantId.startsWith(`${businessTypeId}:`)),
        );
      }
      return entries.slice(0, limit);
    },
    savePresetOverride(presetId, patch) {
      const ts = nowIso();
      db.prepare(
        "INSERT OR REPLACE INTO preset_overrides (preset_id, payload, updated_at) VALUES (?, ?, ?)",
      ).run(presetId, JSON.stringify(patch), ts);
    },
    loadPresetOverride(presetId) {
      const row = db.prepare("SELECT payload FROM preset_overrides WHERE preset_id = ?").get(presetId);
      return row ? JSON.parse(row.payload) : {};
    },
  };
}
