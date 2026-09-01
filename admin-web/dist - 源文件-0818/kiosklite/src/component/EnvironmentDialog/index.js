import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import Dialog from '../dialog';
import styles from './environmentDialog.module.scss';
import {
  RUNTIME_ENV_OPTIONS,
  getRuntimeEnvLabel,
} from '@/utils/runtimeEnv';

const EnvironmentDialog = ({ visible, value, onCancel, onConfirm, t }) => {
  const [selectedEnv, setSelectedEnv] = useState(value);

  useEffect(() => {
    if (visible) setSelectedEnv(value);
  }, [visible, value]);

  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  return (
    <Dialog
      isMountOnBody
      visible={visible}
      html={
        <div
          className={styles.containerBox}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiosk-runtime-env-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.title} id="kiosk-runtime-env-title">
            {t('runtime_env_title')}
          </div>
          <div className={styles.optionBox}>
            {RUNTIME_ENV_OPTIONS.map((env) => (
              <span
                key={env}
                className={
                  env === selectedEnv
                    ? `${styles.option} ${styles.optionActive}`
                    : styles.option
                }
                onClick={() => setSelectedEnv(env)}
              >
                {getRuntimeEnvLabel(env)}
              </span>
            ))}
          </div>
          <div className={styles.btnBox}>
            <span onClick={onCancel}>{t('cancel')}</span>
            <span
              className="linear-animate-btn"
              onClick={() => onConfirm(selectedEnv)}
            >
              {t('confirm')}
            </span>
          </div>
        </div>
      }
      onClose={onCancel}
    />
  );
};

export default withTranslation()(EnvironmentDialog);
