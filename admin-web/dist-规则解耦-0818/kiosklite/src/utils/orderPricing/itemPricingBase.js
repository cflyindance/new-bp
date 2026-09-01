/**
 * DP 开启时 itemPriceDetail 含 itemSubtotalDP，整单/税/加收等计价以之为基数；否则为基础菜价 itemSubtotal。
 */
export function getItemPricingSubtotal(itemPriceDetail) {
  if (!itemPriceDetail) {
    return 0;
  }
  if (itemPriceDetail.itemSubtotalDP != null) {
    return itemPriceDetail.itemSubtotalDP;
  }
  return itemPriceDetail.itemSubtotal;
}
