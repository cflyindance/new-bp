import React, { useState, useEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';
import { Select } from 'antd';
import getBsTime from '@/utils/getBsTime';
import { getRestaurantHour } from '@/api/kioskConfigApi';
import { getDeviceOrientation } from '@/utils';
import styles from './ChoosePickUpTime.module.scss';
import CLOSE from '@/assets/images/close.png';
import dayjs from 'dayjs';
import Dialog from '../dialog';

const { Option } = Select;

const ChoosePickUpTime = (props) => {
  const { t, isShowModal, handleContinue, handleCancel } = props;
  const [recentDaysList, setRecentDaysList] = useState([]);
  const [timeList, setTimeList] = useState([]);
  const [hourInfo, setHourInfo] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const isMountedRef = useRef(true);
  const isVertical = getDeviceOrientation() === 'vertical';

  useEffect(() => {
    initBsHour();

    // 清理函数：组件卸载时设置标志
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 更新 recentDaysList 的函数
  const updateRecentDaysList = () => {
    setRecentDaysList([
      { value: dayjs().format('MM/DD/YYYY'), label: t('today') },
      {
        value: dayjs().add(1, 'days').format('MM/DD/YYYY'),
        label: t('tomorrow'),
      },
      {
        value: dayjs().add(2, 'days').format('MM/DD/YYYY'),
        label: dayjs().add(2, 'days').format('MM/DD/YYYY'),
      },
      {
        value: dayjs().add(3, 'days').format('MM/DD/YYYY'),
        label: dayjs().add(3, 'days').format('MM/DD/YYYY'),
      },
      {
        value: dayjs().add(4, 'days').format('MM/DD/YYYY'),
        label: dayjs().add(4, 'days').format('MM/DD/YYYY'),
      },
      {
        value: dayjs().add(5, 'days').format('MM/DD/YYYY'),
        label: dayjs().add(5, 'days').format('MM/DD/YYYY'),
      },
      {
        value: dayjs().add(6, 'days').format('MM/DD/YYYY'),
        label: dayjs().add(6, 'days').format('MM/DD/YYYY'),
      },
    ]);
  };

  // 在组件挂载和语言变化时更新 recentDaysList
  useEffect(() => {
    updateRecentDaysList();
  }, [t]); // 依赖于 t 函数，确保语言变化时更新

  // 日期选择
  const handleDayChange = (v) => {
    setSelectedDay(v);
    setSelectedTime(null);
  };

  // 时间选择
  const handleTimeChange = (v) => {
    setSelectedTime(v);
  };

  // 确认
  const handleConfirm = () => {
    let pickupTimeTip =
      '\n' +
      t(`pickupTimeTip`, {
        value: `${selectedDay} ${selectedTime}`,
      });
    handleContinue(pickupTimeTip);
  };

  // 取消
  const handleCancelClick = () => {
    setSelectedTime(null);
    setSelectedDay(null);
    handleCancel();
  };

  // 获取时间列表
  const getTimeList = (day) => {
    const timeList = [];
    // 最高营业时间
    const mostEarly = hourInfo
      ?.reduce((min, obj) => {
        return obj.from < min ? obj.from : min;
      }, hourInfo[0].from)
      .split(':');
    const mostEarlyFormat = dayjs(
      new Date().setHours(Number(mostEarly[0]), Number(mostEarly[1]), 0, 0)
    );
    // 最晚营业时间
    const mostLate = hourInfo
      ?.reduce((max, obj) => {
        return obj.to > max ? obj.to : max;
      }, hourInfo[0].to)
      .split(':');
    const mostLateFormat = dayjs(
      new Date().setHours(Number(mostLate[0]), Number(mostLate[1]), 0, 0)
    );

    let start; //开始选择的时间
    if (dayjs(day).isSame(dayjs(), 'day')) {
      // 今天 当前时间比营业时间早，则从最早营业时间开始选择 否则从当前时间开始选择
      start = dayjs().isBefore(mostEarlyFormat) ? mostEarlyFormat : dayjs();
    } else {
      start = mostEarlyFormat;
    }
    const end = mostLateFormat;
    // 整理时间展示的格式;
    let hour = start.hour();
    let minute = 0;
    if (start.minute() <= 30 && start.minute() > 0) {
      // 当前时间在0-30分间，默认展示下个30分 否则下个整点
      minute = 30;
    } else {
      hour = hour + 1;
      minute = 0;
    }
    let current = dayjs(new Date().setHours(hour, minute, 0, 0));
    while (current <= end) {
      let label;
      if (current.hour() > 12 && current.hour() < 24) {
        label = `${current.hour() - 12}:${String(current.minute()).padStart(2, '0')} PM`;
      } else if (current.hour() === 12) {
        label = `12:${String(current.minute()).padStart(2, '0')} PM`;
      } else if (current.hour() === 24) {
        label = `12:${String(current.minute()).padStart(2, '0')} AM`;
      } else {
        label = `${current.hour()}:${String(current.minute()).padStart(2, '0')} AM`;
      }
      timeList.push({ value: label, label: label });
      current = current.add(30, 'minute');
    }

    setTimeList(timeList);
  };

  useEffect(() => {
    if (selectedDay) {
      getTimeList(selectedDay);
    }
  }, [selectedDay]);

  // 获取营业时间
  const initBsHour = async () => {
    try {
      const res = await getRestaurantHour();
      // 检查组件是否仍然挂载
      if (isMountedRef.current && res?.data?.msg === 'success') {
        const { data } = res.data;
        const { hours } = data;
        const newHours = getBsTime(hours);
        setHourInfo(newHours);
      }
    } catch (error) {
      // 处理错误，但只在组件仍然挂载时
      if (isMountedRef.current) {
        console.error('获取营业时间失败:', error);
      }
    }
  };

  return (
    <Dialog
      visible={isShowModal}
      html={
        <div
          className={styles.containerBox}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={CLOSE}
            alt="close"
            className={styles.closeIcon}
            onClick={handleCancelClick}
          />
          <div className={styles.title}>{t('choosePickUpTime')}</div>
          <div className={styles.itemBox}>
            <Select
              placeholder={t('selectDate')}
              size="large"
              className={styles.dayPicker}
              value={selectedDay}
              listHeight={isVertical ? 560 : 400}
              getPopupContainer={(node) => node.parentNode}
              onChange={(v) => handleDayChange(v)}
            >
              {recentDaysList.map((each) => {
                return (
                  <Option
                    key={each.value}
                    value={each.value}
                    className={styles.pickerOption}
                  >
                    {each.label}
                  </Option>
                );
              })}
            </Select>
            <Select
              placeholder={t('selectTime')}
              size="large"
              className={styles.timePicker}
              value={selectedTime}
              listHeight={isVertical ? 560 : 400}
              disabled={!selectedDay}
              getPopupContainer={(node) => node.parentNode}
              onChange={(v) => handleTimeChange(v)}
            >
              {timeList.map((each) => {
                return (
                  <Option
                    key={each.value}
                    value={each.value}
                    className={styles.pickerOption}
                  >
                    {each.label}
                  </Option>
                );
              })}
            </Select>
          </div>
          <div className={styles.btnBox}>
            <div className={styles.btn} onClick={handleCancelClick}>
              {t('cancel')}
            </div>
            {selectedDay && selectedTime && (
              <div
                className={`${styles.btn} ${styles.btnConfirm}`}
                onClick={handleConfirm}
              >
                {t('confirm')}
              </div>
            )}
          </div>
        </div>
      }
      onClose={handleCancelClick}
    />
  );
};

export default withTranslation()(ChoosePickUpTime);
