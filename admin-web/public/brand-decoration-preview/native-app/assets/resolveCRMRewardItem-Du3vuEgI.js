import { d as __toESM } from "./toast-C8a1ReSo.js";
import { da as require_cloneDeep } from "./actions-BwRPwnFF.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { t as require_omit } from "./omit-DznhFjWg.js";
//#region source-snapshot/src/utils/CRMIntegration/resolveCRMRewardItem.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
var import_omit = /* @__PURE__ */ __toESM(require_omit());
var getCRMCampaignId = (campaign) => {
	const id = campaign?.ruleId ?? campaign?.crmIntegrationRule?.coupon?.ruleId ?? campaign?.campaignId ?? campaign?._id ?? campaign?.crmCampaignRewardInfo?._id;
	return id == null || id === "" ? void 0 : String(id);
};
var removeSDKItemIdentity = (item) => (0, import_omit.default)(item, ["uniqueItemTempId", "isFromCurrentOrderItemList"]);
var removeCRMCampaignItems = (items, campaignId) => {
	if (typeof campaignId !== "string" && typeof campaignId !== "number" || campaignId === "") return items;
	return items.filter((item) => !item.campaignRewardItem || getCRMCampaignId(item) !== String(campaignId));
};
var mapCRMDiscountItems = ({ orderItems = [], orderDiscountInfo, items = [] }) => {
	if (!Array.isArray(items)) return [];
	return items.map((each) => {
		const rewardItem = orderItems.find((orderItem) => orderItem.id === each.uniqueItemTempId);
		if (!rewardItem) return each;
		const crmCampaignRewardInfo = {
			orderDiscountInfo,
			itemDiscountInfo: rewardItem.discounts,
			isCRMIntegrationDiscountItem: true
		};
		return {
			...each,
			...crmCampaignRewardInfo,
			crmCampaignRewardInfo: {
				...crmCampaignRewardInfo,
				uniqueItemTempId: each.uniqueItemTempId
			}
		};
	});
};
var splitCampaignItemByRewardQuantity = (item, sdkQuantity, rule, rewardInfo) => {
	const quantity = Number(sdkQuantity);
	const itemQuantity = Number(item.quantity);
	const rewardQuantity = Number.isInteger(quantity) && quantity > 0 && quantity <= itemQuantity ? quantity : 1;
	const rewardItem = {
		...rule,
		...item,
		...rewardInfo,
		quantity: rewardQuantity
	};
	if (rewardQuantity === itemQuantity) {
		rewardItem.crmCampaignRewardInfo = {
			...rewardInfo,
			uniqueItemTempId: item.uniqueItemTempId
		};
		return [rewardItem];
	}
	return [{
		...item,
		quantity: itemQuantity - rewardQuantity
	}, rewardItem];
};
var clearCampaignDiscountInfo = (item) => {
	if (!item.isCRMIntegrationBundleDiscountItem && !item.isCRMIntegrationSpecialItem) return item;
	const normalItem = { ...item };
	[
		"actualDiscount",
		"orderDiscountInfo",
		"itemDiscountInfo",
		"isCRMIntegrationBundleDiscountItem",
		"isCRMIntegrationSpecialItem",
		"campaignRewardItem",
		"crmCampaignRewardInfo",
		"crmIntegrationRule",
		"formattedOrder",
		"rewardRule",
		"redeemRule",
		"couponItemList",
		"couponTemplate",
		"ruleId",
		"_id",
		"campaignId",
		"rewardType",
		"itemPoints",
		"isSatisfyMinSpend"
	].forEach((key) => delete normalItem[key]);
	return normalItem;
};
var comparableItem = (item) => {
	const normalized = (0, import_cloneDeep.default)((0, import_omit.default)(item, [
		"quantity",
		"sequence",
		"totalPrice",
		"tempId",
		"secondHalfInfo",
		"uniqueItemTempId",
		"isFromCurrentOrderItemList"
	]));
	if (normalized.itemType !== "SALE_ITEM" && normalized.comboType !== "FIXED_SELECTION") normalized.sectionDetail?.forEach((section) => {
		if (section.id > 0 && section.items?.length) section.items.sort((a, b) => a.id_sizeId && b.id_sizeId ? a.id_sizeId - b.id_sizeId : 0);
	});
	return normalized;
};
var mergeReturnedCampaignItems = (items, returnedItems) => {
	if (!returnedItems.size) return [...items];
	const nodes = items.map((item) => ({
		item,
		active: true,
		normalized: item.campaignRewardItem ? null : comparableItem(item)
	}));
	const canIndexById = nodes.every(({ normalized }) => !normalized || normalized.id == null || ["number", "string"].includes(typeof normalized.id));
	const candidatesById = /* @__PURE__ */ new Map();
	const nodesByItem = /* @__PURE__ */ new Map();
	nodes.forEach((node) => {
		const references = nodesByItem.get(node.item) || [];
		references.push(node);
		nodesByItem.set(node.item, references);
		if (!node.normalized) return;
		const id = canIndexById ? node.normalized.id : void 0;
		const candidates = candidatesById.get(id) || [];
		candidates.push(node);
		candidatesById.set(id, candidates);
	});
	returnedItems.forEach((returnedItem) => {
		const source = nodesByItem.get(returnedItem)?.find((node) => node.active && node.item === returnedItem);
		if (!source) return;
		const id = canIndexById ? source.normalized.id : void 0;
		const target = candidatesById.get(id)?.find((candidate) => candidate.active && candidate.item !== returnedItem && (0, import_isEqual.default)(candidate.normalized, source.normalized));
		if (!target) return;
		target.item = {
			...target.item,
			quantity: Number(target.item.quantity) + Number(returnedItem.quantity)
		};
		source.active = false;
	});
	return nodes.filter((node) => node.active).map((node) => node.item);
};
var mapCRMBundleDiscountItems = ({ items, rule }) => {
	const calculatedOrder = rule.crmIntegrationRule.result?.[0]?.calculatedOrder;
	const orderItems = calculatedOrder?.orderItems || [];
	const orderDiscountInfo = calculatedOrder?.discounts;
	if (!orderItems.length) return removeCRMCampaignItems(items, getCRMCampaignId(rule));
	return items.flatMap((item) => {
		const normalItem = clearCampaignDiscountInfo(item);
		const rewardItem = orderItems.find((orderItem) => orderItem.id === item.uniqueItemTempId && orderItem.discounts?.length > 0);
		if (!rewardItem) return [removeSDKItemIdentity(normalItem)];
		const rewardInfo = {
			actualDiscount: rewardItem.discounts[0].amount,
			orderDiscountInfo,
			itemDiscountInfo: rewardItem.discounts,
			isCRMIntegrationBundleDiscountItem: true,
			campaignRewardItem: true
		};
		return splitCampaignItemByRewardQuantity(normalItem, rewardItem.quantity, rule, rewardInfo).map((row) => row.campaignRewardItem ? row : removeSDKItemIdentity(row));
	});
};
var SPECIAL_COUPON_FIELDS = [
	"displayName",
	"type",
	"status",
	"createdTime",
	"ruleTemplateId",
	"couponTemplateId",
	"ruleType"
];
var mapCRMSpecialDiscountItems = ({ items, rule, originalItemsByTempId = /* @__PURE__ */ new Map() }) => {
	const calculatedOrder = rule.crmIntegrationRule.result?.[0]?.calculatedOrder;
	const orderItems = Array.isArray(calculatedOrder?.orderItems) ? calculatedOrder.orderItems : [];
	if (!orderItems.length) return removeCRMCampaignItems(items, getCRMCampaignId(rule));
	const mappedItems = items.flatMap((item) => {
		let normalItem = clearCampaignDiscountInfo(item);
		if (item.campaignRewardItem && item.isCRMIntegrationSpecialItem) normalItem = {
			...(0, import_omit.default)(normalItem, SPECIAL_COUPON_FIELDS),
			...item.crmCampaignRewardInfo?.specialOriginalFields
		};
		const rewardItem = orderItems.find((orderItem) => orderItem.id === item.uniqueItemTempId && orderItem.discounts?.length > 0);
		if (!rewardItem) return [normalItem];
		const rewardInfo = {
			actualDiscount: rewardItem.discounts[0].amount ?? item.actualDiscount ?? 0,
			isCRMIntegrationSpecialItem: true,
			campaignRewardItem: true,
			_id: getCRMCampaignId(rule),
			orderDiscountInfo: calculatedOrder.discounts,
			itemDiscountInfo: rewardItem.discounts
		};
		const specialOriginalFields = {};
		SPECIAL_COUPON_FIELDS.forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(normalItem, key)) specialOriginalFields[key] = normalItem[key];
		});
		return splitCampaignItemByRewardQuantity(normalItem, rewardItem.quantity, rule, rewardInfo).map((row) => row.campaignRewardItem ? {
			...row,
			crmCampaignRewardInfo: {
				...row.crmCampaignRewardInfo,
				specialOriginalFields
			}
		} : row);
	});
	const returnedItems = /* @__PURE__ */ new Set();
	return mergeReturnedCampaignItems(mappedItems.map((item) => {
		if (item.campaignRewardItem && getCRMCampaignId(item) === getCRMCampaignId(rule)) return item;
		const originalItem = originalItemsByTempId.get(item.uniqueItemTempId);
		const sourceItem = originalItem || items.find((source) => source.uniqueItemTempId === item.uniqueItemTempId);
		if (!item.campaignRewardItem && sourceItem?.isCRMIntegrationSpecialItem && sourceItem.campaignRewardItem && getCRMCampaignId(sourceItem) === getCRMCampaignId(rule)) {
			const returnedItem = (0, import_omit.default)(item, ["uniqueItemTempId", "isFromCurrentOrderItemList"]);
			returnedItems.add(returnedItem);
			return returnedItem;
		}
		if (!originalItem) return item;
		const restoredItem = { ...item };
		["uniqueItemTempId", "isFromCurrentOrderItemList"].forEach((key) => {
			if (Object.prototype.hasOwnProperty.call(originalItem, key)) restoredItem[key] = originalItem[key];
			else delete restoredItem[key];
		});
		return restoredItem;
	}), returnedItems);
};
//#endregion
export { removeCRMCampaignItems as a, mapCRMSpecialDiscountItems as i, mapCRMBundleDiscountItems as n, mapCRMDiscountItems as r, getCRMCampaignId as t };
