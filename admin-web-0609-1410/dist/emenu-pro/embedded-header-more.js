/**
 * 嵌入态：发布按钮右侧「更多」三点菜单（固定浮层，不改动 React DOM，避免页面卡死）。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var PORTAL_ID = "emenu-header-more-portal";
  var MORE_WRAP_CLASS = "emenu-header-more";
  var DELETE_LABELS = ["删除模板", "Delete template", "Delete Template"];
  var resizeTimer = null;
  var booted = false;

  function getOperationWrapper() {
    return (
      document.querySelector('[class*="templateWrapper"] [class*="operationWrapper"]') ||
      document.querySelector('[class*="header"] [class*="operationWrapper"]') ||
      document.querySelector('[class*="operationWrapper"]')
    );
  }

  function buttonLabel(btn) {
    return (btn && btn.textContent ? btn.textContent : "").replace(/\s+/g, " ").trim();
  }

  function isDeleteTemplateButton(btn) {
    if (!btn) return false;
    if (btn.className && btn.className.indexOf("deleteButton") >= 0) return true;
    var label = buttonLabel(btn);
    for (var i = 0; i < DELETE_LABELS.length; i++) {
      if (label === DELETE_LABELS[i] || label.indexOf(DELETE_LABELS[i]) >= 0) {
        return true;
      }
    }
    return false;
  }

  function findDeleteButton(wrapper) {
    if (!wrapper) return null;
    var byClass = wrapper.querySelector('[class*="deleteButton"]');
    if (byClass) return byClass;
    var buttons = wrapper.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      if (isDeleteTemplateButton(buttons[i])) return buttons[i];
    }
    return null;
  }

  function findAnchorButton(wrapper) {
    if (!wrapper) return null;
    var primary = wrapper.querySelector("button.ant-btn-primary");
    if (primary) return primary;
    var buttons = wrapper.querySelectorAll("button.ant-btn");
    for (var i = buttons.length - 1; i >= 0; i--) {
      if (!isDeleteTemplateButton(buttons[i])) return buttons[i];
    }
    return null;
  }

  function closeMenu(moreWrap, menu) {
    menu.hidden = true;
    moreWrap.classList.remove("is-open");
  }

  function closeAllMenus() {
    var portal = document.getElementById(PORTAL_ID);
    if (!portal) return;
    var moreWrap = portal.querySelector("." + MORE_WRAP_CLASS);
    var menu = portal.querySelector(".emenu-header-more-menu");
    if (moreWrap && menu) closeMenu(moreWrap, menu);
  }

  function ensurePortal() {
    var portal = document.getElementById(PORTAL_ID);
    if (portal) return portal;

    portal = document.createElement("div");
    portal.id = PORTAL_ID;
    portal.className = "emenu-header-more-portal";

    var moreWrap = document.createElement("div");
    moreWrap.className = MORE_WRAP_CLASS;

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "emenu-header-more-trigger";
    trigger.setAttribute("aria-label", "更多");
    trigger.setAttribute("title", "更多");
    trigger.innerHTML =
      '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">' +
      '<circle cx="12" cy="5" r="2"></circle>' +
      '<circle cx="12" cy="12" r="2"></circle>' +
      '<circle cx="12" cy="19" r="2"></circle>' +
      "</svg>";

    var menu = document.createElement("div");
    menu.className = "emenu-header-more-menu";
    menu.hidden = true;

    var menuItem = document.createElement("button");
    menuItem.type = "button";
    menuItem.className =
      "emenu-header-more-menu-item emenu-header-more-menu-item-danger";
    menuItem.textContent = "删除模板";

    menuItem.addEventListener("click", function (event) {
      event.stopPropagation();
      closeMenu(moreWrap, menu);
      var wrapper = getOperationWrapper();
      var deleteBtn = findDeleteButton(wrapper);
      if (deleteBtn) deleteBtn.click();
    });

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var willOpen = menu.hidden;
      closeAllMenus();
      if (willOpen) {
        menu.hidden = false;
        moreWrap.classList.add("is-open");
      }
    });

    menu.appendChild(menuItem);
    moreWrap.appendChild(trigger);
    moreWrap.appendChild(menu);
    portal.appendChild(moreWrap);
    document.body.appendChild(portal);

    document.addEventListener("click", closeAllMenus);
    return portal;
  }

  function updatePortal() {
    var portal = ensurePortal();
    var wrapper = getOperationWrapper();
    var anchor = findAnchorButton(wrapper);
    var deleteBtn = findDeleteButton(wrapper);

    if (!wrapper || !anchor || !deleteBtn) {
      portal.style.display = "none";
      return;
    }

    var rect = anchor.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      portal.style.display = "none";
      return;
    }

    var menuItem = portal.querySelector(".emenu-header-more-menu-item");
    if (menuItem) {
      menuItem.textContent = buttonLabel(deleteBtn) || "删除模板";
    }

    var header =
      document.querySelector('[class*="templateWrapper"] [class*="header"]') ||
      anchor.closest('[class*="header"]');
    var headerRect = header ? header.getBoundingClientRect() : rect;
    var triggerSize = 32;
    var edgeGap = 8;

    portal.style.display = "block";
    portal.style.left = "auto";
    portal.style.right = edgeGap + "px";
    portal.style.top =
      headerRect.top + (headerRect.height - triggerSize) / 2 + "px";
  }

  function boot() {
    if (booted) return;
    booted = true;
    ensurePortal();

    var attempts = 0;
    function retry() {
      updatePortal();
      attempts += 1;
      if (attempts < 12) {
        window.setTimeout(retry, 250);
      }
    }
    retry();

    window.addEventListener("resize", function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(updatePortal, 150);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
