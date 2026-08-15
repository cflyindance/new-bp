const WEEK_DAY = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const getBsTime = (hours) => {
  return hours.map((each) => {
    // 有开始无结束
    if (each.fromDayOfWeek && !each.toDayOfWeek) each.bsDay = [];
    // 无开始 -> 忽略是否有结束
    if (!each.fromDayOfWeek) each.bsDay = WEEK_DAY;
    // 有结束 有开始
    if (each.fromDayOfWeek && each.toDayOfWeek) {
      const fromBsIndex = WEEK_DAY.findIndex((day) => day === each.fromDayOfWeek);
      const toBsIndex = WEEK_DAY.findIndex((day) => day === each.toDayOfWeek);
      if (toBsIndex > fromBsIndex) {
        each.bsDay = WEEK_DAY.slice(fromBsIndex, toBsIndex + 1);
      } else {
        each.bsDay = WEEK_DAY.slice(fromBsIndex).concat(WEEK_DAY.slice(0, toBsIndex + 1));
      }
    }
    return each;
  });
};

export default getBsTime;
