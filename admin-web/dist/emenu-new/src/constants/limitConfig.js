import {
  authBeforeOrder,
  combinationDish,
  dishIntervalMinutes,
  dishQuantityLimit,
  dishQuantityPerRound,
  dishSetQuantityLimit,
  duration,
  isNeedPasswordAuth,
  limitRestrict,
  limitRestrictEveryone,
  limitRestrictOnce,
  limitRestrictSet,
  mutexDish,
  quantity,
  restrictDish,
  restrictNewOrder,
  restrictRedeemItem,
  restTimeAlert,
  sendOrderInterval,
  times,
} from '@/constants/systemConfig'

export const perTypes = {
  perRound: 0,
  perPerson_perRound: 1,
}

export const specificDishTypes = {
  specificDish: 0,
  specificDishCollection: 1,
}

export const specificDishUnits = {
  pieces: 0,
  types: 1,
}

export const getLimitConfigMap = (t) => ({
  duration: Array.from({ length: 18 }, (_, i) => ({
    value: i * 10 + 30,
    label: `${i * 10 + 30} ${t('units.minutes')}`,
  })),
  times: Array.from({ length: 20 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${t('units.rounds')}`,
  })),
  quantity: Array.from({ length: 20 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${t('units.items')}`,
  })),
  perType: [
    {
      value: perTypes.perRound,
      label: t('SystemSetting.perType_perRound'),
    },
    {
      value: perTypes.perPerson_perRound,
      label: t('SystemSetting.perType_perPerson_perRound'),
    },
  ],
  specificDishType: [
    {
      value: specificDishTypes.specificDish,
      label: t('SystemSetting.specificDishType_dish'),
    },
    {
      value: specificDishTypes.specificDishCollection,
      label: t('SystemSetting.specificDishType_dishCollection'),
    },
  ],
  specificDishUnit: [
    {
      value: specificDishUnits.pieces,
      label: t('units.pieces'),
    },
    {
      value: specificDishUnits.types,
      label: t('units.types'),
    },
  ],
})

export const defaultVisContent = [
  'samePotDefaultAdded',
  'limitRestrictOnce',
  'dishQuantityLimit',
] //默认显示内容

export const standardOrderSetting = ['duration', 'times', 'quantity']
export const inputOrderSetting = [
  'intervalMinutes',
  'restTimeAlert',
  'runTimeWillEnd',
]
export const radioOrderSetting = ['sendKitchenMethod', 'hotPotOrderMethod']
export const switchOrderSetting = [
  'showMealTime',
  'noMultipleOrder',
  'isRequirePot',
  'showPotAfterOrder',
  'submitBuffetFirst',
]
export const dishSelectOrderSetting = ['defaultOrderDish', 'restrictRedeemItem']

export const extraOrderSetting = [
  { typeName: 'restTimeAlert', key: 'beforeAlertTime' },
]
// export const dishSelectOnceSetting = [ 'limitRestrictOnce']

export const allOrderSetting = [
  'submitBuffetFirst',
  'isRequirePot',
  'showPotAfterOrder',
  'hotPotOrderMethod',
  'samePotDefaultAdded',
  'duration',
  'showMealTime',
  'restTimeAlert',
  'sendKitchenMethod',
  'runTimeWillEnd',
  'times',
  'dishQuantityPerRound',
  'dishQuantityLimit',
  'quantity',
  'limitRestrictOnce',
  'intervalMinutes',
  'dishIntervalMinutes',
  'noMultipleOrder',
  'defaultOrderDish',
  'restrictRedeemItem',
  'isOpenSpecialDishPermission',
  'isSpecialDishServePermission',
  'mutexDish',
  'combinationDish',
]

export const radioOptions = {
  sendKitchenMethod: [
    {
      value: 'auto',
    },
    {
      value: 'manual',
    },
  ],
  hotPotOrderMethod: [
    {
      value: 'auto',
    },
    {
      value: 'manual',
    },
  ],
}

export const bypassOrderRestrictionConfigIds = [
  restrictDish.id,
  limitRestrict.id,
  duration.id,
  times.id,
  quantity.id,
  restrictNewOrder.id,
  sendOrderInterval.id,
  restTimeAlert.id,
  dishQuantityLimit.id,
  restrictRedeemItem.id,
  limitRestrictEveryone.id,
  limitRestrictOnce.id,
  isNeedPasswordAuth.id,
  dishQuantityPerRound.id,
  dishIntervalMinutes.id,
  mutexDish.id,
  combinationDish.id,
  authBeforeOrder.id,
  limitRestrictSet.id,
  dishSetQuantityLimit.id,
]
