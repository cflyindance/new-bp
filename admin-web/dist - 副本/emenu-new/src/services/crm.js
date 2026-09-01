import request from '@/utils/request'
import { isCrmEnabled, resolveCrmProviderType } from '@/crm/providerType'
import { getStorageValue } from '@/utils/storage'
import { encryptString } from '@/utils/crypto'
import { getRuntimeEnv } from '@/utils/runtimeEnv'

export const checkCRMStatus = (allSysConfig) => {
  return isCrmEnabled(allSysConfig)
}

export const getCRMProviderType = (allSysConfig) => {
  return resolveCrmProviderType(allSysConfig)
}

const apiMap = {
  DEV: 'https://cloud.menusifudev.com/api',
  QA: 'https://cloud.menusifucloudqa.com/api',
  PROD: 'https://cloud.menusifucloud.com/api',
}

const getHost = () => apiMap[getRuntimeEnv()]

function getEncryptedMerchantHeader() {
  const merchantId = getStorageValue('emenu_company')?.merchantId

  if (!merchantId) {
    throw new Error('Missing merchantId for customer OTP')
  }

  return {
    'x-enc-m-id': encryptString(merchantId),
  }
}

export function getAuthCode(data) {
  return request({
    url: `${getHost()}/auth/customer/otp/phone/login`,
    method: 'post',
    data,
    headers: getEncryptedMerchantHeader(),
  })
}
export function verifyAuthCode(data) {
  return request({
    url: `${getHost()}/auth/customer/otp/phone/verify`,
    method: 'post',
    data,
    headers: getEncryptedMerchantHeader(),
  })
}

export function searchCRMMember(params) {
  return request({
    url: '/loyalty/members/search',
    method: 'get',
    params,
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}

export function createCRMMember(data) {
  return request({
    url: '/loyalty/members',
    method: 'post',
    data,
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}

export function getCRMMemberInfo(userId) {
  return request({
    url: `/loyalty/members/${userId}`,
    method: 'get',
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}

export function searchPrivileges() {
  return request({
    url: '/loyalty/privileges',
    method: 'get',
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}

export function getPointRule() {
  return request({
    url: '/loyalty/point/rules',
    method: 'get',
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}

// 获取全部菜单 - 查找出系统菜单中会员权益菜品
export function getAllMenu() {
  return request({
    url: `${
      import.meta.env.DEV
        ? `${import.meta.env.VITE_SERVER_URL}webapp`
        : '/kpos/webapp'
    }/menu/menu?product=ALL`,
    method: 'get',
  })
}

export function searchRewardRule() {
  return request({
    url: '/loyalty/reward/rules',
    method: 'get',
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  })
}
