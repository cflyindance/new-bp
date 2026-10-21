import { endMerchantImpersonation } from './enterprise-merchant-impersonate';

let pending = false;
const painted = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export async function runImpersonationWithLoading(button: HTMLButtonElement, enter: () => boolean, errorMessage: string): Promise<void> {
  if (pending || button.disabled) return;
  pending = true;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  const overlay = document.createElement('div');
  overlay.dataset.impersonationLoading = '';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.28);display:flex;align-items:center;justify-content:center;cursor:wait';
  overlay.innerHTML = `<div style="display:flex;align-items:center;gap:12px;padding:24px 32px;border-radius:12px;background:var(--background,#fff);color:var(--foreground,#102a43);box-shadow:0 12px 40px #0002"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" opacity=".2"/><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="3"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite"/></path></svg><span>正在登录，请稍后</span></div>`;
  // Keep the loading state outside the app root across route mounting.
  document.body.append(overlay);
  try {
    await painted();
    if (!enter()) throw new Error(errorMessage);
    await new Promise<void>((resolve, reject) => {
      const ready = () => !location.hash.startsWith('#/m-platform/') && !!document.querySelector('[data-merchant-impersonation-banner]');
      const observer = new MutationObserver(() => { if (ready()) finish(); });
      const timer = window.setTimeout(() => { observer.disconnect(); reject(new Error('登录超时，请重试。')); }, 15000);
      const finish = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
      observer.observe(document.body, { childList: true, subtree: true });
      if (ready()) finish();
    });
    await painted();
  } catch (error) {
    endMerchantImpersonation();
    overlay.remove();
    window.alert(error instanceof Error ? error.message : errorMessage);
  } finally {
    overlay.remove();
    button.disabled = false;
    button.removeAttribute('aria-busy');
    pending = false;
  }
}
