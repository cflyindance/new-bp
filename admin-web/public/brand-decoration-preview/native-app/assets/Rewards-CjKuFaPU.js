import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { G as require_dayjs_min, H as EventBus, a as getDeviceOrientation, m as subscribeDeviceOrientation, n as formatPhoneNumber } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { t as native_store_default } from "./native-store-B_9Z_F59.js";
import { $ as removeFreeItemInOrder, G as payByCash, Ir as showInsufficientStockToast, Jn as changeLoginType, Kn as changeFreeItem, M as getCurrentItem, Mr as getStockNumDisplayValue, Pr as isStockSufficient, Rr as getItemStoppedStatus, Xi as v4, Yn as changeSelectedDiscount, Zi as getItemPrice, _t as setActivityCurrentItem, da as require_cloneDeep, j as getCurrentCategory, jn as ITEM_HEIGHT, jr as getRemainingStockNum, mr as getDishItemLanguage, n as addCampaignItemsToOrder, nt as removeItemRewardInfoFromOrder, or as setTempCampaign, pt as saveOrderResult, qn as changeIgnoreReward, st as removeRewardItemFromList, wr as judgeHasDetailInfo, yi as checkCRMType } from "./actions-BwRPwnFF.js";
import { t as Trans } from "./Trans-BKMH8GOf.js";
import { t as useTranslation } from "./useTranslation-BJXMWyG7.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { a as changeRewardModalVisible } from "./orderLock-9vtPVs0P.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { n as ItemsDrawer_default, t as useCrmPromotionContrary } from "./useCrmPromotionContrary-DFA1wQZz.js";
import { t as SendAuthCode_default } from "./SendAuthCode-JDiMt820.js";
import { t as points_default } from "./points-ZUsV2cco.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as changeCrmPromotionContraryInfo } from "./promotion-BUTvAW3c.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { a as handleCheckSpecialItem, i as handleCheckFreeItem, n as handleCheckBundleDiscount, r as handleCheckDiscount, t as checkIsCampaignValid } from "./checkCRMIntegrationCampaign-Bubup5KG.js";
import { t as useReward } from "./useReward-66fh7KJZ.js";
import { i as mapCRMSpecialDiscountItems, n as mapCRMBundleDiscountItems, r as mapCRMDiscountItems, t as getCRMCampaignId } from "./resolveCRMRewardItem-Du3vuEgI.js";
import { i as VariableSizeList, r as DishTag } from "./PromotionTagsWrap-CjrBw9bq.js";
import { a as getItemCardProperties, d as remToPx } from "./getItemCardProperties-CHuqwFqK.js";
import { n as imgCard_default } from "./star-C6iOuR53.js";
import { t as orderDetailModal_default } from "./orderDetailModal-CXMeGrAX.js";
import { t as comboPanel_default } from "./comboPanel-D4O1jWqz.js";
import { t as DescViewModal_default } from "./DescViewModal-CDcpjYEk.js";
import { n as processZeroAmountOrder, t as calculateTotalAmount } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { o as shouldCollectTipBeforePayment, r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
//#region source-snapshot/src/component/CRM/Rewards/Reward.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var Reward_module_default = {
	rewardContainer: "rewardContainer___9L3tm",
	rewardList: "rewardList___xU1Y2",
	sectionTitle: "sectionTitle___VdYj3",
	freeItemTitle: "freeItemTitle___Q9T-M",
	bottom: "bottom___HKdxE",
	skipBtn: "skipBtn___Cz-ty",
	btnNotConfirm: "btnNotConfirm___nzxTe",
	selectedBtn: "selectedBtn___YlDFm",
	star: "star___221Z2"
};
var CRMReward_module_default = { innerWrapper: "innerWrapper___zQpbR" };
var index_module_default = {
	reward_wrapper: "reward_wrapper___GduQX",
	title: "title___G-N5s",
	reward_filter: "reward_filter___oHlXX",
	filter_item: "filter_item___lv8Hl",
	selectedType: "selectedType___VSvKE",
	memberInfo: "memberInfo___VQvHf",
	phone: "phone___euycN",
	assets: "assets___6ihie",
	pointsImg: "pointsImg___yPgc8",
	pts: "pts___rdj6B",
	memberInfoPhone: "memberInfoPhone___L6sNg",
	pointList: "pointList___qnnKM",
	pointItem: "pointItem___2305y",
	select: "select___z5Kf7"
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/RewardItem.module.scss
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var RewardItem_module_default = {
	rewardItem: "rewardItem___R7QQn",
	soldout: "soldout___F6kB2",
	rewardItem_img: "rewardItem_img___ynlXN",
	rewardInfo: "rewardInfo___VMP0T",
	rewardImage: "rewardImage___m5sqz",
	stockNum: "stockNum___ziKqW",
	disabledCover: "disabledCover___3Gsgu",
	coverImg: "coverImg___6lhMK",
	discountInfo: "discountInfo___V9FQ5",
	num: "num___jwSIS",
	off: "off___jsFs8",
	freeItemInfo: "freeItemInfo___RknSQ",
	rewardText: "rewardText___s4ZNr",
	rewardTitle: "rewardTitle___JpOoA",
	dishTagWrapper: "dishTagWrapper___o6eGp",
	expires: "expires___HP6CO",
	invalidRow: "invalidRow___thYPL",
	detailRow: "detailRow___lXQM3",
	detailRowText: "detailRowText___6mQfN",
	detail: "detail___VPy-o",
	detailRowBtn: "detailRowBtn___ez2vT",
	addRow: "addRow___Xnzrq",
	points: "points___yDB0F",
	pointsImg: "pointsImg___EApVB",
	pointsNum: "pointsNum___mDtXS",
	originPrice: "originPrice___1iOrX",
	trash_can: "trash_can___c0BLl",
	addReward: "addReward___dc5-K",
	selectReward: "selectReward___vxkqY"
};
//#endregion
//#region source-snapshot/src/assets/images/reward_frame_long.png
var reward_frame_long_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/assets/images/reward_frame_long_selected.png
var reward_frame_long_selected_default = "" + new URL("reward_frame_long_selected-XmWB5SdW.png", import.meta.url).href;
//#endregion
//#region source-snapshot/src/assets/images/reward_frame_short.png
var reward_frame_short_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjoAAAC2CAYAAADQpSdKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAVmSURBVHgB7d3hUdxGGMfhV66AEs4dQAdQgXEFSSoIrgCowKSCuIM4FdipwHTgK4EOyLsgexhsMNh8QH89z8yObrjj2w763Wolprrl8vJyvw+vehz22BQ8H2+maTqrJ9Zz/qgPbwuApTqfx2mfJ7Y335i+vOg/9jt9OOnxZ8HzdNFj7/Yk/hU97zd9+NRjpwBIML4Qj+AZ54zr0Jkj50OP3YLn7bwn7149gXnej8jZFABJxurOwYidF/MPTkrksAy7HShPdZnppEQOQKLRNMfjxTQv3X8uWJZR6h/rJ9mXA7AKB2NF57hgef6ZI/3R5t8TOQD5Xo3QccmKJRr7a/6uR7qxHw2AfIdChyXbny9BPcZYydkUAGuwGXt0LguW7UH7dezLAVgfoUOCbV0/X+firg/YdA+wTi8Klm9T96zU2JcDsF5ChxS/37Nfx74cgJVy6Yok3/yLiJ7eJ+URCgCrJXRI8/Wx3/blAODSFWmuHvvdkXNY9uUArJ4VHQAglhUdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0AEAYgkdACCW0CHRtsdhj7MCYNWmy1aQ5eU0Tdue2jv9+kOP3QJglazokOZkRM540ceLPrzucVEArJLQIcm7jpvTmz+Yo+e0AFgll65Ise2xN6/ifKOn+bs+/FYArIrQIcXLL5esvmfer/Opx6YAWA2XrkhwdF/kDPNKzx8FwKoIHZZu7Mv56yEf7M997MObAmA1xqWrz2U5n2Xa1j37cu7Sc37ccr5fAKQ7Hys67wuW6eCxkTMbl7Dccg6Q7yp0/i1Ynh/uy7nL/HuvC4B0py/mfQselc+SnD10X85dzHuAeONcsZ3GK4/KZ0G29RP7cu7Sc3/ccm7eA2Q5r3l7w9VdV/NJ46B8w+V5u5qnTxU5M/8iAiDLaJmv54rp9rv9DXfTh+O6/pbrmy7PydGvXrL6np7zR314WwAs1baub6563+eJ/26+8T86bd1383kQkAAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/reward_frame_short_selected.png
var reward_frame_short_selected_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjoAAAC2CAYAAADQpSdKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAfbSURBVHgB7d3PblxnGcfx55ikJQtQBBKbItVIdAELlIhFNyySHaWtSO4gvYImVxDnCuJeQdorSCpKsowrwYIF1OqCIoqEIxWJIjWKuomSkAznPY5Tn7Ed8k/qnN98PpI149fjWR15vj7vc2a6mjO7VidqVr+trk71t6sFi+JBneveqvV6wWZX62x/c7EAmKrNvlk2625d6E7X1u4fdDt3ZpfraL1Ua/3KuwWLaFa3+oP4+PxB/FxPea2P+Vl90t89WgAkWK87Q/Dcat8MofMwcq733x0rWGR9sXdv1vF6AYbj/uUhclYLgBzbZ3dOtthZGRa2z+SIHBZff5z2W00vZpupHfciByBPa5qX6/xw9+Gp+3+OHnBkteoXl6q+37fPIWf0+Zb9+XTVf66M1+73pf52bdQz2ncuZ7Vf+plRHYDJ+bJ/jfjsXNXtrfF6e63oQ+dSHzpnHi22yPnVJwKHxXGv32b94/HxAfwc8zoHxr3jHmC69nutqFpf6f/gj7esfn7RH3sWy+Gj22cYd+uG+ZpL9ZSGuZxZXR8ttuP99euOe4Ap2++1oupUm9EZh86PThUsnB+c2G9b6cTso2EL6sl9d9iuWh2ttbg/sloATNz39owbr64UTEWboWnBs9tKXZz9rk48ya8Pczm7t2l3nvOVMwVAgMN7z8wLHaalnZac32L6Tl0atqQeY5jLmR8+bmdxDB8DRBM6TEuLk19enl9drZcOvuT8sXM5AEQTOkxP2756dW40p6szB87rmMsBWFpCh2lqoTI/dNbV+f7szerupdnva81cDsDyEjpMV9vC2j2v0w0fZXJ5Z15nmMvptt8Z8xFzOQBLRegwXS1aXht3zM7bfs+u1qk9cznt8eZyAJaK0GHa2jbUq3tGc9pCm1heHa22KDKXA7BUhA7T9yQB89qauRyAJSR0mL7DDy8VPyh2fnym6qfnC4Dlc6ggwc78zc2Nqi8+2P5Qt3ZV1k/e3ftuygAsjW52tWajlTdmBQAwSde60be2rgCAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWEIHAIgldACAWIcKkny1UXVjverrzaojq1WvnKn64Ynt+wAsHaFDjk/PVP3rg2++v32j6ubH25Hz+nWxA7CEbF2R4fO1ceTsdnur6k8nq/57qwBYLkKH6fvi/ap/XHj8Y1rsfP5/HgNAHKHDtLWA2Rs5W/2Rfaq/XR+vrm9/AbA0hA7T1rakWuzsdqdOdr+uD/vbVkCbo5+1KJp/PACxhA7T9deze6NlVmvd6RoW+9tb1dXp/u43wzn3+rt/OV0ALAehwzS1uZwb743XZvV+92aN9rG6N/roeTBeGy49/+xcAZBP6DA97SzO3lDZqru1b710bw2zOuNLstqszs2NAiCb0GF69rtUvM3lnK6Drx+/U/0+1/aW1iNtC8u8DkA0ocO07D+Xc3ZnLucgQwTdr3dGi21e59N3CoBce0PHm6qxqA6ey3nvSX69e7s26sHc9lbbvnLJOUCslerm/hP+erNg4TzlXM5BHs7rbIwW2/Oa1wGYvn9fmV/ZXOn/Ix6vtlP5zuqwSNrx+CxzOQfphi2s8e857gGmrf0N/9vc/76zFjr368PRYvvP+Q/Hq768UrAQ/r72THM5BxkuOb9f4zfTac9vXgdgelrgfLWx3S7zrxV360LXbmdX62J/c7ZgCh7Uer8F9dxvhOO4Bwj28LViexh5v7fKh8W0VffqhXw6Z/ebIZYc9wBp+i2rndeKIXSGOYc7dbLmPwQRFsutZ57LOcj8R0QAMG39mZx+y+rRa0U3//PZtVrtb873NXSsvz1WsCjaXM4TXkr+VE/7Ub99tTJsYwEwTVv9VxsuvtKfrf949w/+BxJ4h0iFNSWZAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/reward_add.png
var reward_add_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAYAAACMRWrdAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAOVSURBVHgB3Zo7b9NQFMf/N42UigFVgrGDu9CRdAEJhrojLajkG2RhBiT2thtjKz5AW7HT8moHhOouDCxNVyYPsIGUraRAL+ce20mcxvaNH/XjJ908bCfKP+dxr8+5Ahkj9zCDaRoXNGo0HGzxADYyRCBFWEQDJr1cpG9uQtJAX8w4unRdh54tGsck1kJKpCJMHrKYNQ0hUXTpO/bJsrtJRSYSJj9inb7hKZKJCUJZclMsYxcxiCWMLSSxTS8NZE8HPbREa7KYnEiYG0NK0GNcNRIbYoU8RBNtYeR2Tbp6D1djpYAfQdY717NeDRqQqDaJOkKeohQq0zZwRJ5jRF8agStqG8XCJuu1yDU7QReECiuoKA+bkspSkFsGCqPMZ9C/coJsUnlaKHELJK47emJsjLmiVEwVWZTCoJjbG3ciKHmsIe9EoY8pP+DZ6MFLrljwuBqPJFc8Z5e0vUOXLSbYWuVC9BcOfXzC2FrlccFRTPmeF+OM32IZWevVO2D+yWC8+YJsmBr8/r6wklvLw+T1LIYtJrCKKjDNt1GOMFfl1a/Ys0A6ceZYrDEIugrA7ui54iKqRAOrjjDBtYoq0XSEycoJM2pu4ij6YndSmnUuZkrERk2+UXz95n//mW4Pf/wM/8zsTaB1D/GQmBFuxekIMVEriSy4Mw+8foHYaNU8ykiNaupdVJA6SesmibGX7ehrPp1SXJ0M3qvYuXsr/DPXryE+dH9Wx28S1kBsWvejr/n+yy9MxU/sxKCDgF3jQojItqWTA7Y3QXdQJag15S2pqiVMwnKE/cUxqkQPpyxMPOImW1XSvqXyxvAEvYNqsKMeBsL+4S3Kjqov9pywqnvHlDvKA3ZJEykze8OZu4bfZ8S+VzT1VYK5LjcVf0GcOz3MecJ8i2A3iVgoIxfUiA8tcUs8R/mw8QdbwwcuCeMuodBvYheE9dEGYHDj74BjzUTRkSRqBRujh6M6mvk31MOgNS6JWhh3KvAOmjdxCSyhuCsSm3piS0EnQ0sDLE7yh20UC6+xHvina21gKZhbWu4WpFBP0t+Z44hTXUMTeaHmqod609HEm8Soj7aWw3Rg02iLZf3bq4nLb5xaBeZo7CB7VKFpnfdyLE92z5hsv+Ihx5zagNlGuihBm5T1tqJiKYi0dpga3BG9YIFJGhwW+dA+zrAbV5BHqnuCFa7I2yTSBPpbaQ34Gx+2+9zh1zUSdIbjpGKG+Q+TCAZ1oAfMngAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/reward_add_disbale.png
var reward_add_disbale_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAYAAACMRWrdAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAPBSURBVHgB3ZrLUeNAEIbbwrxu5giGKvnMYU0EKyJgycAZ7G4ENhlABEAEsBEgIlhvAICqwFAFB3zjDfv/QuOSjfWWbElflUpv8K/p7umZnopkzMXFRW1hYaH29vZWm5mZqTmXreXlZUsypCIpQhFzc3NGpVL5jq358fHRxOWazyt9PNfF3sR2CrGmpEQqwm5ubgzs2iGEBNHH3zjWNO0wqchEwnq9Xgdf/KckE+NFF397FwIPJQaxhLGF8GX3cahL9nSfnp62G42GFeWlSMLoQ/Pz8xT0QyYMPuROvV7vhH0+tLCrq6smbP9IJtNKY4G47vPzc6jW0yQEENWCqBOZoijCSAuLOYHl6IHPBj3giNqXfGG9v79vr66udr0e8BWWU1EKC0Fl08ssPYUh8umw6b+STShPC4rbgLj+6I2xPuaIok/lWRTR4XNH4254BY+2TDlQRMCAy/wavfjFFHPuV2OBdfXRDWy4/e1Li0FUWwoGugGVOAwYEsbWkuKY4CjG5eWloU6q7jtZtdbZ2Zmcn58PztfX12VlZUXSBuM9/n6Tx4MWK3hrKQzmszwYCENrbUkJwGidw6hPYY7KiWfsWYAIaXBvC+NwXsqDbY62MM5RSImAOW4pYU0pEZx70dSBlAtdcwJH3pPdqDSrnMxEi0lc2PkGcX9/P3R+e3srDw8Pvu8sLi7G7sShp8bMQ5cEuDOKsNzd3dmbH0tLS7GFMXcMNedRRDTMqfelhFSROPaT+BgT2iDoU27To4nR1PyYnZ2VuHB8Vn18fOxjLCNxCeMHDBRuYUn8JwzwMUvjRAgPpFxYqoPuSolgaUqlVKUSBkxb2Ovr66mUCMSNf7awtbU1E7uyhH2TccPdQR9ICYBbHXA/EIaO+o8UHPZfMEPbrQbCHHM0JQOY0LLvUhvPM+JYTZoOzQRzXg6ZyIkUFBQoGkrYUBKcZatlDeplu75T3HjgtxQP6+XlZc994YswVgkRWTpSIPh7RwuAnoW/6+tr+pohOQeRsFOv13dGrwdVNKdeUPeDOS5EbYy75zmC5iIuNPGm5DcjsVAT2/S66Ts1QHEIJnzZknyhCuueHz3UApacmaXpLEHytaTQK3MccawaGjIl2FchaofqjiIvEuv1eu0pdAf09xZcI/TwKvL0G0Mr/klDZdEZw4mmDtdyRBFFEq1XpHnK5wLMlqQLBe0i6u0F+ZIXaa0w1dGCW/CBFk6TFDhMVFaPMat1GFeQItU1wcQR+Q0iDfkUyYKHLsOFD8vZc67FghgTYk6TinHzH1+unOH2TIFwAAAAAElFTkSuQmCC";
//#endregion
//#region source-snapshot/src/assets/images/trashCan.png
var trashCan_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/utils/resolveAvocadoSku.js
var roundToPrecision = (number, decimals = 2) => {
	number = Math.round(number + "e" + decimals);
	return Number(number + "e" + -decimals);
};
//#endregion
//#region source-snapshot/src/hooks/useDeviceOrientation.js
var useDeviceOrientation = () => {
	const [orientation, setOrientation] = (0, import_react.useState)(getDeviceOrientation());
	(0, import_react.useEffect)(() => subscribeDeviceOrientation(setOrientation), []);
	return orientation;
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/UnSatisfyModal.module.scss
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var UnSatisfyModal_module_default = {
	unSatisfyWrapper: "unSatisfyWrapper___3aHd2",
	header: "header___xhfhT",
	content: "content___AbH44",
	footer: "footer___MZvrK"
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/UnSatisfyModal.js
var import_jsx_runtime = require_jsx_runtime();
var UnSatisfyModal = (props) => {
	const { t } = useTranslation();
	const { unSatisfyModalInfo, onBack, onConfirm } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		isMountOnBody: true,
		visible: unSatisfyModalInfo.open,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			class: UnSatisfyModal_module_default.unSatisfyWrapper,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					class: UnSatisfyModal_module_default.header,
					children: t("crmJoinFaildReason")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					class: UnSatisfyModal_module_default.content,
					children: unSatisfyModalInfo.failureReason
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					class: UnSatisfyModal_module_default.footer,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: onBack,
						children: t("continueJoinCrm")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: onConfirm,
						className: "linear-animate-btn",
						children: t("orderByOriPrice")
					})]
				})
			]
		})
	});
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/ItemDrawerWrapper.js
var initUnSatisfyModalInfo = {
	open: false,
	failureReason: "",
	items: []
};
var ItemDrawerWrapper = (props) => {
	const { open, data, onClose, avocado: { metaData }, setTempCampaign, currentOrder: { itemList }, addCampaignItemsToOrder, onConfirmFreeItem } = props;
	const [unSatisfyModalInfo, setUnSatisfyModalInfo] = (0, import_react.useState)(initUnSatisfyModalInfo);
	const rewardStrategy = (0, import_react.useMemo)(() => {
		return data?.rewardRule?.redeemRule.strategy;
	}, [data]);
	const isSpecialItem = (0, import_react.useMemo)(() => {
		return rewardStrategy === "setPrice";
	}, [rewardStrategy]);
	const isBundleDiscount = (0, import_react.useMemo)(() => {
		return rewardStrategy === "orderItemFixedPriceCoupon";
	}, [rewardStrategy]);
	const isFreeItemVoucher = (0, import_react.useMemo)(() => {
		return data?.isFreeItemVoucher === true;
	}, [data]);
	const orderListItems = (0, import_react.useMemo)(() => {
		if (itemList?.length > 0) return itemList.map((each) => ({
			...each,
			uniqueItemTempId: v4(),
			isFromCurrentOrderItemList: true
		}));
	}, [itemList]);
	const handleConfirmSpecialItems = (0, import_react.useCallback)(async (items) => {
		const rule = (await checkIsCampaignValid({
			coupons: [data],
			metaData,
			allItems: items
		}))?.[0];
		if (rule) {
			const onCheckSuccess = (rule) => {
				const specialItemWithRule = mapCRMSpecialDiscountItems({
					items,
					rule,
					originalItemsByTempId: new Map((orderListItems || []).map((item, index) => [item.uniqueItemTempId, itemList[index]]))
				});
				setTempCampaign([rule]);
				addCampaignItemsToOrder(specialItemWithRule);
			};
			return handleCheckSpecialItem({
				rule,
				onCheckSuccess
			});
		}
		return false;
	}, [
		data,
		metaData,
		orderListItems,
		itemList,
		setTempCampaign,
		addCampaignItemsToOrder
	]);
	const onCheckBundleDiscountFailed = ({ failureReason, items }) => {
		setUnSatisfyModalInfo({
			open: true,
			failureReason,
			items
		});
	};
	const handleConfirmBundleDiscount = (0, import_react.useCallback)(async (items) => {
		const rule = (await checkIsCampaignValid({
			coupons: [data],
			metaData,
			allItems: items
		}))?.[0];
		if (rule) {
			const onCheckSuccess = (rule) => {
				const bundleDiscountItemWithRule = mapCRMBundleDiscountItems({
					items,
					rule
				});
				setTempCampaign([rule]);
				addCampaignItemsToOrder(bundleDiscountItemWithRule);
			};
			return handleCheckBundleDiscount({
				rule,
				onCheckSuccess,
				onCheckFailed: ({ failureReason }) => onCheckBundleDiscountFailed({
					failureReason,
					items
				})
			});
		}
		return false;
	}, []);
	const max = (0, import_react.useMemo)(() => {
		if (isSpecialItem || isFreeItemVoucher) return 1;
		if (isBundleDiscount) return 9999;
	}, [
		isSpecialItem,
		isBundleDiscount,
		isFreeItemVoucher
	]);
	const handleConfirmFreeItem = (0, import_react.useCallback)((items) => {
		const selectedItem = items?.[0];
		if (!selectedItem || !onConfirmFreeItem) return false;
		return onConfirmFreeItem(selectedItem);
	}, [onConfirmFreeItem]);
	const handleConfirm = (0, import_react.useCallback)((items) => {
		if (isFreeItemVoucher) return handleConfirmFreeItem(items);
		if (isSpecialItem) return handleConfirmSpecialItems(items);
		if (isBundleDiscount) return handleConfirmBundleDiscount(items);
	}, [
		isSpecialItem,
		isBundleDiscount,
		isFreeItemVoucher,
		handleConfirmFreeItem,
		handleConfirmSpecialItems,
		handleConfirmBundleDiscount
	]);
	const handleBackToOrder = () => {
		setUnSatisfyModalInfo(initUnSatisfyModalInfo);
	};
	const handleContinueOrder = () => {
		const { items } = unSatisfyModalInfo;
		addCampaignItemsToOrder(items);
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemsDrawer_default, {
		open,
		displayName: data.displayName,
		activityInfo: data,
		itemList: data.couponItemList,
		onClose,
		max,
		value: isFreeItemVoucher ? [] : orderListItems,
		showHiddenItems: isFreeItemVoucher,
		handleConfirm
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnSatisfyModal, {
		onBack: handleBackToOrder,
		onConfirm: handleContinueOrder,
		unSatisfyModalInfo
	})] });
};
function mapStateToProps$6(state) {
	return {
		crm: state.crm,
		avocado: state.avocado,
		currentOrder: state.currentOrder
	};
}
var ItemDrawerWrapper_default = withRouter(connect(mapStateToProps$6, {
	setTempCampaign,
	addCampaignItemsToOrder
})(withTranslation()(ItemDrawerWrapper)));
//#endregion
//#region source-snapshot/src/component/RewardCenter/RewardItem.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var MemoDishTag = (0, import_react.memo)(DishTag);
var RewardItem = (props) => {
	const orientation = useDeviceOrientation();
	const { data: sourceData, selfConfig, i18n: { language }, t, crm, getCurrentItem, getCurrentCategory, disabled, currentOrder, currentOrder: { itemList }, currentOrderCombo, menuItemList, avocado: { metaData, outletInfo }, setTempCampaign, isLong, onSelectItem, onRemoveItem, isNeedAutoUpdate, isMuted = false, renderCondition, removeRewardItemFromList, addCampaignItemsToOrder, styles: customStyles, isInCrmPromotionMutual, promotion, changeCrmPromotionContraryInfo, setActivityCurrentItem, history, changeRewardModalVisible, deferImages = false } = props;
	const { memberCRMInfo, tempCampaign } = crm;
	const [data, setData] = (0, import_react.useState)(sourceData);
	const { handleCheckIsHasPromotion } = useCrmPromotionContrary();
	(0, import_react.useEffect)(() => {
		const updateData = async (coupons) => {
			const rule = (await checkIsCampaignValid({
				coupons,
				metaData
			}))?.[0];
			setData(sourceData?.isFreeItemVoucher && rule ? {
				...sourceData,
				...rule,
				rewardRule: sourceData.rewardRule,
				couponItemList: sourceData.couponItemList,
				extSkuMapping: sourceData.extSkuMapping,
				isFreeItemVoucher: true
			} : rule);
		};
		if (isNeedAutoUpdate && metaData && data) updateData([(0, import_cloneDeep.default)(sourceData)]);
	}, [
		isNeedAutoUpdate,
		itemList,
		metaData,
		sourceData
	]);
	const [openItemList, setOpenItemList] = (0, import_react.useState)(false);
	const [orderPanelShow, setOrderPanelShow] = (0, import_react.useState)(false);
	const [comboPanelVisible, setComboPanelVisible] = (0, import_react.useState)(false);
	const [tempItemInfo, setTempItemInfo] = (0, import_react.useState)(null);
	const [descModalVisible, setDescModalVisible] = (0, import_react.useState)(false);
	const orderDetailModal = (0, import_react.useRef)(null);
	const memberPoints = (0, import_react.useMemo)(() => {
		return memberCRMInfo?.pointBalance || 0;
	}, [memberCRMInfo]);
	const isCRMIntegration = (0, import_react.useMemo)(() => {
		return outletInfo?.enabled === 1;
	}, [outletInfo?.enabled]);
	const openOrderDetailModal = (ref) => {
		orderDetailModal.current = ref;
	};
	const rewardType = (0, import_react.useMemo)(() => {
		return data?.rewardRule?.rewardType;
	}, [data]);
	const isReward = (0, import_react.useMemo)(() => {
		if (isCRMIntegration) return rewardType === "loyalty";
		return true;
	}, [rewardType, isCRMIntegration]);
	const rewardStrategy = (0, import_react.useMemo)(() => {
		return data?.rewardRule?.redeemRule?.strategy;
	}, [data]);
	const isFreeItem = (0, import_react.useMemo)(() => {
		return rewardStrategy === "byFreeItem";
	}, [rewardStrategy]);
	const isFreeItemVoucher = (0, import_react.useMemo)(() => {
		return data?.isFreeItemVoucher === true;
	}, [data]);
	const isDiscount = (0, import_react.useMemo)(() => {
		return ["byPercentageOff", "byFixedAmount"].includes(rewardStrategy);
	}, [rewardStrategy]);
	const isSpecialItem = (0, import_react.useMemo)(() => {
		return rewardStrategy === "setPrice";
	}, [rewardStrategy]);
	const isBundleDiscount = (0, import_react.useMemo)(() => {
		return rewardStrategy === "orderItemFixedPriceCoupon";
	}, [rewardStrategy]);
	const isPromotionItemActivity = (0, import_react.useMemo)(() => {
		return [
			"amountGiftItem",
			"orderItemGiftItem",
			"orderItemFixedPrice"
		].includes(rewardStrategy);
	}, [rewardStrategy]);
	const isPromotionOrderActivity = (0, import_react.useMemo)(() => {
		return [
			"orderItemChangeItem",
			"quantityItemDiscount",
			"totalAmountQuantityDiscount"
		].includes(rewardStrategy);
	}, [rewardStrategy]);
	const discount = (0, import_react.useMemo)(() => {
		if (!isDiscount) return null;
		const { strategy, parameters: { discount } } = data?.rewardRule?.redeemRule;
		return strategy === "byFixedAmount" ? `$${discount}` : `${discount}%`;
	}, [isDiscount, data]);
	const itemName = (0, import_react.useMemo)(() => {
		const isShowDishName = isFreeItem || isSpecialItem || isBundleDiscount || isPromotionItemActivity || rewardStrategy === "quantityItemDiscount";
		const dishName = getDishItemLanguage(data.fieldDisplayNameGroups, language) || getDishItemLanguage(data.fieldDisplayNameGroups, "en");
		return isShowDishName ? dishName || data.name : data.name;
	}, [
		isFreeItem,
		isPromotionItemActivity,
		data,
		language,
		rewardStrategy
	]);
	const displayPrice = (0, import_react.useMemo)(() => {
		if (!isFreeItem) return null;
		const isHasMorePrice = data.itemPrices?.length > 0 || data?.options?.length > 0;
		let showPrice = `$${(data.originalPrice || data.price || data.itemPrices?.[0]?.price || 0)?.toFixed(2)}`;
		return isHasMorePrice ? `${showPrice}+` : showPrice;
	}, [isFreeItem, data]);
	const points = (0, import_react.useMemo)(() => {
		return isReward ? data?.rewardRule?.redeemRule?.parameters?.points : null;
	}, [isReward, data]);
	const itemDiscountPrice = (0, import_react.useMemo)(() => {
		return data?.rewardRule?.redeemRule?.parameters?.itemDiscountPrice || "0.00";
	}, [data]);
	const isSelected = (0, import_react.useMemo)(() => {
		return tempCampaign?.length > 0;
	}, [tempCampaign]);
	const isCurrentItemSelected = (0, import_react.useMemo)(() => {
		if (!isSelected) return false;
		if (isFreeItem) {
			const selectedCampaign = tempCampaign?.[0];
			if (isFreeItemVoucher) return selectedCampaign?.rewardRule?._id === data?.rewardRule?._id || selectedCampaign?.crmIntegrationRule?.coupon?.ruleId === data?.ruleId;
			return (selectedCampaign.oId || selectedCampaign.id) === data.id && selectedCampaign?.crmIntegrationRule?.coupon?.ruleId === data.crmIntegrationRule?.coupon?.ruleId;
		}
		return tempCampaign?.[0]?._id === data._id;
	}, [
		isSelected,
		isFreeItem,
		isFreeItemVoucher,
		tempCampaign,
		data
	]);
	const handleCheckCampaign = () => {
		if (isMuted) return;
		if (!Object.keys(memberCRMInfo).length) {
			toast_default.info(t("redeem-login-first"), "top");
			EventBus.emit("open_login_modal");
			return false;
		}
		if (handleCheckIsHasPromotion()) return false;
		if (isReward && memberPoints < data.itemPoints) {
			toast_default.info(t("noEnoughPoints"));
			return false;
		}
		if (isSelected) {
			toast_default.info(t("onlyOneFree"));
			return false;
		}
		if (isDiscount && !itemList?.length) {
			toast_default.info(t("selectItemFirst"));
			return false;
		}
		return true;
	};
	const countADRedeemPrice = (voucherRules, price) => {
		const { option, value, amountCapped } = voucherRules;
		if (option === "dollarOff") {
			const afterDiscountPrice = roundToPrecision(price - value);
			return afterDiscountPrice < 0 ? 0 : afterDiscountPrice;
		}
		if (option === "percentageOff") {
			const discount = roundToPrecision(value / 100 * price);
			return roundToPrecision(price - (discount > amountCapped ? amountCapped : discount));
		}
		return 0;
	};
	const handleClickItem = async () => {
		if (handleCheckCampaign()) {
			if (isCRMIntegration) {
				const rule = (await checkIsCampaignValid({
					coupons: [data],
					metaData
				}))?.[0];
				handleCheckFreeItem({ rule });
				if (!rule.crmIntegrationRule.isValid) return;
			}
			const itemData = {
				...data,
				remark: {
					optionName: "",
					optionType: "NOTE",
					quantity: 1,
					price: 0
				}
			};
			if (data.itemType === "SALE_ITEM") {
				if (judgeHasDetailInfo(data)) {
					setTempItemInfo(itemData);
					setOrderPanelShow(true);
					return;
				}
				const clonedData = (0, import_cloneDeep.default)(itemData);
				if (clonedData.itemPrices?.length === 1) {
					clonedData.sectionDetail = [{
						id: -1,
						sizeInfo: Object.assign({}, clonedData.itemPrices[0])
					}];
					clonedData.price = 0;
				} else clonedData.sectionDetail = [];
				await handleSetFreeItem(clonedData, true);
				return;
			}
			if (data.comboType === "FIXED_SELECTION") {
				setTempItemInfo(itemData);
				setOrderPanelShow(true);
				return;
			}
			setTempItemInfo(itemData);
			setActivityCurrentItem(itemData);
			setComboPanelVisible(true);
		}
	};
	const handleSetFreeItem = async (itemInfo, isNormalDish = false) => {
		const { itemPoints, rewardRule, crmIntegrationRule, freeItemOriginPrice, originalPrice, couponTemplate } = data;
		let baseItemInfo = {
			remark: {
				optionName: "",
				optionType: "NOTE",
				quantity: 1,
				price: 0
			},
			...itemInfo,
			quantity: 1,
			isFreeItem: true
		};
		const item = isNormalDish ? baseItemInfo : {
			...baseItemInfo,
			itemPoints,
			rewardRule,
			couponTemplate,
			crmIntegrationRule,
			freeItemOriginPrice: freeItemOriginPrice ?? itemInfo.freeItemOriginPrice,
			originalPrice: originalPrice ?? itemInfo.originalPrice,
			isFreeItem: true
		};
		const { voucherRules } = item.rewardRule;
		if (voucherRules) {
			const itemPrice = getItemPrice({
				...item,
				price: item.itemPrices?.length ? 0 : item.originalPrice
			});
			item.price = countADRedeemPrice(voucherRules, itemPrice);
			item.originalPrice = itemPrice;
		}
		if (!isStockSufficient({
			itemInfo: item,
			addQty: item.quantity || 1,
			itemList,
			menuItemList,
			currentOrderCombo,
			crm,
			excludeRewardPending: true,
			promotion
		})) {
			showInsufficientStockToast(void 0, item, menuItemList);
			return false;
		}
		setTempCampaign([item]);
		onSelectItem?.({ rule: item });
		return true;
	};
	const discountItem = (0, import_react.useMemo)(() => {
		if (isDiscount && itemList?.length > 0) return itemList.map((each) => ({
			...each,
			uniqueItemTempId: v4()
		}));
	}, [isDiscount, itemList]);
	const handleChangeDiscount = async () => {
		if (handleCheckCampaign()) {
			const onCheckSuccess = (rule) => {
				setTempCampaign([rule]);
				onSelectItem?.({ rule });
				if (!isCRMIntegration) return;
				const { orderItems, discounts: orderDiscountInfo } = rule.crmIntegrationRule.result?.[0].calculatedOrder;
				const newItemList = mapCRMDiscountItems({
					orderItems,
					orderDiscountInfo,
					items: discountItem
				});
				addCampaignItemsToOrder(newItemList);
			};
			if (isCRMIntegration) {
				const rule = (await checkIsCampaignValid({
					coupons: [data],
					metaData,
					allItems: discountItem
				}))?.[0];
				handleCheckDiscount({
					rule,
					onCheckSuccess
				});
			} else onCheckSuccess(data);
		}
	};
	const handeRemoveItem = () => {
		if (isMuted) return;
		onRemoveItem?.({ rule: tempCampaign });
		setTempCampaign(null);
		if (isBundleDiscount || isSpecialItem) removeRewardItemFromList(getCRMCampaignId(data));
	};
	const isLongItem = (0, import_react.useMemo)(() => {
		return isLong ?? orientation === "vertical";
	}, [isLong, orientation]);
	const frameSrc = (0, import_react.useMemo)(() => {
		if (isMuted) return isLongItem ? reward_frame_long_default : reward_frame_short_default;
		if (isLongItem) return isCurrentItemSelected ? reward_frame_long_selected_default : reward_frame_long_default;
		return isCurrentItemSelected ? reward_frame_short_selected_default : reward_frame_short_default;
	}, [
		isCurrentItemSelected,
		isLongItem,
		isMuted
	]);
	const countWidth = (0, import_react.useMemo)(() => {
		return isLongItem ? "79.4rem" : "57rem";
	}, [isLongItem]);
	const isDisabled = (0, import_react.useMemo)(() => {
		if (disabled) return true;
		if (isDiscount && !itemList?.length) return true;
		if (isReward) return memberPoints < data.itemPoints;
		if (isSpecialItem || isBundleDiscount || data?.activityType || data?.isSelected || data?.isFreeItem) return false;
		if (tempCampaign?.[0] && !isCurrentItemSelected) return true;
		return !data.crmIntegrationRule?.isValid;
	}, [
		disabled,
		data,
		itemList,
		isDiscount,
		isCurrentItemSelected,
		tempCampaign,
		isSpecialItem,
		isBundleDiscount,
		isReward,
		memberPoints
	]);
	const isVoucherDiscount = (0, import_react.useMemo)(() => {
		return !isReward && isDiscount;
	}, [isDiscount, isReward]);
	const renderPriceOrPoints = (0, import_react.useMemo)(() => {
		if (renderCondition) return renderCondition;
		if (isFreeItemVoucher) return null;
		if (isReward) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: RewardItem_module_default.pointsImg,
			src: points_default,
			alt: "points"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: RewardItem_module_default.pointsNum,
			children: [
				points,
				" ",
				t("pts")
			]
		})] });
		if (isVoucherDiscount || isBundleDiscount || isSpecialItem) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: RewardItem_module_default.pointsNum,
			children: ["$", itemDiscountPrice]
		});
	}, [
		renderCondition,
		isFreeItemVoucher,
		isVoucherDiscount,
		isReward,
		points,
		itemDiscountPrice
	]);
	const property = (0, import_react.useMemo)(() => {
		return getItemCardProperties({
			itemInfo: data,
			selfConfig
		});
	}, [
		selfConfig?.configList,
		data.id,
		data.oId,
		data.properties
	]);
	const stoppedStatus = (0, import_react.useMemo)(() => {
		return getItemStoppedStatus(data);
	}, [
		data,
		selfConfig?.soldOut,
		menuItemList
	]);
	const isSoldout = Boolean(stoppedStatus);
	const renderAvator = () => {
		if (isFreeItemVoucher) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `${RewardItem_module_default.discountInfo} ${RewardItem_module_default.freeItemInfo}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.num,
				children: "FREE"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.off,
				children: "ITEM"
			})]
		});
		if (isFreeItem || isPromotionItemActivity || rewardStrategy === "quantityItemDiscount") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
			selfConfig,
			itemInfo: data,
			deferLoad: deferImages
		});
		if (isDiscount) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: RewardItem_module_default.discountInfo,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.num,
				children: discount
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.off,
				children: "OFF"
			})]
		});
		if (isSpecialItem) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: RewardItem_module_default.discountInfo,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.num,
				children: "Item"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: RewardItem_module_default.off,
				children: "OFF"
			})]
		});
		if (isBundleDiscount) {
			const { redeemRule: { bundleDiscountRule: { discountValue } } } = data;
			const finallyDiscount = discountValue === 100 ? "100%" : `${100 - discountValue}%`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: RewardItem_module_default.discountInfo,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: RewardItem_module_default.num,
					children: finallyDiscount
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: RewardItem_module_default.off,
					children: "OFF"
				})]
			});
		}
		if (isPromotionOrderActivity && rewardStrategy !== "quantityItemDiscount") {
			const { hitRuleItem } = data;
			const discount = hitRuleItem?.discountType === "minus" ? `$${hitRuleItem?.discountNumber}` : `${hitRuleItem?.discountNumber}%`;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: RewardItem_module_default.discountInfo,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: RewardItem_module_default.num,
					children: discount
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: RewardItem_module_default.off,
					children: "OFF"
				})]
			});
		}
	};
	const renderOperationArea = () => {
		if (isMuted) return null;
		if (isCurrentItemSelected) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: RewardItem_module_default.trash_can,
			src: trashCan_default,
			alt: "remove item"
		});
		if (isDisabled) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: RewardItem_module_default.addReward,
			src: reward_add_disbale_default,
			alt: "reward add disbale"
		});
		if (isSpecialItem || isBundleDiscount) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `${RewardItem_module_default.selectReward} animate-btn`,
			onClick: handleOpenItemList,
			children: t("special_item_select")
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			className: RewardItem_module_default.addReward,
			src: reward_add_default,
			alt: "reward add"
		});
	};
	const handleOpenItemList = () => {
		if (!handleCheckCampaign()) return;
		setOpenItemList(true);
	};
	const handleOpenFreeItemVoucher = async () => {
		if (!handleCheckCampaign()) return;
		const rule = (await checkIsCampaignValid({
			coupons: [data],
			metaData
		}))?.[0];
		if (!rule) return;
		handleCheckFreeItem({ rule });
		if (!rule?.crmIntegrationRule?.isValid) return;
		setOpenItemList(true);
	};
	const handleSelectCampaign = () => {
		if (isCurrentItemSelected) return handeRemoveItem();
		if (isFreeItemVoucher) return handleOpenFreeItemVoucher();
		if (isFreeItem) return handleClickItem();
		if (isDiscount) return handleChangeDiscount();
		if (isSpecialItem || isBundleDiscount) return handleOpenItemList();
	};
	const expires = (0, import_react.useMemo)(() => {
		if (isPromotionOrderActivity || isPromotionItemActivity) return null;
		return data?.useEndTime ? t("voucher_period", { value: (0, import_dayjs_min.default)(data?.useEndTime).format("YYYY/MM/DD") }) : t("permanently_voucher");
	}, [
		isPromotionOrderActivity,
		isPromotionItemActivity,
		data.useEndTime,
		t
	]);
	const detailDescribe = (0, import_react.useMemo)(() => {
		let description = "";
		if (isCRMIntegration) description = data?.couponTemplate?.description;
		else description = data?.description;
		return description;
	}, [
		isCRMIntegration,
		data.description,
		data?.couponTemplate?.description
	]);
	const stockNum = selfConfig?.configMap?.id_74 !== false ? getRemainingStockNum({
		itemInfo: data,
		itemList,
		menuItemList,
		currentOrderCombo,
		crm: props.crm,
		promotion
	}) : void 0;
	const checkDetail = () => {
		setDescModalVisible(true);
	};
	if (!data) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			style: {
				width: countWidth,
				...customStyles
			},
			className: RewardItem_module_default.rewardItem,
			onClick: () => {
				if (isSoldout) return;
				handleSelectCampaign();
			},
			children: [
				isSoldout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: RewardItem_module_default.soldout,
					children: stoppedStatus === "unavailable" ? t("item-unavailable") : t("sold-out")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: RewardItem_module_default.rewardItem_img,
					src: frameSrc,
					alt: "reward frame"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: RewardItem_module_default.rewardInfo,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: RewardItem_module_default.rewardImage,
						children: [
							renderAvator(),
							selfConfig?.configMap?.id_74 !== false && stockNum !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: RewardItem_module_default.stockNum,
								children: t("item-stock-num", { stockNum: getStockNumDisplayValue(stockNum) })
							}),
							isDisabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: RewardItem_module_default.disabledCover,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									className: RewardItem_module_default.coverImg,
									src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAsCAYAAADikXHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAKZSURBVHgB7Zk/aBRBFMbfnoJFQBE0qT0Em4S01tqnVluvN7Wpvd5a68PWs/WujvWlEIRLpZhDDAQSSEi4fF/u7bHZzP/ZhCvyg8eyM7Nz3868efN2rpAMptPpMi5t2BJsuVI1URsXRXEokRQSCYRQwAbsZU2IjR3Yd4gbSiBRoiCIYl7LbGRiGcE+QtzE1zBYFAS9k9no5LAH2/RNaUvCBHUaEERWYO99je76GkAQHXnD0YRvPdIrqTq/iTX0uYrR2pFUUaAjdjE9dP7NVIkffoXLG8uz9MstS517+nTJr1qqP9kEEdR9weWzpbqtqzheFHhuKR+ELHG06ctsautQ0BNJFLVmKR9IOD8s5W3bAz5RxuDoclID2zF9E58o0xCPJQJHsIz3KYcjRu9lMtsH6yQ5epOiYvoPi+g1UkRFPTMPnjpdXBGlAz6APTI88xRtY7ecZ7D7jn4m8L156ChUEB16Sy6viHuwdcMP7MN+SRzr2l+VA9jPyj036y7E7bY0anclLDcid6QZzmr33Ky7HCD6VGp+lMuZoYw6OhRl20qOYaeW8iY4tZS3Kco1Sn8MHf2WePZq93yxv5a2S77UhQ/+hz1WQXTyE4mH/dCxH2o//8Q8fReE5FMUkTI6dY7UvKQEz2tnIUWFTJ+Pr7Ahg57uClzNDDOhce8KBTrqSzo9TXsvoeI+iCORc5EzfdsmQUS/67qSSI4oZ0qsyd2uJJAjKiQdicpSS3JErTTU5go5ol64Kj3fjE5yRPHz2yhMV5/3zMBGbpzahABO0aD8asE9vxXfSmI4ILlxqkrp+Nm5WRMRvaSxRPF2Qw7lVlQoFDWSxWJMUcHn2zdEv4Wgx92+J4sB87Ph/BydJ7YS/i9C03A3GJSHceeRtLsfBoGPwgAAAABJRU5ErkJggg==",
									alt: "read item disabled"
								})
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: RewardItem_module_default.rewardText,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: RewardItem_module_default.rewardTitle,
								style: isInCrmPromotionMutual ? { paddingRight: "8rem" } : {},
								children: itemName
							}),
							(property?.length > 0 || expires) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: RewardItem_module_default.dishTagWrapper,
								children: [expires && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: RewardItem_module_default.expires,
									children: expires
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: RewardItem_module_default.dishTagInner,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoDishTag, {
										tagsInfo: property,
										isItemCard: false,
										imgTagStyle: { height: "3rem" },
										textTagStyle: {
											fontSize: "1.6rem",
											padding: "0.4rem"
										},
										style: { maxHeight: "4rem" }
									})
								})]
							}),
							detailDescribe && !isMuted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: RewardItem_module_default.detailRow,
								children: detailDescribe && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: RewardItem_module_default.detailRowText,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: RewardItem_module_default.detail,
										children: detailDescribe
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										className: RewardItem_module_default.detailRowBtn,
										onClick: (e) => {
											e.stopPropagation();
											checkDetail();
										},
										children: t("operate-detail")
									})]
								})
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: RewardItem_module_default.addRow,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: RewardItem_module_default.points,
								children: [renderPriceOrPoints, isFreeItem && !isFreeItemVoucher && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: RewardItem_module_default.originPrice,
									children: displayPrice
								})]
							}), renderOperationArea()]
						})]
					})]
				})
			]
		}),
		orderPanelShow && tempItemInfo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(orderDetailModal_default, {
			isMountOnBody: true,
			onAddFreeItem: handleSetFreeItem,
			isInFreeItem: true,
			max: 1,
			orderPanelShow,
			itemInfo: tempItemInfo,
			onRef: openOrderDetailModal,
			onCloseModal: () => {
				setOrderPanelShow(false);
				setTempItemInfo(null);
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			isMountOnBody: true,
			visible: comboPanelVisible,
			html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(comboPanel_default, {
				onAddFreeItem: handleSetFreeItem,
				isInFreeItem: true,
				max: 1,
				itemInfo: tempItemInfo,
				itemPoints: data.itemPoints,
				itemVoucherPrice: data.price,
				onCloseModal: () => setComboPanelVisible(false)
			})
		}),
		openItemList && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemDrawerWrapper_default, {
			open: openItemList,
			data,
			onConfirmFreeItem: handleSetFreeItem,
			onClose: () => setOpenItemList(false)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DescViewModal_default, {
			visible: descModalVisible,
			description: detailDescribe,
			onClose: () => {
				setDescModalVisible(false);
			}
		})
	] });
};
function mapStateToProps$5(state) {
	return {
		crm: state.crm,
		avocado: state.avocado,
		selfConfig: state.selfConfig,
		currentOrder: state.currentOrder,
		promotion: state.promotion,
		menuItemList: state.menuItemList,
		currentOrderCombo: state.currentOrderCombo
	};
}
var RewardItem_default = withRouter(connect(mapStateToProps$5, {
	getCurrentItem,
	getCurrentCategory,
	setTempCampaign,
	removeRewardItemFromList,
	addCampaignItemsToOrder,
	changeCrmPromotionContraryInfo,
	setActivityCurrentItem,
	changeRewardModalVisible
})(withTranslation()(RewardItem)));
var RewardList_module_default = {
	rewardList: "rewardList___I9iyi",
	listRow: "listRow___JKkeX",
	singleColumn: "singleColumn___YdMHU",
	bottomSpacer: "bottomSpacer___5JYby"
};
//#endregion
//#region source-snapshot/src/component/RewardCenter/RewardList.js
var RewardList = (props) => {
	const { isInRewardPage, fixedVirtualListData, vListHeight, onSelectItem, onRemoveItem, colNum } = props;
	const listRef = (0, import_react.useRef)();
	(0, import_react.useEffect)(() => {
		if (fixedVirtualListData && listRef.current) listRef.current?.scrollTo(0);
	}, [fixedVirtualListData]);
	const getItemSize = (0, import_react.useCallback)((index) => {
		if (index === fixedVirtualListData.length) return isInRewardPage ? remToPx(25) : remToPx(10);
		return remToPx(ITEM_HEIGHT + 4);
	}, [fixedVirtualListData]);
	(0, import_react.useEffect)(() => {
		if (listRef.current) listRef.current.resetAfterIndex(0, true);
	}, [fixedVirtualListData]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VariableSizeList, {
		ref: listRef,
		className: RewardList_module_default.rewardList,
		height: vListHeight || remToPx(22.2 * 3),
		itemCount: fixedVirtualListData.length + 1,
		itemSize: getItemSize,
		width: "100%",
		children: ({ index, style }) => {
			if (index === fixedVirtualListData.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				style,
				className: RewardList_module_default.bottomSpacer
			}, index);
			const row = fixedVirtualListData[index];
			if (Array.isArray(row)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${RewardList_module_default.listRow} ${colNum === 1 ? RewardList_module_default.singleColumn : ""}`,
				style: {
					...style,
					gridTemplateColumns: `repeat(${colNum}, 1fr)`
				},
				children: row.map((each) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardItem_default, {
						onSelectItem,
						onRemoveItem,
						data: each
					}, `${each.id || each._id}${each.rewardRule?._id}`);
				})
			}, index);
			else return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${RewardList_module_default.listRow} ${colNum === 1 ? RewardList_module_default.singleColumn : ""}`,
				style: {
					...style,
					gridTemplateColumns: `repeat(${colNum}, 1fr)`
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardItem_default, {
					onSelectItem,
					onRemoveItem,
					data: row
				}, `${row.id || row._id}${row.rewardRule?._id}`)
			}, index);
		}
	});
};
var RewardList_default = (0, import_react.memo)(RewardList);
//#endregion
//#region node_modules/ahooks/es/usePrevious/index.js
var defaultShouldUpdate = function(a, b) {
	return !Object.is(a, b);
};
function usePrevious(state, shouldUpdate) {
	if (shouldUpdate === void 0) shouldUpdate = defaultShouldUpdate;
	var prevRef = (0, import_react.useRef)(void 0);
	var curRef = (0, import_react.useRef)(void 0);
	if (shouldUpdate(curRef.current, state)) {
		prevRef.current = curRef.current;
		curRef.current = state;
	}
	return prevRef.current;
}
//#endregion
//#region source-snapshot/src/component/RewardCenter/index.js
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
var RewardCenter = (props) => {
	const isVertical = useDeviceOrientation() === "vertical";
	const containerWidth = isVertical ? 79.4 : 118;
	const colNum = isVertical ? 1 : 2;
	const { isInRewardPage, height, crm: { memberCRMInfo, selectedFreeItem, selectedDiscount, rewardRule }, avocado: { rewards, vouchers, metaData, outletInfo }, menuGroup, comboMenu, allSysConfig, onSelectItem, onRemoveItem, setTempCampaign, currentOrder, selfConfig } = props;
	const [rewardType, setRewardType] = (0, import_react.useState)("point");
	const { t } = useTranslation();
	const [selectedPts, setSelectedPts] = (0, import_react.useState)("All");
	const [fixedVirtualListData, setFixedVirtualListData] = (0, import_react.useState)([]);
	const isCRMIntegration = (0, import_react.useMemo)(() => {
		return outletInfo?.enabled === 1;
	}, [outletInfo]);
	const isMemberLogin = (0, import_react.useMemo)(() => {
		return isCRMIntegration ? memberCRMInfo.id : memberCRMInfo._id;
	}, [memberCRMInfo, isCRMIntegration]);
	(0, import_react.useEffect)(() => {
		if (isMemberLogin && isCRMIntegration) {
			setRewardType("all");
			return;
		}
		setRewardType("point");
	}, [isMemberLogin, isCRMIntegration]);
	(0, import_react.useEffect)(() => {
		const selectedCampaign = selectedFreeItem?.[0] ? selectedFreeItem?.[0] : Object.keys(selectedDiscount)?.length > 0 ? selectedDiscount : null;
		if (selectedCampaign) setTempCampaign([selectedCampaign]);
	}, [selectedFreeItem, selectedDiscount]);
	const { rewardList, voucherList } = useReward({
		rewards,
		vouchers,
		allSysConfig,
		menuGroup,
		comboMenu,
		metaData,
		rewardRule,
		currentOrder
	});
	const pointList = (0, import_react.useMemo)(() => {
		if (rewardList?.length) return ["All", ...rewardList.reduce((pre, cur) => {
			const currentItemPoints = cur?.rewardRule?.redeemRule?.parameters?.points;
			if (!pre?.length) return pre.concat(currentItemPoints);
			return pre.some((e) => e === currentItemPoints) ? pre : pre.concat(currentItemPoints);
		}, [])?.sort((a, b) => a - b)];
	}, [rewardList]);
	const renderList = (0, import_react.useMemo)(() => {
		const isRewardArray = Array.isArray(rewardList);
		const isVoucherArray = Array.isArray(voucherList);
		if (!isRewardArray && !isVoucherArray) return [];
		const rewards = isRewardArray ? rewardList : [];
		const vouchers = isVoucherArray ? voucherList : [];
		let actualRewardType = rewardType === "all" && !vouchers?.length ? "point" : rewardType;
		if (actualRewardType === "all") return [...rewards, ...vouchers];
		if (actualRewardType === "voucher") return vouchers;
		return selectedPts === "All" ? rewards : rewards.filter((each) => each.rewardRule?.redeemRule?.parameters?.points === selectedPts);
	}, [
		rewardList,
		voucherList,
		rewardType,
		selectedPts
	]);
	const isShowFilter = (0, import_react.useMemo)(() => {
		return rewardList?.length > 0 && voucherList?.length > 0;
	}, [rewardList, voucherList]);
	const isDisplayPointList = (0, import_react.useMemo)(() => {
		if (rewardType === "all") return voucherList?.length <= 0;
		return rewardType === "point";
	}, [rewardType, voucherList]);
	const dataList = (0, import_react.useMemo)(() => {
		if (!renderList?.length) return [];
		if (colNum === 1) return renderList;
		const res = [];
		for (let i = 0; i < renderList?.length; i += 2) res.push(renderList.slice(i, i + colNum));
		return res;
	}, [colNum, renderList]);
	const preList = usePrevious(dataList);
	(0, import_react.useEffect)(() => {
		if (!(0, import_isEqual.default)(dataList, preList)) setFixedVirtualListData(dataList);
	}, [dataList, preList]);
	const vListHeight = (0, import_react.useMemo)(() => {
		return isDisplayPointList ? height - remToPx(20) : height - remToPx(10);
	}, [height, isDisplayPointList]);
	const phone = (0, import_react.useCallback)((phoneStr, maskCount = 6, maskChar = "•") => {
		const formatted = formatPhoneNumber(phoneStr || "");
		let result = "";
		let count = 0;
		for (const ch of formatted) if (/\d/.test(ch) && count < maskCount) {
			result += maskChar;
			count++;
		} else result += ch;
		return result;
	}, [])(memberCRMInfo.phone);
	const showOwnPoints = (0, import_react.useMemo)(() => {
		return selfConfig?.configMap?.id_48;
	}, [selfConfig]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: index_module_default.reward_wrapper,
		style: { width: `${containerWidth}rem` },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.title,
				style: isInRewardPage ? { fontSize: "4rem" } : {},
				children: t("reward_center")
			}),
			isShowFilter && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.reward_filter,
				children: [
					"all",
					"point",
					"voucher"
				].map((each) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						onClick: () => setRewardType(each),
						className: (0, import_classnames.default)(index_module_default.filter_item, rewardType === each && index_module_default.selectedType),
						children: t(`reward_${each}`)
					}, each);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				style: { display: isMemberLogin ? "flex" : "none" },
				className: `${index_module_default.memberInfo} ${!showOwnPoints ? index_module_default.memberInfoPhone : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: index_module_default.phone,
					children: phone
				}), showOwnPoints && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: index_module_default.assets,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("login-guide-banner-member-points") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: index_module_default.pointsImg,
							src: "data:image/png;base64,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",
							alt: "points"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: index_module_default.pts,
							children: [memberCRMInfo.pointBalance, t("pts")]
						})
					]
				})]
			}),
			isDisplayPointList && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: index_module_default.pointList,
				children: pointList?.map((each) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: (0, import_classnames.default)(index_module_default.pointItem, selectedPts === each && index_module_default.select),
						onClick: () => setSelectedPts(each),
						children: [
							each,
							" ",
							each !== "All" && "pts."
						]
					}, each);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardList_default, {
				colNum,
				isInRewardPage,
				vListHeight,
				fixedVirtualListData,
				onSelectItem,
				onRemoveItem
			})
		]
	});
};
function mapStateToProps$4(state) {
	return {
		crm: state.crm,
		menuGroup: state.menuGroup,
		comboMenu: state.comboMenu,
		avocado: state.avocado,
		allSysConfig: state.allSysConfig,
		currentOrder: state.currentOrder,
		selfConfig: state.selfConfig
	};
}
var RewardCenter_default = withRouter(connect(mapStateToProps$4, { setTempCampaign })(withTranslation()(RewardCenter)));
//#endregion
//#region source-snapshot/src/component/CRM/Rewards/CRMReward/index.js
var CRMReward = (props) => {
	const { menuGroup, comboMenu, crm: { rewardRule, memberCRMInfo }, allSysConfig, changeSelectedDiscount, changeFreeItem, currentOrder, onNextStep, changeIgnoreReward, removeFreeItemInOrder } = props;
	const { rewardList } = useReward({
		rewardRule,
		allSysConfig,
		menuGroup,
		comboMenu,
		currentOrder
	});
	const pointBalance = (0, import_react.useMemo)(() => {
		return memberCRMInfo?.pointBalance;
	}, [memberCRMInfo]);
	(0, import_react.useEffect)(() => {
		if (Array.isArray(rewardList) && typeof pointBalance === "number") {
			if (!(pointBalance > 0 && rewardList.length > 0)) {
				changeIgnoreReward(true);
				onNextStep();
			}
		}
	}, [rewardList, pointBalance]);
	const onSelectItem = (0, import_react.useCallback)(({ rule }) => {
		if (rule.isFreeItem) changeFreeItem([rule]);
		else changeSelectedDiscount(rule);
	}, []);
	const onRemoveItem = (0, import_react.useCallback)((rule) => {
		changeFreeItem([]);
		changeSelectedDiscount({});
		const removeRule = rule?.rule?.[0];
		if (removeRule?.isFreeItem) removeFreeItemInOrder({ freeItemId: removeRule.id });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: CRMReward_module_default.innerWrapper,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardCenter_default, {
			isInRewardPage: true,
			height: window.innerHeight - remToPx(30),
			onSelectItem,
			onRemoveItem
		})
	});
};
function mapStateToProps$3(state) {
	return {
		store: state,
		crm: state.crm,
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		currentOrder: state.currentOrder,
		menuGroup: state.menuGroup,
		comboMenu: state.comboMenu,
		allSysConfig: state.allSysConfig
	};
}
var CRMReward_default = connect(mapStateToProps$3, {
	changeIgnoreReward,
	changeSelectedDiscount,
	changeFreeItem,
	changeLoginType,
	getCurrentItem,
	getCurrentCategory,
	removeFreeItemInOrder
})(withTranslation()(CRMReward));
var AdReward_module_default = { innerWrapper: "innerWrapper___DIN4a" };
//#endregion
//#region source-snapshot/src/component/CRM/Rewards/AdReward/index.js
var AdReward = (props) => {
	const { avocado, menuGroup, comboMenu, crm, adInitFinished, allSysConfig, changeSelectedDiscount, changeFreeItem, currentOrder, removeFreeItemInOrder } = props;
	const { rewards, vouchers, metaData } = avocado;
	const { rewardList, voucherList } = useReward({
		rewards,
		vouchers,
		allSysConfig,
		menuGroup,
		comboMenu,
		metaData,
		currentOrder
	});
	const pointBalance = (0, import_react.useMemo)(() => {
		return crm?.memberCRMInfo?.pointBalance;
	}, [crm.memberCRMInfo]);
	(0, import_react.useEffect)(() => {
		if (Array.isArray(rewardList) && Array.isArray(voucherList) && typeof pointBalance === "number") {
			const isShowCampaign = voucherList.length > 0 || pointBalance > 0 && rewardList.length > 0;
			adInitFinished(isShowCampaign);
		}
	}, [
		rewardList,
		voucherList,
		pointBalance
	]);
	const onSelectItem = (0, import_react.useCallback)(({ rule }) => {
		if (rule.isFreeItem) changeFreeItem([rule]);
		else changeSelectedDiscount(rule);
	}, []);
	const onRemoveItem = (0, import_react.useCallback)((rule) => {
		changeFreeItem([]);
		changeSelectedDiscount({});
		const removeRule = rule?.rule?.[0];
		if (removeRule?.isFreeItem) removeFreeItemInOrder({ freeItemId: removeRule.id });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: AdReward_module_default.innerWrapper,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardCenter_default, {
			isInRewardPage: true,
			height: window.innerHeight - remToPx(30),
			onSelectItem,
			onRemoveItem
		})
	});
};
function mapStateToProps$2(state) {
	return {
		storeTree: state,
		crm: state.crm,
		selfConfig: state.selfConfig,
		menuGroup: state.menuGroup,
		comboMenu: state.comboMenu,
		avocado: state.avocado,
		allSysConfig: state.allSysConfig,
		currentOrder: state.currentOrder
	};
}
var AdReward_default = connect(mapStateToProps$2, {
	changeIgnoreReward,
	changeSelectedDiscount,
	changeFreeItem,
	changeLoginType,
	getCurrentItem,
	getCurrentCategory,
	removeFreeItemInOrder
})(AdReward);
var SelectedRewards_module_default = {
	chosenItem: "chosenItem___zGfft",
	cartBox: "cartBox___Mh7rO",
	cart: "cart___UB2sS",
	count: "count___L35Tk",
	chosenItemWrapper: "chosenItemWrapper___dM8yp",
	orderItem: "orderItem___jrvzP",
	orderItemInfo: "orderItemInfo___JARDL",
	imgWrapper: "imgWrapper___ZzY4Z",
	ruleDiscount: "ruleDiscount___v4ePq",
	discountOff: "discountOff___qDkMD",
	contentWrapper: "contentWrapper___Fn0f7",
	itemName: "itemName___l9Zme",
	discountTxt: "discountTxt___sRME5",
	pointShow: "pointShow___SdSG0",
	pointImg: "pointImg___BMN60",
	pointText: "pointText___tZpLq",
	btn: "btn___U7AQT",
	"continue": "continue___04Hz8"
};
//#endregion
//#region source-snapshot/src/assets/images/cart-black.png
var cart_black_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/component/CRM/Rewards/SelectedRewards/index.js
var SelectedRewards = (props) => {
	const { crm: { tempCampaign }, t, i18n: { language }, selfConfig, changeFreeItem, changeSelectedDiscount, setTempCampaign } = props;
	const [chosenItemVisible, setChosenItemVisible] = (0, import_react.useState)(false);
	const item = tempCampaign?.[0] || {};
	const campaignType = (0, import_react.useMemo)(() => {
		return item.rewardRule?.redeemRule.strategy;
	}, [item]);
	const isDiscount = (0, import_react.useMemo)(() => {
		return ["byPercentageOff", "byFixedAmount"].includes(campaignType);
	}, [campaignType]);
	const isFreeItem = (0, import_react.useMemo)(() => {
		return campaignType === "byFreeItem";
	}, [campaignType]);
	const itemName = (0, import_react.useMemo)(() => {
		return item.name ? getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name : "";
	}, [item.name, language]);
	const discountTxt = (0, import_react.useMemo)(() => {
		if (!isDiscount) return;
		const { strategy, parameters: { discount } } = item?.rewardRule?.redeemRule;
		return strategy === "byPercentageOff" ? `${discount}%` : `$${discount}`;
	}, [item?.rewardRule?.redeemRule]);
	const deleteItem = () => {
		if (isDiscount) changeSelectedDiscount({});
		else if (isFreeItem) changeFreeItem([]);
		setTempCampaign(null);
		setChosenItemVisible(false);
	};
	const freeItem = () => {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: SelectedRewards_module_default.orderItemInfo,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: SelectedRewards_module_default.imgWrapper,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
					selfConfig,
					itemInfo: item
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: SelectedRewards_module_default.contentWrapper,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: SelectedRewards_module_default.itemName,
					children: itemName
				}), item.itemPoints && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: SelectedRewards_module_default.pointShow,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: SelectedRewards_module_default.pointImg,
						src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
						alt: "point"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: SelectedRewards_module_default.pointText,
						children: `${item.itemPoints} ${t("pts")}`
					})]
				})]
			})]
		});
	};
	const discountItem = () => {
		const { parameters: { points } } = item?.redeemRule;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: SelectedRewards_module_default.orderItemInfo,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: SelectedRewards_module_default.ruleDiscount,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: discountTxt }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: SelectedRewards_module_default.discountOff,
					children: t("off")
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: SelectedRewards_module_default.contentWrapper,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: SelectedRewards_module_default.itemName,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
						i18nKey: "discount_info",
						values: { discount: `$${item.actualDiscount.toFixed(2)}` },
						components: { span: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SelectedRewards_module_default.discountTxt }) }
					})
				}), points && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: SelectedRewards_module_default.pointShow,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: SelectedRewards_module_default.pointImg,
						src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
						alt: "point"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: SelectedRewards_module_default.pointText,
						children: `${points} ${t("pts")}`
					})]
				})]
			})]
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: SelectedRewards_module_default.chosenItem,
		onClick: () => setChosenItemVisible(true),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: SelectedRewards_module_default.cartBox,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				className: SelectedRewards_module_default.cart,
				src: cart_black_default,
				alt: "cart"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: SelectedRewards_module_default.count,
				children: "1"
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		visible: chosenItemVisible,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: SelectedRewards_module_default.chosenItemWrapper,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: SelectedRewards_module_default.orderItem,
				children: [isDiscount ? discountItem() : freeItem(), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: SelectedRewards_module_default.btn,
					onClick: deleteItem,
					children: t("operate-remove")
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: SelectedRewards_module_default.continue,
				onClick: () => setChosenItemVisible(false),
				children: t("continue")
			})]
		}),
		onClose: () => setChosenItemVisible(false)
	})] });
};
function mapStateToProps$1(state) {
	return {
		crm: state.crm,
		selfConfig: state.selfConfig
	};
}
var SelectedRewards_default = connect(mapStateToProps$1, {
	changeSelectedDiscount,
	changeFreeItem,
	setTempCampaign
})(withTranslation()(SelectedRewards));
//#endregion
//#region source-snapshot/src/component/CRM/Rewards/index.js
var Reward = class extends import_react.Component {
	state = {
		crmType: 0,
		AuthCodeVisible: false,
		hasAdReward: false,
		loading: false
	};
	async componentDidMount() {
		const { crm: { isIgnoreReward }, allSysConfig, isReorderFlag } = this.props;
		if (isIgnoreReward || isReorderFlag) {
			this.backToPhoneInput();
			return;
		}
		const crmType = checkCRMType(allSysConfig);
		this.setState({ crmType });
	}
	removeCRMCampaign = () => {
		const { changeFreeItem, changeSelectedDiscount, setTempCampaign, removeFreeItemInOrder, removeItemRewardInfoFromOrder, removeRewardItemFromList, currentOrder: { itemList }, crm: { tempCampaign } } = this.props;
		setTempCampaign(null);
		changeFreeItem([]);
		changeSelectedDiscount({});
		removeRewardItemFromList(getCRMCampaignId(tempCampaign?.[0]));
		removeItemRewardInfoFromOrder();
		const rewardItemInOrder = itemList.find((each) => each.isFreeItem);
		if (rewardItemInOrder) removeFreeItemInOrder({ freeItemId: rewardItemInOrder.id });
	};
	initStatus = () => {
		const { changeIgnoreReward, crm: { memberCRMInfo } } = this.props;
		const { crmType, hasAdReward } = this.state;
		let hasReward = false;
		if (crmType === 1) hasReward = Object.keys(memberCRMInfo).length;
		if (crmType === 2) hasReward = hasAdReward;
		changeIgnoreReward(!hasReward);
		this.removeCRMCampaign();
	};
	backToPhoneInput = () => {
		const { history } = this.props;
		this.initStatus();
		history.goBack();
	};
	handleSkip = () => {
		this.initStatus();
		setTimeout(() => {
			this.onNextStep();
		}, 0);
	};
	handleConfirm = () => {
		const { selfConfig, crm: { loginType, tempCampaign }, t } = this.props;
		if (!tempCampaign || !tempCampaign?.length) return toast_default.info(t("select_goods"), "top");
		const isNeedAuthCode = selfConfig?.configList?.find((each) => each.id === 37)?.value;
		if (loginType === "passive" && isNeedAuthCode) {
			this.setState({ AuthCodeVisible: true });
			return;
		}
		this.onNextStep();
	};
	adInitFinished = (hasReward) => {
		this.setState({ hasAdReward: hasReward });
		if (!hasReward) this.handleSkip();
	};
	onNextStep = async () => {
		const { history, selfConfig, systemConfig, changeFreeItem, changeSelectedDiscount, store: storeState } = this.props;
		const selectedCampaign = (native_store_default.getState().crm?.tempCampaign)?.[0];
		if (selectedCampaign) {
			const campaignType = selectedCampaign.rewardRule?.redeemRule.strategy;
			if (campaignType === "byFreeItem") changeFreeItem([selectedCampaign]);
			else if (["byPercentageOff", "byFixedAmount"].includes(campaignType)) changeSelectedDiscount(selectedCampaign);
		}
		if (selfConfig?.configMap?.id_1) {
			history.push("./enterName");
			return;
		}
		const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
		if (paymentRouteResult.shouldSkipPaymentType) {
			if (paymentRouteResult.canPayByCard) {
				if (calculateTotalAmount(storeState) === 0) {
					const { userId: kioskConfigUserId } = this.props;
					this.setState({ loading: true });
					const result = await processZeroAmountOrder({
						store: storeState,
						payByCash: this.props.payByCash,
						saveOrderResult: this.props.saveOrderResult,
						userId: null,
						checksum: null,
						kioskConfigUserId,
						onError: (errMsg) => {
							this.setState({ loading: false });
							toast_default.info(errMsg, "top");
						}
					});
					this.setState({ loading: false });
					if (result) history.push("/orderFinish");
					return;
				}
				if (isTipEnabledForPayment(selfConfig, "CREDIT_CARD")) {
					if (shouldCollectTipBeforePayment(selfConfig, "CREDIT_CARD")) history.push("/tippingPanel");
					else history.push("/cardPayment");
					return;
				}
				history.push("/cardPayment");
				return;
			} else if (paymentRouteResult.canPayByCash) {
				history.push("/paymentType");
				return;
			}
		}
		history.push("/paymentType");
	};
	renderSelectedBtn = () => {
		const { crm: { tempCampaign }, t } = this.props;
		if (!tempCampaign || !tempCampaign?.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: Reward_module_default.btnNotConfirm,
			onClick: this.handleConfirm,
			children: t("select_to_redeem")
		});
		const selectedCampaign = tempCampaign?.[0];
		const costPoints = selectedCampaign?.rewardRule?.redeemRule?.parameters?.points || selectedCampaign?.redeemRule?.parameters?.points || 0;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `${Reward_module_default.selectedBtn} linear-animate-btn`,
			onClick: this.handleConfirm,
			children: selectedCampaign?.rewardRule?.rewardType !== "voucher" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trans, {
				i18nKey: "redeem_cost_points",
				values: { points: costPoints },
				components: { star: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: Reward_module_default.star }) }
			}) : t("membership-point-redeem-menu")
		});
	};
	render() {
		const { crm: { memberCRMInfo, tempCampaign }, changeLoginType, t } = this.props;
		const { AuthCodeVisible, crmType } = this.state;
		const phoneNum = memberCRMInfo?.phone?.slice(-10);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: Reward_module_default.rewardContainer,
			children: [
				crmType === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CRMReward_default, {
					crmType,
					onNextStep: this.onNextStep
				}) : crmType === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdReward_default, {
					crmType,
					adInitFinished: this.adInitFinished
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: Reward_module_default.bottom,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: Reward_module_default.skipBtn,
						onClick: this.handleSkip,
						children: t("skip")
					}), this.renderSelectedBtn()]
				}),
				tempCampaign?.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectedRewards_default, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: AuthCodeVisible,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendAuthCode_default, {
						t,
						phoneNum,
						goBackStep: () => {
							this.setState({ AuthCodeVisible: false });
						},
						onVerifySuccess: () => {
							changeLoginType("active");
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: this.state.loading })
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		crm: state.crm,
		selfConfig: state.selfConfig,
		systemConfig: state.systemConfig,
		allSysConfig: state.allSysConfig,
		userId: state.sysCookie.kioskConfigUserId,
		currentOrder: state.currentOrder,
		isReorderFlag: state.orderEdit.isReorderFlag
	};
}
var Rewards_default = withRouter(connect(mapStateToProps, {
	changeIgnoreReward,
	changeSelectedDiscount,
	changeFreeItem,
	setTempCampaign,
	removeFreeItemInOrder,
	removeItemRewardInfoFromOrder,
	removeRewardItemFromList,
	changeLoginType,
	payByCash,
	saveOrderResult
})(withTranslation()(Reward)));
//#endregion
export { Rewards_default as default };
