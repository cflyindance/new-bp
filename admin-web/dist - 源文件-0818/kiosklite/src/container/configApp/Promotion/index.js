import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import ConfigHeader from '@/component/configHeader';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import ConfigFooter from '@/component/configFooter';
import { on, off, getCookie } from '@/utils';
import {
  getMarginappFetchKioskConfig,
  postMarginappConfig,
} from '@/api/kioskConfigApi';
import Toast from '@/component/toast';
import PromotionList from './components/PromotionList';

const devSessionKey = '4fd6nib0s47qqlf674r7uopqf';

const Promotion = (props) => {
  const { t } = props;
  const [allKioskConfig, setAllKioskConfig] = useState({});
  const [promotion, setPromotion] = useState([]);
  const [promotionEnableType, setPromotionEnableType] = useState(null);

  useEffect(() => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', initConfig);
    // for dev
    // getKioskConfig(devSessionKey);
    return () => {
      off(window, 'message', initConfig);
      off(window, 'message', saveConfig);
    };
  }, []);

  const initConfig = (event) => {
    if (event.data.type === 'sessionKey') {
      getKioskConfig(event.data.data);
    }
    if (process.env.NODE_ENV === 'development') {
      // console.log('NODE_ENV',getCookie('sessionKey'));

      getKioskConfig(getCookie('sessionKey'));
    }
  };

  const getKioskConfig = async (sessionKey) => {
    const res = await getMarginappFetchKioskConfig(sessionKey);
    if (res.data.result.successful) {
      const list = res.data.marginAppConfigTypes;
      const kioskConfig = list?.find((l) => l.product === 'KIOSKLITE');
      const parsedConfig = JSON.parse(kioskConfig?.data || '{}');
      if (!parsedConfig?.promotion) {
        parsedConfig.promotion = [];
        await setConfigSetting(parsedConfig, sessionKey);
        off(window, 'message', initConfig);
        return;
      }
      setAllKioskConfig(parsedConfig);
      setPromotion(parsedConfig.promotion);
      setPromotionEnableType(parsedConfig.promotionEnableType || '');
      off(window, 'message', initConfig);
    }
  };

  const setConfigSetting = async (config, sessionKey) => {
    const newData = JSON.stringify(config);
    const res = await postMarginappConfig(newData, sessionKey);
    if (res.data?.result?.successful) {
      await getKioskConfig(sessionKey);
      Toast.info('SUCCESS', 1000);
    }
    off(window, 'message', saveConfig);
  };

  const handleSaveConfig = async (sessionKey) => {
    const newData = {
      ...allKioskConfig,
      promotion,
      promotionEnableType,
    };
    await setConfigSetting(newData, sessionKey);
  };

  const saveConfig = (event) => {
    if (event.data.type === 'sessionKey') {
      handleSaveConfig(event.data.data);
    }
  };

  const handleSave = () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', saveConfig);

    // for dev
    // handleSaveConfig(devSessionKey);
  };

  return (
    <div className={styles.promotionWrapper}>
      <ConfigHeader headTitle={t('promotion')} />
      <div className={styles.mainWrapper}>
        <div className={styles.innerWrapper}>
          <PromotionList
            promotion={promotion}
            setPromotion={setPromotion}
            promotionEnableType={promotionEnableType}
            setPromotionEnableType={setPromotionEnableType}
          />
        </div>
      </div>

      <ConfigFooter handleSave={handleSave} />
    </div>
  );
};

export default withRouter(withTranslation()(Promotion));
