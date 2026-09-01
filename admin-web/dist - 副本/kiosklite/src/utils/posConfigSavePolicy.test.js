import { describe, expect, it } from 'vitest';
import {
  getPosConfigSaveDecision,
  isValidPosConfigUserId,
} from './posConfigSavePolicy';

const config = (name, value) => ({
  'app:id': name,
  'app:name': name,
  'app:value': value,
  'app:dataType': 'String',
});

const original = [
  config('KIOSK_PAYMENT_TYPE', '0,1'),
  config('CHOOSE_ORDER_TYPE', '0,1'),
  config('KIOSK_SEND_MESSAGE', 'true'),
];

describe('POS config save authentication policy', () => {
  it.each([
    1,
    42,
    '1',
    ' 42 ',
  ])('accepts a finite positive integer userId: %j', (userId) => {
    expect(isValidPosConfigUserId(userId)).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    '   ',
    0,
    -1,
    1.5,
    '1.5',
    '1e2',
    Infinity,
    NaN,
    true,
    false,
    'abc',
  ])('rejects an invalid userId: %j', (userId) => {
    expect(isValidPosConfigUserId(userId)).toBe(false);
  });

  it('skips POS sync when only the payment compatibility mirror changed without userId', () => {
    const current = original.map((item) =>
      item['app:name'] === 'KIOSK_PAYMENT_TYPE'
        ? { ...item, 'app:value': '1' }
        : item
    );

    expect(
      getPosConfigSaveDecision({ current, original, userId: '' })
    ).toEqual({
      blocked: false,
      shouldSavePos: false,
      requiresPaymentConfirmation: false,
      paymentTypeChanged: true,
      posOnlyChangedNames: [],
    });
  });

  it('blocks before all writes when a POS-only field changed without userId', () => {
    const current = original.map((item) =>
      item['app:name'] === 'CHOOSE_ORDER_TYPE'
        ? { ...item, 'app:value': '1' }
        : item
    );

    expect(
      getPosConfigSaveDecision({ current, original, userId: null })
    ).toMatchObject({
      blocked: true,
      shouldSavePos: false,
      requiresPaymentConfirmation: false,
      posOnlyChangedNames: ['CHOOSE_ORDER_TYPE'],
    });
  });

  it('requires one pre-write confirmation for authenticated mixed changes', () => {
    const current = original.map((item) => {
      if (item['app:name'] === 'KIOSK_PAYMENT_TYPE') {
        return { ...item, 'app:value': '1' };
      }
      if (item['app:name'] === 'KIOSK_SEND_MESSAGE') {
        return { ...item, 'app:value': 'false' };
      }
      return item;
    });

    expect(
      getPosConfigSaveDecision({ current, original, userId: '7' })
    ).toEqual({
      blocked: false,
      shouldSavePos: true,
      requiresPaymentConfirmation: true,
      paymentTypeChanged: true,
      posOnlyChangedNames: ['KIOSK_SEND_MESSAGE'],
    });
  });

  it('saves authenticated POS-only changes without payment confirmation', () => {
    const current = original.map((item) =>
      item['app:name'] === 'KIOSK_SEND_MESSAGE'
        ? { ...item, 'app:value': 'false' }
        : item
    );

    expect(
      getPosConfigSaveDecision({ current, original, userId: 7 })
    ).toMatchObject({
      blocked: false,
      shouldSavePos: true,
      requiresPaymentConfirmation: false,
      paymentTypeChanged: false,
      posOnlyChangedNames: ['KIOSK_SEND_MESSAGE'],
    });
  });

  it('does not treat comma-separated selection ordering as a change', () => {
    const current = original.map((item) => {
      if (item['app:name'] === 'KIOSK_PAYMENT_TYPE') {
        return { ...item, 'app:value': '1,0' };
      }
      if (item['app:name'] === 'CHOOSE_ORDER_TYPE') {
        return { ...item, 'app:value': '1,0' };
      }
      return item;
    });

    expect(
      getPosConfigSaveDecision({ current, original, userId: 7 })
    ).toMatchObject({
      blocked: false,
      shouldSavePos: false,
      requiresPaymentConfirmation: false,
      paymentTypeChanged: false,
      posOnlyChangedNames: [],
    });
  });
});
