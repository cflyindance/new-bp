/**
 * 嵌入态：「页面组件」内增加「商品组件 / 营销组件」子 Tab 分组。
 * 不移动 blockItem 节点，避免切换「全局组件」时 React removeChild 报错。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var BLOCK_LIST_ID = "block_list";
  var TABS_CLASS = "emenu-page-component-tabs";
  var ACTIVE_TAB = "product";

  var GROUPS = [
    {
      key: "product",
      title: "商品组件",
      components: [
        "AddToCartImageBtn",
        "SoldOutImage",
        "DishName",
        "SalePrice",
        "MemberPrice",
      ],
    },
    {
      key: "marketing",
      title: "营销组件",
      components: ["Video", "Carousel"],
    },
  ];

  var booted = false;
  var observer = null;

  function isPageComponentBlockList(blockList) {
    if (!blockList) return false;
    if (blockList.querySelector("#blockItem-Home")) return false;
    return !!blockList.querySelector(
      "#blockItem-AddToCartImageBtn, #blockItem-Video, #blockItem-Carousel"
    );
  }

  function getTabsElement(blockList) {
    var parent = blockList && blockList.parentElement;
    if (!parent) return null;
    return parent.querySelector(":scope > ." + TABS_CLASS);
  }

  function setActiveTabButtons(tabs, tabKey) {
    tabs.querySelectorAll("[data-emenu-page-tab]").forEach(function (btn) {
      var active = btn.getAttribute("data-emenu-page-tab") === tabKey;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function createTabsElement() {
    var tabs = document.createElement("div");
    tabs.className = TABS_CLASS;
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "页面组件分组");

    GROUPS.forEach(function (group) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emenu-page-component-tab";
      btn.setAttribute("data-emenu-page-tab", group.key);
      btn.setAttribute("role", "tab");
      btn.textContent = group.title;
      tabs.appendChild(btn);
    });

    setActiveTabButtons(tabs, ACTIVE_TAB);
    return tabs;
  }

  function tagBlockItems(blockList) {
    GROUPS.forEach(function (group) {
      group.components.forEach(function (component) {
        var item = blockList.querySelector(":scope > #blockItem-" + component);
        if (item) {
          item.setAttribute("data-emenu-component-group", group.key);
        }
      });
    });
  }

  function cleanupPageGrouping(blockList) {
    if (!blockList) return;
    var tabs = getTabsElement(blockList);
    if (tabs) tabs.remove();
    blockList.removeAttribute("data-emenu-active-group");
    blockList.querySelectorAll("[data-emenu-component-group]").forEach(function (item) {
      item.removeAttribute("data-emenu-component-group");
    });
  }

  function applyPageGrouping(blockList) {
    if (!isPageComponentBlockList(blockList)) {
      cleanupPageGrouping(blockList);
      return;
    }

    var expectedCount = 0;
    GROUPS.forEach(function (group) {
      expectedCount += group.components.length;
    });

    var found = 0;
    GROUPS.forEach(function (group) {
      group.components.forEach(function (component) {
        if (blockList.querySelector(":scope > #blockItem-" + component)) {
          found += 1;
        }
      });
    });
    if (found < expectedCount) return;

    tagBlockItems(blockList);
    blockList.setAttribute("data-emenu-active-group", ACTIVE_TAB);

    var tabs = getTabsElement(blockList);
    if (!tabs) {
      tabs = createTabsElement();
      blockList.parentElement.insertBefore(tabs, blockList);
    } else {
      setActiveTabButtons(tabs, ACTIVE_TAB);
    }
  }

  function scanBlockList() {
    var blockList = document.getElementById(BLOCK_LIST_ID);
    if (!blockList) return;
    applyPageGrouping(blockList);
  }

  function onDocumentClick(event) {
    var tab = event.target.closest("[data-emenu-page-tab]");
    if (!tab) return;

    var blockList = document.getElementById(BLOCK_LIST_ID);
    if (!blockList || !isPageComponentBlockList(blockList)) return;

    var tabKey = tab.getAttribute("data-emenu-page-tab");
    if (!tabKey) return;

    ACTIVE_TAB = tabKey;
    blockList.setAttribute("data-emenu-active-group", tabKey);

    var tabs = tab.closest("." + TABS_CLASS);
    if (tabs) setActiveTabButtons(tabs, tabKey);
  }

  function boot() {
    if (booted) return;
    booted = true;
    scanBlockList();
    document.addEventListener("click", onDocumentClick);
    observer = new MutationObserver(scanBlockList);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
