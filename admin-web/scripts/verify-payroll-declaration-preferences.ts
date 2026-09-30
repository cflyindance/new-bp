import assert from "node:assert/strict";
import fs from "node:fs";
import { resolveEmployeeDeclarationPresentation } from "../src/team/payroll/payroll-declaration-presentation";
import type { DeclarationSnapshot, DeclarationTemplateFamily, DeclarationTemplateVersion } from "../src/team/payroll/payroll-declaration-types";

const families: DeclarationTemplateFamily[] = [
  { familyId: "es-org", scope: { organizationId: "org" }, localeCode: "es-US", languageDisplayName: "Español", activeVersionId: "es-v1" },
  { familyId: "es-store", scope: { organizationId: "org", storeId: "store" }, localeCode: "es-US", languageDisplayName: "Español", activeVersionId: "es-store-v1" },
  { familyId: "en-org", scope: { organizationId: "org" }, localeCode: "en-US", languageDisplayName: "English", activeVersionId: "en-v1" },
];
const versions: DeclarationTemplateVersion[] = [
  { versionId: "es-v1", familyId: "es-org", status: "published", source: "Propinas {{tips_amount}}" },
  { versionId: "es-store-v1", familyId: "es-store", status: "published", source: "Propinas de tienda {{tips_amount}}" },
  { versionId: "en-v1", familyId: "en-org", status: "published", source: "Tips {{tips_amount}}" },
];
const preference = { employeeId: "emp", defaultFamilyId: "es-org", defaultLocaleCode: "es-US", defaultPrintMode: "employee-only" as const, updatedBy: "admin", updatedAt: "2026-09-29" };
const base = { employeeId: "emp", periodId: "p1", organizationId: "org", storeId: "store", families, versions, preference, variables: { tips_amount: "$144.00" } };

assert.equal(resolveEmployeeDeclarationPresentation(base).primary?.versionId, "es-v1");
const overridden = resolveEmployeeDeclarationPresentation({ ...base, override: { employeeId: "emp", periodId: "p1", familyId: "es-store", localeCode: "es-US", printMode: "bilingual-english" } });
assert.equal(overridden.primary?.versionId, "es-store-v1");
assert.equal(overridden.english?.versionId, "en-v1");
assert.equal(preference.defaultFamilyId, "es-org");
const english = resolveEmployeeDeclarationPresentation({ ...base, preference: { ...preference, defaultFamilyId: "en-org", defaultLocaleCode: "en-US", defaultPrintMode: "bilingual-english" } });
assert.equal(english.english, null);
const noEnglish = resolveEmployeeDeclarationPresentation({ ...base, versions: versions.filter((version) => version.familyId !== "en-org"), override: { employeeId: "emp", periodId: "p1", familyId: "es-store", localeCode: "es-US", printMode: "bilingual-english" } });
assert.deepEqual(noEnglish.blockers, ["missing_english_template"]);
const snapshot: DeclarationSnapshot = { snapshotId: "snap", employeeId: "emp", periodId: "p1", primaryVersionId: "old", englishVersionId: null, localeCode: "vi-VN", printMode: "employee-only", source: "Cũ", englishSource: null, variables: {}, renderedText: "Bản đã xác nhận", renderedEnglishText: null, confirmedAt: "2026-09-29", lockedAt: null, hashAlgorithm: "SHA-256(canonical-json-v1)", contentHash: "abc" };
assert.equal(resolveEmployeeDeclarationPresentation({ ...base, snapshot }).primary?.renderedText, "Bản đã xác nhận");

const defaults = { ...base, preference: null, families: [], versions: [], variables: { tips_amount: "$144.00", gratuity_amount: "$12.50" } };
const systemDefault = resolveEmployeeDeclarationPresentation(defaults);
assert.equal(systemDefault.status, "ready", "Unconfigured employee uses system default, not a blocker");
assert.equal(systemDefault.primary?.localeCode, "en-US");
assert.equal(systemDefault.primary?.familyId, "system-default");
assert.equal(systemDefault.english, null);
assert.match(systemDefault.primary?.renderedText ?? "", /gratuity \$12\.50 and tips \$144\.00/);
const mapping = fs.readFileSync("src/team/payroll/legacy/payroll-adp-mapping.js.txt", "utf8");
const currentEnglish = mapping.match(/declarationBodyEn:\s*"([^"]+)"/)![1].replace(/\$\{svc_amount\}/g, "{{gratuity_amount}}").replace(/\$\{tips_amount\}/g, "{{tips_amount}}");
assert.equal(systemDefault.primary?.source, currentEnglish, "System default keeps the existing English wording");
assert.equal(resolveEmployeeDeclarationPresentation({ ...defaults, snapshot }).primary?.renderedText, "Bản đã xác nhận", "Historical snapshot wins over system default");
assert.deepEqual(resolveEmployeeDeclarationPresentation({ ...base, families: [], versions: [] }).blockers, ["missing_primary_template"], "Explicit missing template never silently falls back");

console.log("Payroll declaration preference verification passed.");
