import { K as serverURL } from "./utils-Cdx9DbDR.js";
import { L as getRuntimeEnvironment, n as axiosPost, t as axiosGet } from "./kioskConfigApi-68IKDHob.js";
//#region source-snapshot/src/api/crm-integration.js
var host = {
	development: "https://cloud.menusifudev.com/api/crm-integration",
	production: "https://cloud.menusifucloud.com/api/crm-integration",
	integration: "https://cloud.menusifucloudqa.com/api/crm-integration"
}[getRuntimeEnvironment()];
var CRMIntegrationClient = class {
	constructor() {
		this.token = null;
		this.tokenExpireAt = 0;
		this.merchantId = null;
	}
	setMerchantId(merchantId) {
		this.merchantId = merchantId;
	}
	async refreshToken() {
		const res = await axiosGet(`${serverURL}api/crmToken/getToken`);
		if (res.data.data) {
			const { token, expiredTime } = res.data.data;
			this.token = token;
			this.tokenExpireAt = expiredTime;
		}
	}
	async getValidToken() {
		if (this.token && +/* @__PURE__ */ new Date() < this.tokenExpireAt) return this.token;
		await this.refreshToken();
		return this.token;
	}
	async searchCustomers(params) {
		const token = await this.getValidToken();
		return axiosGet(`${host}/integration/customers/search`, {
			params,
			data: {},
			headers: {
				"x-api-token": token,
				"x-merchant-id": this.merchantId
			}
		});
	}
	async getCustomerAssets(customerId) {
		const token = await this.getValidToken();
		return axiosGet(`${host}/integration/promotion/assets`, {
			params: { customerId },
			data: {},
			headers: {
				"x-api-token": token,
				"x-merchant-id": this.merchantId
			}
		});
	}
	async getCustomerInfo(id) {
		const token = await this.getValidToken();
		return axiosGet(`${host}/integration/customers/get`, {
			params: { id },
			data: {},
			headers: {
				"x-api-token": token,
				"x-merchant-id": this.merchantId
			}
		});
	}
	async createNewCustomer(data) {
		const token = await this.getValidToken();
		return axiosPost(`${host}/integration/customers/create`, data, {
			"x-api-token": token,
			"x-merchant-id": this.merchantId
		});
	}
	async calculateWeakMemberPoints(order) {
		const token = await this.getValidToken();
		return axiosPost(`${host}/integration/promotion/weak-member/points/calculate`, { order }, {
			"x-api-token": token,
			"x-merchant-id": this.merchantId
		});
	}
	async getMerchantReward() {
		const token = await this.getValidToken();
		return axiosGet(`${host}/integration/promotion/reward`, {
			data: {},
			headers: {
				"x-api-token": token,
				"x-merchant-id": this.merchantId
			}
		});
	}
	async getSDKMeta() {
		return axiosGet(`${serverURL}api/promotion/runtime/couponTemplate/querySdkMetas`, {
			data: {},
			headers: {}
		});
	}
};
var crmIntegration = new CRMIntegrationClient();
//#endregion
export { crmIntegration as t };
