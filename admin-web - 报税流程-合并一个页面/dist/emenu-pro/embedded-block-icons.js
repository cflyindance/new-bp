/**
 * 嵌入态：为「页面组件 / 全局组件」侧栏列表补充默认图标。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var COMPONENT_ICONS = {
    AddToCartImageBtn: "addToCart",
    SoldOutImage: "soldOut",
    Video: "video",
    Carousel: "carousel",
    DishName: "dishName",
    SalePrice: "salePrice",
    MemberPrice: "memberPrice",
    ShoppingCart: "shoppingCart",
    Home: "home",
    MenuList: "menuList",
    MemberLogin: "memberLogin",
    CallServer: "callServer",
    CountDown: "clock",
    OrderInterval: "clock",
    ChangeLanguage: "changeLanguage",
    SwitchBuffet: "switchBuffet",
    ChangePartySize: "changePartySize",
    SwitchTable: "switchTable",
    BatteryWifi: "batteryWifi",
  };

  function iconUrl(name) {
    return new URL("./images/" + name + ".svg", window.location.href).href;
  }

  function decorateBlockItem(el) {
    if (!el || el.dataset.iconReady === "1") return;

    var component = el.id.replace(/^blockItem-/, "");
    var iconName = COMPONENT_ICONS[component];
    if (!iconName) return;

    el.dataset.iconReady = "1";
    el.classList.add("emenu-block-item-with-icon");
    if (component === "CountDown" || component === "OrderInterval") {
      el.classList.add("emenu-block-item-matched-icon");
    }

    var img = document.createElement("img");
    img.className = "emenu-block-item-icon";
    img.src = iconUrl(iconName);
    img.alt = "";
    img.draggable = false;

    var label = document.createElement("span");
    label.className = "emenu-block-item-label";
    label.textContent = el.textContent.trim();

    el.textContent = "";
    el.appendChild(img);
    el.appendChild(label);
  }

  function scanBlockItems() {
    var items = document.querySelectorAll('[id^="blockItem-"]');
    for (var i = 0; i < items.length; i++) {
      decorateBlockItem(items[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanBlockItems);
  } else {
    scanBlockItems();
  }

  var observer = new MutationObserver(scanBlockItems);
  observer.observe(document.body, { childList: true, subtree: true });
})();
