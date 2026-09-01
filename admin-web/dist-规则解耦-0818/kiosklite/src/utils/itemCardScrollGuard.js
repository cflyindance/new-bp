let scrollDebounceTimer = null;
let clicksBlockedByScroll = false;

/** 滚动停止后多久内仍禁止卡片主点击（防抖，每次滚动重置计时） */
const SCROLL_CLICK_QUIET_MS = 200;

export function notifyItemCardListScroll() {
  clicksBlockedByScroll = true;
  if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
  scrollDebounceTimer = setTimeout(() => {
    clicksBlockedByScroll = false;
    scrollDebounceTimer = null;
  }, SCROLL_CLICK_QUIET_MS);
}

export function isItemCardClickBlockedAfterScroll() {
  return clicksBlockedByScroll;
}
