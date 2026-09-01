import dayjs from 'dayjs';

const WEEK_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const filterItemByTime = (timeInfo) => {
  const { weekDay, startTime, endTime, endDate, startDate } = timeInfo;
  const day = WEEK_DAY[dayjs().day()];
  const today = dayjs().format('YYYY/MM/DD');
  if (startTime && endTime) {
    const isInDayTime = dayjs().isBetween(
      `${today} ${startTime}`,
      `${today} ${endTime}`,
      'minutes',
      '[)',
    );
    if (!isInDayTime) return false;
  }
  if (weekDay.length > 0) {
    const isInWeekDay = weekDay.includes(day);
    if (!isInWeekDay) return false;
  }
  if (endDate && startDate) {
    const isInDayTime = dayjs().isBetween(startDate, endDate, 'day', '[]');
    if (!isInDayTime) return false;
  }
  return true;
};

export default filterItemByTime;
