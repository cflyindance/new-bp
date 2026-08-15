import React, { useEffect, useState } from 'react';
import styles from './BuyGifts.module.scss';
import { Col, Input, Row, Select, Radio } from 'antd';
import { buyDiscountItem, choiceType } from '@/constants/selfConfig';
import { useTranslation } from 'react-i18next';
import DishTree from './DishTree';
import dayjs from 'dayjs';

const { Option } = Select;

const BuyDiscount = (props) => {
  const {
    onChange,
    value = buyDiscountItem,
    kioskMenu,
    dateValues,
    promotion,
    dataId,
  } = props;
  const { t } = useTranslation();
  const [buyDiscountList, setBuyDiscountList] = useState([]);
  const [timeInfo, setTimeInfo] = useState(dateValues || {});
  const [currentPromotion, setCurrentPromotion] = useState({});
  const [selectedDishes, setSelectedDishes] = useState([]);
  const [filteredKioskMenu, setFilteredKioskMenu] = useState(kioskMenu); // 存储过滤后的菜单

  useEffect(() => {
    if (promotion.length) {
      const arr = promotion.filter(
        (item) => item.activityType === 'buyDiscount'
      );
      setBuyDiscountList(arr);
    }
  }, [promotion]);

  const filterKioskMenu = (menu) => {
    return menu
      ?.map((item) => {
        if (item?.children) {
          // 如果有子菜单，递归过滤
          const filteredChildren = filterKioskMenu(
            item.children,
            selectedDishes
          );
          // 仅在有子菜单时返回该项
          if (filteredChildren.length > 0) {
            return {
              ...item,
              children: filteredChildren, // 保留过滤后的子菜单
            };
          }
          return null; // 如果没有子菜单，返回 null
        }
        // 过滤掉已选择的菜品
        return selectedDishes?.includes(item.id) ? null : item;
      })
      .filter(Boolean); // 过滤掉 null 值
  };

  // 更新过滤后的菜单列表
  const filterKioskMenuByDate = () => {
    if (Array.isArray(kioskMenu)) {
      // 过滤掉已选择的菜单
      const filteredMenu = filterKioskMenu(filteredKioskMenu, selectedDishes);
      setFilteredKioskMenu(filteredMenu);
    } else {
      setFilteredKioskMenu(kioskMenu);
    }
  };

  // 获取所有需要过滤的菜单
  const getAlldishes = () => {
    const startDate = dayjs(timeInfo.startDate);
    const endDate = dayjs(timeInfo.endDate);
    // const startTime = dayjs(timeInfo.startTime, 'HH:mm');
    // const endTime = dayjs(timeInfo.endTime, 'HH:mm');
    const allDishes = [];
    // 编辑态时，当前活动已选择的促销菜单
    const currentBuyDishes = currentPromotion?.activityRule?.buyDishes || [];
    buyDiscountList.forEach((item) => {
      const itemStartDate = dayjs(item.timeInfo.startDate);
      const itemEndDate = dayjs(item.timeInfo.endDate);
      // const itemStartTime = dayjs(item.timeInfo.startTime, 'HH:mm');
      // const itemEndTime = dayjs(item.timeInfo.endTime, 'HH:mm');
      if (
        (startDate <= itemStartDate && endDate >= itemStartDate) ||
        (startDate >= itemStartDate && startDate <= itemEndDate)
      ) {
        // if (!timeInfo.startTime || !timeInfo.endTime) {
        // }
        // if (
        //   timeInfo.startTime &&
        //   timeInfo.endTime &&
        //   ((startTime <= itemStartTime && endTime >= itemStartTime) ||
        //     (startTime >= itemStartTime && startTime <= itemEndTime))
        // ) {
        const newDishes = item?.activityRule?.buyDishes || [];
        allDishes.push(...newDishes);
        // }
      }
    });
    // 去重（编辑时需要去掉已选中的菜单，不然无法正常反显）
    const uniqueDishes = Array.from(new Set(allDishes)).filter(
      (dish) => !currentBuyDishes.includes(dish)
    );
    // 更新 selectedDishes
    setSelectedDishes(uniqueDishes);
  };

  useEffect(() => {
    // 根据活动时间选择，暂时不考虑具体时分，只要日期重叠，则过滤已存在于别的活动中的菜单
    filterKioskMenuByDate();
  }, [selectedDishes]);

  useEffect(() => {
    if (dataId) {
      // 编辑
      const currentPromotion = buyDiscountList.find(
        (item) => item.id === dataId
      );
      if (currentPromotion) {
        handleChange('buyDishes', currentPromotion?.activityRule?.buyDishes);
        setTimeInfo(currentPromotion?.timeInfo);
        setCurrentPromotion(currentPromotion);
      }
    } else {
      handleChange('buyDishes', []);
    }
  }, [dateValues, buyDiscountList]);

  useEffect(() => {
    if (buyDiscountList.length && timeInfo?.startDate && timeInfo?.endDate) {
      getAlldishes();
    }
  }, [timeInfo]);

  const handleChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  const formatNumber = (value) => {
    return value.replace(/^(\.)(\d+)$/, '0$1$2');
  };

  const handleResolveInput = (key, v, regex) => {
    const value = v.replace(regex, '');
    const formattedValue = formatNumber(value); // 格式化值
    handleChange(key, formattedValue);
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
            {choiceType?.map((each) => {
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
            onChange={(e) =>
              handleResolveInput('buyNumber', e.target.value, /[^0-9]/g)
            }
            value={value.buyNumber}
            addonBefore={<span>{t('buy')}</span>}
            addonAfter={<span>{t('item')}</span>}
          />
        </Col>
      </Row>
      <Col span={24} className={styles.dishSelect}>
        <DishTree
          kioskMenu={filteredKioskMenu}
          handleChange={handleChange}
          value={value.buyDishes || []}
          changeKey="buyDishes"
        />
      </Col>
      <Row className={styles.dishSelect}>
        <Col span={24}>
          <Input
            onChange={(e) =>
              handleResolveInput('giftsDiscount', e.target.value, /[^0-9.]/g)
            }
            value={value.giftsDiscount}
            addonBefore={
              value.giftsDiscountRule !== '1' ? (
                <span>
                  {t('theXItemYDiscount', { X: value.buyNumber || 'X', Y: '' })}
                </span>
              ) : (
                <span>
                  {t('overXItemYDiscount', {
                    X: value.buyNumber || 'X',
                    Y: '',
                  })}
                </span>
              )
            }
            addonAfter={<span>% off</span>}
          />
        </Col>
      </Row>
      <Row className={styles.dishSelect}>
        <Col>
          <Radio.Group
            defaultValue={value.giftsDiscountRule}
            onChange={(e) => handleChange('giftsDiscountRule', e.target.value)}
          >
            <Radio value="0">
              {t('buyDiscountPerItemSatisfy', {
                count: value.buyNumber || 'X',
                percent: value.giftsDiscount || 'Y',
              })}
            </Radio>
            <Radio value="1">
              {t('buyDiscountPerOrderSatisfy', {
                count: value.buyNumber || 'X',
                percent: value.giftsDiscount || 'Y',
              })}
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
    </div>
  );
};

export default BuyDiscount;
