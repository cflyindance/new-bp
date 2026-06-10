/**
 * 消息中心 · 消息模板 / 消息配置 / 消息额度（滑层业务页）。
 */

export const NOTIFICATIONS_TEMPLATES_PATH = "/notifications/templates";
export const NOTIFICATIONS_SCENE_CONFIG_PATH = "/notifications/scene-config";
export const NOTIFICATIONS_QUOTA_PATH = "/notifications/quota";

export const NOTIFICATIONS_HUB_FEATURE_PATHS = [
  NOTIFICATIONS_TEMPLATES_PATH,
  NOTIFICATIONS_SCENE_CONFIG_PATH,
  NOTIFICATIONS_QUOTA_PATH,
] as const;

const TEMPLATES_STORAGE_KEY = "notifications-message-templates-v1";
const SCENE_CONFIG_STORAGE_KEY = "notifications-scene-template-map-v1";
const QUOTA_MODE_STORAGE_KEY = "notifications-quota-mode-v1";

type TemplateStatus = "enabled" | "disabled";
type SceneCategory = "通知" | "营销" | "身份验证" | "告警";
type MessageType = "短信" | "邮件";

type MessageTemplate = {
  id: string;
  templateId: string;
  name: string;
  sceneCategory: SceneCategory;
  messageType: MessageType;
  content: string;
  variables: string;
  status: TemplateStatus;
  updatedAt: string;
  systemPreset?: boolean;
};

const TEMPLATE_VAR_QUICK = [
  { label: "商家名称", token: "商家名称" },
  { label: "商家地址", token: "商家地址" },
  { label: "商家手机号", token: "商家手机号" },
] as const;

const TEMPLATE_VAR_MORE = [
  { label: "客户姓名", token: "客户姓名" },
  { label: "客户地址", token: "客户地址" },
  { label: "订单号", token: "订单号" },
  { label: "取餐时间", token: "取餐时间" },
  { label: "送达时间", token: "送达时间" },
  { label: "到店时间", token: "到店时间" },
  { label: "服务时间", token: "服务时间" },
  { label: "排队菜品数", token: "排队菜品数" },
  { label: "预计等待时间", token: "预计等待时间" },
  { label: "品牌名称", token: "品牌名称" },
] as const;

type SceneConfigItem = {
  id: string;
  title: string;
  tag: string;
  channel: string;
  defaultTemplateId: string;
};

type QuotaMode = "brand" | "store";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "t1",
    templateId: "1250030",
    name: "模板-1002",
    sceneCategory: "通知",
    messageType: "短信",
    content: "您好，{{商家名称}}已收到您的订单，地址：{{商家地址}}。",
    variables: "商家地址, 商家名称",
    status: "enabled",
    updatedAt: "2026-05-26 14:49:39",
    systemPreset: true,
  },
  {
    id: "t2",
    templateId: "1250029",
    name: "模板-1002",
    sceneCategory: "通知",
    messageType: "短信",
    content: "您好，{{商家名称}}已收到您的订单，地址：{{商家地址}}。",
    variables: "商家地址, 商家名称",
    status: "enabled",
    updatedAt: "2026-05-26 14:49:39",
    systemPreset: true,
  },
  {
    id: "t3",
    templateId: "1000039",
    name: "下单短信通知 (ASAP)-非配送",
    sceneCategory: "通知",
    messageType: "短信",
    content: "您的订单 {{订单号}} 已确认，预计取餐时间 {{取餐时间}}。",
    variables: "商家地址, 商家名称, 订单号, 取餐时间",
    status: "enabled",
    updatedAt: "2026-05-26 14:49:39",
    systemPreset: true,
  },
];

/** 与历史 seq 336–340 场景一一对应（文案 SSOT 在消息模板，本页仅做场景→模板关联） */
const DEFAULT_SCENES: SceneConfigItem[] = [
  {
    id: "s-asap-pickup",
    title: "下单确认·即时单·到店",
    tag: "通知",
    channel: "下单完成短信",
    defaultTemplateId: "1250030",
  },
  {
    id: "s-scheduled-pickup",
    title: "下单确认·预约单·到店",
    tag: "通知",
    channel: "下单完成短信",
    defaultTemplateId: "1250029",
  },
  {
    id: "s-ready",
    title: "出餐/可取餐提醒",
    tag: "通知",
    channel: "取餐通知短信",
    defaultTemplateId: "",
  },
  {
    id: "s-asap-delivery",
    title: "下单确认·即时单·外送",
    tag: "通知",
    channel: "下单完成短信",
    defaultTemplateId: "",
  },
  {
    id: "s-scheduled-delivery",
    title: "下单确认·预约单·外送",
    tag: "通知",
    channel: "下单完成短信",
    defaultTemplateId: "",
  },
];

function normalizeTemplate(raw: Partial<MessageTemplate> & { sceneType?: string; reachMethod?: string }): MessageTemplate | null {
  if (!raw.id || !raw.templateId || !raw.name) return null;
  const sceneCategory =
    (raw.sceneCategory as SceneCategory | undefined) ??
    (raw.sceneType?.startsWith("通知") ? "通知" : undefined) ??
    "通知";
  const messageType =
    (raw.messageType as MessageType | undefined) ??
    (raw.reachMethod === "邮件" ? "邮件" : "短信");
  return {
    id: raw.id,
    templateId: raw.templateId,
    name: raw.name,
    sceneCategory,
    messageType,
    content: typeof raw.content === "string" ? raw.content : "",
    variables: raw.variables ?? "",
    status: raw.status === "disabled" ? "disabled" : "enabled",
    updatedAt: raw.updatedAt ?? new Date().toISOString().slice(0, 19).replace("T", " "),
    systemPreset: raw.systemPreset,
  };
}

function loadTemplates(): MessageTemplate[] {
  const raw = readJson<unknown[]>(TEMPLATES_STORAGE_KEY, DEFAULT_TEMPLATES);
  if (!Array.isArray(raw)) return [...DEFAULT_TEMPLATES];
  const normalized = raw
    .map((item) => normalizeTemplate(item as Partial<MessageTemplate> & { sceneType?: string; reachMethod?: string }))
    .filter((t): t is MessageTemplate => t != null);
  return normalized.length ? normalized : [...DEFAULT_TEMPLATES];
}

function saveTemplates(templates: MessageTemplate[]): void {
  writeJson(TEMPLATES_STORAGE_KEY, templates);
}

function findTemplateById(id: string): MessageTemplate | undefined {
  return loadTemplates().find((t) => t.id === id);
}

function formatTemplateUpdatedAt(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function updateTemplateById(id: string, patch: Partial<MessageTemplate>): void {
  const templates = loadTemplates();
  const index = templates.findIndex((t) => t.id === id);
  if (index < 0) return;
  templates[index] = {
    ...templates[index],
    ...patch,
    updatedAt: formatTemplateUpdatedAt(),
  };
  saveTemplates(templates);
}

function toggleTemplateStatus(id: string): void {
  const t = findTemplateById(id);
  if (!t) return;
  updateTemplateById(id, { status: t.status === "enabled" ? "disabled" : "enabled" });
}

function loadSceneMap(): Record<string, string> {
  const stored = readJson<Record<string, string>>(SCENE_CONFIG_STORAGE_KEY, {});
  const map: Record<string, string> = {};
  for (const scene of DEFAULT_SCENES) {
    map[scene.id] = stored[scene.id] ?? scene.defaultTemplateId;
  }
  return map;
}

function saveSceneMap(map: Record<string, string>): void {
  writeJson(SCENE_CONFIG_STORAGE_KEY, map);
}

function loadQuotaMode(): QuotaMode {
  return readJson<QuotaMode>(QUOTA_MODE_STORAGE_KEY, "brand");
}

function saveQuotaMode(mode: QuotaMode): void {
  writeJson(QUOTA_MODE_STORAGE_KEY, mode);
}

export function isNotificationsHubFeaturePath(path: string): boolean {
  return (NOTIFICATIONS_HUB_FEATURE_PATHS as readonly string[]).some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

export function isNotificationsTemplatesPath(path: string): boolean {
  return path === NOTIFICATIONS_TEMPLATES_PATH || path.startsWith(`${NOTIFICATIONS_TEMPLATES_PATH}/`);
}

export function isNotificationsSceneConfigPath(path: string): boolean {
  return path === NOTIFICATIONS_SCENE_CONFIG_PATH || path.startsWith(`${NOTIFICATIONS_SCENE_CONFIG_PATH}/`);
}

export function isNotificationsQuotaPath(path: string): boolean {
  return path === NOTIFICATIONS_QUOTA_PATH || path.startsWith(`${NOTIFICATIONS_QUOTA_PATH}/`);
}

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FILTER_CONTROL_CLASS =
  "h-9 rounded-md border border-input bg-background text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const FILTER_INPUT_CLASS = `${FILTER_CONTROL_CLASS} w-full min-w-0 px-3 placeholder:text-muted-foreground`;
const FILTER_SELECT_CLASS = `${FILTER_CONTROL_CLASS} shrink-0 px-2.5`;
const FILTER_BTN_CLASS =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ACTION_LINK_CLASS =
  "inline-flex h-8 items-center rounded-md px-2 text-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ACTION_WARN_CLASS =
  "inline-flex h-8 items-center rounded-md px-2 text-sm text-amber-700 transition-colors hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-400";
const ACTION_MUTED_CLASS =
  "inline-flex h-8 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const TEXTAREA_CLASS =
  "min-h-[12rem] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const VAR_CHIP_CLASS =
  "inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-muted/40 px-2.5 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5";

const MEGAPHONE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`;

function extractVariablesFromContent(content: string): string {
  const found = new Set<string>();
  const re = /\{\{([^}]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const token = m[1]?.trim();
    if (token) found.add(token);
  }
  return [...found].join(", ");
}

function renderPreviewText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "默认模板";
  return trimmed.replace(/\{\{([^}]+)\}\}/g, (_, token: string) => `[${token.trim()}]`);
}

function renderAddTemplateDialog(): string {
  const quickVars = TEMPLATE_VAR_QUICK.map(
    (v) =>
      `<button type="button" class="${VAR_CHIP_CLASS}" data-template-insert-var="${escapeHtml(v.token)}">${escapeHtml(v.label)}</button>`,
  ).join("");
  const moreVars = TEMPLATE_VAR_MORE.map(
    (v) =>
      `<button type="button" role="menuitem" class="flex w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted" data-template-insert-var="${escapeHtml(v.token)}">${escapeHtml(v.label)}</button>`,
  ).join("");

  return `
    <div
      id="notifications-template-add-dialog"
      class="fixed inset-0 z-[10050] hidden items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
      data-template-add-overlay
      aria-hidden="true"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-template-add-title"
        class="relative my-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        data-template-add-dialog-panel
      >
        <div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div class="flex items-center gap-3">
            <button type="button" class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" data-template-add-close aria-label="关闭">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h2 id="notifications-template-add-title" class="text-base font-semibold text-card-foreground" data-template-dialog-title>新增模板</h2>
          </div>
          <button
            type="button"
            class="inline-flex h-9 items-center rounded-md bg-muted px-5 text-sm font-medium text-muted-foreground"
            data-template-add-submit
            disabled
          >确定</button>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" data-template-add-form>
          <input type="hidden" name="editId" value="" data-template-edit-id />
          <div class="grid gap-4 border-b border-border px-5 py-4 sm:grid-cols-3">
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium text-card-foreground"><span class="text-destructive">*</span> 模板名称</span>
              <input type="text" name="name" class="${INPUT_CLASS}" placeholder="请输入模板名称" data-template-add-name required />
            </label>
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium text-card-foreground"><span class="text-destructive">*</span> 场景类型</span>
              <select name="sceneCategory" class="${SELECT_CLASS}" data-template-add-scene required>
                <option value="通知">通知</option>
                <option value="营销">营销</option>
                <option value="身份验证">身份验证</option>
                <option value="告警">告警</option>
              </select>
            </label>
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium text-card-foreground"><span class="text-destructive">*</span> 消息类型</span>
              <select name="messageType" class="${SELECT_CLASS}" data-template-add-message-type required>
                <option value="短信">短信</option>
                <option value="邮件">邮件</option>
              </select>
            </label>
          </div>

          <div class="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_minmax(14rem,18rem)]">
            <div class="border-b border-border px-5 py-4 lg:border-b-0 lg:border-r">
              <p class="text-sm font-medium text-card-foreground">模板内容</p>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                模板变量由外部数据源提供，点击输入框上方变量标签插入，变量需使用 <code class="rounded bg-muted px-1 font-mono text-[11px]">{{ }}</code> 包裹
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-2">
                ${quickVars}
                <div class="relative" data-template-more-vars-wrap>
                  <button type="button" class="${VAR_CHIP_CLASS} gap-1" data-template-more-vars-toggle aria-expanded="false" aria-haspopup="menu">
                    More
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <div
                    class="absolute left-0 top-full z-20 mt-1 hidden min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
                    data-template-more-vars-menu
                    role="menu"
                  >
                    ${moreVars}
                  </div>
                </div>
              </div>
              <textarea
                name="content"
                class="${TEXTAREA_CLASS} mt-3"
                rows="10"
                placeholder="请输入模板内容，可点击上方变量快速插入，例如：您好，{{商家名称}}已收到您的订单。"
                data-template-add-content
              ></textarea>
            </div>

            <div class="flex flex-col px-5 py-4">
              <p class="text-sm font-medium text-card-foreground">样式预览</p>
              <p class="mt-1 text-xs text-muted-foreground">预览效果仅供参考，请以实际下发为准</p>
              <div class="mt-4 flex flex-1 flex-col items-center">
                <div class="w-full max-w-[13rem] rounded-[1.75rem] border-[6px] border-foreground/90 bg-muted/30 p-2 shadow-inner">
                  <div class="rounded-t-[1.1rem] bg-muted/60 px-3 py-1.5 text-center text-[10px] text-muted-foreground">09:57</div>
                  <div class="min-h-[14rem] rounded-b-[1.1rem] bg-background px-3 py-4">
                    <div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-xs leading-relaxed text-card-foreground" data-template-preview-bubble>
                      默认模板
                    </div>
                  </div>
                </div>
                <p class="mt-4 text-xs tabular-nums text-muted-foreground">字数: <span data-template-char-count>0</span></p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>`;
}

function getTemplateDialogEl(): HTMLElement | null {
  return document.getElementById("notifications-template-add-dialog");
}

function fillTemplateDialogForm(dlg: ParentNode, template: MessageTemplate): void {
  const form = dlg.querySelector<HTMLFormElement>("[data-template-add-form]");
  if (!form) return;
  const editIdEl = dlg.querySelector<HTMLInputElement>("[data-template-edit-id]");
  if (editIdEl) editIdEl.value = template.id;
  const nameEl = dlg.querySelector<HTMLInputElement>("[data-template-add-name]");
  if (nameEl) nameEl.value = template.name;
  const sceneEl = dlg.querySelector<HTMLSelectElement>("[data-template-add-scene]");
  if (sceneEl) sceneEl.value = template.sceneCategory;
  const typeEl = dlg.querySelector<HTMLSelectElement>("[data-template-add-message-type]");
  if (typeEl) typeEl.value = template.messageType;
  const contentEl = dlg.querySelector<HTMLTextAreaElement>("[data-template-add-content]");
  if (contentEl) contentEl.value = template.content;
  const titleEl = dlg.querySelector<HTMLElement>("[data-template-dialog-title]");
  if (titleEl) titleEl.textContent = "编辑模板";
}

function resetTemplateDialogForm(dlg: ParentNode): void {
  const form = dlg.querySelector<HTMLFormElement>("[data-template-add-form]");
  form?.reset();
  const editIdEl = dlg.querySelector<HTMLInputElement>("[data-template-edit-id]");
  if (editIdEl) editIdEl.value = "";
  const titleEl = dlg.querySelector<HTMLElement>("[data-template-dialog-title]");
  if (titleEl) titleEl.textContent = "新增模板";
  dlg.querySelector<HTMLElement>("[data-template-more-vars-menu]")?.classList.add("hidden");
  dlg.querySelector<HTMLButtonElement>("[data-template-more-vars-toggle]")?.setAttribute("aria-expanded", "false");
  syncTemplateAddDialogUi(dlg);
}

function openTemplateDialog(): void {
  const dlg = getTemplateDialogEl();
  if (!dlg) return;
  dlg.classList.remove("hidden");
  dlg.classList.add("flex");
  dlg.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  dlg.querySelector<HTMLInputElement>("[data-template-add-name]")?.focus();
}

function openAddTemplateDialog(): void {
  const dlg = getTemplateDialogEl();
  if (!dlg) return;
  resetTemplateDialogForm(dlg);
  openTemplateDialog();
}

function openEditTemplateDialog(template: MessageTemplate): void {
  const dlg = getTemplateDialogEl();
  if (!dlg) return;
  resetTemplateDialogForm(dlg);
  fillTemplateDialogForm(dlg, template);
  syncTemplateAddDialogUi(dlg);
  openTemplateDialog();
}

function closeAddTemplateDialog(): void {
  const dlg = getTemplateDialogEl();
  if (!dlg) return;
  dlg.classList.add("hidden");
  dlg.classList.remove("flex");
  dlg.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  resetTemplateDialogForm(dlg);
}

function syncTemplateAddDialogUi(root: ParentNode): void {
  const name = root.querySelector<HTMLInputElement>("[data-template-add-name]")?.value.trim() ?? "";
  const content = root.querySelector<HTMLTextAreaElement>("[data-template-add-content]")?.value ?? "";
  const submit = root.querySelector<HTMLButtonElement>("[data-template-add-submit]");
  const preview = root.querySelector<HTMLElement>("[data-template-preview-bubble]");
  const countEl = root.querySelector<HTMLElement>("[data-template-char-count]");
  if (submit) {
    const ok = name.length > 0;
    submit.disabled = !ok;
    submit.classList.toggle("bg-primary", ok);
    submit.classList.toggle("text-primary-foreground", ok);
    submit.classList.toggle("hover:bg-primary/90", ok);
    submit.classList.toggle("bg-muted", !ok);
    submit.classList.toggle("text-muted-foreground", !ok);
  }
  if (preview) preview.textContent = renderPreviewText(content);
  if (countEl) countEl.textContent = String(content.length);
}

function insertTemplateVariable(textarea: HTMLTextAreaElement, token: string): void {
  const insert = `{{${token}}}`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  textarea.value = `${before}${insert}${after}`;
  const pos = start + insert.length;
  textarea.setSelectionRange(pos, pos);
  textarea.focus();
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function renderStatusBadge(status: TemplateStatus): string {
  if (status === "enabled") {
    return `<span class="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">启用</span>`;
  }
  return `<span class="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">停用</span>`;
}

function renderTemplatesPage(): string {
  const templates = loadTemplates();
  const rows = templates
    .map(
      (t, index) => `
    <tr class="border-b border-border/70 hover:bg-muted/30" data-template-row="${escapeHtml(t.id)}">
      <td class="px-4 py-3 text-sm tabular-nums text-muted-foreground">${index + 1}</td>
      <td class="px-4 py-3 font-mono text-sm text-card-foreground">${escapeHtml(t.templateId)}</td>
      <td class="px-4 py-3 text-sm text-card-foreground">
        <span>${escapeHtml(t.name)}</span>
        ${t.systemPreset ? `<span class="ml-2 inline-flex rounded border border-border bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">系统预设</span>` : ""}
      </td>
      <td class="px-4 py-3 text-sm text-muted-foreground">${escapeHtml(t.sceneCategory)}</td>
      <td class="px-4 py-3 text-sm text-muted-foreground">${escapeHtml(t.messageType)}</td>
      <td class="max-w-[10rem] truncate px-4 py-3 text-sm text-muted-foreground" title="${escapeHtml(t.variables)}">${escapeHtml(t.variables)}</td>
      <td class="px-4 py-3">${renderStatusBadge(t.status)}</td>
      <td class="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-muted-foreground">${escapeHtml(t.updatedAt)}</td>
      <td class="px-4 py-3">
        <div class="flex items-center justify-end gap-0.5 whitespace-nowrap">
          <button type="button" class="${ACTION_LINK_CLASS}" data-template-edit="${escapeHtml(t.id)}">编辑</button>
          ${
            t.status === "enabled"
              ? `<button type="button" class="${ACTION_WARN_CLASS}" data-template-toggle-status="${escapeHtml(t.id)}" data-template-next-status="disabled">禁用</button>`
              : `<button type="button" class="${ACTION_MUTED_CLASS}" data-template-toggle-status="${escapeHtml(t.id)}" data-template-next-status="enabled">启用</button>`
          }
        </div>
      </td>
    </tr>`,
    )
    .join("");

  return `
    <div class="flex min-h-0 flex-1 flex-col" data-notifications-templates-root>
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div
          class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-3"
          role="search"
          aria-label="模板筛选"
        >
          <input
            type="search"
            class="${FILTER_INPUT_CLASS} w-full min-w-[11rem] max-w-full sm:w-52 sm:max-w-[14rem] lg:w-60"
            placeholder="模板名称 / 模板 ID"
            data-template-search
            aria-label="搜索模板"
          />
          <select class="${FILTER_SELECT_CLASS} w-full sm:w-[8.75rem]" data-template-scene-filter aria-label="场景类型">
            <option value="">场景类型</option>
            <option value="通知">通知</option>
            <option value="营销">营销</option>
            <option value="身份验证">身份验证</option>
            <option value="告警">告警</option>
          </select>
          <select class="${FILTER_SELECT_CLASS} w-full sm:w-[8.75rem]" data-template-status-filter aria-label="模板状态">
            <option value="">模板状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
          </select>
          <button type="button" class="${FILTER_BTN_CLASS}" data-template-filter-reset>重置</button>
          <span class="hidden min-w-2 flex-1 sm:block" aria-hidden="true"></span>
          <button
            type="button"
            class="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto sm:w-auto"
            data-template-add
          >
            <span aria-hidden="true">+</span> 新增模板
          </button>
        </div>
        <div class="module-settings-scroll-host min-h-0 flex-1 overflow-auto">
          <table class="w-full min-w-[56rem] border-collapse text-left">
            <thead class="sticky top-0 z-[1] border-b border-border bg-muted/80 backdrop-blur">
              <tr>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">序号</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">模板ID</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">模板名称</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">场景类型</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">触达方式</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">模板变量</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">模板状态</th>
                <th scope="col" class="px-4 py-3 text-xs font-semibold text-muted-foreground">更新时间</th>
                <th scope="col" class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody data-template-tbody>
              ${rows || `<tr><td colspan="9" class="px-4 py-12 text-center text-sm text-muted-foreground">暂无模板</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <span>共 ${templates.length} 条</span>
          <div class="flex items-center gap-2">
            <button type="button" class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background" disabled aria-label="上一页">‹</button>
            <span class="inline-flex size-8 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">1</span>
            <button type="button" class="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background" disabled aria-label="下一页">›</button>
            <select class="${FILTER_SELECT_CLASS} h-8 w-auto text-xs" aria-label="每页条数">
              <option>50 条/页</option>
            </select>
          </div>
        </div>
      </div>
      ${renderAddTemplateDialog()}
    </div>`;
}

function renderSceneConfigPage(): string {
  const templates = loadTemplates().filter((t) => t.status === "enabled");
  const sceneMap = loadSceneMap();
  const renderTemplateOptions = (selectedId: string): string => {
    const opts = [
      `<option value=""${selectedId === "" ? " selected" : ""}>关联模板</option>`,
      ...templates.map((t) => {
        const sel = t.templateId === selectedId ? " selected" : "";
        return `<option value="${escapeHtml(t.templateId)}"${sel}>${escapeHtml(t.name)} (${escapeHtml(t.templateId)})</option>`;
      }),
    ];
    return opts.join("");
  };

  const rows = DEFAULT_SCENES.map(
    (scene) => `
    <div class="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between" data-scene-row="${escapeHtml(scene.id)}">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">${MEGAPHONE_ICON}</span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-medium text-card-foreground">${escapeHtml(scene.title)}</p>
            <span class="inline-flex rounded border border-border bg-muted/40 px-1.5 py-0.5 text-xs text-muted-foreground">${escapeHtml(scene.tag)}</span>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">${escapeHtml(scene.channel)}</p>
        </div>
      </div>
      <select
        class="${SELECT_CLASS} w-full sm:w-56"
        data-scene-template-select="${escapeHtml(scene.id)}"
        aria-label="关联模板：${escapeHtml(scene.title)}"
      >
        ${renderTemplateOptions(sceneMap[scene.id] ?? "")}
      </select>
    </div>`,
  ).join("");

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-notifications-scene-config-root>
      <div class="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-base font-semibold text-card-foreground">消息配置</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            为各业务场景关联短信模板（文案在
            <a href="#/notifications/templates" class="text-primary hover:underline">消息模板</a>
            维护）；产线是否发送见设置中的
            <a href="#/notifications/settings" class="text-primary hover:underline">顾客短信渠道</a>
          </p>
        </div>
        <button type="button" class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-foreground hover:bg-muted" data-scene-industry-preset>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          使用行业方案
        </button>
      </div>
      <div class="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        ${rows}
      </div>
    </div>`;
}

function renderQuotaTrendBars(): string {
  const values = [2, 5, 3, 8, 4, 6, 2];
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const h = Math.round((v / max) * 100);
      return `<div class="flex flex-1 flex-col items-center justify-end gap-1" title="${v} 条">
        <div class="w-full max-w-[2rem] rounded-t bg-primary/70" style="height:${h}%"></div>
        <span class="text-[10px] text-muted-foreground">${i + 1}</span>
      </div>`;
    })
    .join("");
}

function renderQuotaPage(): string {
  const mode = loadQuotaMode();
  const cardClass = (active: boolean) =>
    `flex flex-1 cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
      active
        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
        : "border-border bg-card hover:border-primary/40"
    }`;

  return `
    <div class="flex min-h-0 flex-1 flex-col gap-4" data-notifications-quota-root>
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div>
          <h2 class="text-base font-semibold text-card-foreground">短信额度管理</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            当前为<strong>品牌级账户</strong>，全部门店共享额度；每月赠送额度以实际签约为准。
          </p>
        </div>
        <a href="#" class="text-sm text-primary hover:underline" data-quota-rules-link>短信使用规则</a>
      </div>

      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p class="mb-3 text-sm font-medium text-card-foreground">管理模式</p>
        <div class="flex flex-col gap-3 sm:flex-row" role="radiogroup" aria-label="短信额度管理模式">
          <label class="${cardClass(mode === "brand")}" data-quota-mode-card="brand">
            <input type="radio" name="quota-mode" value="brand" class="sr-only" data-quota-mode-radio ${mode === "brand" ? "checked" : ""} />
            <span class="text-sm font-semibold text-card-foreground">品牌级账户</span>
            <span class="mt-2 text-xs leading-relaxed text-muted-foreground">总部统一管理短信额度，各门店共享使用。</span>
          </label>
          <label class="${cardClass(mode === "store")}" data-quota-mode-card="store">
            <input type="radio" name="quota-mode" value="store" class="sr-only" data-quota-mode-radio ${mode === "store" ? "checked" : ""} />
            <span class="text-sm font-semibold text-card-foreground">门店级账户</span>
            <span class="mt-2 text-xs leading-relaxed text-muted-foreground">按门店独立分配与消耗短信额度。</span>
          </label>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(12rem,16rem)_1fr]">
        <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p class="text-sm text-muted-foreground">剩余额度</p>
          <p class="mt-3 text-4xl font-semibold tracking-tight text-card-foreground" aria-label="剩余额度无限">∞</p>
          <p class="mt-2 text-xs text-muted-foreground">品牌共享池</p>
        </div>
        <div class="flex min-h-[14rem] flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-card-foreground">消费趋势</p>
            <div class="inline-flex rounded-md border border-border p-0.5 text-xs">
              <button type="button" class="rounded px-2.5 py-1 bg-primary text-primary-foreground" data-quota-trend-range="7">7天</button>
              <button type="button" class="rounded px-2.5 py-1 text-muted-foreground hover:text-foreground" data-quota-trend-range="30">30天</button>
            </div>
          </div>
          <div class="flex min-h-0 flex-1 items-end gap-1 border-b border-border/60 pb-2" data-quota-trend-chart aria-hidden="true">
            ${renderQuotaTrendBars()}
          </div>
        </div>
      </div>
    </div>`;
}

export function renderNotificationsHubPageContent(path: string): string {
  if (isNotificationsTemplatesPath(path)) return renderTemplatesPage();
  if (isNotificationsSceneConfigPath(path)) return renderSceneConfigPage();
  if (isNotificationsQuotaPath(path)) return renderQuotaPage();
  return renderTemplatesPage();
}

function fixSceneSelectOptions(root: ParentNode): void {
  root.querySelectorAll<HTMLSelectElement>("[data-scene-template-select]").forEach((sel) => {
    const sceneId = sel.getAttribute("data-scene-template-select");
    if (!sceneId) return;
    const map = loadSceneMap();
    const val = map[sceneId] ?? "";
    sel.value = val;
    Array.from(sel.options).forEach((opt) => {
      opt.selected = opt.value === val;
    });
  });
}

export function bindNotificationsHubUi(remount: () => void): void {
  const root = document;
  if (root.querySelector("[data-notifications-scene-config-root]")) {
    fixSceneSelectOptions(root);
    root.querySelectorAll<HTMLSelectElement>("[data-scene-template-select]").forEach((sel) => {
      if (sel.dataset.sceneBound === "1") return;
      sel.dataset.sceneBound = "1";
      sel.addEventListener("change", () => {
        const sceneId = sel.getAttribute("data-scene-template-select");
        if (!sceneId) return;
        const map = loadSceneMap();
        map[sceneId] = sel.value;
        saveSceneMap(map);
      });
    });
    root.querySelector<HTMLButtonElement>("[data-scene-industry-preset]")?.addEventListener("click", () => {
      const map: Record<string, string> = {};
      for (const scene of DEFAULT_SCENES) {
        map[scene.id] = scene.defaultTemplateId;
      }
      saveSceneMap(map);
      remount();
    });
  }

  const templateAddDlg = root.getElementById("notifications-template-add-dialog");
  if (templateAddDlg) {
    root.querySelector<HTMLButtonElement>("[data-template-add]")?.addEventListener("click", () => {
      openAddTemplateDialog();
    });

    templateAddDlg.addEventListener("click", (e) => {
      if (e.target === templateAddDlg) closeAddTemplateDialog();
    });
    templateAddDlg.querySelectorAll("[data-template-add-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeAddTemplateDialog());
    });

    const contentEl = templateAddDlg.querySelector<HTMLTextAreaElement>("[data-template-add-content]");
    const nameEl = templateAddDlg.querySelector<HTMLInputElement>("[data-template-add-name]");
    nameEl?.addEventListener("input", () => syncTemplateAddDialogUi(templateAddDlg));
    contentEl?.addEventListener("input", () => syncTemplateAddDialogUi(templateAddDlg));

    templateAddDlg.querySelectorAll<HTMLElement>("[data-template-insert-var]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const token = btn.getAttribute("data-template-insert-var");
        if (!token || !contentEl) return;
        insertTemplateVariable(contentEl, token);
        templateAddDlg.querySelector<HTMLElement>("[data-template-more-vars-menu]")?.classList.add("hidden");
        templateAddDlg.querySelector<HTMLButtonElement>("[data-template-more-vars-toggle]")?.setAttribute("aria-expanded", "false");
      });
    });

    const moreToggle = templateAddDlg.querySelector<HTMLButtonElement>("[data-template-more-vars-toggle]");
    const moreMenu = templateAddDlg.querySelector<HTMLElement>("[data-template-more-vars-menu]");
    moreToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = moreMenu?.classList.toggle("hidden") === false;
      moreToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    const closeMoreMenu = (): void => {
      moreMenu?.classList.add("hidden");
      moreToggle?.setAttribute("aria-expanded", "false");
    };
    document.addEventListener(
      "click",
      (e) => {
        if (!templateAddDlg.classList.contains("flex")) return;
        const wrap = templateAddDlg.querySelector("[data-template-more-vars-wrap]");
        if (wrap && !wrap.contains(e.target as Node)) closeMoreMenu();
      },
      { capture: true },
    );

    templateAddDlg.querySelector<HTMLButtonElement>("[data-template-add-submit]")?.addEventListener("click", () => {
      const form = templateAddDlg.querySelector<HTMLFormElement>("[data-template-add-form]");
      if (!form) return;
      const fd = new FormData(form);
      const name = String(fd.get("name") ?? "").trim();
      if (!name) {
        nameEl?.focus();
        return;
      }
      const editId = String(fd.get("editId") ?? "").trim();
      const sceneCategory = String(fd.get("sceneCategory") ?? "通知") as SceneCategory;
      const messageType = String(fd.get("messageType") ?? "短信") as MessageType;
      const content = String(fd.get("content") ?? "");
      const variables = extractVariablesFromContent(content);
      const updatedAt = formatTemplateUpdatedAt();

      if (editId) {
        const existing = findTemplateById(editId);
        if (existing) {
          updateTemplateById(editId, { name, sceneCategory, messageType, content, variables, updatedAt });
        }
      } else {
        const templates = loadTemplates();
        templates.unshift({
          id: `t${Date.now()}`,
          templateId: String(1250000 + templates.length + 1),
          name,
          sceneCategory,
          messageType,
          content,
          variables,
          status: "enabled",
          updatedAt,
        });
        saveTemplates(templates);
      }
      closeAddTemplateDialog();
      remount();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || templateAddDlg.classList.contains("hidden")) return;
      closeAddTemplateDialog();
    });
  }

  root.querySelectorAll<HTMLButtonElement>("[data-template-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-template-edit");
      if (!id) return;
      const template = findTemplateById(id);
      if (template) openEditTemplateDialog(template);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-template-toggle-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-template-toggle-status");
      if (!id) return;
      toggleTemplateStatus(id);
      remount();
    });
  });

  root.querySelector<HTMLButtonElement>("[data-template-filter-reset]")?.addEventListener("click", () => {
    const search = root.querySelector<HTMLInputElement>("[data-template-search]");
    const scene = root.querySelector<HTMLSelectElement>("[data-template-scene-filter]");
    const status = root.querySelector<HTMLSelectElement>("[data-template-status-filter]");
    if (search) search.value = "";
    if (scene) scene.value = "";
    if (status) status.value = "";
    root.querySelectorAll<HTMLElement>("[data-template-row]").forEach((row) => {
      row.classList.remove("hidden");
    });
  });

  const applyTemplateFilters = (): void => {
    const q = (root.querySelector<HTMLInputElement>("[data-template-search]")?.value ?? "").trim().toLowerCase();
    const scene = root.querySelector<HTMLSelectElement>("[data-template-scene-filter]")?.value ?? "";
    const status = root.querySelector<HTMLSelectElement>("[data-template-status-filter]")?.value ?? "";
    const templates = loadTemplates();
    root.querySelectorAll<HTMLElement>("[data-template-row]").forEach((row) => {
      const id = row.getAttribute("data-template-row");
      const t = templates.find((x) => x.id === id);
      if (!t) return;
      const matchQ =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.templateId.toLowerCase().includes(q);
      const matchScene = !scene || t.sceneCategory === scene;
      const matchStatus = !status || t.status === status;
      row.classList.toggle("hidden", !(matchQ && matchScene && matchStatus));
    });
  };

  root.querySelector<HTMLInputElement>("[data-template-search]")?.addEventListener("input", applyTemplateFilters);
  root.querySelector<HTMLSelectElement>("[data-template-scene-filter]")?.addEventListener("change", applyTemplateFilters);
  root.querySelector<HTMLSelectElement>("[data-template-status-filter]")?.addEventListener("change", applyTemplateFilters);

  root.querySelectorAll<HTMLInputElement>("[data-quota-mode-radio]").forEach((radio) => {
    if (radio.dataset.quotaBound === "1") return;
    radio.dataset.quotaBound = "1";
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      saveQuotaMode(radio.value as QuotaMode);
      remount();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-quota-trend-range]").forEach((btn) => {
    if (btn.dataset.trendBound === "1") return;
    btn.dataset.trendBound = "1";
    btn.addEventListener("click", () => {
      root.querySelectorAll<HTMLButtonElement>("[data-quota-trend-range]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("bg-primary", on);
        b.classList.toggle("text-primary-foreground", on);
        b.classList.toggle("text-muted-foreground", !on);
      });
    });
  });

  root.querySelector<HTMLAnchorElement>("[data-quota-rules-link]")?.addEventListener("click", (e) => {
    e.preventDefault();
  });
}
