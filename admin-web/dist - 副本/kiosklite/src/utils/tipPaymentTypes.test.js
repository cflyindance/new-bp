import { describe, expect, it } from 'vitest';
import {
  getAvailableTipPaymentTypes,
  isTipEnabledForPaymentType,
  normalizePaymentTypes,
  reconcileTipConfig,
  resolveTipPaymentTypes,
} from './tipPaymentTypes';

describe('tip payment type rules', () => {
  it('normalizes comma values, arrays, duplicates and unknown values', () => {
    expect(normalizePaymentTypes('1,0,1,2,')).toEqual(['1', '0', '2']);
    expect(normalizePaymentTypes(['0', 1, '9', '2', '0'])).toEqual([
      '0',
      '1',
      '2',
    ]);
  });

  it('reads currently enabled Kiosk payment types', () => {
    expect(
      getAvailableTipPaymentTypes([
        { 'app:name': 'KIOSK_PAYMENT_TYPE', 'app:value': '0,2' },
      ])
    ).toEqual(['0', '2']);
  });

  it('treats a missing legacy field as all currently eligible methods', () => {
    expect(resolveTipPaymentTypes({ value: true }, ['0', '1'])).toEqual([
      '0',
      '1',
    ]);
  });

  it('removes disabled, duplicate and forged methods', () => {
    expect(
      reconcileTipConfig(
        { value: true, tipPaymentTypes: ['0', '1', '1', '2'] },
        ['1', '2']
      )
    ).toEqual({ value: true, tipPaymentTypes: ['1', '2'] });
  });

  it('gates runtime tips by order and enabled Kiosk payment method', () => {
    const selfConfig = {
      configList: [
        { id: 5, value: true, tipPaymentTypes: ['0', '2'] },
      ],
    };
    const systemConfig = { KIOSK_PAYMENT_TYPE: { value: '0,1,2' } };
    expect(
      isTipEnabledForPaymentType(
        selfConfig,
        'CREDIT_CARD',
        systemConfig
      )
    ).toBe(true);
    expect(
      isTipEnabledForPaymentType(selfConfig, 'CASH', systemConfig)
    ).toBe(false);
    expect(
      isTipEnabledForPaymentType(selfConfig, 'GIFT_CARD', systemConfig)
    ).toBe(true);
  });

  it('keeps legacy enabled behavior when the new field is absent', () => {
    const selfConfig = { configList: [{ id: 5, value: false }] };
    expect(
      isTipEnabledForPaymentType(selfConfig, 'CASH', {
        KIOSK_PAYMENT_TYPE: { value: '1' },
      })
    ).toBe(true);
  });

  it('ignores the legacy master value and honors an explicit empty selection', () => {
    const systemConfig = { KIOSK_PAYMENT_TYPE: { value: '0,1' } };
    expect(
      isTipEnabledForPaymentType(
        {
          configList: [
            { id: 5, value: false, tipPaymentTypes: ['0'] },
          ],
        },
        'CREDIT_CARD',
        systemConfig
      )
    ).toBe(true);
    expect(
      isTipEnabledForPaymentType(
        { configList: [{ id: 5, value: true, tipPaymentTypes: [] }] },
        'CREDIT_CARD',
        systemConfig
      )
    ).toBe(false);
  });
});
