import { lockOrder, unlockOrder } from '@/api/kioskConfigApi';

export const orderLockProcedure = async (data, onErrCb) => {
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

export const orderLock = async (data, onErrCb) => {
  const res = await lockOrder(data);
  if (res?.status !== 200 || res?.data?.code === 109999) {
    onErrCb?.(res);
    return false;
  }
  return res.data;
};

export const orderUnlock = async (data, onErrCb) => {
  const res = await unlockOrder(data);
  if (res?.status !== 200 || res?.data?.code === 109999) {
    onErrCb?.(res);
    return false;
  }
  return res.data;
};
