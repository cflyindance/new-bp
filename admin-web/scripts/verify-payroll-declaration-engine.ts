import assert from "node:assert/strict";
import {
  buildDeclarationCanonicalPayload,
  DeclarationRenderError,
  renderDeclarationText,
  resolveActiveDeclarationVersion,
  stringifyDeclarationCanonicalPayload,
  validateDeclarationSource,
} from "../src/team/payroll/payroll-declaration-engine";
import type { DeclarationTemplateFamily, DeclarationTemplateVersion } from "../src/team/payroll/payroll-declaration-types";

const families: DeclarationTemplateFamily[] = [
  { familyId: "fam-en", scope: { organizationId: "org-1" }, localeCode: "en-US", languageDisplayName: "English", activeVersionId: "ver-en-2" },
  { familyId: "fam-es-org", scope: { organizationId: "org-1" }, localeCode: "es-US", languageDisplayName: "Español", activeVersionId: "ver-es-2" },
  { familyId: "fam-es-store", scope: { organizationId: "org-1", storeId: "store-1" }, localeCode: "es-US", languageDisplayName: "Español", activeVersionId: "ver-es-3" },
];
const versions: DeclarationTemplateVersion[] = [
  { versionId: "ver-en-2", familyId: "fam-en", status: "published", source: "Tips {{tips_amount}}" },
  { versionId: "ver-es-2", familyId: "fam-es-org", status: "published", source: "Propinas {{tips_amount}}" },
  { versionId: "ver-es-3", familyId: "fam-es-store", status: "published", source: "Propinas {{tips_amount}}" },
];

assert.equal(resolveActiveDeclarationVersion({ families, versions, organizationId: "org-1", storeId: "store-1", preferredFamilyId: "fam-es-store", localeCode: "es-US" })?.versionId, "ver-es-3");
assert.equal(resolveActiveDeclarationVersion({ families, versions, organizationId: "org-1", storeId: "store-2", localeCode: "es-US" })?.versionId, "ver-es-2");
assert.equal(resolveActiveDeclarationVersion({ families, versions, organizationId: "org-2", storeId: "store-1", localeCode: "es-US" }), null);

assert.deepEqual(validateDeclarationSource("Tips {{unknown}}"), [{ code: "unknown_variable", variable: "unknown" }]);
assert.deepEqual(validateDeclarationSource("<script>alert(1)</script>"), [{ code: "html_not_allowed" }]);
assert.equal(validateDeclarationSource("بيان \u2067العربية\u2069").length, 0);
assert.equal(validateDeclarationSource("spoof\u202Etxt")[0]?.code, "bidi_override_not_allowed");
assert.equal(validateDeclarationSource("bad\u2067")[0]?.code, "unpaired_bidi_isolate");

assert.equal(renderDeclarationText("Propinas {{tips_amount}}", { tips_amount: "$144.00" }), "Propinas $144.00");
assert.throws(() => renderDeclarationText("Tips {{tips_amount}}", {}), (error) => error instanceof DeclarationRenderError && error.missingVariables[0] === "tips_amount");

const canonical = buildDeclarationCanonicalPayload({ localeCode: "es-US", printMode: "employee-only", source: "Cafe\u0301", variables: { tips_amount: "144.00" }, renderedText: "Café" });
assert.equal(canonical.source, "Café");
assert.equal(stringifyDeclarationCanonicalPayload(canonical), '{"localeCode":"es-US","printMode":"employee-only","renderedText":"Café","source":"Café","variables":{"tips_amount":"144.00"}}');

console.log("Payroll declaration engine verification passed.");
