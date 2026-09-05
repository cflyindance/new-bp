import payrollCss from "./payroll/payroll-page.css?raw";
import payrollPolishCss from "./payroll/payroll-polish.css?raw";
import { createPayrollPageContext, type PayrollPageContext } from "./payroll/payroll-context";
import { mountLegacyPayrollRuntime, type PayrollRuntimeHandle } from "./payroll/payroll-legacy-runtime";
import { renderPayrollPageTemplate } from "./payroll/payroll-template";
import { mountPayrollBatchExportController, type PayrollBatchExportControllerHandle } from "./payroll/payroll-batch-export-controller";

export interface PayrollPageHandle {
  destroy(): void;
}

const mountedPages = new WeakMap<HTMLElement, PayrollPageHandle>();

export function mountPayrollPage(
  container: HTMLElement,
  context: PayrollPageContext = createPayrollPageContext(),
): PayrollPageHandle {
  mountedPages.get(container)?.destroy();

  const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadowRoot.innerHTML = `<style>${payrollCss}</style><style>${payrollPolishCss}</style>${renderPayrollPageTemplate()}`;
  const pageRoot = shadowRoot.querySelector<HTMLElement>("[data-team-payroll-page]");
  if (!pageRoot) throw new Error("Native Payroll page root was not rendered.");

  const scrollOwner = container.closest<HTMLElement>("[data-team-payroll-scroll]");
  const handleWheel = (event: WheelEvent): void => {
    if (!scrollOwner || event.deltaY === 0) return;
    const eventPath = event.composedPath();
    const isModalInteraction = eventPath.some(
      (node) => node instanceof HTMLElement && node.classList.contains("modal-overlay") && node.classList.contains("show"),
    );
    if (isModalInteraction) return;
    const before = scrollOwner.scrollTop;
    scrollOwner.scrollTop += event.deltaY;
    if (scrollOwner.scrollTop !== before) event.preventDefault();
  };
  container.addEventListener("wheel", handleWheel, { passive: false });

  let runtime: PayrollRuntimeHandle | null = mountLegacyPayrollRuntime(shadowRoot, pageRoot, context);
  let batchExport: PayrollBatchExportControllerHandle | null = mountPayrollBatchExportController(
    shadowRoot,
    pageRoot,
    runtime.getBatchBridge(),
  );
  const handle: PayrollPageHandle = {
    destroy() {
      batchExport?.destroy();
      batchExport = null;
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
