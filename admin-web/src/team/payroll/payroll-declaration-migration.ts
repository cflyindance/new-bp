import type { DeclarationSnapshot, DeclarationTemplateFamily, DeclarationTemplateVersion, EmployeeDeclarationPreference } from "./payroll-declaration-types";

export const DECLARATION_MIGRATION_VERSION = "payroll-declaration-v1" as const;

export interface LegacyDeclarationRecord {
  employeeId: string;
  periodId: string;
  declarationText: string;
  confirmedAt?: string | null;
}

export interface DeclarationMigrationState {
  organizationId: string;
  migrationMarker?: string | null;
  enforcementEnabled?: boolean;
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  preferences: EmployeeDeclarationPreference[];
  snapshots: DeclarationSnapshot[];
  employeeIds: string[];
  legacyDeclarationBodyEn: string;
  historicalRecords?: LegacyDeclarationRecord[];
}

function historicalSnapshot(record: LegacyDeclarationRecord): DeclarationSnapshot {
  return {
    snapshotId: `legacy:${record.periodId}:${record.employeeId}`,
    employeeId: record.employeeId,
    periodId: record.periodId,
    primaryVersionId: "legacy-fixed-english",
    englishVersionId: null,
    localeCode: "en-US",
    printMode: "employee-only",
    source: record.declarationText,
    englishSource: null,
    variables: {},
    renderedText: record.declarationText,
    renderedEnglishText: null,
    confirmedAt: record.confirmedAt ?? null,
    lockedAt: null,
    hashAlgorithm: "SHA-256(canonical-json-v1)",
    contentHash: "legacy-preserved",
  };
}

export function migrateLegacyDeclarationState(input: DeclarationMigrationState): DeclarationMigrationState {
  const state = structuredClone(input);
  if (state.migrationMarker === DECLARATION_MIGRATION_VERSION) return state;
  const familyId = "enterprise-english-v1";
  const versionId = "enterprise-english-v1-published";
  if (!state.families.some((family) => family.familyId === familyId)) {
    state.families.push({ familyId, scope: { organizationId: state.organizationId }, localeCode: "en-US", languageDisplayName: "English", activeVersionId: versionId, revision: 1 });
  }
  if (!state.versions.some((version) => version.versionId === versionId)) {
    state.versions.push({ versionId, familyId, version: 1, status: "published", source: state.legacyDeclarationBodyEn, variableSchemaVersion: "v1", createdBy: "legacy-migration" });
  }
  for (const record of state.historicalRecords ?? []) {
    if (!state.snapshots.some((snapshot) => snapshot.employeeId === record.employeeId && snapshot.periodId === record.periodId)) state.snapshots.push(historicalSnapshot(record));
  }
  state.migrationMarker = DECLARATION_MIGRATION_VERSION;
  state.enforcementEnabled = Boolean(state.enforcementEnabled);
  return state;
}

export function assignDeclarationPreference(input: DeclarationMigrationState, employeeIds: readonly string[], actorId: string, familyId: string, localeCode: string, printMode: EmployeeDeclarationPreference["defaultPrintMode"]): DeclarationMigrationState {
  const state = structuredClone(input);
  const allowed = new Set(state.employeeIds);
  const now = new Date().toISOString();
  for (const employeeId of employeeIds) {
    if (!allowed.has(employeeId)) continue;
    state.preferences = state.preferences.filter((item) => item.employeeId !== employeeId);
    state.preferences.push({ employeeId, defaultFamilyId: familyId, defaultLocaleCode: localeCode, defaultPrintMode: printMode, updatedBy: actorId, updatedAt: now });
  }
  return state;
}

export function getDeclarationActivationReadiness(state: DeclarationMigrationState) {
  const configuredIds = new Set(state.preferences.map((preference) => preference.employeeId));
  const configured = state.employeeIds.filter((employeeId) => configuredIds.has(employeeId)).length;
  const total = state.employeeIds.length;
  return { configured, total, percentage: total ? Math.round(configured * 10000 / total) / 100 : 100, enforcementEnabled: Boolean(state.enforcementEnabled), readyToActivate: configured === total };
}

export function activateDeclarationEnforcement(input: DeclarationMigrationState, authorized: boolean): DeclarationMigrationState {
  if (!authorized) throw new Error("Declaration activation permission is required");
  const readiness = getDeclarationActivationReadiness(input);
  if (!readiness.readyToActivate) throw new Error("Assign a published declaration template to every employee before activation");
  return { ...structuredClone(input), enforcementEnabled: true };
}
