/** Hints for explicit planning markers, including dynamically inserted controls. */
export function bindTipsPlanningHints(shadow: ShadowRoot, root: HTMLElement): () => void {
  const controller = new AbortController();
  const bubble = document.createElement('div');
  bubble.className = 'tipout-planning-tooltip';
  bubble.id = 'tipout-planning-tooltip-' + Math.random().toString(36).slice(2);
  bubble.role = 'tooltip';
  bubble.hidden = true;
  bubble.setAttribute('popover', 'manual');
  shadow.append(bubble);
  let active: HTMLElement | null = null;
  let originalDescription: string | null = null;
  const hide = () => {
    if (active) {
      if (originalDescription === null) active.removeAttribute('aria-describedby');
      else active.setAttribute('aria-describedby', originalDescription);
    }
    active = null;
    if (bubble.matches(':popover-open')) bubble.hidePopover();
    bubble.hidden = true;
  };
  const target = (event: Event) => (event.target as Element | null)?.closest<HTMLElement>('[data-planning-hint]') ?? null;
  const show = (element: HTMLElement) => {
    if (active === element) return;
    hide(); active = element;
    originalDescription = element.getAttribute('aria-describedby');
    element.setAttribute('aria-describedby', [originalDescription, bubble.id].filter(Boolean).join(' '));
    bubble.textContent = element.dataset.planningHint ?? '';
    bubble.hidden = false;
    bubble.showPopover();
    const rect = element.getBoundingClientRect(), size = bubble.getBoundingClientRect();
    bubble.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - size.width - 8)) + 'px';
    bubble.style.top = Math.max(8, rect.top >= size.height + 12 ? rect.top - size.height - 8 : Math.min(rect.bottom + 8, window.innerHeight - size.height - 8)) + 'px';
  };
  const options = {signal: controller.signal};
  root.addEventListener('mouseover', event => { const el = target(event); if (el) show(el); else hide(); }, options);
  root.addEventListener('mouseout', event => { if (active && !active.contains(event.relatedTarget as Node | null)) hide(); }, options);
  root.addEventListener('focusin', event => { const el = target(event); if (el) show(el); }, options);
  root.addEventListener('focusout', hide, options);
  root.addEventListener('click', hide, options);
  root.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); }, options);
  window.addEventListener('scroll', hide, {...options, capture:true});
  window.addEventListener('resize', hide, options);
  return () => { hide(); controller.abort(); bubble.remove(); };
}
