import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: './vite.config.js',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const {
    CRM_INTEGRATION_REWARD_KIND,
    resolveCrmIntegrationMenuRewards,
    resolveCrmIntegrationMenuVouchers,
  } = await server.ssrLoadModule('/src/utils/crmIntegrationRewards.js')

  const rewards = [
    {
      ruleId: 'fixed-1',
      name: 'Ten dollars off',
      displayName: 'Ten dollars off',
      description: 'Save on this order',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: 50,
        },
      },
      couponTemplate: {
        type: 'discountCoupon',
        productLine: ['KIOSK', 'EMENU'],
        validity: {
          type: 'fixed',
          fixed: {
            endDate: 1735516800000,
          },
        },
        ruleExpression: {
          condition: {
            totalAmount: 20,
            itemFilter: {
              type: 'all',
              value: [],
            },
          },
          benefits: [
            {
              actions: [
                {
                  type: 'minus',
                  params: {
                    value: 10,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      ruleId: 'percent-1',
      name: 'Twenty percent off',
      displayName: 'Display twenty percent off',
      description: 'Display twenty percent off',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: '80',
        },
      },
      couponTemplate: {
        type: 'discountCoupon',
        description: 'Only coupon template description should render here',
        productLine: ['EMENU'],
        validity: {
          type: 'permanent',
        },
        ruleExpression: {
          condition: {
            itemFilter: {
              type: 'include',
              value: [
                {
                  itemId: 1001,
                  merchantId: 'M000020684',
                  productLine: 'EMENU',
                },
                {
                  itemId: 1002,
                  merchantId: 'M000020684',
                  productLine: 'EMENU',
                },
              ],
            },
          },
          benefits: [
            {
              actions: [
                {
                  type: 'percentage',
                  params: {
                    value: 20,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      ruleId: 'kiosk-only',
      name: 'Kiosk only reward',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: 10,
        },
      },
      couponTemplate: {
        type: 'discountCoupon',
        productLine: ['KIOSK'],
        ruleExpression: {
          benefits: [
            {
              actions: [
                {
                  type: 'minus',
                  params: {
                    value: 5,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      ruleId: 'gift-1',
      name: 'Free item reward',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: 120,
        },
      },
      couponTemplate: {
        type: 'giftItemCoupon',
        productLine: ['EMENU'],
        ruleExpression: {
          benefits: [
            {
              actions: [
                {
                  type: 'addItem',
                  params: {
                    quantity: 1,
                  },
                  itemFilter: {
                    type: 'include',
                    value: [
                      {
                        itemId: 1001,
                        merchantId: 'M000020684',
                        productLine: 'EMENU',
                        sizeList: [{ sizeId: 11 }],
                      },
                      {
                        itemId: 1002,
                        merchantId: 'M000020684',
                        productLine: 'EMENU',
                        sizeList: [],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      ruleId: 'special-1',
      name: 'Special price item',
      displayName: 'Special price item',
      description: 'Special price item description',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: 188,
        },
      },
      couponTemplate: {
        type: 'orderItemFixedPriceCoupon',
        productLine: ['EMENU'],
        validity: {
          type: 'permanent',
        },
        ruleExpression: {
          condition: {
            itemFilter: {
              type: 'all',
              value: [],
            },
          },
          options: {
            quantityLimit: 1,
          },
          benefits: [
            {
              _id: 'benefit-special-size-small',
              condition: {
                itemFilter: {
                  type: 'include',
                  value: [
                    {
                      itemId: 1001,
                      merchantId: 'M000020684',
                      productLine: 'EMENU',
                      price: 18.88,
                      sizeList: [{ sizeId: 11 }],
                    },
                  ],
                },
              },
              actions: [
                {
                  type: 'setPrice',
                  params: {
                    price: 9.99,
                  },
                },
              ],
            },
            {
              _id: 'benefit-special-size-large',
              condition: {
                itemFilter: {
                  type: 'include',
                  value: [
                    {
                      itemId: 1001,
                      merchantId: 'M000020684',
                      productLine: 'EMENU',
                      price: 20.88,
                      sizeList: [{ sizeId: 12 }],
                    },
                  ],
                },
              },
              actions: [
                {
                  type: 'setPrice',
                  params: {
                    price: 10.99,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      ruleId: 'quantity-discount-1',
      name: 'Buy more discount',
      displayName: 'Buy more discount',
      description: 'Buy 3, get 1 discounted',
      type: 'reward',
      redeemRule: {
        parameters: {
          point: 200,
        },
      },
      couponTemplate: {
        type: 'quantityItemDiscountCoupon',
        productLine: ['EMENU'],
        validity: {
          type: 'permanent',
        },
        ruleExpression: {
          condition: {
            itemFilter: {
              type: 'all',
              value: [
                {
                  itemId: 1001,
                  merchantId: 'M000020684',
                  productLine: 'EMENU',
                  sizeList: [{ sizeId: 11 }, { sizeId: 12 }],
                },
                {
                  itemId: 1002,
                  merchantId: 'M000020684',
                  productLine: 'EMENU',
                  sizeList: [],
                },
                {
                  itemId: 1003,
                  merchantId: 'OTHER',
                  productLine: 'EMENU',
                  sizeList: [],
                },
              ],
            },
          },
          options: {
            quantityLimit: 4,
            sameItem: true,
          },
          benefits: [
            {
              condition: {
                quantity: 3,
              },
              actions: [
                {
                  type: 'percentage',
                  params: {
                    value: 80,
                    quantity: 1,
                  },
                },
              ],
            },
          ],
        },
      },
    },
  ]

  const memberVouchers = [
    {
      id: 'owned-gift-voucher',
      count: 2,
      rewardRule: {
        ruleId: 'voucher-gift-1',
        couponTemplateId: 'template-gift-1',
        name: 'Owned free item voucher',
        displayName: 'Owned free item voucher',
        description: 'A member-owned free item voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'giftItemCoupon',
          productLine: ['EMENU'],
          validity: {
            type: 'fixed',
            fixed: {
              endDate: 1735516800000,
            },
          },
          ruleExpression: {
            condition: {
              totalAmount: 25,
            },
            benefits: [
              {
                actions: [
                  {
                    type: 'addItem',
                    params: {
                      quantity: 1,
                    },
                    itemFilter: {
                      type: 'include',
                      value: [
                        {
                          itemId: 1001,
                          merchantId: 'M000020684',
                          productLine: 'EMENU',
                          sizeList: [{ sizeId: 11 }],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'owned-gift-voucher-duplicate',
      count: 1,
      rewardRule: {
        ruleId: 'voucher-gift-duplicate-rule',
        couponTemplateId: 'template-gift-1',
        name: 'Owned free item voucher duplicate',
        displayName: 'Owned free item voucher duplicate',
        description: 'A duplicate member-owned free item voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'giftItemCoupon',
          productLine: ['EMENU'],
          validity: {
            type: 'fixed',
            fixed: {
              endDate: 1735516800000,
            },
          },
          ruleExpression: {
            condition: {
              totalAmount: 25,
            },
            benefits: [
              {
                actions: [
                  {
                    type: 'addItem',
                    params: {
                      quantity: 1,
                    },
                    itemFilter: {
                      type: 'include',
                      value: [
                        {
                          itemId: 1001,
                          merchantId: 'M000020684',
                          productLine: 'EMENU',
                          sizeList: [{ sizeId: 11 }],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'owned-special-voucher',
      count: 1,
      rewardRule: {
        ruleId: 'voucher-special-1',
        couponTemplateId: 'template-special-1',
        name: 'Owned special price voucher',
        displayName: 'Owned special price voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'orderItemFixedPriceCoupon',
          productLine: ['EMENU'],
          validity: {
            type: 'permanent',
          },
          ruleExpression: {
            condition: {
              itemFilter: {
                type: 'include',
                value: [],
              },
            },
            options: {
              quantityLimit: 1,
            },
            benefits: [
              {
                _id: 'voucher-special-size-small',
                condition: {
                  itemFilter: {
                    type: 'include',
                    value: [
                      {
                        itemId: 1001,
                        merchantId: 'M000020684',
                        productLine: 'EMENU',
                        price: 18.88,
                        sizeList: [{ sizeId: 11 }],
                      },
                    ],
                  },
                },
                actions: [
                  {
                    type: 'setPrice',
                    params: {
                      price: 8.88,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'owned-quantity-voucher',
      count: 3,
      rewardRule: {
        ruleId: 'voucher-quantity-1',
        couponTemplateId: 'template-quantity-1',
        name: 'Owned quantity voucher',
        displayName: 'Owned quantity voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'quantityItemDiscountCoupon',
          productLine: ['EMENU'],
          validity: {
            type: 'permanent',
          },
          ruleExpression: {
            condition: {
              itemFilter: {
                type: 'all',
                value: [],
              },
            },
            options: {
              quantityLimit: 2,
              sameItem: false,
            },
            benefits: [
              {
                condition: {
                  quantity: 2,
                },
                actions: [
                  {
                    type: 'percentage',
                    params: {
                      value: 50,
                      quantity: 1,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'owned-fixed-amount-voucher',
      count: 1,
      rewardRule: {
        ruleId: '_voucherCode_template-fixed-voucher',
        couponTemplateId: 'template-fixed-voucher',
        name: 'Owned fixed amount voucher',
        displayName: 'Owned fixed amount voucher',
        description: 'A member-owned fixed amount voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'voucher',
          productLine: ['EMENU'],
          validity: {
            type: 'permanent',
          },
          ruleExpression: {
            condition: {
              itemFilter: {
                type: 'all',
                value: [],
              },
            },
            benefits: [
              {
                condition: {
                  itemFilter: {
                    value: [],
                  },
                },
                actions: [
                  {
                    type: 'minus',
                    target: 'totalAmount',
                    params: {
                      value: 10,
                    },
                    itemFilter: {
                      value: [],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'owned-percentage-discount-voucher',
      count: 2,
      rewardRule: {
        ruleId: '_voucherCode_template-percentage-discount-voucher',
        couponTemplateId: 'template-percentage-discount-voucher',
        name: 'Owned percentage discount voucher',
        displayName: 'Owned percentage discount voucher',
        description: 'A member-owned percentage discount voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'discountCoupon',
          productLine: ['EMENU'],
          validity: {
            type: 'permanent',
          },
          ruleExpression: {
            condition: {
              itemFilter: {
                type: 'all',
                value: [],
              },
            },
            benefits: [
              {
                condition: {
                  itemFilter: {
                    value: [],
                  },
                },
                actions: [
                  {
                    type: 'percentage',
                    target: 'totalAmount',
                    params: {
                      value: 20,
                    },
                    itemFilter: {
                      value: [],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    },
    {
      id: 'zero-count-voucher',
      count: 0,
      rewardRule: {
        ruleId: 'zero-count',
        couponTemplateId: 'template-zero-count',
        type: 'voucher',
        couponTemplate: {
          type: 'giftItemCoupon',
          productLine: ['EMENU'],
        },
      },
    },
    {
      id: 'kiosk-only-voucher',
      count: 1,
      rewardRule: {
        ruleId: 'kiosk-only-voucher',
        couponTemplateId: 'template-kiosk-only',
        type: 'voucher',
        couponTemplate: {
          type: 'giftItemCoupon',
          productLine: ['KIOSK'],
        },
      },
    },
    {
      id: 'missing-rule-voucher',
      count: 1,
    },
    {
      id: 'missing-template-id-voucher',
      count: 1,
      rewardRule: {
        ruleId: 'missing-template-id',
        name: 'Missing coupon template id voucher',
        displayName: 'Missing coupon template id voucher',
        type: 'voucher',
        couponTemplate: {
          type: 'giftItemCoupon',
          productLine: ['EMENU'],
        },
      },
    },
  ]

  const saleItems = [
    {
      id: 1001,
      name: 'Soup base',
      price: 18.88,
      hidden: false,
      itemPrices: [
        { sizeId: 11, price: 18.88, type: 'ALL' },
        { sizeId: 12, price: 20.88, type: 'ALL' },
        { sizeId: 13, price: 22.88, type: 'ALL' },
      ],
    },
    { id: 1002, hidden: false },
    { id: 1003, hidden: false },
    { id: 1004, hidden: false },
  ]

  const menuRewards = resolveCrmIntegrationMenuRewards(rewards, {
    saleItems,
    merchantId: 'M000020684',
  })

  assert.equal(menuRewards.length, 5)
  assert.deepEqual(
    menuRewards.map((reward) => reward.id),
    [
      'crm-integration-reward-fixed-1',
      'crm-integration-reward-percent-1',
      'crm-integration-reward-gift-1',
      'crm-integration-reward-special-1',
      'crm-integration-reward-quantity-discount-1',
    ]
  )
  assert.equal(menuRewards[0].crmIntegrationReward, true)
  assert.equal(
    menuRewards[0].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT
  )
  assert.equal(menuRewards[0].points, 50)
  assert.equal(menuRewards[0].discountValue, 10)
  assert.equal(menuRewards[0].name, 'Ten dollars off')
  assert.equal(menuRewards[0].minSpend, 20)
  assert.equal(menuRewards[0].expireAt, 1735516800000)
  assert.equal(menuRewards[0].isPermanent, false)
  assert.equal(menuRewards[0].eligibleItemScope, 'all')
  assert.equal(menuRewards[0].eligibleItemCount, 4)
  assert.equal(
    menuRewards[1].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
  )
  assert.equal(menuRewards[1].points, 80)
  assert.equal(menuRewards[1].discountValue, 20)
  assert.equal(menuRewards[1].name, 'Display twenty percent off')
  assert.equal(
    menuRewards[1].description,
    'Only coupon template description should render here'
  )
  assert.equal(menuRewards[1].minSpend, 0)
  assert.equal(menuRewards[1].expireAt, null)
  assert.equal(menuRewards[1].isPermanent, true)
  assert.equal(menuRewards[1].eligibleItemScope, 'include')
  assert.equal(menuRewards[1].eligibleItemCount, 2)
  assert.equal(
    menuRewards[2].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  )
  assert.equal(menuRewards[2].giftQuantity, 1)
  assert.equal(menuRewards[2].eligibleItemScope, 'include')
  assert.equal(menuRewards[2].eligibleItemCount, 2)
  assert.equal(menuRewards[2].hasCouponItemDialog, true)
  assert.equal(menuRewards[2].couponItemList.length, 2)
  assert.deepEqual(
    menuRewards[2].couponItemList[0].itemPrices.map((price) => price.sizeId),
    [11]
  )
  assert.equal(
    menuRewards[3].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
  )
  assert.equal(menuRewards[3].points, 188)
  assert.equal(menuRewards[3].quantityLimit, 1)
  assert.equal(menuRewards[3].specialPrice, 9.99)
  assert.equal(menuRewards[3].eligibleItemScope, 'include')
  assert.equal(menuRewards[3].eligibleItemCount, 1)
  assert.equal(menuRewards[3].hasCouponItemDialog, true)
  assert.equal(menuRewards[3].couponItemList.length, 1)
  assert.equal(menuRewards[3].couponItemList[0].id, 1001)
  assert.equal(menuRewards[3].couponItemList[0].specialPrice, 9.99)
  assert.equal(menuRewards[3].couponItemList[0].itemPrices.length, 2)
  assert.deepEqual(
    menuRewards[3].couponItemList[0].itemPrices.map((price) => price.sizeId),
    [11, 12]
  )
  assert.equal(
    menuRewards[4].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  )
  assert.equal(menuRewards[4].points, 200)
  assert.equal(menuRewards[4].quantityLimit, 4)
  assert.equal(menuRewards[4].sameItem, true)
  assert.deepEqual(menuRewards[4].bundleDiscountRule, {
    orderQuantity: 3,
    discountValue: 80,
    discountNum: 1,
    discountType: 'percentage',
  })
  assert.equal(menuRewards[4].buyQuantity, 2)
  assert.equal(menuRewards[4].discountValue, 80)
  assert.equal(menuRewards[4].discountQuantity, 1)
  assert.equal(menuRewards[4].eligibleItemScope, 'all')
  assert.equal(menuRewards[4].eligibleItemCount, 4)
  assert.equal(menuRewards[4].hasCouponItemDialog, false)
  assert.equal(menuRewards[4].couponItemList.length, 4)
  assert.deepEqual(
    menuRewards[4].couponItemList.map((item) => item.id),
    [1001, 1002, 1003, 1004]
  )
  assert.deepEqual(
    menuRewards[4].couponItemList[0].itemPrices.map((price) => price.sizeId),
    [11, 12, 13]
  )

  const menuVouchers = resolveCrmIntegrationMenuVouchers(memberVouchers, {
    saleItems,
    merchantId: 'M000020684',
  })

  assert.equal(menuVouchers.length, 5)
  assert.deepEqual(
    menuVouchers.map((voucher) => voucher.id),
    [
      'crm-integration-voucher-voucher-gift-1',
      'crm-integration-voucher-voucher-special-1',
      'crm-integration-voucher-voucher-quantity-1',
      'crm-integration-voucher-_voucherCode_template-fixed-voucher',
      'crm-integration-voucher-_voucherCode_template-percentage-discount-voucher',
    ]
  )
  assert.equal(menuVouchers[0].crmIntegrationReward, true)
  assert.equal(menuVouchers[0].crmIntegrationVoucher, true)
  assert.equal(menuVouchers[0].crmIntegrationRewardSource, 'voucher')
  assert.equal(menuVouchers[0].voucherCount, 3)
  assert.equal(menuVouchers[0].rawVouchers.length, 2)
  assert.equal(
    menuVouchers[0].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.FREE_ITEM
  )
  assert.equal(menuVouchers[0].minSpend, 25)
  assert.equal(menuVouchers[0].couponItemList.length, 1)
  assert.deepEqual(
    menuVouchers[0].couponItemList[0].itemPrices.map((price) => price.sizeId),
    [11]
  )
  assert.equal(menuVouchers[1].voucherCount, 1)
  assert.equal(
    menuVouchers[1].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.SPECIAL_ITEM
  )
  assert.equal(menuVouchers[1].specialPrice, 8.88)
  assert.equal(menuVouchers[1].hasCouponItemDialog, true)
  assert.equal(menuVouchers[2].voucherCount, 3)
  assert.equal(
    menuVouchers[2].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.QUANTITY_ITEM_DISCOUNT
  )
  assert.equal(menuVouchers[2].eligibleItemScope, 'all')
  assert.equal(menuVouchers[2].hasCouponItemDialog, false)
  assert.equal(menuVouchers[2].couponItemList.length, 4)
  assert.equal(menuVouchers[3].voucherCount, 1)
  assert.equal(
    menuVouchers[3].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.FIXED_DISCOUNT
  )
  assert.equal(menuVouchers[3].discountValue, 10)
  assert.equal(menuVouchers[3].eligibleItemScope, 'all')
  assert.equal(menuVouchers[3].hasCouponItemDialog, false)
  assert.equal(menuVouchers[4].voucherCount, 2)
  assert.equal(
    menuVouchers[4].crmIntegrationRewardKind,
    CRM_INTEGRATION_REWARD_KIND.PERCENTAGE_DISCOUNT
  )
  assert.equal(menuVouchers[4].discountValue, 20)
  assert.equal(menuVouchers[4].eligibleItemScope, 'all')
  assert.equal(menuVouchers[4].hasCouponItemDialog, false)
} finally {
  await server.close()
}
