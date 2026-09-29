import assert from "node:assert/strict";
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

console.log("Payroll declaration preference verification passed.");
