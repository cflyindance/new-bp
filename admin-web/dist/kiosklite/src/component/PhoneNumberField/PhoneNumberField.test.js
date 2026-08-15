import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { vi } from 'vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import PhoneNumberField from './index';

describe('PhoneNumberField', () => {
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

  test('formats native input changes and emits normalized digits', () => {
    const handleChange = vi.fn();

    act(() => {
      ReactDOM.render(
        <PhoneNumberField
          value=""
          placeholder="Phone number"
          isVertical={false}
          onChange={handleChange}
        />,
        container
      );
    });

    const input = container.querySelector('input');
    input.value = '1234567890';

    act(() => {
      Simulate.change(input);
    });

    expect(handleChange).toHaveBeenCalledWith('(123) 456-7890', '1234567890');
  });

  test('renders country code and keeps native input hidden in vertical mode', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberField
          value="1234567890"
          placeholder="Phone number"
          isVertical
          countryCode="+1"
        />,
        container
      );
    });

    expect(container.textContent).toContain('+1');
    expect(container.textContent).toContain('(123) 456-7890');
    expect(container.querySelector('input').style.opacity).toBe('0');
  });

  test('renders +1 country code by default', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberField
          value=""
          placeholder="Phone number"
          isVertical={false}
        />,
        container
      );
    });

    expect(container.textContent).toContain('+1');
  });

  test('allows the full formatted phone number length in native input', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberField
          value=""
          placeholder="Phone number"
          isVertical={false}
        />,
        container
      );
    });

    expect(container.querySelector('input').maxLength).toBe(
      '(123) 456-7890'.length
    );
  });

  test('passes key down events to callers', () => {
    const handleKeyDown = vi.fn();

    act(() => {
      ReactDOM.render(
        <PhoneNumberField
          value=""
          placeholder="Phone number"
          isVertical={false}
          onKeyDown={handleKeyDown}
        />,
        container
      );
    });

    act(() => {
      Simulate.keyDown(container.querySelector('input'), { keyCode: 13 });
    });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });
});
