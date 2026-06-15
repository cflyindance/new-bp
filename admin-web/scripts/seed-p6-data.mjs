/**
 * P6 种子：多租户 profile 键迁移 + KPI 日快照
 * 用法：node scripts/seed-p6-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultKpiSeedRows } from "./lib/kpi-snapshot-store.mjs";
import { createJsonKpiSnapshotStore } from "./lib/kpi-snapshot-store.mjs";
import { migrateLegacyProfileKeys } from "./lib/tenant-scope.mjs";
import { defaultTenantProfileDb } from "./lib/tenant-profile-defaults.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(__dirname, "../.cache");
const profilePath = path.join(cacheDir, "tenant-profile-mock-db.json");

function seedProfiles() {
  if (!fs.existsSync(profilePath)) {
    const db = defaultTenantProfileDb();
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(profilePath, JSON.stringify(db, null, 2), "utf8");
    console.log("[seed-p6] Created fresh tenant-profile-mock-db.json");
    return;
  }

  const db = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  const migrated = migrateLegacyProfileKeys(db.profiles ?? {});
  const defaults = defaultTenantProfileDb().profiles;
  db.profiles = { ...defaults, ...migrated };
  db.version = 2;
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(profilePath, JSON.stringify(db, null, 2), "utf8");
  console.log(`[seed-p6] Merged profiles → ${Object.keys(db.profiles).length} keys`);
}

function seedKpi() {
  const store = createJsonKpiSnapshotStore(cacheDir);
  const seeded = store.seedIfEmpty(defaultKpiSeedRows());
  console.log(seeded ? "[seed-p6] Wrote KPI snapshots" : "[seed-p6] KPI snapshots already exist");
}

seedProfiles();
seedKpi();
