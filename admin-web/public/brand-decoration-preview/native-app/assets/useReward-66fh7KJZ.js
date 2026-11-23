import { d as __toESM, i as require_react } from "./toast-C8a1ReSo.js";
import { d as useSelector } from "./es-CFYDnMm2.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { Bn as resolveVoucherItemCampaign, Hi as filterPromotionItems, Hn as getTemplateAction, Un as isCampaignInTypes, Vn as getCampaignViaType, Wi as getSpecialPriceItems, Wn as getRewardItemByRules, Zi as getItemPrice, pi as getMemberActivityState, vi as getRewardDiscountByRules, yi as checkCRMType, zn as resolveRewardItemCampaign } from "./actions-BwRPwnFF.js";
import { n as getValidCategoryList } from "./getStandardCateDish-BKfAMpZF.js";
import { o as resolveDiscountCampaign, t as checkIsCampaignValid } from "./checkCRMIntegrationCampaign-Bubup5KG.js";
import { t as useMemberPrivilege } from "./useMemberPrivilege-BabAJmwD.js";
//#region source-snapshot/src/utils/CRMIntegration/resolveSpecialItemCampaigns.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var resolveSpecialItemCampaigns = ({ rules, itemResources, orderType }) => {
	return rules.map((rule) => {
		const redeemPoint = rule?.redeemRule?.parameters?.point;
		const template = rule.couponTemplate;
		const { ruleId } = rule;
		const rewardType = rule.type === "reward" ? "loyalty" : "voucher";
		const newRedeemRule = {
			strategy: "setPrice",
			parameters: { points: redeemPoint }
		};
		const { ruleExpression: { benefits, options } } = template;
		const specialItemData = makeUpSpecialItems({
			benefits,
			itemResources,
			orderType,
			options,
			showSpecialPrice: rewardType === "voucher"
		});
		if (!specialItemData?.length) return null;
		return {
			...rule,
			_id: ruleId,
			campaignId: ruleId,
			rewardType,
			rewardRule: {
				redeemRule: newRedeemRule,
				rewardType
			},
			redeemRule: newRedeemRule,
			itemPoints: redeemPoint,
			isSatisfyMinSpend: true,
			couponItemList: specialItemData
		};
	}).filter(Boolean);
};
var makeUpSpecialItems = ({ benefits, itemResources, orderType, options, showSpecialPrice = false }) => {
	const { merchantProfile } = native_store_default.getState();
	return getSpecialPriceItems({
		benefits,
		itemResources,
		orderType,
		options,
		merchantId: merchantProfile?.merchantId
	}).map((item) => ({
		...item,
		specialPrice: showSpecialPrice ? item.specialPrice : void 0
	}));
};
//#endregion
//#region source-snapshot/src/utils/CRMIntegration/resolveBundleDiscount.js
var resolveBundleDiscount = ({ rules, itemResources, orderType }) => {
	const { merchantProfile } = native_store_default.getState();
	return rules.map((rule) => {
		const redeemPoint = rule?.redeemRule?.parameters?.point;
		const template = rule.couponTemplate;
		const { ruleId } = rule;
		const rewardType = rule.type === "reward" ? "loyalty" : "voucher";
		const benefitAction = getTemplateAction({ template });
		const { ruleExpression: { condition, benefits } } = template;
		const { params: { value: discountValue, quantity: discountNum } } = benefitAction;
		const { condition: { quantity } } = benefits[0];
		const newRedeemRule = {
			strategy: "orderItemFixedPriceCoupon",
			parameters: { points: redeemPoint },
			bundleDiscountRule: {
				orderQuantity: quantity,
				discountValue,
				discountNum
			}
		};
		const bundleDiscountItems = filterPromotionItems(itemResources, condition?.itemFilter, {
			merchantId: merchantProfile?.merchantId,
			orderType
		});
		if (!bundleDiscountItems.length) return null;
		return {
			...rule,
			_id: ruleId,
			campaignId: ruleId,
			rewardType,
			rewardRule: {
				redeemRule: newRedeemRule,
				rewardType
			},
			redeemRule: newRedeemRule,
			itemPoints: redeemPoint,
			isSatisfyMinSpend: true,
			couponItemList: bundleDiscountItems
		};
	}).filter(Boolean);
};
//#endregion
//#region source-snapshot/src/hooks/useReward/useCRMIntegration.js
var useCRMIntegration = () => {
	return {
		getCRMIntegrationRewardList: (0, import_react.useCallback)(({ rewards, itemResources, orderType }) => {
			if (rewards?.length > 0) {
				const merchantId = native_store_default.getState().merchantProfile?.merchantId;
				const rewardFreeItem = resolveRewardItemCampaign({
					rules: getCampaignViaType({
						campaigns: rewards,
						types: ["giftItemCoupon"],
						source: "reward",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				const rewardDiscount = resolveDiscountCampaign(getCampaignViaType({
					campaigns: rewards,
					types: ["discountCoupon", "voucher"],
					source: "reward",
					itemResources,
					orderType,
					merchantId
				}));
				const rewardSpecialItem = resolveSpecialItemCampaigns({
					rules: getCampaignViaType({
						campaigns: rewards,
						types: ["orderItemFixedPriceCoupon"],
						source: "reward",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				const rewardBundleDiscount = resolveBundleDiscount({
					rules: getCampaignViaType({
						campaigns: rewards,
						types: ["quantityItemDiscountCoupon"],
						source: "reward",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				return [
					...rewardFreeItem,
					...rewardDiscount,
					...rewardSpecialItem,
					...rewardBundleDiscount
				];
			}
			return [];
		}, []),
		getCRMIntegrationVoucherList: (0, import_react.useCallback)(({ vouchers, itemResources, orderType }) => {
			if (vouchers?.length > 0) {
				const merchantId = native_store_default.getState().merchantProfile?.merchantId;
				const voucherFreeItem = resolveVoucherItemCampaign({
					rules: getCampaignViaType({
						campaigns: vouchers || [],
						types: ["giftItemCoupon"],
						source: "voucher",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				const voucherDiscount = resolveDiscountCampaign(getCampaignViaType({
					campaigns: vouchers || [],
					types: ["discountCoupon", "voucher"],
					source: "voucher",
					itemResources,
					orderType,
					merchantId
				}));
				const voucherSpecialItem = resolveSpecialItemCampaigns({
					rules: getCampaignViaType({
						campaigns: vouchers || [],
						types: ["orderItemFixedPriceCoupon"],
						source: "voucher",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				const voucherBundleDiscount = resolveBundleDiscount({
					rules: getCampaignViaType({
						campaigns: vouchers || [],
						types: ["quantityItemDiscountCoupon"],
						source: "voucher",
						itemResources,
						orderType,
						merchantId
					}),
					itemResources,
					orderType
				});
				return [
					...voucherDiscount,
					...voucherFreeItem,
					...voucherSpecialItem,
					...voucherBundleDiscount
				];
			}
			return [];
		}, [])
	};
};
//#endregion
//#region source-snapshot/src/hooks/useReward/useCRM.js
var useCRM = () => {
	return {
		getCRMRewardFreeItem: (0, import_react.useCallback)(({ rules, itemResources }) => {
			if (rules?.length > 0) return getRewardItemByRules({
				rules,
				allItems: itemResources
			}).map((each) => each.items)?.flat()?.map((item) => {
				return {
					...item,
					totalPrice: getItemPrice(item),
					originalPrice: item.price || item.itemPrices?.[0]?.price || 0
				};
			});
			return [];
		}, []),
		getCRMRewardDiscount: (0, import_react.useCallback)(({ rules, itemResources }) => {
			return getRewardDiscountByRules({
				itemList: itemResources,
				rules
			});
		}, [])
	};
};
//#endregion
//#region source-snapshot/src/hooks/useReward/index.js
function useReward(props) {
	const { rewards, vouchers, allSysConfig, menuGroup, comboMenu, metaData, rewardRule, currentOrder } = props;
	const crm = useSelector((state) => state.crm);
	const avocado = useSelector((state) => state.avocado);
	const activityItems = (0, import_react.useMemo)(() => getMemberActivityState({
		crm,
		avocado,
		allSysConfig,
		currentOrder
	}).currentOrder.itemList, [
		crm,
		avocado,
		allSysConfig,
		currentOrder,
		useMemberPrivilege(crm)
	]);
	const hasOrderType = (0, import_react.useMemo)(() => {
		return !!currentOrder.orderType;
	}, [currentOrder.orderType]);
	const { getCRMIntegrationRewardList, getCRMIntegrationVoucherList } = useCRMIntegration();
	const { getCRMRewardFreeItem, getCRMRewardDiscount } = useCRM();
	const [validADRewards, setValidADRewards] = (0, import_react.useState)(null);
	const [validADVouchers, setValidADVouchers] = (0, import_react.useState)(null);
	const [rewardList, setRewardList] = (0, import_react.useState)(null);
	const [voucherList, setVoucherList] = (0, import_react.useState)(null);
	const crmType = (0, import_react.useMemo)(() => {
		return checkCRMType(allSysConfig);
	}, [allSysConfig]);
	const resolveCampaignData = (0, import_react.useCallback)((data) => {
		return data?.map((each) => {
			if (isCampaignInTypes({
				template: each.couponTemplate,
				types: ["orderItemFixedPriceCoupon", "quantityItemDiscountCoupon"]
			})) return {
				...each,
				crmIntegrationRule: { isValid: true }
			};
			return each;
		});
	}, []);
	const itemResources = (0, import_react.useMemo)(() => {
		if (!currentOrder.orderType) return [];
		const withoutFreeItemMenu = menuGroup.filter((_) => !_.isFreeItemMenu && _.id !== "promotion-deals-list");
		const comboMenuIds = comboMenu.map((each) => each.saleItemId);
		return getValidCategoryList(withoutFreeItemMenu.map((item) => ({
			...item,
			menuCategories: item?.menuCategories?.map((cate) => ({
				...cate,
				saleItems: cate?.saleItems?.filter((each) => !(comboMenuIds.includes(each.id) && each.itemPrices?.length > 0 && each.itemPrices.every((item) => item.type.toUpperCase() === "ALL")))
			}))
		})), currentOrder.orderType, false).flatMap((category) => category.saleItems).filter(Boolean);
	}, [
		menuGroup,
		currentOrder.orderType,
		comboMenu
	]);
	(0, import_react.useEffect)(() => {
		if (crmType !== 2) return;
		let cancelled = false;
		const getReward = async (coupons) => {
			if (!metaData || !hasOrderType) return;
			if (!coupons?.length) {
				setValidADRewards([]);
				return;
			}
			const res = await checkIsCampaignValid({
				coupons: coupons.filter((each) => each.couponTemplate),
				metaData
			});
			if (!cancelled) setValidADRewards(resolveCampaignData(res));
		};
		const getVouchers = async (coupons) => {
			if (!metaData || !hasOrderType) return;
			const res = await checkIsCampaignValid({
				coupons: Array.isArray(coupons) && coupons?.length > 0 ? coupons.filter((voucher) => voucher.count > 0 && voucher.rewardRule && voucher.rewardRule.couponTemplate).map((e) => {
					return e.rewardRule;
				}) : [],
				metaData
			});
			if (!cancelled) setValidADVouchers(resolveCampaignData(res));
		};
		if (Array.isArray(rewards)) getReward(rewards);
		else setValidADRewards(null);
		if (Array.isArray(vouchers)) getVouchers(vouchers);
		else setValidADVouchers(null);
		return () => {
			cancelled = true;
		};
	}, [
		rewards,
		vouchers,
		crmType,
		metaData,
		hasOrderType,
		currentOrder.orderType
	]);
	(0, import_react.useEffect)(() => {
		if (crmType === 2) {
			if (Array.isArray(validADRewards)) {
				const list = getCRMIntegrationRewardList({
					rewards: validADRewards || [],
					itemResources,
					orderType: currentOrder.orderType
				});
				setRewardList(list.sort((a, b) => a.itemPoints - b.itemPoints));
			} else setRewardList(null);
			if (Array.isArray(validADVouchers)) {
				const list = getCRMIntegrationVoucherList({
					vouchers: validADVouchers || [],
					itemResources,
					orderType: currentOrder.orderType
				});
				setVoucherList(list);
			} else setVoucherList(null);
		}
	}, [
		crmType,
		itemResources,
		validADRewards,
		validADVouchers,
		currentOrder.orderType
	]);
	(0, import_react.useEffect)(() => {
		if (crmType === 1 && hasOrderType) {
			const freeItemRewardList = itemResources?.length > 0 ? getCRMRewardFreeItem({
				rules: rewardRule,
				itemResources
			}) : [];
			const discountRewardList = getCRMRewardDiscount({
				rules: rewardRule || [],
				itemResources: activityItems || []
			});
			setRewardList([...freeItemRewardList, ...discountRewardList].sort((a, b) => a.itemPoints - b.itemPoints));
		}
	}, [
		crmType,
		itemResources,
		rewardRule,
		hasOrderType,
		activityItems
	]);
	return {
		rewardList,
		voucherList
	};
}
//#endregion
export { useReward as t };
