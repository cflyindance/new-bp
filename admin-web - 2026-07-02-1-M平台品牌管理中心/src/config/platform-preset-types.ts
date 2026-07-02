/**
 * 平台预设 · 快照类型（无 store 依赖）
 */
import type { ProductLineId } from "./platform-preset-catalog";
import type { PlatformPresetNodeSelection } from "./platform-preset-node-selection";

export interface PlatformPresetSnapshot {
  businessTypeId: string;
  productLineId: ProductLineId;
  version: number;
  publishedAt: string;
  selection: Record<string, PlatformPresetNodeSelection>;
  /** 绑定的导航蓝图版本（M 平台同步后写入） */
  blueprintVersion?: number;
  /** 树结构版本（通常与 blueprintVersion 一致） */
  treeVersion?: number;
}

export interface PlatformPresetChangeLogEntry {
  id: string;
  businessTypeId: string;
  productLineId: ProductLineId;
  version: number;
  at: string;
  actor: string;
  summary: string;
  enabledAdded?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  enabledRemoved?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  displayAdded?: import("./platform-preset-changelog-diff").PresetChangeItem[];
  displayRemoved?: import("./platform-preset-changelog-diff").PresetChangeItem[];
}

export interface CustomBusinessType {
  id: string;
  label: string;
  moduleTiers?: Partial<Record<string, import("./platform-preset-catalog").BusinessTypeTier>>;
  createdAt: string;
}
