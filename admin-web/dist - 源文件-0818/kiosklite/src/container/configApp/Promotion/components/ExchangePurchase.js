import React from 'react';
import { Col, Input, Radio, Row, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  choiceType,
  discountTypes,
  exchangePurchaseItem,
  wayOfGiving,
} from '@/constants/selfConfig';
import DishTree from './DishTree';
import styles from './BuyGifts.module.scss';

const { Option } = Select;

const ExchangePurchase = ({
  onChange,
  value = exchangePurchaseItem,
  kioskMenu,
}) => {
  const { t } = useTranslation();

  const handleChange = (key, newValue) => {
    onChange({ ...value, [key]: newValue });
  };

  const handleNumberChange = (key, inputValue, allowDecimal = false) => {
    const regex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    handleChange(key, inputValue.replace(regex, ''));
  };

  return (
    <div>
      <Radio.Group
        value={value.conditionType}
        onChange={(event) => handleChange('conditionType', event.target.value)}
      >
        <Radio value="orderAmount">{t('orderExchangePurchase')}</Radio>
        <Radio value="itemQuantity">{t('itemExchangePurchase')}</Radio>
      </Radio.Group>

      {value.conditionType === 'orderAmount' && (
        <Row className={styles.dishSelect}>
          <Col span={24}>
            <Input
              value={value.satisfyPrice}
              onChange={(event) =>
                handleNumberChange('satisfyPrice', event.target.value, true)
              }
              addonBefore={<span>{t('orderSatisfy')} $</span>}
            />
          </Col>
        </Row>
      )}

      {value.conditionType === 'itemQuantity' && (
        <>
          <Row gutter={16} className={styles.dishSelect}>
            <Col span={12}>
              <Select
                value={value.buyType}
                onChange={(nextValue) => handleChange('buyType', nextValue)}
                getPopupContainer={(node) => node.parentNode}
              >
                {choiceType.map((item) => (
                  <Option key={item.value} value={item.value}>
                    {t(item.value)}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={12}>
              <Input
                value={value.buyNumber}
                onChange={(event) =>
                  handleNumberChange('buyNumber', event.target.value)
                }
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
        </>
      )}

      <Row gutter={16} className={styles.giftsRow}>
        <Col span={8}>
          <Select
            value={value.giftsDishesType}
            onChange={(nextValue) => handleChange('giftsDishesType', nextValue)}
            getPopupContainer={(node) => node.parentNode}
          >
            {wayOfGiving.map((item) => (
              <Option key={item.value} value={item.value}>
                {t(item.value)}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={16}>
          <Input
            value={value.giftsNumber}
            onChange={(event) =>
              handleNumberChange('giftsNumber', event.target.value)
            }
            addonBefore={
              <>
                <span>{t('exchange')}</span>
                <Select
                  style={{ width: 100 }}
                  value={value.giftsType}
                  onChange={(nextValue) => handleChange('giftsType', nextValue)}
                  getPopupContainer={(node) => node.parentNode}
                >
                  {choiceType.map((item) => (
                    <Option key={item.value} value={item.value}>
                      {t(item.value)}
                    </Option>
                  ))}
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

      <Row gutter={16} className={styles.dishSelect}>
        <Col span={8}>{t('discountPerItem')}</Col>
        <Col span={16}>
          <Select
            value={value.discountType}
            onChange={(nextValue) => handleChange('discountType', nextValue)}
            getPopupContainer={(node) => node.parentNode}
          >
            {discountTypes.map((item) => (
              <Option key={item} value={item}>
                {t(item)}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={24} className={styles.dishSelect}>
          <Input
            value={value.discountNumber}
            onChange={(event) =>
              handleNumberChange('discountNumber', event.target.value, true)
            }
            addonBefore={
              <span>
                {t(
                  value.discountType === 'fixDiscount'
                    ? 'fixDiscount'
                    : 'rateDiscount'
                )}
                {value.discountType === 'fixDiscount' ? ' $' : ''}
              </span>
            }
            addonAfter={
              value.discountType === 'rateDiscount' ? <span>% off</span> : null
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default ExchangePurchase;
