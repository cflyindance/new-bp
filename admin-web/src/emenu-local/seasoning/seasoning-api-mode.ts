export type SeasoningApiMode = "http" | "browser";

type ConfiguredSeasoningApiMode = SeasoningApiMode | "auto" | undefined;

export function resolveSeasoningApiMode(
  configuredMode: string | undefined,
  hostname: string,
): SeasoningApiMode {
  const normalized = configuredMode?.trim().toLowerCase() as ConfiguredSeasoningApiMode | "";
  if (normalized === "http" || normalized === "browser") return normalized;
  if (normalized && normalized !== "auto") {
    throw new Error(`invalid_emenu_seasoning_mode:${configuredMode}`);
  }
  return hostname.toLowerCase().endsWith(".github.io") ? "browser" : "http";
}
