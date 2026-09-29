import { createPayrollDeclarationRepository, type PayrollDeclarationRepository } from "./payroll-declaration-api";
import type { PayrollPageContext } from "./payroll-context";
import type { DeclarationTemplateFamily, DeclarationTemplateVersion } from "./payroll-declaration-types";

export interface PayrollDeclarationSettingsHandle {
  open(): Promise<void>;
  close(): void;
  refresh(): Promise<void>;
  destroy(): void;
}

interface SettingsState {
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  selectedFamilyId: string | null;
  message: string;
  busy: boolean;
  editorOpen: boolean;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function statusLabel(status: DeclarationTemplateVersion["status"] | "empty"): string {
  return status === "published" ? "已发布" : status === "draft" ? "草稿" : status === "retired" ? "已停用" : "未配置";
}

function applicableVersion(family: DeclarationTemplateFamily, versions: DeclarationTemplateVersion[]): DeclarationTemplateVersion | undefined {
  return versions.find((version) => version.versionId === family.activeVersionId)
    ?? versions.filter((version) => version.familyId === family.familyId).sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))[0];
}

function renderSettings(surface: HTMLElement, state: SettingsState): void {
  const selected = state.families.find((family) => family.familyId === state.selectedFamilyId) ?? null;
  const selectedVersion = selected ? applicableVersion(selected, state.versions) : undefined;
  const rows = state.families.map((family) => {
    const version = applicableVersion(family, state.versions);
    const active = family.familyId === state.selectedFamilyId ? " is-active" : "";
    const scope = family.scope.storeId ? "门店模板" : "企业模板";
    return `<button type="button" class="payroll-declaration-template-row${active}" data-declaration-family="${escapeHtml(family.familyId)}">
      <span><strong>${escapeHtml(family.languageDisplayName)}</strong><small>${escapeHtml(family.localeCode)} · ${scope}</small></span>
      <span><small>V${Number(version?.version ?? 0)}</small><em data-status="${escapeHtml(version?.status ?? "empty")}">${statusLabel(version?.status ?? "empty")}</em></span>
    </button>`;
  }).join("");
  surface.innerHTML = `
    <header class="payroll-declaration-settings-header">
      <div><p>薪资管理</p><h2>员工声明设置</h2></div>
      <button type="button" class="btn" data-declaration-close>返回薪资管理</button>
    </header>
    <div class="payroll-declaration-settings-toolbar">
      <div><strong>企业声明模板库</strong><p>维护员工确认时使用的已审核语言版本</p></div>
      <button type="button" class="btn btn-primary" data-declaration-new>新增语言模板</button>
    </div>
    <div class="payroll-declaration-settings-layout payroll-declaration-library">
      <aside aria-label="声明模板列表"><div class="payroll-declaration-template-list">${rows || '<p class="payroll-declaration-empty">暂无模板</p>'}</div></aside>
    </div>
    ${state.editorOpen ? `<div class="payroll-declaration-dialog-overlay">
      <section class="payroll-declaration-editor payroll-declaration-dialog" role="dialog" aria-modal="true" aria-labelledby="declaration-dialog-title">
        <header class="payroll-declaration-dialog-header"><h3 id="declaration-dialog-title">${selected ? "语言模板" : "新增语言模板"}</h3><button type="button" class="btn" data-declaration-editor-close>关闭</button></header>
        <div class="payroll-declaration-editor-grid">
          <label>语言名称<input data-declaration-language value="${escapeHtml(selected?.languageDisplayName ?? "")}" ${state.busy ? "disabled" : ""}></label>
          <label>语言代码<input data-declaration-locale value="${escapeHtml(selected?.localeCode ?? "")}" placeholder="例如 es-US" ${selected ? "disabled" : ""}></label>
          <label>模板范围<select data-declaration-scope ${selected ? "disabled" : ""}><option value="enterprise">企业通用</option><option value="store">当前门店</option></select></label>
          <label>当前状态<input value="${escapeHtml(statusLabel(selectedVersion?.status ?? "empty"))}" disabled></label>
        </div>
        <label class="payroll-declaration-source-label">声明正文<textarea data-declaration-source rows="10" ${selectedVersion?.status === "published" || state.busy ? "disabled" : ""}>${escapeHtml(selectedVersion?.source ?? "")}</textarea></label>
        <div class="payroll-declaration-variables" aria-label="可用变量">
          ${[
            ["employee_name", "员工姓名"],
            ["pay_period_start", "薪资周期开始日期"],
            ["pay_period_end", "薪资周期结束日期"],
            ["regular_hours", "正常工时"],
            ["overtime_hours", "加班工时"],
            ["total_hours", "总工时"],
            ["tips_amount", "小费金额（Tips）"],
            ["gratuity_amount", "服务费金额（Gratuity）"],
            ["store_name", "门店名称"],
            ["confirmation_date", "员工确认日期"],
          ].map(([name, label]) => `<button type="button" data-declaration-variable="${name}" title="点击插入：${label}" ${selectedVersion?.status === "published" ? "disabled" : ""}><span>${label}</span> <code>{{${name}}}</code></button>`).join("")}
        </div>
        <section class="payroll-declaration-preview"><h3>打印预览</h3><p dir="auto">${escapeHtml(selectedVersion?.source || "输入声明正文后在此预览")}</p></section>
        <div class="payroll-declaration-editor-actions">
          ${selectedVersion?.status === "published" ? '<button type="button" class="btn" data-declaration-new-version>创建新版本</button><button type="button" class="btn" data-declaration-retire>停用</button>' : '<button type="button" class="btn" data-declaration-save>保存草稿</button><button type="button" class="btn btn-primary" data-declaration-publish>审核并发布</button>'}
        </div>
        <p class="payroll-declaration-settings-message" aria-live="polite">${escapeHtml(state.message)}</p>
      </section>
    </div>` : `<p class="payroll-declaration-settings-message" aria-live="polite">${escapeHtml(state.message)}</p>`}`;
}

export function createPayrollDeclarationSettingsController(input: {
  shadowRoot: ShadowRoot;
  pageRoot: HTMLElement;
  context: PayrollPageContext;
  repository?: PayrollDeclarationRepository;
  repositoryFactory?: (organizationId: string, storeId?: string) => PayrollDeclarationRepository;
}): PayrollDeclarationSettingsHandle {
  const state: SettingsState = { families: [], versions: [], selectedFamilyId: null, message: "", busy: false, editorOpen: false };
  const surface = document.createElement("dialog");
  surface.setAttribute("aria-label", "员工声明设置");
  surface.className = "payroll-declaration-settings-screen";
  surface.dataset.payrollDeclarationSettings = "";
  surface.hidden = true;
  input.pageRoot.append(surface);

  const actionHost = input.shadowRoot.querySelector<HTMLElement>(".payroll-workspace-actions") ?? input.pageRoot;
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "btn payroll-workspace-action-btn no-print";
  openButton.dataset.action = "open-declaration-settings";
  openButton.textContent = "员工声明设置";
  actionHost.prepend(openButton);

  let returnFocus: HTMLElement | null = null;
  let repository: PayrollDeclarationRepository | null = null;
  let destroyed = false;
  const getRepository = () => {
    if (repository) return repository;
    const scope = input.context.getScope();
    const organizationId = scope.brandId || "demo-organization";
    repository = input.repository ?? input.repositoryFactory?.(organizationId, scope.storeId) ?? createPayrollDeclarationRepository({ organizationId, storeId: scope.storeId || undefined, actorId: "payroll-admin", permission: "publish" });
    return repository;
  };

  const paint = () => { if (!destroyed) renderSettings(surface, state); };
  const refresh = async () => {
    state.busy = true; state.message = "正在加载模板…"; paint();
    try {
      const result = await getRepository().listTemplates();
      state.families = result.families; state.versions = result.versions;
      if (state.selectedFamilyId && !state.families.some((item) => item.familyId === state.selectedFamilyId)) state.selectedFamilyId = null;
      state.message = "";
    } catch (error) { state.message = error instanceof Error ? error.message : "模板加载失败"; }
    finally { state.busy = false; paint(); }
  };
  const open = async () => {
    state.editorOpen = false; state.selectedFamilyId = null;
    returnFocus = input.shadowRoot.activeElement instanceof HTMLElement ? input.shadowRoot.activeElement : openButton;
    input.pageRoot.classList.add("payroll-declaration-settings-open"); surface.hidden = false; openButton.setAttribute("aria-expanded", "true");
    if (!surface.open) surface.showModal();
    await refresh(); surface.querySelector<HTMLElement>("[data-declaration-close]")?.focus();
  };
  const close = () => {
    surface.close();
    input.pageRoot.classList.remove("payroll-declaration-settings-open"); surface.hidden = true; openButton.setAttribute("aria-expanded", "false"); returnFocus?.focus();
  };
  const selected = () => state.families.find((family) => family.familyId === state.selectedFamilyId) ?? null;
  const saveDraft = async () => {
    const source = surface.querySelector<HTMLTextAreaElement>("[data-declaration-source]")?.value.trim() ?? "";
    const languageDisplayName = surface.querySelector<HTMLInputElement>("[data-declaration-language]")?.value.trim() ?? "";
    const localeCode = surface.querySelector<HTMLInputElement>("[data-declaration-locale]")?.value.trim() ?? "";
    const storeScope = surface.querySelector<HTMLSelectElement>("[data-declaration-scope]")?.value === "store";
    let family = selected();
    state.busy = true; paint();
    try {
      if (!family) {
        family = await getRepository().createFamily({ localeCode, languageDisplayName, ...(storeScope ? { storeId: input.context.getScope().storeId } : {}) });
        state.selectedFamilyId = family.familyId;
      }
      await getRepository().saveDraft({ familyId: family.familyId, source, variableSchemaVersion: "v1" });
      state.message = "草稿已保存"; await refresh();
    } catch (error) { state.message = error instanceof Error ? error.message : "草稿保存失败"; }
    finally { state.busy = false; paint(); }
  };
  const publishDraft = async () => {
    const family = selected();
    const draft = family ? state.versions.filter((version) => version.familyId === family.familyId && version.status === "draft").sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))[0] : undefined;
    if (!family || !draft) { state.message = "请先保存草稿"; paint(); return; }
    state.busy = true; paint();
    try { await getRepository().publishVersion({ versionId: draft.versionId, expectedFamilyRevision: Number(family.revision ?? 0) }); state.message = "模板已发布"; await refresh(); }
    catch (error) { state.message = error instanceof Error ? error.message : "模板发布失败"; }
    finally { state.busy = false; paint(); }
  };
  const retirePublished = async () => {
    const family = selected();
    const version = family ? state.versions.find((item) => item.versionId === family.activeVersionId && item.status === "published") : undefined;
    if (!family || !version) return;
    state.busy = true; paint();
    try { await getRepository().retireVersion({ versionId: version.versionId, expectedFamilyRevision: Number(family.revision ?? 0) }); state.message = "模板已停用"; await refresh(); }
    catch (error) { state.message = error instanceof Error ? error.message : "模板停用失败"; }
    finally { state.busy = false; paint(); }
  };

  const onClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (state.busy) return;
    if (target.closest("[data-declaration-editor-close]")) { closeEditor(); return; }
    if (target.closest("[data-declaration-close]")) { close(); return; }
    if (target.closest("[data-declaration-new]")) { state.selectedFamilyId = null; state.editorOpen = true; state.message = ""; paint(); surface.querySelector<HTMLElement>("[data-declaration-language]")?.focus(); return; }
    const familyButton = target.closest<HTMLElement>("[data-declaration-family]");
    if (familyButton) { state.selectedFamilyId = familyButton.dataset.declarationFamily ?? null; state.editorOpen = true; state.message = ""; paint(); surface.querySelector<HTMLElement>("[data-declaration-editor-close]")?.focus(); return; }
    const variableButton = target.closest<HTMLElement>("[data-declaration-variable]");
    if (variableButton) {
      const editor = surface.querySelector<HTMLTextAreaElement>("[data-declaration-source]");
      if (editor) { const token = `{{${variableButton.dataset.declarationVariable}}}`; editor.setRangeText(token, editor.selectionStart, editor.selectionEnd, "end"); editor.focus(); }
      return;
    }
    if (target.closest("[data-declaration-save]")) { void saveDraft(); return; }
    if (target.closest("[data-declaration-publish]")) { void publishDraft(); return; }
    if (target.closest("[data-declaration-retire]")) { void retirePublished(); return; }
    if (target.closest("[data-declaration-new-version]")) {
      const version = selected() ? applicableVersion(selected()!, state.versions) : undefined;
      if (version) { version.status = "draft"; version.versionId = ""; }
      state.message = "请编辑正文并保存为新版本"; paint();
      return;
    }
  };
  const closeEditor = () => {
    state.editorOpen = false; state.selectedFamilyId = null; state.message = ""; paint();
    surface.querySelector<HTMLElement>("[data-declaration-new]")?.focus();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (!state.editorOpen) return;
    if (event.key === "Escape" && !state.busy) { event.preventDefault(); event.stopPropagation(); closeEditor(); return; }
    if (event.key !== "Tab") return;
    const controls = Array.from(surface.querySelectorAll<HTMLElement>('[role="dialog"] button:not(:disabled), [role="dialog"] input:not(:disabled), [role="dialog"] select:not(:disabled), [role="dialog"] textarea:not(:disabled)'));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && input.shadowRoot.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && input.shadowRoot.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  openButton.addEventListener("click", () => { void open(); });
  surface.addEventListener("click", onClick);
  surface.addEventListener("keydown", onKeyDown);
  surface.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (state.busy) return;
    if (state.editorOpen) closeEditor();
    else close();
  });

  return { open, close, refresh, destroy() { destroyed = true; surface.removeEventListener("click", onClick); surface.removeEventListener("keydown", onKeyDown); surface.remove(); openButton.remove(); } };
}
