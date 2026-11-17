import { combineIntervalParts } from "./interval-display";
import { renderPageStorePickerBar } from "../shell/page-store-picker";
import { renderPageSaveBar } from "./page-save-bar-ui";
import {
  renderSettingsCategoryLayout,
  bindSettingsCategoryLayouts,
} from "./settings-category-layout";
import {
  MENU_ORDER_OTHER_SETTINGS_PATH,
  MENU_ORDER_OTHER_SETTINGS_SECTIONS,
} from "./menu-order-other-settings-navigation";
import {
  MENU_ORDER_LIMIT_OTHER_PRODUCT_LINES as lines,
  type MenuOrderLimitOtherProductLineId as Line,
} from "./menu-order-limit-product-lines";
import {
  readGuestOrderPlaceIntervalByLine as readInterval,
  writeGuestOrderPlaceIntervalByLine as writeInterval,
} from "./module-settings-guest-order-place-interval-ui";
import {
  readGuestOrderIntervalAllowCartByLine as readOrder,
  writeGuestOrderIntervalAllowCartByLine as writeOrder,
} from "./module-settings-guest-order-interval-allow-cart-ui";
import {
  readGuestMenuIntervalAllowCartByLine as readMenu,
  writeGuestMenuIntervalAllowCartByLine as writeMenu,
} from "./module-settings-guest-menu-interval-allow-cart-ui";
import {
  readRuleHitPasswordAuthByLine as readAuth,
  writeRuleHitPasswordAuthByLine as writeAuth,
} from "./module-settings-rule-hit-password-auth-ui";
import {
  readViewonlyDishRuleLines as readView,
  writeViewonlyDishRuleLines as writeView,
} from "./module-settings-viewonly-dish-rules-ui";
import {
  readPointsDishAuthOrderLines as readPoints,
  writePointsDishAuthOrderLines as writePoints,
} from "./module-settings-points-dish-auth-order-ui";
import {
  readMemberPointsToggleFieldLines as readOnly,
  writeMemberPointsToggleFieldLines as writeOnly,
} from "./module-settings-member-points-rewards-ui";
import { renderGuestMenuOrderIntervalPanelHtml } from "./module-settings-guest-menu-order-interval-ui";
import "./order-settings-cards.css";

const titles = [
  "订单下单时间间隔",
  "间隔时间内允许加购",
  "间隔时间内允许加购",
  "命中规则后密码授权",
  "允许可看不可点菜直接加入购物车",
  "可看不可点菜需服务员授权",
  "积分菜兑换需要权限",
  "允许纯积分商品订单兑换",
];
const help = [
  "两次订单提交的最小间隔，小于间隔时需服务员授权。",
  "设置订单间隔内是否直接允许加购；不设置加购授权或数量阈值。",
  "设置商品间隔内是否直接允许加购；不设置加购授权或数量阈值。",
  "设置规则命中后的密码授权频次。",
  "关闭时，添加可看不可点菜需密码授权。",
  "设置可看不可点菜是否需要服务员授权。",
  "兑换积分菜须服务员输入密码授权。",
  "允许订单仅含积分商品时直接下单兑换。",
];
const seqs = [588, 589, 591, 646, 595, 596, 594, 527];
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function toggle(
  line: Line,
  rule: number | "expand",
  on: boolean,
  label: string,
): string {
  return `<input type="checkbox" role="switch" class="order-setting-switch ${rule === "expand" ? "order-line-switch" : ""}" data-order-card-toggle="${rule}" data-line="${line}" aria-label="${esc(label)}" ${on ? "checked" : ""}>`;
}
function number(line: Line, _rule: number, value: number, max: number, label: string, _unit = ""): string {
  return `<div class="order-duration-parts"><label><input type="number" min="0" max="${max/60}" step="1" value="${Math.floor(value/60)}" data-order-duration-part="minutes" data-line="${line}" aria-label="${esc(label)} 分钟"><span>分</span></label><label><input type="number" min="0" max="59" step="1" value="${value%60}" data-order-duration-part="seconds" data-line="${line}" aria-label="${esc(label)} 秒"><span>秒</span></label></div>`;
}
function choices(
  line: Line,
  rule: number,
  selected: string,
  options: string[][],
): string {
  return `<div class="order-card-choices" role="radiogroup" aria-label="${rule === 3 ? "授权模式" : "加购策略"}">${options.map(([value, label]) => `<label><input type="radio" name="order-card-${rule}-${line}" data-order-card-mode="${rule}" data-line="${line}" value="${value}" ${selected === value ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
}
type IntervalScene = "order" | "product";
let activeIntervalScene: IntervalScene = "order";

function renderCategoryCards(category: string, scene?: IntervalScene): string {
  const interval = readInterval(),
    order = readOrder(),
    menu = readMenu(),
    auth = readAuth();
  const selections = [
    readView(595),
    readView(596),
    readPoints(),
    readOnly(527),
  ];
  return `<section id="menu-order-other-${category}${scene ? `-${scene}` : ""}" class="order-settings-cards" ${scene ? "" : `data-menu-order-other-category="${category}"`}>${scene ? "" : `<header class="order-settings-heading"><h3>${MENU_ORDER_OTHER_SETTINGS_SECTIONS.find((s) => s.key === category)!.title}</h3></header>`}${scene === "product" ? `<section class="order-product-rules" data-module-setting-row-seq="590"><header class="order-settings-heading"><h3>商品间隔规则</h3><p>为指定商品设置两次下单的最小间隔分钟数</p></header>${renderGuestMenuOrderIntervalPanelHtml(true)}</section><header class="order-settings-heading order-product-policy-heading"><h3>间隔内加购设置</h3></header>` : ""}${lines
    .map((line) => {
      const id = line.id,
        states = [
          interval[id].enabled,
          order[id].enabled,
          menu[id].enabled,
          auth[id].enabled,
          ...selections.map((s) => s.includes(id)),
        ];
      const indices =
        category === "interval"
          ? scene === "product"
            ? [2]
            : [0, 1]
          : category === "auth"
            ? [3, 4, 5]
            : [6, 7];
      const expanded = indices.some((i) => states[i]);
      return `<section class="order-line-card" data-order-line="${id}"><header><span class="order-line-badge">${line.label}</span>${toggle(id, "expand", expanded, `${line.label} 展开规则设置`)}</header><div class="order-line-rules" ${expanded ? "" : "hidden"}>${titles
        .map((title, i) => {
          if (!indices.includes(i)) return "";
          let body = "";
          if (i === 0)
            body = `<div class="order-card-field"><div>最小间隔<small>最长60分钟（3600秒），小于间隔时需服务员授权</small></div>${number(id, i, interval[id].seconds, 3600, `${line.label} 最小间隔`, "秒")}</div>`;
          if (i === 1 || i === 2) {
            const item = i === 1 ? order[id] : menu[id];
            body = `<div class="order-card-field"><span>加购策略</span>${choices(
              id,
              i,
              item.mode,
              [
                ["allowed", "允许加购"],
                ["blocked", "不允许加购"],
              ],
            )}</div>`;
          }
          if (i === 3)
            body = `<div class="order-card-field"><span>授权模式</span>${choices(
              id,
              i,
              auth[id].mode,
              [
                ["auth-every", "每次命中均需授权"],
                ["auth-once", "授权一次后本单放行"],
              ],
            )}</div>`;
          return `<article class="order-rule-card" data-order-rule="${i}" data-module-setting-row-seq="${seqs[i]}"><header><div class="order-rule-title">${title}<button type="button" class="order-rule-help" title="${help[i]}" aria-label="${esc(title)}说明">?</button></div>${i === 1 || i === 2 ? "" : toggle(id, i, states[i], `${line.label} ${title}`)}</header>${body ? `<div class="order-rule-body" ${i === 1 || i === 2 || states[i] ? "" : "hidden"}>${body}</div>` : ""}</article>`;
        })
        .join("")}</div></section>`;
    })
    .join("")}</section>`;
}
function renderIntervalScenes(): string {
  return `<section id="menu-order-other-interval" data-menu-order-other-category="interval"><div class="order-interval-tabs" role="tablist" aria-label="下单间隔场景">${(["order", "product"] as const).map((scene) => `<button type="button" id="order-interval-tab-${scene}" role="tab" aria-selected="${activeIntervalScene === scene}" aria-controls="order-interval-scene-${scene}" tabindex="${activeIntervalScene === scene ? 0 : -1}" data-order-interval-scene="${scene}">${scene === "order" ? "订单间隔" : "商品间隔"}</button>`).join("")}</div>${(["order", "product"] as const).map((scene) => `<div role="tabpanel" id="order-interval-scene-${scene}" aria-labelledby="order-interval-tab-${scene}" ${activeIntervalScene === scene ? "" : "hidden"}>${renderCategoryCards("interval", scene)}</div>`).join("")}</section>`;
}

export function renderOrderSettingsCards(): string {
  const body = MENU_ORDER_OTHER_SETTINGS_SECTIONS.map((s) =>
    s.key === "interval" ? renderIntervalScenes() : renderCategoryCards(s.key),
  ).join("");
  const categories = MENU_ORDER_OTHER_SETTINGS_SECTIONS.map((s) => ({
    ...s,
    targetId: `menu-order-other-${s.key}`,
  }));
  return `<div class="order-settings-scroll order-settings-with-nav" data-order-settings-cards><header class="order-settings-page-heading"><div><h2>下单设置</h2></div><div class="order-settings-header-actions">${renderPageStorePickerBar(true)}${renderPageSaveBar(MENU_ORDER_OTHER_SETTINGS_PATH, "header")}</div></header>${renderSettingsCategoryLayout(MENU_ORDER_OTHER_SETTINGS_PATH, categories, body, { mode: "panels" })}</div>`;
}
/** Update one line only; sibling line settings are preserved by the existing normalizers. */
export function bindOrderSettingsCards(root: ParentNode): void {
  const host = root.querySelector<HTMLElement>("[data-order-settings-cards]");
  if (!host || host.dataset.bound) return;
  host.dataset.bound = "1";
  bindSettingsCategoryLayouts(host);
  const selectScene = (scene: IntervalScene, focus = false) => {
    activeIntervalScene = scene;
    const scroll = host.querySelector<HTMLElement>(
      "[data-settings-category-scroll]",
    );
    if (scroll) scroll.scrollTop = 0;
    host
      .querySelectorAll<HTMLButtonElement>("[data-order-interval-scene]")
      .forEach((button) => {
        const selected = button.dataset.orderIntervalScene === scene;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      });
    for (const id of ["order", "product"]) {
      const panel = host.querySelector<HTMLElement>(
        `#order-interval-scene-${id}`,
      );
      if (panel) panel.hidden = id !== scene;
    }
  };
  host.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>(
      "[data-order-interval-scene]",
    );
    const scene = button?.dataset.orderIntervalScene;
    if (scene === "order" || scene === "product") selectScene(scene);
  });
  host.addEventListener("keydown", (event) => {
    if (!(event.target as Element).matches("[data-order-interval-scene]"))
      return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const scene =
      event.key === "Home"
        ? "order"
        : event.key === "End"
          ? "product"
          : activeIntervalScene === "order"
            ? "product"
            : "order";
    selectScene(scene, true);
  });
  host.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.matches("[data-order-duration-part]")) {
      const line = input.dataset.line as Line;
      if (!lines.some(l => l.id === line)) return;
      const minutes = host.querySelector<HTMLInputElement>(`[data-order-duration-part="minutes"][data-line="${line}"]`)!;
      const seconds = host.querySelector<HTMLInputElement>(`[data-order-duration-part="seconds"][data-line="${line}"]`)!;
      const config = readInterval();
      config[line].seconds = combineIntervalParts(minutes.value, seconds.value, 0, 3600, 60);
      minutes.value = String(Math.floor(config[line].seconds/60)); seconds.value = String(config[line].seconds%60);
      writeInterval(config); return;
    }
    if (
      !input.matches(
        "[data-order-card-toggle],[data-order-card-number],[data-order-card-mode]",
      )
    )
      return;
    const line = input.dataset.line as Line;
    if (!lines.some((l) => l.id === line)) return;
    if (input.dataset.orderCardToggle === "expand") {
      const rules = input
        .closest("section")
        ?.querySelector<HTMLElement>(".order-line-rules");
      if (rules) rules.hidden = !input.checked;
      return;
    }
    const rule = Number(
      input.dataset.orderCardToggle ??
        input.dataset.orderCardNumber ??
        input.dataset.orderCardMode,
    );
    const isToggle = input.hasAttribute("data-order-card-toggle");
    if (rule === 0) {
      const config = readInterval();
      if (isToggle) config[line].enabled = input.checked;
      else {
        // Duration fields are handled by the combined minute/second inputs above.
      }
      writeInterval(config);
    }
    if (rule === 1 || rule === 2) {
      const config = rule === 1 ? readOrder() : readMenu();
      if (isToggle) config[line].enabled = input.checked;
      else if (input.hasAttribute("data-order-card-mode")) {
        if (input.value === "blocked" || input.value === "allowed")
          config[line].mode = input.value;
      }
      if (rule === 1) writeOrder(config);
      else writeMenu(config);
    }
    if (rule === 3) {
      const config = readAuth();
      if (isToggle) config[line].enabled = input.checked;
      else if (input.value === "auth-every" || input.value === "auth-once")
        config[line].mode = input.value;
      writeAuth(config);
    }
    if (rule >= 4) {
      const current =
        rule === 4 || rule === 5
          ? readView(rule === 4 ? 595 : 596)
          : rule === 6
            ? readPoints()
            : readOnly(527);
      const next = lines
        .map((l) => l.id)
        .filter((id) => (id === line ? input.checked : current.includes(id)));
      if (rule === 4 || rule === 5) writeView(rule === 4 ? 595 : 596, next);
      else if (rule === 6) writePoints(next);
      else writeOnly(527, next);
    }
    if (isToggle) {
      const body = input
        .closest("article")
        ?.querySelector<HTMLElement>(".order-rule-body");
      if (body) body.hidden = !input.checked;
    }
  });
}
