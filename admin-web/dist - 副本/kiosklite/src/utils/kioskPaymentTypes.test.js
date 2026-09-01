import { describe, expect, it } from 'vitest';
import {
  getKioskPaymentTypesConfigState,
  normalizeKioskPaymentTypes,
  resolveKioskPaymentTypes,
  upsertKioskPaymentTypesConfig,
} from './kioskPaymentTypes';

describe('kiosk payment types marginappconfig policy', () => {
  it('normalizes valid codes, removes unknown codes and sorts', () => {
    expect(normalizeKioskPaymentTypes(['2', 1, '0', '2', 'unknown'])).toEqual([
      '0',
      '1',
      '2',
    ]);
  });

  it('distinguishes missing, malformed, empty and valid id 70', () => {
    expect(getKioskPaymentTypesConfigState([]).status).toBe('missing');
    expect(
      getKioskPaymentTypesConfigState([{ id: 70, value: '0,1' }]).status
    ).toBe('invalid');
    expect(
      getKioskPaymentTypesConfigState([{ id: 70, value: [] }]).status
    ).toBe('invalid');
    expect(
      getKioskPaymentTypesConfigState([{ id: 70, value: ['1'] }])
    ).toEqual({ status: 'valid', value: ['1'] });
  });

  it('falls back to POS only when id 70 is missing', () => {
    const systemConfig = { KIOSK_PAYMENT_TYPE: { value: '0,1' } };
    expect(resolveKioskPaymentTypes({ configList: [] }, systemConfig)).toEqual([
      '0',
      '1',
    ]);
    expect(
      resolveKioskPaymentTypes(
        { configList: [{ id: 70, value: '0,1' }] },
        systemConfig
      )
    ).toEqual([]);
  });

  it('upserts the normalized selection without changing device id 34', () => {
    const deviceConfig = {
      id: 34,
      value: [{ deviceId: 'one', devicePaymentType: { canPayByCard: true } }],
    };
    const result = upsertKioskPaymentTypesConfig(
      [deviceConfig],
      ['2', '1', '1']
    );

    expect(result.find((item) => item.id === 70)).toEqual({
      id: 70,
      key: 'kiosk-payment-types',
      value: ['1', '2'],
    });
    expect(result.find((item) => item.id === 34)).toEqual(deviceConfig);
  });
});
