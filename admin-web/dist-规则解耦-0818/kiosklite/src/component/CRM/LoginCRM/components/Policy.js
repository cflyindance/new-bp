import React, { useState } from 'react';
import styles from './Policy.module.scss';
import Modal from '@/component/Modal';
import PolicyContent from './PolicyContent';
import { useTranslation } from 'react-i18next';
import { Checkbox } from 'antd';
import Dialog from '@/component/dialog';

const Policy = (props) => {
  const { t } = useTranslation();
  const { isPrivacyConfirm, changePrivacyConfirm } = props;
  const [policyContentVisible, setPolicyContentVisible] = useState(false);
  const [policyContentUrl, setPolicyContentUrl] = useState('');

  const openPolicyTab = async (url) => {
    setPolicyContentUrl(url);
    setPolicyContentVisible(true);
  };

  return (
    <div className={styles.policy}>
      <Checkbox
        rootClassName={styles.checkbox}
        checked={isPrivacyConfirm}
        onClick={() => changePrivacyConfirm(!isPrivacyConfirm)}
      />
      <div className={styles.policyText}>
        <span> {t('termOfPolicy0')}</span>
        <span
          className={styles.likeLink}
          onClick={() =>
            openPolicyTab(
              'https://order.mealkeyway.com/dashboard/release/index#/servicesagreement'
            )
          }
        >
          {t('termOfPolicy1')}
        </span>
        <span> {t('termOfPolicy2')}</span>
        <span
          className={styles.likeLink}
          onClick={() =>
            openPolicyTab(
              'https://order.mealkeyway.com/dashboard/release/index#/privacypolicy'
            )
          }
        >
          {t('termOfPolicy3')}
        </span>
      </div>

      <Dialog
        visible={policyContentVisible}
        isMountOnBody
        html={
          <PolicyContent
            url={policyContentUrl}
            t={t}
            onClose={() => setPolicyContentVisible(false)}
          />
        }
        onClose={() => setPolicyContentVisible(false)}
      />
    </div>
  );
};

export default Policy;
