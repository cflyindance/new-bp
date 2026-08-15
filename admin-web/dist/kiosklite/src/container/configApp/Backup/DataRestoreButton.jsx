import { useTranslation } from 'react-i18next';
import Button from 'antd/es/button';
import { useBoolean } from 'ahooks';
import InputPassword from '../InputPassword';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import Toast from '@/component/toast';
import { PASSWORD } from '@/constants/mockData';
import { setSelfConfig } from '@/actions';
import { postMarginappConfig } from '@/api/kioskConfigApi';
import { requestKioskConfigSessionKey } from '@/utils';

const DataRestoreButton = () => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const [fileChooserLoading, setFileChooserLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [
    authModalVisible,
    { setTrue: openAuthModal, setFalse: closeAuthModal },
  ] = useBoolean(false);
  const fileUploadRef = useRef(null);

  const onBeforeDataRestore = () => {
    openAuthModal();
  };

  const onDataRestore = async (password) => {
    if (PASSWORD.includes(password)) {
      setFileChooserLoading(true);
      setTimeout(() => {
        setFileChooserLoading(false);
      }, 1000);
      fileUploadRef.current?.click();
      closeAuthModal();
    } else {
      Toast.info(t('password-error'), 1500);
    }
  };

  const onFileUpload = async (e) => {
    setFileChooserLoading(false);

    const file = e.target.files[0];
    if (file.type !== 'application/json') {
      Toast.error(t('data_restore_fail_json'));
      return;
    }

    setLoading(true);
    try {
      const jsonString = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.onerror = () => {
          reject();
        };
        reader.readAsText(file);
      });
      const config = JSON.parse(jsonString);
      
      // 更新 Redux 状态
      dispatch(setSelfConfig(config));
      
      const sessionKey = await requestKioskConfigSessionKey();
      const res = await postMarginappConfig(JSON.stringify(config), sessionKey);
      if (res?.data?.result?.successful) {
        Toast.success(t('data_restore_success'));
      } else {
        throw new Error();
      }
    } catch {
      Toast.error(t('data_restore_fail'));
    }
    setLoading(false);
    fileUploadRef.current.value = '';
  };

  return (
    <>
      <Button
        type="text"
        onClick={onBeforeDataRestore}
        loading={loading || fileChooserLoading}
        style={{ color: 'rgba(0,0,0,0.6)' }}
      >
        {t('data_restore')}
      </Button>
      <InputPassword
        visible={authModalVisible}
        onCancel={closeAuthModal}
        onConfirm={onDataRestore}
      />
      <input
        type="file"
        accept=".json"
        onChange={onFileUpload}
        ref={fileUploadRef}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default DataRestoreButton;
