import React from 'react';
import PhoneNumberField from '@/component/PhoneNumberField';
import Policy from '@/component/CRM/LoginCRM/components/Policy';
import jingleBell from '@/assets/images/jingleBell.png';
import styles from './PhoneNumberEntryLayout.module.scss';

const PhoneNumberEntryLayout = ({
  title,
  titleIcon = jingleBell,
  value,
  placeholder,
  inputRef,
  isVertical,
  onPhoneChange,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  onClick,
  showPolicy = true,
  isPrivacyConfirm,
  changePrivacyConfirm,
  afterField,
  actions,
  className = '',
}) => (
  <div className={`${styles.entryLayout} ${className}`.trim()}>
    <div className={styles.titleWrapper}>
      {titleIcon ? (
        <img className={styles.titleIcon} src={titleIcon} alt="" />
      ) : null}
      <div className={styles.title}>{title}</div>
    </div>

    <div className={styles.fieldWrapper}>
      <PhoneNumberField
        value={value}
        placeholder={placeholder}
        inputRef={inputRef}
        isVertical={isVertical}
        onChange={onPhoneChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={onFocus}
        onBlur={onBlur}
        onClick={onClick}
      />
    </div>

    {afterField ? <div className={styles.afterField}>{afterField}</div> : null}

    {showPolicy ? (
      <div className={styles.policyWrapper} data-testid="phone-entry-policy">
        <Policy
          isPrivacyConfirm={isPrivacyConfirm}
          changePrivacyConfirm={changePrivacyConfirm}
        />
      </div>
    ) : null}

    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);

export default PhoneNumberEntryLayout;
