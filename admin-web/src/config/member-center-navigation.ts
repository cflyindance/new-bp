import type { ProductCenterSidebarSubItem, ProductCenterSidebarSubchild } from "./navigation";

/** 用户截图菜单基线，MEMBERS-20261015-01。业务页面只承接既有实现。 */
export const MEMBER_CENTER_NAV: ProductCenterSidebarSubItem[] = [
  {
    "id": "mem-users",
    "title": "用户管理",
    "path": "/members/users",
    "activePrefix": "/members/users",
    "sidebarChildren": [
      {
        "title": "会员列表",
        "path": "/members/users/list"
      },
      {
        "title": "修改会员信息",
        "path": "/members/users/edit"
      }
    ]
  },
  {
    "id": "mem-crm",
    "title": "CRM1.0",
    "path": "/members/crm",
    "activePrefix": "/members/crm",
    "sidebarChildren": [
      {
        "title": "会员概览",
        "path": "/members/crm/overview"
      },
      {
        "title": "会员管理",
        "path": "/members/crm/members"
      },
      {
        "title": "访问报表",
        "path": "/members/crm/visits"
      },
      {
        "title": "销售报表",
        "path": "/members/crm/sales"
      },
      {
        "title": "短信营销任务",
        "path": "/members/crm/sms-tasks"
      },
      {
        "title": "生日营销任务",
        "path": "/members/crm/birthday-tasks"
      },
      {
        "title": "设置",
        "path": "/members/crm/settings"
      },
      {
        "title": "用户列表",
        "path": "/members/crm/users"
      }
    ]
  },
  {
    "id": "mem-segments",
    "title": "用户分层",
    "path": "/members/segments",
    "activePrefix": "/members/segments",
    "sidebarChildren": [
      {
        "title": "动态标签",
        "path": "/members/segments/dynamic-tags"
      }
    ]
  },
  {
    "id": "mem-channels",
    "title": "渠道管理",
    "path": "/members/channels",
    "activePrefix": "/members/channels",
    "sidebarChildren": [
      {
        "title": "KOL/KOC管理",
        "path": "/members/channels/kol-koc"
      }
    ]
  },
  {
    "id": "mem-card-entry",
    "title": "卡券管理",
    "path": "/members/card",
    "activePrefix": "/members/card",
    "sidebarChildren": [
      {
        "title": "优惠券管理",
        "path": "/members/card/coupon-mgmt"
      },
      {
        "title": "付费会员明细",
        "path": "/members/card/paid-detail"
      },
      {
        "title": "付费会员配置",
        "path": "/members/card/paid-config"
      }
    ]
  },
  {
    "id": "mem-loyalty",
    "title": "Booming Loyalty",
    "path": "/members/loyalty",
    "activePrefix": "/members/loyalty",
    "sidebarChildren": [
      {
        "title": "经营预览",
        "path": "/members/loyalty/overview"
      },
      {
        "title": "支付顾客识别",
        "path": "/members/loyalty/recognition",
        "sidebarChildren": [
          {
            "title": "顾客分析",
            "path": "/members/loyalty/recognition/analysis"
          },
          {
            "title": "识别设置",
            "path": "/members/loyalty/recognition/settings"
          }
        ]
      },
      {
        "title": "会员管理",
        "path": "/members/loyalty/members",
        "sidebarChildren": [
          {
            "title": "会员列表",
            "path": "/members/loyalty/members/list"
          },
          {
            "title": "会员标签与分群",
            "path": "/members/loyalty/members/segments"
          }
        ]
      },
      {
        "title": "会员计划",
        "path": "/members/loyalty/plan",
        "sidebarChildren": [
          {
            "title": "会员设置",
            "path": "/members/loyalty/plan/settings"
          },
          {
            "title": "等级体系",
            "path": "/members/loyalty/plan/tiers"
          },
          {
            "title": "积分体系",
            "path": "/members/loyalty/plan/points"
          },
          {
            "title": "等级变更记录",
            "path": "/members/loyalty/plan/tier-history"
          }
        ]
      },
      {
        "title": "权益会员",
        "path": "/members/loyalty/benefits",
        "sidebarChildren": [
          {
            "title": "权益会员配置",
            "path": "/members/loyalty/benefits/config"
          },
          {
            "title": "权益会员明细",
            "path": "/members/loyalty/benefits/details"
          },
          {
            "title": "会员价",
            "path": "/members/loyalty/benefits/pricing"
          }
        ]
      },
      {
        "title": "卡券管理",
        "path": "/members/loyalty/coupons",
        "sidebarChildren": [
          {
            "title": "券模板管理",
            "path": "/members/loyalty/coupons/templates"
          },
          {
            "title": "会员优惠券",
            "path": "/members/loyalty/coupons/member-coupons"
          },
          {
            "title": "渠道优惠券",
            "path": "/members/loyalty/coupons/channel-coupons"
          },
          {
            "title": "券包设置",
            "path": "/members/loyalty/coupons/package-settings"
          },
          {
            "title": "券包明细",
            "path": "/members/loyalty/coupons/package-details"
          },
          {
            "title": "礼品卡",
            "path": "/members/loyalty/coupons/gift-cards"
          }
        ]
      },
      {
        "title": "营销管理",
        "path": "/members/loyalty/marketing",
        "sidebarChildren": [
          {
            "title": "精准营销",
            "path": "/members/loyalty/marketing/targeted"
          },
          {
            "title": "自动化营销",
            "path": "/members/loyalty/marketing/automation"
          },
          {
            "title": "营销活动",
            "path": "/members/loyalty/marketing/campaigns"
          },
          {
            "title": "广告位管理",
            "path": "/members/loyalty/marketing/ad-slots"
          }
        ]
      }
    ]
  },
  {
    "id": "mem-points",
    "title": "积分设置(第三方forge)",
    "path": "/members/points",
    "activePrefix": "/members/points"
  }
];

export function flattenMemberNavigation(nodes: readonly (ProductCenterSidebarSubItem | ProductCenterSidebarSubchild)[] = MEMBER_CENTER_NAV): ProductCenterSidebarSubchild[] {
  return nodes.flatMap(node => [node, ...flattenMemberNavigation(node.sidebarChildren ?? [])]);
}

