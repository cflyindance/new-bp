/** Shared parent/child navigation behavior for merchant and M platform shells. */
export interface SubmenuActions {
  back: () => void;
  open: (hubId: string, controls: string, title: string) => void;
  keepLeaf: () => boolean;
}
export function bindNavigationSubmenuActions(root: HTMLElement, actions: SubmenuActions): void {
  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const target = event.target, sheet = target.closest<HTMLElement>('[data-hub-sheet-root]');
    if (!sheet) return;
    if (target.closest('[data-navigation-sheet-back]')) {
      event.preventDefault(); event.stopImmediatePropagation(); actions.back(); return;
    }
    const button = target.closest<HTMLButtonElement>('button[aria-controls]');
    if (button && sheet.contains(button)) {
      const controls = button.getAttribute('aria-controls');
      const children = [...sheet.querySelectorAll<HTMLElement>('[id]')].find(el => el.id === controls);
      if (controls && children?.querySelector('a[href],button')) {
        event.preventDefault(); event.stopImmediatePropagation();
        const title = button.querySelector('span')?.textContent?.trim() || button.textContent?.trim() || '';
        actions.open(sheet.dataset.hubSheetRoot!, controls, title); return;
      }
    }
    if (actions.keepLeaf() && target.closest("a[href^='#']")) event.stopImmediatePropagation();
  }, { capture: true });
}
