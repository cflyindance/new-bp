const MODAL_SELECTOR = "[data-pit-admin-dialog],[data-pit-user-dialog],[data-pit-trash-dialog]";
const FOCUSABLE_SELECTOR = "button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex='-1'])";
type TriggerReference = { element: HTMLElement; selector: string | null };
const triggers = new WeakMap<Element, TriggerReference>();
const suppressedRestore = new WeakSet<Element>();

function modalElements(root: ParentNode): HTMLElement[] {
  const result: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.matches(MODAL_SELECTOR)) result.push(root);
  result.push(...Array.from(root.querySelectorAll<HTMLElement>(MODAL_SELECTOR)));
  return result;
}

function meaningfulFocus(modal: HTMLElement): HTMLElement | null {
  return modal.querySelector<HTMLElement>("[autofocus],input:not([type=hidden]):not([readonly]):not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])");
}

function triggerReference(trigger: HTMLElement): TriggerReference {
  const dataKey = Object.keys(trigger.dataset).find((key) => key.startsWith("pit"));
  const attribute = dataKey ? `data-${dataKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}` : null;
  return { element: trigger, selector: attribute ? `[${attribute}]` : null };
}

export function openPitAdminModal(host: HTMLElement, html: string, trigger?: HTMLElement | null): HTMLElement | null {
  const previous = host.querySelector<HTMLElement>(MODAL_SELECTOR);
  const previousTrigger = previous ? triggers.get(previous) : null;
  const resolvedTrigger = trigger ? triggerReference(trigger) : previousTrigger;
  if (previous) suppressedRestore.add(previous);
  host.innerHTML = html;
  const modal = host.querySelector<HTMLElement>(MODAL_SELECTOR);
  if (!modal) return null;
  if (resolvedTrigger) triggers.set(modal, resolvedTrigger);
  queueMicrotask(() => meaningfulFocus(modal)?.focus());
  return modal;
}

export function pitAdminModalTrigger(modal: Element | null): HTMLElement | null {
  return modal ? triggers.get(modal)?.element ?? null : null;
}

export function bindPitAdminModalAccessibility(root: HTMLElement, signal: AbortSignal): void {
  const observer = new MutationObserver((records) => {
    for (const record of records) for (const removed of Array.from(record.removedNodes)) {
      if (!(removed instanceof HTMLElement)) continue;
      for (const modal of modalElements(removed)) {
        if (suppressedRestore.has(modal)) continue;
        const reference = triggers.get(modal);
        const trigger = reference?.element.isConnected ? reference.element : reference?.selector ? document.querySelector<HTMLElement>(reference.selector) : null;
        if (trigger) queueMicrotask(() => trigger.focus());
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  root.addEventListener("keydown", (event) => {
    const modals = Array.from(root.querySelectorAll<HTMLElement>(MODAL_SELECTOR));
    const modal = modals.at(-1); if (!modal) return;
    if (event.key === "Escape") {
      const cancel = modal.querySelector<HTMLElement>("[data-pit-dialog-cancel],[data-pit-user-dialog-cancel],[data-pit-trash-dialog-cancel]");
      if (cancel) { event.preventDefault(); cancel.click(); }
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((item) => item.getClientRects().length > 0 || item === document.activeElement);
    if (!focusable.length) { event.preventDefault(); modal.querySelector<HTMLElement>("[role=dialog]")?.focus(); return; }
    const first = focusable[0]; const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (!modal.contains(document.activeElement)) { event.preventDefault(); first.focus(); }
  }, { signal });
}
