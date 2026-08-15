import dayjs from 'dayjs';

const handleCalculatePromotion = ({ promotionRules, orderType, itemList, totalAmount }) => {
  const cal = window.execute_promotion;
  const actualOrderType = orderType === 'TO_GO' ? 'TOGO' : orderType; // 对齐Promotion 订单类型
  const dayOfWeek = dayjs().day();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const system = {
    merchantId: 'M000015679',
    productLine: 'KIOSK',
    local: {
      dayOfWeek: daysOfWeek[dayOfWeek],
      timeOfDay: dayjs().format('HH:mm'),
      dateTime: dayjs().valueOf(),
    },
  };
  const order = {
    orderType: actualOrderType,
    orderItems: itemList.map((each) => {
      return {
        ...each,
        itemId: each.id,
        itemPrice: each.price,
      };
    }),
    totalAmount,
  };
  const env = { system, order };
  return cal(promotionRules, env);
};

export default handleCalculatePromotion;
