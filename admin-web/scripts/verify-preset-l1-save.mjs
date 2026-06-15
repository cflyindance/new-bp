/**
 * 校验平台预设 L1 勾选可写入 mock DB 并在 GET 中回读
 */
import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import { fileURLToPath } from "node:url";
import { createJsonTenantProfileRepository } from "./lib/tenant-profile-repository.mjs";
import { handleTenantProfileApiCore } from "./lib/tenant-profile-api-core.mjs";
import { createPresetExcludeState } from "../src/config/feature-presets-admin-tree-bind.ts";
import { getEffectiveBusinessProductLineVariant } from "../src/config/feature-presets-variant-runtime.ts";
import { setBusinessProductLineVariantOverrides } from "../src/config/feature-presets-variant-runtime.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(__dirname, "../.cache");
const dbPath = path.join(cacheDir, "verify-preset-l1-save-db.json");
const variantId = "general:emenu-only";

function createMockReq(method, url, body) {
  const payload = body ? JSON.stringify(body) : "";
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = {
    authorization: "Bearer test",
    "content-type": "application/json",
  };
  queueMicrotask(() => {
    if (payload) req.emit("data", Buffer.from(payload));
    req.emit("end");
  });
  return req;
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(body) {
      this.body = body;
    },
  };
}

async function callApi(repo, method, sub, body) {
  const req = createMockReq(method, `/api/v1/tenant-profile${sub}`, body);
  const res = createMockRes();
  const handled = await handleTenantProfileApiCore(req, res, repo);
  if (!handled) throw new Error(`unhandled ${method} ${sub}`);
  return { status: res.statusCode, data: JSON.parse(res.body || "{}") };
}

async function main() {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const repo = createJsonTenantProfileRepository(dbPath);

  const put = await callApi(repo, "PUT", `/presets/variant/${encodeURIComponent(variantId)}`, {
    features: [
      { featureId: "store-mgmt", tier: "core" },
      { featureId: "queue-call", tier: "recommended" },
      { featureId: "transactions", tier: "core" },
    ],
    excludes: [],
    includes: [],
    l2Includes: ["st-overview", "st-list", "st-status", "st-brand-menu", "st-settings"],
    l3Includes: [],
    l2Excludes: [],
    l3Excludes: [],
    version: 2,
  });

  const override = put.data.variantOverrides?.[variantId];
  const featureIds = (override?.features ?? []).map((f) => f.featureId);
  if (!featureIds.includes("store-mgmt") || !featureIds.includes("queue-call")) {
    console.error("[FAIL] PUT response missing L1 features", override);
    process.exit(1);
  }
  if (!(override?.l2Includes ?? []).includes("st-overview")) {
    console.error("[FAIL] PUT response missing L2 l2Includes", override?.l2Includes);
    process.exit(1);
  }

  const merged = put.data.variants?.find((v) => v.id === variantId);
  const mergedIds = (merged?.features ?? []).map((f) => f.featureId);
  if (!mergedIds.includes("store-mgmt")) {
    console.error("[FAIL] PUT merged variant missing L1 feature", mergedIds);
    process.exit(1);
  }
  if (!(merged?.l2Includes ?? []).includes("st-overview")) {
    console.error("[FAIL] PUT merged variant missing L2 l2Includes", merged?.l2Includes);
    process.exit(1);
  }

  const db = repo.loadDb();
  const dbOverride = db.variantOverrides?.[variantId];
  const dbIds = (dbOverride?.features ?? []).map((f) => f.featureId);
  if (!dbIds.includes("store-mgmt")) {
    console.error("[FAIL] DB missing L1 feature", dbOverride);
    process.exit(1);
  }
  if (!(dbOverride?.l2Includes ?? []).includes("st-overview")) {
    console.error("[FAIL] DB missing L2 l2Includes", dbOverride?.l2Includes);
    process.exit(1);
  }

  const get = await callApi(repo, "GET", "/presets");
  const getOverride = get.data.variantOverrides?.[variantId];
  const getIds = (getOverride?.features ?? []).map((f) => f.featureId);
  if (!getIds.includes("store-mgmt")) {
    console.error("[FAIL] GET missing L1 feature override", getOverride);
    process.exit(1);
  }
  if (!(getOverride?.l2Includes ?? []).includes("st-overview")) {
    console.error("[FAIL] GET missing L2 l2Includes", getOverride?.l2Includes);
    process.exit(1);
  }

  fs.unlinkSync(dbPath);

  setBusinessProductLineVariantOverrides({
    [variantId]: {
      features: [
        { featureId: "store-mgmt", tier: "core" },
        { featureId: "print-templates", tier: "recommended" },
      ],
      excludes: [],
      includes: [],
      l2Includes: ["pt-decoration", "pt-settings"],
      l3Includes: [],
      l2Excludes: [],
      l3Excludes: [],
      version: 3,
    },
  });
  const effective = getEffectiveBusinessProductLineVariant(variantId);
  const editorState = createPresetExcludeState({
    features: effective.features,
    excludes: effective.excludes,
    includes: effective.includes ?? [],
    l2Includes: effective.l2Includes,
    l3Includes: effective.l3Includes,
    l2Excludes: effective.l2Excludes ?? [],
    l3Excludes: effective.l3Excludes ?? [],
  });
  if (editorState.l1Enabled.has("finance-center")) {
    console.error("[FAIL] editor reload should not inject unchecked L1 from platform defaults");
    process.exit(1);
  }
  if (!editorState.l1Enabled.has("print-templates")) {
    console.error("[FAIL] editor reload should keep saved L1", [...editorState.l1Enabled]);
    process.exit(1);
  }
  setBusinessProductLineVariantOverrides({});

  console.log("verify-preset-l1-save: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
