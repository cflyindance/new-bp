import { isPitApiError } from "./pit-api-error";
import { pitApi } from "./pit-api";
import { hasPitFormErrors, pickPitFieldErrors, validatePitSetupInput, type PitFormErrors } from "./pit-form-validation";
import { setPitSession } from "./pit-session";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPitSetupPage(message = ""): string {
  return `
    <section data-pit-setup class="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center px-5 py-10" aria-labelledby="pit-setup-title">
      <div class="grid w-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_80px_-38px_rgba(15,23,42,.42)] dark:border-slate-700 dark:bg-slate-900 md:grid-cols-[.72fr_1.28fr]">
        <aside class="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-9">
          <div class="absolute -right-20 -top-20 size-56 rounded-full border border-amber-300/20"></div><div class="absolute -right-8 -top-8 size-32 rounded-full border border-amber-300/30"></div>
          <span class="grid size-12 place-items-center rounded-2xl bg-amber-400 font-mono text-sm font-bold tracking-[0.12em] text-slate-950">PIT</span>
          <p class="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-amber-300">First-run protocol</p>
          <h1 id="pit-setup-title" class="mt-4 text-3xl font-semibold leading-tight tracking-tight">初始化本地<br>需求池服务器</h1>
          <ol class="mt-8 space-y-5 text-sm text-slate-300">
            <li class="flex gap-3"><span class="font-mono text-amber-300">01</span><span>从服务器本机控制台获取一次性初始化令牌</span></li>
            <li class="flex gap-3"><span class="font-mono text-amber-300">02</span><span>创建首个 PIT 管理员账号</span></li>
            <li class="flex gap-3"><span class="font-mono text-amber-300">03</span><span>完成后令牌永久失效</span></li>
          </ol>
        </aside>
        <div class="p-6 sm:p-9">
          <p class="text-sm leading-6 text-slate-600 dark:text-slate-300">首次启动需要完成一次初始化。令牌只会显示在 PIT 服务所在电脑的控制台中。</p>
          <form data-pit-setup-form class="mt-7 grid gap-5 sm:grid-cols-2" novalidate>
            <label class="sm:col-span-2"><span class="text-sm font-medium text-slate-800 dark:text-slate-200">一次性初始化令牌</span><input name="token" autocomplete="off" required autofocus aria-describedby="pit-setup-token-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 font-mono text-sm text-slate-950 outline-none transition focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950 dark:text-white" placeholder="粘贴控制台中的 token"><span id="pit-setup-token-error" data-pit-field-error="token" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
            <label><span class="text-sm font-medium text-slate-800 dark:text-slate-200">管理员用户名</span><input name="username" autocomplete="username" required aria-describedby="pit-setup-username-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950" placeholder="例如 admin"><span id="pit-setup-username-error" data-pit-field-error="username" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
            <label><span class="text-sm font-medium text-slate-800 dark:text-slate-200">显示名称</span><input name="displayName" autocomplete="name" required aria-describedby="pit-setup-display-name-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950" placeholder="例如 PIT 管理员"><span id="pit-setup-display-name-error" data-pit-field-error="displayName" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
            <label class="sm:col-span-2"><span class="text-sm font-medium text-slate-800 dark:text-slate-200">管理员密码</span><input name="password" type="password" autocomplete="new-password" minlength="12" required aria-describedby="pit-setup-password-help pit-setup-password-error" class="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 dark:border-slate-600 dark:bg-slate-950" placeholder="至少 12 位，建议包含大小写、数字和符号"><span id="pit-setup-password-help" class="mt-1.5 block text-xs text-slate-500">该密码仅用于 PIT 本地账号，请勿复用其他系统密码。</span><span id="pit-setup-password-error" data-pit-field-error="password" class="mt-1.5 hidden text-xs text-red-600 dark:text-red-400"></span></label>
            <div data-pit-form-error role="alert" class="${message ? "" : "hidden"} rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 sm:col-span-2">${escapeHtml(message)}</div>
            <button data-pit-setup-submit type="submit" class="inline-flex h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-600/15 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/25 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">创建管理员并进入 PIT</button>
          </form>
        </div>
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

export function bindPitSetupPage(root: HTMLElement, options: { onAuthenticated: () => void; onOffline: (message: string) => void; isActive?: () => boolean }): void {
  const form = root.querySelector<HTMLFormElement>("[data-pit-setup-form]");
  const submit = root.querySelector<HTMLButtonElement>("[data-pit-setup-submit]");
  const errorBox = root.querySelector<HTMLElement>("[data-pit-form-error]");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (options.isActive?.() === false) return;
    if (!form || !submit || !errorBox) return;
    const data = new FormData(form);
    const input = {
      token: String(data.get("token") ?? "").trim(),
      username: String(data.get("username") ?? "").trim(),
      displayName: String(data.get("displayName") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };
    const validationErrors = validatePitSetupInput(input);
    applyFieldErrors(root, validationErrors);
    if (hasPitFormErrors(validationErrors)) {
      errorBox.classList.add("hidden");
      return;
    }
    submit.disabled = true;
    submit.textContent = "正在初始化…";
    errorBox.classList.add("hidden");
    try {
      await pitApi.bootstrap(input);
      if (options.isActive?.() === false) return;
      await pitApi.login({ username: input.username, password: input.password });
      const auth = await pitApi.me();
      if (options.isActive?.() === false) return;
      setPitSession(auth);
      options.onAuthenticated();
    } catch (error) {
      if (options.isActive?.() === false) return;
      const message = isPitApiError(error) ? error.message : "初始化失败，请稍后重试。";
      const fieldErrors = isPitApiError(error) ? pickPitFieldErrors(error.fields, ["token", "username", "displayName", "password"]) : {};
      applyFieldErrors(root, fieldErrors);
      if (isPitApiError(error) && error.status === 0) options.onOffline(message);
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
      submit.disabled = false;
      submit.textContent = "创建管理员并进入 PIT";
    }
  });
}
