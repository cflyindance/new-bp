import { createDeclarationBatch, type AssignmentEmployee, type AssignmentPreview } from './payroll-declaration-batch';
import type { createDeclarationManagement } from './payroll-declaration-management';
import type { PayrollRuntimeHandle } from './payroll-legacy-runtime';
import type { PayrollPageContext } from './payroll-context';
import type { DeclarationTemplateFamily } from './payroll-declaration-types';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function createDeclarationAssignmentDialog(parent: HTMLElement, manager: ReturnType<typeof createDeclarationManagement>, runtime: PayrollRuntimeHandle, context: PayrollPageContext, onSaved?: (message: string) => void) {
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', '批量分配员工');
  dialog.className = 'payroll-declaration-assignment';
  parent.append(dialog);
  let family: DeclarationTemplateFamily;
  let rows: AssignmentEmployee[] = [];
  let selected = new Set<string>();
  let query = '', store = '', message = '', busy = false;
  let preview: AssignmentPreview | null = null;
  let token = 0;
  let names = new Map<string,string>();
  let returnFocus: HTMLElement | null = null;
  let cancelConfirmation: (() => void) | null = null;
  const confirmAssignment = (summary: string): Promise<boolean> => new Promise(resolve => {
    const confirmation = document.createElement('dialog');
    confirmation.className = 'payroll-declaration-assignment';
    confirmation.style.width = 'min(480px, calc(100vw - 32px))';
    confirmation.setAttribute('aria-label', '确认分配员工');
    confirmation.innerHTML = `<h2>确认分配员工</h2><p>${esc(summary)}是否继续？</p><div style="display:flex;justify-content:flex-end;gap:12px"><button data-cancel>取消</button><button data-confirm>确认分配</button></div>`;
    let finished = false;
    const finish = (accepted: boolean) => {
      if (finished) return;
      finished = true; confirmation.close(); confirmation.remove(); cancelConfirmation = null; resolve(accepted);
    };
    cancelConfirmation = () => finish(false);
    confirmation.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
    confirmation.querySelector('[data-cancel]')!.addEventListener('click', () => finish(false));
    confirmation.querySelector('[data-confirm]')!.addEventListener('click', () => finish(true));
    parent.append(confirmation); confirmation.showModal();
    confirmation.querySelector<HTMLElement>('[data-cancel]')!.focus();
  });
  const generation = () => JSON.stringify(context.getScope());
  const rawStores = new Map<string,string>();
  const listEmployees = async () => {
    const scope = context.getScope();
    const stores = manager.stores();
    const unique = new Map<string, AssignmentEmployee>();
    for (const e of runtime.getDeclarationEmployees()) {
      const hits = stores.filter(s => [s.id,s.labelZh,s.labelEn].includes(String(e.store || '')));
      if (hits.length !== 1) continue;
      const storeId = hits[0].id;
      if (family.scope.storeId && family.scope.storeId !== storeId) continue;
      const key = JSON.stringify([scope.brandId,storeId,e.id || `unavailable:${e.__rosterId}`]);
      if (unique.has(key)) continue;
      rawStores.set(key, String(e.store || ''));
      unique.set(key, { key, employeeId:e.id,storeId,name:e.name,employeeNumber:String(e.adpFile || ''), unavailableReason: e.id ? undefined : '无法识别员工，请刷新后重试', preference: e.id ? await manager.repositoryFor(storeId).loadEmployeePreference(e.id) ?? (e.declarationPreference ? { ...e.declarationPreference,employeeId:e.id,updatedAt:'',updatedBy:'' } : null) : null });
    }
    return [...unique.values()];
  };
  const batch = createDeclarationBatch({ repositoryFor: manager.repositoryFor, listEmployees, generation, applySaved: (e,p) => runtime.applyDeclarationPreference(e.employeeId,rawStores.get(e.key) || '',p) });
  const filtered = () => rows.filter(e => (!store || e.storeId === store) && `${e.name} ${e.employeeNumber}`.toLowerCase().includes(query.toLowerCase()));
  const paint = () => {
    dialog.innerHTML = `<header style="display:flex;justify-content:space-between"><h2>批量分配员工</h2><button data-close ${busy?'disabled':''}>关闭</button></header><p>${esc(family.languageDisplayName)} · 使用当前已发布模板</p>
    <label>门店 <select data-store ${busy || family.scope.storeId?'disabled':''}><option value="">全部适用门店</option>${manager.stores().filter(s=>!family.scope.storeId || s.id===family.scope.storeId).map(s=>`<option value="${esc(s.id)}" ${store===s.id?'selected':''}>${esc(s.labelZh)}</option>`).join('')}</select></label>
    <label>搜索员工 <input data-search value="${esc(query)}" placeholder="姓名或工号" ${busy?'disabled':''}></label>
    <div style="max-height:48vh;overflow:auto;margin:16px 0"><table style="width:100%;border-collapse:collapse"><thead><tr><th><input type="checkbox" data-all aria-label="全选当前筛选员工" ${busy?'disabled':''}></th><th>员工姓名</th><th>工号</th><th>门店</th><th>当前模板</th></tr></thead><tbody>${filtered().map(e=>`<tr><td><input type="checkbox" data-key="${esc(e.key)}" aria-label="选择 ${esc(e.name)}" ${selected.has(e.key)?'checked':''} ${busy || e.preference?.defaultFamilyId===family.familyId?'disabled':''}></td><td>${esc(e.name)}</td><td>${esc(e.employeeNumber)}</td><td>${esc(manager.stores().find(s=>s.id===e.storeId)?.labelZh)}</td><td>${e.preference?.defaultFamilyId===family.familyId?'已应用':esc(names.get(e.preference?.defaultFamilyId || '') || (e.preference && e.preference.defaultFamilyId!=='system-default'?'原模板（已不可用）':'系统默认语言'))}</td></tr>`).join('') || '<tr><td colspan="5">没有匹配员工</td></tr>'}</tbody></table></div>
    <p aria-live="polite">${esc(message)}</p><p>已选择 ${selected.size} 名员工</p><button data-submit ${busy || !selected.size?'disabled':''}>${busy?'处理中…':'确认'}</button>`;
    dialog.querySelectorAll<HTMLInputElement>('[data-key]').forEach(checkbox => {
      const row = rows.find(e => e.key === checkbox.dataset.key);
      const cell = checkbox.closest('tr')?.lastElementChild;
      if (!row || !cell) return;
      if (row.preference?.defaultFamilyId === family.familyId) {
        cell.textContent = `${names.get(family.familyId) || family.languageDisplayName} · 已应用`;
      }
      if (row.unavailableReason) {
        checkbox.disabled = true;
        checkbox.title = row.unavailableReason;
      }
    });
  };
  const close = () => { if (busy) return; token++; dialog.close(); returnFocus?.focus(); };
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('input', e => {
    const target = e.target as HTMLInputElement;
    if (!target.matches('[data-search]')) return;
    query = target.value; selected.clear(); preview = null; message = ''; paint();
    const search = dialog.querySelector<HTMLInputElement>('[data-search]')!; search.focus(); search.setSelectionRange(query.length,query.length);
  });
  dialog.addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    if (target.matches('[data-store]')) { store=target.value; selected.clear(); }
    if (target.matches('[data-all]')) selected = new Set(target.checked ? filtered().filter(r=>!r.unavailableReason && r.preference?.defaultFamilyId!==family.familyId).map(r=>r.key) : []);
    if (target.dataset.key) { if (target.checked && !rows.find(r=>r.key===target.dataset.key)?.unavailableReason) selected.add(target.dataset.key); else selected.delete(target.dataset.key); }
    preview=null; message=''; paint();
  });
  dialog.addEventListener('click', async e => {
    const target = e.target as Element;
    if (target.closest('[data-close]')) { close(); return; }
    if (!target.closest('[data-submit]') || busy) return;
    const current = token;
    busy=true; paint();
    try {
      preview=await batch.prepareAssignment(family.familyId,rows.filter(r=>selected.has(r.key)));
      if (current !== token) return;
      const summary=`将为 ${preview.employees.filter(r=>r.preference?.defaultFamilyId!==family.familyId).length} 名员工应用此模板，其中 ${preview.replacements} 名员工的原模板将被替换。`;
      if (!await confirmAssignment(summary) || current !== token) return;
      {
        const result=await batch.executeAssignment(preview);
        if (current !== token) return;
        preview=null;
        if (result.requiresConfirmation) message='员工模板已变化，请重新确认分配。';
        else {
          message=`成功 ${result.succeeded.length}，失败 ${result.failed.length}，跳过 ${result.skipped.length}。${result.failed.map(f=>`${f.employee.name}：${f.message}`).join('；')}${result.failed.length?' 可再次点击确认重试失败员工。':''}`;
          selected=new Set(result.failed.map(f=>f.employee.key));
          if (!result.failed.length) {
            busy=false; close(); onSaved?.(`分配完成：成功 ${result.succeeded.length}，跳过 ${result.skipped.length}。`); return;
          }
          if (result.succeeded.length) onSaved?.(message);
        }
        rows=await listEmployees();
      }
    } catch(error) { preview=null; message=error instanceof Error?error.message:'操作失败'; }
    finally { busy=false; if(current===token) paint(); }
  });
  const unsubscribe=context.subscribeScopeChange(()=>{token++; cancelConfirmation?.(); dialog.close();});
  return {
    async open(value: DeclarationTemplateFamily) {
      family=value; selected.clear(); preview=null; query='';store=value.scope.storeId || '';message='正在加载员工…';rows=[];busy=true;
      returnFocus=(parent.getRootNode() as ShadowRoot).activeElement as HTMLElement;
      const current=++token;paint();dialog.showModal();
      try { const templates=await manager.listTemplates();names=new Map(templates.families.map(f=>[f.familyId,f.languageDisplayName]));rows=await listEmployees();message=''; }
      catch(error){message=error instanceof Error?error.message:'员工加载失败';}
      finally{busy=false;if(current===token)paint();}
    },
    destroy(){token++;cancelConfirmation?.();unsubscribe();dialog.remove();},
  };
}
