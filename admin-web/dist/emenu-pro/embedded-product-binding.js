/**
 * eMenu Pro 嵌入态：商品组件批量绑定
 * 在「删除菜单」左侧提供商品与组件批量绑定入口，弹窗内左菜品 / 右组件批量绑定。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var MODAL_ID = "emenu-batch-binding-modal";
  var BATCH_BTN_ID = "emenu-batch-binding-trigger";
  var COMPONENT_PRODUCTS_MODAL_ID = "emenu-component-products-modal";
  var COMPONENT_PRODUCTS_BTN_ID = "emenu-component-products-trigger";
  var NANOID_CHARS = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

  var PRODUCT_COMPONENT_TYPES = [
    "AddToCartImageBtn",
    "SoldOutImage",
    "DishName",
    "SalePrice",
    "MemberPrice",
  ];

  var COMPONENT_META = {
    AddToCartImageBtn: { label: "加购", icon: "addToCart" },
    SoldOutImage: { label: "售罄", icon: "soldOut" },
    DishName: { label: "菜品名称", icon: "dishName" },
    SalePrice: { label: "销售价", icon: "salePrice" },
    MemberPrice: { label: "会员价", icon: "memberPrice" },
  };

  var STACK_ORDER = ["DishName", "SalePrice", "MemberPrice", "AddToCartImageBtn"];
  var STACK_GAP = 12;

  var BLOCK_LIBRARY = {
    AddToCartImageBtn: {
      component: "AddToCartImageBtn",
      style: { width: 40, height: 40, minWidth: 20, minHeight: 20 },
      props: {
        imgUrl: "",
        defaultImg: "/images/addToCart.png",
        visible: { value: true },
        events: [{ event: "onClick", trigger: "click", actions: [{ type: "addToCart" }] }],
      },
    },
    SoldOutImage: {
      component: "SoldOutImage",
      style: { width: 140, height: 140, minWidth: 20, minHeight: 20 },
      props: {
        imgUrl: "",
        defaultImg: "/images/soldOut.png",
        visible: { rules: [{ field: "outOfStock", operator: "===", value: true }] },
      },
    },
    DishName: {
      component: "DishName",
      style: {
        width: 200,
        height: 60,
        fontSize: 20,
        lineHeight: 1.2,
        overflow: "hidden",
        color: "#AE7B4C",
      },
      props: { imgUrl: "", visible: { value: true } },
    },
    SalePrice: {
      component: "SalePrice",
      style: {
        width: 100,
        height: 24,
        fontSize: 20,
        lineHeight: 1.2,
        color: "#AE7B4C",
        overflow: "hidden",
      },
      props: { itemId: "", defaultText: "$-.--", visible: { value: true } },
    },
    MemberPrice: {
      component: "MemberPrice",
      style: {
        width: 116,
        height: 28,
        lineHeight: 1.2,
        paddingLeft: 8,
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderRadius: "100vh",
        whiteSpace: "nowrap",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        overflow: "hidden",
      },
      props: { imgUrl: "", visible: { value: true } },
      children: [
        {
          component: "MemberPriceIcon",
          style: { width: 20, height: 20 },
          props: { defaultImg: "/images/memberPriceIcon.png", visible: { value: true } },
        },
        {
          component: "MemberPriceValue",
          style: { fontSize: 20, color: "#AE7B4C" },
          props: { defaultText: "$-.--", visible: { value: true } },
        },
      ],
    },
  };

  var state = {
    open: false,
    selectedDish: null,
    selectedTypes: {},
    booted: false,
    store: null,
    unsubscribe: null,
    componentToProducts: {
      open: false,
      selectedType: null,
      selectedProductIds: [],
      pageId: null,
      categoryKey: null,
    },
  };

  function generateId(length) {
    var size = length == null ? 21 : length;
    var out = "";
    var bytes = crypto.getRandomValues(new Uint8Array(size));
    while (size--) {
      out += NANOID_CHARS[bytes[size] & 63];
    }
    return out;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function iconUrl(name) {
    return new URL("./images/" + name + ".svg?v=2", window.location.href).href;
  }

  function findReduxStore() {
    if (state.store) return state.store;
    var root = document.getElementById("root");
    if (!root) return null;

    var fiberKey = Object.keys(root).find(function (key) {
      return key.indexOf("__reactContainer") === 0 || key.indexOf("__reactFiber") === 0;
    });
    if (!fiberKey) return null;

    function walk(fiber) {
      if (!fiber) return null;
      var props = fiber.memoizedProps;
      if (props && props.store && typeof props.store.getState === "function" && typeof props.store.dispatch === "function") {
        return props.store;
      }
      return walk(fiber.child) || walk(fiber.sibling);
    }

    var store = walk(root[fiberKey]);
    if (store) state.store = store;
    return store;
  }

  function getPaletteState() {
    var store = findReduxStore();
    if (!store) return null;
    return store.getState().paletteSlice || null;
  }

  function getMenuState() {
    var store = findReduxStore();
    if (!store) return null;
    var menus = store.getState().menuSlice && store.getState().menuSlice.menus;
    return menus && menus.length ? menus[0] : null;
  }

  function getCurrentPageData() {
    var palette = getPaletteState();
    return palette && palette.currentPageData ? palette.currentPageData : null;
  }

  function getCurrentPageCategoryKey() {
    var page = getCurrentPageData();
    if (!page || page.groupId == null || page.categoryId == null) return null;
    return String(page.groupId) + "-" + String(page.categoryId);
  }

  function getCurrentCategoryInfo() {
    var categoryKey = getCurrentPageCategoryKey();
    if (!categoryKey) return null;
    var parts = categoryKey.split("-");
    var groupId = Number(parts[0]);
    var categoryId = Number(parts[1]);
    var menu = getMenuState();
    if (!menu || !menu.menuGroups) return null;

    var group = menu.menuGroups.find(function (g) {
      return Number(g.id) === groupId;
    });
    if (!group) return null;

    var category = (group.menuCategories || []).find(function (c) {
      return Number(c.id) === categoryId;
    });
    if (!category) return null;

    return {
      key: categoryKey,
      groupId: group.id,
      groupName: group.name,
      categoryId: category.id,
      categoryName: category.name,
    };
  }

  function dispatchPalette(type, payload) {
    var store = findReduxStore();
    if (!store) return false;
    store.dispatch({ type: "paletteSlice/" + type, payload: payload });
    return true;
  }

  function showToast(message, tone) {
    var existing = document.querySelector(".emenu-binding-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "emenu-binding-toast" + (tone === "error" ? " is-error" : "");
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        toast.remove();
      }, 220);
    }, 2400);
  }

  function parseNumber(value, fallback) {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      var parsed = parseInt(value.replace(/\D+/g, ""), 10);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  function findSaleItemById(itemId) {
    var menu = getMenuState();
    if (!menu || !menu.menuGroups) return null;
    var targetId = Number(itemId);
    for (var gi = 0; gi < menu.menuGroups.length; gi++) {
      var group = menu.menuGroups[gi];
      var categories = group.menuCategories || [];
      for (var ci = 0; ci < categories.length; ci++) {
        var category = categories[ci];
        var items = category.saleItems || [];
        for (var ii = 0; ii < items.length; ii++) {
          if (Number(items[ii].id) === targetId) {
            return {
              id: items[ii].id,
              name: items[ii].name,
              groupId: group.id,
              groupName: group.name,
              categoryId: category.id,
              categoryName: category.name,
            };
          }
        }
      }
    }
    return null;
  }

  function getSaleItemsForCategory(categoryKey) {
    if (!categoryKey || categoryKey.indexOf("-") < 0) return [];
    var parts = categoryKey.split("-");
    var groupId = Number(parts[0]);
    var categoryId = Number(parts[1]);
    var menu = getMenuState();
    if (!menu || !menu.menuGroups) return [];

    var group = menu.menuGroups.find(function (g) {
      return Number(g.id) === groupId;
    });
    if (!group) return [];

    var category = (group.menuCategories || []).find(function (c) {
      return Number(c.id) === categoryId;
    });
    if (!category) return [];

    return (category.saleItems || []).map(function (item) {
      return {
        id: item.id,
        name: item.name,
        groupId: group.id,
        groupName: group.name,
        categoryId: category.id,
        categoryName: category.name,
      };
    });
  }

  function getPageChildren(pageData) {
    if (!pageData || !Array.isArray(pageData.children)) return [];
    return pageData.children;
  }

  function getBindingRows(pageData, dishId) {
    var dishKey = dishId == null ? null : String(dishId);

    return PRODUCT_COMPONENT_TYPES.map(function (type) {
      var instances = findExactBindingInstances(pageData, type, dishKey);

      return {
        type: type,
        instances: instances,
        instance: instances[0] || null,
        status: instances.length ? "bound" : "missing",
        boundItemId: dishKey,
      };
    });
  }

  function findExactBindingInstances(pageData, componentType, itemId) {
    var itemKey = itemId == null ? null : String(itemId);
    if (!itemKey) return [];
    return getPageChildren(pageData).filter(function (block) {
      return (
        block &&
        block.component === componentType &&
        block.props &&
        String(block.props.itemId) === itemKey
      );
    });
  }

  function toggleOrderedSelection(ids, id, checked) {
    var key = String(id);
    var next = ids.filter(function (value) {
      return String(value) !== key;
    });
    if (checked) next.push(key);
    return next;
  }

  function findOperationFooter() {
    return document.querySelector('[class*="operationFooter"]');
  }

  function findDeleteMenuButton() {
    var footer = findOperationFooter();
    if (!footer) return null;
    return footer.querySelector('[class*="operationDel"]');
  }

  function isPageActionsDisabled() {
    var deleteBtn = findDeleteMenuButton();
    return !!(deleteBtn && deleteBtn.disabled);
  }

  function canUseBatchBinding() {
    var page = getCurrentPageData();
    return !!(page && page.id && getCurrentPageCategoryKey());
  }

  function ensureBatchButton() {
    var footer = findOperationFooter();
    var deleteBtn = findDeleteMenuButton();
    if (!footer || !deleteBtn) return null;

    var existing = document.getElementById(BATCH_BTN_ID);
    if (existing) {
      updateBatchButtonState(existing);
      ensureComponentProductsButton();
      return existing;
    }

    var btn = document.createElement("button");
    btn.id = BATCH_BTN_ID;
    btn.type = "button";
    btn.className = "emenu-batch-binding-trigger ant-btn ant-btn-default";
    btn.textContent = "商品绑定批量组件";
    btn.addEventListener("click", function () {
      openModal();
    });

    footer.insertBefore(btn, deleteBtn);
    updateBatchButtonState(btn);
    ensureComponentProductsButton();
    return btn;
  }

  function ensureComponentProductsButton() {
    var footer = findOperationFooter();
    var existingBatchButton = document.getElementById(BATCH_BTN_ID);
    if (!footer || !existingBatchButton) return null;

    var existing = document.getElementById(COMPONENT_PRODUCTS_BTN_ID);
    if (existing) {
      updateComponentProductsButtonState(existing);
      return existing;
    }

    var btn = document.createElement("button");
    btn.id = COMPONENT_PRODUCTS_BTN_ID;
    btn.type = "button";
    btn.className = "emenu-batch-binding-trigger ant-btn ant-btn-default";
    btn.textContent = "组件绑定批量商品";
    btn.addEventListener("click", openComponentProductsModal);
    footer.insertBefore(btn, existingBatchButton);
    updateComponentProductsButtonState(btn);
    return btn;
  }

  function updateBatchButtonState(btn) {
    if (!btn) btn = document.getElementById(BATCH_BTN_ID);
    if (!btn) return;
    var disabled = isPageActionsDisabled() || !canUseBatchBinding();
    btn.disabled = disabled;
    btn.classList.toggle("is-disabled", disabled);
    btn.title = disabled
      ? isPageActionsDisabled()
        ? "模板已发布，无法修改"
        : "请先选中当前菜单页"
      : "为当前页批量添加并绑定商品组件";
  }

  function updateComponentProductsButtonState(btn) {
    if (!btn) btn = document.getElementById(COMPONENT_PRODUCTS_BTN_ID);
    if (!btn) return;
    var disabled = isPageActionsDisabled() || !canUseBatchBinding();
    btn.disabled = disabled;
    btn.classList.toggle("is-disabled", disabled);
    btn.title = disabled
      ? isPageActionsDisabled()
        ? "模板已发布，无法修改"
        : "请先选中当前菜单页"
      : "为多个商品分别添加同一种组件";
  }

  function ensureModal() {
    var existing = document.getElementById(MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "emenu-batch-binding-modal hidden";
    modal.innerHTML =
      '<div class="emenu-batch-binding-mask" data-batch-close></div>' +
      '<div class="emenu-batch-binding-dialog" role="dialog" aria-modal="true" aria-labelledby="emenu-batch-binding-title">' +
      '  <header class="emenu-batch-binding-dialog-header">' +
      '    <div>' +
      '      <h2 id="emenu-batch-binding-title" class="emenu-batch-binding-dialog-title">商品绑定批量组件</h2>' +
      '      <p class="emenu-batch-binding-dialog-subtitle" data-batch-category>当前分类</p>' +
      "    </div>" +
      '    <button type="button" class="emenu-batch-binding-close" data-batch-close aria-label="关闭">×</button>' +
      "  </header>" +
      '  <div class="emenu-batch-binding-body">' +
      '    <aside class="emenu-batch-binding-dishes">' +
      '      <div class="emenu-batch-binding-pane-title">菜品</div>' +
      '      <div class="emenu-batch-binding-dish-list" data-batch-dish-list></div>' +
      '      <p class="emenu-batch-binding-empty" data-batch-dish-empty hidden>当前分类暂无菜品</p>' +
      "    </aside>" +
      '    <section class="emenu-batch-binding-components">' +
      '      <div class="emenu-batch-binding-pane-title" data-batch-component-title>请选择左侧菜品</div>' +
      '      <div class="emenu-batch-binding-component-toolbar hidden" data-batch-toolbar>' +
      '        <button type="button" class="emenu-binding-link-btn" data-batch-select-all>全选</button>' +
      '        <button type="button" class="emenu-binding-link-btn" data-batch-select-missing>仅选未添加</button>' +
      "      </div>" +
      '      <div class="emenu-batch-binding-component-list" data-batch-component-list></div>' +
      '      <div class="emenu-batch-binding-placeholder" data-batch-placeholder>选择菜品后，可在此多选商品组件并添加到当前页。</div>' +
      "    </section>" +
      "  </div>" +
      '  <footer class="emenu-batch-binding-dialog-footer">' +
      '    <button type="button" class="emenu-binding-secondary-btn" data-batch-close>取 消</button>' +
      '    <button type="button" class="emenu-binding-secondary-btn" data-batch-remove disabled>从当前页移除</button>' +
      '    <button type="button" class="emenu-binding-primary-btn" data-batch-add disabled>添加到当前页</button>' +
      "  </footer>" +
      "</div>";

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-batch-close]")) {
        closeModal();
        return;
      }
      if (event.target.closest("[data-batch-select-all]")) {
        selectAllComponents(true);
        return;
      }
      if (event.target.closest("[data-batch-select-missing]")) {
        selectMissingComponents();
        return;
      }
      if (event.target.closest("[data-batch-add]")) {
        batchAddComponents();
        return;
      }
      if (event.target.closest("[data-batch-remove]")) {
        batchRemoveComponents();
        return;
      }
      var dishItem = event.target.closest("[data-dish-id]");
      if (dishItem) {
        selectDish(Number(dishItem.getAttribute("data-dish-id")));
      }
    });

    modal.addEventListener("change", function (event) {
      if (event.target.matches("[data-component-checkbox]")) {
        var type = event.target.getAttribute("data-component-checkbox");
        state.selectedTypes[type] = event.target.checked;
        updateModalActions();
      }
    });

    document.body.appendChild(modal);
    return modal;
  }

  function openModal() {
    if (!canUseBatchBinding()) {
      showToast("请先选中当前菜单页", "error");
      return;
    }
    if (isPageActionsDisabled()) {
      showToast("模板已发布，无法修改", "error");
      return;
    }

    state.open = true;
    state.selectedDish = null;
    state.selectedTypes = {};

    var modal = ensureModal();
    modal.classList.remove("hidden");
    document.body.classList.add("emenu-batch-binding-open");
    renderModal();
  }

  function closeModal() {
    state.open = false;
    var modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add("hidden");
    document.body.classList.remove("emenu-batch-binding-open");
  }

  function selectDish(dishId) {
    var dish = findSaleItemById(dishId);
    if (!dish) return;
    state.selectedDish = dish;
    state.selectedTypes = {};
    renderModal();
  }

  function renderModal() {
    if (!state.open) return;

    var modal = ensureModal();
    var category = getCurrentCategoryInfo();
    var categoryEl = modal.querySelector("[data-batch-category]");
    var dishListEl = modal.querySelector("[data-batch-dish-list]");
    var dishEmptyEl = modal.querySelector("[data-batch-dish-empty]");
    var componentTitleEl = modal.querySelector("[data-batch-component-title]");
    var toolbarEl = modal.querySelector("[data-batch-toolbar]");
    var listEl = modal.querySelector("[data-batch-component-list]");
    var placeholderEl = modal.querySelector("[data-batch-placeholder]");

    if (categoryEl) {
      categoryEl.textContent = category
        ? category.groupName + " › " + category.categoryName + "（当前菜单页）"
        : "当前菜单页";
    }

    var dishes = getSaleItemsForCategory(category && category.key);
    if (dishListEl) {
      dishListEl.innerHTML = "";
      dishes.forEach(function (dish) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "emenu-product-dish-item";
        btn.setAttribute("data-dish-id", String(dish.id));
        if (state.selectedDish && Number(state.selectedDish.id) === Number(dish.id)) {
          btn.classList.add("is-selected");
        }
        btn.textContent = dish.name;
        dishListEl.appendChild(btn);
      });
    }
    if (dishEmptyEl) dishEmptyEl.hidden = dishes.length > 0;

    if (!state.selectedDish) {
      if (componentTitleEl) componentTitleEl.textContent = "请选择左侧菜品";
      if (toolbarEl) toolbarEl.classList.add("hidden");
      if (listEl) listEl.innerHTML = "";
      if (placeholderEl) placeholderEl.classList.remove("hidden");
      updateModalActions();
      return;
    }

    if (componentTitleEl) {
      componentTitleEl.textContent = state.selectedDish.name;
    }
    if (toolbarEl) toolbarEl.classList.remove("hidden");
    if (placeholderEl) placeholderEl.classList.add("hidden");

    var pageData = getCurrentPageData();
    var rows = getBindingRows(pageData, state.selectedDish.id);
    if (!listEl) return;
    listEl.innerHTML = "";

    rows.forEach(function (row) {
      var meta = COMPONENT_META[row.type];
      var item = document.createElement("label");
      item.className = "emenu-product-binding-row";
      item.setAttribute("data-component-type", row.type);

      var checked = !!state.selectedTypes[row.type];
      if (!Object.prototype.hasOwnProperty.call(state.selectedTypes, row.type)) {
        checked = row.status === "missing";
      }

      var statusLabel = "未添加";
      var statusClass = "is-missing";
      if (row.status === "bound") {
        statusLabel = "已在画布";
        statusClass = "is-bound";
      } else if (row.status === "conflict") {
        var other = findSaleItemById(row.boundItemId);
        statusLabel = "已绑：" + (other ? other.name : row.boundItemId);
        statusClass = "is-conflict";
      } else if (row.status === "unbound") {
        statusLabel = "待绑定";
        statusClass = "is-unbound";
      }

      item.innerHTML =
        '<input type="checkbox" class="emenu-product-binding-checkbox" data-component-checkbox="' +
        row.type +
        '" ' +
        (checked ? "checked" : "") +
        " />" +
        '<span class="emenu-icon-circle-wrap emenu-product-binding-row-icon-wrap">' +
        '<img class="emenu-product-binding-row-icon" alt="" src="' +
        iconUrl(meta.icon) +
        '" /></span>' +
        '<span class="emenu-product-binding-row-label">' +
        meta.label +
        "</span>" +
        '<span class="emenu-product-binding-row-status ' +
        statusClass +
        '">' +
        statusLabel +
        "</span>";

      listEl.appendChild(item);
      state.selectedTypes[row.type] = checked;
    });

    updateModalActions();
  }

  function updateModalActions() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    var selectedToAdd = PRODUCT_COMPONENT_TYPES.filter(function (type) {
      return !!state.selectedTypes[type];
    });

    var addBtn = modal.querySelector("[data-batch-add]");
    var removeBtn = modal.querySelector("[data-batch-remove]");

    if (addBtn) {
      var canAdd = !!(state.selectedDish && selectedToAdd.length);
      addBtn.disabled = !canAdd;
      addBtn.textContent = selectedToAdd.length
        ? "添加到当前页 (" + selectedToAdd.length + ")"
        : "添加到当前页";
    }

    if (removeBtn) {
      var removable = state.selectedDish
        ? getBindingRows(getCurrentPageData(), state.selectedDish.id).filter(function (row) {
            return state.selectedTypes[row.type] && row.status === "bound";
          })
        : [];
      removeBtn.disabled = !removable.length;
    }
  }

  function selectAllComponents(checked) {
    PRODUCT_COMPONENT_TYPES.forEach(function (type) {
      state.selectedTypes[type] = checked;
    });
    renderModal();
  }

  function selectMissingComponents() {
    var rows = getBindingRows(getCurrentPageData(), state.selectedDish && state.selectedDish.id);
    rows.forEach(function (row) {
      state.selectedTypes[row.type] = row.status === "missing";
    });
    renderModal();
  }

  function createBlockInstance(def, position, itemId) {
    function cloneNode(node) {
      var cloned = cloneJson(node);
      cloned.id = generateId();
      if (Array.isArray(node.children)) {
        cloned.children = node.children.map(cloneNode);
      }
      return cloned;
    }

    var instance = cloneNode(def);
    instance.style = Object.assign({}, instance.style, {
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: position.zIndex == null ? 1 : position.zIndex,
      });
    instance.props = Object.assign({}, instance.props, { itemId: String(itemId) });

    return instance;
  }

  function computeVerticalProductPositions(componentType, count, palette) {
    var def = BLOCK_LIBRARY[componentType];
    var width = parseNumber(def && def.style && def.style.width, 100);
    var height = parseNumber(def && def.style && def.style.height, 40);
    var viewportWidth = parseNumber(palette && palette.viewportWidth, 1280);
    var viewportHeight = parseNumber(palette && palette.viewportHeight, 800);
    var baseX = Math.round(viewportWidth * 0.5 - width / 2);
    var baseY = Math.round(viewportHeight * 0.42);
    return Array.from({ length: count }, function (_, index) {
      return { top: baseY + index * (height + STACK_GAP), left: baseX, zIndex: 2 };
    });
  }

  function computeLayoutPositions(types, palette) {
    var viewportWidth = parseNumber(palette.viewportWidth, 1280);
    var viewportHeight = parseNumber(palette.viewportHeight, 800);
    var baseX = Math.round(viewportWidth * 0.5);
    var baseY = Math.round(viewportHeight * 0.42);
    var positions = {};
    var cursorY = baseY;

    STACK_ORDER.forEach(function (type) {
      if (types.indexOf(type) < 0) return;
      var def = BLOCK_LIBRARY[type];
      var width = parseNumber(def.style.width, 100);
      var height = parseNumber(def.style.height, 40);
      positions[type] = {
        top: cursorY,
        left: Math.round(baseX - width / 2),
        zIndex: 2,
      };
      cursorY += height + STACK_GAP;
    });

    if (types.indexOf("SoldOutImage") >= 0) {
      positions.SoldOutImage = {
        top: Math.max(20, baseY - 24),
        left: Math.round(baseX + 80),
        zIndex: 4,
      };
    }

    return positions;
  }

  function batchAddComponents() {
    var palette = getPaletteState();
    if (!palette || !palette.currentPageData || !palette.currentPageData.id) {
      showToast("请先选择页面", "error");
      return;
    }
    if (!state.selectedDish) {
      showToast("请先选择菜品", "error");
      return;
    }

    var types = PRODUCT_COMPONENT_TYPES.filter(function (type) {
      return !!state.selectedTypes[type];
    });
    if (!types.length) return;

    var pageData = cloneJson(palette.currentPageData);
    var children = getPageChildren(pageData);
    var rows = getBindingRows(pageData, state.selectedDish.id);
    var positions = computeLayoutPositions(types, palette);
    var created = 0;
    var skipped = 0;

    types.forEach(function (type) {
      var row = rows.find(function (entry) {
        return entry.type === type;
      });
      if (!row) return;

      if (row.status === "bound") {
        skipped += 1;
        return;
      }

      var def = BLOCK_LIBRARY[type];
      if (!def) return;
      var pos = positions[type] || { top: 120, left: 120, zIndex: 2 };
      children.push(createBlockInstance(def, pos, state.selectedDish.id));
      created += 1;
    });

    if (!created) {
      showToast(skipped ? "所选组件均已在当前页绑定" : "没有可添加的组件", "error");
      return;
    }

    var nextPage = Object.assign({}, pageData, { children: children });
    dispatchPalette("setCurrentPageData", nextPage);
    dispatchPalette("syncPageDataToGroup");
    dispatchPalette("setCurrentBlock", {});

    var message = "已添加 " + created + " 个组件";
    showToast(message);
    closeModal();
  }

  function batchRemoveComponents() {
    var palette = getPaletteState();
    if (!palette || !palette.currentPageData || !state.selectedDish) return;

    var pageData = palette.currentPageData;
    var rows = getBindingRows(pageData, state.selectedDish.id);
    var removeIds = rows
      .filter(function (row) {
        return state.selectedTypes[row.type] && row.status === "bound";
      })
      .reduce(function (ids, row) {
        return ids.concat(row.instances.map(function (instance) { return instance.id; }));
      }, []);

    if (!removeIds.length) return;
    if (!window.confirm("确定从当前页移除选中的 " + removeIds.length + " 个组件吗？")) return;

    var children = getPageChildren(pageData).filter(function (block) {
      return removeIds.indexOf(block.id) < 0;
    });

    dispatchPalette("setCurrentPageData", Object.assign({}, pageData, { children: children }));
    dispatchPalette("syncPageDataToGroup");
    dispatchPalette("setCurrentBlock", {});
    showToast("已移除 " + removeIds.length + " 个组件");
    renderModal();
  }

  function ensureComponentProductsModal() {
    var existing = document.getElementById(COMPONENT_PRODUCTS_MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement("div");
    modal.id = COMPONENT_PRODUCTS_MODAL_ID;
    modal.className = "emenu-batch-binding-modal emenu-component-products-modal hidden";
    modal.innerHTML =
      '<div class="emenu-batch-binding-mask" data-component-products-close></div>' +
      '<div class="emenu-batch-binding-dialog" role="dialog" aria-modal="true" aria-labelledby="emenu-component-products-title">' +
      '  <header class="emenu-batch-binding-dialog-header"><div>' +
      '    <h2 id="emenu-component-products-title" class="emenu-batch-binding-dialog-title">组件绑定批量商品</h2>' +
      '    <p class="emenu-batch-binding-dialog-subtitle" data-component-products-category>当前分类</p>' +
      '  </div><button type="button" class="emenu-batch-binding-close" data-component-products-close aria-label="关闭">×</button></header>' +
      '  <div class="emenu-batch-binding-body emenu-component-products-body">' +
      '    <aside class="emenu-component-products-pane"><div class="emenu-batch-binding-pane-title">商品组件（单选）</div>' +
      '      <div class="emenu-component-products-type-list" data-component-products-type-list></div></aside>' +
      '    <section class="emenu-component-products-pane"><div class="emenu-batch-binding-pane-title">商品（多选）</div>' +
      '      <div class="emenu-component-products-item-list" data-component-products-item-list></div>' +
      '      <p class="emenu-batch-binding-empty" data-component-products-empty hidden>当前分类暂无商品</p></section>' +
      '  </div><footer class="emenu-batch-binding-dialog-footer">' +
      '    <button type="button" class="emenu-binding-secondary-btn" data-component-products-close>取 消</button>' +
      '    <button type="button" class="emenu-binding-primary-btn" data-component-products-add disabled>添加到当前页</button>' +
      '  </footer></div>';

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-component-products-close]")) {
        closeComponentProductsModal();
      } else if (event.target.closest("[data-component-products-add]")) {
        addComponentForProducts();
      }
    });
    modal.addEventListener("change", function (event) {
      if (event.target.matches("[data-component-products-type]")) {
        state.componentToProducts.selectedType = event.target.value;
        state.componentToProducts.selectedProductIds = [];
        renderComponentProductsModal();
      } else if (event.target.matches("[data-component-products-item]")) {
        state.componentToProducts.selectedProductIds = toggleOrderedSelection(
          state.componentToProducts.selectedProductIds,
          event.target.value,
          event.target.checked,
        );
        renderComponentProductsModal();
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openComponentProductsModal() {
    if (!canUseBatchBinding()) {
      showToast("请先选中当前菜单页", "error");
      return;
    }
    if (isPageActionsDisabled()) {
      showToast("模板已发布，无法修改", "error");
      return;
    }
    var page = getCurrentPageData();
    var bindingState = state.componentToProducts;
    bindingState.open = true;
    bindingState.selectedType = null;
    bindingState.selectedProductIds = [];
    bindingState.pageId = String(page.id);
    bindingState.categoryKey = getCurrentPageCategoryKey();
    ensureComponentProductsModal().classList.remove("hidden");
    document.body.classList.add("emenu-batch-binding-open");
    renderComponentProductsModal();
  }

  function closeComponentProductsModal() {
    state.componentToProducts.open = false;
    var modal = document.getElementById(COMPONENT_PRODUCTS_MODAL_ID);
    if (modal) modal.classList.add("hidden");
    if (!state.open) document.body.classList.remove("emenu-batch-binding-open");
  }

  function syncComponentProductsContext() {
    var bindingState = state.componentToProducts;
    var page = getCurrentPageData();
    var pageId = page && page.id != null ? String(page.id) : null;
    var categoryKey = getCurrentPageCategoryKey();
    if (bindingState.pageId === pageId && bindingState.categoryKey === categoryKey) return false;
    bindingState.pageId = pageId;
    bindingState.categoryKey = categoryKey;
    bindingState.selectedType = null;
    bindingState.selectedProductIds = [];
    return true;
  }

  function renderComponentProductsModal() {
    var bindingState = state.componentToProducts;
    if (!bindingState.open) return;
    syncComponentProductsContext();
    var modal = ensureComponentProductsModal();
    var category = getCurrentCategoryInfo();
    var pageData = getCurrentPageData();
    var products = getSaleItemsForCategory(category && category.key);
    var categoryEl = modal.querySelector("[data-component-products-category]");
    var typeList = modal.querySelector("[data-component-products-type-list]");
    var itemList = modal.querySelector("[data-component-products-item-list]");
    var empty = modal.querySelector("[data-component-products-empty]");
    var addButton = modal.querySelector("[data-component-products-add]");

    categoryEl.textContent = category ? category.groupName + " › " + category.categoryName + "（当前菜单页）" : "当前菜单页";
    typeList.innerHTML = "";
    PRODUCT_COMPONENT_TYPES.forEach(function (type) {
      var meta = COMPONENT_META[type];
      var row = document.createElement("label");
      row.className = "emenu-component-products-row";
      row.innerHTML =
        '<input type="radio" name="emenu-component-products-type" data-component-products-type value="' + type + '" ' +
        (bindingState.selectedType === type ? "checked" : "") + " />" +
        '<span class="emenu-icon-circle-wrap"><img class="emenu-product-binding-row-icon" alt="" src="' + iconUrl(meta.icon) + '" /></span>' +
        '<span class="emenu-product-binding-row-label">' + meta.label + "</span>";
      typeList.appendChild(row);
    });

    itemList.innerHTML = "";
    products.forEach(function (product) {
      var productId = String(product.id);
      var bound = !!(bindingState.selectedType && findExactBindingInstances(pageData, bindingState.selectedType, productId).length);
      var selected = bindingState.selectedProductIds.indexOf(productId) >= 0;
      var row = document.createElement("label");
      row.className = "emenu-component-products-row" + (bound ? " is-bound" : "");
      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = productId;
      checkbox.checked = selected;
      checkbox.disabled = bound || !bindingState.selectedType;
      checkbox.setAttribute("data-component-products-item", "");
      var name = document.createElement("span");
      name.className = "emenu-component-products-product-name";
      name.textContent = product.name;
      var status = document.createElement("span");
      status.className = "emenu-product-binding-row-status" + (bound ? " is-bound" : "");
      status.textContent = bound ? "已在画布" : "";
      row.appendChild(checkbox);
      row.appendChild(document.createElement("span"));
      row.appendChild(name);
      row.appendChild(status);
      itemList.appendChild(row);
    });
    empty.hidden = products.length > 0;
    addButton.disabled = !(bindingState.selectedType && bindingState.selectedProductIds.length);
    addButton.textContent = bindingState.selectedProductIds.length
      ? "添加到当前页 (" + bindingState.selectedProductIds.length + ")"
      : "添加到当前页";
  }

  function addComponentForProducts() {
    var bindingState = state.componentToProducts;
    var palette = getPaletteState();
    var page = palette && palette.currentPageData;
    var categoryKey = getCurrentPageCategoryKey();
    if (isPageActionsDisabled()) {
      closeComponentProductsModal();
      showToast("模板已发布，无法修改", "error");
      return;
    }
    if (!page || !page.id || !categoryKey) {
      showToast("当前页面或分类数据不可用", "error");
      return;
    }
    if (String(page.id) !== bindingState.pageId || categoryKey !== bindingState.categoryKey) {
      syncComponentProductsContext();
      renderComponentProductsModal();
      showToast("页面或分类已切换，请重新选择", "error");
      return;
    }
    var type = bindingState.selectedType;
    var def = BLOCK_LIBRARY[type];
    if (!def) return;
    var currentIds = getSaleItemsForCategory(categoryKey).map(function (product) { return String(product.id); });
    var selectedIds = bindingState.selectedProductIds.filter(function (id) { return currentIds.indexOf(String(id)) >= 0; });
    var pendingIds = [];
    var skipped = 0;
    selectedIds.forEach(function (id) {
      if (findExactBindingInstances(page, type, id).length) skipped += 1;
      else pendingIds.push(String(id));
    });
    if (!pendingIds.length) {
      bindingState.selectedProductIds = [];
      renderComponentProductsModal();
      showToast(selectedIds.length ? "所选商品均已绑定" : "请选择当前分类中的商品", "error");
      return;
    }
    var positions = computeVerticalProductPositions(type, pendingIds.length, palette);
    var nextChildren = getPageChildren(page).slice();
    pendingIds.forEach(function (id, index) {
      nextChildren.push(createBlockInstance(def, positions[index], id));
    });
    dispatchPalette("setCurrentPageData", Object.assign({}, page, { children: nextChildren }));
    dispatchPalette("syncPageDataToGroup");
    dispatchPalette("setCurrentBlock", {});
    bindingState.selectedProductIds = [];
    renderComponentProductsModal();
    var message = "已为 " + pendingIds.length + " 个商品添加〈" + COMPONENT_META[type].label + "〉";
    if (skipped) message += "，跳过 " + skipped + " 个已绑定商品";
    showToast(message);
  }

  function refreshUi() {
    ensureBatchButton();
    updateBatchButtonState();
    updateComponentProductsButtonState();
    if (isPageActionsDisabled()) {
      if (state.open) closeModal();
      if (state.componentToProducts.open) closeComponentProductsModal();
    }
    if (state.open) renderModal();
    if (state.componentToProducts.open) renderComponentProductsModal();
  }

  function bindStore() {
    var store = findReduxStore();
    if (!store || state.unsubscribe) return;
    state.unsubscribe = store.subscribe(function () {
      refreshUi();
    });
  }

  function cleanupLegacyUi() {
    ["emenu-product-dish-list", "emenu-binding-mode-tabs", "emenu-product-binding-panel"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.remove();
    });
    var blockList = document.querySelector('[class*="blockList"]');
    if (blockList) blockList.classList.remove("hidden");
  }

  function boot() {
    if (state.booted) {
      refreshUi();
      return;
    }
    state.booted = true;
    cleanupLegacyUi();
    bindStore();

    var attempts = 0;
    function retry() {
      refreshUi();
      bindStore();
      attempts += 1;
      if (attempts < 30) {
        window.setTimeout(retry, 300);
      }
    }
    retry();
  }

  if (window.__EMENU_PRODUCT_BINDING_TEST_HOOKS__) {
    Object.assign(window.__EMENU_PRODUCT_BINDING_TEST_HOOKS__, {
      findExactBindingInstances: findExactBindingInstances,
      getBindingRows: getBindingRows,
      createBlockInstance: createBlockInstance,
      computeVerticalProductPositions: computeVerticalProductPositions,
      toggleOrderedSelection: toggleOrderedSelection,
      syncComponentProductsContext: syncComponentProductsContext,
      addComponentForProducts: addComponentForProducts,
      BLOCK_LIBRARY: BLOCK_LIBRARY,
      state: state,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
