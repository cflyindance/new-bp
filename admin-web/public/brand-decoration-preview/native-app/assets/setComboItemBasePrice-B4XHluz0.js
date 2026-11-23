//#region source-snapshot/src/utils/setComboItemBasePrice.js
function setComboItemBasePrice(item, price, isFree = false) {
	item.isComboBaseFree = isFree;
	const size = item.selectedOptionList?.find((section) => section.id === -1);
	if (size?.sizeInfo) {
		item.price = 0;
		size.sizeInfo.price = price;
	} else item.price = price;
}
//#endregion
export { setComboItemBasePrice as t };
