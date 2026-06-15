/**

 * 租户功能画像 API 核心路由（P5/P6）

 */

import fs from "node:fs";

import path from "node:path";

import { readBody, sendJson } from "./http-api-utils.mjs";

import { isWriteMethod, requireAuth } from "./api-auth.mjs";

import { profileKey, resolveTenantIdFromRequest, tenantLayerKey } from "./tenant-scope.mjs";
import {
  diffPresetOverrideSnapshot,
  mergeVariantEffectiveState,
} from "./preset-audit-diff.mjs";

function loadPresetsSeedSafe(cacheDir) {
  try {
    const seedPath = path.join(cacheDir, "feature-presets-seed.json");
    if (!fs.existsSync(seedPath)) return { variants: [] };
    return JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    return { variants: [] };
  }
}

function findSeedVariant(seed, db, variantId) {
  return (
    (seed.variants ?? []).find((v) => v.id === variantId) ??
    (db.customVariants ?? []).find((v) => v.id === variantId) ??
    null
  );
}

function buildPresetAuditDetail(baseDetail) {
  return {
    ...baseDetail,
    id: baseDetail.businessTypeId ?? baseDetail.id,
  };
}



export const TENANT_PROFILE_API_PREFIX = "/api/v1/tenant-profile";



function readSeedBaseVersion(cacheDir, presetId) {

  const seedPath = path.join(cacheDir, "feature-presets-seed.json");

  if (!fs.existsSync(seedPath)) return 1;

  try {

    const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

    return (seed.productLines ?? []).find((p) => p.id === presetId)?.version ?? 1;

  } catch {

    return 1;

  }

}



function resolveTenantContext(req, auth) {

  return resolveTenantIdFromRequest(req, auth);

}



/**

 * @param {import('http').IncomingMessage} req

 * @param {import('http').ServerResponse} res

 * @param {object} repo

 */

export async function handleTenantProfileApiCore(req, res, repo) {

  const method = (req.method || "GET").toUpperCase();

  const url = new URL(req.url || "/", "http://localhost");

  const pathname = decodeURIComponent(url.pathname);



  if (!pathname.startsWith(TENANT_PROFILE_API_PREFIX)) return false;



  const sub = pathname.slice(TENANT_PROFILE_API_PREFIX.length) || "/";

  let auth = { actor: "dev-open", tenantId: "demo-tenant" };



  if (isWriteMethod(method)) {

    const gate = requireAuth(req, res, repo.cacheDir);

    if (!gate.ok) return true;

    auth = gate;

  } else if (process.env.BPLANT_API_REQUIRE_AUTH === "1") {

    const gate = requireAuth(req, res, repo.cacheDir);

    if (gate.ok) auth = gate;

  }



  const tenantId = resolveTenantContext(req, auth);



  try {

    if (method === "GET" && sub === "/health") {

      sendJson(res, 200, { ok: true, service: "tenant-profile", driver: repo.driver });

      return true;

    }



    const db = repo.loadDb();



    if (method === "GET" && sub === "/resolved") {

      const brandId = url.searchParams.get("brandId") || "";

      const storeId = url.searchParams.get("storeId") || "";

      const profile = repo.resolveProfile(db, { tenantId, brandId, storeId });

      sendJson(res, 200, {

        profile,

        resolvedFrom: { tenantId, brandId: brandId || null, storeId: storeId || null },

        updatedAt: db.updatedAt,

      });

      return true;

    }



    if (method === "GET" && sub === "/scope-options") {

      const brands = [];

      const stores = [];

      const brandPrefix = `${tenantId}:brand:`;

      const storePrefix = `${tenantId}:store:`;

      for (const [key, profile] of Object.entries(db.profiles ?? {})) {

        if (key.startsWith(brandPrefix)) {

          const id = key.slice(brandPrefix.length);

          brands.push({ id, brandId: profile.brandId ?? id });

        }

        if (key.startsWith(storePrefix)) {

          const id = key.slice(storePrefix.length);

          stores.push({

            id,

            storeId: profile.storeId ?? id,

            brandId: profile.brandId ?? "",

          });

        }

      }

      sendJson(res, 200, { tenantId, brands, stores, updatedAt: db.updatedAt });

      return true;

    }



    if (method === "GET" && sub === "/layers") {

      const brandId = url.searchParams.get("brandId") || "";

      const storeId = url.searchParams.get("storeId") || "";

      sendJson(res, 200, {

        tenant: db.profiles[tenantLayerKey(tenantId)] ?? null,

        brand: brandId ? (db.profiles[profileKey(tenantId, "brand", brandId)] ?? null) : null,

        store: storeId ? (db.profiles[profileKey(tenantId, "store", "", storeId)] ?? null) : null,

        tenantId,

        updatedAt: db.updatedAt,

      });

      return true;

    }



    if (method === "GET" && sub === "/presets") {

      sendJson(res, 200, repo.buildPresetsPayload(db));

      return true;

    }



    if (method === "GET" && sub === "/presets/audit-log") {

      const variantId = url.searchParams.get("variantId") || undefined;

      const businessTypeId = url.searchParams.get("businessTypeId") || undefined;

      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));

      const entries = repo.listAuditLog?.(db, { variantId, businessTypeId, limit }) ?? [];

      sendJson(res, 200, { entries, variantId, businessTypeId, limit });

      return true;

    }



    if (method === "POST" && sub === "/presets/business-types") {

      const body = await readBody(req);

      const id = String(body?.id ?? "")
        .trim()
        .toLowerCase();

      const title = String(body?.title ?? "").trim();

      const titleEn = String(body?.titleEn ?? body?.title ?? "").trim();

      const cloneFrom = String(body?.cloneFrom ?? "general").trim();

      if (!title || !/^[a-z][a-z0-9-]{1,31}$/.test(id)) {

        sendJson(res, 400, { error: "invalid_body" });

        return true;

      }

      db.customBusinessTypes = db.customBusinessTypes ?? [];

      db.customVariants = db.customVariants ?? [];

      const payloadPreview = repo.buildPresetsPayload(db);

      const exists = (payloadPreview.businessTypes ?? []).some((b) => b.id === id);

      if (exists) {

        sendJson(res, 409, { error: "duplicate_id" });

        return true;

      }

      const built = repo.cloneBusinessTypeCatalog(db, { id, title, titleEn, cloneFrom });

      if (!built?.businessType || !Array.isArray(built.variants) || built.variants.length === 0) {

        sendJson(res, 400, { error: "clone_failed" });

        return true;

      }

      db.customBusinessTypes.push(built.businessType);

      db.customVariants.push(...built.variants);

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "preset.business_type.create",

        path: sub,

        detail: buildPresetAuditDetail({
          businessTypeId: id,
          title,
          cloneFrom,
          tenantId,
        }),

      });

      sendJson(res, 201, repo.buildPresetsPayload(db));

      return true;

    }



    const businessTypePutMatch = sub.match(/^\/presets\/business-types\/([^/]+)$/);

    if (method === "PUT" && businessTypePutMatch) {

      const id = decodeURIComponent(businessTypePutMatch[1]);

      const body = await readBody(req);

      const title = String(body?.title ?? "").trim();

      const titleEn = String(body?.titleEn ?? body?.title ?? "").trim();

      if (!title) {

        sendJson(res, 400, { error: "invalid_body" });

        return true;

      }

      if (!repo.isCustomBusinessType?.(db, id)) {

        sendJson(res, 403, { error: "not_custom" });

        return true;

      }

      const ok = repo.updateCustomBusinessType?.(db, id, { title, titleEn });

      if (!ok) {

        sendJson(res, 404, { error: "not_found" });

        return true;

      }

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "preset.business_type.update",

        path: sub,

        detail: buildPresetAuditDetail({ businessTypeId: id, title, titleEn, tenantId }),

      });

      sendJson(res, 200, repo.buildPresetsPayload(db));

      return true;

    }



    if (method === "DELETE" && businessTypePutMatch) {

      const id = decodeURIComponent(businessTypePutMatch[1]);

      if (!repo.isCustomBusinessType?.(db, id)) {

        sendJson(res, 403, { error: "not_custom" });

        return true;

      }

      repo.deleteCustomBusinessType?.(db, id);

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "preset.business_type.delete",

        path: sub,

        detail: buildPresetAuditDetail({ businessTypeId: id, tenantId }),

      });

      sendJson(res, 200, repo.buildPresetsPayload(db));

      return true;

    }



    const variantPutMatch = sub.match(/^\/presets\/variant\/([^/]+)$/);

    if (method === "PUT" && variantPutMatch) {

      const variantId = decodeURIComponent(variantPutMatch[1]);

      const body = await readBody(req);

      if (!body || typeof body !== "object") {

        sendJson(res, 400, { error: "invalid_body" });

        return true;

      }

      const prev = db.variantOverrides?.[variantId] ?? {};

      const nextVersion = body.version ?? (prev.version ?? 1) + 1;

      const seed = loadPresetsSeedSafe(repo.cacheDir);

      const seedVariant = findSeedVariant(seed, db, variantId);

      const beforeState = mergeVariantEffectiveState(seedVariant, prev);

      const afterState = mergeVariantEffectiveState(seedVariant, {
        features: Array.isArray(body.features) ? body.features : beforeState.features,
        excludes: Array.isArray(body.excludes) ? body.excludes : beforeState.excludes,
        includes: Array.isArray(body.includes) ? body.includes : beforeState.includes,
        l2Includes: Array.isArray(body.l2Includes) ? body.l2Includes : beforeState.l2Includes,
        l3Includes: Array.isArray(body.l3Includes) ? body.l3Includes : beforeState.l3Includes,
        l2Excludes: Array.isArray(body.l2Excludes) ? body.l2Excludes : beforeState.l2Excludes,
        l3Excludes: Array.isArray(body.l3Excludes) ? body.l3Excludes : beforeState.l3Excludes,
        settingConfigs:
          body.settingConfigs && typeof body.settingConfigs === "object"
            ? body.settingConfigs
            : beforeState.settingConfigs,
      });

      const changes = diffPresetOverrideSnapshot(beforeState, afterState);

      const businessTypeId = variantId.includes(":") ? variantId.split(":")[0] : undefined;

      db.variantOverrides = db.variantOverrides ?? {};

      db.variantOverrides[variantId] = {
        ...prev,
        features: afterState.features,
        excludes: afterState.excludes,
        includes: afterState.includes,
        l2Includes: afterState.l2Includes,
        l3Includes: afterState.l3Includes,
        l2Excludes: afterState.l2Excludes,
        l3Excludes: afterState.l3Excludes,
        settingConfigs: afterState.settingConfigs,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        note: body.note ?? prev.note,
      };

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "preset.variant.override",

        path: sub,

        detail: buildPresetAuditDetail({
          variantId,
          businessTypeId,
          version: nextVersion,
          tenantId,
          changes,
        }),

      });

      sendJson(res, 200, repo.buildPresetsPayload(db));

      return true;

    }



    const presetPutMatch = sub.match(/^\/presets\/([^/]+)$/);

    if (method === "PUT" && presetPutMatch) {

      const presetId = decodeURIComponent(presetPutMatch[1]);

      const body = await readBody(req);

      if (!body || typeof body !== "object") {

        sendJson(res, 400, { error: "invalid_body" });

        return true;

      }

      const prev = db.presetOverrides?.[presetId] ?? {};

      const nextVersion = body.version ?? (prev.version ?? readSeedBaseVersion(repo.cacheDir, presetId)) + 1;

      db.presetOverrides = db.presetOverrides ?? {};

      db.presetOverrides[presetId] = {

        ...prev,

        excludes: Array.isArray(body.excludes) ? body.excludes : prev.excludes,

        l2Excludes: Array.isArray(body.l2Excludes) ? body.l2Excludes : prev.l2Excludes,
        l3Excludes: Array.isArray(body.l3Excludes) ? body.l3Excludes : prev.l3Excludes,
        settingConfigs:
          body.settingConfigs && typeof body.settingConfigs === "object"
            ? body.settingConfigs
            : prev.settingConfigs,
        version: nextVersion,

        updatedAt: new Date().toISOString(),

        note: body.note ?? prev.note,

      };

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "preset.override",

        path: sub,

        detail: { presetId, version: nextVersion, tenantId },

      });

      sendJson(res, 200, repo.buildPresetsPayload(db));

      return true;

    }



    if (method === "PUT" && sub === "/") {

      const body = await readBody(req);

      if (!body?.profile || typeof body.profile !== "object") {

        sendJson(res, 400, { error: "invalid_body", message: "profile required" });

        return true;

      }

      const scope = body.scope || body.profile.scope || "tenant";

      const brandId = body.brandId || body.profile.brandId || "";

      const storeId = body.storeId || body.profile.storeId || "";

      const key = profileKey(tenantId, scope, brandId, storeId);

      db.profiles[key] = {

        ...body.profile,

        tenantId,

        scope,

        brandId: brandId || undefined,

        storeId: storeId || undefined,

      };

      repo.saveDb(db);

      repo.appendAudit?.({

        actor: auth.actor ?? auth.email,

        action: "profile.put",

        path: sub,

        detail: { key, scope, tenantId },

      });

      sendJson(res, 200, { ok: true, key, tenantId, updatedAt: db.updatedAt });

      return true;

    }



    sendJson(res, 404, { error: "not_found", path: sub });

    return true;

  } catch (err) {

    sendJson(res, 500, { error: "internal", message: String(err?.message ?? err) });

    return true;

  }

}


