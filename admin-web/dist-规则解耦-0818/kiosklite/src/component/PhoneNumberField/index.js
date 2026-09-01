import React from 'react';
import NumPad from '../numPad';
import {
  PHONE_NUMBER_INPUT_MAX_LENGTH,
  PHONE_NUMBER_MAX_LENGTH,
  formatUSPhoneInput,
  normalizePhoneDigits,
} from '@/utils/phoneNumber';
import { isIpadEnv } from '@/utils';
import styles from './PhoneNumberField.module.scss';

const PHONE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const PhoneNumberField = ({
  value,
  placeholder,
  inputRef,
  isVertical,
  countryCode = '+1',
  onChange,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  onClick,
}) => {
  const digits = normalizePhoneDigits(value);
  const formattedValue = formatUSPhoneInput(value);
  const displayValue = formattedValue || placeholder;
  const showCustomNumPad = isVertical && !isIpadEnv();

  const emitChange = (nextValue) => {
    const nextFormatted = formatUSPhoneInput(nextValue);
    onChange?.(nextFormatted, normalizePhoneDigits(nextFormatted));
  };

  const handleInputChange = (event) => {
    emitChange(event.target.value);
  };

  return (
    <div className={styles.numPad}>
      <div className={countryCode ? styles.inputWithCountryCode : undefined}>
        {countryCode ? (
          <div className={styles.countryCode}>{countryCode}</div>
        ) : null}
        <input
          ref={inputRef}
          maxLength={PHONE_NUMBER_INPUT_MAX_LENGTH}
          value={formattedValue}
          autoFocus={false}
          className={styles.showPhone}
          type="tel"
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
          style={{ opacity: showCustomNumPad ? 0 : 1 }}
        />
      </div>

      {showCustomNumPad ? (
        <>
          <div className={`${styles.showPhone} ${styles.displayPhone}`}>
            {displayValue}
          </div>
          <NumPad
            keys={PHONE_KEYS}
            propValue={digits}
            maxLength={PHONE_NUMBER_MAX_LENGTH}
            keyPress={(nextValue) => emitChange(nextValue)}
          />
        </>
      ) : null}
    </div>
  );
};

export default PhoneNumberField;
