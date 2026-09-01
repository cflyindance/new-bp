import { describe, expect, it } from 'vitest';
import mainPageSource from './index.js?raw';

describe('Kiosk payment method persistence', () => {
  it('does not overwrite payment methods when the Kiosk home page starts', () => {
    expect(mainPageSource).not.toContain('syncDualPricePaymentTypesToPos');
    expect(mainPageSource).not.toContain('saveKioskConfigFromPos');
  });
});
