import assert from "node:assert/strict";
import { activateDeclarationEnforcement, assignDeclarationPreference, getDeclarationActivationReadiness, migrateLegacyDeclarationState, type DeclarationMigrationState } from "../src/team/payroll/payroll-declaration-migration";

const legacy: DeclarationMigrationState = { organizationId: "org", families: [], versions: [], preferences: [], snapshots: [], employeeIds: ["e1", "e2"], legacyDeclarationBodyEn: "Legacy English", historicalRecords: [{ employeeId: "e1", periodId: "old", declarationText: "Historical fixed text", confirmedAt: "2025-01-01T00:00:00.000Z" }] };
const migrated = migrateLegacyDeclarationState(legacy);
assert.equal(migrated.families.length, 1);
assert.equal(migrated.versions[0]?.status, "published");
assert.equal(migrated.snapshots[0]?.renderedText, "Historical fixed text");
assert.equal(migrateLegacyDeclarationState(migrated).families.length, 1);
assert.equal(migrated.preferences.length, 0, "Migration must not infer employee language");
assert.deepEqual(getDeclarationActivationReadiness(migrated), { configured: 0, total: 2, percentage: 0, enforcementEnabled: false, readyToActivate: false });
assert.throws(() => activateDeclarationEnforcement(migrated, true), /every employee/);
const assigned = assignDeclarationPreference(migrated, ["e1", "e2"], "admin", "enterprise-english-v1", "en-US", "employee-only");
assert.equal(getDeclarationActivationReadiness(assigned).percentage, 100);
assert.throws(() => activateDeclarationEnforcement(assigned, false), /permission/);
assert.equal(activateDeclarationEnforcement(assigned, true).enforcementEnabled, true);
console.log("Payroll declaration migration verification passed.");
