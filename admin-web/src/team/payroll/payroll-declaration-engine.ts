import {
  DECLARATION_VARIABLE_NAMES,
  type DeclarationCanonicalPayloadInput,
  type DeclarationResolutionInput,
  type DeclarationTemplateFamily,
  type DeclarationTemplateVersion,
  type DeclarationValidationIssue,
  type DeclarationVariables,
} from "./payroll-declaration-types";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const ALLOWED_VARIABLES = new Set<string>(DECLARATION_VARIABLE_NAMES);
const BIDI_OPEN_TO_CLOSE = new Map<number, number>([
  [0x2066, 0x2069],
  [0x2067, 0x2069],
  [0x2068, 0x2069],
]);
const BIDI_OVERRIDES = new Set([0x202a, 0x202b, 0x202c, 0x202d, 0x202e]);

function normalizeLocale(value: string): string {
  return value.trim().toLowerCase();
}

function scopeMatches(family: DeclarationTemplateFamily, organizationId: string, storeId?: string): boolean {
  if (family.scope.organizationId !== organizationId) return false;
  return !family.scope.storeId || family.scope.storeId === storeId;
}

function activePublishedVersion(
  family: DeclarationTemplateFamily | undefined,
  versions: DeclarationTemplateVersion[],
): DeclarationTemplateVersion | null {
  if (!family?.activeVersionId) return null;
  return versions.find((version) => version.versionId === family.activeVersionId && version.familyId === family.familyId && version.status === "published") ?? null;
}

export function resolveActiveDeclarationVersion(input: DeclarationResolutionInput): DeclarationTemplateVersion | null {
  const locale = normalizeLocale(input.localeCode);
  const applicable = input.families.filter((family) =>
    scopeMatches(family, input.organizationId, input.storeId) && normalizeLocale(family.localeCode) === locale,
  );
  const preferred = applicable.find((family) => family.familyId === input.preferredFamilyId);
  const storeFamily = applicable.find((family) => Boolean(family.scope.storeId) && family.scope.storeId === input.storeId);
  const enterpriseFamily = applicable.find((family) => !family.scope.storeId);
  return activePublishedVersion(preferred ?? storeFamily ?? enterpriseFamily, input.versions);
}

export function validateDeclarationSource(source: string): DeclarationValidationIssue[] {
  const issues: DeclarationValidationIssue[] = [];
  const seen = new Set<string>();
  const add = (issue: DeclarationValidationIssue, key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    issues.push(issue);
  };

  if (/<\/?[a-zA-Z][^>]*>/.test(source)) add({ code: "html_not_allowed" }, "html");
  for (const match of source.matchAll(VARIABLE_PATTERN)) {
    const variable = match[1];
    if (!ALLOWED_VARIABLES.has(variable)) add({ code: "unknown_variable", variable }, `variable:${variable}`);
  }

  const isolateStack: number[] = [];
  for (const character of source) {
    const codePoint = character.codePointAt(0) ?? 0;
    const label = `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
    if (BIDI_OVERRIDES.has(codePoint)) add({ code: "bidi_override_not_allowed", codePoint: label }, `bidi:${label}`);
    if (BIDI_OPEN_TO_CLOSE.has(codePoint)) isolateStack.push(codePoint);
    else if (codePoint === 0x2069) {
      if (isolateStack.length === 0) add({ code: "unpaired_bidi_isolate", codePoint: label }, `isolate:${label}:close`);
      else isolateStack.pop();
    }
    const allowedWhitespace = codePoint === 0x0009 || codePoint === 0x000a || codePoint === 0x000d;
    if ((codePoint < 0x0020 && !allowedWhitespace) || (codePoint >= 0x007f && codePoint <= 0x009f)) {
      add({ code: "forbidden_control", codePoint: label }, `control:${label}`);
    }
  }
  isolateStack.forEach((codePoint, index) => {
    const label = `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
    add({ code: "unpaired_bidi_isolate", codePoint: label }, `isolate:${label}:open:${index}`);
  });
  return issues;
}

export class DeclarationRenderError extends Error {
  readonly missingVariables: string[];

  constructor(missingVariables: string[]) {
    super(`Missing declaration variables: ${missingVariables.join(", ")}`);
    this.name = "DeclarationRenderError";
    this.missingVariables = missingVariables;
  }
}

export function renderDeclarationText(source: string, variables: DeclarationVariables): string {
  const missing = new Set<string>();
  const rendered = source.replace(VARIABLE_PATTERN, (_token, variable: string) => {
    const value = variables[variable as keyof DeclarationVariables];
    if (value === undefined || value === null || value === "") {
      missing.add(variable);
      return "";
    }
    return String(value);
  });
  if (missing.size > 0) throw new DeclarationRenderError([...missing].sort());
  return rendered.normalize("NFC");
}

function canonicalize(value: unknown): unknown {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function buildDeclarationCanonicalPayload(
  input: DeclarationCanonicalPayloadInput,
): DeclarationCanonicalPayloadInput {
  return canonicalize(input) as DeclarationCanonicalPayloadInput;
}

export function stringifyDeclarationCanonicalPayload(input: DeclarationCanonicalPayloadInput): string {
  return JSON.stringify(buildDeclarationCanonicalPayload(input));
}
