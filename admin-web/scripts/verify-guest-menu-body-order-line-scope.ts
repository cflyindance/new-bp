import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FOH_SETTINGS_ASSIGN_MAP } from "./lib/foh-settings-groups.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_ORDER = [
  516, 518, 606, 517, 520, 608, 515, 528, 618,
  616, 524, 607, 519, 645, 509, 525, 526, 617,
] as const;

const EXPECTED_LINES: Record<number, readonly string[]> = {
  516: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  518: ["emenu", "sdi", "kiosk", "online-order"],
  606: ["emenu", "sdi", "kiosk", "online-order"],
  517: ["emenu", "sdi", "kiosk", "online-order"],
  520: ["kiosk"],
  608: ["emenu", "sdi", "kiosk", "online-order"],
  515: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  528: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  618: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  616: ["emenu", "sdi"],
  524: ["emenu", "sdi", "kiosk", "online-order"],
  607: ["emenu", "sdi", "kiosk", "online-order"],
  519: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  645: ["emenu", "sdi", "kiosk", "online-order"],
  509: ["emenu", "sdi", "kiosk", "online-order", "cds"],
  525: ["emenu", "sdi", "kiosk", "online-order"],
  526: ["emenu", "sdi", "kiosk", "online-order"],
  617: ["emenu", "sdi", "kiosk", "online-order"],
};

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseLineScopeSource(source: string): Record<number, string[]> {
  const objectMatch = source.match(
    /GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ\s*=\s*\{([\s\S]*?)\}\s*as const/,
  );
  assert(objectMatch, "missing GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ SSOT");
  const result: Record<number, string[]> = {};
  for (const match of objectMatch[1].matchAll(/(\d+)\s*:\s*\[([^\]]*)\]/g)) {
    result[Number(match[1])] = [...match[2].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  }
  return result;
}

assert(
  JSON.stringify(FOH_SETTINGS_ASSIGN_MAP["foh-guest-menu-body"]) === JSON.stringify(EXPECTED_ORDER),
  `菜单与购物车展示排序不正确：${JSON.stringify(FOH_SETTINGS_ASSIGN_MAP["foh-guest-menu-body"])}`,
);

const scopePath = "src/config/module-settings-guest-menu-body-line-scope.ts";
assert(fs.existsSync(path.join(repoRoot, scopePath)), `missing ${scopePath}`);
const actualLines = parseLineScopeSource(read(scopePath));
assert(JSON.stringify(actualLines) === JSON.stringify(EXPECTED_LINES), "18 项产线 SSOT 与需求矩阵不一致");

const structure = read("src/config/module-settings-guest-menu-structure-ui.ts");
const points = read("src/config/module-settings-member-points-rewards-ui.ts");
const imageMode = read("src/config/module-settings-guest-menu-image-mode-ui.ts");
const toggleUi = read("src/config/module-settings-toggle-ui.ts");
const main = read("src/main.ts");
const form = read("src/config/module-settings-form-ui.ts");
const draft = read("src/config/page-settings-draft.ts");
const byLine = read("src/config/foh-settings-by-line-toggle.ts");

assert(structure.includes("517-guest-menu-nav-position-enabled-lines"), "517 缺少产线启用字段");
assert(points.includes("526-points-dish-position-enabled-lines"), "526 缺少产线启用字段");
assert(structure.includes('label: "顶部展示"') && structure.includes('label: "侧边展示"'), "517 选项文案/顺序不正确");
assert(points.includes('label: "顶部展示"') && points.includes('label: "底部展示"'), "526 选项文案不正确");
assert(
  imageMode.indexOf('label: "默认"') < imageMode.indexOf('label: "大图模式"') &&
    imageMode.indexOf('label: "大图模式"') < imageMode.indexOf('label: "小图模式"'),
  "607 模式文案/顺序不正确",
);
assert(!toggleUi.includes("...GUEST_MENU_IMAGE_MODE_TOGGLE_SEQ"), "607 仍在通用开关列表中");
assert(!main.includes("setGuestMenuImageModePanelVisible(item.seq, next)"), "607 仍由全局开关联动可见性");
for (const [name, source] of [["form", form], ["draft", draft], ["byLine", byLine]] as const) {
  assert(source.includes("isFohLinesToggleMirrorExcludedSeq"), `${name} 未应用 607 镜像排除规则`);
}

const stateHelper = read("src/config/module-setting-storage-state.ts");
assert(stateHelper.includes('state: "missing"') && stateHelper.includes('state: "invalid"'), "缺少存储三态读取");

console.log("guest menu body order and line-scope verification passed");
