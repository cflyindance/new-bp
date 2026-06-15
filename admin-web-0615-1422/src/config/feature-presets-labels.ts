/**
 * 平台预设页 — L1/L2/L3 本地化标签（对齐 NAV_MODULES）
 */
import { pick } from "../i18n";
import { buildPresetNavTree } from "./feature-presets-nav-tree";
import { NAV_MODULES } from "./navigation";

const L1_LABEL = new Map<string, { zh: string; en: string }>();
const L2_LABEL = new Map<string, { zh: string; en: string }>();
const L3_LABEL = new Map<string, string>();

for (const mod of NAV_MODULES) {
  L1_LABEL.set(mod.id, { zh: mod.title, en: mod.titleEn });
  for (const child of mod.children) {
    L2_LABEL.set(child.id, {
      zh: child.title,
      en: child.titleEn ?? child.title,
    });
  }
}

for (const mod of buildPresetNavTree()) {
  for (const l2 of mod.children) {
    for (const group of l2.groups) {
      for (const leaf of group.leaves) {
        if (leaf.level === "l2") continue;
        L3_LABEL.set(leaf.id, leaf.label);
      }
    }
  }
}

export function getL1ModuleLabel(moduleId: string): string {
  const row = L1_LABEL.get(moduleId);
  if (!row) return moduleId;
  return pick(row.zh, row.en);
}

export function getL2FeatureLabel(featureId: string): string {
  const row = L2_LABEL.get(featureId);
  if (!row) return featureId;
  return pick(row.zh, row.en);
}

export function getL3FeatureLabel(featureId: string): string {
  return L3_LABEL.get(featureId) ?? featureId;
}

export function getL2ParentModuleLabel(featureId: string): string {
  for (const mod of NAV_MODULES) {
    if (mod.children.some((c) => c.id === featureId)) return getL1ModuleLabel(mod.id);
  }
  return "";
}

export function formatL1ExcludeLabels(moduleIds: string[]): string {
  if (moduleIds.length === 0) return "—";
  return moduleIds.map((id) => getL1ModuleLabel(id)).join(", ");
}

export function formatL2ExcludeLabels(featureIds: string[]): string {
  if (featureIds.length === 0) return "—";
  return featureIds.map((id) => getL2FeatureLabel(id)).join(", ");
}

export function formatL3ExcludeLabels(featureIds: string[]): string {
  if (featureIds.length === 0) return "—";
  return featureIds.map((id) => getL3FeatureLabel(id)).join(", ");
}

export function pickPresetTitle(zh: string, en: string): string {
  return pick(zh, en);
}
