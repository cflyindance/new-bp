import React from 'react';
import styles from './PromotionList.module.scss';
import { Button, Col, Row, Space, Switch, Tag, TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import { buyDishesToTreeSelectValue } from '@/utils/transformTreeMenu';

const TabBuyGifts = (props) => {
  const { buyGifts, changePromotionStatus, handleAddOrEditActivity, removePromotion, kioskMenu } =
    props;
  const { t } = useTranslation();

  return (
    <div>
      {buyGifts.map((each) => {
        const { timeInfo, activityRule, id, activityType } = each;
        const {
          buyType,
          buyNumber,
          buyDishes,
          giftsType,
          giftsNumber,
          giftsDishes,
          giftsDishesType,
        } = activityRule;
        const buyTypeLabel = t(buyType);
        const giftsTypeLabel = t(giftsType);
        const wayOfGivingLabel = t(giftsDishesType);
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
                    <Button type="link" onClick={() => handleAddOrEditActivity(each)}>
                      {t('operate-edit')}
                    </Button>
                    <Button type="link" onClick={() => removePromotion(id, activityType)}>
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
                    <Col className={styles.label} span={4}>
                      {t('ruleBuy', { buyTypeLabel, buyNumber })}
                    </Col>
                    <Col span={20}>
                      <TreeSelect
                        tagRender={(props) => {
                          return <Tag>{props.label}</Tag>;
                        }}
                        showCheckedStrategy="SHOW_ALL"
                        treeCheckable
                        allowClear={false}
                        onChange={() => {}}
                        className={styles.readonlyTreeSelect}
                        popupClassName={styles.readonlyTreeSelectPopup}
                        value={buyDishesToTreeSelectValue(
                          buyDishes || [],
                          kioskMenu
                        )}
                        maxTagCount={10}
                        multiple
                        fieldNames={{
                          label: 'name',
                          value: '_id',
                          children: 'children',
                        }}
                        treeData={kioskMenu}
                        listHeight={660}
                        getPopupContainer={(node) => node.parentNode}
                      />
                    </Col>
                  </Row>
                  <Row className={styles.ruleRow}>
                    <Col className={styles.label} span={4}>
                      {t('ruleGive', { wayOfGivingLabel, giftsTypeLabel, giftsNumber })}
                    </Col>
                    <Col span={20}>
                      <TreeSelect
                        tagRender={(props) => {
                          return <Tag>{props.label}</Tag>;
                        }}
                        showCheckedStrategy="SHOW_ALL"
                        treeCheckable
                        allowClear={false}
                        onChange={() => {}}
                        className={styles.readonlyTreeSelect}
                        popupClassName={styles.readonlyTreeSelectPopup}
                        value={buyDishesToTreeSelectValue(
                          giftsDishes || [],
                          kioskMenu
                        )}
                        maxTagCount={10}
                        multiple
                        fieldNames={{
                          label: 'name',
                          value: '_id',
                          children: 'children',
                        }}
                        treeData={kioskMenu}
                        listHeight={660}
                        getPopupContainer={(node) => node.parentNode}
                      />
                    </Col>
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

export default TabBuyGifts;
