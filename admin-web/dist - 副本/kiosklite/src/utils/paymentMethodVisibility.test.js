import { describe, expect, it } from 'vitest';
import { getPaymentMethodVisibility } from './paymentMethodVisibility';

describe('payment method visibility', () => {
  it('shows counter payment together with gift card when credit card is disabled', () => {
    expect(
      getPaymentMethodVisibility({
        canPayByCard: false,
        canPayByCash: true,
        canPayByEcard: true,
      })
    ).toEqual({
      showCard: false,
      showCash: true,
      showGiftCard: true,
      showNoPaymentMessage: false,
    });
  });

  it('shows the empty message only when every payment method is unavailable', () => {
    expect(
      getPaymentMethodVisibility({
        canPayByCard: false,
        canPayByCash: false,
        canPayByEcard: false,
      }).showNoPaymentMessage
    ).toBe(true);
  });
});
