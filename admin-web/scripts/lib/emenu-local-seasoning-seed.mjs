const now = "2026-08-12T00:00:00.000Z";

export const UNCATEGORIZED_OPTION_CATEGORY_ID = "option-category-uncategorized";

const optionCategories = [
  { id: "option-category-aromatics", code: "AROMATICS", name: "香辛料", status: "active", sortOrder: 10, system: false, createdAt: now, updatedAt: now },
  { id: "option-category-seasoning", code: "SEASONING", name: "基础调味", status: "active", sortOrder: 20, system: false, createdAt: now, updatedAt: now },
  { id: "option-category-sauces", code: "SAUCES", name: "酱料", status: "active", sortOrder: 30, system: false, createdAt: now, updatedAt: now },
  { id: UNCATEGORIZED_OPTION_CATEGORY_ID, code: "UNCATEGORIZED", name: "未分类", status: "active", sortOrder: 999999, system: true, createdAt: now, updatedAt: now },
];

const optionCategoryBySlug = new Map([
  ...["cilantro", "scallion", "garlic", "chili", "pepper", "ginger", "onion", "cumin"].map((slug) => [slug, "option-category-aromatics"]),
  ...["peanut", "salt", "sugar", "vinegar", "sesame"].map((slug) => [slug, "option-category-seasoning"]),
  ...["soy", "sesame-oil", "mustard", "mayo", "ketchup", "hot-sauce", "cheese"].map((slug) => [slug, "option-category-sauces"]),
]);

const optionRows = [
  ["cilantro", "CILANTRO", "香菜", "Cilantro"],
  ["scallion", "SCALLION", "葱", "Scallion"],
  ["garlic", "GARLIC", "蒜", "Garlic"],
  ["chili", "CHILI", "辣椒", "Chili"],
  ["peanut", "PEANUT", "花生", "Peanut"],
  ["salt", "SALT", "盐", "Salt"],
  ["sugar", "SUGAR", "糖", "Sugar"],
  ["vinegar", "VINEGAR", "醋", "Vinegar"],
  ["soy", "SOY_SAUCE", "酱油", "Soy sauce"],
  ["pepper", "BLACK_PEPPER", "黑胡椒", "Black pepper"],
  ["sesame", "SESAME", "芝麻", "Sesame"],
  ["sesame-oil", "SESAME_OIL", "香油", "Sesame oil"],
  ["ginger", "GINGER", "姜", "Ginger"],
  ["onion", "ONION", "洋葱", "Onion"],
  ["cumin", "CUMIN", "孜然", "Cumin"],
  ["mustard", "MUSTARD", "芥末", "Mustard"],
  ["mayo", "MAYO", "蛋黄酱", "Mayonnaise"],
  ["ketchup", "KETCHUP", "番茄酱", "Ketchup"],
  ["hot-sauce", "HOT_SAUCE", "辣酱", "Hot sauce"],
  ["cheese", "CHEESE", "芝士", "Cheese"],
];

const products = [
  ["p-kungpao", "D1001", "宫保鸡丁", "cat-hot", "热菜", 10, true, "active"],
  ["p-yuxiang", "D1002", "鱼香肉丝", "cat-hot", "热菜", 20, true, "active"],
  ["p-mapo", "D1003", "麻婆豆腐", "cat-hot", "热菜", 30, true, "active"],
  ["p-beef", "D1004", "孜然牛肉", "cat-hot", "热菜", 40, true, "active"],
  ["p-soup", "D2001", "酸辣汤", "cat-soup", "汤羹", 10, true, "active"],
  ["p-wonton", "D2002", "馄饨汤", "cat-soup", "汤羹", 20, true, "active"],
  ["p-noodle", "D3001", "牛肉面", "cat-staple", "主食", 10, true, "active"],
  ["p-rice", "D3002", "扬州炒饭", "cat-staple", "主食", 20, true, "active"],
  ["p-dumpling", "D3003", "水饺", "cat-staple", "主食", 30, true, "active"],
  ["p-salad", "D4001", "凉拌黄瓜", "cat-cold", "凉菜", 10, true, "active"],
  ["p-chicken-cold", "D4002", "口水鸡", "cat-cold", "凉菜", 20, true, "active"],
  ["p-retired", "D9998", "已停用菜品", "cat-hot", "热菜", 999, true, "inactive"],
  ["p-not-sellable", "D9999", "非 eMenu 菜品", "cat-hot", "热菜", 1000, false, "active"],
].map(([id, code, name, categoryId, categoryName, sortOrder, emenuSellable, status]) => ({
  id, code, name, categoryId, categoryName, sortOrder, emenuSellable, status,
}));

const menuGroups = [
  {
    id: "group-main",
    name: "常规菜单",
    sortOrder: 10,
    categories: [
      { id: "cat-hot", name: "热菜", sortOrder: 10, productIds: ["p-kungpao", "p-yuxiang", "p-mapo", "p-beef", "p-retired", "p-not-sellable"] },
      { id: "cat-cold", name: "凉菜", sortOrder: 20, productIds: ["p-salad", "p-chicken-cold"] },
      { id: "cat-soup", name: "汤羹", sortOrder: 30, productIds: ["p-soup", "p-wonton"] },
      { id: "cat-staple", name: "主食", sortOrder: 40, productIds: ["p-noodle", "p-rice", "p-dumpling"] },
    ],
  },
  {
    id: "group-featured",
    name: "推荐专区",
    sortOrder: 20,
    categories: [
      { id: "cat-signature", name: "招牌推荐", sortOrder: 10, productIds: ["p-kungpao", "p-beef", "p-chicken-cold"] },
      { id: "cat-quick", name: "快捷点餐", sortOrder: 20, productIds: ["p-noodle", "p-rice", "p-soup"] },
    ],
  },
];

export function createEmenuSeasoningSeedDb() {
  const options = optionRows.map(([id, code, name, nameEn], index) => ({
    id: `o-${id}`,
    code,
    name,
    nameEn,
    categoryId: optionCategoryBySlug.get(id) ?? UNCATEGORIZED_OPTION_CATEGORY_ID,
    status: id === "mustard" ? "inactive" : "active",
    sortOrder: (index + 1) * 10,
    createdAt: now,
    updatedAt: now,
  }));
  const relationRows = [
    ["p-kungpao", "ADD", "o-peanut", 1, 10, "active"],
    ["p-kungpao", "LESS", "o-chili", 0, 10, "active"],
    ["p-kungpao", "MORE", "o-chili", 0, 10, "active"],
    ["p-kungpao", "NONE", "o-chili", 0, 10, "active"],
    ["p-kungpao", "NONE", "o-scallion", 0, 20, "active"],
    ["p-yuxiang", "MORE", "o-chili", 0.5, 10, "active"],
    ["p-yuxiang", "NONE", "o-garlic", 0, 10, "inactive"],
    ["p-mapo", "LESS", "o-salt", 0, 10, "active"],
    ["p-soup", "MORE", "o-vinegar", 0, 10, "active"],
    ["p-noodle", "ADD", "o-chili", 0.5, 10, "active"],
  ];
  const relations = relationRows.map(([productId, action, optionId, priceDelta, sortOrder, status], index) => ({
    id: `r-${index + 1}`,
    productId,
    action,
    optionId,
    priceDelta,
    sortOrder,
    status,
    createdAt: now,
    updatedAt: now,
  }));
  return {
    version: 1,
    updatedAt: now,
    permissions: { canView: true, canEdit: true },
    categories: [
      { id: "cat-hot", name: "热菜", sortOrder: 10 },
      { id: "cat-soup", name: "汤羹", sortOrder: 20 },
      { id: "cat-staple", name: "主食", sortOrder: 30 },
      { id: "cat-cold", name: "凉菜", sortOrder: 40 },
    ],
    menuGroups,
    products,
    optionCategories,
    options,
    relations,
    auditLog: [],
    orderSnapshots: [],
  };
}
