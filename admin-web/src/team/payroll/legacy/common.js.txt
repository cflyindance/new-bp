/**
 * TipOut - Common Interactive Logic
 */

function isEmbeddedMode() {
  try {
    if (window.self !== window.top) return true;
    var p = new URLSearchParams(window.location.search);
    var v = (p.get("embedded") || "").toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  } catch (e) {
    return window.self !== window.top;
  }
}

function applyEmbeddedMode() {
  if (!isEmbeddedMode()) return;
  document.body.classList.add("tipout-embedded");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyEmbeddedMode);
} else {
  applyEmbeddedMode();
}

// Sidebar toggle for mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-overlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

/** 移动端折叠筛选条：切换 .filter-surface.is-expanded（桌面端 CSS 始终展开，此状态无影响） */
function toggleFilterSurface(btn) {
  if (!btn || !btn.closest) return;
  var surface = btn.closest('.filter-surface');
  if (!surface) return;
  surface.classList.toggle('is-expanded');
  var open = surface.classList.contains('is-expanded');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

// Modal controls
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Drawer controls
function openDrawer(id) {
  const overlay = document.getElementById(id + '-overlay');
  const drawer = document.getElementById(id);
  if (overlay) overlay.classList.add('show');
  if (drawer) drawer.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(id) {
  if (id === 'salesDrawer' && typeof editingPersonalSalesPctConditions !== 'undefined') {
    editingPersonalSalesPctConditions = false;
  }
  if (id === 'salesDrawer' && typeof editingDeductValueBasis !== 'undefined' && editingDeductValueBasis) {
    editingDeductValueBasis = null;
    if (typeof currentEditingDeductBasis !== 'undefined') currentEditingDeductBasis = null;
    var extra = document.getElementById('salesDrawerDeductExtra');
    if (extra) { extra.style.display = 'none'; extra.innerHTML = ''; }
    var titleEl = document.querySelector('#salesDrawer .drawer-header h3');
    if (titleEl) titleEl.textContent = '设置取值条件';
  }
  // overlay 关闭旧 deductCondDrawer 时兜底
  if (id === 'deductCondDrawer' && typeof cancelDeductConditionsDrawer === 'function' && typeof currentEditingDeductBasis !== 'undefined' && currentEditingDeductBasis) {
    try {
      cancelDeductConditionsDrawer();
      return;
    } catch (e) {}
  }
  const overlay = document.getElementById(id + '-overlay');
  const drawer = document.getElementById(id);
  if (overlay) overlay.classList.remove('show');
  if (drawer) drawer.classList.remove('show');
  document.body.style.overflow = '';
}

// Confirm dialog（弹框，替代浏览器 confirm/Alert）
var tipoutConfirmCallback = null;

function ensureTipoutConfirmModal() {
  if (document.getElementById('tipoutConfirmModal')) return;
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'tipoutConfirmModal';
  overlay.innerHTML =
    '<div class="modal" style="width:min(420px,92vw)" role="dialog" aria-modal="true" aria-labelledby="tipoutConfirmTitle">' +
      '<div class="modal-header">' +
        '<h3 id="tipoutConfirmTitle">确认</h3>' +
        '<button type="button" class="modal-close" id="tipoutConfirmClose" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<p id="tipoutConfirmMessage" style="margin:0;font-size:14px;line-height:1.65;color:var(--text-secondary)"></p>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button type="button" class="btn" id="tipoutConfirmCancel">取消</button>' +
        '<button type="button" class="btn btn-danger" id="tipoutConfirmOk">确定</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  function dismissConfirm() {
    tipoutConfirmCallback = null;
    closeModal('tipoutConfirmModal');
  }
  document.getElementById('tipoutConfirmCancel').addEventListener('click', dismissConfirm);
  document.getElementById('tipoutConfirmClose').addEventListener('click', dismissConfirm);
  document.getElementById('tipoutConfirmOk').addEventListener('click', function() {
    var cb = tipoutConfirmCallback;
    tipoutConfirmCallback = null;
    closeModal('tipoutConfirmModal');
    if (typeof cb === 'function') cb();
  });
}

/**
 * @param {string} message
 * @param {Function} callback 点击确认后执行
 * @param {{ title?: string, okText?: string, cancelText?: string, okClass?: string }} [options]
 */
function confirmAction(message, callback, options) {
  options = options || {};
  ensureTipoutConfirmModal();
  tipoutConfirmCallback = typeof callback === 'function' ? callback : null;
  var titleEl = document.getElementById('tipoutConfirmTitle');
  var msgEl = document.getElementById('tipoutConfirmMessage');
  var okBtn = document.getElementById('tipoutConfirmOk');
  var cancelBtn = document.getElementById('tipoutConfirmCancel');
  if (titleEl) titleEl.textContent = options.title || '确认';
  if (msgEl) msgEl.textContent = message || '';
  if (okBtn) {
    okBtn.textContent = options.okText || '确定';
    okBtn.className = options.okClass || 'btn btn-primary';
  }
  if (cancelBtn) cancelBtn.textContent = options.cancelText || '取消';
  openModal('tipoutConfirmModal');
}

// Notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  notification.style.cssText = `
    position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
    padding: 10px 24px; border-radius: 8px; z-index: 9999;
    display: flex; align-items: center; gap: 8px; font-size: 14px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    animation: slideDown 0.3s ease;
    background: ${type === 'success' ? '#f6ffed' : type === 'error' ? '#fff2f0' : '#e6f4ff'};
    border: 1px solid ${type === 'success' ? '#b7eb8f' : type === 'error' ? '#ffccc7' : '#91caff'};
    color: ${type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1677ff'};
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add delete row functionality for tables
function deleteTableRow(btn) {
  confirmAction('确定要删除该行吗？', () => {
    const row = btn.closest('tr');
    if (row) {
      row.style.opacity = '0';
      row.style.transition = 'opacity 0.3s';
      setTimeout(() => row.remove(), 300);
      showNotification('删除成功');
    }
  }, { title: '删除确认', okText: '删除', okClass: 'btn btn-danger' });
}

// Add row to table
function addTableRow(tableId, template) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (tbody && template) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = template;
    tbody.appendChild(newRow);
    showNotification('新增成功');
  }
}

// Chip selection toggle
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('chip')) {
    const group = e.target.closest('.chip-group');
    if (group && !group.dataset.multi) {
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    }
    e.target.classList.toggle('selected');
  }
});

// Close modal/drawer on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    if (e.target.id === 'tipoutConfirmModal') {
      tipoutConfirmCallback = null;
    }
    e.target.classList.remove('show');
    document.body.style.overflow = '';
  }
  if (e.target.classList.contains('drawer-overlay')) {
    const drawerId = e.target.id.replace('-overlay', '');
    closeDrawer(drawerId);
  }
  if (e.target.classList.contains('mobile-overlay')) {
    closeSidebar();
  }
});

// CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;
document.head.appendChild(style);
