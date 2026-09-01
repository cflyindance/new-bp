import React from 'react';
import { Button, Col, Row, Space, Switch, Tag, TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import { buyDishesToTreeSelectValue } from '@/utils/transformTreeMenu';
import styles from './PromotionList.module.scss';

const ReadonlyDishTree = ({ dishIds, kioskMenu }) => (
  <TreeSelect
    tagRender={(props) => <Tag>{props.label}</Tag>}
    showCheckedStrategy="SHOW_ALL"
    treeCheckable
    allowClear={false}
    onChange={() => {}}
    className={styles.readonlyTreeSelect}
    popupClassName={styles.readonlyTreeSelectPopup}
    value={buyDishesToTreeSelectValue(dishIds || [], kioskMenu)}
    maxTagCount={10}
    multiple
    fieldNames={{ label: 'name', value: '_id', children: 'children' }}
    treeData={kioskMenu}
    listHeight={660}
    getPopupContainer={(node) => node.parentNode}
  />
);

const TabExchangePurchase = ({
  exchangePurchase,
  changePromotionStatus,
  handleAddOrEditActivity,
  removePromotion,
  kioskMenu,
}) => {
  const { t } = useTranslation();

  return exchangePurchase.map((item) => {
    const { id, activityType, activityRule, timeInfo } = item;
    const discountText =
      activityRule.discountType === 'fixDiscount'
        ? `$${activityRule.discountNumber}`
        : `${activityRule.discountNumber}%`;
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
                  onChange={(value) => changePromotionStatus(id, value)}
                  checked={item.enable}
                  checkedChildren={t('config-open')}
                  unCheckedChildren={t('config-close')}
                />
                <Button
                  type="link"
                  onClick={() => handleAddOrEditActivity(item)}
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
                {timeInfo.weekDay.length > 0 && (
                  <span>{timeInfo.weekDay.join(', ')}</span>
                )}
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
              {activityRule.conditionType === 'orderAmount' ? (
                <Row className={styles.ruleRow}>
                  <Col span={24}>
                    {t('orderExchangeThreshold', {
                      price: activityRule.satisfyPrice,
                    })}
                  </Col>
                </Row>
              ) : (
                <Row className={styles.ruleRow}>
                  <Col className={styles.label} span={4}>
                    {t('ruleBuy', {
                      buyTypeLabel: t(activityRule.buyType),
                      buyNumber: activityRule.buyNumber,
                    })}
                  </Col>
                  <Col span={20}>
                    <ReadonlyDishTree
                      dishIds={activityRule.buyDishes}
                      kioskMenu={kioskMenu}
                    />
                  </Col>
                </Row>
              )}
              <Row className={styles.ruleRow}>
                <Col className={styles.label} span={4}>
                  {t('exchangeRule', {
                    giftsType: t(activityRule.giftsType),
                    giftsNumber: activityRule.giftsNumber,
                  })}
                </Col>
                <Col span={20}>
                  <ReadonlyDishTree
                    dishIds={activityRule.giftsDishes}
                    kioskMenu={kioskMenu}
                  />
                </Col>
              </Row>
              <Row className={styles.ruleRow}>
                <Col span={24}>
                  {t('exchangeDiscountRule', { discount: discountText })}
                </Col>
              </Row>
            </Col>
          </Row>
        </Space>
      </div>
    );
  });
};

export default TabExchangePurchase;
