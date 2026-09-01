import React, { useEffect, useState } from 'react';
import styles from './PromotionList.module.scss';
import { Button, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import Modal from '@/component/Modal';
import { promotionItem } from '@/constants/selfConfig';
import AddActivity from './AddActivity';
import { nanoid } from 'nanoid';
import { getAllKioskMenu } from '@/api/kioskConfigApi';
import menuUtils from '@/utils/getKioskMenu';
import TabList from './TabList';
import ActivityTypeDef from './ActivityTypeDef';
import { DoubleRightOutlined } from '@ant-design/icons';
import { requestAllSysConfig } from '@/utils/allSysConfigHelper';

const { resolveKioskMenu } = menuUtils;

const PromotionList = (props) => {
  const [activeKey, setActiveKey] = useState(null);
  const [kioskMenu, setKioskMenu] = useState([]);
  const [allSysConfig, setAllSysConfig] = useState({});
  const {
    promotion,
    setPromotion,
    promotionEnableType,
    setPromotionEnableType,
  } = props;
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!activeKey) {
      if (promotionEnableType) return setActiveKey(promotionEnableType);
      if (promotionEnableType === '') {
        const key = promotion.map((each) => each.activityType)?.[0];
        setActiveKey(key);
      }
    }
  }, [activeKey, promotion, setActiveKey, promotionEnableType]);

  useEffect(() => {
    handleGetMenu();
    handleGetSysConfig();
  }, []);

  const handleGetMenu = async () => {
    const { language } = i18n;
    const res = await getAllKioskMenu();
    if (res?.data?.data?.menus) {
      const kioskMenu = res?.data?.data?.menus?.[0]?.menuGroups || [];
      const comboMenu =
        res?.data?.data?.menus?.[0]?.comboSectionSaleItemDTOList || [];
      const validMenu = resolveKioskMenu(kioskMenu, comboMenu, language);
      setKioskMenu(validMenu);
    }
  };

  const handleGetSysConfig = async () => {
    const result = await requestAllSysConfig();
    if (result?.config) {
      setAllSysConfig(result.config);
    }
  };

  const handleAddOrEditActivity = async (data) => {
    const res = await Modal.loadModal(
      <AddActivity
        allSysConfig={allSysConfig}
        promotion={promotion}
        kioskMenu={kioskMenu}
        promotionItem={data}
        dataId={data.id}
      />,
      {
        width: '800px',
        footer: null,
        title: data.id ? t('editPromotion') : t('addPromotion'),
      }
    );
    if (!res) return;
    // 新建
    if (res && !res.id) {
      res.id = nanoid();
      setPromotion([...promotion, res]);
      setActiveKey(res.activityType);
      return;
    }
    const newPromotion = promotion.map((each) => {
      if (each.id === res.id) {
        return res;
      }
      return each;
    });
    setPromotion(newPromotion);
  };

  const handleShowDef = async () => {
    await Modal.loadModal(<ActivityTypeDef />, {
      width: '700px',
      footer: null,
      title: t('promotionDef'),
    });
  };

  return (
    <div className={styles.contentWrapper}>
      <Row justify="space-between">
        <Col>
          <span className={styles.defText} onClick={handleShowDef}>
            {t('promotionDef')}
            <span className={styles.more}>
              <DoubleRightOutlined />
            </span>
          </span>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => handleAddOrEditActivity(promotionItem)}
          >
            {t('addPromotion')}
          </Button>
        </Col>
      </Row>
      {promotion.length > 0 ? (
        <TabList
          activeKey={activeKey}
          setActiveKey={setActiveKey}
          promotion={promotion}
          setPromotion={setPromotion}
          kioskMenu={kioskMenu}
          handleAddOrEditActivity={handleAddOrEditActivity}
          promotionEnableType={promotionEnableType}
          setPromotionEnableType={setPromotionEnableType}
        />
      ) : (
        <div className={styles.noActivity}>{t('no-data')}</div>
      )}
    </div>
  );
};

export default PromotionList;
