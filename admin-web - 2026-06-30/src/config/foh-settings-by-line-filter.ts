/**
 * 前厅 · 按产线视图：产线上下文与配置块可见性（无 toggle-ui 依赖，避免循环引用）
 */
import type { FohLineNavId } from "./foh-settings-line-scope";

let fohByLineRenderLineId: FohLineNavId | null = null;

export function setFohByLineRenderContext(lineId: FohLineNavId | null): void {
  fohByLineRenderLineId = lineId;
}

export function getFohByLineRenderContext(): FohLineNavId | null {
  return fohByLineRenderLineId;
}

export function getActiveFohByLineIdFromDom(): FohLineNavId | null {
  const raw = document.querySelector("[data-foh-by-line-view]")?.getAttribute("data-foh-by-line-view");
  if (!raw) return null;
  return raw as FohLineNavId;
}

/** 按产线视图：当前应展示的产线（渲染期用 context，挂载后用 DOM） */
export function getFohActiveLineFilterId(): FohLineNavId | null {
  if (fohByLineRenderLineId) return fohByLineRenderLineId;
  return getActiveFohByLineIdFromDom();
}

/** 按产线子配置块是否可见：按产线视图仅当前产线；场景视图按多选勾选 */
export function isFohLineConfigRowVisible(
  rowLineId: string,
  enabledInMultiselect = true,
): boolean {
  const active = getFohActiveLineFilterId();
  if (active) return rowLineId === active;
  return enabledInMultiselect;
}

export const FOH_LINE_CONFIG_ROW_ATTR = "data-foh-line-config-row";

export function isFohByLinePanelSuppressed(): boolean {
  return getActiveFohByLineIdFromDom() !== null;
}
