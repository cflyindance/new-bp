import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import PhoneNumberEntryLayout from './index';

vi.mock('@/component/CRM/LoginCRM/components/Policy', async () => {
  const React = await import('react');

  return {
    default: function MockPolicy() {
      return React.default.createElement('div', null, 'Policy');
    },
  };
});

describe('PhoneNumberEntryLayout', () => {
  let container;

  beforeAll(() => {
    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {},
        interpolation: {
          escapeValue: false,
        },
      });
    }
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  test('renders title, phone field, after field content, policy, and actions', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberEntryLayout
          title="Join Rewards"
          value="1234567890"
          placeholder="Phone number"
          isVertical={false}
          isPrivacyConfirm={false}
          changePrivacyConfirm={vi.fn()}
          afterField={
            <div data-testid="after-field">Use your mobile number</div>
          }
          actions={<button type="button">Continue</button>}
        />,
        container
      );
    });

    expect(container.textContent).toContain('Join Rewards');
    expect(container.textContent).toContain('+1');
    expect(container.querySelector('input').value).toBe('(123) 456-7890');
    expect(
      container.querySelector('[data-testid="after-field"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="phone-entry-policy"]')
    ).not.toBeNull();
    expect(container.textContent).toContain('Continue');
  });

  test('does not render policy when showPolicy is false', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberEntryLayout
          title="Join Rewards"
          value=""
          placeholder="Phone number"
          showPolicy={false}
        />,
        container
      );
    });

    expect(
      container.querySelector('[data-testid="phone-entry-policy"]')
    ).toBeNull();
  });
});
