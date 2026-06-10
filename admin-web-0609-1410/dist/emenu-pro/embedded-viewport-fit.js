/**
 * 嵌入态：让页面画布在可用区域内尽量撑满宽度（去掉右侧留白感）。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  function findViewport(wrapper) {
    if (!wrapper) return null;
    var nodes = wrapper.querySelectorAll('[class*="viewport"]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var cls = String(node.className || "");
      if (
        cls.indexOf("viewportWrapper") >= 0 ||
        cls.indexOf("viewportSize") >= 0
      ) {
        continue;
      }
      if (node.style && (node.style.width || node.offsetWidth > 0)) {
        return node;
      }
    }
    return null;
  }

  function fitViewport() {
    var wrapper = document.querySelector('[class*="viewportWrapper"]');
    var viewport = findViewport(wrapper);
    if (!wrapper || !viewport) return;

    viewport.style.transform = "";
    viewport.style.marginBottom = "";

    var designWidth = parseFloat(viewport.style.width) || viewport.offsetWidth;
    var designHeight = parseFloat(viewport.style.height) || viewport.offsetHeight;
    if (!designWidth || !designHeight) return;

    var availableWidth = wrapper.clientWidth;
    var availableHeight = wrapper.clientHeight;
    if (!availableWidth || !availableHeight) return;

    var scale = availableWidth / designWidth;
    var scaledHeight = designHeight * scale;
    if (scaledHeight > availableHeight) {
      scale = availableHeight / designHeight;
      scaledHeight = designHeight * scale;
    }
    if (!isFinite(scale) || scale <= 0) return;

    viewport.style.transformOrigin = "top left";
    viewport.style.transform = "scale(" + scale + ")";
    viewport.style.marginBottom =
      scaledHeight > designHeight ? scaledHeight - designHeight + "px" : "";
  }

  function scheduleFit() {
    window.requestAnimationFrame(fitViewport);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleFit);
  } else {
    scheduleFit();
  }

  window.addEventListener("resize", scheduleFit);
  window.addEventListener("pageshow", scheduleFit);

  var observer = new MutationObserver(scheduleFit);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
})();
