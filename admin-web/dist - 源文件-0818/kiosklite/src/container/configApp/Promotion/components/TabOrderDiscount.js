import React from 'react';
import styles from './PromotionList.module.scss';
import { Button, Col, Row, Space, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { orderDiscountItem } from '@/constants/selfConfig';
import { copyCode } from '@/utils';

const TabOrderDiscount = (props) => {
  const {
    orderDiscount,
    changePromotionStatus,
    handleAddOrEditActivity,
    removePromotion,
  } = props;
  const { t } = useTranslation();

  return (
    <div>
      {orderDiscount.map((each) => {
        const { timeInfo, activityRule, id, activityType } = each;
        const { satisfyPrice, discountType, discountNumber } = activityRule;
        const type = t(discountType);
        return (
          <div key={id} className={styles.promotionItem}>
            <Space size={16} direction="vertical">
              <Row align="center">
                <Col span={16} className={styles.title}>
                  {t('activityTime')}
                </Col>
                <Col span={8}>
                  <Space size={16} className={styles.operation}>
                    <Switch
                      onChange={(v) => changePromotionStatus(id, v)}
                      checked={each.enable}
                      checkedChildren={t('config-open')}
                      unCheckedChildren={t('config-close')}
                    />
                    <Button
                      type="link"
                      onClick={() => {
                        const data = {
                          ...each,
                          activityRule: {
                            ...orderDiscountItem,
                            ...each.activityRule,
                          },
                        };
                        handleAddOrEditActivity(data);
                      }}
                    >
                      {t('operate-edit')}
                    </Button>
                    <Button
                      type="link"
                      onClick={() => removePromotion(id, activityType)}
                    >
                      {t('operate-remove')}
                    </Button>
                  </Space>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Space size={16}>
                    {timeInfo.startDate && (
                      <span>
                        {timeInfo.startDate} - {timeInfo.endDate}
                      </span>
                    )}
                    {timeInfo.weekDay.length > 0 ? (
                      <span>{timeInfo.weekDay.join(', ')}</span>
                    ) : null}
                    {timeInfo.startTime && (
                      <span>
                        {timeInfo.startTime} - {timeInfo.endTime}
                      </span>
                    )}
                  </Space>
                </Col>
              </Row>
              <Row>
                <Col span={24} className={styles.title}>
                  {t('activityRule')}
                </Col>
                <Col span={24}>
                  <Row className={styles.ruleRow}>
                    <Col span={24}>
                      {t('orderDiscountRule', {
                        price: satisfyPrice,
                        type,
                        discount:
                          discountType === 'fixDiscount'
                            ? `$${discountNumber}`
                            : `${discountNumber}%`,
                      })}
                    </Col>
                    {activityRule.usePromotionCode === '1' && (
                      <>
                        <Col span={24}>
                          {t('promotionCodeName')}：
                          {activityRule.promotionCodeName}
                        </Col>
                        <Col span={24}>
                          {t('promotionCode')}：{activityRule.promotionCode}
                          <span
                            className={styles.copyBtn}
                            onClick={() => copyCode(activityRule.promotionCode)}
                          >
                            {t('copy')}
                          </span>
                        </Col>
                      </>
                    )}
                  </Row>
                </Col>
              </Row>
            </Space>
          </div>
        );
      })}
    </div>
  );
};

export default TabOrderDiscount;
