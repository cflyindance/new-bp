import axios from 'axios';
import getPosVersion from '@/utils/getPosVersion';

// 请求拦截器
axios.interceptors.request.use(
  function (config) {
    const posVersion = localStorage.getItem('posVersion');
    const posVersionNum = getPosVersion(posVersion);
    if (
      posVersion &&
      posVersionNum >= 18030120000 &&
      !config?.url.includes('cloud.menusifu') &&
      !config?.url.includes(':22081') &&
      !config?.url.includes('fetchCompanyProfile')
    ) {
      config.headers['posVersion'] = JSON.parse(posVersion);
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default axios;
