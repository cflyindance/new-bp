/**

 * 平台预设编辑 — 导航树交互绑定（L1/L2/L3 勾选白名单，仅勾选才展示）

 */

import { t } from "../i18n";

import {

  bindPresetSettingLeafEvents,

  renderPresetSettingLeafCard,

} from "./feature-presets-admin-setting-render";

import type { PresetFeatureEntry } from "./feature-presets";

import type { FeatureTier } from "./feature-registry";

import type { PresetSettingConfig } from "./feature-presets-setting-config";

import { deserializeSettingConfigs, serializeSettingConfigs } from "./feature-presets-setting-config";

import {

  buildPresetNavTree,

  collectDescendantExcludeIds,

  type PresetNavGroup,

  type PresetNavL2Node,

  type PresetNavModuleNode,

} from "./feature-presets-nav-tree";

import {

  collectDescendantIdsForL2,
  collectLeafIdsForGroup,
  exportPresetSubtreeIncludes,

  resolvePresetSubtreeIncludeState,

} from "./feature-presets-subtree-includes";



export interface PresetEditorHandle {

  state: PresetExcludeState;

  applyRecommendedL1: (ids: Iterable<string>) => void;

}



export interface PresetExcludeState {

  l1Enabled: Set<string>;

  l2Enabled: Set<string>;

  l3Enabled: Set<string>;

  settingConfigs: Map<string, PresetSettingConfig>;

}



function escapeHtml(s: string): string {

  return s

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;");

}



function resolveInitialL1Enabled(initial: {

  features: PresetFeatureEntry[];

  excludes?: string[];

  includes?: string[];

}): Set<string> {

  const enabled = new Set(initial.features.map((f) => f.featureId));

  for (const id of initial.excludes ?? []) enabled.delete(id);

  for (const id of initial.includes ?? []) enabled.add(id);

  return enabled;

}



export function createPresetExcludeState(initial: {

  features: PresetFeatureEntry[];

  excludes?: string[];

  includes?: string[];

  l2Includes?: string[];

  l3Includes?: string[];

  l2Excludes?: string[];

  l3Excludes?: string[];

  settingConfigs?: Record<string, PresetSettingConfig>;

}): PresetExcludeState {

  const l1Enabled = resolveInitialL1Enabled(initial);

  const subtree = resolvePresetSubtreeIncludeState(l1Enabled, initial);

  return {

    l1Enabled,

    l2Enabled: subtree.l2Enabled,

    l3Enabled: subtree.l3Enabled,

    settingConfigs: deserializeSettingConfigs(initial.settingConfigs),

  };

}



export function exportPresetEditorState(state: PresetExcludeState): {

  features: PresetFeatureEntry[];

  excludes: string[];

  includes: string[];

  l2Includes: string[];

  l3Includes: string[];

  l2Excludes: string[];

  l3Excludes: string[];

  settingConfigs?: Record<string, PresetSettingConfig>;

} {

  const subtree = exportPresetSubtreeIncludes({

    l2Enabled: state.l2Enabled,

    l3Enabled: state.l3Enabled,

  });

  return {

    features: [...state.l1Enabled].map((featureId) => ({ featureId, tier: "recommended" as const })),

    excludes: [],

    includes: [],

    ...subtree,

    settingConfigs: serializeSettingConfigs(state.settingConfigs),

  };

}



export function exportPresetVariantEditorState(state: PresetExcludeState): {

  l2Includes: string[];

  l3Includes: string[];

  l2Excludes: string[];

  l3Excludes: string[];

  settingConfigs?: Record<string, PresetSettingConfig>;

} {

  const subtree = exportPresetSubtreeIncludes({

    l2Enabled: state.l2Enabled,

    l3Enabled: state.l3Enabled,

  });

  return {

    ...subtree,

    settingConfigs: serializeSettingConfigs(state.settingConfigs),

  };

}



function tierShortLabel(tier: FeatureTier): string {

  if (tier === "core") return t("featurePresets.tierCore");

  if (tier === "recommended") return t("featurePresets.tierRecommended");

  if (tier === "optional") return t("featurePresets.tierOptional");

  return t("featurePresets.tierAdvanced");

}



export function bindPresetNavTreeEditor(

  root: ParentNode,

  initial: {

    features: PresetFeatureEntry[];

    excludes?: string[];

    includes?: string[];

    l2Includes?: string[];

    l3Includes?: string[];

    l2Excludes?: string[];

    l3Excludes?: string[];

    settingConfigs?: Record<string, PresetSettingConfig>;

  },

  onChange?: () => void,

  options?: {

    recommendedL1?: Set<string>;

    businessTypeTiers?: Map<string, FeatureTier>;

  },

): PresetEditorHandle {

  const tree = buildPresetNavTree();

  const state = createPresetExcludeState(initial);

  const recommendedL1 = options?.recommendedL1 ?? new Set<string>();

  const businessTypeTiers = options?.businessTypeTiers ?? new Map<string, FeatureTier>();

  let selectedModuleId = tree[0]?.moduleId ?? "";

  let selectedL2Id = tree[0]?.children[0]?.id ?? "";

  let selectedGroupId = tree[0]?.children[0]?.groups[0]?.id ?? "";



  const l1El = root.querySelector<HTMLElement>("#preset-tree-l1");

  const l2El = root.querySelector<HTMLElement>("#preset-tree-l2");

  const l3El = root.querySelector<HTMLElement>("#preset-tree-l3");

  const l4El = root.querySelector<HTMLElement>("#preset-tree-l4");



  function getModule(): PresetNavModuleNode | undefined {

    return tree.find((m) => m.moduleId === selectedModuleId);

  }



  function getL2(): PresetNavL2Node | undefined {

    return getModule()?.children.find((c) => c.id === selectedL2Id);

  }



  function getGroup(): PresetNavGroup | undefined {

    return getL2()?.groups.find((g) => g.id === selectedGroupId);

  }



  function cascadeL1Enable(moduleId: string, enabled: boolean): void {

    const mod = tree.find((m) => m.moduleId === moduleId);

    if (!mod) return;

    if (enabled) {

      state.l1Enabled.add(moduleId);

      const desc = collectDescendantExcludeIds(mod);

      for (const id of desc.l2) state.l2Enabled.add(id);

      for (const id of desc.l3) state.l3Enabled.add(id);

    } else {

      state.l1Enabled.delete(moduleId);

      const desc = collectDescendantExcludeIds(mod);

      for (const id of desc.l2) state.l2Enabled.delete(id);

      for (const id of desc.l3) state.l3Enabled.delete(id);

    }

  }



  function cascadeL2Enable(l2: PresetNavL2Node, moduleId: string, enabled: boolean): void {

    if (enabled) {

      state.l1Enabled.add(moduleId);

      state.l2Enabled.add(l2.id);

      for (const id of collectDescendantIdsForL2(l2)) state.l3Enabled.add(id);

    } else {

      state.l2Enabled.delete(l2.id);

      for (const id of collectDescendantIdsForL2(l2)) state.l3Enabled.delete(id);

    }

  }



  function groupLeafIds(group: PresetNavGroup): string[] {

    return collectLeafIdsForGroup(group);

  }



  function isGroupFullyEnabled(group: PresetNavGroup): boolean {

    const ids = groupLeafIds(group);

    return ids.length > 0 && ids.every((id) => state.l3Enabled.has(id));

  }



  function isGroupPartiallyEnabled(group: PresetNavGroup): boolean {

    const ids = groupLeafIds(group);

    const on = ids.filter((id) => state.l3Enabled.has(id)).length;

    return on > 0 && on < ids.length;

  }



  function cascadeGroupEnable(group: PresetNavGroup, l2: PresetNavL2Node, moduleId: string, enabled: boolean): void {

    const leafIds = groupLeafIds(group);

    if (enabled) {

      state.l1Enabled.add(moduleId);

      state.l2Enabled.add(l2.id);

      for (const id of leafIds) state.l3Enabled.add(id);

    } else {

      for (const id of leafIds) state.l3Enabled.delete(id);

    }

  }



  function renderL4(): void {

    if (!l4El) return;

    const group = getGroup();

    const mod = getModule();

    const l2 = getL2();

    if (!group || !mod || !l2) {

      l4El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeSelectGroup"))}</p>`;

      return;

    }

    if (!state.l1Enabled.has(mod.moduleId) || !state.l2Enabled.has(l2.id)) {

      l4El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeL2Only"))}</p>`;

      return;

    }

    const leaves = group.leaves.filter((x) => x.level !== "l2");

    if (leaves.length === 0) {

      l4El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeNoLeaves"))}</p>`;

      return;

    }

    l4El.innerHTML = `<div class="space-y-2">${leaves

      .map((leaf) =>

        renderPresetSettingLeafCard(

          leaf.id,

          leaf.label,

          state.l3Enabled.has(leaf.id),

          state.settingConfigs.get(leaf.id),

        ),

      )

      .join("")}</div>`;



    l4El.querySelectorAll<HTMLInputElement>("[data-l3-enable]").forEach((input) => {

      input.addEventListener("change", () => {

        const id = input.dataset.l3Enable!;

        const l2Node = getL2();

        if (!l2Node || !mod) return;

        if (input.checked) {

          state.l3Enabled.add(id);

          state.l2Enabled.add(l2Node.id);

          state.l1Enabled.add(mod.moduleId);

        } else {

          state.l3Enabled.delete(id);

        }

        const panel = l4El?.querySelector(`[data-preset-setting-panel="${CSS.escape(id)}"]`);

        if (panel) {

          panel.classList.toggle("opacity-50", !input.checked);

          panel.classList.toggle("pointer-events-none", !input.checked);

        }

        onChange?.();

        renderL3();

      });

    });



    for (const leaf of leaves) {

      bindPresetSettingLeafEvents(l4El, leaf.id, (leafId, config) => {

        if (config) state.settingConfigs.set(leafId, config);

        else state.settingConfigs.delete(leafId);

        onChange?.();

      });

    }

  }



  function renderL3(): void {

    if (!l3El) return;

    const l2 = getL2();

    const mod = getModule();

    if (!l2 || !mod) {

      l3El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeSelectL3"))}</p>`;

      return;

    }

    if (!state.l1Enabled.has(mod.moduleId)) {

      l3El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeL1Disabled"))}</p>`;

      renderL4();

      return;

    }

    const selectableGroups = l2.groups.filter((g) => g.leaves.some((x) => x.level !== "l2"));

    if (selectableGroups.length === 0) {

      selectedGroupId = l2.groups[0]?.id ?? "";

      renderL4();

      l3El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeL2Only"))}</p>`;

      return;

    }

    const rowDisabled = !state.l2Enabled.has(l2.id);

    l3El.innerHTML = selectableGroups

      .map((group) => {

        const active = group.id === selectedGroupId ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50";

        const checked = !rowDisabled && isGroupFullyEnabled(group);

        const partial = !rowDisabled && !checked && isGroupPartiallyEnabled(group);

        return `

        <div class="flex items-center gap-1 rounded-md px-1 py-0.5 ${active}">

          <input type="checkbox" class="rounded border-border" data-l3-group-enable="${escapeHtml(group.id)}" ${checked ? "checked" : ""} ${partial ? 'data-partial="1"' : ""} ${rowDisabled ? "disabled" : ""} title="${escapeHtml(t("featurePresets.treeL3GroupEnableHint"))}" />

          <button type="button" class="min-w-0 flex-1 truncate px-1 py-1 text-left text-sm" data-group-id="${escapeHtml(group.id)}">${escapeHtml(group.label)}</button>

        </div>`;

      })

      .join("");



    l3El.querySelectorAll<HTMLInputElement>("[data-l3-group-enable]").forEach((input) => {

      if (input.dataset.partial === "1") input.indeterminate = true;

      input.addEventListener("change", () => {

        const group = selectableGroups.find((g) => g.id === input.dataset.l3GroupEnable);

        if (!group || !mod) return;

        cascadeGroupEnable(group, l2, mod.moduleId, input.checked);

        renderL3();

        renderL4();

        onChange?.();

      });

    });



    l3El.querySelectorAll<HTMLButtonElement>("[data-group-id]").forEach((btn) => {

      btn.addEventListener("click", () => {

        selectedGroupId = btn.dataset.groupId ?? "";

        renderL3();

        renderL4();

      });

    });

    renderL4();

  }



  function renderL2(): void {

    if (!l2El) return;

    const mod = getModule();

    if (!mod) {

      l2El.innerHTML = `<p class="text-xs text-muted-foreground">${escapeHtml(t("featurePresets.treeSelectL2"))}</p>`;

      return;

    }

    const moduleDisabled = !state.l1Enabled.has(mod.moduleId);



    l2El.innerHTML = mod.children

      .map((child) => {

        const active = child.id === selectedL2Id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50";

        const checked = !moduleDisabled && state.l2Enabled.has(child.id);

        return `

        <div class="flex items-center gap-1 rounded-md px-1 py-0.5 ${active}">

          <input type="checkbox" class="rounded border-border" data-l2-enable="${escapeHtml(child.id)}" ${checked ? "checked" : ""} ${moduleDisabled ? "disabled" : ""} title="${escapeHtml(t("featurePresets.treeL2EnableHint"))}" />

          <button type="button" class="min-w-0 flex-1 truncate px-1 py-1 text-left text-sm" data-l2-select="${escapeHtml(child.id)}">${escapeHtml(child.label)}</button>

        </div>`;

      })

      .join("");



    l2El.querySelectorAll<HTMLInputElement>("[data-l2-enable]").forEach((input) => {

      input.addEventListener("change", () => {

        const l2 = mod.children.find((c) => c.id === input.dataset.l2Enable);

        if (!l2) return;

        cascadeL2Enable(l2, mod.moduleId, input.checked);

        renderAll();

        onChange?.();

      });

    });



    l2El.querySelectorAll<HTMLButtonElement>("[data-l2-select]").forEach((btn) => {

      btn.addEventListener("click", () => {

        selectedL2Id = btn.dataset.l2Select ?? "";

        const l2 = getL2();

        selectedGroupId = l2?.groups[0]?.id ?? "";

        renderL2();

        renderL3();

      });

    });

    renderL3();

  }



  function renderL1(): void {

    if (!l1El) return;

    l1El.innerHTML = tree

      .map((mod) => {

        const active = mod.moduleId === selectedModuleId ? "bg-primary/10 font-medium text-primary" : "";

        const enabled = state.l1Enabled.has(mod.moduleId);

        const isRec = recommendedL1.has(mod.moduleId);

        const btTier = businessTypeTiers.get(mod.moduleId);

        const tierBadge = btTier

          ? `<span class="ml-1 shrink-0 rounded px-1 py-px text-[10px] ${isRec ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}">${escapeHtml(tierShortLabel(btTier))}</span>`

          : isRec

            ? `<span class="ml-1 shrink-0 rounded bg-primary/10 px-1 py-px text-[10px] text-primary">${escapeHtml(t("featurePresets.recBadge"))}</span>`

            : "";

        return `

        <div class="flex items-center gap-1 rounded-md px-1 py-0.5 ${active}">

          <input type="checkbox" class="rounded border-border" data-l1-enable="${escapeHtml(mod.moduleId)}" ${enabled ? "checked" : ""} title="${escapeHtml(t("featurePresets.treeL1EnableHint"))}" />

          <button type="button" data-module-id="${escapeHtml(mod.moduleId)}"

            class="flex min-w-0 flex-1 items-center truncate rounded-md px-1 py-1.5 text-left text-sm hover:bg-muted/50">

            <span class="truncate">${escapeHtml(mod.label)}</span>${tierBadge}

          </button>

        </div>`;

      })

      .join("");



    l1El.querySelectorAll<HTMLInputElement>("[data-l1-enable]").forEach((input) => {

      input.addEventListener("change", () => {

        const moduleId = input.dataset.l1Enable;

        if (!moduleId) return;

        cascadeL1Enable(moduleId, input.checked);

        renderAll();

        onChange?.();

      });

    });



    l1El.querySelectorAll<HTMLButtonElement>("[data-module-id]").forEach((btn) => {

      btn.addEventListener("click", () => {

        selectedModuleId = btn.dataset.moduleId ?? "";

        const mod = getModule();

        selectedL2Id = mod?.children[0]?.id ?? "";

        selectedGroupId = mod?.children[0]?.groups[0]?.id ?? "";

        renderAll();

      });

    });

  }



  function renderAll(): void {

    renderL1();

    renderL2();

  }



  function applyRecommendedL1(ids: Iterable<string>): void {

    const next = new Set(ids);

    for (const mod of tree) {

      if (next.has(mod.moduleId)) {

        cascadeL1Enable(mod.moduleId, true);

      } else {

        cascadeL1Enable(mod.moduleId, false);

      }

    }

    renderAll();

    onChange?.();

  }



  renderAll();

  return { state, applyRecommendedL1 };

}


