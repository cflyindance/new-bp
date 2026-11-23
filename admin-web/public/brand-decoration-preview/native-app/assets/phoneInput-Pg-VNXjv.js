import { d as __toESM, i as require_react, n as require_jsx_runtime, t as toast_default } from "./toast-C8a1ReSo.js";
import { D as posFrontLog, G as require_dayjs_min, M as saveCustomerInfo, a as getDeviceOrientation, m as subscribeDeviceOrientation, s as isOpenVtkeyboadrd } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { t as Dialog } from "./dialog-B9IyI7AU.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { $n as setCRMMemberInfo, Bt as setIsReorderFlag, Cr as judgeConfigToSoldout, G as payByCash, Gr as getOrderInfoObj, Jn as changeLoginType, Tr as judgeNeedPayOtherCharge, Ut as setLanModal, W as payByCard, Xr as checkCRMStatus, an as setSelfConfig, da as require_cloneDeep, er as setEarnRule, ir as setOnboardGiftRule, lr as calcCardMinAmout, nr as setIsMemberOrderedBefore, pt as saveOrderResult, qn as changeIgnoreReward, rr as setMemberStatus, w as customer, wn as spliceOrderBySoldout, yi as checkCRMType } from "./actions-BwRPwnFF.js";
import { b as getPointRule, d as getCRMMemberInfo, i as createCRMMember, k as searchCRMMember, r as checkIsFirstOrder, y as getOnboardGiftRule } from "./kioskConfigApi-68IKDHob.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { c as setCustomerVouchers, o as setCRMCustomerInfo } from "./orderLock-9vtPVs0P.js";
import { t as VtKeyboard } from "./VtKeyboard-THFka-J_.js";
import { t as Loading } from "./loading-Bt-GUn0C.js";
import { t as LottiePlayer } from "./LottiePlayer-CG-ciSfh.js";
import { n as PhoneBlacklistDialog, t as syncLandscapeKeyboardManager } from "./syncLandscapeKeyboardManager-LlkmTrOt.js";
import { t as crmIntegration } from "./crm-integration-DyFhn08j.js";
import { a as isPhoneBlacklisted, o as isValidUSPhone, r as getUSPhoneDigits, s as normalizePhoneDigits, t as formatUSPhoneInput } from "./phoneNumber-CPrZu7TP.js";
import { t as PhoneNumberEntryLayout } from "./PhoneNumberEntryLayout-DWDXd7Tb.js";
import { t as useReward } from "./useReward-66fh7KJZ.js";
import { n as imgCard_default } from "./star-C6iOuR53.js";
import { n as processZeroAmountOrder, t as calculateTotalAmount } from "./processZeroAmountOrder-bzVRsrOO.js";
import { t as handlePaymentTypeRoute } from "./handlePaymentTypeRoute-sndK_wYc.js";
import { o as shouldCollectTipBeforePayment, r as isTipEnabledForPayment } from "./tipPaymentMethods-DcvlIwUR.js";
import { t as soldoutModal_default } from "./soldoutModal-CCd1O5t5.js";
import { t as cardMinAmount_default } from "./cardMinAmount-DfJqO2k_.js";
import { t as judgeOnlyHaveFreeItem } from "./judgeOnlyHaveFreeItem-Bgp5tyri.js";
import { t as coin_smile_default } from "./coin_smile-DXCmPg65.js";
//#region source-snapshot/src/container/phoneInput/phoneInput.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var phoneInput_module_default = {
	phoneInputPage: "phoneInputPage___KM15i",
	numPadContainer: "numPadContainer___-jQeZ",
	never: "never___cxSDJ",
	btnConfirm: "btnConfirm___wH7C3",
	btnNoConfirm: "btnNoConfirm___7glLx",
	containerBox: "containerBox___O9a9-",
	itemBox: "itemBox___QHMNZ",
	itemName: "itemName___OhZAL",
	subItemName: "subItemName___OetUj",
	btnBox: "btnBox___eoRG0"
};
var NewMemberGift_module_default = {
	containerBox: "containerBox___svNOU",
	welCome: "welCome___ODuZ-",
	welComeContent: "welComeContent___QfsAP",
	welComeSub: "welComeSub___Xs8Hg",
	swipeImageBx: "swipeImageBx___92Mzm",
	desc: "desc___Hfzp0",
	rewardBlock: "rewardBlock___EQDfE",
	point: "point___UFFGH",
	voucherBlock: "voucherBlock___Lb7dK",
	voucherList: "voucherList___GBI3v",
	voucherItem: "voucherItem___XB5rK",
	voucher: "voucher___NQ0Xg",
	voucherContent: "voucherContent___E3ruQ",
	voucherExpire: "voucherExpire___QvJXS",
	voucherMinSpend: "voucherMinSpend___DUCHp",
	voucherName: "voucherName___T7Bwt",
	voucherImg: "voucherImg___LecJu",
	count: "count___azS71",
	countShow: "countShow___xNORA",
	pointImg: "pointImg___0-b7L",
	pointNum: "pointNum___G2ljX",
	pointTxt: "pointTxt___iZgQX",
	btnSubmit: "btnSubmit___gbeW1",
	clickImageBx: "clickImageBx___-VmHr"
};
var check2_default = {
	nm: "Comp 1",
	h: 150,
	w: 150,
	meta: {
		"g": "@lottiefiles/toolkit-js 0.21.1",
		"tc": "#ffffff"
	},
	layers: [
		{
			"ty": 4,
			"nm": "ring 3",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						75,
						75,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Oval 2",
				"it": [
					{
						"ty": "el",
						"nm": "Ellipse Path 1",
						"d": 1,
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 10
						},
						"c": {
							"a": 0,
							"k": [
								.165,
								.157,
								.133
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .438,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [0],
						"t": 13
					}, {
						"s": [83],
						"t": 32
					}]
				},
				"o": {
					"a": 1,
					"k": [{
						"o": {
							"x": .438,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [-84],
						"t": 13
					}, {
						"s": [84],
						"t": 32
					}]
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 1
		},
		{
			"ty": 4,
			"nm": "ring 2",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						75,
						75,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Oval 2",
				"it": [
					{
						"ty": "el",
						"nm": "Ellipse Path 1",
						"d": 1,
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 9
						},
						"c": {
							"a": 0,
							"k": [
								.165,
								.157,
								.133
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .576,
							"y": 0
						},
						"i": {
							"x": .396,
							"y": 1
						},
						"s": [0],
						"t": 8
					}, {
						"s": [83],
						"t": 25
					}]
				},
				"o": {
					"a": 1,
					"k": [{
						"o": {
							"x": .576,
							"y": 0
						},
						"i": {
							"x": .396,
							"y": 1
						},
						"s": [-84],
						"t": 8
					}, {
						"s": [84],
						"t": 25
					}]
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 2
		},
		{
			"ty": 4,
			"nm": "ring",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						75,
						75,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Oval 2",
				"it": [
					{
						"ty": "el",
						"nm": "Ellipse Path 1",
						"d": 1,
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 9
						},
						"c": {
							"a": 0,
							"k": [
								.851,
								.851,
								.851
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .576,
							"y": 0
						},
						"i": {
							"x": .396,
							"y": 1
						},
						"s": [0],
						"t": 0
					}, {
						"s": [83],
						"t": 20
					}]
				},
				"o": {
					"a": 1,
					"k": [{
						"o": {
							"x": .576,
							"y": 0
						},
						"i": {
							"x": .396,
							"y": 1
						},
						"s": [-84],
						"t": 0
					}, {
						"s": [84],
						"t": 20
					}]
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 3
		},
		{
			"ty": 4,
			"nm": "check 3",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						49.5,
						27.86,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Group 1",
				"it": [
					{
						"ty": "sh",
						"nm": "Path 1",
						"d": 1,
						"ks": {
							"a": 0,
							"k": {
								"c": false,
								"i": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"o": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"v": [
									[0, 41.96],
									[22.41, 64.35],
									[83.63, 0]
								]
							}
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 10
						},
						"c": {
							"a": 0,
							"k": [
								.165,
								.157,
								.133
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .257,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [0],
						"t": 20
					}, {
						"s": [100],
						"t": 37
					}]
				},
				"o": {
					"a": 0,
					"k": 0
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 4
		},
		{
			"ty": 4,
			"nm": "check 2",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						49.5,
						27.86,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Group 1",
				"it": [
					{
						"ty": "sh",
						"nm": "Path 1",
						"d": 1,
						"ks": {
							"a": 0,
							"k": {
								"c": false,
								"i": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"o": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"v": [
									[0, 41.96],
									[22.41, 64.35],
									[83.63, 0]
								]
							}
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 10
						},
						"c": {
							"a": 0,
							"k": [
								.165,
								.157,
								.133
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .257,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [0],
						"t": 16
					}, {
						"s": [100],
						"t": 34
					}]
				},
				"o": {
					"a": 0,
					"k": 0
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 5
		},
		{
			"ty": 4,
			"nm": "check",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 0,
					"k": [
						100,
						100,
						100
					]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						49.5,
						27.86,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 100
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Group 1",
				"it": [
					{
						"ty": "sh",
						"nm": "Path 1",
						"d": 1,
						"ks": {
							"a": 0,
							"k": {
								"c": false,
								"i": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"o": [
									[0, 0],
									[0, 0],
									[0, 0]
								],
								"v": [
									[0, 41.96],
									[22.41, 64.35],
									[83.63, 0]
								]
							}
						}
					},
					{
						"ty": "st",
						"nm": "Stroke 1",
						"lc": 2,
						"lj": 2,
						"ml": 1,
						"o": {
							"a": 0,
							"k": 100
						},
						"w": {
							"a": 0,
							"k": 9
						},
						"c": {
							"a": 0,
							"k": [
								.851,
								.851,
								.851
							]
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}, {
				"ty": "tm",
				"nm": "Trim Paths 1",
				"e": {
					"a": 1,
					"k": [{
						"o": {
							"x": .257,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [0],
						"t": 12
					}, {
						"s": [100],
						"t": 29
					}]
				},
				"o": {
					"a": 0,
					"k": 0
				},
				"s": {
					"a": 0,
					"k": 0
				},
				"m": 1
			}],
			"ind": 6
		},
		{
			"ty": 4,
			"nm": "boom",
			"sr": 1,
			"st": 0,
			"op": 125,
			"ip": 0,
			"hasMask": false,
			"ao": 0,
			"ks": {
				"a": {
					"a": 0,
					"k": [
						0,
						0,
						0
					]
				},
				"s": {
					"a": 1,
					"k": [{
						"o": {
							"x": 0,
							"y": 0
						},
						"i": {
							"x": 0,
							"y": 1
						},
						"s": [
							0,
							0,
							100
						],
						"t": 10
					}, {
						"s": [
							100,
							100,
							100
						],
						"t": 42
					}]
				},
				"sk": {
					"a": 0,
					"k": 0
				},
				"p": {
					"a": 0,
					"k": [
						75,
						75,
						0
					]
				},
				"r": {
					"a": 0,
					"k": 0
				},
				"sa": {
					"a": 0,
					"k": 0
				},
				"o": {
					"a": 0,
					"k": 10
				}
			},
			"ef": [],
			"shapes": [{
				"ty": "gr",
				"nm": "Oval 2 Copy",
				"it": [
					{
						"ty": "el",
						"nm": "Ellipse Path 1",
						"d": 1,
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [150, 150]
						}
					},
					{
						"ty": "fl",
						"nm": "Fill 1",
						"c": {
							"a": 0,
							"k": [
								.851,
								.851,
								.851
							]
						},
						"r": 1,
						"o": {
							"a": 0,
							"k": 100
						}
					},
					{
						"ty": "tr",
						"a": {
							"a": 0,
							"k": [0, 0]
						},
						"s": {
							"a": 0,
							"k": [100, 100]
						},
						"sk": {
							"a": 0,
							"k": 0
						},
						"p": {
							"a": 0,
							"k": [0, 0]
						},
						"r": {
							"a": 0,
							"k": 0
						},
						"sa": {
							"a": 0,
							"k": 0
						},
						"o": {
							"a": 0,
							"k": 100
						}
					}
				]
			}],
			"ind": 7
		}
	],
	v: "5.1.1",
	fr: 25,
	op: 42,
	ip: 0,
	assets: []
};
//#endregion
//#region source-snapshot/src/component/CRM/LoginCRM/components/NewMemberGift.js
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min());
var import_jsx_runtime = require_jsx_runtime();
var countMin = 1;
var NewMemberGift = (props) => {
	const { visible, t, allSysConfig, selfConfig, currentOrder, avocado, onboardGiftRule, handleConfirm, menuGroup, comboMenu, crm: { rewardRule } } = props;
	const { rewards, vouchers, metaData } = avocado;
	const points = onboardGiftRule?.data?.[0]?.giftContent?.number || 0;
	const [isClicked, setIsClicked] = (0, import_react.useState)(false);
	const [smileComplete, setSmileComplete] = (0, import_react.useState)(false);
	const [isShowCount, setIsShowCount] = (0, import_react.useState)(false);
	const [kioskVoucherList, setKioskVoucherList] = (0, import_react.useState)([]);
	const timeoutRefs = (0, import_react.useRef)([]);
	const handleClaim = () => {
		setIsClicked(true);
	};
	const handleSmileComplete = () => {
		setSmileComplete(true);
		if (kioskVoucherList.some((item) => {
			const { voucherRules } = item;
			const { quantity = 1 } = voucherRules || {};
			return quantity > countMin;
		})) {
			const timeout1 = setTimeout(() => {
				setIsShowCount(true);
			}, 1500);
			const timeout2 = setTimeout(() => {
				vourcherListRolling();
			}, 2600);
			timeoutRefs.current = [timeout1, timeout2];
		} else {
			const timeout = setTimeout(() => {
				vourcherListRolling();
			}, 800);
			timeoutRefs.current = [timeout];
		}
	};
	(0, import_react.useEffect)(() => {
		return () => {
			timeoutRefs.current.forEach((timeoutId) => {
				if (timeoutId) clearTimeout(timeoutId);
			});
			timeoutRefs.current = [];
		};
	}, []);
	const vourcherListRolling = () => {
		const voucherListElement = document.querySelector(`.${NewMemberGift_module_default.voucherList}`);
		if (!voucherListElement) return;
		const maxScrollTop = voucherListElement.scrollHeight - voucherListElement.clientHeight;
		if (maxScrollTop <= 0) return;
		voucherListElement.scrollTop = 0;
		const duration = 300;
		const startTime = Date.now();
		const startScrollTop = 0;
		const endScrollTop = maxScrollTop;
		const animateScroll = () => {
			const elapsed = Date.now() - startTime;
			if (elapsed >= duration) {
				voucherListElement.scrollTop = endScrollTop;
				return;
			}
			const progress = elapsed / duration;
			const easeOutCubic = 1 - Math.pow(1 - progress, 3);
			const currentScrollTop = startScrollTop + (endScrollTop - startScrollTop) * easeOutCubic;
			voucherListElement.scrollTop = currentScrollTop;
			requestAnimationFrame(animateScroll);
		};
		requestAnimationFrame(animateScroll);
	};
	const handleClickComplete = () => {
		handleConfirm();
	};
	const { voucherList } = useReward({
		rewards,
		vouchers,
		allSysConfig,
		menuGroup,
		comboMenu,
		metaData,
		rewardRule,
		currentOrder
	});
	(0, import_react.useEffect)(() => {
		if (!Array.isArray(voucherList)) return;
		setKioskVoucherList(voucherList);
	}, [voucherList]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		outerStyle: { background: "rgba(0, 0, 0, 0.8)" },
		visible,
		html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: NewMemberGift_module_default.containerBox,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: NewMemberGift_module_default.welCome,
					children: t("crm_gift_title")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: NewMemberGift_module_default.welComeContent,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: NewMemberGift_module_default.welComeSub,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: NewMemberGift_module_default.swipeImageBx,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, {
									speed: .6,
									animationData: coin_smile_default,
									loop: false,
									onComplete: handleSmileComplete
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: NewMemberGift_module_default.desc,
								children: t("crm_gift_welcome_text")
							}),
							!kioskVoucherList.length > 0 && points > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: NewMemberGift_module_default.point,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
										alt: "point",
										className: NewMemberGift_module_default.pointImg
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: NewMemberGift_module_default.pointNum,
										children: points
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: NewMemberGift_module_default.pointTxt,
										children: t("pts")
									})
								]
							})
						]
					}), kioskVoucherList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: NewMemberGift_module_default.rewardBlock,
						children: [points > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: NewMemberGift_module_default.point,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==",
									alt: "point",
									className: NewMemberGift_module_default.pointImg
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: NewMemberGift_module_default.pointNum,
									children: onboardGiftRule?.data?.[0]?.giftContent?.number
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: NewMemberGift_module_default.pointTxt,
									children: t("pts")
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: NewMemberGift_module_default.voucherBlock,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `${NewMemberGift_module_default.voucherList}`,
								children: kioskVoucherList.map((item, index) => {
									const { name, useEndTime, voucherRules, extSkuMapping } = item;
									const { minSpend = 0, quantity = 1 } = voucherRules || {};
									const expires = useEndTime ? t("voucher_period", { value: (0, import_dayjs_min.default)(useEndTime).format("YYYY/MM/DD") }) : t("permanently_voucher");
									const threshold = minSpend ? t("use_voucher_condition", { value: `$${minSpend}` }) : t("all_order_voucher");
									const isItem = extSkuMapping?.length > 0;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: NewMemberGift_module_default.voucherItem,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: NewMemberGift_module_default.voucher,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: NewMemberGift_module_default.voucherContent,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: NewMemberGift_module_default.voucherExpire,
														children: expires
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: NewMemberGift_module_default.voucherName,
														children: name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: NewMemberGift_module_default.voucherMinSpend,
														children: threshold
													})
												]
											}), isItem && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: NewMemberGift_module_default.voucherImg,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(imgCard_default, {
													selfConfig,
													itemInfo: extSkuMapping[0]
												})
											})]
										}), quantity > countMin && smileComplete && isShowCount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `${NewMemberGift_module_default.count} ${isShowCount ? NewMemberGift_module_default.countShow : ""}`,
											children: ["X ", quantity]
										})]
									}, index);
								})
							})
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					onClick: handleClaim,
					className: `${NewMemberGift_module_default.btnSubmit} linear-animate-btn`,
					children: isClicked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: NewMemberGift_module_default.clickImageBx,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LottiePlayer, {
							animationData: check2_default,
							loop: false,
							onComplete: handleClickComplete
						})
					}) : t("crm_gift_continue")
				})
			]
		})
	});
};
var mapStateToProps$1 = (state) => {
	return {
		crm: state.crm,
		allSysConfig: state.allSysConfig,
		selfConfig: state.selfConfig,
		avocado: state.avocado,
		menuGroup: state.menuGroup,
		comboMenu: state.comboMenu,
		currentOrder: state.currentOrder
	};
};
var NewMemberGift_default = connect(mapStateToProps$1)(withTranslation()(NewMemberGift));
//#endregion
//#region source-snapshot/src/container/phoneInput/index.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var PhoneInput = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			saveNumber: "",
			customNumber: "",
			isPhoneValid: false,
			isHasSoldoutDish: false,
			dishMap: {},
			errorLoading: false,
			showPhoneBlacklist: false,
			isShowCardMinModal: false,
			currentAmount: 0,
			isPrivacyConfirm: false,
			loading: false,
			showNewMemberGift: false,
			resolveNewMemberGift: null,
			keyboardToggle: false,
			deviceOrientation: getDeviceOrientation()
		};
		this.phoneInputRef = null;
		this.keyboardManager = null;
		this.unsubscribeOrientation = null;
	}
	handleOrientationChange = (orientation) => {
		if (orientation === this.state.deviceOrientation) return;
		this.setState({ deviceOrientation: orientation }, () => {
			syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
		});
	};
	handleCancel = () => {
		this.setState({ errorLoading: false });
	};
	handleRetry = () => {
		this.savePhoneNumber(this.state.saveNumber);
	};
	backBtnHandler = () => {
		this.props.history.goBack();
	};
	judgeConfigToSoldout = (fn) => {
		judgeConfigToSoldout(fn, {
			setSelfConfig: this.props.setSelfConfig,
			setState: this.setState.bind(this),
			showApiModalTip: this.logApiError,
			reorder: this.reorder
		});
	};
	logApiError = (errMsg) => {
		posFrontLog(`phoneInput API error: ${errMsg || "Unknown error"}`).catch((error) => console.log("phoneInput 错误日志记录失败:", error));
	};
	showNewMemberGiftAndWait = () => {
		return new Promise((resolve) => {
			this.setState({
				loading: false,
				showNewMemberGift: true,
				resolveNewMemberGift: resolve
			});
		});
	};
	handleCloseNewMemberGift = () => {
		this.setState({ showNewMemberGift: false });
		if (this.state.resolveNewMemberGift) {
			this.state.resolveNewMemberGift();
			this.setState({ resolveNewMemberGift: null });
		}
	};
	checkIsMemberOrderedBefore = async (number) => {
		const noCountryCodeNumber = number.slice(-10);
		try {
			const res = await checkIsFirstOrder(noCountryCodeNumber);
			const isMemberOrdered = res?.data?.data === null ? true : res?.data?.data;
			this.props.setIsMemberOrderedBefore(isMemberOrdered);
		} catch (e) {
			console.log("checkIsFirstOrder接口调用失败:", e);
			this.props.setIsMemberOrderedBefore(true);
		}
	};
	saveCustomerInfoToOrder = async (number) => {
		const { currentOrder } = this.props;
		try {
			let firstName = currentOrder.customer?.firstName || "";
			const customerInfo = {
				id: "",
				firstName,
				phone: [{
					id: "",
					number
				}]
			};
			this.props.customer(customerInfo);
			const { data: { result, customer } } = await saveCustomerInfo(number, "");
			if (result.successful) {
				const customerInfo = {
					id: customer.id,
					firstName,
					phone: [{
						id: customer.phone[0].id,
						number
					}]
				};
				this.props.customer(customerInfo);
				return true;
			}
			return false;
		} catch (error) {
			console.log("saveCustomerInfoToOrder 失败:", error);
			return false;
		}
	};
	savePhoneNumber = async (number) => {
		if (this.rejectBlacklistedPhone(number)) return;
		try {
			if (!await this.saveCustomerInfoToOrder(number)) {
				this.setState({ errorLoading: true });
				return;
			}
			const crmRes = await this.checkCRMInfo(number);
			await this.checkIsMemberOrderedBefore(number);
			if (crmRes) {
				const { crm: { isNewMember, loginType }, changeIgnoreReward } = this.props;
				let onboardGiftRule = {};
				if (isNewMember) onboardGiftRule = await this.fetchOnboardGiftRule();
				if (loginType !== "active" && isNewMember && onboardGiftRule?.onboardGift && onboardGiftRule?.data?.[0]?.giftContent?.number > 0) await this.showNewMemberGiftAndWait();
				const goReward = this.goRewardAble(crmRes);
				const onBeforeJudge = (onNewMemberGo) => {
					if (goReward) {
						changeIgnoreReward(false);
						this.handleGotoRewards();
						return;
					}
					onNewMemberGo();
				};
				this.judgeAfterOperation(onBeforeJudge);
			} else this.judgeAfterOperation();
		} catch (error) {
			this.setState({ errorLoading: true });
		} finally {
			this.setState({ loading: false });
		}
	};
	checkCRMInfo = async (phone) => {
		const { allSysConfig, crm: { memberCRMInfo, loginType }, changeLoginType } = this.props;
		if (memberCRMInfo && Object.keys(memberCRMInfo)?.length > 0 && loginType === "active") return true;
		if (checkCRMStatus(allSysConfig)) return false;
		this.setState({ loading: true });
		changeLoginType("passive");
		if (checkCRMType(allSysConfig) === 2) return await this.getADMemberInfo(phone);
		const res = await this.searchIsInCRM(phone);
		if (!res) return false;
		if (Object.keys(res)?.length > 0) return res;
		if (this.props.selfConfig?.configMap?.id_71 === true) {
			this.props.changeLoginType(null);
			this.props.setMemberStatus(false);
			return false;
		}
		const createRes = await this.createCRM(phone);
		if (createRes) {
			const { userId } = createRes;
			return await this.fetchCRMMemberInfo(userId);
		}
		return false;
	};
	getCustomerAssets = async (customerId) => {
		try {
			const assetsRes = await crmIntegration.getCustomerAssets(customerId);
			if (assetsRes.data?.success) {
				this.props.setCustomerVouchers(assetsRes.data.data.vouchers || []);
				return assetsRes.data.data.loyaltyAccount.pointBalance;
			}
			return 0;
		} catch (e) {
			this.setState({ loading: false });
			throw new Error(e);
		}
	};
	getADMemberInfo = async (phone) => {
		try {
			const data = {
				areaCode: 1,
				phone
			};
			const { setCRMMemberInfo, setMemberStatus, setCRMCustomerInfo } = this.props;
			const res = await crmIntegration.searchCustomers(data);
			if (res.data?.success) if (res?.data?.data?.length > 0) {
				const customerInfo = res?.data?.data?.[0];
				setCRMCustomerInfo(customerInfo);
				const customerId = customerInfo?.id;
				const memberInfo = {
					...customerInfo,
					userId: customerId
				};
				if (customerId) {
					memberInfo.pointBalance = await this.getCustomerAssets(customerId);
					setMemberStatus(false);
					setCRMMemberInfo(memberInfo);
					posFrontLog(`login -phoneInput- -not NewMember- -AD-  id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
               phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`);
					return memberInfo;
				}
			} else {
				if (this.props.selfConfig?.configMap?.id_71 === true) {
					this.props.changeLoginType(null);
					setMemberStatus(false);
					return false;
				}
				setMemberStatus(true);
				return await this.createADMember(phone);
			}
			this.logApiError(res?.data?.message || "failed to get member info");
		} catch (e) {
			console.log(e);
			this.setState({ loading: false });
			this.logApiError(e?.message || "failed to get member info");
		}
		return false;
	};
	createADMember = async (phone) => {
		try {
			const data = {
				areaCode: 1,
				phone,
				channelCode: "KIOSK"
			};
			const res = await crmIntegration.createNewCustomer(data);
			if (res.data?.success) {
				const id = res.data.data;
				return await this.fetchMemberInfoViaId(id);
			}
			this.logApiError(res.data.errorMessage || "failed to create new member");
			return false;
		} catch (e) {
			this.logApiError(e.response?.data?.errorMessage || e.message || "Network Error");
			this.setState({ loading: false });
			return false;
		}
	};
	fetchMemberInfoViaId = async (userId) => {
		try {
			const { setCRMMemberInfo, setCRMCustomerInfo } = this.props;
			const customerRes = await crmIntegration.getCustomerInfo(userId);
			if (customerRes.data?.success) {
				const customerInfo = customerRes?.data?.data;
				setCRMCustomerInfo(customerInfo);
				const customerId = customerInfo?.id;
				const memberInfo = {
					...customerInfo,
					userId: customerId
				};
				if (customerId) {
					memberInfo.pointBalance = await this.getCustomerAssets(customerId);
					setCRMMemberInfo(memberInfo);
					posFrontLog(`login -phoneInput- -AD- id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
             phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`);
					return true;
				}
			}
			this.logApiError(customerRes.data?.message || "failed to fetch member via id");
			return false;
		} catch (e) {
			console.log(e);
			return false;
		}
	};
	searchIsInCRM = async (phone) => {
		const searchParams = {
			pageNo: 1,
			pageSize: 15,
			searchField: "phone",
			searchKey: `${phone}`
		};
		const { setCRMMemberInfo, setMemberStatus } = this.props;
		const res = await searchCRMMember(searchParams);
		if (res.status === 200 && res.data.code === 0) {
			if (res.data.data?.total > 0) {
				setCRMMemberInfo(res.data.data?.data?.[0]);
				setMemberStatus(false);
				posFrontLog(`login -phoneInput- -not NewMember- -CRM-  id: ${res.data.data?.data?.[0]?.id} --- userId: ${res.data.data?.data?.[0]?.userId} ---  
           phone: ${res.data.data?.data?.[0]?.phone} --- pointBalance: ${res.data.data?.data?.[0]?.pointBalance}`);
				return res.data.data?.data?.[0];
			}
			setMemberStatus(true);
			return {};
		}
		this.logApiError(res.data?.msg);
	};
	createCRM = async (phone) => {
		const res = await createCRMMember({
			firstname: "",
			lastname: "",
			phone,
			email: ""
		});
		if (res.status === 200 && res.data.code === 0) return res.data.data;
		this.logApiError(res.data?.msg);
	};
	fetchCRMMemberInfo = async (userId) => {
		const res = await getCRMMemberInfo(userId);
		if (res.status === 200 && res.data.code === 0) {
			this.props.setCRMMemberInfo(res.data.data);
			posFrontLog(`login -phoneInput- -CRM-  id: ${res.data.data?.id} --- userId: ${res.data.data?.userId} ---  
         phone: ${res.data.data?.phone} --- pointBalance: ${res.data.data?.pointBalance}`);
			return true;
		}
		this.logApiError(res.data?.msg);
		return false;
	};
	fetchOnboardGiftRule = async () => {
		const { crm: { memberCRMInfo } } = this.props;
		try {
			const res = await getOnboardGiftRule();
			if (res.status === 200 && res.data.code === 0) {
				this.props.setOnboardGiftRule(res.data.data);
				return res.data.data;
			}
		} catch (e) {}
		let onboardGift = {
			onboardGift: memberCRMInfo.pointBalance > 0,
			data: [{ giftContent: { number: memberCRMInfo.pointBalance } }]
		};
		this.props.setOnboardGiftRule(onboardGift);
		return onboardGift;
	};
	handleGotoRewards = (useReplace = false) => {
		if (useReplace) this.props.history.replace("./reward");
		else this.props.history.push("./reward");
	};
	judgeAfterOperation = async (onBeforeJudge) => {
		const { selfConfig, store, payByCash, saveOrderResult, systemConfig } = this.props;
		const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
		const needPayForCharge = judgeNeedPayOtherCharge();
		if (selfConfig?.configMap?.id_1) {
			if (onBeforeJudge) {
				onBeforeJudge?.(() => this.props.history.push("./enterName"));
				return;
			}
			this.props.history.push("./enterName");
		} else {
			const totalAmount = calculateTotalAmount(store);
			if (onlyHaveFreeItem && !needPayForCharge || totalAmount === 0) {
				const handleOverOrder = async () => {
					const { userId: kioskConfigUserId } = this.props;
					this.setState({ loading: true });
					const result = await processZeroAmountOrder({
						store,
						payByCash,
						saveOrderResult,
						userId: null,
						checksum: null,
						kioskConfigUserId,
						onError: (errMsg) => {
							this.setState({ loading: false });
							this.logApiError(errMsg);
						}
					});
					this.setState({ loading: false });
					if (result) this.props.history.push("/orderFinish");
				};
				this.judgeConfigToSoldout(() => {
					if (onBeforeJudge) {
						onBeforeJudge?.(() => {
							if (totalAmount === 0) handleOverOrder();
							else this.props.history.push("/paymentType");
						});
						return;
					}
					if (totalAmount === 0) handleOverOrder();
					else this.props.history.push("/paymentType");
				});
			} else {
				const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
				if (paymentRouteResult.shouldSkipPaymentType) {
					if (paymentRouteResult.canPayByCard) {
						this.props.payByCard();
						if (isTipEnabledForPayment(selfConfig, "CREDIT_CARD")) {
							const fn = () => {
								if (!shouldCollectTipBeforePayment(selfConfig, "CREDIT_CARD")) this.judgeConfigToSoldout(() => this.judgeFillCardMinAmout(onBeforeJudge));
								else this.props.history.push("/tippingPanel");
							};
							if (onBeforeJudge) {
								onBeforeJudge(fn);
								return;
							}
							fn();
						} else this.judgeConfigToSoldout(() => this.judgeFillCardMinAmout(onBeforeJudge));
					} else if (paymentRouteResult.canPayByCash) {
						const fn = () => {
							this.props.history.push("/paymentType");
						};
						if (onBeforeJudge) {
							onBeforeJudge(fn);
							return;
						}
						fn();
					}
				} else {
					const fn = () => {
						this.props.history.push("/paymentType");
					};
					if (onBeforeJudge) {
						onBeforeJudge(fn);
						return;
					}
					fn();
				}
			}
		}
	};
	judgeFillCardMinAmout = (onBeforeJudge) => {
		if (calcCardMinAmout()) this.setState({
			isShowCardMinModal: true,
			currentAmount: calcCardMinAmout()
		});
		else {
			if (onBeforeJudge) {
				onBeforeJudge?.(() => this.props.history.push("/cardPayment"));
				return;
			}
			this.props.history.push("/cardPayment");
		}
	};
	handleContinueOrder = () => {
		this.setState({ isShowCardMinModal: false });
		this.reorder(true);
	};
	handleCloseMin = () => {
		this.setState({ isShowCardMinModal: false });
	};
	reorder = (immediateBack = false) => {
		if (!immediateBack) {
			if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		}
		this.setState({ isHasSoldoutDish: false });
		this.props.setIsReorderFlag(true);
		setTimeout(() => {
			this.backBtnHandler();
		}, 0);
	};
	continueReorder = () => {
		const { currentOrder } = this.props;
		if (this?.state?.dishMap?.allSoldIds?.length) this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
		this.setState({ isHasSoldoutDish: false });
		setTimeout(() => {
			if (currentOrder.customer.phone[0]?.number && currentOrder.customer.phone[0]?.id) this.savePhoneNumber(this.state.saveNumber);
			else {
				this.props.customer({ phone: [{}] });
				this.judgeAfterOperation();
			}
		}, 0);
	};
	componentDidMount() {
		this.handleGetPointRule();
		const { isReorderFlag, crm: { memberCRMInfo, loginType }, history } = this.props;
		if (isReorderFlag) {
			this.backBtnHandler();
			return;
		}
		if (memberCRMInfo && Object.keys(memberCRMInfo)?.length > 0) {
			if (history.action === "POP") {
				this.backBtnHandler();
				return;
			}
			this.setState({ loading: true });
			this.handleSkipWithCustomerInfo(memberCRMInfo);
			return;
		}
		this.handleGetDefaultPhone();
		const privacyConfirm = Object.keys(memberCRMInfo)?.length > 0 || this.props.selfConfig?.configMap?.id_49;
		this.setState({ isPrivacyConfirm: privacyConfirm });
		syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
		this.unsubscribeOrientation = subscribeDeviceOrientation(this.handleOrientationChange);
	}
	handleGetPointRule = async () => {
		const res = await getPointRule();
		try {
			if (res.status === 200 && res.data.code === 0) {
				const { data } = res.data;
				const pointRule = data?.[0];
				if (!pointRule) return;
				const earningRule = {
					earningStrategy: pointRule?.rule?.strategy === "byAmountSpent" ? 1 : pointRule?.rule?.strategy === "byItemQuantity" ? 3 : 2,
					parameters: pointRule.rule.parameters,
					minimunPurchase: pointRule.minimunPurchase,
					includeTax: pointRule.spentAmountIncludeTax.enabled,
					expiration: pointRule.expiration,
					rounding: 1
				};
				if (pointRule?.roundingPoints?.enabled) {
					const allRoundType = [
						"Round off",
						"Round up",
						"Round down"
					];
					const roundType = pointRule.roundingPoints.roundingType;
					earningRule.rounding = allRoundType.findIndex((each) => each === roundType) + 1;
				}
				if (pointRule?.rule?.strategy === "byItemQuantity") {
					earningRule.eligibleCondition = pointRule?.eligibility?.condition === "ALL" ? 1 : pointRule?.eligibility?.condition === "SELECTED" ? 2 : 3;
					earningRule.eligibleFreeItems = !!pointRule?.freeItemEligibleEarnPoints?.enabled;
					earningRule.eligibleCategories = pointRule?.eligibility?.objects?.categories.map((item) => {
						return {
							id: item.menuCategoryId,
							orderType: item.orderType,
							merchantId: item.merchantId
						};
					});
					earningRule.eligibleItems = pointRule?.eligibility?.objects?.items;
				}
				this.props.setEarnRule(earningRule);
			}
		} catch (error) {
			console.log(error);
		}
	};
	handleGetDefaultPhone = () => {
		const { crm: { memberCRMInfo }, allSysConfig } = this.props;
		if (!checkCRMStatus(allSysConfig) && memberCRMInfo?.phone) {
			const formattedPhone = formatUSPhoneInput(memberCRMInfo.phone?.slice(-10));
			this.setState({
				customNumber: formattedPhone,
				isPhoneValid: isValidUSPhone(formattedPhone)
			});
		}
	};
	componentWillUnmount() {
		if (this.unsubscribeOrientation) this.unsubscribeOrientation();
		if (this.keyboardManager) this.keyboardManager.cleanup();
	}
	changePrivacyConfirm = (v) => {
		this.setState({ isPrivacyConfirm: v });
	};
	onPhoneChange = (nextFormattedValue) => {
		this.setState({
			customNumber: nextFormattedValue,
			isPhoneValid: isValidUSPhone(nextFormattedValue)
		});
	};
	handleKeyUp = async (e) => {
		if (e.keyCode === 13) this.handleContinue();
	};
	goRewardAble = (crmRes) => {
		const { store, currentOrder, crm: { memberCRMInfo, isNewMember, rewardRule, selectedDiscount, selectedFreeItem, tempCampaign }, allSysConfig, promotion: { buyGifts, itemValidPromotion }, avocado: { hasAssertList } } = this.props;
		const hasFreeItemInOrder = currentOrder.itemList.find((_) => _.isFreeItem);
		const hasFreeItemCampaign = selectedFreeItem?.length > 0;
		const hasCampaignDiscount = Object.keys(selectedDiscount)?.length > 0;
		const hasBundleDiscountOrSpecialItem = tempCampaign?.find((each) => ["setPrice", "orderItemFixedPriceCoupon"].includes(each.rewardRule.redeemRule.strategy));
		const hasCampaign = hasFreeItemInOrder || hasFreeItemCampaign || hasCampaignDiscount || hasBundleDiscountOrSpecialItem;
		let goReward = false;
		const validSelectedPromotion = itemValidPromotion?.find((e) => e.isSelected);
		if (currentOrder.itemList.find((_) => _.discountID === -1 && _.discountName === "promotion discount") || buyGifts?.length > 0 || validSelectedPromotion) return goReward;
		if (getOrderInfoObj(store).promotionDiscountInfo) return goReward;
		const crmType = checkCRMType(allSysConfig);
		if (crmType === 1) {
			const discountRuleSet = ["byPercentageOff", "byFixedAmount"];
			const kioskReward = rewardRule.filter((_) => _?.redeemRule?.parameters?.freeItemPool?.objects?.items?.filter((ruleItem) => ruleItem?.orderType === "KIOSK").length > 0 || discountRuleSet.includes(_.redeemRule.strategy));
			kioskReward.reduce((min, item) => {
				const points = item?.redeemRule?.parameters?.points;
				if (points === void 0) return min;
				return points < min ? points : min;
			}, kioskReward[0]?.redeemRule?.parameters?.points || 0);
			goReward = !hasCampaign && (!isNewMember || typeof crmRes === "object" && Object.keys(crmRes)?.length > 0 || isNewMember && memberCRMInfo?.pointBalance > 0);
		}
		if (crmType === 2) goReward = !hasCampaign && hasAssertList;
		return goReward;
	};
	handleSkipWithCustomerInfo = async (memberCRMInfo) => {
		const { changeIgnoreReward } = this.props;
		const phoneNumber = memberCRMInfo?.phone;
		if (!phoneNumber) {
			this.handleSkip();
			return;
		}
		const phone = getUSPhoneDigits(phoneNumber);
		if (this.rejectBlacklistedPhone(phone)) return;
		if (phone.length !== 10) {
			this.handleSkip();
			return;
		}
		if (!await this.saveCustomerInfoToOrder(phone)) {
			this.handleSkip();
			return;
		}
		await this.checkIsMemberOrderedBefore(phone);
		const goReward = this.goRewardAble(memberCRMInfo);
		const onBeforeJudge = (onNewMemberGo) => {
			if (goReward) {
				changeIgnoreReward(false);
				this.handleGotoRewards(true);
				return;
			}
			onNewMemberGo();
		};
		this.judgeAfterOperation(onBeforeJudge);
	};
	handleSkip = () => {
		const { crm: { memberCRMInfo }, currentOrder, changeIgnoreReward } = this.props;
		const resetPhone = (0, import_cloneDeep.default)(currentOrder.customer);
		resetPhone.phone = [{}];
		this.props.customer(resetPhone);
		const goReward = this.goRewardAble(memberCRMInfo);
		const onBeforeJudge = (onNewMemberGo) => {
			if (goReward) {
				changeIgnoreReward(false);
				this.handleGotoRewards();
				return;
			}
			onNewMemberGo();
		};
		this.judgeAfterOperation(onBeforeJudge);
	};
	handleContinue = () => {
		const { t } = this.props;
		const { isPrivacyConfirm, isPhoneValid, customNumber } = this.state;
		if (!isPrivacyConfirm) return toast_default.info(t("confirm-policy"), "top");
		const val = normalizePhoneDigits(customNumber);
		if (isPhoneValid) this.setState({ saveNumber: val }, () => {
			this.savePhoneNumber(val);
		});
	};
	rejectBlacklistedPhone = (phone) => {
		if (!isPhoneBlacklisted(phone, this.props.selfConfig)) return false;
		this.setState({
			showPhoneBlacklist: true,
			loading: false,
			keyboardToggle: false,
			errorLoading: false
		});
		return true;
	};
	closePhoneBlacklist = () => {
		this.setState({ showPhoneBlacklist: false });
		if (this.props.crm?.memberCRMInfo && Object.keys(this.props.crm.memberCRMInfo).length) this.backBtnHandler();
	};
	showKeyboard = () => {
		this.setState({ keyboardToggle: true });
	};
	hideKeyboard = () => {
		this.setState({ keyboardToggle: false });
	};
	render() {
		const { t, selfConfig, crm: { loginType, onboardGiftRule, memberCRMInfo } } = this.props;
		const { customNumber, errorLoading, isHasSoldoutDish, dishMap, isShowCardMinModal, currentAmount, isPrivacyConfirm, loading, isPhoneValid, keyboardToggle } = this.state;
		const isVertical = this.state.deviceOrientation === "vertical";
		const isRequire = selfConfig?.configMap?.id_12;
		const isCRMDisabled = checkCRMStatus(this.props.allSysConfig);
		const showMemberPoints = selfConfig?.configMap?.id_75 ?? true;
		const title = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("input-phone-SMS-0") }), showMemberPoints && !isCRMDisabled && loginType !== "active" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("input-phone-SMS-1") })] });
		const actions = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [!isRequire && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: phoneInput_module_default.never,
			onClick: this.handleSkip,
			children: t("skip")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: [isPhoneValid && isPrivacyConfirm ? `${phoneInput_module_default.btnConfirm} linear-animate-btn` : phoneInput_module_default.btnNoConfirm].join(" "),
			onClick: this.handleContinue,
			children: t("confirm")
		})] });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: phoneInput_module_default.phoneInputPage,
			style: { visibility: this.props.isReorderFlag ? "hidden" : "visible" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: phoneInput_module_default.numPadContainer,
					style: { visibility: memberCRMInfo && Object.keys(memberCRMInfo)?.length > 0 ? "hidden" : "visible" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneNumberEntryLayout, {
						title,
						value: customNumber,
						placeholder: t("inputPhone"),
						inputRef: (el) => this.phoneInputRef = el,
						isVertical,
						onPhoneChange: this.onPhoneChange,
						onKeyUp: this.handleKeyUp,
						onFocus: () => {
							if (!isVertical && !isOpenVtkeyboadrd()) {
								if (this.keyboardManager) {
									this.keyboardManager.forceCheck();
									setTimeout(() => {
										this.keyboardManager.handleKeyboardChange();
									}, 300);
								}
							} else if (isOpenVtkeyboadrd() && !isVertical) this.showKeyboard();
						},
						onBlur: () => {
							if (!isVertical && !isOpenVtkeyboadrd()) setTimeout(() => {
								if (this.keyboardManager) this.keyboardManager.handleKeyboardClose();
							}, 300);
						},
						onClick: () => {
							if (isOpenVtkeyboadrd() && !isVertical) this.showKeyboard();
						},
						isPrivacyConfirm,
						changePrivacyConfirm: this.changePrivacyConfirm,
						actions
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewMemberGift_default, {
					visible: this.state.showNewMemberGift,
					onboardGiftRule,
					handleConfirm: this.handleCloseNewMemberGift
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, { visible: loading }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneBlacklistDialog, {
					visible: this.state.showPhoneBlacklist,
					onConfirm: this.closePhoneBlacklist,
					t
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
					visible: errorLoading,
					html: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: phoneInput_module_default.containerBox,
						onClick: (e) => e.stopPropagation(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: phoneInput_module_default.itemBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: phoneInput_module_default.itemName,
								children: t("order-create-fail")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: phoneInput_module_default.subItemName,
								children: t("order-create-sub-fail")
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: phoneInput_module_default.btnBox,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.handleCancel,
								children: t("cancel-order")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								onClick: this.handleRetry,
								className: "linear-animate-btn",
								children: t("order-retry")
							})]
						})]
					}),
					onClose: this.handleCancel
				}),
				isHasSoldoutDish ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(soldoutModal_default, {
					isHasSoldoutDish,
					dishMap,
					reorder: this.reorder,
					continueReorder: this.continueReorder
				}) : null,
				isShowCardMinModal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cardMinAmount_default, {
					isShowCardMinModal,
					currentAmount,
					handleContinueOrder: this.handleContinueOrder,
					handleCloseMin: this.handleCloseMin
				}) : null,
				keyboardToggle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VtKeyboard, {
					keyboardValue: customNumber,
					handlePressEnter: this.handleContinue,
					changeInput: (v) => this.onPhoneChange(v),
					closeKeyboard: () => this.hideKeyboard(),
					VKOuterStyle: { zIndex: 9999 }
				}) : null
			]
		});
	}
};
function mapStateToProps(state) {
	return {
		store: state,
		currentOrder: state.currentOrder,
		systemConfig: state.systemConfig,
		selfConfig: state.selfConfig,
		isReorderFlag: state.orderEdit.isReorderFlag,
		allSysConfig: state.allSysConfig,
		crm: state.crm,
		merchantProfile: state.merchantProfile,
		promotion: state.promotion,
		avocado: state.avocado,
		userId: state.sysCookie.kioskConfigUserId
	};
}
var phoneInput_default = withRouter(connect(mapStateToProps, {
	customer,
	payByCard,
	payByCash,
	spliceOrderBySoldout,
	setIsReorderFlag,
	setSelfConfig,
	setCRMMemberInfo,
	setMemberStatus,
	changeIgnoreReward,
	changeLoginType,
	setLanModal,
	setEarnRule,
	setOnboardGiftRule,
	setCustomerVouchers,
	setCRMCustomerInfo,
	setIsMemberOrderedBefore,
	saveOrderResult
})(withTranslation()(PhoneInput)));
//#endregion
export { phoneInput_default as default };
