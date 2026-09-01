import React, { useEffect, useState } from 'react';
import { EventBus } from '@/utils/EventBus';
import Dialog from '@/component/dialog';
import style from './index.module.scss';
import { useTranslation } from 'react-i18next';

const KioskModal = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    EventBus.on('open_kiosk_modal', () => setVisible(true));
    EventBus.on('close_kiosk_modal', () => setVisible(false));
    return () => {
      EventBus.off('open_kiosk_modal');
      EventBus.off('close_kiosk_modal');
    };
  }, []);

  const str = t('doubleScreen');

  return (
    <Dialog
      outerStyle={{ zIndex: 9999 }}
      visible={visible}
      html={<div className={style.modalContent}>{str}</div>}
    />
  );
};

export default KioskModal;
