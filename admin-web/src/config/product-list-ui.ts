import "./product-list.css";

export interface ProductListRow {
  dishName: string;
  lineName: string;
  groupName: string;
  categoryName: string;
}
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const imagePlaceholder = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="15.5" cy="8.5" r="1.5"/><path d="m4 18 5-6 4 4 3-3 4 5"/></svg>`;

/** Read-only list. The caller owns which products are included; browsing never edits that scope. */
export function mountProductList(container: HTMLElement, rows: readonly ProductListRow[]): void {
  const filterFields = ["lineName", "groupName", "categoryName"] as const;
  const filterLabels = ["产线", "组", "类"];
  container.innerHTML = `<section class="mb-product-list" data-product-list>
    <div class="mb-product-list-toolbar">
      <label class="mb-product-list-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg><input type="search" placeholder="搜索商品名称" aria-label="搜索已选商品" data-product-list-search></label>
      ${filterFields.map((field, i) => `<label class="mb-product-list-filter"><span class="sr-only">${filterLabels[i]}</span><select aria-label="筛选${filterLabels[i]}" data-product-list-filter="${field}"><option value="">${filterLabels[i]}</option>${[...new Set(rows.map(row => row[field]))].map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join("")}</select></label>`).join("")}
      <button type="button" class="mb-product-list-reset" data-product-list-reset><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6M20 7l-3 1"/></svg>重置</button>
    </div>
    <div class="mb-product-list-table-wrap"><table data-menu-order-interval-selected-products><caption class="sr-only">当前规则已选择的商品</caption><thead><tr>${["商品", "产线", "组", "类"].map(label => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody data-product-list-rows></tbody></table><p class="mb-product-list-empty" data-product-list-empty hidden></p></div>
    <footer class="mb-product-list-pagination"><span role="status" aria-live="polite" data-product-list-count></span><div class="mb-product-list-page-actions"><nav aria-label="商品列表分页" data-product-list-pages></nav><select aria-label="每页商品数量" data-product-list-size>${[20, 50, 100].map(size => `<option value="${size}">${size} 条 / 页</option>`).join("")}</select></div></footer>
  </section>`;
  const root = container.querySelector<HTMLElement>("[data-product-list]")!;
  const search = root.querySelector<HTMLInputElement>("[data-product-list-search]")!;
  const filters = [...root.querySelectorAll<HTMLSelectElement>("[data-product-list-filter]")];
  const sizeSelect = root.querySelector<HTMLSelectElement>("[data-product-list-size]")!;
  const body = root.querySelector<HTMLElement>("[data-product-list-rows]")!;
  const empty = root.querySelector<HTMLElement>("[data-product-list-empty]")!;
  const pages = root.querySelector<HTMLElement>("[data-product-list-pages]")!;
  const scroll = root.querySelector<HTMLElement>(".mb-product-list-table-wrap")!;
  let page = 1;
  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = rows.filter(row => row.dishName.toLocaleLowerCase().includes(query) && filters.every(select => !select.value || row[select.dataset.productListFilter as typeof filterFields[number]] === select.value));
    const size = Number(sizeSelect.value);
    const totalPages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.max(1, Math.min(totalPages, page));
    body.innerHTML = filtered.slice((page - 1) * size, page * size).map(row => `<tr><td><div class="mb-product-list-name"><span class="mb-product-list-thumbnail" aria-hidden="true">${imagePlaceholder}</span><span>${escape(row.dishName)}</span></div></td><td>${escape(row.lineName)}</td><td>${escape(row.groupName)}</td><td>${escape(row.categoryName)}</td></tr>`).join("");
    empty.hidden = filtered.length > 0;
    empty.textContent = rows.length ? "没有匹配的商品" : "暂无已选商品";
    root.querySelector("[data-product-list-count]")!.textContent = query || filters.some(select => select.value) ? `共 ${filtered.length} 个商品（已选 ${rows.length} 个）` : `共 ${rows.length} 个商品`;
    const visiblePages = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(n => n > 1 && n < totalPages), totalPages])].sort((a, b) => a - b);
    pages.innerHTML = `<button type="button" data-product-list-page="${page - 1}" aria-label="上一页" ${page === 1 ? "disabled" : ""}>‹</button>${visiblePages.map((n, i) => `${i && n - visiblePages[i - 1] > 1 ? `<span aria-hidden="true">…</span>` : ""}<button type="button" data-product-list-page="${n}" aria-label="第${n}页" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`).join("")}<button type="button" data-product-list-page="${page + 1}" aria-label="下一页" ${page === totalPages ? "disabled" : ""}>›</button>`;
    scroll.scrollTop = 0;
  };
  search.addEventListener("input", () => { page = 1; render(); });
  root.addEventListener("change", event => {
    if ((event.target as Element).matches("[data-product-list-filter],[data-product-list-size]")) { page = 1; render(); }
  });
  root.addEventListener("click", event => {
    const target = event.target as Element;
    if (target.closest("[data-product-list-reset]")) {
      search.value = ""; filters.forEach(select => { select.value = ""; }); page = 1; render(); search.focus();
    }
    const button = target.closest<HTMLButtonElement>("[data-product-list-page]");
    if (button && !button.disabled) {
      page = Number(button.dataset.productListPage); render();
      pages.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
    }
  });
  render();
}
