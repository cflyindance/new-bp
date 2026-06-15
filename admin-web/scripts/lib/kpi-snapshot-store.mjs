/**
 * KPI 日快照存储（P6）— 真实营业数据接入层
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(currency, value) {
  if (currency === "CNY") return `¥${value.toLocaleString("zh-CN")}`;
  if (currency === "USD") return `$${value.toLocaleString("en-US")}`;
  return String(value);
}

function buildPayload(row) {
  return {
    currency: row.currency,
    asOf: row.updated_at ?? new Date().toISOString(),
    scope: {
      tenantId: row.tenant_id,
      brandId: row.brand_id || null,
      storeId: row.store_id || null,
    },
    metrics: {
      salesToday: {
        label: "今日销售额",
        value: row.sales_today,
        formatted: formatCurrency(row.currency, row.sales_today),
      },
      orderCount: {
        label: "订单数",
        value: row.order_count,
        formatted: String(row.order_count),
      },
      staffOnDuty: {
        label: "在岗员工",
        value: row.staff_on_duty,
        formatted: String(row.staff_on_duty),
      },
    },
    source: "kpi-snapshot",
    snapshotDate: row.snapshot_date,
  };
}

/** @param {string} cacheDir */
export function createJsonKpiSnapshotStore(cacheDir) {
  const filePath = path.join(cacheDir, "kpi-daily-snapshots.json");

  function loadAll() {
    if (!fs.existsSync(filePath)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data.snapshots ?? [];
    } catch {
      return [];
    }
  }

  function saveAll(snapshots) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(
      filePath,
      JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), snapshots }, null, 2),
      "utf8",
    );
  }

  function findSnapshot({ tenantId, brandId = "", storeId = "", date = todayUtcDate() }) {
    const rows = loadAll();
    const exact = rows.find(
      (r) =>
        r.tenantId === tenantId &&
        (r.brandId ?? "") === brandId &&
        (r.storeId ?? "") === storeId &&
        r.date === date,
    );
    if (exact) return exact;
    if (storeId) {
      const byStore = rows.find(
        (r) => r.tenantId === tenantId && (r.storeId ?? "") === storeId && r.date === date,
      );
      if (byStore) return byStore;
      return rows.find(
        (r) => r.tenantId === tenantId && (r.brandId ?? "") === brandId && !r.storeId && r.date === date,
      );
    }
    if (brandId) {
      return rows.find(
        (r) => r.tenantId === tenantId && (r.brandId ?? "") === brandId && !r.storeId && r.date === date,
      );
    }
    return rows.find((r) => r.tenantId === tenantId && !r.brandId && !r.storeId && r.date === date);
  }

  return {
    driver: "json",
    filePath,
    getKpi({ tenantId, brandId = "", storeId = "", date = todayUtcDate() }) {
      const row = findSnapshot({ tenantId, brandId, storeId, date });
      if (!row) return null;
      return buildPayload({
        tenant_id: row.tenantId,
        brand_id: row.brandId ?? "",
        store_id: row.storeId ?? "",
        currency: row.currency ?? "CNY",
        sales_today: row.salesToday,
        order_count: row.orderCount,
        staff_on_duty: row.staffOnDuty,
        snapshot_date: row.date,
        updated_at: row.updatedAt,
      });
    },
    upsertSnapshot(snapshot) {
      const rows = loadAll().filter(
        (r) =>
          !(
            r.tenantId === snapshot.tenantId &&
            (r.brandId ?? "") === (snapshot.brandId ?? "") &&
            (r.storeId ?? "") === (snapshot.storeId ?? "") &&
            r.date === snapshot.date
          ),
      );
      rows.push({ ...snapshot, updatedAt: new Date().toISOString() });
      saveAll(rows);
    },
    seedIfEmpty(seedRows) {
      if (loadAll().length > 0) return false;
      saveAll(seedRows);
      return true;
    },
  };
}

/** @param {string} sqlitePath */
export function createSqliteKpiSnapshotStore(sqlitePath) {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS kpi_daily (
      tenant_id TEXT NOT NULL,
      brand_id TEXT NOT NULL DEFAULT '',
      store_id TEXT NOT NULL DEFAULT '',
      snapshot_date TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'CNY',
      sales_today INTEGER NOT NULL,
      order_count INTEGER NOT NULL,
      staff_on_duty INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (tenant_id, brand_id, store_id, snapshot_date)
    );
  `);

  return {
    driver: "sqlite",
    sqlitePath,
    getKpi({ tenantId, brandId = "", storeId = "", date = todayUtcDate() }) {
      const exact = db
        .prepare(
          `SELECT * FROM kpi_daily
           WHERE tenant_id = ? AND brand_id = ? AND store_id = ? AND snapshot_date = ?`,
        )
        .get(tenantId, brandId, storeId, date);
      if (exact) return buildPayload(exact);

      if (storeId) {
        const byStore = db
          .prepare(
            `SELECT * FROM kpi_daily
             WHERE tenant_id = ? AND store_id = ? AND snapshot_date = ?
             ORDER BY brand_id DESC LIMIT 1`,
          )
          .get(tenantId, storeId, date);
        if (byStore) return buildPayload(byStore);
      }

      if (brandId) {
        const byBrand = db
          .prepare(
            `SELECT * FROM kpi_daily
             WHERE tenant_id = ? AND brand_id = ? AND store_id = '' AND snapshot_date = ?`,
          )
          .get(tenantId, brandId, date);
        if (byBrand) return buildPayload(byBrand);
      }

      const tenantRow = db
        .prepare(
          `SELECT * FROM kpi_daily
           WHERE tenant_id = ? AND brand_id = '' AND store_id = '' AND snapshot_date = ?`,
        )
        .get(tenantId, date);
      return tenantRow ? buildPayload(tenantRow) : null;
    },
    upsertSnapshot(snapshot) {
      const ts = new Date().toISOString();
      db.prepare(
        `INSERT OR REPLACE INTO kpi_daily
         (tenant_id, brand_id, store_id, snapshot_date, currency, sales_today, order_count, staff_on_duty, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        snapshot.tenantId,
        snapshot.brandId ?? "",
        snapshot.storeId ?? "",
        snapshot.date,
        snapshot.currency ?? "CNY",
        snapshot.salesToday,
        snapshot.orderCount,
        snapshot.staffOnDuty,
        ts,
      );
    },
    seedIfEmpty(seedRows) {
      const count = db.prepare("SELECT COUNT(*) AS c FROM kpi_daily").get()?.c ?? 0;
      if (count > 0) return false;
      for (const row of seedRows) {
        this.upsertSnapshot(row);
      }
      return true;
    },
  };
}

export function defaultKpiSeedRows(date = todayUtcDate()) {
  return [
    {
      tenantId: "demo-tenant",
      brandId: "",
      storeId: "",
      date,
      currency: "CNY",
      salesToday: 186420,
      orderCount: 1248,
      staffOnDuty: 42,
    },
    {
      tenantId: "demo-tenant",
      brandId: "miju",
      storeId: "",
      date,
      currency: "CNY",
      salesToday: 92800,
      orderCount: 612,
      staffOnDuty: 18,
    },
    {
      tenantId: "demo-tenant",
      brandId: "miju",
      storeId: "shanghai-ljz",
      date,
      currency: "CNY",
      salesToday: 28450,
      orderCount: 186,
      staffOnDuty: 8,
    },
    {
      tenantId: "demo-tenant",
      brandId: "menusifu-na",
      storeId: "flagship-nyc",
      date,
      currency: "USD",
      salesToday: 15280,
      orderCount: 203,
      staffOnDuty: 11,
    },
    {
      tenantId: "partner-hq",
      brandId: "",
      storeId: "",
      date,
      currency: "CNY",
      salesToday: 95600,
      orderCount: 428,
      staffOnDuty: 24,
    },
    {
      tenantId: "partner-hq",
      brandId: "chuanchuan",
      storeId: "chengdu-td",
      date,
      currency: "CNY",
      salesToday: 42180,
      orderCount: 167,
      staffOnDuty: 14,
    },
  ];
}
