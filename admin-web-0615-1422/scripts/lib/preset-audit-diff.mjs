/**

 * 平台预设覆盖 — 前后快照 diff（API 审计用）

 */



function diffStringArrays(before = [], after = []) {

  const bSet = new Set(before);

  const aSet = new Set(after);

  return {

    added: after.filter((x) => !bSet.has(x)),

    removed: before.filter((x) => !aSet.has(x)),

  };

}



function resolveL1FeatureIds(snapshot = {}) {

  const ids = new Set((snapshot.features ?? []).map((f) => f.featureId));

  for (const id of snapshot.includes ?? []) ids.add(id);

  for (const id of snapshot.excludes ?? []) ids.delete(id);

  return [...ids].sort();

}



function stableJson(value) {

  try {

    return JSON.stringify(value ?? null);

  } catch {

    return String(value);

  }

}



function diffSettingConfigs(before = {}, after = {}) {

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  const added = [];

  const removed = [];

  const changed = [];

  for (const id of keys) {

    const b = before[id];

    const a = after[id];

    if (b == null && a != null) added.push(id);

    else if (b != null && a == null) removed.push(id);

    else if (b != null && a != null && stableJson(b) !== stableJson(a)) {

      changed.push({ id, before: b, after: a });

    }

  }

  return { added, removed, changed };

}



export function diffPresetOverrideSnapshot(before = {}, after = {}) {

  const l1 = diffStringArrays(resolveL1FeatureIds(before), resolveL1FeatureIds(after));

  const l2 = diffStringArrays(before.l2Excludes ?? [], after.l2Excludes ?? []);

  const l3 = diffStringArrays(before.l3Excludes ?? [], after.l3Excludes ?? []);

  const settings = diffSettingConfigs(before.settingConfigs ?? {}, after.settingConfigs ?? {});

  return {

    l1Added: l1.added,

    l1Removed: l1.removed,

    l2Added: l2.added,

    l2Removed: l2.removed,

    l3Added: l3.added,

    l3Removed: l3.removed,

    settingsAdded: settings.added,

    settingsRemoved: settings.removed,

    settingsChanged: settings.changed,

  };

}



export function isEmptyPresetChangeSet(changes) {

  if (!changes) return true;

  return (

    (changes.l1Added?.length ?? 0) === 0 &&

    (changes.l1Removed?.length ?? 0) === 0 &&

    (changes.l2Added?.length ?? 0) === 0 &&

    (changes.l2Removed?.length ?? 0) === 0 &&

    (changes.l3Added?.length ?? 0) === 0 &&

    (changes.l3Removed?.length ?? 0) === 0 &&

    (changes.settingsAdded?.length ?? 0) === 0 &&

    (changes.settingsRemoved?.length ?? 0) === 0 &&

    (changes.settingsChanged?.length ?? 0) === 0

  );

}



export function mergeVariantEffectiveState(seedVariant, override = {}) {

  return {

    features:

      override.features !== undefined

        ? override.features

        : seedVariant?.features?.map((f) => ({ ...f })),

    excludes: Array.isArray(override.excludes) ? override.excludes : (seedVariant?.excludes ?? []),

    includes: Array.isArray(override.includes) ? override.includes : (seedVariant?.includes ?? []),

    l2Includes: Array.isArray(override.l2Includes)

      ? override.l2Includes

      : (seedVariant?.l2Includes ?? []),

    l3Includes: Array.isArray(override.l3Includes)

      ? override.l3Includes

      : (seedVariant?.l3Includes ?? []),

    l2Excludes: Array.isArray(override.l2Excludes)

      ? override.l2Excludes

      : (seedVariant?.l2Excludes ?? []),

    l3Excludes: Array.isArray(override.l3Excludes)

      ? override.l3Excludes

      : (seedVariant?.l3Excludes ?? []),

    settingConfigs:

      override.settingConfigs && typeof override.settingConfigs === "object"

        ? override.settingConfigs

        : (seedVariant?.settingConfigs ?? {}),

  };

}

