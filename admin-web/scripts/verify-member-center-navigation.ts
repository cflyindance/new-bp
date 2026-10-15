import assert from "node:assert/strict";
import { MEMBER_CENTER_NAV, flattenMemberNavigation } from "../src/config/member-center-navigation";
import { NAV_MODULES, findMembersNavTitle, flattenNavPaths } from "../src/config/navigation";
import { buildNavRouteRegistry } from "../src/config/nav-route-registry";
const expected = [["会员列表","/members/users/list"],["修改会员信息","/members/users/edit"],["会员概览","/members/crm/overview"],["会员管理","/members/crm/members"],["访问报表","/members/crm/visits"],["销售报表","/members/crm/sales"],["短信营销任务","/members/crm/sms-tasks"],["生日营销任务","/members/crm/birthday-tasks"],["设置","/members/crm/settings"],["用户列表","/members/crm/users"],["动态标签","/members/segments/dynamic-tags"],["KOL/KOC管理","/members/channels/kol-koc"],["优惠券管理","/members/card/coupon-mgmt"],["付费会员明细","/members/card/paid-detail"],["付费会员配置","/members/card/paid-config"],["经营预览","/members/loyalty/overview"],["顾客分析","/members/loyalty/recognition/analysis"],["识别设置","/members/loyalty/recognition/settings"],["会员列表","/members/loyalty/members/list"],["会员标签与分群","/members/loyalty/members/segments"],["会员设置","/members/loyalty/plan/settings"],["等级体系","/members/loyalty/plan/tiers"],["积分体系","/members/loyalty/plan/points"],["等级变更记录","/members/loyalty/plan/tier-history"],["权益会员配置","/members/loyalty/benefits/config"],["权益会员明细","/members/loyalty/benefits/details"],["会员价","/members/loyalty/benefits/pricing"],["券模板管理","/members/loyalty/coupons/templates"],["会员优惠券","/members/loyalty/coupons/member-coupons"],["渠道优惠券","/members/loyalty/coupons/channel-coupons"],["券包设置","/members/loyalty/coupons/package-settings"],["券包明细","/members/loyalty/coupons/package-details"],["礼品卡","/members/loyalty/coupons/gift-cards"],["精准营销","/members/loyalty/marketing/targeted"],["自动化营销","/members/loyalty/marketing/automation"],["营销活动","/members/loyalty/marketing/campaigns"],["广告位管理","/members/loyalty/marketing/ad-slots"],["积分设置(第三方forge)","/members/points"]];
assert.equal(MEMBER_CENTER_NAV.length, 7);
const nodes = flattenMemberNavigation();
assert.equal(new Set(nodes.map(n => n.path)).size, nodes.length);
const paths = new Set(flattenNavPaths());
const registry = buildNavRouteRegistry();
for (const [title, path] of expected) {
  assert.equal(findMembersNavTitle(path)?.title, title, path);
  assert(paths.has(path), path);
  assert(registry.some(n => n.path === path && n.title === title), path);
}
assert.deepEqual(NAV_MODULES.find(m=>m.id==="members")!.children.slice(0,7).map(n=>n.id), MEMBER_CENTER_NAV.map(n=>n.id));
console.log(`member navigation verified: ${expected.length} leaves, unique paths, titles, route registry and preset parents`);

