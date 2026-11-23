import { c as __exportAll } from "./toast-C8a1ReSo.js";
import { Bc as SET_THIRD_PARTY_COMMIT_ID, Fs as SET_CRM_CUSTOMER_INFO, Is as SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS, Ls as SET_CRM_INTEGRATION_REWARD, Ms as SET_COMMIT_ID, Ua as CHANGE_REWARD_MODAL_VISIBLE, bs as SET_AESERT_LIST_STATUS, gc as SET_ORDER_REWARD_ID, kc as SET_SDK_META_DATA, uc as SET_NEED_COMMIT, ys as SET_AD_OUTLET_INFO } from "./actions-BwRPwnFF.js";
import { N as unlockOrder, T as lockOrder } from "./kioskConfigApi-68IKDHob.js";
//#region source-snapshot/src/actions/avocado.js
var avocado_exports = /* @__PURE__ */ __exportAll({
	changeRewardModalVisible: () => changeRewardModalVisible,
	setADOutletInfo: () => setADOutletInfo,
	setAssertListStatus: () => setAssertListStatus,
	setCRMCustomerInfo: () => setCRMCustomerInfo,
	setCRMIntegrationRewards: () => setCRMIntegrationRewards,
	setCommitId: () => setCommitId,
	setCustomerVouchers: () => setCustomerVouchers,
	setNeedCommit: () => setNeedCommit,
	setOrderRewardId: () => setOrderRewardId,
	setSDKMeta: () => setSDKMeta,
	setThirdPartyCommitId: () => setThirdPartyCommitId
});
/**
* AD 相关
* */
var setADOutletInfo = (data) => ({
	type: SET_AD_OUTLET_INFO,
	data
});
var setCommitId = (data) => ({
	type: SET_COMMIT_ID,
	data
});
var setOrderRewardId = (data) => ({
	type: SET_ORDER_REWARD_ID,
	data
});
var setThirdPartyCommitId = (data) => ({
	type: SET_THIRD_PARTY_COMMIT_ID,
	data
});
/**
* CRM integration
* */
var setCRMIntegrationRewards = (data) => ({
	type: SET_CRM_INTEGRATION_REWARD,
	data
});
var setCustomerVouchers = (data) => ({
	type: SET_CRM_INTEGRATION_CUSTOMER_VOUCHERS,
	data
});
var setSDKMeta = (data) => ({
	type: SET_SDK_META_DATA,
	data
});
var setCRMCustomerInfo = (data) => ({
	type: SET_CRM_CUSTOMER_INFO,
	data
});
var setNeedCommit = (data) => ({
	type: SET_NEED_COMMIT,
	data
});
var changeRewardModalVisible = (data) => ({
	type: CHANGE_REWARD_MODAL_VISIBLE,
	data
});
var setAssertListStatus = (data) => ({
	type: SET_AESERT_LIST_STATUS,
	data
});
//#endregion
//#region source-snapshot/src/utils/orderLock.js
var orderLockProcedure = async (data, onErrCb) => {
	const res = await lockOrder(data);
	if (res?.status !== 200 || res?.data?.code === 109999) {
		onErrCb?.(res);
		return false;
	}
	if (res.data.code === 0) {
		await unlockOrder(data);
		return true;
	}
};
var orderLock = async (data, onErrCb) => {
	const res = await lockOrder(data);
	if (res?.status !== 200 || res?.data?.code === 109999) {
		onErrCb?.(res);
		return false;
	}
	return res.data;
};
var orderUnlock = async (data, onErrCb) => {
	const res = await unlockOrder(data);
	if (res?.status !== 200 || res?.data?.code === 109999) {
		onErrCb?.(res);
		return false;
	}
	return res.data;
};
//#endregion
export { changeRewardModalVisible as a, setCustomerVouchers as c, setThirdPartyCommitId as d, avocado_exports as i, setNeedCommit as l, orderLockProcedure as n, setCRMCustomerInfo as o, orderUnlock as r, setCommitId as s, orderLock as t, setOrderRewardId as u };
