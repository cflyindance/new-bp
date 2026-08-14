/**
 * 前厅设置通用「产线 × 选项」多选矩阵。
 * 只负责值规范化、渲染、收集和事件绑定；持久化与业务迁移由调用方负责。
 */

export type ProductLineOptionDefinition<Id extends string> = Readonly<{
  id: Id;
  label: string;
}>;

export type ProductLineOptionMatrixValue<LineId extends string, OptionId extends string> = Record<
  LineId,
  OptionId[]
>;

export type ProductLineOptionMatrixConfig<LineId extends string, OptionId extends string> = Readonly<{
  id: string;
  lines: readonly ProductLineOptionDefinition<LineId>[];
  options: readonly ProductLineOptionDefinition<OptionId>[];
  optionColumnLabel: string;
  minWidthClass?: string;
}>;

const MODULE_SETTING_CONTROL_CLASS =
  "size-4 shrink-0 accent-primary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const MATRIX_ATTR = "data-product-line-option-matrix";
const MATRIX_LINE_ATTR = "data-product-line-option-matrix-line";
const MATRIX_OPTION_ATTR = "data-product-line-option-matrix-option";
const FOH_LINE_CONFIG_ROW_ATTR = "data-foh-line-config-row";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function matrixEditors(root: ParentNode, matrixId: string): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[${MATRIX_ATTR}]`)].filter(
    (editor) => editor.getAttribute(MATRIX_ATTR) === matrixId,
  );
}

export function createEmptyProductLineOptionMatrix<
  LineId extends string,
  OptionId extends string,
>(
  lines: readonly ProductLineOptionDefinition<LineId>[],
): ProductLineOptionMatrixValue<LineId, OptionId> {
  const result = {} as ProductLineOptionMatrixValue<LineId, OptionId>;
  for (const line of lines) result[line.id] = [];
  return result;
}

export function normalizeProductLineOptionMatrix<
  LineId extends string,
  OptionId extends string,
>(
  raw: unknown,
  lines: readonly ProductLineOptionDefinition<LineId>[],
  options: readonly ProductLineOptionDefinition<OptionId>[],
): ProductLineOptionMatrixValue<LineId, OptionId> {
  const result = createEmptyProductLineOptionMatrix<LineId, OptionId>(lines);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return result;

  const record = raw as Record<string, unknown>;
  const allowed = new Set<string>(options.map((option) => option.id));
  for (const line of lines) {
    const rawValues = record[line.id];
    if (!Array.isArray(rawValues)) continue;
    const selected = new Set(
      rawValues.filter(
        (value): value is OptionId => typeof value === "string" && allowed.has(value),
      ),
    );
    result[line.id] = options.map((option) => option.id).filter((id) => selected.has(id));
  }
  return result;
}

export function renderProductLineOptionMatrixHtml<
  LineId extends string,
  OptionId extends string,
>(
  config: ProductLineOptionMatrixConfig<LineId, OptionId>,
  values: ProductLineOptionMatrixValue<LineId, OptionId>,
  enabled = true,
): string {
  const rows = config.lines
    .map((line) => {
      const selected = new Set(values[line.id] ?? []);
      const inputs = config.options
        .map((option) => {
          const checked = selected.has(option.id);
          return `
        <label class="inline-flex items-center gap-1.5 text-sm text-foreground ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"}">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CONTROL_CLASS} rounded-sm"
            value="${escapeHtml(option.id)}"
            ${MATRIX_LINE_ATTR}="${escapeHtml(line.id)}"
            ${MATRIX_OPTION_ATTR}="${escapeHtml(option.id)}"
            ${checked ? "checked" : ""}
            ${enabled ? "" : "disabled"}
            aria-label="${escapeHtml(line.label)} ${escapeHtml(option.label)}"
          />
          <span>${escapeHtml(option.label)}</span>
        </label>`;
        })
        .join("");

      return `
      <tr class="border-t border-border" ${FOH_LINE_CONFIG_ROW_ATTR}="${escapeHtml(line.id)}">
        <td class="px-3 py-2.5 text-sm font-medium text-foreground whitespace-nowrap align-top">${escapeHtml(line.label)}</td>
        <td class="px-3 py-2.5">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">${inputs}</div>
        </td>
      </tr>`;
    })
    .join("");

  return `
    <div ${MATRIX_ATTR}="${escapeHtml(config.id)}" class="overflow-x-auto rounded-md border border-border">
      <table class="w-full ${config.minWidthClass ?? "min-w-[20rem]"} border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium w-[7.5rem]">产线</th>
            <th class="px-3 py-2 font-medium">${escapeHtml(config.optionColumnLabel)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function setProductLineOptionMatrixEnabled(
  matrixId: string,
  enabled: boolean,
  root: ParentNode = document,
): void {
  for (const editor of matrixEditors(root, matrixId)) {
    editor.querySelectorAll<HTMLInputElement>(`[${MATRIX_OPTION_ATTR}]`).forEach((input) => {
      input.disabled = !enabled;
      const label = input.closest("label");
      if (!label) return;
      label.classList.toggle("cursor-not-allowed", !enabled);
      label.classList.toggle("opacity-50", !enabled);
      label.classList.toggle("cursor-pointer", enabled);
    });
  }
}

export function collectProductLineOptionMatrixValues<
  LineId extends string,
  OptionId extends string,
>(
  editor: HTMLElement,
  config: ProductLineOptionMatrixConfig<LineId, OptionId>,
): ProductLineOptionMatrixValue<LineId, OptionId> {
  const raw: Record<string, string[]> = {};
  for (const line of config.lines) raw[line.id] = [];

  editor
    .querySelectorAll<HTMLInputElement>(`[${MATRIX_LINE_ATTR}][${MATRIX_OPTION_ATTR}]:checked`)
    .forEach((input) => {
      const lineId = input.getAttribute(MATRIX_LINE_ATTR);
      const optionId = input.getAttribute(MATRIX_OPTION_ATTR);
      if (!lineId || !optionId || !Object.hasOwn(raw, lineId)) return;
      raw[lineId].push(optionId);
    });

  return normalizeProductLineOptionMatrix(raw, config.lines, config.options);
}

export function bindProductLineOptionMatrix<LineId extends string, OptionId extends string>(
  config: ProductLineOptionMatrixConfig<LineId, OptionId>,
  onChange: (values: ProductLineOptionMatrixValue<LineId, OptionId>) => void,
  root: ParentNode = document,
): void {
  for (const editor of matrixEditors(root, config.id)) {
    if (editor.dataset.productLineOptionMatrixBound === "1") continue;
    editor.dataset.productLineOptionMatrixBound = "1";
    editor.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(`[${MATRIX_OPTION_ATTR}]`)) return;
      onChange(collectProductLineOptionMatrixValues(editor, config));
    });
  }
}
