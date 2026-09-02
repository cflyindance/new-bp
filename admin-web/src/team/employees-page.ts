import pageCss from "./employees/employees-page.css?raw";
import shellCss from "./employees/employees-shell.css?raw";
import { createEmployeesPageContext, type EmployeesPageContext } from "./employees/employees-context";
import { mountLegacyEmployeesRuntime, type EmployeesRuntimeHandle } from "./employees/employees-legacy-runtime";
import { renderEmployeesPageTemplate } from "./employees/employees-template";

export interface EmployeesPageHandle {
  destroy(): void;
}

const mountedPages = new WeakMap<HTMLElement, EmployeesPageHandle>();

function canScroll(element: HTMLElement, deltaY: number): boolean {
  if (element.scrollHeight <= element.clientHeight) return false;
  if (deltaY < 0) return element.scrollTop > 0;
  return element.scrollTop + element.clientHeight < element.scrollHeight;
}

export function mountEmployeesPage(
  container: HTMLElement,
  context: EmployeesPageContext = createEmployeesPageContext(),
): EmployeesPageHandle {
  mountedPages.get(container)?.destroy();
  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `<style>${pageCss}</style><style>${shellCss}</style>${renderEmployeesPageTemplate()}`;
  const pageRoot = shadowRoot.querySelector<HTMLElement>("[data-team-employees-page]");
  if (!pageRoot) throw new Error("Native employees page root was not rendered.");

  const scrollOwner = container.closest<HTMLElement>("[data-team-employees-scroll]");
  const handleWheel = (event: WheelEvent): void => {
    if (!scrollOwner || event.deltaY === 0) return;
    const path = event.composedPath();
    const visibleModal = path.find(
      (node): node is HTMLElement => node instanceof HTMLElement && node.classList.contains("modal-overlay") && node.classList.contains("show"),
    );
    if (visibleModal) {
      const localScroller = path.find((node): node is HTMLElement => node instanceof HTMLElement && canScroll(node, event.deltaY));
      if (localScroller) return;
    }
    const before = scrollOwner.scrollTop;
    scrollOwner.scrollTop += event.deltaY;
    if (scrollOwner.scrollTop !== before) event.preventDefault();
  };
  container.addEventListener("wheel", handleWheel, { passive: false });

  let runtime: EmployeesRuntimeHandle | null = null;
  try {
    runtime = mountLegacyEmployeesRuntime(shadowRoot, pageRoot, context);
  } catch (error) {
    console.error("Native employees page initialization failed", error);
    shadowRoot.innerHTML = `<style>${shellCss}</style><div class="team-employees-error" role="alert">员工与岗位页面加载失败，请刷新后重试。</div>`;
  }

  const handle: EmployeesPageHandle = {
    destroy() {
      runtime?.destroy();
      runtime = null;
      container.removeEventListener("wheel", handleWheel);
      shadowRoot.innerHTML = "";
      mountedPages.delete(container);
    },
  };
  mountedPages.set(container, handle);
  return handle;
}
