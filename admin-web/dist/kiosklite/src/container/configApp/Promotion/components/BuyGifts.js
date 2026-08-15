import React from 'react';
import { Input, Select, Row, Col, TreeSelect } from 'antd';
import styles from './BuyGifts.module.scss';
import { buyGiftItem, choiceType, wayOfGiving } from '@/constants/selfConfig';
import { useTranslation } from 'react-i18next';
import DishTree from '@/container/configApp/Promotion/components/DishTree';

const { Option } = Select;

const BuyGifts = (props) => {
  const { t } = useTranslation();
  const { onChange, value = buyGiftItem, kioskMenu } = props;

  const handleChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  const handleResolveInput = (key, v) => {
    const value = v.replace(/[^0-9]/g, '');
    handleChange(key, value);
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Select 
            value={value.buyType} 
            onChange={(v) => handleChange('buyType', v)}
            getPopupContainer={(node) => node.parentNode}
          >
            {choiceType.map((each) => {
              return (
                <Option key={each.value} value={each.value}>
                  {t(each.value)}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col span={12}>
          <Input
            onChange={(e) => handleResolveInput('buyNumber', e.target.value)}
            value={value.buyNumber}
            addonBefore={<span>{t('buy')}</span>}
            addonAfter={<span>{t('item')}</span>}
          />
        </Col>
        <Col span={24} className={styles.dishSelect}>
          <DishTree
            kioskMenu={kioskMenu}
            handleChange={handleChange}
            value={value.buyDishes || []}
            changeKey="buyDishes"
          />
        </Col>
      </Row>
      <Row gutter={16} className={styles.giftsRow}>
        <Col span={8}>
          <Select
            value={value.giftsDishesType}
            onChange={(v) => handleChange('giftsDishesType', v)}
            getPopupContainer={(node) => node.parentNode}
          >
            {wayOfGiving.map((each) => {
              return (
                <Option key={each.value} value={each.value}>
                  {t(each.value)}
                </Option>
              );
            })}
          </Select>
        </Col>
        <Col span={16}>
          <Input
            onChange={(e) => handleResolveInput('giftsNumber', e.target.value)}
            value={value.giftsNumber}
            addonBefore={
              <>
                <span>{t('give')}</span>
                <Select
                  style={{ width: 100 }}
                  value={value.giftsType}
                  onChange={(v) => handleChange('giftsType', v)}
                  getPopupContainer={(node) => node.parentNode}
                >
                  {choiceType.map((each) => {
                    return (
                      <Option key={each.value} value={each.value}>
                        {t(each.value)}
                      </Option>
                    );
                  })}
                </Select>
              </>
            }
            addonAfter={<span>{t('item')}</span>}
          />
        </Col>
        <Col span={24} className={styles.dishSelect}>
          <DishTree
            kioskMenu={kioskMenu}
            handleChange={handleChange}
            value={value.giftsDishes || []}
            changeKey="giftsDishes"
          />
        </Col>
      </Row>
    </div>
  );
};

export default BuyGifts;
