import { axiosGet, axiosPost } from './kioskConfigApi';
import { serverURL } from './ip';

const apiMap = {
  development: 'https://cloud.menusifudev.com/api/crm-integration',
  production: 'https://cloud.menusifucloud.com/api/crm-integration',
  integration: 'https://cloud.menusifucloudqa.com/api/crm-integration',
};

const host = apiMap[process.env.REACT_APP_ENV];

class CRMIntegrationClient {
  constructor() {
    this.token = null;
    this.tokenExpireAt = 0;
    this.merchantId = null;
  }

  setMerchantId(merchantId) {
    this.merchantId = merchantId;
  }

  async refreshToken() {
    const url = `${serverURL}api/crmToken/getToken`;
    const res = await axiosGet(url);
    if (res.data.data) {
      const { token, expiredTime } = res.data.data;
      this.token = token;
      this.tokenExpireAt = expiredTime;
    }
  }

  async getValidToken() {
    if (this.token && +new Date() < this.tokenExpireAt) {
      return this.token;
    }
    await this.refreshToken();
    return this.token;
  }

  async searchCustomers(params) {
    const token = await this.getValidToken();
    const url = `${host}/integration/customers/search`;
    return axiosGet(url, {
      params,
      data: {},
      headers: {
        'x-api-token': token,
        'x-merchant-id': this.merchantId,
      },
    });
  }

  async getCustomerAssets(customerId) {
    const token = await this.getValidToken();
    const url = `${host}/integration/promotion/assets`;
    return axiosGet(url, {
      params: { customerId },
      data: {},
      headers: {
        'x-api-token': token,
        'x-merchant-id': this.merchantId,
      },
    });
  }

  async getCustomerInfo(id) {
    const token = await this.getValidToken();
    const url = `${host}/integration/customers/get`;
    return axiosGet(url, {
      params: { id },
      data: {},
      headers: {
        'x-api-token': token,
        'x-merchant-id': this.merchantId,
      },
    });
  }

  async createNewCustomer(data) {
    const token = await this.getValidToken();
    const url = `${host}/integration/customers/create`;
    return axiosPost(url, data, {
      'x-api-token': token,
      'x-merchant-id': this.merchantId,
    });
  }

  // 获取积分兑换
  async getMerchantReward() {
    const token = await this.getValidToken();
    const url = `${host}/integration/promotion/reward`;
    return axiosGet(url, {
      data: {},
      headers: {
        'x-api-token': token,
        'x-merchant-id': this.merchantId,
      },
    });
  }

  // 获取meta 30mins更新
  async getSDKMeta() {
    const url = `${serverURL}api/promotion/runtime/couponTemplate/querySdkMetas`;
    return axiosGet(url, {
      data: {},
      headers: {},
    });
  }
}

const crmIntegration = new CRMIntegrationClient();

export default crmIntegration;
