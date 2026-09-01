import { describe, expect, it } from 'vitest';
import { buildKioskConfigUpdateXml } from './apiPos';

describe('Kiosk POS config update request', () => {
  it('uses a valid administrator userId and the active session key', () => {
    const xml = buildKioskConfigUpdateXml(
      '<app:systemConfiguration><app:name>KIOSK_PAYMENT_TYPE</app:name><app:value>0,1</app:value></app:systemConfiguration>',
      '7',
      'session-from-local-bridge'
    );

    expect(xml).toContain(
      '<app:UpdateSystemConfigurationType><app:systemConfiguration>'
    );
    expect(xml).toContain('<app:userId>7</app:userId>');
    expect(xml).toContain(
      '<app:sessionKey>session-from-local-bridge</app:sessionKey>'
    );
  });

  it.each([undefined, null, '', '1.5', '1e2', 0, -1, true])(
    'rejects invalid userId before creating a SOAP request: %j',
    (userId) => {
      expect(() =>
        buildKioskConfigUpdateXml('<app:systemConfiguration />', userId, 's')
      ).toThrow('Valid POS configuration userId is required');
    }
  );
});
