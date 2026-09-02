import payrollCss from "./payroll/payroll-page.css?raw";
import payrollPolishCss from "./payroll/payroll-polish.css?raw";
import { createPayrollPageContext, type PayrollPageContext } from "./payroll/payroll-context";
import { mountLegacyPayrollRuntime, type PayrollRuntimeHandle } from "./payroll/payroll-legacy-runtime";
import { renderPayrollPageTemplate } from "./payroll/payroll-template";

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

  let runtime: PayrollRuntimeHandle | null = mountLegacyPayrollRuntime(shadowRoot, pageRoot, context);
  const handle: PayrollPageHandle = {
    destroy() {
      runtime?.destroy();
      runtime = null;
      shadowRoot.innerHTML = "";
      mountedPages.delete(container);
    },
  };
  mountedPages.set(container, handle);
  return handle;
}
