import dayjs from 'dayjs';

const WEEK_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const filterCloudPromotionByTime = (conditions) => {
  const timeInfoCondition = conditions[0];
  const dayOfWeek = timeInfoCondition['system/local/dayOfWeek'];
  if (dayOfWeek?.length > 0) {
    const day = WEEK_DAY[dayjs().day()];
    const isInWeekDay = timeInfoCondition['system/local/dayOfWeek'].includes(day);
    if (!isInWeekDay) return false;
  }
  const daysOfMonth = timeInfoCondition['system/local/daysOfMonth'];
  if (daysOfMonth && Object.keys(daysOfMonth || {}).length > 0) {
    const startDate = timeInfoCondition['system/local/daysOfMonth'].from;
    const endDate = timeInfoCondition['system/local/daysOfMonth'].to;
    const isInDayTime = dayjs().isBetween(startDate, endDate, 'day', '[]');
    if (!isInDayTime) return false;
  }
  const timeOfDay = timeInfoCondition['system/local/timeOfDay'];
  if (timeOfDay && Object.keys(timeOfDay || {}).length > 0) {
    const startTime = timeInfoCondition['system/local/timeOfDay'].from;
    const endTime = timeInfoCondition['system/local/timeOfDay'].to;
    const today = dayjs().format('YYYY/MM/DD');
    const isInDayTime = dayjs().isBetween(
      `${today} ${startTime}`,
      `${today} ${endTime}`,
      'second',
      '[)',
    );
    if (!isInDayTime) return false;
  }
  return true;
};

export default filterCloudPromotionByTime;
