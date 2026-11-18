import './brand-more-actions.css';

const dots = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
const icon = (path: string) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const documentIcon = icon('<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Zm0 0v7h7"/>');
const editIcon = icon('<path d="m15 5 4 4M4 20l4-1L20 7l-4-4L4 15z"/>');

export function renderBrandMoreActions(label: string, actions: string): string {
  return `<div class="brand-more" data-brand-more><button type="button" data-brand-more-trigger aria-haspopup="menu" aria-expanded="false" aria-label="${label}">${dots}</button><div class="brand-more-popover" popover="auto" role="menu" aria-label="${label}">${actions}</div></div>`;
}

export function bindBrandMoreActions(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-brand-more]').forEach(wrapper => {
    const trigger = wrapper.querySelector<HTMLButtonElement>('[data-brand-more-trigger]')!;
    const popup = wrapper.querySelector<HTMLElement>('[popover]')!;
    const items = [...popup.querySelectorAll<HTMLElement>('a,button')];
    const isOpen = () => popup.matches(':popover-open');
    const close = (restore = false) => {
      if (isOpen()) popup.hidePopover();
      if (restore && trigger.isConnected) trigger.focus({preventScroll:true});
    };
    const open = (last = false) => {
      if (!isOpen()) popup.showPopover();
      const anchor = trigger.getBoundingClientRect();
      const {width, height} = popup.getBoundingClientRect();
      const top = anchor.bottom + 6 + height <= innerHeight - 8
        ? anchor.bottom + 6
        : Math.max(8, Math.min(anchor.top - height - 6,innerHeight - height - 8));
      popup.style.left = Math.max(8, Math.min(anchor.right - width, innerWidth - width - 8)) + 'px';
      popup.style.top = top + 'px';
      items[last ? items.length - 1 : 0]?.focus({preventScroll:true});
    };
    let pointerWasOpen = false;
    trigger.onpointerdown = () => { pointerWasOpen = isOpen(); };
    trigger.onpointercancel = () => { pointerWasOpen = false; };
    trigger.onclick = event => {
      const toggleOff = isOpen() || (event.detail > 0 && pointerWasOpen);
      pointerWasOpen = false;
      if (toggleOff) close();
      else open();
    };
    trigger.onkeydown = event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      open(event.key === 'ArrowUp');
    };
    popup.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(isOpen())));
    popup.onkeydown = event => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        if (event.key === 'Escape') event.preventDefault();
        close(true);
        return;
      }
      const index = items.indexOf(document.activeElement as HTMLElement);
      const navigation: Record<string, number> = {Home:0, End:items.length-1,
        ArrowDown:(index+1)%items.length, ArrowUp:(index-1+items.length)%items.length};
      if (!(event.key in navigation)) return;
      event.preventDefault();
      items[navigation[event.key]]?.focus({preventScroll:true});
    };
    items.forEach(item => {
      item.setAttribute('role', 'menuitem');
      item.tabIndex = -1;
      item.insertAdjacentHTML('afterbegin', /详情|查看/.test(item.textContent ?? '') ? documentIcon : editIcon);
      item.addEventListener('click', () => close(true), {capture:true});
    });
  });
}
