import React, { useMemo } from 'react';
import { Form, TimePicker, DatePicker } from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import styles from './index.module.scss';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

const { Item } = Form;
const dateFormat = 'YYYY/MM/DD';
const timeFormat = 'HH:mm';
dayjs.extend(customParseFormat);

const DateWeekTime = (props) => {
  const { onChange, value } = props;
  const { t } = useTranslation();

  const selectedStartDate = useMemo(() => {
    return value.startDate ? dayjs(value.startDate, dateFormat) : null;
  }, [value]);

  const selectedEndDate = useMemo(() => {
    return value.endDate ? dayjs(value.endDate, dateFormat) : null;
  }, [value]);

  const selectedStartTime = useMemo(() => {
    return value.startTime ? dayjs(value.startTime, timeFormat) : null;
  }, [value]);

  const selectedEndTime = useMemo(() => {
    return value.endTime ? dayjs(value.endTime, timeFormat) : null;
  }, [value]);

  const selectedWeekDay = useMemo(() => {
    return value.weekDay || [];
  }, [value]);

  const handleChange = (key, newValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  const handleEditWeekDay = (key, day) => {
    const isSelected = selectedWeekDay.find((each) => each === day);
    const newValue = !isSelected
      ? [...selectedWeekDay, day]
      : selectedWeekDay.filter((each) => each !== day);
    handleChange(key, newValue);
  };

  const handleChangeDateTime = (key, time, format) => {
    const afterFormatTime = dayjs(time).format(format);
    handleChange(key, time ? afterFormatTime : null);
  };

  return (
    <div className={styles.dateWeekTimeWrapper}>
      <Item labelCol={{ span: 3 }} wrapperCol={{ span: 21 }} label={t('date')}>
        <div className={styles.weekSet}>
          <DatePicker
            format={dateFormat}
            value={selectedStartDate}
            getPopupContainer={(node) => node.parentNode}
            inputReadOnly
            onChange={(startDate) =>
              handleChangeDateTime('startDate', startDate, dateFormat)
            }
          />
          <span className={styles.divider}>—</span>
          <DatePicker
            format={dateFormat}
            value={selectedEndDate}
            getPopupContainer={(node) => node.parentNode}
            inputReadOnly
            onChange={(endDate) =>
              handleChangeDateTime('endDate', endDate, dateFormat)
            }
          />
        </div>
      </Item>
      <Item labelCol={{ span: 3 }} wrapperCol={{ span: 21 }} label={t('week')}>
        <div className={styles.weekSet}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => {
            return (
              <div
                onClick={() => handleEditWeekDay('weekDay', day)}
                className={classNames(
                  styles.weekDay,
                  selectedWeekDay.includes(day) && styles.work
                )}
                key={day}
              >
                {day}
              </div>
            );
          })}
        </div>
      </Item>
      <Item
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 21 }}
        label={t('time')}
        style={{ marginBottom: 0 }}
      >
        <div className={styles.weekSet}>
          <TimePicker
            changeOnScroll
            needConfirm={false}
            format={timeFormat}
            value={selectedStartTime}
            getPopupContainer={(node) => node.parentNode}
            inputReadOnly
            onChange={(startTime) =>
              handleChangeDateTime('startTime', startTime, timeFormat)
            }
          />
          <span className={styles.divider}>—</span>
          <TimePicker
            changeOnScroll
            needConfirm={false}
            format={timeFormat}
            value={selectedEndTime}
            getPopupContainer={(node) => node.parentNode}
            inputReadOnly
            onChange={(endTime) =>
              handleChangeDateTime('endTime', endTime, timeFormat)
            }
          />
        </div>
      </Item>
    </div>
  );
};

export default DateWeekTime;
