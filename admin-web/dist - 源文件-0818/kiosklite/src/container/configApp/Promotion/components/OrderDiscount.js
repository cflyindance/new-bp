import React from 'react';
import { Col, Input, Row, Select } from 'antd';
import { orderDiscountItem, discountTypes } from '@/constants/selfConfig';
import { useTranslation } from 'react-i18next';
import styles from './BuyGifts.module.scss';

const { Option } = Select;

const OrderDiscount = (props) => {
  const { onChange, value = orderDiscountItem } = props;
  const { t } = useTranslation();

  const handleChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  const handleResolveInput = (key, v, regex) => {
    const value = v.replace(regex, '');
    handleChange(key, value);
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={12}>
          <Input
            onChange={(e) =>
              handleResolveInput('satisfyPrice', e.target.value, /[^0-9]/g)
            }
            value={value.satisfyPrice}
            addonBefore={<span>{t('orderSatisfy')} $</span>}
            addonAfter={<span>{t('enjoy')}</span>}
          />
        </Col>
        <Col span={12}>
          <Select
            value={value.discountType}
            onChange={(v) => handleChange('discountType', v)}
            getPopupContainer={(node) => node.parentNode}
          >
            {discountTypes.map((each) => {
              return (
                <Option key={each} value={each}>
                  {t(each)}
                </Option>
              );
            })}
          </Select>
        </Col>
      </Row>
      <Row className={styles.dishSelect}>
        <Col span={24}>
          {value.discountType === 'fixDiscount' && (
            <Input
              onChange={(e) =>
                handleResolveInput('discountNumber', e.target.value, /[^0-9.]/g)
              }
              value={value.discountNumber}
              addonBefore={<span>{t('fixAmount')} $</span>}
            />
          )}
          {value.discountType === 'rateDiscount' && (
            <Input
              onChange={(e) =>
                handleResolveInput('discountNumber', e.target.value, /[^0-9.]/g)
              }
              value={value.discountNumber}
              addonBefore={<span>{t('percent')}</span>}
              addonAfter={<span>% off</span>}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default OrderDiscount;
