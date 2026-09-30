import { DeclarationRenderError, renderDeclarationText, resolveActiveDeclarationVersion } from "./payroll-declaration-engine";
import type {
  DeclarationPeriodOverride,
  DeclarationPrintMode,
  DeclarationSnapshot,
  DeclarationTemplateFamily,
  DeclarationTemplateVersion,
  DeclarationVariables,
  EmployeeDeclarationPreference,
} from "./payroll-declaration-types";

export type DeclarationPresentationBlocker = "missing_preference" | "missing_primary_template" | "missing_english_template" | "missing_variables";

// Preserve the existing payroll English wording; independent of administrator UI locale.
export const SYSTEM_DEFAULT_DECLARATION_SOURCE = "I hereby certify that the above time and gratuity {{gratuity_amount}} and tips {{tips_amount}} are correct. I further certify, under penalty of perjury, that I have been provided rest breaks as required by California law and that any meal period or rest break missed was purely voluntary.";

export interface DeclarationPresentationPart {
  localeCode: string;
  familyId: string;
  versionId: string;
  sourceScope: "store" | "enterprise" | "system";
  source: string;
  renderedText: string;
  variables?: DeclarationVariables;
}

/** Emphasize bound values only, without changing stored or historical declaration text. */
export function renderDeclarationPartHtml(part: DeclarationPresentationPart): string {
  const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!).replace(/\n/g, "<br>");
  if (!part.variables) return escape(part.renderedText);
  let plain = "", html = "", cursor = 0;
  for (const match of part.source.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g)) {
    const value = Object.prototype.hasOwnProperty.call(part.variables, match[1]) ? part.variables[match[1] as keyof DeclarationVariables] : undefined;
    if (value === undefined || value === null) return escape(part.renderedText);
    const prefix = part.source.slice(cursor, match.index);
    plain += prefix + String(value);
    html += escape(prefix) + `<strong class="payroll-decl-variable" style="font-size:1.35em;font-weight:800;line-height:1.25;padding:0 2px;color:inherit"><u style="text-underline-offset:4px;text-decoration-thickness:2px">${escape(String(value))}</u></strong>`;
    cursor = match.index! + match[0].length;
  }
  plain += part.source.slice(cursor);
  html += escape(part.source.slice(cursor));
  return plain.normalize("NFC") === part.renderedText.normalize("NFC") ? html : escape(part.renderedText);
}

export interface EmployeeDeclarationPresentation {
  status: "ready" | "blocked" | "frozen";
  primary: DeclarationPresentationPart | null;
  english: DeclarationPresentationPart | null;
  printMode: DeclarationPrintMode;
  blockers: DeclarationPresentationBlocker[];
  snapshot: DeclarationSnapshot | null;
}

export interface EmployeeDeclarationPresentationInput {
  employeeId: string;
  periodId: string;
  organizationId: string;
  storeId?: string;
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  preference?: EmployeeDeclarationPreference | null;
  override?: DeclarationPeriodOverride | null;
  snapshot?: DeclarationSnapshot | null;
  variables: DeclarationVariables;
}

function snapshotPresentation(snapshot: DeclarationSnapshot): EmployeeDeclarationPresentation {
  const primary: DeclarationPresentationPart = { localeCode: snapshot.localeCode, familyId: "snapshot", versionId: snapshot.primaryVersionId, sourceScope: "enterprise", source: snapshot.source, renderedText: snapshot.renderedText, variables: snapshot.variables };
  const english = snapshot.renderedEnglishText && snapshot.englishVersionId
    ? { localeCode: "en-US", familyId: "snapshot", versionId: snapshot.englishVersionId, sourceScope: "enterprise" as const, source: snapshot.englishSource ?? "", renderedText: snapshot.renderedEnglishText, variables: snapshot.variables }
    : null;
  return { status: "frozen", primary, english, printMode: snapshot.printMode, blockers: [], snapshot };
}

function findFamilyForVersion(version: DeclarationTemplateVersion, families: DeclarationTemplateFamily[]): DeclarationTemplateFamily | null {
  return families.find((family) => family.familyId === version.familyId) ?? null;
}

function toPart(version: DeclarationTemplateVersion, families: DeclarationTemplateFamily[], variables: DeclarationVariables): DeclarationPresentationPart | null {
  const family = findFamilyForVersion(version, families);
  if (!family) return null;
  return { localeCode: family.localeCode, familyId: family.familyId, versionId: version.versionId, sourceScope: family.scope.storeId ? "store" : "enterprise", source: version.source, renderedText: renderDeclarationText(version.source, variables), variables };
}

export function resolveEmployeeDeclarationPresentation(input: EmployeeDeclarationPresentationInput): EmployeeDeclarationPresentation {
  if (input.snapshot) return snapshotPresentation(input.snapshot);
  if (!input.preference && !input.override) {
    try {
      return {
        status: "ready", printMode: "employee-only", english: null, blockers: [], snapshot: null,
        primary: {
          localeCode: "en-US", familyId: "system-default", versionId: "system-default-en-v1",
          sourceScope: "system", source: SYSTEM_DEFAULT_DECLARATION_SOURCE,
          renderedText: renderDeclarationText(SYSTEM_DEFAULT_DECLARATION_SOURCE, input.variables),
          variables: input.variables,
        },
      };
    } catch (error) {
      if (error instanceof DeclarationRenderError) return { status: "blocked", primary: null, english: null, printMode: "employee-only", blockers: ["missing_variables"], snapshot: null };
      throw error;
    }
  }
  const familyId = input.override?.familyId ?? input.preference?.defaultFamilyId;
  const localeCode = input.override?.localeCode ?? input.preference?.defaultLocaleCode;
  const printMode = input.override?.printMode ?? input.preference?.defaultPrintMode ?? "employee-only";
  if (!familyId || !localeCode) return { status: "blocked", primary: null, english: null, printMode, blockers: ["missing_preference"], snapshot: null };

  const primaryVersion = resolveActiveDeclarationVersion({ families: input.families, versions: input.versions, organizationId: input.organizationId, storeId: input.storeId, preferredFamilyId: familyId, localeCode });
  if (!primaryVersion) return { status: "blocked", primary: null, english: null, printMode, blockers: ["missing_primary_template"], snapshot: null };
  try {
    const primary = toPart(primaryVersion, input.families, input.variables);
    if (!primary) return { status: "blocked", primary: null, english: null, printMode, blockers: ["missing_primary_template"], snapshot: null };
    const primaryIsEnglish = primary.localeCode.toLowerCase().startsWith("en");
    if (printMode === "employee-only" || primaryIsEnglish) return { status: "ready", primary, english: null, printMode, blockers: [], snapshot: null };
    const englishVersion = resolveActiveDeclarationVersion({ families: input.families, versions: input.versions, organizationId: input.organizationId, storeId: input.storeId, localeCode: "en-US" });
    if (!englishVersion) return { status: "blocked", primary, english: null, printMode, blockers: ["missing_english_template"], snapshot: null };
    const english = toPart(englishVersion, input.families, input.variables);
    return english ? { status: "ready", primary, english, printMode, blockers: [], snapshot: null } : { status: "blocked", primary, english: null, printMode, blockers: ["missing_english_template"], snapshot: null };
  } catch (error) {
    if (error instanceof DeclarationRenderError) return { status: "blocked", primary: null, english: null, printMode, blockers: ["missing_variables"], snapshot: null };
    throw error;
  }
}
