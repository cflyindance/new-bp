/**
 * sessionKey 在 judgeSskeyIsActiveTime 等处续期后，App 的 isAvailable 仍可能为 false
 * （checkPosConnection 仅每 5s 轮询）。通过此处立即探测 POS 并通知 App 更新状态。
 */
import { getKioskHomeHash } from '@/constants/mockData';

let setPosAvailable = null;

export function registerKioskPosAvailabilitySetter(fn) {
  setPosAvailable = fn;
}

export function unregisterKioskPosAvailabilitySetter() {
  setPosAvailable = null;
}

/** 与 HashRouter 下 `Route exact path="/"` 一致：仅 `#/` 或空 hash 视为首页 */
function isKioskHomeRoute() {
  const pathPart = (window.location.hash || '').replace(/^#/, '');
  const pathname = (pathPart.split('?')[0] || '').trim();
  return pathname === '' || pathname === '/';
}

/** 配置页首页 `#/configApp` */
function isConfigAppHomeRoute() {
  const pathPart = (window.location.hash || '').replace(/^#/, '');
  const pathname = (pathPart.split('?')[0] || '').trim();
  return pathname === '/configApp';
}

export async function notifyPosConnectionAfterSessionRenewal() {
  if (typeof setPosAvailable !== 'function') return;
  try {
    const { getMarginappFetchConfig } = await import('@/api');
    const { EventBus } = await import('@/utils/EventBus');
    const res = await getMarginappFetchConfig({ timeout: 15000 });
    if (res?.data?.result?.successful) {
      setPosAvailable();
      EventBus.emit('posConnectionRestored');
      const isHomeRoute = isKioskHomeRoute();
      const isConfigHomeRoute = isConfigAppHomeRoute();
      // sessionKey 已轮换：整页重载，避免长驻 SPA 内子路由未挂载 MainPage、Redux/WebSocket
      // 等与续期前状态脱节（App 层轮询仍在跑，易误以为「首页逻辑」仍在生效）。
      if (isHomeRoute || isConfigHomeRoute) {
        window.location.reload();
      } else {
        const [{ default: Toast }, { default: i18n }] = await Promise.all([
          import('@/component/toast'),
          import('@/assets/i18n/i18n'),
        ]);
        Toast.info(i18n.t('session-key-expired-reload-hint'), 2500, () => {
          window.location.hash = getKioskHomeHash();
          window.location.reload();
        });
      }
    }
  } catch (e) {
    // 失败时保持原状，等待 App 下一轮 checkPosConnection
  }
}
