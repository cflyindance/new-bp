import { createPayrollExportQueue } from './payroll-export-queue';
import { downloadBatchArtifact } from './payroll-batch-export-artifacts';
import type { PayrollBatchBridge } from './payroll-batch-export-types';

export function mountPayrollExportTaskCenter(root: HTMLElement, bridge: PayrollBatchBridge) {
  const queue = createPayrollExportQueue(bridge);
  const abort = new AbortController();
  const urls: string[] = [];
  const downloaded = new Set<string>();
  const downloadErrors = new Set<string>();
  const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  const surface = document.createElement('div');
  surface.className = 'payroll-export-center';
  surface.innerHTML = `<div class="payroll-export-toast" hidden role="status"><span data-export-message></span><button type="button" data-export-open>查看任务 ›</button></div><button class="btn payroll-workspace-action-btn" type="button" data-export-open>导出任务 <span data-export-count>0</span></button><aside class="payroll-export-drawer" hidden role="dialog" aria-label="导出任务记录"><header><button type="button" data-export-close aria-label="关闭任务记录">×</button><h3>任务记录</h3></header><div class="payroll-export-jobs"></div></aside>`;
  root.append(surface);
  const entry = surface.querySelector<HTMLButtonElement>('button.btn')!;
  const actions = root.querySelector('.payroll-workspace-actions');
  const confirm = actions?.querySelector('#payroll-header-save');
  if (confirm) confirm.before(entry); else actions?.append(entry);
  const drawer = surface.querySelector<HTMLElement>('.payroll-export-drawer')!;
  const toast = surface.querySelector<HTMLElement>('.payroll-export-toast')!;
  let returnFocus: HTMLElement | null = null;
  const labels: Record<string, string> = { idle: '排队中', preparing: '准备数据', generating: '生成明细', packaging: '合并 PDF', completed: '导出成功', partial: '部分失败，请重试', failed: '导出失败', cancelled: '已取消', cancelling: '取消中' };
  function render() {
    const jobs = queue.getJobs();
    entry.querySelector('[data-export-count]')!.textContent = String(jobs.length);
    toast.hidden = !queue.hasPending();
    surface.querySelector('[data-export-message]')!.textContent = '正在导出并合并，成功后自动下载';
    for (const job of jobs) if (job.snapshot.status === 'completed' && job.snapshot.result && !downloaded.has(job.id)) {
      downloaded.add(job.id);
      try { urls.push(downloadBatchArtifact(job.snapshot.result)); }
      catch { downloadErrors.add(job.id); }
    }
    surface.querySelector('.payroll-export-jobs')!.innerHTML = [...jobs].reverse().map(job => {
      const state = job.snapshot;
      const phase = job.queued ? 'idle' : state.status;
      const percent = phase === 'completed' ? 100 : phase === 'packaging' ? 90 : phase === 'generating' ? Math.min(85, 10 + Math.round(state.completed / Math.max(1, state.total) * 75)) : 0;
      return `<article class="payroll-export-card"><div class="payroll-export-card-heading"><span class="payroll-export-status-icon ${phase === 'completed' ? 'is-complete' : ['failed', 'partial', 'cancelled'].includes(phase) ? 'is-failed' : 'is-running'}" aria-hidden="true">${phase === 'completed' ? '✓' : ['failed', 'partial', 'cancelled'].includes(phase) ? '!' : '<span></span>'}</span><h4>批量导出薪资明细</h4></div><dl class="payroll-export-card-fields"><div><dt>员工</dt><dd>${escape(job.input.records.map(record => record.employee.name).join('、'))}</dd></div><div><dt>信息类型</dt><dd><span class="payroll-export-type-badge">${job.input.options.detailType === 'summary' ? '精简' : '详细'}</span></dd></div><div><dt>导出时间</dt><dd>${escape(job.submittedAt.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }))}</dd></div><div><dt>状态</dt><dd class="payroll-export-state-text">${phase === 'generating' ? `已处理 ${state.completed} / ${state.total} 名员工` : escape(labels[phase])}</dd></div></dl>${['idle', 'preparing', 'generating', 'packaging', 'cancelling'].includes(phase) ? `<progress max="100" value="${percent}" aria-label="导出任务进度"></progress>` : ''}${downloadErrors.has(job.id) ? '<p class="is-error">PDF 已生成，但自动下载触发失败，请重新提交导出。</p>' : ''}${state.errorMessage ? `<p class="is-error">${escape(state.errorMessage)}</p>` : ''}${(state.result?.failures ?? []).map(item => `<p class="is-error">${escape(item.employeeName)}：${escape(item.message)}</p>`).join('')}${state.result?.skippedIds.length ? `<p>无薪资数据，跳过 ${state.result.skippedIds.length} 人</p>` : ''}${['failed', 'partial', 'cancelled'].includes(phase) ? `<button type="button" data-export-retry="${job.id}">重新导出</button>` : ''}</article>`;
    }).join('') || '<p>暂无导出任务</p>';
  }
  root.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    if (target.hasAttribute('data-export-open')) { returnFocus = target; drawer.hidden = false; drawer.querySelector<HTMLButtonElement>('[data-export-close]')?.focus(); }
    if (target.hasAttribute('data-export-close')) { drawer.hidden = true; returnFocus?.focus(); }
    if (target.dataset.exportRetry) { downloaded.delete(target.dataset.exportRetry); downloadErrors.delete(target.dataset.exportRetry); queue.retry(target.dataset.exportRetry); }
  }, { signal: abort.signal });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && !drawer.hidden) { drawer.hidden = true; returnFocus?.focus(); } }, { signal: abort.signal });
  const unsubscribe = queue.subscribe(render);
  render();
  return { submit: queue.submit, hasPending: queue.hasPending, destroy() { abort.abort(); unsubscribe(); queue.destroy(); urls.forEach(url => URL.revokeObjectURL(url)); entry.remove(); surface.remove(); } };
}
