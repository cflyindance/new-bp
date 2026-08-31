import { isPitApiError } from "./pit-api-error";
import { pitApi } from "./pit-api";
import { hasPitFormErrors, pickPitFieldErrors, validatePitLoginInput, type PitFormErrors } from "./pit-form-validation";
import { setPitSession } from "./pit-session";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPitLoginPage(message = ""): string {
  return `
    <section data-pit-login class="mx-auto grid min-h-full w-full max-w-6xl place-items-center px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-10" aria-labelledby="pit-login-title">
      <div class="hidden max-w-xl lg:block">
        <p class="text-xs font-bold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-400">Product Intake &amp; Tracking</p>
        <h1 class="mt-5 text-5xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 dark:text-white">让每一条需求<br><span class="text-amber-700 dark:text-amber-400">都有清晰去向。</span></h1>
        <p class="mt-6 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">统一收集、评审、排期和跟踪周边产品需求。数据只保存在当前 PIT 服务器，并通过局域网安全协作。</p>
        <div class="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 dark:border-slate-700 dark:bg-slate-700">
          ${[["01", "收口"], ["02", "决策"], ["03", "交付"]].map(([number, label]) => `<div class="bg-white/90 px-5 py-4 dark:bg-slate-900/90"><p class="font-mono text-xs text-amber-700 dark:text-amber-400">${number}</p><p class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">${label}</p></div>`).join("")}
        </div>
      </div>
      <div class="w-full max-w-md rounded-[1.75rem] border border-slate-200/90 bg-white/95 p-6 shadow-[0_24px_70px_-32px_rgba(15,23,42,.35)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:p-8">
        <div class="flex items-center gap-4">
          <span class="grid size-12 place-items-center rounded-2xl bg-slate-950 font-mono text-sm font-bold tracking-[0.12em] text-amber-300 shadow-lg shadow-slate-950/20 dark:bg-amber-400 dark:text-slate-950">PIT</span>
          <div><p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Requirement Operations</p><h2 id="pit-login-title" class="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">登录需求池</h2></div>
        </div>
        <p class="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">使用 PIT 本地账号登录。此账号与商家后台账号相互独立。</p>
        <form data-pit-login-form class="mt-7 space-y-5" novalidate>
          <label class="block"><span class="text-sm font-medium text-slate-800 dark:text-slate-200">用户名</span><input name="username" autocomplete="username" required autofocus aria-describedby="pit-login-username-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder="输入用户名"><span id="pit-login-username-error" data-pit-field-error="username" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
          <label class="block"><span class="text-sm font-medium text-slate-800 dark:text-slate-200">密码</span><input name="password" type="password" autocomplete="current-password" required aria-describedby="pit-login-password-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder="输入密码"><span id="pit-login-password-error" data-pit-field-error="password" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
          <div data-pit-form-error role="alert" class="${message ? "" : "hidden"} rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">${escapeHtml(message)}</div>
          <button data-pit-login-submit type="submit" class="inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 disabled:cursor-wait disabled:opacity-60 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300">登录 PIT</button>
        </form>
        <p class="mt-6 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 dark:border-slate-700">会话凭据仅保存在安全 Cookie 与当前页面内存中，不会写入浏览器存储。</p>
      </div>
    </section>`;
}

function applyFieldErrors(root: HTMLElement, errors: PitFormErrors): void {
  root.querySelectorAll<HTMLElement>("[data-pit-field-error]").forEach((element) => {
    const field = element.dataset.pitFieldError ?? "";
    const message = errors[field] ?? "";
    element.textContent = message;
    element.classList.toggle("hidden", !message);
    root.querySelector<HTMLInputElement>(`[name="${field}"]`)?.setAttribute("aria-invalid", message ? "true" : "false");
  });
}

export function bindPitLoginPage(root: HTMLElement, options: { onAuthenticated: () => void; onOffline: (message: string) => void; isActive?: () => boolean }): void {
  const form = root.querySelector<HTMLFormElement>("[data-pit-login-form]");
  const submit = root.querySelector<HTMLButtonElement>("[data-pit-login-submit]");
  const errorBox = root.querySelector<HTMLElement>("[data-pit-form-error]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (options.isActive?.() === false) return;
    if (!form || !submit || !errorBox) return;
    const data = new FormData(form);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const validationErrors = validatePitLoginInput({ username, password });
    applyFieldErrors(root, validationErrors);
    if (hasPitFormErrors(validationErrors)) {
      errorBox.classList.add("hidden");
      return;
    }
    submit.disabled = true;
    submit.textContent = "正在验证…";
    errorBox.classList.add("hidden");
    try {
      await pitApi.login({ username, password });
      const auth = await pitApi.me();
      if (options.isActive?.() === false) return;
      setPitSession(auth);
      options.onAuthenticated();
    } catch (error) {
      if (options.isActive?.() === false) return;
      const message = isPitApiError(error) ? error.message : "登录失败，请稍后重试。";
      const fieldErrors = isPitApiError(error) ? pickPitFieldErrors(error.fields, ["username", "password"]) : {};
      applyFieldErrors(root, fieldErrors);
      if (isPitApiError(error) && error.status === 0) options.onOffline(message);
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
      submit.disabled = false;
      submit.textContent = "登录 PIT";
    }
  });
}
