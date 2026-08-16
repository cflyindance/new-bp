import { mapKposMenusToSeasoningView } from "./lib/emenu-local-seasoning-menu-map.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const raw = {
  menuVersion: "mv-1",
  menus: [
    {
      menuGroups: [
        {
          id: "g1",
          name: "常规",
          menuCategories: [
            {
              id: "c1",
              name: "热菜",
              saleItems: [
                {
                  id: "1001",
                  name: "宫保鸡丁",
                  itemNumber: "D1001",
                  price: 12,
                  hiddenItem: false,
                },
                {
                  id: "1002",
                  name: "隐藏菜",
                  itemNumber: "D1002",
                  price: 10,
                  hiddenItem: true,
                },
                {
                  id: "1003",
                  name: "无价格菜",
                  itemNumber: "D1003",
                  hiddenItem: false,
                },
              ],
            },
          ],
        },
        {
          id: "g2",
          name: "推荐",
          menuCategories: [
            {
              id: "c2",
              name: "招牌",
              saleItems: [
                {
                  id: "1001",
                  name: "宫保鸡丁",
                  itemNumber: "D1001",
                  price: 12,
                  hiddenItem: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const view = mapKposMenusToSeasoningView(raw);
assert(view.products.length === 1 && view.products[0].id === "1001", "only visible priced items");
assert(view.products[0].code === "D1001", "itemNumber maps to code");
assert(view.products[0].emenuSellable === true && view.products[0].status === "active", "sellable flags");
assert(view.menuGroups.length === 2, "both groups kept");
assert(view.menuGroups[0].categories[0].productIds.includes("1001"), "placement in first group");
assert(view.menuGroups[1].categories[0].productIds.includes("1001"), "same product multi-path");
assert(view.categories.some((c) => c.id === "c1"), "flat categories derived");
assert(view.sourceMenuVersion === "mv-1", "preserve menuVersion");
assert(typeof view.fingerprint === "string" && view.fingerprint.startsWith("kpos:"), "fingerprint required");

const empty = mapKposMenusToSeasoningView({ menus: [{ menuGroups: [] }] });
assert(empty.products.length === 0 && empty.menuGroups.length === 0, "empty menu");

console.log("verify-emenu-local-seasoning-menu-map: ok");
