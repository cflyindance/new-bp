import type { TipsPageContext } from "./tips-context";
import type { TipsRoute } from "./tips-navigation";

export interface TipsEscapeHandle { destroy(): void }

const layerSelector = [
  "dialog[open]", ".modal-overlay.show", ".drawer-overlay.show", ".drawer.show",
  ".export-menu.show", ".add-option-menu.show", ".tipout-rule-more[aria-expanded='true']",
].join(",");

function isManagedControl(element: Element | null): boolean {
  return Boolean(element?.matches("select, [role='combobox'], input[list], [contenteditable='true']"));
}

export function createTipsEscapeController(shadow: ShadowRoot, route: TipsRoute, context: TipsPageContext): TipsEscapeHandle {
  const controller = new AbortController();
  let layerAtCapture: HTMLElement | null = null;
  let managedControlAtCapture = false;
  const capture = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    layerAtCapture = shadow.querySelector<HTMLElement>(layerSelector);
    managedControlAtCapture = isManagedControl(shadow.activeElement);
  };
  const bubble = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (event.defaultPrevented || managedControlAtCapture) return;
    if (layerAtCapture) {
      if (layerAtCapture.isConnected && layerAtCapture.matches(layerSelector)) {
        const close = layerAtCapture.closest(".modal-overlay,.drawer-overlay,.drawer")?.querySelector<HTMLElement>(".modal-close,[data-action*='close'],button[aria-label*='关闭']");
        if (close) close.click();
        else if (layerAtCapture.matches(".tipout-rule-more")) layerAtCapture.click();
        else layerAtCapture.classList.remove("show", "open");
      }
      event.preventDefault();
      event.stopPropagation();
      layerAtCapture = null;
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    context.navigate(route.view === "rule-editor" ? "/team/tips/rules" : "/team/tips/distribution");
  };
  window.addEventListener("keydown", capture, { capture: true, signal: controller.signal });
  window.addEventListener("keydown", bubble, { signal: controller.signal });
  return { destroy() { controller.abort(); layerAtCapture = null; } };
}
