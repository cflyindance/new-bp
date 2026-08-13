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
const batch = read("src/emenu-local/seasoning/seasoning-batch-wizard-ui.ts");
const menuPicker = read("src/emenu-local/seasoning/seasoning-menu-structure-picker-ui.ts");
const drawer = read("src/emenu-local/seasoning/seasoning-product-drawer-ui.ts");
const options = read("src/emenu-local/seasoning/seasoning-option-library-ui.ts");
const i18n = read("src/i18n.ts");

expect(shell, /renderSeasoningSettingsPage/, "Seasoning route must render the real settings page");
expect(shell, /bindSeasoningSettingsPage/, "Seasoning route must bind the real settings page");
expect(page, /data-seasoning-settings-page/, "Seasoning page needs a stable root marker");
expect(page, /data-seasoning-tab="relations"/, "Relations tab is missing");
expect(page, /data-seasoning-tab="options"/, "Option library tab is missing");
expect(page, /data-seasoning-open-batch/, "Batch association entry is missing");
expect(batch, /data-seasoning-batch-wizard/, "Batch wizard marker is missing");
expect(batch, /data-seasoning-batch-step/, "Batch wizard steps are missing");
expect(batch, /const labels = \[t\("seasoning\.batch\.stepProduct"\), t\("seasoning\.batch\.stepConfigure"\), t\("seasoning\.batch\.stepPreview"\)\]/, "Batch wizard must use Product → Actions & Options → Preview order");
expect(batch, /this\.step === 1 \? this\.renderProductStep\(\) : this\.step === 2 \? this\.renderConfigurationStep\(\) : this\.renderPreviewStep\(\)/, "Batch wizard content order is incorrect");
expect(batch, /data-open-action-picker/, "Combined configuration step must add actions in place");
expect(batch, /data-open-option-picker/, "Combined configuration step must add options in place");
expect(batch, /data-action-option-price/, "Linked options must support per-action pricing");
expect(batch, /data-bulk-action-price/, "Current action must expose a bulk price input");
expect(batch, /data-fill-bulk-price/, "Current action must expose a fill-all price action");
expect(batch, /data-select-price-option/, "Option rows must support selecting a subset for bulk pricing");
expect(batch, /data-select-visible-price-options/, "Option table must support selecting visible rows");
expect(batch, /data-fill-selected-prices/, "Selected options must expose a bulk pricing action");
expect(batch, /normalizedBulkPrice/, "Bulk price input must enforce the shared amount precision");
expect(batch, /createProductSelection/, "Batch wizard must create one server-side product selection draft");
expect(batch, /loadMenuStructure/, "Batch wizard must load the real menu hierarchy");
expect(batch, /loadPreviewItems/, "Batch preview must use paginated server results");
expect(batch, /updatePreviewDecision/, "Cross-page preview decisions must be persisted by the API");
expect(batch, /preview_expired[\s\S]*seasoningApi\.productSelection/, "Expired previews must revalidate the product selection before choosing the recovery step");
if (/data-select-page/.test(batch)) throw new Error("Legacy select-page action must be removed");
expect(menuPicker, /data-seasoning-menu-structure-picker/, "Menu hierarchy picker marker is missing");
expect(menuPicker, /data-menu-column="group"/, "Group column is missing");
expect(menuPicker, /data-menu-column="category"/, "Category column is missing");
expect(menuPicker, /data-menu-column="dish"/, "Dish column is missing");
expect(menuPicker, /indeterminate/, "Menu picker must synchronize native indeterminate state");
if (/data-menu-column="line"|data-seasoning-line/.test(menuPicker)) throw new Error("Seasoning menu picker must not expose a production-line dimension");
expect(drawer, /data-seasoning-product-drawer/, "Product drawer marker is missing");
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
];

for (const key of keys) {
  const count = i18n.split(`"${key}"`).length - 1;
  if (count < 2) throw new Error(`Missing bilingual i18n key: ${key}`);
}

console.log("eMenu local seasoning settings structure verification passed");
