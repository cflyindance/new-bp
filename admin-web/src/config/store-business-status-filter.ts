import { storeBusinessLabels } from './store-business-status';

export function storeBusinessStatusFilter(selected = '', detail = false): string {
  return `<select class="brand-store-status-filter" data-store-status-filter name="operatingStatus" aria-label="营业状态">
    <option value="">营业状态</option>
    ${Object.entries(storeBusinessLabels).map(([value,label]) => `<option value="${value}"${selected===value?' selected':''}>${detail&&value==='open'?'营业中':detail&&value==='terminated'?'关店':label}</option>`).join('')}
  </select>`;
}

export function bindStoreBusinessStatusFilter(container: HTMLElement): void {
  const filter = container.querySelector<HTMLSelectElement>('[data-store-status-filter]');
  filter?.addEventListener('change', () => {
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-operating-status]'));
    rows.forEach(row => { row.hidden = !!filter.value && row.dataset.operatingStatus !== filter.value; });
    const empty = container.querySelector<HTMLElement>('[data-operating-empty]');
    if (empty) empty.hidden = rows.some(row => !row.hidden);
  });
}
