import assert from "node:assert/strict";
import fs from "node:fs";
import {
  resolveConfiguredStrikethroughPrice,
  STRIKETHROUGH_PRICE_STORAGE_KEY,
} from "../vendor/emenu-new/src/services/strikethroughPriceBridge.js";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const routes = read("src/shell/emenu-local-routes.ts");
const shell = read("src/shell/emenu-local-shell.ts");
const page = read("src/emenu-local/strikethrough-price/strikethrough-price-page.ts");
const domain = read("src/emenu-local/strikethrough-price/strikethrough-price-domain.ts");
const store = read("src/emenu-local/strikethrough-price/strikethrough-price-store.ts");
const emenuMenus = read("vendor/emenu-new/src/services/menus.js");
const dishCard = read("vendor/emenu-new/src/components/DishItemCard/index.jsx");
const largeDishCard = read("vendor/emenu-new/src/components/DishItemCard/LargeContent.jsx");
const smallDishCard = read("vendor/emenu-new/src/components/DishItemCard/SmallContent.jsx");
const dishItemCount = read("vendor/emenu-new/src/components/DishItemCount/index.jsx");
const largeDishCardStyles = read("vendor/emenu-new/src/components/DishItemCard/LargeContent.module.less");

assert.match(routes, /emenu-settings[\s\S]*product-strikethrough-price/, "商品划线价必须位于设置下方");
assert.match(routes, /\/emenu-local\/product-strikethrough-price/, "必须注册独立路由");
assert.match(shell, /renderProductStrikethroughPricePage/, "Shell 必须渲染独立业务页");
assert.match(page, /选择商品[\s\S]*设置价格[\s\S]*确认保存/, "必须实现三步流程");
assert.match(page, /import \{ seasoningApi \} from "\.\.\/seasoning\/seasoning-api"/, "商品划线价必须复用调味设置商品 API");
assert.match(page, /seasoningApi\.menuStructure/, "商品组类菜必须来自调味菜单结构接口");
assert.doesNotMatch(page, /createEmenuSeasoningSeedDb/, "商品划线价页面不得维护独立静态商品源");
assert.match(page, /data-batch-set/);
assert.match(page, /data-batch-clear/);
assert.match(page, /data-row-price/);
assert.match(page, /暂未设置商品划线价/, "默认页必须提供空列表状态");
assert.match(page, /data-open-strike-wizard/, "必须通过新增按钮打开设置流程");
assert.match(page, /data-strike-wizard-overlay/, "新增商品操作必须使用独立弹框");
assert.match(page, /role=\"dialog\"[\s\S]*aria-modal=\"true\"/, "新增弹框必须暴露可访问的模态语义");
assert.match(page, /configuredEntries/, "默认页必须展示已设置商品列表");
assert.match(page, /data-edit-configured/);
assert.match(page, /data-clear-configured/);
assert.match(domain, /划线价必须高于当前售价/);
assert.match(domain, /STRIKETHROUGH_PRICE_MAX_CENTS/);
assert.match(store, /expectedVersion/);
assert.match(store, /auditLog/);
assert.match(store, /deploymentStatus: "synced"/);
assert.match(emenuMenus, /strikethroughPriceBridge/, "eMenu 菜单转换必须读取后台划线价配置桥接");
assert.match(emenuMenus, /resolveConfiguredStrikethroughPrice/, "商品转换必须优先使用已配置划线价字段");
assert.match(emenuMenus, /% OFF/, "划线价折扣必须使用 xx% OFF 格式");
assert.doesNotMatch(emenuMenus, /strikethDiscount\s*=\s*[\r\n\s]*'-'/, "划线价折扣不得保留前导负号");

const storage = {
  getItem(key) {
    assert.equal(key, STRIKETHROUGH_PRICE_STORAGE_KEY);
    return JSON.stringify({ prices: { "dish-1": { cents: 3990, version: 2 }, "dish-2": { cents: null, version: 3 } } });
  },
};
assert.deepEqual(resolveConfiguredStrikethroughPrice("dish-1", storage), { hasOverride: true, value: 39.9 });
assert.deepEqual(resolveConfiguredStrikethroughPrice("dish-2", storage), { hasOverride: true, value: null });
assert.deepEqual(resolveConfiguredStrikethroughPrice("dish-3", storage), { hasOverride: false, value: undefined });
for (const [name, source] of [["combo", dishCard], ["large", largeDishCard], ["small", smallDishCard]]) {
  assert.doesNotMatch(source, /data-striketh-discount-badge/, `${name} 商品卡图片区域不得重复展示折扣标签`);
  assert.match(source, /allTextLabel=\{displayTextLabels\}/, `${name} 商品卡必须将折扣复用到现有文本标签容器`);
  assert.match(source, /strikethDiscount[\s\S]*\.\.\.allTextLabel/, `${name} 商品卡折扣标签必须排在商品原有标签之前`);
  assert.match(source, /data-primary-price-line/, `${name} 商品卡售价与划线价必须位于首行`);
  assert.match(source, /data-member-price-line/, `${name} 商品卡会员价必须位于独立次行`);
  assert.match(source, /showStrikethroughOnPrimary/, `${name} 商品卡必须仅在会员价同时存在时将划线价放在首行`);
  assert.match(source, /showStrikethroughOnSecondary/, `${name} 商品卡必须在无会员价时将划线价放在次行`);
}
assert.match(smallDishCard, /compactBadgeMode=\{hasBenefitAndStrikethroughPrice\}/, "仅小图双价格商品卡必须启用固定加号徽标");
assert.match(dishItemCount, /compactBadgeMode/, "数量组件必须支持固定加号徽标模式");
assert.match(dishItemCount, /data-compact-count-badge/, "固定加号模式必须在加号上展示数量徽标");
assert.match(
  largeDishCard,
  /data-large-price-operation-row[\s\S]*className=\{styles\.priceText\}[\s\S]*className=\{styles\.addActions\}/,
  "大图商品卡的价格与加号必须位于同一个底部操作行"
);
assert.match(largeDishCardStyles, /\.memberPriceLine\s*\{[\s\S]*?font-weight:\s*400;/, "大图会员价不得加粗");
assert.match(largeDishCardStyles, /\.decoration\s*\{[\s\S]*?font-weight:\s*400;/, "大图划线价不得加粗");
assert.doesNotMatch(largeDishCard, /<div className=\{styles\.striketh\}>\s*\{strikethDiscount\}/, "大图价格区不得重复展示折扣百分比");
assert.doesNotMatch(smallDishCard, /<span className=\{styles\.discount\}>\{strikethDiscount\}<\/span>/, "小图价格区不得重复展示折扣百分比");

const assertPriceOrder = (name, source, strikeToken, vipToken) => {
  const strikeIndex = source.indexOf(strikeToken);
  const vipIndex = source.indexOf(vipToken, strikeIndex);
  assert.ok(strikeIndex >= 0, `${name} 商品卡必须展示划线价`);
  assert.ok(vipIndex > strikeIndex, `${name} 商品卡划线价必须展示在付费会员价之前`);
};
assertPriceOrder("combo", dishCard, "strikethroughPrice.toFixed(2)", "<VipPriceWithImg");
assertPriceOrder("large", largeDishCard, "strikethroughPrice.toFixed(2)", "<VipPriceWithImg");
assertPriceOrder("small", smallDishCard, "strikethroughPrice.toFixed(2)", "<VipPriceWithImg");

console.log("verify-emenu-strikethrough-price: ok");
