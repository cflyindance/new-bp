/* Toast 提示组件（含新建屏保校验样式：红底白字 + 白圆红叉，对齐设计稿） */
(function() {
  var containerId = 'toastContainer';

  function getContainer() {
    var container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function escapeToastText(text) {
    var d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function getValidateIconHtml() {
    return '<span class="toast-validate-icon" aria-hidden="true"><span class="toast-validate-icon-bg">' +
      '<svg class="toast-validate-icon-x" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="#ff4d4f" stroke-width="1.4" stroke-linecap="round"/></svg></span></span>';
  }

  function getIcon(type) {
    var icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    return icons[type] || icons.info;
  }

  function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    var container = getContainer();
    var toast = document.createElement('div');
    var safe = escapeToastText(message);
    if (type === 'validate') {
      toast.className = 'toast toast-validate';
      toast.setAttribute('role', 'alert');
      toast.innerHTML = getValidateIconHtml() + '<span class="toast-validate-text">' + safe + '</span>';
    } else {
      toast.className = 'toast toast-' + type;
      toast.innerHTML = getIcon(type) + '<span>' + safe + '</span>';
    }
    container.appendChild(toast);

    setTimeout(function() {
      toast.classList.add('toast-out');
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  window.Toast = {
    show: showToast,
    success: function(msg, duration) { showToast(msg, 'success', duration); },
    error: function(msg, duration) { showToast(msg, 'error', duration); },
    warning: function(msg, duration) { showToast(msg, 'warning', duration); },
    info: function(msg, duration) { showToast(msg, 'info', duration); },
    /** 表单校验：红底白字胶囊（新建屏保 Figma 校验态） */
    validate: function(msg, duration) { showToast(msg, 'validate', duration != null ? duration : 3500); }
  };
})();
