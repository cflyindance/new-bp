import React, { useMemo, useState } from 'react';
import { Button, Space, Form, Row, Select, Radio, Input } from 'antd';
import {
  activityTypes,
  buyDiscountItem,
  buyGiftItem,
  exchangePurchaseItem,
  layout,
  orderDiscountItem,
} from '@/constants/selfConfig';
import DateWeekTime from '@/component/DateWeekTime';
import BuyGifts from './BuyGifts';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useTranslation } from 'react-i18next';
import BuyDiscount from './BuyDiscount';
import OrderDiscount from './OrderDiscount';
import ExchangePurchase from './ExchangePurchase';
import { useCloseModalOnHomePage } from '@/hooks';
import checkCRMStatus from '@/utils/checkCRMStatus';

dayjs.extend(isSameOrBefore);

const { Option } = Select;
const { Item } = Form;

const AddActivity = (props) => {
  const [form] = Form.useForm();
  const activityType = Form.useWatch('activityType', form);
  const usePromotionCode = Form.useWatch(
    ['activityRule', 'usePromotionCode'],
    form
  );
  const { t } = useTranslation();
  const { onClose, promotionItem, kioskMenu, promotion, dataId, allSysConfig } =
    props;
  const [dateValues, setDateValues] = useState({}); // 用于存储表单值
  useCloseModalOnHomePage(onClose);

  const editDisabled = useMemo(() => {
    return !!promotionItem.id;
  }, [promotionItem]);

  const isCRMEnable = useMemo(() => {
    if (allSysConfig && Object.keys(allSysConfig).length) {
      return !checkCRMStatus(allSysConfig);
    }
    return false;
  }, [allSysConfig]);

  const orderDiscount = useMemo(() => {
    return (
      promotion.filter((item) => item?.activityType === 'orderDiscount') || []
    );
  }, [promotion]);

  const checkTimeInfo = (_, value) => {
    const hasValueKey = Object.values(value)?.filter((each) => {
      if (Array.isArray(each)) {
        return each.length > 0;
      }
      return !!each;
    });
    const { startDate, endDate, startTime, endTime } = value;
    const isValidDate = [startDate, endDate].filter(Boolean)?.length === 2;
    const isValidTime = [startTime, endTime].filter(Boolean)?.length === 2;
    if (isValidDate && dayjs(endDate).isBefore(startDate, 'date')) {
      return Promise.reject(new Error(`${t('dateTip')}`));
    }
    if (isValidTime) {
      const newStartTime = dayjs(`2024-06-07T${startTime}`);
      const newEndTime = dayjs(`2024-06-07T${endTime}`);
      if (dayjs(newEndTime).isSameOrBefore(newStartTime)) {
        return Promise.reject(new Error(`${t('timeTip')}`));
      }
      return Promise.resolve();
    }
    if (
      !hasValueKey?.length ||
      ((startDate || endDate) && !isValidDate) ||
      ((startTime || endTime) && !isValidTime)
    )
      return Promise.reject(new Error(`${t('activityTimeTip')}`));
    return Promise.resolve();
  };

  const checkActivityInfo = (_, value) => {
    const hasValueKey = Object.values(value)?.filter((each) => {
      if (Array.isArray(each)) {
        return each.length > 0;
      }
      return !!each;
    });
    if (hasValueKey?.length !== Object.keys(value)?.length)
      return Promise.reject(new Error(`${t('activityRuleTip')}`));
    return Promise.resolve();
  };

  const checkOrderDiscount = (_, value) => {
    const filteredValue = { ...value };

    // 当不使用优惠码时，排除优惠码相关字段的校验
    if (value.usePromotionCode === '0') {
      delete filteredValue.promotionCodeName;
      delete filteredValue.promotionCode;
    }

    const hasValueKey = Object.values(filteredValue)?.filter((each) => {
      return !!each;
    });
    if (hasValueKey?.length !== Object.keys(filteredValue)?.length)
      return Promise.reject(new Error(`${t('activityRuleTip')}`));
    if (
      value.discountType === 'fixDiscount' &&
      Number(value.satisfyPrice) < Number(value.discountNumber)
    ) {
      return Promise.reject(new Error(`${t('discountInvalid')}`));
    }
    if (
      value.discountType === 'rateDiscount' &&
      Number(value.discountNumber) > 100
    ) {
      return Promise.reject(new Error(`${t('discountInvalid')}`));
    }
    if (
      orderDiscount?.findIndex(
        (item) =>
          item?.activityRule?.promotionCode === filteredValue?.promotionCode
      ) > 0
    ) {
      return Promise.reject(new Error(`${t('promoCodeExisted')}`));
    }
    return Promise.resolve();
  };

  const checkExchangePurchase = (_, value) => {
    const requiredKeys = [
      'conditionType',
      'giftsDishesType',
      'giftsType',
      'giftsNumber',
      'giftsDishes',
      'discountType',
      'discountNumber',
    ];
    if (value.conditionType === 'orderAmount') {
      requiredKeys.push('satisfyPrice');
    } else {
      requiredKeys.push('buyType', 'buyNumber', 'buyDishes');
    }
    const hasEmptyValue = requiredKeys.some((key) => {
      const fieldValue = value[key];
      return Array.isArray(fieldValue)
        ? fieldValue.length === 0
        : fieldValue === null || fieldValue === undefined || fieldValue === '';
    });
    if (hasEmptyValue) {
      return Promise.reject(new Error(`${t('activityRuleTip')}`));
    }
    if (
      value.discountType === 'rateDiscount' &&
      Number(value.discountNumber) > 100
    ) {
      return Promise.reject(new Error(`${t('discountInvalid')}`));
    }
    return Promise.resolve();
  };

  // 更新最新选择的时间值的回调函数
  const handleDateWeekTimeChange = (newValues) => {
    const updatedValues = { ...newValues };
    setDateValues(updatedValues); // 更新状态
  };

  const handleConfirmAdd = async () => {
    try {
      const res = await form.validateFields();
      const normalizeLocalizedText = (value) => ({
        zh: value?.zh?.trim() || '',
        en: value?.en?.trim() || '',
      });
      onClose?.({
        ...promotionItem,
        ...res,
        activityTitle: normalizeLocalizedText(res.activityTitle),
        activityTag: normalizeLocalizedText(res.activityTag),
      });
    } catch (e) {
      console.log(e);
    }
  };

  // 切换类型时， 清空已填值
  const changeActivity = (v) => {
    if (v === 'buyDiscount') {
      form.setFieldValue('activityRule', buyDiscountItem);
      handleDateWeekTimeChange({
        activityRule: form.getFieldsValue().activityType,
      });
    } else if (v === 'buyGifts') {
      form.setFieldValue('activityRule', buyGiftItem);
    } else if (v === 'exchangePurchase') {
      form.setFieldValue('activityRule', exchangePurchaseItem);
    } else {
      form.setFieldValue('activityRule', orderDiscountItem);
    }
  };

  // 切换usePromotionCode时，重置promotionCode相关字段
  const handleUsePromotionCodeChange = (e) => {
    const value = e.target.value;
    if (value === '0') {
      // 当选择不使用优惠码时，重置相关字段
      form.setFieldsValue({
        activityRule: {
          ...form.getFieldValue('activityRule'),
          promotionCodeName: null,
          promotionCode: null,
        },
      });
    }
  };

  const handleCheckIsDisabled = (v) => {
    if (v === 'buyDiscount') {
      return (
        promotion.filter((item) => item.activityType === 'buyDiscount')
          ?.length > 0
      );
    }
    return false;
  };

  const getInitialValues = () => {
    const { activityType } = promotionItem;
    let oriData = {};
    if (activityType === 'buyDiscount') {
      oriData = buyDiscountItem;
    } else if (activityType === 'buyGifts') {
      oriData = buyGiftItem;
    } else if (activityType === 'exchangePurchase') {
      oriData = exchangePurchaseItem;
    } else {
      oriData = orderDiscountItem;
    }
    if (promotionItem.id) {
      // 编辑状态：合并旧数据与默认值
      return {
        ...promotionItem,
        activityTitle: {
          zh: '',
          en: '',
          ...promotionItem.activityTitle,
        },
        activityTag: {
          zh: '',
          en: '',
          ...promotionItem.activityTag,
        },
        activityRule: {
          ...oriData,
          ...promotionItem.activityRule,
        },
      };
    }
    // 新建状态：使用默认值
    return promotionItem;
  };

  return (
    <div>
      <Form
        {...layout}
        initialValues={getInitialValues()}
        form={form}
        labelWrap
        name="promotionItem"
      >
        <Item
          label={t('activityType')}
          name="activityType"
          rules={[{ required: true, message: `${t('activityTypeTip')}` }]}
        >
          <Select
            onChange={changeActivity}
            disabled={editDisabled}
            getPopupContainer={(node) => node.parentNode}
          >
            {activityTypes.map((each) => {
              return (
                <Option
                  key={each.value}
                  value={each.value}
                  // disabled={handleCheckIsDisabled(each.value)}
                >
                  {t(each.value)}
                </Option>
              );
            })}
          </Select>
        </Item>
        <Item label={t('activityTitle')} required>
          <Space align="start" wrap>
            <Item
              label={t('promotionLanguageZh')}
              name={['activityTitle', 'zh']}
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === 'string' && value.trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error(`${t('activityTitleZhTip')}`)),
                },
              ]}
            >
              <Input />
            </Item>
            <Item
              label={t('promotionLanguageEn')}
              name={['activityTitle', 'en']}
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === 'string' && value.trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error(`${t('activityTitleEnTip')}`)),
                },
              ]}
            >
              <Input />
            </Item>
          </Space>
        </Item>
        <Item label={t('activityTag')} required>
          <Space align="start" wrap>
            <Item
              label={t('promotionLanguageZh')}
              name={['activityTag', 'zh']}
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === 'string' && value.trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error(`${t('activityTagZhTip')}`)),
                },
              ]}
            >
              <Input />
            </Item>
            <Item
              label={t('promotionLanguageEn')}
              name={['activityTag', 'en']}
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === 'string' && value.trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error(`${t('activityTagEnTip')}`)),
                },
              ]}
            >
              <Input />
            </Item>
          </Space>
        </Item>
        <Item
          label={t('timeInfo')}
          name="timeInfo"
          rules={[{ required: true, validator: checkTimeInfo }]}
        >
          <DateWeekTime onChange={handleDateWeekTimeChange} />
        </Item>
        {activityType === 'buyGifts' && (
          <Item
            label={t('activityRule')}
            name="activityRule"
            rules={[{ required: true, validator: checkActivityInfo }]}
          >
            <BuyGifts kioskMenu={kioskMenu} />
          </Item>
        )}
        {activityType === 'buyDiscount' && (
          <>
            <Item
              label={t('activityRule')}
              name="activityRule"
              rules={[{ required: true, validator: checkActivityInfo }]}
            >
              <BuyDiscount
                kioskMenu={kioskMenu}
                promotion={promotion}
                dateValues={dateValues}
                dataId={dataId}
              />
            </Item>
          </>
        )}
        {activityType === 'exchangePurchase' && (
          <Item
            label={t('activityRule')}
            name="activityRule"
            rules={[{ required: true, validator: checkExchangePurchase }]}
          >
            <ExchangePurchase kioskMenu={kioskMenu} />
          </Item>
        )}
        {activityType === 'orderDiscount' && (
          <>
            <Item
              label={t('activityRule')}
              name="activityRule"
              rules={[{ required: true, validator: checkOrderDiscount }]}
            >
              <OrderDiscount />
            </Item>
            <Item
              label={t('firstOrderEffective')}
              name={['activityRule', 'isFirstOrderDiscount']}
            >
              <Radio.Group defaultValue="0" disabled={!isCRMEnable}>
                <Radio value="1">{t('yes')}</Radio>
                <Radio value="0">{t('no')}</Radio>
              </Radio.Group>
              {!isCRMEnable && (
                <div style={{ color: 'red' }}>{t('notOpenMember')}</div>
              )}
            </Item>

            <Item
              label={t('usePromotionCode')}
              name={['activityRule', 'usePromotionCode']}
            >
              <Radio.Group
                defaultValue="0"
                disabled={promotionItem.id}
                onChange={handleUsePromotionCodeChange}
              >
                <Radio value="1">{t('yes')}</Radio>
                <Radio value="0">{t('no')}</Radio>
              </Radio.Group>
            </Item>

            {usePromotionCode === '1' && (
              <>
                <Item
                  label={t('promotionCodeName')}
                  name={['activityRule', 'promotionCodeName']}
                  rules={[
                    {
                      required: true,
                      message: `${t('promotionCodeNameTip')}`,
                    },
                  ]}
                >
                  <Input maxLength={255} />
                </Item>
                <Item
                  label={t('promotionCode')}
                  name={['activityRule', 'promotionCode']}
                  rules={[
                    {
                      required: true,
                      message: `${t('promotionCodeTip')}`,
                    },
                  ]}
                >
                  <Input disabled={promotionItem.id} maxLength={15} />
                </Item>
              </>
            )}
          </>
        )}
      </Form>
      <Row justify="end">
        <Space>
          <Button onClick={() => onClose?.(false)}>
            {t('operate-cancel')}
          </Button>
          <Button type="primary" onClick={handleConfirmAdd}>
            {t('operate-confirm')}
          </Button>
        </Space>
      </Row>
    </div>
  );
};

export default AddActivity;
