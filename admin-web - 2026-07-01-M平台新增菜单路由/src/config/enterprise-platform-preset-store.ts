/**
 * 企业级（M 平台）平台预设存储
 */
import { createPlatformPresetStore } from "./platform-preset-store-factory";

const enterprise = createPlatformPresetStore("menusifu:enterprise-platform-preset-v1");

export const {
  getStoreRevision,
  readStoreSnapshot,
  getPlatformPresetStore,
  readSelectedBusinessTypeId,
  writeSelectedBusinessTypeId,
  listCustomBusinessTypes,
  upsertCustomBusinessType,
  deleteCustomBusinessType,
  getPublishedSnapshot,
  getEffectivePresetSnapshot,
  getDefaultPresetSnapshot,
  countPublishedLinesForBusinessType,
  getOrCreateDraftSelection,
  publishPlatformPresetSnapshot,
  countRecommendedLevel1,
  countEnabledSettings,
  countRecommendedSettings,
  getChangelogForCombo,
  getChangelogForBusinessType,
  restoreBusinessRecommendationDefaults,
} = enterprise;
