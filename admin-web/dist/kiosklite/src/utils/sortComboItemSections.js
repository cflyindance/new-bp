/**
 * 自选套餐 comboSections / comboSectionSaleItems 排序，与 getCurrentItem 主菜单逻辑一致
 */
export default function sortComboItemSections(item) {
  if (!item || item.itemType !== 'COMBO_SALE_ITEM' || !item.comboSections?.length) {
    return item;
  }
  const tempItem = Object.assign({}, item);
  tempItem.comboSections = [...item.comboSections]
    .sort((section1, section2) => section1.sectionSequence - section2.sectionSequence)
    .map((section) => {
      if (!section.comboSectionSaleItems) return section;
      return {
        ...section,
        comboSectionSaleItems: [...section.comboSectionSaleItems].sort(
          (item1, item2) => item1.displayPriority - item2.displayPriority
        ),
      };
    });
  return tempItem;
}
