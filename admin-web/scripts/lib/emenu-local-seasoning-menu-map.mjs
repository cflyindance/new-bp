import crypto from "node:crypto";

function htmlDecode(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function isNil(value) {
  return value === null || value === undefined;
}

function isHiddenSaleItem(item) {
  if (!item || item.hiddenItem) return true;
  const defaultPrice = item.addPrice ?? item.price;
  const itemPrices = Array.isArray(item.itemPrices) ? item.itemPrices : [];
  if (!item.marketPriceItem && isNil(defaultPrice) && itemPrices.length === 0) return true;
  return false;
}

/**
 * @param {any} payload KPOS /menu/menu JSON body (or { menus, menuVersion })
 * @returns {{ menuGroups: any[], products: any[], categories: any[], sourceMenuVersion: string|null, fingerprint: string }}
 */
export function mapKposMenusToSeasoningView(payload) {
  const menus = payload?.menus ?? payload?.data?.menus ?? [];
  const sourceMenuVersion = payload?.menuVersion ?? payload?.data?.menuVersion ?? null;
  const groupsIn = menus?.[0]?.menuGroups ?? [];
  const productsById = new Map();
  const categoriesById = new Map();
  const menuGroups = [];

  groupsIn.forEach((group, groupIndex) => {
    const categories = [];
    (group?.menuCategories ?? []).forEach((category, categoryIndex) => {
      const productIds = [];
      (category?.saleItems ?? []).forEach((item, itemIndex) => {
        if (isHiddenSaleItem(item)) return;
        const id = String(item.id);
        productIds.push(id);
        if (!productsById.has(id)) {
          const firstTierPrice = Array.isArray(item.itemPrices) ? item.itemPrices.find((entry) => Number.isFinite(Number(entry?.price)))?.price : undefined;
          const price = Number(item.addPrice ?? item.price ?? firstTierPrice ?? 0);
          productsById.set(id, {
            id,
            code: String(item.itemNumber ?? item.code ?? id),
            name: htmlDecode(item.name),
            categoryId: String(category.id),
            categoryName: htmlDecode(category.name),
            status: "active",
            emenuSellable: true,
            price: Number.isFinite(price) ? price : 0,
            strikethroughPrice: Number.isFinite(Number(item.strikethroughPrice)) ? Number(item.strikethroughPrice) : null,
            sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : (itemIndex + 1) * 10,
          });
        }
        if (!categoriesById.has(String(category.id))) {
          categoriesById.set(String(category.id), {
            id: String(category.id),
            name: htmlDecode(category.name),
            sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : (categoryIndex + 1) * 10,
          });
        }
      });
      if (!productIds.length) return;
      categories.push({
        id: String(category.id),
        name: htmlDecode(category.name),
        sortOrder: Number.isFinite(category.sortOrder) ? category.sortOrder : (categoryIndex + 1) * 10,
        productIds,
      });
    });
    if (!categories.length) return;
    menuGroups.push({
      id: String(group.id),
      name: htmlDecode(group.name),
      sortOrder: Number.isFinite(group.sortOrder) ? group.sortOrder : (groupIndex + 1) * 10,
      categories,
    });
  });

  const products = [...productsById.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const categories = [...categoriesById.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const fingerprintBasis = {
    sourceMenuVersion,
    menu: menuGroups.map((group) => ({
      id: group.id,
      name: group.name,
      categories: group.categories.map((category) => ({
        id: category.id,
        name: category.name,
        productIds: [...category.productIds],
      })),
    })),
    products: products.map((product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      status: product.status,
      emenuSellable: product.emenuSellable,
      price: product.price,
      strikethroughPrice: product.strikethroughPrice,
    })),
  };
  const fingerprint = sourceMenuVersion
    ? `kpos:${sourceMenuVersion}`
    : crypto.createHash("sha256").update(JSON.stringify(fingerprintBasis)).digest("hex");

  return { menuGroups, products, categories, sourceMenuVersion, fingerprint };
}

export function mapSeasoningViewToBrandMenuTree(view) {
  const productsById = new Map((view?.products ?? []).map((p) => [String(p.id), p]));
  return (view?.menuGroups ?? [])
    .map((group) => ({
      id: String(group.id),
      name: String(group.name ?? ""),
      categories: (group.categories ?? [])
        .map((category) => ({
          id: String(category.id),
          name: String(category.name ?? ""),
          dishes: (category.productIds ?? [])
            .map((id) => productsById.get(String(id)))
            .filter(Boolean)
            .map((product) => ({ id: String(product.id), name: String(product.name ?? "") })),
        }))
        .filter((category) => category.dishes.length > 0),
    }))
    .filter((group) => group.categories.length > 0);
}
