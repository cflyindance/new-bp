//#region source-snapshot/src/utils/preserveOrderItemIds.js
var key = (value) => String(value ?? "");
var list = (value) => Array.isArray(value) ? value : [];
var sections = (item) => list(item.comboOrderDetails?.comboSections);
var optionKeys = (options) => list(options).map((option) => JSON.stringify([
	key(option.optionId),
	key(option.subOptionId),
	option.optionType,
	key(option.quantity ?? 1),
	option.optionType === "NOTE" ? option.optionName : "",
	optionKeys(option.subOptions)
])).sort();
var selectionKey = (item) => JSON.stringify([
	key(item.saleItemId),
	key(item.crmIntegrationSizeId ?? item.sizeId ?? item.sizeID),
	optionKeys(item.options),
	!!item.comboOrderDetails
]);
var contentKey = (item) => JSON.stringify([
	selectionKey(item),
	key(item.quantity ?? 1),
	sections(item).map((section) => JSON.stringify([key(section.id), list(section.orderItems).map(contentKey).sort()])).sort()
]);
var compatible = (item, saved) => key(item.saleItemId) !== "" && key(item.saleItemId) === key(saved.saleItemId) && (!key(item.id) || key(item.id) === key(saved.id)) && (!key(item.uniqueItemTempId) || !key(saved.uniqueItemTempId) || key(item.uniqueItemTempId) === key(saved.uniqueItemTempId));
/**
* Add persisted row IDs to a newly generated resave payload, in place.
* Never mutate the saved response or copy its prices/payment state.
*/
function preserveOrderItemIds(orderItems, savedOrderItems) {
	const usedIds = /* @__PURE__ */ new Set();
	const matchItems = (items, savedItems) => {
		const pending = new Set(list(items));
		const available = list(savedItems).filter((saved) => key(saved.id));
		const match = (matches, uniqueOnly) => {
			for (const item of pending) {
				const candidates = available.filter((saved) => !usedIds.has(key(saved.id)) && compatible(item, saved) && matches(item, saved));
				if (!candidates.length) continue;
				const saved = candidates[0];
				if (uniqueOnly && (candidates.length !== 1 || [...pending].filter((other) => compatible(other, saved) && matches(other, saved)).length !== 1)) continue;
				item.id = saved.id;
				usedIds.add(key(saved.id));
				pending.delete(item);
				for (const section of sections(item)) {
					const savedSections = sections(saved).filter((oldSection) => key(section.id) === key(oldSection.id));
					if (key(section.id) && savedSections.length === 1) matchItems(section.orderItems, savedSections[0].orderItems);
				}
			}
		};
		match((item, saved) => !!key(item.id) || !!key(item.uniqueItemTempId) && key(item.uniqueItemTempId) === key(saved.uniqueItemTempId), true);
		match((item, saved) => contentKey(item) === contentKey(saved), false);
		match((item, saved) => selectionKey(item) === selectionKey(saved), true);
	};
	matchItems(orderItems, savedOrderItems);
}
//#endregion
export { preserveOrderItemIds as t };
