import { readScopeFilters } from "../auth/session-scope";
import { combineIntervalParts, formatIntervalDuration } from "./interval-display";
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
  renderRuleHitPasswordAuthFields,
  ruleHitPasswordAuthExplanation,
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
  "命中规则后的授权方式",
  "允许可看不可点菜直接加入购物车",
  "可看不可点菜需服务员授权",
  "积分菜兑换需要权限",
  "允许纯积分商品订单兑换",
];
const help = [
  "两次订单提交的最小间隔。",
  "设置订单间隔内是否直接允许加购；不设置加购授权或数量阈值。",
  "设置商品间隔内是否直接允许加购；不设置加购授权或数量阈值。",
  "设置同时命中多条规则时的授权范围与有效范围。",
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
  rule: number,
  on: boolean,
  label: string,
): string {
  return `<input type="checkbox" role="switch" class="order-setting-switch " data-order-card-toggle="${rule}" data-line="${line}" aria-label="${esc(label)}" ${on ? "checked" : ""}>`;
}
function orderIntervalInput(line: Line, value: number, label: string): string {
  return `<div class="order-duration-parts"><label><input type="number" min="0" step="1" value="${Math.floor(value/60)}" data-order-duration-part="minutes" data-line="${line}" aria-label="${esc(label)} 分钟"><span>分</span></label><label><input type="number" min="0" max="59" step="1" value="${value%60}" data-order-duration-part="seconds" data-line="${line}" aria-label="${esc(label)} 秒"><span>秒</span></label></div>`;
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

// Presentation state only: never write expansion into a business setting.
const expandedLines = new Map<string, Set<Line>>();
function expansionKey(category: string, scene?: IntervalScene): string {
  return `${readScopeFilters().store ?? "default"}:${category}:${scene ?? ""}`;
}
function lineSummaries(id: Line): string[] {
  const interval = readInterval()[id], auth = readAuth()[id];
  return [
    interval.enabled ? `订单间隔 ${formatIntervalDuration(interval.seconds)}` : "订单间隔未启用",
    readOrder()[id].mode === "allowed" ? "间隔内允许加购" : "间隔内不允许加购",
    readMenu()[id].mode === "allowed" ? "间隔内允许加购" : "间隔内不允许加购",
    auth.enabled ? `${auth.authorizationScope === "combined" ? "合并授权" : "逐条规则授权"} · ${auth.validity === "order" ? "本单内有效（已授权规则）" : "仅本次操作"}` : "命中授权未启用",
    readView(595).includes(id) ? "可看不可点菜可直接加购" : "可看不可点菜加购需授权",
    readView(596).includes(id) ? "可看不可点菜需服务员授权" : "未启用服务员授权要求",
    readPoints().includes(id) ? "积分菜兑换需授权" : "积分菜兑换无需授权",
    readOnly(527).includes(id) ? "允许纯积分订单兑换" : "不允许纯积分订单兑换",
  ];
}
function renderCategoryCards(category: string, scene?: IntervalScene): string {
  const stateKey = expansionKey(category, scene);
  if (!expandedLines.has(stateKey)) expandedLines.set(stateKey, new Set([lines[0].id]));
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
  return `<section id="menu-order-other-${category}${scene ? `-${scene}` : ""}" class="order-settings-cards" ${scene ? "" : `data-menu-order-other-category="${category}"`}>${scene ? "" : `<header class="order-settings-heading"><h3>${MENU_ORDER_OTHER_SETTINGS_SECTIONS.find((s) => s.key === category)!.title}</h3></header>`}${scene === "product" ? `<section class="order-product-rules" data-module-setting-row-seq="590"><header class="order-settings-heading"><h3>商品间隔规则</h3></header>${renderGuestMenuOrderIntervalPanelHtml(true)}</section><header class="order-settings-heading order-product-policy-heading"><h3>间隔内加购设置</h3></header>` : ""}${lines
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
      const expanded = expandedLines.get(stateKey)!.has(id);
      const summary = lineSummaries(id);
      const detailsId = `order-line-${category}-${scene ?? "rules"}-${id}`;
      return `<section class="order-line-card" data-order-line="${id}" data-order-expansion-key="${esc(stateKey)}"><header><button type="button" class="order-line-disclosure" data-order-line-disclosure aria-expanded="${expanded}" aria-controls="${detailsId}" aria-label="${line.label} 规则设置"><span class="order-line-badge">${line.label}</span><span class="order-line-summary">${indices.map(i => `<span data-order-summary-rule="${i}" data-module-setting-row-seq="${seqs[i]}" ${i === 1 && !interval[id].enabled ? "hidden" : ""}>${esc(summary[i])}</span>`).join("")}</span><svg class="order-line-chevron" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></header><div id="${detailsId}" class="order-line-rules" ${expanded ? "" : "hidden"}>${titles
        .map((title, i) => {
          if (!indices.includes(i)) return "";
          let body = "";
          if (i === 0)
            body = `<div class="order-card-field"><div>最小间隔</div>${orderIntervalInput(id, interval[id].seconds, `${line.label} 最小间隔`)}</div>`;
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
          if (i === 3) body = renderRuleHitPasswordAuthFields(id, auth[id]);
          return `<article class="order-rule-card" data-order-rule="${i}" data-module-setting-row-seq="${seqs[i]}" ${i === 1 && !interval[id].enabled ? "hidden" : ""}><header><div class="order-rule-title">${title}<button type="button" class="order-rule-help" title="${help[i]}" aria-label="${esc(title)}说明">?</button></div>${i === 1 || i === 2 ? "" : toggle(id, i, states[i], `${line.label} ${title}`)}</header>${body ? `<div class="order-rule-body" ${i === 1 || i === 2 || states[i] ? "" : "hidden"}>${body}</div>` : ""}</article>`;
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
  const refreshSummaries = () => {
    const intervals = readInterval();
    host.querySelectorAll<HTMLElement>("[data-order-line]").forEach(card => {
      const line = card.dataset.orderLine as Line;
      const values = lineSummaries(line);
      const addOn = card.querySelector<HTMLElement>('[data-order-rule="1"]');
      if (addOn) addOn.hidden = !intervals[line].enabled;
      card.querySelectorAll<HTMLElement>("[data-order-summary-rule]").forEach(node => {
        const rule = Number(node.dataset.orderSummaryRule);
        node.textContent = values[rule];
        if (rule === 1) node.hidden = !intervals[line].enabled;
      });
    });
  };
  host.addEventListener("click", (event) => {
    const disclosure = (event.target as Element).closest<HTMLButtonElement>("[data-order-line-disclosure]");
    if (disclosure) {
      const card = disclosure.closest<HTMLElement>("[data-order-line]")!;
      const expanded = disclosure.getAttribute("aria-expanded") !== "true";
      disclosure.setAttribute("aria-expanded", String(expanded));
      card.querySelector<HTMLElement>(".order-line-rules")!.hidden = !expanded;
      const selection = expandedLines.get(card.dataset.orderExpansionKey!)!;
      if (expanded) selection.add(card.dataset.orderLine as Line);
      else selection.delete(card.dataset.orderLine as Line);
      return;
    }
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
    if (input.matches("[data-rule-hit-password-auth-field]")) {
      const line = input.dataset.line as Line;
      if (!lines.some(item => item.id === line)) return;
      const config = readAuth();
      if (!config[line].enabled) return;
      if (input.dataset.ruleHitPasswordAuthField === "authorizationScope" && (input.value === "per-rule" || input.value === "combined")) config[line].authorizationScope = input.value;
      if (input.dataset.ruleHitPasswordAuthField === "validity" && (input.value === "operation" || input.value === "order")) config[line].validity = input.value;
      writeAuth(config);
      const note = input.closest("article")?.querySelector("[data-rule-hit-password-auth-note]");
      if (note) note.textContent = ruleHitPasswordAuthExplanation(config[line]);
      refreshSummaries(); return;
    }
    if (input.matches("[data-order-duration-part]")) {
      const line = input.dataset.line as Line;
      if (!lines.some(l => l.id === line)) return;
      const minutes = host.querySelector<HTMLInputElement>(`[data-order-duration-part="minutes"][data-line="${line}"]`)!;
      const seconds = host.querySelector<HTMLInputElement>(`[data-order-duration-part="seconds"][data-line="${line}"]`)!;
      const config = readInterval();
      config[line].seconds = combineIntervalParts(minutes.value, seconds.value, 0, Infinity, 60);
      minutes.value = String(Math.floor(config[line].seconds/60)); seconds.value = String(config[line].seconds%60);
      writeInterval(config); refreshSummaries(); return;
    }
    if (
      !input.matches(
        "[data-order-card-toggle],[data-order-card-number],[data-order-card-mode]",
      )
    )
      return;
    const line = input.dataset.line as Line;
    if (!lines.some((l) => l.id === line)) return;
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
      if (rule === 1 && !readInterval()[line].enabled) return;
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
    refreshSummaries();
    if (isToggle) {
      const body = input
        .closest("article")
        ?.querySelector<HTMLElement>(".order-rule-body");
      if (body) body.hidden = !input.checked;
    }
  });
}
