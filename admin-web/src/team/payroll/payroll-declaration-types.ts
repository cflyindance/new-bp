export type DeclarationStatus = "draft" | "published" | "retired";
export type DeclarationPrintMode = "employee-only" | "bilingual-english";

export const DECLARATION_VARIABLE_NAMES = [
  "employee_name",
  "pay_period_start",
  "pay_period_end",
  "regular_hours",
  "overtime_hours",
  "total_hours",
  "tips_amount",
  "gratuity_amount",
  "store_name",
  "confirmation_date",
] as const;

export type DeclarationVariableName = (typeof DECLARATION_VARIABLE_NAMES)[number];
export type DeclarationVariables = Partial<Record<DeclarationVariableName, string>>;

export interface DeclarationScope {
  organizationId: string;
  storeId?: string;
}

export interface DeclarationTemplateFamily {
  familyId: string;
  scope: DeclarationScope;
  localeCode: string;
  languageDisplayName: string;
  activeVersionId: string | null;
  revision?: number;
}

export interface DeclarationTemplateVersion {
  versionId: string;
  familyId: string;
  version?: number;
  status: DeclarationStatus;
  source: string;
  variableSchemaVersion?: "v1";
  createdBy?: string;
  createdAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  publishedAt?: string;
  retiredAt?: string;
}

export interface EmployeeDeclarationPreference {
  employeeId: string;
  defaultFamilyId: string;
  defaultLocaleCode: string;
  defaultPrintMode: DeclarationPrintMode;
  updatedBy: string;
  updatedAt: string;
}

export interface DeclarationPeriodOverride {
  employeeId: string;
  periodId: string;
  familyId: string;
  localeCode: string;
  printMode: DeclarationPrintMode;
}

export interface DeclarationSnapshot {
  snapshotId: string;
  employeeId: string;
  periodId: string;
  primaryVersionId: string;
  englishVersionId: string | null;
  localeCode: string;
  printMode: DeclarationPrintMode;
  source: string;
  englishSource: string | null;
  variables: DeclarationVariables;
  renderedText: string;
  renderedEnglishText: string | null;
  confirmedAt: string | null;
  lockedAt: string | null;
  hashAlgorithm: "SHA-256(canonical-json-v1)";
  contentHash: string;
}

export type DeclarationValidationIssue =
  | { code: "unknown_variable"; variable: string }
  | { code: "html_not_allowed" }
  | { code: "forbidden_control"; codePoint: string }
  | { code: "bidi_override_not_allowed"; codePoint: string }
  | { code: "unpaired_bidi_isolate"; codePoint: string };

export interface DeclarationResolutionInput {
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  organizationId: string;
  storeId?: string;
  preferredFamilyId?: string;
  localeCode: string;
}

export interface DeclarationCanonicalPayloadInput {
  localeCode: string;
  printMode: DeclarationPrintMode;
  source: string;
  variables: DeclarationVariables;
  renderedText: string;
  primaryVersionId?: string;
  englishVersionId?: string | null;
  englishSource?: string | null;
  renderedEnglishText?: string | null;
}
