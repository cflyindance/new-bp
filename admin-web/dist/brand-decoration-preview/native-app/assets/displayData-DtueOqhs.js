import { d as __toESM } from "./toast-C8a1ReSo.js";
import { G as require_dayjs_min } from "./utils-Cdx9DbDR.js";
import { Qi as Big, Sc as SET_PAYMENT_MEMBER_POINTS_ESTIMATE, Vn as getCampaignViaType } from "./actions-BwRPwnFF.js";
import { n as getValidCategoryList } from "./getStandardCateDish-BKfAMpZF.js";
import { t as crmIntegration } from "./crm-integration-DyFhn08j.js";
//#region source-snapshot/src/container/paymentMember/displayData.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var asPoints = (value) => {
	if (value == null || value === "") return null;
	const points = Number(value);
	return Number.isFinite(points) && points >= 0 ? points : null;
};
async function getPaymentMemberEarnedPoints(order) {
	const points = asPoints(order?.point);
	if (points != null && points !== 0) return points;
	try {
		const discounts = typeof order.discountList === "string" ? JSON.parse(order.discountList) : order.discountList;
		const discount = (Array.isArray(discounts) ? discounts : []).filter((item) => !item.extraInfo?.isItemDetailDiscount && (item.type === "promotion" || !item.isReward)).reduce((total, item) => total.plus(item.amount ?? 0), Big(order.discount ?? 0).plus(order.rewardDiscount ?? 0));
		const totalPrice = asPoints(order.totalPrice);
		if (totalPrice == null || discount.lt(0)) return points;
		const body = (await crmIntegration.calculateWeakMemberPoints({
			totalPrice,
			discount: discount.toNumber()
		}))?.data;
		if (body?.success !== true || body.data?.eligible !== true) return points;
		return asPoints(body.data.points) ?? points;
	} catch (error) {
		return points;
	}
}
function getOrderEarnedPoints(order, estimate) {
	const points = asPoints(order?.point);
	if (points > 0) return points;
	return order?.id != null && estimate?.orderId === String(order.id) ? asPoints(estimate.points) ?? points : points;
}
function loadPaymentMemberEarnedPoints() {
	return async (dispatch, getState) => {
		const { saveOrderResult: order, paymentMemberPointsEstimate: estimate } = getState().currentOrder;
		if (!order?.id || asPoints(order.point) > 0) return;
		const orderId = String(order.id);
		if (estimate?.orderId === orderId) return;
		const request = {
			orderId,
			points: null,
			status: "pending"
		};
		dispatch({
			type: SET_PAYMENT_MEMBER_POINTS_ESTIMATE,
			estimate: request
		});
		const points = await getPaymentMemberEarnedPoints(order);
		if (getState().currentOrder.paymentMemberPointsEstimate !== request) return;
		dispatch({
			type: SET_PAYMENT_MEMBER_POINTS_ESTIMATE,
			estimate: {
				orderId,
				points,
				status: "done"
			}
		});
	};
}
function getPaymentMemberCouponCount(vouchers, { menuGroup = [], comboMenu = [], orderType, merchantId } = {}) {
	if (!Array.isArray(vouchers)) return null;
	const available = vouchers.filter((voucher) => {
		const rule = voucher.rewardRule;
		const template = rule?.couponTemplate;
		const end = voucher.useEndTime || rule?.useEndTime;
		return Number.isFinite(Number(voucher.count)) && Number(voucher.count) > 0 && template?.productLine?.includes("KIOSK") && (!template.validMerchantIds?.length || template.validMerchantIds.includes(merchantId)) && (!end || (0, import_dayjs_min.default)(end).isValid() && !(0, import_dayjs_min.default)(end).isBefore((0, import_dayjs_min.default)()));
	});
	if (!available.length) return 0;
	const comboMenuIds = comboMenu.map((item) => item.saleItemId);
	const pureSaleItems = menuGroup.filter((group) => !group.isFreeItemMenu && group.id !== "promotion-deals-list").map((group) => ({
		...group,
		menuCategories: group.menuCategories?.map((category) => ({
			...category,
			saleItems: category.saleItems?.filter((item) => !(comboMenuIds.includes(item.id) && item.itemPrices?.length > 0 && item.itemPrices.every((price) => price.type.toUpperCase() === "ALL")))
		}))
	}));
	const itemResources = orderType ? getValidCategoryList(pureSaleItems, orderType, false).flatMap((category) => category.saleItems).filter(Boolean) : [];
	return available.reduce((count, voucher) => {
		return count + (getCampaignViaType({
			campaigns: [voucher.rewardRule],
			types: [
				"giftItemCoupon",
				"discountCoupon",
				"voucher",
				"orderItemFixedPriceCoupon",
				"quantityItemDiscountCoupon"
			],
			source: "voucher",
			itemResources,
			orderType,
			merchantId
		}).length > 0 ? Number(voucher.count) : 0);
	}, 0);
}
function getPaymentMemberDisplayData({ query, customer, order, member, rewards, couponCount = null, estimatedPoints = null } = {}) {
	const weakMember = query?.results?.find((item) => item?.weakMember)?.weakMember;
	const historicalPoints = asPoints(weakMember?.totalPoint);
	const accountPoints = asPoints(member ? member.pointBalance : customer?.point);
	const earnedPoints = asPoints(order?.point) > 0 ? asPoints(order?.point) : asPoints(estimatedPoints) ?? asPoints(order?.point);
	const pointBalance = accountPoints == null ? null : accountPoints + (historicalPoints ?? 0) + (earnedPoints ?? 0);
	const tiers = /* @__PURE__ */ new Map();
	(Array.isArray(rewards) ? rewards : []).forEach((reward) => {
		const points = asPoints(reward.redeemRule?.parameters?.point);
		if (reward.type === "reward" && reward.couponTemplate?.productLine?.includes("KIOSK") && points > 0 && !tiers.has(points)) tiers.set(points, reward);
	});
	const pointTiers = Array.from(tiers.keys()).sort((a, b) => a - b);
	const maxPoints = pointTiers[pointTiers.length - 1];
	const nextPoints = pointBalance == null ? null : pointTiers.find((points) => points > pointBalance);
	let progressPercent = null;
	if (pointBalance != null && maxPoints) {
		const nextTierIndex = pointTiers.indexOf(nextPoints);
		const previousPoints = pointTiers[nextTierIndex - 1] ?? 0;
		progressPercent = nextTierIndex === -1 ? 100 : (nextTierIndex + (pointBalance - previousPoints) / (nextPoints - previousPoints)) / pointTiers.length * 100;
	}
	const reward = nextPoints == null ? null : tiers.get(nextPoints);
	const rewardCondition = reward?.couponTemplate?.ruleExpression?.condition;
	return {
		historicalPoints,
		pointBalance,
		earnedPoints,
		couponCount,
		pointTiers,
		progressPercent,
		pointsToRedeem: nextPoints == null ? null : nextPoints - pointBalance,
		reward,
		rewardTitle: reward?.couponTemplate?.templateName || reward?.name || "",
		rewardMinSpend: rewardCondition ? asPoints(rewardCondition.totalAmount ?? 0) : null
	};
}
//#endregion
export { loadPaymentMemberEarnedPoints as i, getPaymentMemberCouponCount as n, getPaymentMemberDisplayData as r, getOrderEarnedPoints as t };
