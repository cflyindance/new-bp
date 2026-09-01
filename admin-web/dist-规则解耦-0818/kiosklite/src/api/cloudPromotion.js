import { axiosGet } from './kioskConfigApi';

// 获取云promotion信息
export function getAllCloudPromotion() {
  const url = '/kpos/api/pos-promotion/runtime/queryValidPromotionList';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}
