import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath) {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) throw new Error(`Missing required file: ${relativePath}`);
  return fs.readFileSync(absolute, "utf8");
}

function expect(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

const shell = read("src/shell/emenu-local-shell.ts");
const page = read("src/emenu-local/seasoning/seasoning-page.ts");
const overview = read("src/emenu-local/seasoning/seasoning-overview-ui.ts");
const store = read("src/emenu-local/seasoning/seasoning-store.ts");
const batch = read("src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts");
const batchPricing = read("src/emenu-local/seasoning/seasoning-batch-pricing.ts");
const menuPicker = read("src/emenu-local/seasoning/seasoning-menu-structure-picker-ui.ts");
const drawer = read("src/emenu-local/seasoning/seasoning-product-drawer-ui.ts");
const workspace = read("src/emenu-local/seasoning/seasoning-configuration-workspace-ui.ts");
const relationOrder = read("src/emenu-local/seasoning/seasoning-relation-order.ts");
const categoryManager = read("src/emenu-local/seasoning/seasoning-option-category-manager-ui.ts");
const apiHandler = read("scripts/lib/emenu-local-seasoning-api-handler.mjs");
const options = read("src/emenu-local/seasoning/seasoning-option-library-ui.ts");
const i18n = read("src/i18n.ts");

expect(shell, /renderSeasoningSettingsPage/, "Seasoning route must render the real settings page");
expect(shell, /bindSeasoningSettingsPage/, "Seasoning route must bind the real settings page");
expect(page, /data-seasoning-settings-page/, "Seasoning page needs a stable root marker");
expect(page, /data-seasoning-tab="relations"/, "Relations tab is missing");
expect(page, /data-seasoning-tab="options"/, "Option library tab is missing");
expect(page, /data-seasoning-open-batch/, "Batch association entry is missing");
expect(store, /relationProductGroups/, "Relations tab must load product-group pages");
expect(overview, /data-seasoning-edit-product/, "Product rows must support editing complete associations");
expect(overview, /data-seasoning-delete-product/, "Product rows must support deleting complete associations");
expect(page, /relations:\s*\[\]/, "Deleting a product row must remove every product association");
expect(overview, /data-seasoning-product-row/, "Relations overview must render one top-level row per product");
expect(overview, /data-seasoning-product-action/, "Relations overview must group options by action");
expect(overview, /data-seasoning-product-option/, "Relations overview must render options inside action rows");
expect(overview, /flex-wrap/, "Options in an action must remain inline and wrap when needed");
expect(overview, /data-seasoning-relation-pagination/, "Relations overview must expose number pagination");
expect(overview, /relation-page-size/, "Relations overview must expose the 5, 10, 20, 50 page-size selector");
expect(batch, /data-seasoning-batch-wizard/, "Batch wizard marker is missing");
expect(batch, /data-seasoning-batch-step/, "Batch wizard steps are missing");
expect(batch, /const labels = \[t\("seasoning\.batch\.stepProduct"\), t\("seasoning\.batch\.stepConfigure"\), t\("seasoning\.batch\.stepPreview"\)\]/, "Batch wizard must use Product → Actions & Options → Preview order");
expect(batch, /this\.step === 1 \? this\.renderProductStep\(\) : this\.step === 2 \? this\.renderSharedConfigurationStep\(\) : this\.renderPreviewStep\(\)/, "Batch wizard content order is incorrect");
expect(batch, /data-open-action-picker/, "Combined configuration step must add actions in place");
expect(batch, /data-open-option-picker/, "Combined configuration step must add options in place");
expect(batch, /data-action-option-price/, "Linked options must support per-action pricing");
expect(batch, /data-action-option-coefficient/, "Linked options must expose the generated markup coefficient");
expect(batch, /data-action-option-actual-price/, "Linked options must expose the calculated actual markup price");
if (/data-option-free/.test(batch)) throw new Error("Pricing table must not contain a free-option branch");
if (/\$\{t\("seasoning\.optionCode"\)\}/.test(batch)) throw new Error("Pricing table must not display the internal option code column");
expect(batch, /data-bulk-action-price/, "Current action must expose a bulk price input");
expect(batch, /data-fill-bulk-price/, "Current action must expose a fill-all price action");
expect(batch, /data-select-price-option/, "Option rows must support selecting a subset for bulk pricing");
expect(batch, /data-select-visible-price-options/, "Option table must support selecting visible rows");
expect(batch, /data-fill-selected-prices/, "Selected options must expose a bulk pricing action");
expect(batch, /normalizedBulkPrice/, "Bulk price input must enforce the shared amount precision");
expect(batchPricing, /MIN_MARKUP_COEFFICIENT\s*=\s*0\.5/, "Paid coefficient minimum must be 0.50");
expect(batchPricing, /MAX_MARKUP_COEFFICIENT\s*=\s*2/, "Paid coefficient maximum must be 2.00");
expect(batch, /calculateActualMarkupPrice/, "Preview must use the calculated actual markup price");
expect(batch, /createProductSelection/, "Batch wizard must create one server-side product selection draft");
expect(batch, /loadMenuStructure/, "Batch wizard must load the real menu hierarchy");
expect(batch, /loadPreviewProducts/, "Batch preview must use product-group pagination");
expect(batch, /data-preview-product/, "Preview must render one top-level row per product");
expect(batch, /data-preview-action/, "Preview products must group options by action");
expect(batch, /data-preview-option-name/, "Preview action rows must expose the Option field");
expect(batch, /data-preview-option-input-price/, "Preview action rows must expose the read-only Option base price");
expect(batch, /data-preview-option-coefficient/, "Preview action rows must expose the read-only markup coefficient");
expect(batch, /data-preview-option-actual-price/, "Preview action rows must expose the read-only actual price");
expect(batch, /Option 原价/, "Preview action headers must label the Option base price");
expect(batch, /加价系数/, "Preview action headers must label the markup coefficient");
expect(batch, /实际价格/, "Preview action headers must label the actual price");
expect(batch, /inputPrice:\s*pricing\.inputPrice/, "Preview requests must preserve the configured Option base price");
expect(batch, /markupCoefficient:\s*pricing\.markupCoefficient/, "Preview requests must preserve the generated markup coefficient");
if (/data-candidate-price/.test(batch)) throw new Error("Preview prices must be read-only");
if (/data-decision=/.test(batch)) throw new Error("Preview action rows must not expose conflict decision controls");
expect(batch, /data-toggle-preview-product/, "Preview products must support expand and collapse");
expect(batch, /collapsedPreviewProducts/, "Product collapse state must survive preview refreshes");
expect(batch, /previewProducts/, "Batch preview must use the grouped product endpoint");
expect(batch, /data-preview-page-size/, "Preview must expose a page-size selector");
expect(batch, /data-preview-page=/, "Preview must expose direct numeric page buttons");
expect(batch, /previewPageItems/, "Preview must collapse large page ranges with ellipses");
if (/data-preview-kind/.test(batch)) throw new Error("Preview must not expose the status filter");
if (/可直接确认/.test(batch)) throw new Error("Preview must not display the direct-confirm status block");
if (/previewCursors|previewPageIndex/.test(batch)) throw new Error("Preview UI must use direct number pagination instead of a cursor stack");
expect(batch, /preview_expired[\s\S]*seasoningApi\.productSelection/, "Expired previews must revalidate the product selection before choosing the recovery step");
if (/data-select-page/.test(batch)) throw new Error("Legacy select-page action must be removed");
expect(menuPicker, /data-seasoning-menu-structure-picker/, "Menu hierarchy picker marker is missing");
expect(menuPicker, /data-menu-column="group"/, "Group column is missing");
expect(menuPicker, /data-menu-column="category"/, "Category column is missing");
expect(menuPicker, /data-menu-column="dish"/, "Dish column is missing");
expect(menuPicker, /indeterminate/, "Menu picker must synchronize native indeterminate state");
if (/data-menu-column="line"|data-seasoning-line/.test(menuPicker)) throw new Error("Seasoning menu picker must not expose a production-line dimension");
expect(drawer, /data-seasoning-product-editor/, "Single-product editor marker is missing");
expect(drawer, /renderSeasoningConfigurationWorkspace/, "Single-product editor must reuse the batch configuration workspace");
expect(drawer, /const labels = \[t\("seasoning\.batch\.stepConfigure"\), t\("seasoning\.batch\.stepPreview"\)\]/, "Single-product editor must expose exactly Actions & Options and Preview steps");
expect(drawer, /this\.step === 1 \? this\.renderConfiguration\(\) : this\.renderPreview\(\)/, "Single-product editor step content is incorrect");
if (/renderProductStep|data-seasoning-menu-structure-picker/.test(drawer)) throw new Error("Single-product editor must not expose a product-selection step");
expect(workspace, /data-drag-action/, "Actions must expose drag handles");
expect(workspace, /data-drag-option/, "Options must expose drag handles");
expect(workspace, /pointerdown/, "Shared workspace must support pointer drag sorting");
expect(workspace, /event\.altKey/, "Shared workspace must support Alt + Arrow keyboard sorting");
expect(workspace, /clearSearchToReorder/, "Option search must explain why sorting is temporarily disabled");
expect(workspace, /data-action-option-status/, "Single-product editing must retain relation status controls");
expect(workspace, /data-option-category-toggle/, "Option picker categories must support bulk selection");
expect(workspace, /data-activate-option-category/, "Option picker must use linked category and Option columns");
expect(workspace, /data-option-category-indeterminate/, "Option category selection must expose a native partial state");
expect(workspace, /grid[\s\S]*md:grid-cols-\[280px_minmax\(0,1fr\)\]/, "Option picker must switch from stacked mobile layout to two desktop columns");
expect(categoryManager, /data-option-category-manager/, "Public Option library must expose category management");
expect(categoryManager, /reorderOptionCategories/, "Option category manager must persist drag order through the server");
expect(categoryManager, /option_category_in_use/, "Referenced Option categories must show a specific deletion error");
expect(relationOrder, /SEASONING_SORT_MARKER\s*=\s*10_000_000/, "Relation ordering needs an explicit encoded-format marker");
expect(relationOrder, /assignSeasoningSortOrders/, "Client save payloads must encode action and Option order");
expect(apiHandler, /buildBatchFinalProducts/, "Batch preview must build the final per-product configuration");
expect(apiHandler, /preservedPreviewRelation/, "Batch merge must preserve unselected historical relations");
expect(apiHandler, /encodeRelationSortOrder/, "Server writes must own and validate persisted ordering");
expect(apiHandler, /optionPickerSnapshot/, "Option picker must use a complete categorized server snapshot");
expect(apiHandler, /normalizeOptionCategoryDb/, "Legacy Option data must migrate to a persistent category");
expect(apiHandler, /option_active_limit_exceeded/, "Server must enforce the active Option limit on writes");
expect(options, /data-seasoning-option-library/, "Option library marker is missing");

const keys = [
  "seasoning.title",
  "seasoning.relationsTab",
  "seasoning.optionsTab",
  "seasoning.batch.open",
  "seasoning.action.add",
  "seasoning.action.less",
  "seasoning.action.more",
  "seasoning.action.none",
  "seasoning.save",
  "seasoning.discardConfirm",
  "seasoning.productSelectionExpired",
  "seasoning.deleteProductConfirm",
  "seasoning.perPage",
  "seasoning.batch.inputPrice",
  "seasoning.batch.markupCoefficient",
  "seasoning.batch.actualMarkupPrice",
];

for (const key of keys) {
  const count = i18n.split(`"${key}"`).length - 1;
  if (count < 2) throw new Error(`Missing bilingual i18n key: ${key}`);
}

expect(i18n, /"seasoning\.batch\.inputPrice":\s*"输入原价"/, "Chinese configuration label must use 输入原价");
expect(i18n, /"seasoning\.batch\.inputPrice":\s*"Input base price"/, "English configuration label must use Input base price");

console.log("eMenu local seasoning settings structure verification passed");
