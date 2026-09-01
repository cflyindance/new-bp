import { beforeEach, describe, expect, test, vi } from 'vitest';

const NATIVE_CALLBACK_NAMES = [
  'getDeviceInfo',
  'getIngenicoDeviceSNAndDeviceInfo',
  'bridgeCall',
  'loadPaymentInfo',
  'loadCreditCardInfoByIngenico',
  'saveLicenseName',
  'checkIngenicoReadyForTransaction',
  'abortIngenicoTransaction',
  'changePayConnectType',
  'cancelDeviceConnect',
  'saveSecretKeyAndroid',
  'getSecretKeyAndroid',
  'afterGetSecretKeyFromAndroid',
  'isAndroidShell',
];

describe('native bridge globals', () => {
  beforeEach(async () => {
    vi.resetModules();
    window.WebViewJavascriptBridge = { callHandler: vi.fn() };
    window.AppJSBridge = { call: vi.fn().mockResolvedValue({ serial: '1' }) };
    window.CallJava = {
      saveLicenseName: vi.fn(),
      changePayConnectType: vi.fn(),
      cancelDeviceConnect: vi.fn(),
      saveSecretKey: vi.fn(),
      getSecretKey: vi.fn(),
    };
    await import('./nativeBridgeGlobals.js');
  });

  test('exposes every native callback on window', () => {
    for (const name of NATIVE_CALLBACK_NAMES) {
      expect(window[name]).toBeTypeOf('function');
    }
  });

  test('normalizes AppJSBridge payment data to body', async () => {
    await expect(window.loadPaymentInfo()).resolves.toEqual({
      body: { serial: '1' },
    });
    expect(window.AppJSBridge.call).toHaveBeenCalledWith(
      'getPaymentDeviceInfo'
    );
  });

  test('passes the original handler name and payload to WebViewJavascriptBridge', async () => {
    const deviceInfoPromise = window.getDeviceInfo();

    expect(window.WebViewJavascriptBridge.callHandler).toHaveBeenCalledWith(
      'getDeviceInfo',
      {},
      expect.any(Function)
    );

    const callback =
      window.WebViewJavascriptBridge.callHandler.mock.calls[0][2];
    callback({ deviceId: 'kiosk-1' });

    await expect(deviceInfoPromise).resolves.toEqual({ deviceId: 'kiosk-1' });
  });

  test('preserves changePayConnectType JSON fields', () => {
    window.changePayConnectType('ingenico', 'usb');

    const payload = JSON.parse(
      window.CallJava.changePayConnectType.mock.calls[0][0]
    );
    expect(payload).toEqual({
      appType: 'ingenico',
      connectType: 'usb',
      statusCode: '3',
      isSupportRua: true,
    });
  });

  test('maps the Android secret payload without renaming callbackFuncName', () => {
    window.saveSecretKeyAndroid({
      appType: 'rua',
      merchantId: 'merchant-1',
      secretKey: 'secret-1',
      callbackFuncName: 'handleSecret',
    });

    const payload = JSON.parse(window.CallJava.saveSecretKey.mock.calls[0][0]);
    expect(payload).toEqual({
      appType: 'rua',
      merchantId: 'merchant-1',
      secret: 'secret-1',
      callbackFuncName: 'handleSecret',
    });
  });

  test('passes the original Android secret lookup fields', () => {
    window.getSecretKeyAndroid('rua', 'merchant-1', 'handleSecret');

    const payload = JSON.parse(window.CallJava.getSecretKey.mock.calls[0][0]);
    expect(payload).toEqual({
      appType: 'rua',
      merchantId: 'merchant-1',
      callbackFuncName: 'handleSecret',
    });
  });
});
