import assert from "node:assert/strict";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { handlePayrollMockApi } from "./lib/payroll-mock-api-handler.mjs";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "payroll-declaration-api-"));
const dbPath = path.join(directory, "db.json");
const server = http.createServer((req, res) => { handlePayrollMockApi(req, res, dbPath); });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const headers = { "Content-Type": "application/json", "X-Payroll-Organization-Id": "org-1", "X-Payroll-Store-Id": "store-1", "X-Payroll-Actor-Id": "admin-1", "X-Payroll-Permission": "publish" };
const request = async (method, route, body) => {
  const response = await fetch(`${origin}${route}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
};

try {
  const created = await request("POST", "/api/v1/payroll/declaration/families", { organizationId: "org-1", storeId: "store-1", localeCode: "es-US", languageDisplayName: "Español" });
  assert.equal(created.status, 201);
  const version = await request("POST", `/api/v1/payroll/declaration/families/${created.body.familyId}/versions`, { source: "Propinas {{tips_amount}}", variableSchemaVersion: "v1" });
  assert.equal(version.status, 201);
  const published = await request("POST", `/api/v1/payroll/declaration/versions/${version.body.versionId}/publish`, { expectedFamilyRevision: 0 });
  assert.equal(published.status, 200);
  const stale = await request("POST", `/api/v1/payroll/declaration/versions/${version.body.versionId}/publish`, { expectedFamilyRevision: 0 });
  assert.equal(stale.status, 409);
  const listed = await request("GET", "/api/v1/payroll/declaration/_templates");
  assert.equal(listed.body.families.length, 1);
  assert.equal(listed.body.versions[0].status, "published");
  const forbidden = await fetch(`${origin}/api/v1/payroll/declaration/_templates`, { headers: { ...headers, "X-Payroll-Organization-Id": "" } });
  assert.equal(forbidden.status, 403);
  console.log("Payroll declaration API verification passed.");
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(directory, { recursive: true, force: true });
}
