const inputClass = 'mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
function field(label: string, name: string, placeholder: string, required = true, type = 'text'): string {
  return `<label class="block text-sm text-slate-600">${label}${required ? '<span class="ml-1 text-red-500">*</span>' : ''}<input class="${inputClass}" name="${name}" placeholder="${placeholder}" type="${type}" ${required ? 'required' : ''} autocomplete="off"></label>`;
}
export function renderPageRegistrationCreateDialog(): string {
  return `<div class="fixed inset-0 z-[155] flex items-center justify-center bg-slate-950/40 p-4" data-page-overlay>
    <section role="dialog" aria-modal="true" aria-labelledby="page-modal-title" class="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" data-page-modal>
      <header class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5"><h2 id="page-modal-title" class="text-lg font-semibold text-slate-900">注册页面</h2><button type="button" data-page-close aria-label="关闭" class="h-8 w-8 rounded-lg text-xl text-slate-400 hover:bg-slate-100">×</button></header>
      <div class="min-h-0 flex-1 overflow-auto p-6"><p class="mb-5 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">仅保存在当前浏览器及本站点，刷新后保留；不跨浏览器或端口同步。注册只声明已有页面，不创建业务页面，不自动关联或发布菜单。</p>
        <form id="local-page-registration-form" data-page-registration-form class="grid gap-5 sm:grid-cols-2">
          ${field('页面名称', 'title', '例如：商品列表')}${field('页面唯一标识', 'id', '例如：merchant.products.list')}
          ${field('维护模块', 'module', '例如：商品中心')}${field('英文名称', 'titleEn', '例如：Products', false)}
          <label class="block text-sm text-slate-600">页面类型<span class="ml-1 text-red-500">*</span><select name="type" data-page-registration-type class="${inputClass}"><option value="inner">项目内页面</option><option value="iframe">iframe 嵌入</option><option value="external">外部链接</option><option value="micro-app">微应用</option></select></label>
          ${field('商家后台路由', 'path', '例如：/brand-products/products')}
          <div class="hidden sm:col-span-2" hidden data-page-registration-url>${field('页面入口 URL', 'url', 'https://example.com/page', false, 'url')}</div>
          <div class="hidden sm:col-span-2" hidden data-page-registration-micro><div class="grid gap-5 sm:grid-cols-2">${field('微应用标识', 'microName', '例如：menu-products', false)}${field('应用入口 URL', 'microUrl', 'https://micro.example.com/app', false, 'url')}</div></div>
          <p class="hidden rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2" role="alert" data-page-registration-error></p>
        </form>
      </div>
      <footer class="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" data-page-close class="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50">取消</button><button type="submit" form="local-page-registration-form" data-page-registration-save class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">保存注册</button></footer>
    </section></div>`;
}
export function syncPageRegistrationType(form: HTMLFormElement): void {
  const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
  for (const [selector, shown, names] of [
    ['[data-page-registration-url]', type === 'iframe' || type === 'external', ['url']],
    ['[data-page-registration-micro]', type === 'micro-app', ['microName', 'microUrl']],
  ] as const) {
    const block = form.querySelector<HTMLElement>(selector)!;
    block.hidden = !shown; block.classList.toggle('hidden', !shown);
    for (const name of names) { const input = form.elements.namedItem(name) as HTMLInputElement; input.required = shown; input.disabled = !shown; }
  }
}
