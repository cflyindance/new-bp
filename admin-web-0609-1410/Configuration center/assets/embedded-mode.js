/**
 * admin-web iframe 嵌入态：隐藏 Configuration center 左侧导航，并在站内链接保留 embedded=1。
 */
(function () {
  var params = new URLSearchParams(window.location.search);
  var embedded = params.get("embedded");
  var isEmbedded = embedded === "1" || embedded === "true";
  if (!isEmbedded) {
    try {
      isEmbedded = window.self !== window.top;
    } catch (e) {
      isEmbedded = false;
    }
  }

  window.MENUSIFU_EMBEDDED = isEmbedded;

  window.appendMenusifuEmbeddedParam = function (href) {
    if (!href || typeof href !== "string") return href;
    if (!window.MENUSIFU_EMBEDDED) return href;
    if (href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return href;
    try {
      var u = new URL(href, window.location.href);
      if (u.origin !== window.location.origin) return href;
      u.searchParams.set("embedded", "1");
      var rel = u.pathname;
      var slash = rel.lastIndexOf("/");
      if (slash >= 0) rel = rel.slice(slash + 1);
      return rel + u.search + u.hash;
    } catch (e) {
      return href;
    }
  };

  if (!isEmbedded) return;

  document.documentElement.classList.add("embedded-mode");

  function patchAnchors() {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (!h || h.charAt(0) === "#" || h.indexOf("javascript:") === 0) return;
      a.setAttribute("href", window.appendMenusifuEmbeddedParam(h));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", patchAnchors);
  } else {
    patchAnchors();
  }
})();
