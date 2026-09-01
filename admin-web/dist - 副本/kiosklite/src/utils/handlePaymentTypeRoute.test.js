import { beforeEach, describe, expect, it } from 'vitest';
import handlePaymentTypeRoute from './handlePaymentTypeRoute';

describe('handlePaymentTypeRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the payment method page when tip flow is before payment method selection', () => {
    localStorage.setItem('deviceId', 'device-card-only');
    const selfConfig = {
      configList: [
        { id: 5, tipPaymentTypes: ['0', '1'] },
        { id: 24, value: 2 },
        {
          id: 34,
          value: [
            {
              deviceId: 'device-card-only',
              devicePaymentType: {
                canPayByCard: true,
                canPayByCash: false,
                canPayByEcard: false,
              },
            },
          ],
        },
      ],
    };
    const systemConfig = {
      KIOSK_PAYMENT_TYPE: { value: '0,1' },
    };

    expect(
      handlePaymentTypeRoute(systemConfig, selfConfig).shouldSkipPaymentType
    ).toBe(false);
  });

  it('uses marginappconfig id 70 instead of a conflicting POS value', () => {
    const selfConfig = {
      configList: [{ id: 70, value: ['1'] }],
    };
    const systemConfig = {
      KIOSK_PAYMENT_TYPE: { value: '0,1' },
    };

    expect(handlePaymentTypeRoute(systemConfig, selfConfig)).toMatchObject({
      canPayByCard: false,
      canPayByCash: true,
      canPayByEcard: false,
      onlyCash: true,
    });
  });

  it('does not fall back to POS when id 70 exists but is malformed', () => {
    const selfConfig = {
      configList: [{ id: 70, value: '0,1' }],
    };
    const systemConfig = {
      KIOSK_PAYMENT_TYPE: { value: '0,1' },
    };

    expect(handlePaymentTypeRoute(systemConfig, selfConfig)).toMatchObject({
      canPayByCard: false,
      canPayByCash: false,
      canPayByEcard: false,
    });
  });

  it('treats a missing current device record as unrestricted device capability', () => {
    localStorage.setItem('deviceId', 'missing-device');
    const selfConfig = {
      configList: [
        { id: 70, value: ['1'] },
        {
          id: 34,
          value: [
            {
              deviceId: 'another-device',
              devicePaymentType: {
                canPayByCard: false,
                canPayByCash: false,
                canPayByEcard: false,
              },
            },
          ],
        },
      ],
    };

    expect(handlePaymentTypeRoute({}, selfConfig)).toMatchObject({
      canPayByCard: false,
      canPayByCash: true,
      onlyCash: true,
    });
  });
});
