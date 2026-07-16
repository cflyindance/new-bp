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
    return new URL("./images/" + name + ".svg?v=2", window.location.href).href;
  }

  var ICON_DECOR_VERSION = "4";

  function isDecorated(el) {
    return !!el.querySelector(".emenu-block-item-icon-wrap");
  }

  function readLabel(el) {
    var labelEl = el.querySelector(".emenu-block-item-label");
    if (labelEl) return labelEl.textContent.trim();
    return el.textContent.trim();
  }

  function decorateBlockItem(el) {
    if (!el || !el.id || el.id.indexOf("blockItem-") !== 0) return;

    var component = el.id.replace(/^blockItem-/, "");
    var iconName = COMPONENT_ICONS[component];
    if (!iconName) return;

    if (isDecorated(el)) {
      el.dataset.iconReady = ICON_DECOR_VERSION;
      return;
    }

    var labelText = readLabel(el);

    el.classList.add("emenu-block-item-with-icon");
    if (component === "CountDown" || component === "OrderInterval") {
      el.classList.add("emenu-block-item-matched-icon");
    }

    var wrap = document.createElement("span");
    wrap.className = "emenu-block-item-icon-wrap emenu-icon-circle-wrap";

    var img = document.createElement("img");
    img.className = "emenu-block-item-icon";
    img.src = iconUrl(iconName);
    img.alt = "";
    img.draggable = false;

    var label = document.createElement("span");
    label.className = "emenu-block-item-label";
    label.textContent = labelText;

    wrap.appendChild(img);
    el.textContent = "";
    el.appendChild(wrap);
    el.appendChild(label);
    el.dataset.iconReady = ICON_DECOR_VERSION;
  }

  function scanBlockItems() {
    var items = document.querySelectorAll('[id^="blockItem-"]');
    for (var i = 0; i < items.length; i++) {
      decorateBlockItem(items[i]);
    }
  }

  function boot() {
    scanBlockItems();
    var observer = new MutationObserver(scanBlockItems);
    observer.observe(document.body, { childList: true, subtree: true });
    window.setInterval(scanBlockItems, 1500);
  }

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})();
