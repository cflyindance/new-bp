/**
 * 购物车后续流程：若开启就餐人数选择，则先进入人数选择页
 * @returns {boolean} 是否已跳转
 */
export function navigatePartySizeIfNeeded(history, selfConfig) {
  if (selfConfig?.configMap?.id_62) {
    history.push('./partySizeSelection');
    return true;
  }
  return false;
}
