/**
 * Configuration center · 自定义 Toast / 确认 / 输入对话框
 * 替代 window.alert / confirm / prompt；视觉对齐 order-limit .olf-dialog
 */
(function (global) {
  "use strict";

  var TOAST_ID = "app-dialogs-toast";
  var CONFIRM_ID = "app-dialogs-confirm";
  var PROMPT_ID = "app-dialogs-prompt";

  /**
   * 原型页常被嵌在 iframe 里，此时 position:fixed 只覆盖 iframe 视口。
   * 同源时挂到顶层文档，让遮罩铺满整个窗口；跨域取不到则退回本文档。
   */
  function hostDocument() {
    try {
      var topWindow = window.top;
      if (topWindow && topWindow.document && topWindow.document.body) return topWindow.document;
    } catch (e) {}
    return document;
  }

  function ensureStyles(doc) {
    if (doc.getElementById("app-dialogs-style")) return;
    var style = doc.createElement("style");
    style.id = "app-dialogs-style";
    style.textContent = [
      ".appd-overlay{position:fixed;inset:0;z-index:10050;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.45)}",
      ".appd-dialog{width:min(500px,100%);max-height:calc(100vh - 48px);overflow:auto;padding:24px;border-radius:16px;background:#fff;box-shadow:0 18px 48px rgba(0,0,0,.18)}",
      ".appd-dialog h3{margin:0 0 10px;font-size:18px;font-weight:600;color:#0f172a}",
      ".appd-dialog p{margin:0 0 22px;font-size:14px;line-height:22px;color:#64748b;white-space:pre-wrap}",
      ".appd-dialog-actions{display:flex;justify-content:flex-end;gap:10px}",
      ".appd-btn{min-height:40px;padding:0 18px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;font-size:14px;font-weight:500;cursor:pointer;color:#0f172a}",
      ".appd-btn:hover{border-color:#94a3b8}",
      ".appd-btn--primary{border-color:#2563eb;background:#2563eb;color:#fff}",
      ".appd-btn--primary:hover{border-color:#1d4ed8;background:#1d4ed8}",
      ".appd-btn--danger{border-color:#ffccc7;color:#cf1322;background:#fff2f0}",
      ".appd-field{display:block;margin:0 0 22px}",
      ".appd-field span{display:block;margin-bottom:6px;font-size:14px;font-weight:500;color:#0f172a}",
      ".appd-input{width:100%;height:40px;padding:0 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;box-sizing:border-box}",
      ".appd-error{display:none;margin:-14px 0 16px;font-size:12px;color:#cf1322}",
      ".appd-error.is-show{display:block}",
      ".appd-toast{position:fixed;right:16px;bottom:80px;z-index:10060;max-width:22rem;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#0f172a;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.12)}",
      ".appd-toast--success{border-color:rgba(37,99,235,.3)}",
      ".appd-toast--error{border-color:rgba(207,19,34,.35)}",
    ].join("");
    doc.head.appendChild(style);
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showToast(message, opts) {
    var doc = hostDocument();
    ensureStyles(doc);
    opts = opts || {};
    var text = String(message ?? "").trim();
    if (!text) return;
    if (text.length > 200) text = text.slice(0, 200) + "…";
    var existing = doc.getElementById(TOAST_ID);
    if (existing) existing.remove();
    var el = doc.createElement("div");
    el.id = TOAST_ID;
    el.setAttribute("role", "status");
    el.className = "appd-toast" + (opts.variant === "success" ? " appd-toast--success" : opts.variant === "error" ? " appd-toast--error" : "");
    el.textContent = text;
    doc.body.appendChild(el);
    setTimeout(function () { el.remove(); }, opts.durationMs || 4000);
  }

  function confirm(opts) {
    var doc = hostDocument();
    ensureStyles(doc);
    opts = opts || {};
    return new Promise(function (resolve) {
      var prev = doc.getElementById(CONFIRM_ID);
      if (prev) prev.remove();
      var previouslyFocused = document.activeElement;
      var overlay = doc.createElement("div");
      overlay.id = CONFIRM_ID;
      overlay.className = "appd-overlay";
      overlay.innerHTML =
        '<div class="appd-dialog" role="dialog" aria-modal="true" aria-labelledby="appdConfirmTitle">' +
        "<h3 id=\"appdConfirmTitle\">" + esc(opts.title || "确认操作") + "</h3>" +
        "<p>" + esc(opts.message || "") + "</p>" +
        '<div class="appd-dialog-actions">' +
        '<button type="button" class="appd-btn" data-appd="cancel">' + esc(opts.cancelLabel || "取消") + "</button>" +
        '<button type="button" class="appd-btn ' + (opts.danger ? "appd-btn--danger" : "appd-btn--primary") + '" data-appd="ok">' +
        esc(opts.confirmLabel || "确认") +
        "</button></div></div>";

      function close(ok) {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        if (doc !== document) doc.removeEventListener("keydown", onKey);
        window.removeEventListener("pagehide", onPageHide);
        if (previouslyFocused && document.contains(previouslyFocused)) {
          try { previouslyFocused.focus(); } catch (_) {}
        }
        resolve(!!ok);
      }
      function onKey(ev) {
        if (ev.key === "Escape") { ev.preventDefault(); close(false); }
      }
      // 挂在顶层文档时，iframe 卸载不会自动移除遮罩，需主动清理避免挡住整个页面
      function onPageHide() { close(false); }
      overlay.addEventListener("click", function (ev) {
        var t = ev.target;
        var action = t && t.getAttribute && t.getAttribute("data-appd");
        if (!action && t && t.closest) {
          var btn = t.closest("[data-appd]");
          action = btn && btn.getAttribute("data-appd");
        }
        if (action === "ok") close(true);
        else if (action === "cancel" || t === overlay) close(false);
      });
      document.addEventListener("keydown", onKey);
      if (doc !== document) doc.addEventListener("keydown", onKey);
      window.addEventListener("pagehide", onPageHide);
      doc.body.appendChild(overlay);
      var cancelBtn = overlay.querySelector('[data-appd="cancel"]');
      if (cancelBtn) cancelBtn.focus();
    });
  }

  function prompt(opts) {
    var doc = hostDocument();
    ensureStyles(doc);
    opts = opts || {};
    var required = opts.required !== false;
    return new Promise(function (resolve) {
      var prev = doc.getElementById(PROMPT_ID);
      if (prev) prev.remove();
      var previouslyFocused = document.activeElement;
      var overlay = doc.createElement("div");
      overlay.id = PROMPT_ID;
      overlay.className = "appd-overlay";
      overlay.innerHTML =
        '<form class="appd-dialog" role="dialog" aria-modal="true" aria-labelledby="appdPromptTitle">' +
        "<h3 id=\"appdPromptTitle\">" + esc(opts.title || "请输入") + "</h3>" +
        '<label class="appd-field"><span>' + esc(opts.label || "") + "</span>" +
        '<input class="appd-input" data-appd-input autocomplete="off" placeholder="' + esc(opts.placeholder || "") + '" value="' + esc(opts.initialValue || "") + '" /></label>' +
        '<p class="appd-error" data-appd-error>请填写内容后再确认。</p>' +
        '<div class="appd-dialog-actions">' +
        '<button type="button" class="appd-btn" data-appd="cancel">' + esc(opts.cancelLabel || "取消") + "</button>" +
        '<button type="submit" class="appd-btn appd-btn--primary" data-appd="ok">' + esc(opts.confirmLabel || "确认") + "</button>" +
        "</div></form>";

      var form = overlay.querySelector("form");
      var input = overlay.querySelector("[data-appd-input]");
      var errorEl = overlay.querySelector("[data-appd-error]");

      function close(value) {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        if (doc !== document) doc.removeEventListener("keydown", onKey);
        window.removeEventListener("pagehide", onPageHide);
        if (previouslyFocused && document.contains(previouslyFocused)) {
          try { previouslyFocused.focus(); } catch (_) {}
        }
        resolve(value);
      }
      function onKey(ev) {
        if (ev.key === "Escape") { ev.preventDefault(); close(null); }
      }
      function onPageHide() { close(null); }
      form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var value = (input.value || "").trim();
        if (required && !value) {
          errorEl.classList.add("is-show");
          input.focus();
          return;
        }
        close(value);
      });
      overlay.addEventListener("click", function (ev) {
        var t = ev.target;
        var action = t && t.getAttribute && t.getAttribute("data-appd");
        if (!action && t && t.closest) {
          var btn = t.closest("[data-appd]");
          action = btn && btn.getAttribute("data-appd");
        }
        if (action === "cancel" || t === overlay) close(null);
      });
      document.addEventListener("keydown", onKey);
      if (doc !== document) doc.addEventListener("keydown", onKey);
      window.addEventListener("pagehide", onPageHide);
      doc.body.appendChild(overlay);
      if (input) { input.focus(); input.select(); }
    });
  }

  global.AppDialogs = {
    showToast: showToast,
    confirm: confirm,
    prompt: prompt,
  };
})(typeof window !== "undefined" ? window : this);
