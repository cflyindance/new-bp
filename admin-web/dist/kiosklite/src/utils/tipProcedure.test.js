import { describe, expect, it } from 'vitest';
import {
  isTipBeforePaymentMethodEligible,
  getEligibleTipProcedures,
  isTipBeforePaymentMethodFlow,
  pushPaymentMethodEntry,
  reconcileDualPriceTipProcedure,
  reconcileTipProcedure,
  shouldStartTipBeforePaymentMethod,
} from './tipProcedure';

describe('tip procedure rules', () => {
  it('requires at least two enabled methods and tips for every enabled method', () => {
    expect(
      isTipBeforePaymentMethodEligible(
        { tipPaymentTypes: ['0', '1'] },
        ['0', '1']
      )
    ).toBe(true);
    expect(
      isTipBeforePaymentMethodEligible({ tipPaymentTypes: ['0'] }, ['0', '1'])
    ).toBe(false);
    expect(
      isTipBeforePaymentMethodEligible(
        { tipPaymentTypes: ['0', '2'] },
        ['0', '2']
      )
    ).toBe(true);
    expect(
      isTipBeforePaymentMethodEligible(
        { tipPaymentTypes: ['1', '2'] },
        ['1', '2']
      )
    ).toBe(true);
    expect(
      isTipBeforePaymentMethodEligible(
        { tipPaymentTypes: ['0', '1'] },
        ['0', '1', '2']
      )
    ).toBe(false);
  });

  it('enables card procedures only when card payment and card tips are enabled', () => {
    expect(getEligibleTipProcedures({ tipPaymentTypes: ['0'] }, ['0'])).toEqual([
      0,
      1,
    ]);
    expect(
      getEligibleTipProcedures({ tipPaymentTypes: ['1', '2'] }, ['1', '2'])
    ).toEqual([2]);
    expect(getEligibleTipProcedures({ tipPaymentTypes: ['1'] }, ['1'])).toEqual(
      []
    );
  });

  it('honors persisted procedure 2 at runtime without falling back to legacy card flow', () => {
    const selfConfig = {
      configList: [
        { id: 5, tipPaymentTypes: ['0', '1'] },
        { id: 24, value: 2 },
      ],
    };
    expect(
      shouldStartTipBeforePaymentMethod(selfConfig, {
        KIOSK_PAYMENT_TYPE: { value: '0,1' },
      })
    ).toBe(true);
    expect(
      shouldStartTipBeforePaymentMethod(selfConfig, {
        KIOSK_PAYMENT_TYPE: { value: '0' },
      })
    ).toBe(true);

    expect(
      shouldStartTipBeforePaymentMethod(
        {
          ...selfConfig,
          configList: selfConfig.configList.map((item) =>
            item.id === 24 ? { ...item, value: '2' } : item
          ),
        },
        { KIOSK_PAYMENT_TYPE: { value: '0,1' } }
      )
    ).toBe(true);
  });

  it('falls back invalid procedure 2 only after payment config loads', () => {
    const list = [
      { id: 5, tipPaymentTypes: ['0'] },
      { id: 24, value: 2 },
    ];
    expect(reconcileTipProcedure(list, ['0', '1'], false)[1].value).toBe(2);
    expect(reconcileTipProcedure(list, ['0', '1'], true)[1].value).toBe(0);
  });

  it('clears an invalid procedure when card fallback is unavailable', () => {
    const list = [
      { id: 5, tipPaymentTypes: ['1'] },
      { id: 24, value: 0 },
    ];
    expect(reconcileTipProcedure(list, ['1'], true)[1].value).toBeNull();
  });

  it('clears instead of auto-selecting procedure 2 when only that procedure is valid', () => {
    const list = [
      { id: 5, tipPaymentTypes: ['1', '2'] },
      { id: 24, value: 0 },
    ];
    expect(reconcileTipProcedure(list, ['1', '2'], true)[1].value).toBeNull();
  });

  it('preserves procedure 2 when dual price compatibility is applied', () => {
    expect(
      reconcileDualPriceTipProcedure(
        { id: 24, value: 2, Authorization: false },
        true
      )
    ).toEqual({ id: 24, value: 2, Authorization: false });

    expect(
      reconcileDualPriceTipProcedure(
        { id: 24, value: 0, Authorization: false },
        true
      )
    ).toEqual({ id: 24, value: 1, Authorization: false });
  });

  it('routes string procedure 2 through tipping and then payment method', () => {
    const pushes = [];
    const history = { push: (...args) => pushes.push(args) };
    pushPaymentMethodEntry(
      history,
      {
        configList: [
          { id: 5, tipPaymentTypes: ['0', '1'] },
          { id: 24, value: '2' },
        ],
      },
      { KIOSK_PAYMENT_TYPE: { value: '0,1' } }
    );

    expect(pushes).toEqual([
      ['/tippingPanel', { nextStep: 'paymentType' }],
    ]);
  });

  it('keeps tip confirmation in payment-method flow even without route state', () => {
    expect(
      isTipBeforePaymentMethodFlow({
        selfConfig: {
          configList: [{ id: 24, value: '2' }],
        },
        locationState: undefined,
        tipFlowState: {
          completedBeforePaymentMethod: false,
        },
      })
    ).toBe(true);
  });
});
