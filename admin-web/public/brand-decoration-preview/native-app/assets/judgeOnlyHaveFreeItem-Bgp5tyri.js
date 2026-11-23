import { t as native_store_default } from "./native-store-B_9Z_F59.js";
//#region source-snapshot/src/utils/judgeOnlyHaveFreeItem.js
var judgeOnlyHaveFreeItem = () => {
	const { crm: { selectedFreeItem }, currentOrder: { itemList } } = native_store_default.getState();
	if (itemList.length === 0) return selectedFreeItem.length > 0;
	return itemList.every((item) => Boolean(item?.isFreeItem));
};
//#endregion
export { judgeOnlyHaveFreeItem as t };
