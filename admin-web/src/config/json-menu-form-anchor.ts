export const JSON_MENU_FORM_SECTIONS = ["basic", "page", "localization", "status", "extra"] as const;
export type JsonMenuFormSection = (typeof JSON_MENU_FORM_SECTIONS)[number];

export function resolveActiveJsonMenuFormSection(
  sectionTops: Record<JsonMenuFormSection, number>,
  threshold: number,
  atBottom = false,
): JsonMenuFormSection {
  if (atBottom) return "extra";
  let active: JsonMenuFormSection = "basic";
  for (const section of JSON_MENU_FORM_SECTIONS) {
    if (sectionTops[section] <= threshold) active = section;
  }
  return active;
}
