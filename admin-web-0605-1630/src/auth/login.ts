/** 演示登录：Menusifu 企业邮箱 + 固定密码 */

import { recordSystemLoginLog } from "./login-log-store";

export const LOGIN_PATH = "/login";

const AUTH_STORAGE_KEY = "menusifu-admin-auth:v1";
const AUTH_EMAIL_KEY = "menusifu-admin-auth-email";

/** 演示环境固定密码 */
export const DEMO_LOGIN_PASSWORD = "Menusifu666";

/** 仅校验后缀为 @menusifu.cn 或 @menusifu.com */
const MENUSIFU_EMAIL_RE = /^[^\s@]+@menusifu\.(cn|com)$/i;

export function getAuthenticatedEmail(): string | null {
  try {
    const email = sessionStorage.getItem(AUTH_EMAIL_KEY)?.trim();
    return email || null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  try {
    if (getAuthenticatedEmail()) return true;
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthenticated(email: string): void {
  const normalized = email.trim().toLowerCase();
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, "1");
    sessionStorage.setItem(AUTH_EMAIL_KEY, normalized);
  } catch {
    /* ignore */
  }
}

export function clearAuthenticated(): void {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

export function isMenusifuEmail(email: string): boolean {
  return MENUSIFU_EMAIL_RE.test(email.trim());
}

export function validateLoginCredentials(email: string, password: string): string | null {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return "请输入邮箱账号";
  if (!isMenusifuEmail(trimmedEmail)) {
    return "邮箱格式须为 *@menusifu.cn 或 *@menusifu.com";
  }
  if (password !== DEMO_LOGIN_PASSWORD) return "密码不正确";
  return null;
}

export function renderLoginPage(): string {
  return `
    <div class="flex h-dvh min-h-0 w-full items-center justify-center bg-background px-4 py-8">
      <div class="w-full max-w-md animate-fade-in">
        <div class="mb-8 text-center">
          <span
            class="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h2v7"/></svg>
          </span>
          <h1 class="text-xl font-semibold tracking-tight text-foreground">MenuSifu 智慧餐饮管理中心</h1>
          <p class="mt-1 text-sm text-muted-foreground">请登录后继续</p>
        </div>
        <form
          class="rounded-xl border border-border bg-card p-6 shadow-sm"
          data-login-form
          novalidate
        >
          <div class="space-y-4">
            <div>
              <label for="login-email" class="mb-1.5 block text-sm font-medium text-card-foreground">邮箱账号</label>
              <input
                id="login-email"
                name="email"
                type="text"
                inputmode="email"
                autocomplete="username"
                required
                placeholder="输入Menusifu企业邮箱"
                class="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-login-email
              />
              <p class="mt-1.5 text-xs text-muted-foreground">请输入 Menusifu 企业邮箱（*@menusifu.cn/com）</p>
            </div>
            <div>
              <label for="login-password" class="mb-1.5 block text-sm font-medium text-card-foreground">密码</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                data-login-password
              />
              <p class="mt-1.5 text-xs text-muted-foreground">密码 ${DEMO_LOGIN_PASSWORD}</p>
            </div>
            <p
              class="hidden rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
              data-login-error
            ></p>
            <button
              type="submit"
              class="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>`;
}

export function bindLoginPage(onSuccess: () => void): void {
  const form = document.querySelector<HTMLFormElement>("[data-login-form]");
  if (!form || form.dataset.loginBound === "1") return;
  form.dataset.loginBound = "1";

  const emailInput = form.querySelector<HTMLInputElement>("[data-login-email]");
  const passwordInput = form.querySelector<HTMLInputElement>("[data-login-password]");
  const errorEl = form.querySelector<HTMLElement>("[data-login-error]");

  const showError = (message: string): void => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.toggle("hidden", !message);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput?.value ?? "";
    const password = passwordInput?.value ?? "";
    const err = validateLoginCredentials(email, password);
    if (err) {
      showError(err);
      passwordInput?.focus();
      return;
    }
    showError("");
    const account = email.trim();
    setAuthenticated(account);
    recordSystemLoginLog(account);
    onSuccess();
  });
}
