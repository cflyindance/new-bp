import { esc } from '../permissions/center-editor';
import './brand-audit-detail.css';

export function auditDetailShell(actor: string, at: string, operation: string, body: string): string {
  const instant = new Date(at);
  const time = Number.isFinite(instant.getTime()) ? instant.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }) : '时间未记录';
  return `<div class="ba-dialog-inner">
    <header class="ba-dialog-header">
      <button type="button" class="ba-btn" data-brand-audit-close aria-label="关闭详情">×</button>
      <div class="brand-audit-heading"><h2>变更详情</h2><div class="brand-audit-meta"><span>操作人 <strong>${esc(actor || '未记录')}</strong></span><span>操作时间 <time>${esc(time)}</time></span></div></div>
      <button type="button" class="ba-btn ba-primary brand-audit-done" data-brand-audit-close>完成</button>
    </header>
    <section class="ba-dialog-body"><div class="brand-modal-card brand-audit-body">
      <section class="brand-audit-summary"><span class="brand-audit-info" aria-hidden="true">i</span><div><h3>操作内容</h3><p>${esc(operation)}</p></div></section>
      ${body}
    </div></section>
  </div>`;
}

export function auditValue(value: string, status = false): string {
  const positive = ['已启用', '已开通', '生效中', '试用中', '正常营业', '营业中'].includes(value);
  const negative = ['已暂停', '已关闭', '已停用', '暂停经营', '关店'].includes(value);
  return status ? `<span class="brand-audit-status" data-tone="${positive ? 'active' : negative ? 'stopped' : 'neutral'}">${esc(value)}</span>` : esc(value);
}

export function auditFields(fields: readonly (readonly [string, string])[]): string {
  return fields.length ? `<dl class="brand-audit-fields">${fields.map(([label, value]) =>
    `<div><dt>${esc(label)}</dt><dd>${auditValue(value, label.endsWith('状态'))}</dd></div>`).join('')}</dl>`
    : '<p class="ba-muted">历史记录未保存字段值</p>';
}

export function auditComparison(before: string, after: string): string {
  return `<div class="brand-audit-comparison">
    <section class="brand-audit-side"><h3>变更前</h3>${before}</section>
    <span class="brand-audit-arrow" aria-hidden="true">→</span>
    <section class="brand-audit-side"><h3>变更后</h3>${after}</section>
  </div>`;
}

export function showAuditDetail(dialog: HTMLDialogElement, trigger: HTMLElement): void {
  dialog.classList.add('ba', 'ba-modal', 'brand-design-modal', 'brand-audit-detail');
  dialog.setAttribute('aria-label', '变更详情');
  trigger.focus({ preventScroll: true });
  const parent = trigger.closest('dialog');
  const close = () => { if (dialog.open) dialog.close(); };
  dialog.querySelectorAll('[data-brand-audit-close]').forEach(button => button.addEventListener('click', close));
  parent?.addEventListener('close', close);
  window.addEventListener('hashchange', close);
  dialog.addEventListener('close', () => {
    parent?.removeEventListener('close', close);
    window.removeEventListener('hashchange', close);
    dialog.remove();
    requestAnimationFrame(() => { if (trigger.isConnected && (!parent || parent.open)) trigger.focus({ preventScroll: true }); });
  }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
}
