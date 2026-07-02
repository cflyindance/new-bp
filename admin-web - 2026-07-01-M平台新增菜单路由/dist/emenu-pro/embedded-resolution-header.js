/**
 * 嵌入态：添加分组后尚无页面时，在顶栏标题位展示分辨率编辑（与 viewportSize 一致）。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var FALLBACK_ID = "emenu-resolution-fallback";
  var TEMPLATE_KEY = "bplant-emenu-pro-template";
  var VIEWPORT_WIDTH = 1280;
  var VIEWPORT_HEIGHT = 800;
  var DEFAULT_WIDTH = 1920;
  var DEFAULT_HEIGHT = 1200;
  var booted = false;
  var editing = false;
  var draftWidth = null;
  var draftHeight = null;

  function hasNativeViewportSize() {
    return !!document.querySelector('[class*="viewportSize"]');
  }

  function hasGroupingTree() {
    var grouping = document.querySelector('[class*="grouping"]');
    return !!(grouping && grouping.querySelector(".ant-tree-treenode"));
  }

  function shouldShowFallback() {
    return !hasNativeViewportSize() && hasGroupingTree();
  }

  function loadTemplate() {
    try {
      var raw = sessionStorage.getItem(TEMPLATE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.version ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function saveTemplate(template) {
    sessionStorage.setItem(TEMPLATE_KEY, JSON.stringify(template));
  }

  function getCurrentSize() {
    var template = loadTemplate();
    return {
      width: template && template.width ? template.width : DEFAULT_WIDTH,
      height: template && template.height ? template.height : DEFAULT_HEIGHT,
    };
  }

  function round2(num) {
    return Math.round(num * 100) / 100;
  }

  function applyResolution(width, height) {
    var template = loadTemplate() || {
      version: "0.0.7",
      globalData: [],
      globalBlocks: [],
      currentPageData: {},
      currentBlock: {},
      status: "draft",
      aspectRatio: "16 / 10",
    };

    template.width = width;
    template.height = height;
    var isHorizontal = width >= height;
    template.direction = isHorizontal ? "horizontal" : "vertical";
    var rate = isHorizontal ? height / width : width / height;

    if (isHorizontal) {
      template.viewportWidth = VIEWPORT_WIDTH;
      template.viewportHeight = round2(VIEWPORT_WIDTH * rate);
    } else {
      template.viewportHeight = VIEWPORT_HEIGHT;
      template.viewportWidth = round2(VIEWPORT_HEIGHT * rate);
    }

    template.lastUpdateTime = Date.now();
    saveTemplate(template);
    window.setTimeout(function () {
      window.location.reload();
    }, 500);
  }

  function setEditing(next) {
    editing = next;
    var root = document.getElementById(FALLBACK_ID);
    if (!root) return;
    var widthInput = root.querySelector('[data-field="width"]');
    var heightInput = root.querySelector('[data-field="height"]');
    var modifyBtn = root.querySelector('[data-action="modify"]');
    var confirmBtn = root.querySelector('[data-action="confirm"]');
    var cancelBtn = root.querySelector('[data-action="cancel"]');

    if (widthInput) widthInput.disabled = !editing;
    if (heightInput) heightInput.disabled = !editing;
    if (modifyBtn) modifyBtn.hidden = editing;
    if (confirmBtn) confirmBtn.hidden = !editing;
    if (cancelBtn) cancelBtn.hidden = !editing;
  }

  function bindFallback(root) {
    var widthInput = root.querySelector('[data-field="width"]');
    var heightInput = root.querySelector('[data-field="height"]');
    var modifyBtn = root.querySelector('[data-action="modify"]');
    var confirmBtn = root.querySelector('[data-action="confirm"]');
    var cancelBtn = root.querySelector('[data-action="cancel"]');
    var size = getCurrentSize();

    widthInput.value = draftWidth != null ? draftWidth : size.width;
    heightInput.value = draftHeight != null ? draftHeight : size.height;
    setEditing(editing);

    modifyBtn.addEventListener("click", function () {
      draftWidth = Number(widthInput.value) || size.width;
      draftHeight = Number(heightInput.value) || size.height;
      setEditing(true);
    });

    cancelBtn.addEventListener("click", function () {
      draftWidth = null;
      draftHeight = null;
      widthInput.value = size.width;
      heightInput.value = size.height;
      setEditing(false);
    });

    confirmBtn.addEventListener("click", function () {
      var width = Number(widthInput.value);
      var height = Number(heightInput.value);
      if (!width || !height) return;
      applyResolution(width, height);
    });
  }

  function createFallback() {
    if (document.getElementById(FALLBACK_ID)) return;

    var root = document.createElement("div");
    root.id = FALLBACK_ID;
    root.className = "emenu-resolution-fallback";
    root.innerHTML =
      '<div class="emenu-resolution-field">' +
      '<span class="emenu-resolution-addon">宽度</span>' +
      '<input data-field="width" type="number" min="1" step="1" disabled />' +
      '<span class="emenu-resolution-suffix">px</span>' +
      "</div>" +
      '<div class="emenu-resolution-field">' +
      '<span class="emenu-resolution-addon">高度</span>' +
      '<input data-field="height" type="number" min="1" step="1" disabled />' +
      '<span class="emenu-resolution-suffix">px</span>' +
      "</div>" +
      '<button type="button" class="emenu-resolution-link" data-action="modify">修改</button>' +
      '<button type="button" class="emenu-resolution-link" data-action="confirm" hidden>确认</button>' +
      '<button type="button" class="emenu-resolution-link" data-action="cancel" hidden>取消</button>';

    document.body.appendChild(root);
    bindFallback(root);
  }

  function removeFallback() {
    var root = document.getElementById(FALLBACK_ID);
    if (root) root.remove();
    editing = false;
    draftWidth = null;
    draftHeight = null;
  }

  function sync() {
    if (hasNativeViewportSize() || !shouldShowFallback()) {
      removeFallback();
      return;
    }
    createFallback();
  }

  function boot() {
    if (booted) return;
    booted = true;

    var attempts = 0;
    function retry() {
      sync();
      attempts += 1;
      if (attempts < 24) {
        window.setTimeout(retry, 500);
      }
    }
    retry();

    window.addEventListener("resize", sync);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
