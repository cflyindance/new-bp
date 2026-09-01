import { Button, Space } from 'antd';
import styles from './index.module.scss';
import Vertical from './components/Vertical';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getCookie, off, on } from '@/utils';
import {
  setKioskPosterPro,
  getKioskPosterPro,
  getAllKioskMenu,
} from '@/api/kioskConfigApi';
import { getECardSettings } from '@/api/eCard';
import { useMount, useUnmount } from 'ahooks';
import { posFrontLog } from '@/api';
import Toast from '@/component/toast';
import {
  changePosterStatus,
  setKioskMenuTree,
  setPosterData,
} from '@/actions/posterPro';
import { setECardQuickAmounts, setECardSettings } from '@/actions';
import menuUtils from '@/utils/getKioskMenu';
import buildECardQuickAmounts from '@/utils/buildECardQuickAmounts';
import {
  ASPECT_RATIO,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
} from '@/constants/posterPro';
import store from '@/reducers/store';

const { resolveKioskMenu } = menuUtils;

const PosterPro = (props) => {
  const {
    posterPro,
    setPosterData,
    changePosterStatus,
    setKioskMenuTree,
    setECardSettings,
    setECardQuickAmounts,
  } = props;
  const { status, posterData } = posterPro;
  const {
    t,
    i18n: { language },
  } = useTranslation();

  useMount(() => {
    handleGetPosterPro();
    handleGetMenu();
    handleGetECardConfig();
  });

  useUnmount(() => {
    off(window, 'message', getData);
    off(window, 'message', saveData);
  });

  const handleGetMenu = async () => {
    const res = await getAllKioskMenu();
    if (res?.data?.data?.menus) {
      const kioskMenu = res?.data?.data?.menus?.[0]?.menuGroups || [];
      const comboMenu =
        res?.data?.data?.menus?.[0]?.comboSectionSaleItemDTOList || [];
      const validMenu = resolveKioskMenu(kioskMenu, comboMenu, language);
      setKioskMenuTree(validMenu);
    }
  };

  const handleGetECardConfig = async () => {
    try {
      const response = await getECardSettings();
      setECardSettings(response?.data || null);
      setECardQuickAmounts(buildECardQuickAmounts(response?.data));
    } catch (e) {
      console.warn('Failed to get eCard settings:', e);
      posFrontLog(`get eCard settings failed ${e?.message}`);
    }
  };

  const getData = async (event) => {
    if (event.data.type === 'sessionKey') {
      try {
        const res = await getKioskPosterPro(event.data.data);
        if (res.data.result.successful) {
          const data = res.data.marginAppConfigTypes?.[0]?.data;
          if (data) {
            const parsedData = JSON.parse(data);
            const { posterData, status } = parsedData;
            setPosterData(posterData);
            changePosterStatus(status);
          }
          Toast.success('FETCH SUCCESS!', 2000);
          return;
        }
        Toast.info('FETCH FAILED!', 2000);
      } catch (e) {
        console.log(e);
        Toast.info('FETCH FAILED!', 2000);
        posFrontLog(`get kiosk poster pro failed ${e?.message}`);
      } finally {
        off(window, 'message', getData);
      }
    }
  };

  const handleGetPosterPro = async () => {
    // for dev
    if (process.env.NODE_ENV === 'development') {
      await getData({
        data: {
          type: 'sessionKey',
          data: getCookie('sessionKey'),
        },
      });
      return;
    }
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', getData);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const saveData = async (event) => {
    const currentStatus = store.getState().posterPro.status; //避免状态更新滞后
    if (event.data.type === 'sessionKey') {
      const data = {
        version: '0.0.1',
        viewportWidth: VIEWPORT_WIDTH,
        viewportHeight: VIEWPORT_HEIGHT,
        aspectRatio: ASPECT_RATIO,
        posterData,
        status: currentStatus,
      };
      try {
        const res = await setKioskPosterPro(
          JSON.stringify(data),
          event.data.data
        );
        if (res.data.result.successful) {
          Toast.success('SAVE SUCCESS!', 2000);
          return;
        }
        Toast.info('SAVE FAILED!', 2000);
      } catch (e) {
        Toast.info('SAVE FAILED!', 2000);
        posFrontLog(`save kiosk poster pro failed ${e?.message}`);
      } finally {
        off(window, 'message', saveData);
      }
    }
  };

  const handleSavePosterPro = async () => {
    // for dev
    if (process.env.NODE_ENV === 'development') {
      await saveData({
        data: {
          type: 'sessionKey',
          data: getCookie('sessionKey'),
        },
      });
      return;
    }
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', saveData);
  };

  const changeActiveStatus = async () => {
    const newStatus = status === 'disabled' ? 'enabled' : 'disabled';
    changePosterStatus(newStatus);
    handleSavePosterPro();
  };

  return (
    <div className={styles.posterWrapper}>
      <header className={styles.posterHeader}>
        <div className={styles.posterText}>{t('poster-pro-setting')}</div>
        <Space size={8}>
          <Button
            type="default"
            onClick={() => {
              props.history.replace('/configApp');
            }}
          >
            {t('back')}
          </Button>
          <Button type="primary" danger onClick={changeActiveStatus}>
            {status === 'disabled'
              ? t('poster-pro-enabled')
              : t('poster-pro-disabled')}
          </Button>
          {/* {status === 'draft' && <Button>发布</Button>} */}
          <Button type="primary" onClick={handleSavePosterPro}>
            {t('save')}
          </Button>
        </Space>
      </header>
      <main className={styles.mainContent}>
        <DndContext sensors={sensors}>
          <Vertical />
        </DndContext>
      </main>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps, {
  setPosterData,
  changePosterStatus,
  setKioskMenuTree,
  setECardSettings,
  setECardQuickAmounts,
})(PosterPro);
