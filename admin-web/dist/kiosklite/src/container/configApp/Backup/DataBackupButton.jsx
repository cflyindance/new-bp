import { getMarginappFetchKioskConfig } from '@/api/kioskConfigApi';
import { requestKioskConfigSessionKey } from '@/utils';
import Toast from '@/component/toast';
import Button from 'antd/es/button';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const DataBackupButton = () => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const onDataBackup = async () => {
    setLoading(true);
    try {
      const sessionKey = await requestKioskConfigSessionKey();
      const res = await getMarginappFetchKioskConfig(sessionKey);
      if (res.data?.result?.successful) {
        const allConfig = res.data.marginAppConfigTypes;
        const emenuConfig = allConfig?.find((l) => l.product === 'KIOSKLITE');
        const configDataJson = emenuConfig?.data || '{}';
        const formatedConfigDataJson = JSON.stringify(
          JSON.parse(configDataJson),
          null,
          2
        );
        const blob = new Blob([formatedConfigDataJson], {
          type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kiosk_config_${dayjs().format('YYYY-MM-DD HH:mm:ss')}.json`;
        a.click();
        Toast.success(t('data_backup_success'));
      } else if (res.data?.result?.failureReason !== 'Invalid session key') {
        throw new Error();
      }
    } catch (e) {
      Toast.error(e?.message || t('data_backup_fail'));
    }
    setLoading(false);
  };

  return (
    <Button
      type="text"
      onClick={onDataBackup}
      loading={loading}
      style={{ color: 'rgba(0,0,0,0.6)' }}
    >
      {t('data_backup')}
    </Button>
  );
};

export default DataBackupButton;
