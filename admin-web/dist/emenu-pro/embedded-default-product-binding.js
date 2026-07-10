/**
 * eMenu Pro 嵌入态：方案 B · 商品组件默认绑定
 * 在「页面组件 › 商品组件」提供商品下拉，拖拽落盘时自动写入 props.itemId。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var PANEL_CLASS = "emenu-default-product-binding";
  var BLOCK_LIST_ID = "block_list";
  var PRODUCT_COMPONENT_TYPES = [
    "AddToCartImageBtn",
    "SoldOutImage",
    "DishName",
    "SalePrice",
    "MemberPrice",
  ];

  var state = {
    booted: false,
    store: null,
    unsubscribe: null,
    categoryKey: null,
    defaultItemId: null,
    knownBlockIds: {},
    lastCurrentBlockId: null,
  };

  var bindingMemory = Object.create(null);

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
      if (props && props.store && typeof props.store.getState === "function") {
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
    return store && store.getState().paletteSlice ? store.getState().paletteSlice : null;
  }

  function getMenuState() {
    var store = findReduxStore();
    var menus = store && store.getState().menuSlice && store.getState().menuSlice.menus;
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
      return { id: item.id, name: item.name };
    });
  }

  function findSaleItemName(itemId) {
    if (!itemId) return "";
    var categoryKey = getCurrentPageCategoryKey();
    var dishes = getSaleItemsForCategory(categoryKey);
    var dish = dishes.find(function (d) {
      return String(d.id) === String(itemId);
    });
    return dish ? dish.name : "";
  }

  function dispatchPalette(type, payload) {
    var store = findReduxStore();
    if (!store) return false;
    store.dispatch({ type: "paletteSlice/" + type, payload: payload });
    return true;
  }

  function getPageChildren(pageData) {
    if (!pageData || !Array.isArray(pageData.children)) return [];
    return pageData.children;
  }

  function findDeleteMenuButton() {
    var footer = document.querySelector('[class*="operationFooter"]');
    if (!footer) return null;
    return footer.querySelector('[class*="operationDel"]');
  }

  function isPageActionsDisabled() {
    var deleteBtn = findDeleteMenuButton();
    return !!(deleteBtn && deleteBtn.disabled);
  }

  function canUseDefaultBinding() {
    var page = getCurrentPageData();
    return !!(page && page.id && getCurrentPageCategoryKey());
  }

  function isPageComponentBlockList(blockList) {
    if (!blockList) return false;
    if (blockList.querySelector("#blockItem-Home")) return false;
    return !!blockList.querySelector(
      "#blockItem-AddToCartImageBtn, #blockItem-Video, #blockItem-Carousel"
    );
  }

  function isProductSubTabActive(blockList) {
    if (!blockList) return false;
    return blockList.getAttribute("data-emenu-active-group") === "product";
  }

  function shouldShowPanel() {
    var blockList = document.getElementById(BLOCK_LIST_ID);
    return isPageComponentBlockList(blockList) && isProductSubTabActive(blockList);
  }

  function getBlockListParent() {
    var blockList = document.getElementById(BLOCK_LIST_ID);
    return blockList ? blockList.parentElement : null;
  }

  function repositionPanel(panel) {
    if (!panel) panel = document.querySelector("." + PANEL_CLASS);
    if (!panel) return null;

    var blockList = document.getElementById(BLOCK_LIST_ID);
    if (!blockList || !blockList.parentElement) return panel;

    var parent = blockList.parentElement;
    var tabs = parent.querySelector(":scope > .emenu-page-component-tabs");

    if (tabs) {
      if (panel.previousElementSibling !== tabs) {
        parent.insertBefore(panel, tabs.nextElementSibling || blockList);
      }
    } else if (panel.nextElementSibling !== blockList) {
      parent.insertBefore(panel, blockList);
    }

    return panel;
  }

  function ensurePanel() {
    var parent = getBlockListParent();
    if (!parent) return null;

    var panel = parent.querySelector("." + PANEL_CLASS);
    if (!panel) {
      panel = document.createElement("div");
      panel.className = PANEL_CLASS;
      panel.setAttribute("data-emenu-default-binding", "1");
      panel.innerHTML =
        '<label class="emenu-default-product-binding-label">默认绑定商品</label>' +
        '<select class="emenu-default-product-binding-select" data-default-product-select>' +
        '<option value="">不设置默认绑定</option>' +
        "</select>" +
        '<p class="emenu-default-product-binding-hint" data-default-product-hint></p>';

      panel.querySelector("[data-default-product-select]").addEventListener("change", onSelectChange);

      var blockList = document.getElementById(BLOCK_LIST_ID);
      if (blockList) {
        parent.insertBefore(panel, blockList);
      } else {
        parent.appendChild(panel);
      }
    }

    return repositionPanel(panel);
  }

  function onSelectChange(event) {
    var value = event.target.value;
    state.defaultItemId = value || null;
    if (state.categoryKey) {
      bindingMemory[state.categoryKey] = state.defaultItemId;
    }
    var select = event.target;
    if (select) delete select.dataset.renderSignature;
    updateHint();
  }

  function renderSelectOptions() {
    var panel = ensurePanel();
    if (!panel) return;

    var select = panel.querySelector("[data-default-product-select]");
    if (!select) return;

    var category = getCurrentCategoryInfo();
    var dishes = getSaleItemsForCategory(category && category.key);
    var currentValue = state.defaultItemId ? String(state.defaultItemId) : "";
    var signature =
      (category && category.key ? category.key : "") +
      "|" +
      dishes.map(function (d) { return d.id; }).join(",") +
      "|" +
      currentValue +
      "|" +
      String(isPageActionsDisabled() || !canUseDefaultBinding());

    if (select.dataset.renderSignature === signature) {
      updateHint();
      return;
    }
    select.dataset.renderSignature = signature;

    select.innerHTML = '<option value="">不设置默认绑定</option>';
    dishes.forEach(function (dish) {
      var option = document.createElement("option");
      option.value = String(dish.id);
      option.textContent = dish.name;
      select.appendChild(option);
    });

    if (currentValue && dishes.some(function (d) { return String(d.id) === currentValue; })) {
      select.value = currentValue;
    } else {
      select.value = "";
      if (currentValue) {
        state.defaultItemId = null;
        if (state.categoryKey) bindingMemory[state.categoryKey] = null;
      }
    }

    var disabled = isPageActionsDisabled() || !canUseDefaultBinding();
    select.disabled = disabled;
    panel.classList.toggle("is-disabled", disabled);
    updateHint();
  }

  function updateHint() {
    var panel = document.querySelector("." + PANEL_CLASS);
    if (!panel) return;

    var hint = panel.querySelector("[data-default-product-hint]");
    if (!hint) return;

    if (!canUseDefaultBinding()) {
      hint.textContent = isPageActionsDisabled()
        ? "模板已发布，无法修改"
        : "请先选择菜单页";
      return;
    }

    var category = getCurrentCategoryInfo();
    if (!category) {
      hint.textContent = "";
      return;
    }

    var prefix = category.groupName + " › " + category.categoryName + "（当前菜单页）";
    var dishes = getSaleItemsForCategory(category.key);
    if (!dishes.length) {
      hint.textContent = prefix + " · 当前分类暂无菜品";
      return;
    }

    if (state.defaultItemId) {
      var name = findSaleItemName(state.defaultItemId);
      hint.textContent = prefix + (name ? " · 已选：" + name : "");
      return;
    }

    hint.textContent = prefix;
  }

  function updatePanelVisibility() {
    var panel = document.querySelector("." + PANEL_CLASS);
    if (!panel) return;
    var visible = shouldShowPanel();
    panel.classList.toggle("hidden", !visible);
    panel.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  function watchActiveGroupChanges() {
    var blockList = document.getElementById(BLOCK_LIST_ID);
    if (!blockList || state.groupObserver) return;

    state.groupObserver = new MutationObserver(function () {
      updatePanelVisibility();
    });
    state.groupObserver.observe(blockList, {
      attributes: true,
      attributeFilter: ["data-emenu-active-group"],
    });
  }

  function seedKnownBlockIds(pageData) {
    state.knownBlockIds = Object.create(null);
    getPageChildren(pageData).forEach(function (block) {
      if (block && block.id) state.knownBlockIds[block.id] = true;
    });
  }

  function handleCategoryChange(categoryKey) {
    if (state.categoryKey === categoryKey) return;
    state.categoryKey = categoryKey;
    if (categoryKey && Object.prototype.hasOwnProperty.call(bindingMemory, categoryKey)) {
      state.defaultItemId = bindingMemory[categoryKey];
    } else {
      state.defaultItemId = null;
    }
    var select = document.querySelector("[data-default-product-select]");
    if (select) delete select.dataset.renderSignature;
    renderSelectOptions();
  }

  function shouldSuppressBindDishModal() {
    return !!(state.defaultItemId && canUseDefaultBinding() && !isPageActionsDisabled());
  }

  function isBindDishModalWrap(wrap) {
    if (!wrap) return false;
    var titleEl = wrap.querySelector(".ant-modal-title");
    var title = titleEl ? String(titleEl.textContent || "").trim() : "";
    return title.indexOf("绑定") >= 0 || /bind/i.test(title);
  }

  function dismissBindDishModal() {
    if (!shouldSuppressBindDishModal()) return false;

    var dismissed = false;
    var wraps = document.querySelectorAll(".ant-modal-root .ant-modal-wrap");
    for (var i = 0; i < wraps.length; i++) {
      var wrap = wraps[i];
      var style = window.getComputedStyle(wrap);
      if (style.display === "none" || style.visibility === "hidden") continue;
      if (!isBindDishModalWrap(wrap)) continue;

      var closeBtn = wrap.querySelector(".ant-modal-close");
      if (closeBtn) {
        closeBtn.click();
        dismissed = true;
        continue;
      }

      var buttons = wrap.querySelectorAll(".ant-modal-footer button, .ant-modal-confirm-btns button");
      for (var j = 0; j < buttons.length; j++) {
        var label = String(buttons[j].textContent || "").trim();
        if (label.indexOf("稍后") >= 0 || /later/i.test(label)) {
          buttons[j].click();
          dismissed = true;
          break;
        }
      }
    }
    return dismissed;
  }

  function suppressBindDishModalSoon() {
    if (!shouldSuppressBindDishModal()) return;

    tryAutoBindCurrentBlock();
    dismissBindDishModal();

    window.requestAnimationFrame(function () {
      tryAutoBindCurrentBlock();
      dismissBindDishModal();
    });

    window.setTimeout(function () {
      tryAutoBindCurrentBlock();
      dismissBindDishModal();
    }, 0);

    window.setTimeout(function () {
      dismissBindDishModal();
    }, 48);
  }

  function watchBindDishModal() {
    if (state.modalObserver) return;

    var root = document.querySelector(".ant-modal-root");
    if (!root) return;

    state.modalObserver = new MutationObserver(function () {
      if (!shouldSuppressBindDishModal()) return;
      if (dismissBindDishModal()) {
        tryAutoBindCurrentBlock();
      }
    });
    state.modalObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  }

  function tryAutoBindCurrentBlock() {
    if (!state.defaultItemId || isPageActionsDisabled() || !canUseDefaultBinding()) return;

    var palette = getPaletteState();
    if (!palette || !palette.currentBlock) return;

    var block = palette.currentBlock;
    if (!block.id || !block.component) return;
    if (PRODUCT_COMPONENT_TYPES.indexOf(block.component) < 0) return;

    if (state.knownBlockIds[block.id]) {
      state.lastCurrentBlockId = block.id;
      return;
    }

    var currentItemId = block.props && block.props.itemId;
    if (String(currentItemId) === String(state.defaultItemId)) {
      state.knownBlockIds[block.id] = true;
      state.lastCurrentBlockId = block.id;
      return;
    }

    state.knownBlockIds[block.id] = true;
    state.lastCurrentBlockId = block.id;
    dispatchPalette("editCurrentBlockProps", { itemId: String(state.defaultItemId) });
    suppressBindDishModalSoon();
  }

  function scheduleAutoBind() {
    window.clearTimeout(state.autoBindTimer);
    state.autoBindTimer = window.setTimeout(function () {
      tryAutoBindCurrentBlock();
      suppressBindDishModalSoon();
    }, 0);
  }

  function onStoreChange() {
    var palette = getPaletteState();
    if (!palette) return;

    var categoryKey = getCurrentPageCategoryKey();
    handleCategoryChange(categoryKey);

    var pageId = palette.currentPageData && palette.currentPageData.id;
    if (!pageId) {
      seedKnownBlockIds(null);
    } else if (!state._pageSeedId || state._pageSeedId !== pageId) {
      state._pageSeedId = pageId;
      seedKnownBlockIds(palette.currentPageData);
    }

    scheduleAutoBind();
    updatePanelVisibility();
    renderSelectOptions();
  }

  function refreshUi() {
    ensurePanel();
    updatePanelVisibility();
    renderSelectOptions();
  }

  function onDomChange() {
    ensurePanel();
    watchActiveGroupChanges();
    updatePanelVisibility();
  }

  function bindStore() {
    var store = findReduxStore();
    if (!store || state.unsubscribe) return;
    state.unsubscribe = store.subscribe(onStoreChange);
    onStoreChange();
  }

  function boot() {
    if (state.booted) {
      refreshUi();
      bindStore();
      return;
    }
    state.booted = true;
    refreshUi();
    bindStore();

    document.addEventListener("change", function (event) {
      if (event.target.matches("[data-emenu-page-tab]")) {
        window.setTimeout(refreshUi, 0);
      }
    });

    document.addEventListener("click", function (event) {
      if (event.target.closest("[data-emenu-page-tab]")) {
        window.setTimeout(updatePanelVisibility, 0);
      }
      if (event.target.closest(".ant-tabs-tab")) {
        window.setTimeout(refreshUi, 0);
      }
    });

    document.addEventListener(
      "pointerup",
      function (event) {
        if (!shouldSuppressBindDishModal()) return;
        if (!event.target.closest('[id^="blockItem-"]')) return;
        var component = event.target.closest('[id^="blockItem-"]').id.replace(/^blockItem-/, "");
        if (PRODUCT_COMPONENT_TYPES.indexOf(component) < 0) return;
        suppressBindDishModalSoon();
      },
      true
    );

    var observer = new MutationObserver(function () {
      onDomChange();
      watchBindDishModal();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    var attempts = 0;
    function retry() {
      refreshUi();
      bindStore();
      attempts += 1;
      if (attempts < 30) window.setTimeout(retry, 300);
    }
    retry();
    watchBindDishModal();
    watchActiveGroupChanges();
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
