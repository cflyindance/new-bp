import {
  bindBrandMenuStructurePicker,
  emptyBrandMenuStructureByLine,
  readBrandMenuStructureKeysFromPicker,
  renderBrandMenuStructurePickerHtml,
  selectedBrandMenuDishesByLine,
} from "../config/brand-menu-structure-picker-ui";
import { promotionTypes, scheduleStatus, validateCampaign, type Campaign, type PromotionConfiguration, type PromotionType } from "./domain";
import { createPromotionDemo } from "./demo";
import "./page.css";

export const PROMOTIONS_PATH = "/promotions/campaigns";
const types = Object.entries(promotionTypes) as [PromotionType, string][];
const definitions = {
  gift: "购买指定商品达标后，顾客手动领取赠品。",
  quantity: "购买指定件数后，按活动配置对符合条件的低价商品减免。",
  order: "订单金额达标后，按固定金额或百分比减免，可配置首单和促销码。",
  exchange: "达到金额或商品件数门槛后，顾客可手动选择换购商品。",
};
const purchaseModes = [["any", "任意商品合计"], ["same", "相同商品累计"]];
const discountKinds = [["fixed", "固定金额"], ["percent", "百分比"]];
const defaults = (type: PromotionType) => ({
  mode: type === "quantity" ? "same" : "any", rewardMode: "any", frequency: "each",
  condition: "amount", discountKind: type === "exchange" ? "fixed" : "", firstOrder: "no", useCode: "no",
});
const escape = (s: string = "") => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const options = (values: string[][], active: string) => values.map(([value, label]) =>
  `<option value="${value}" ${value === active ? "selected" : ""}>${label}</option>`).join("");

export function renderPromotionPage(): string {
  return '<section class="promotion-page" data-promotion-page></section>';
}

function summary(campaign: Campaign): string {
  const f = campaign.fields;
  if (campaign.type === "gift") return `买 ${f.quantity} 件，赠 ${f.limit} 件`;
  if (campaign.type === "quantity") return `${f.frequency === "each" ? "每满" : "满"} ${f.quantity} 件，1 件减 ${f.discount}%`;
  const discount = f.discountKind === "percent" ? `${f.discount}%` : `$${f.discount}`;
  if (campaign.type === "exchange") return `满 ${f.condition === "items" ? f.quantity + " 件" : "$" + f.threshold}，最多换购 ${f.limit} 件，单件减 ${discount}`;
  return `满 $${f.threshold} 减 ${discount}${f.firstOrder === "yes" ? " · 仅首单" : ""}${f.useCode === "yes" ? " · 促销码" : ""}`;
}

export function bindPromotionPage(mount: ParentNode, scope: string, canEdit: boolean, crmEnabled: boolean, demoAccount: boolean): void {
  const page = mount.querySelector<HTMLElement>("[data-promotion-page]");
  if (!page) return;
  const merchantKey = "merchant-promotion-config:v1:" + scope;
  const key = demoAccount ? "merchant-promotion-demo:v1:" + scope : merchantKey;
  let saved: PromotionConfiguration = { activeType: "", campaigns: [] };
  let storedValue: string | null = null;
  let readFailed = false;
  try {
    storedValue = localStorage.getItem(key);
    const value = storedValue ?? (demoAccount ? localStorage.getItem(merchantKey) : null);
    if (value !== null) {
      const parsed = JSON.parse(value) as PromotionConfiguration;
      if (!Array.isArray(parsed.campaigns)) throw Error();
      saved = parsed;
    } else if (demoAccount) {
      saved = createPromotionDemo();
    }
  } catch {
    readFailed = true;
  }
  const editable = canEdit && !readFailed;
  let draft = structuredClone(saved);
  let tab: PromotionType | "" = demoAccount ? "" : draft.activeType || draft.campaigns[0]?.type || "";
  let query = "";
  let currentPage = 1;
  let message = readFailed ? "读取活动配置失败，请重新加载。" : "";
  const dirty = () => JSON.stringify(draft) !== JSON.stringify(saved);
  const button = (label: string, action: string, extra = "") =>
    `<button type="button" data-promo-action="${action}" ${extra}>${label}</button>`;

  function updateRows() {
    const results = draft.campaigns.filter(row => (!tab || tab === row.type) && row.fields.name.toLowerCase().includes(query.trim().toLowerCase()));
    const pages = Math.max(1, Math.ceil(results.length / 10));
    currentPage = Math.min(currentPage, pages);
    page!.querySelector("[data-promo-results]")!.innerHTML = `
      <div class="promotion-table"><table><thead><tr><th>活动名称</th><th>活动类型</th><th>活动时间</th><th>规则摘要</th><th>状态</th><th>活动开关</th><th>操作</th></tr></thead>
      <tbody>${results.slice((currentPage - 1) * 10, currentPage * 10).map(row => {
        const f = row.fields;
        const date = f.startDate ? `${f.startDate} 至 ${f.endDate}` : "";
        const days = f.days ? "周" + f.days.split(",").map(day => "日一二三四五六"[Number(day)]).join("、") : "";
        const time = f.startTime ? `${f.startTime}–${f.endTime}` : "";
        const attrs = `data-id="${escape(row.id)}"`;
        return `<tr><td>${escape(f.name)}</td><td>${promotionTypes[row.type]}</td><td>${[date, days, time].filter(Boolean).map(escape).join("<br>")}</td>
          <td>${escape(summary(row))}</td><td>${scheduleStatus(row, draft.activeType)}</td>
          <td>${button(row.enabled ? "已开启" : "已关闭", "toggle", `${attrs} role="switch" aria-checked="${row.enabled}" ${editable ? "" : "disabled"}`)}</td>
          <td>${button(editable ? "编辑" : "查看", "edit", attrs)} ${editable ? button("删除", "delete", attrs) : ""}</td></tr>`;
      }).join("") || `<tr><td colspan="7" class="promotion-empty">${readFailed ? "无法读取活动" : draft.campaigns.length ? "没有符合条件的活动" : "暂无活动"}</td></tr>`}</tbody></table></div>
      <footer>共 ${results.length} 条 <div>${button("上一页", "prev", currentPage === 1 ? "disabled" : "")} ${currentPage} / ${pages} ${button("下一页", "next", currentPage === pages ? "disabled" : "")}</div></footer>`;
  }

  function render() {
    page!.innerHTML = `<div class="promotion-toolbar">
      <div class="promotion-query"><input type="search" aria-label="搜索活动名称" placeholder="搜索活动名称" data-promo-search value="${escape(query)}"><label>活动类型 <select data-promo-filter>${options([["", "全部类型"], ...types], tab)}</select></label></div>
      <div class="promotion-actions">${editable ? button("保存", "save", `class="promotion-save" ${dirty() ? "" : "disabled"}`) : ""} ${button("活动定义", "definitions")} ${editable ? button("新增活动", "add", 'class="promotion-primary"') : ""}</div>
      </div><div class="promotion-filters">
      <label>开启促销类型 <select data-promo-active ${editable ? "" : "disabled"}>${options([["", "全部关闭"], ...types.filter(([type]) => draft.activeType === type || draft.campaigns.some(row => row.type === type))], draft.activeType)}</select></label></div>
      <div data-promo-results></div>
      <footer><span role="status">${escape(message || (dirty() ? "有未保存的变更" : ""))}</span></footer>`;
    updateRows();
  }

  function dialog(title: string, content: string, confirm?: string, wide = false): HTMLDialogElement {
    const node = document.createElement("dialog");
    node.className = `promotion-dialog${wide ? " promotion-dialog-wide" : ""}`;
    node.setAttribute("aria-label", title);
    node.innerHTML = `<header><div><button type="button" aria-label="关闭" data-close>×</button><h2>${title}</h2></div>
      ${confirm ? `<button type="button" class="promotion-primary" data-confirm>${confirm}</button>` : ""}</header><div class="promotion-body">${content}</div>`;
    page!.append(node);
    node.addEventListener("close", () => node.remove());
    node.querySelector("[data-close]")!.addEventListener("click", () => node.close());
    node.showModal();
    return node;
  }

  function confirmAction(row: Campaign, verb: string, callback: () => void) {
    const node = dialog(`${verb}活动`, `<p>确定${verb}「${escape(row.fields.name)}」？${row.fields.useCode === "yes" ? "保存后，该活动对应的促销码将停用。" : "保存后更新活动列表。"}</p>`, verb);
    node.querySelector("[data-confirm]")!.addEventListener("click", () => { node.close(); callback(); });
  }

  function openEditor(original?: Campaign) {
    let type: PromotionType | "" = original?.type ?? "";
    let fields: Record<string, string> = original ? { ...defaults(original.type), ...original.fields } : {};
    let purchase = original?.purchase;
    let reward = original?.reward;
    const node = dialog(original ? editable ? "编辑活动" : "查看活动" : "新增活动", "", editable ? "确认" : undefined);
    const body = node.querySelector<HTMLElement>(".promotion-body")!;
    const input = (name: string, label: string, kind = "text", attributes = "") =>
      `<label>${label}<input name="${name}" type="${kind}" value="${escape(fields[name])}" ${attributes} ${editable ? "" : "disabled"}></label>`;
    const select = (name: string, label: string, values: string[][], disabled = false) =>
      `<label>${label}<select name="${name}" ${disabled || !editable ? "disabled" : ""}>${options(values, fields[name] ?? "")}</select></label>`;
    const product = (name: "purchase" | "reward", label: string) => {
      const value = name === "purchase" ? purchase : reward;
      return `<label class="promotion-span promotion-product">${label}<button type="button" name="${name}" data-product="${name}">${value ? `已选 ${selectedBrandMenuDishesByLine(value).length} 件` : "选择商品"}</button></label>`;
    };

    function paint() {
      const items = type === "gift" || type === "quantity" || (type === "exchange" && fields.condition === "items");
      const hasReward = type === "gift" || type === "exchange";
      const discount = type === "quantity" || fields.discountKind === "percent" ? "减免比例（% off）" : "减免金额（USD）";
      const yesNo = [["no", "否"], ["yes", "是"]];
      const choice = (name: string, value: string, label: string, selected: string, description = "") =>
        `<label class="promotion-choice"><input type="radio" name="${name}" value="${value}" ${editable ? "" : "disabled"} ${value === selected ? "checked" : ""}>
          <span><strong>${label}</strong>${description ? `<small>${description}</small>` : ""}</span></label>`;
      body.innerHTML = `<form novalidate>
        <fieldset class="promotion-types" ${original || !editable ? "disabled" : ""}>
          <legend>活动类型</legend>
          ${(original ? types.filter(([value]) => value === type) : types).map(([value, label]) =>
            choice("type", value, label, type, definitions[value])).join("")}
        </fieldset>
        <section><h3>基本信息</h3><fieldset ${editable ? "" : "disabled"}>
          <div class="promotion-span">${input("name", "活动名称")}</div>
          ${input("zh", "中文活动标签", "text", 'maxlength="50"')}${input("en", "英文活动标签", "text", 'maxlength="50"')}
        </fieldset></section>
        ${type ? `<section><h3>活动规则</h3>
          <fieldset class="promotion-rule"><legend>达标条件</legend>
            ${type === "exchange" ? `<div class="promotion-span promotion-options" role="group" aria-label="条件类型">
              <span>条件类型</span><div>${choice("condition", "amount", "订单金额", fields.condition)}${choice("condition", "items", "商品数量", fields.condition)}</div>
            </div>` : ""}
            ${items ? select("mode", "购买方式", purchaseModes) + input("quantity", type === "quantity" ? "购买件数 M" : "购买件数", "number", 'min="1" step="1"') + product("purchase", type === "quantity" ? "参与商品" : "购买商品")
              : input("threshold", "订单满足金额（USD）", "number", `min="0" step="${type === "order" ? 1 : 0.01}"`)}
            ${type === "order" ? `<div>${select("firstOrder", "仅首单生效", yesNo, !crmEnabled)}
              ${crmEnabled ? "" : "<small>当前范围未确认已启用会员服务。</small>"}</div>` : ""}
          </fieldset>
          <fieldset class="promotion-rule"><legend>优惠内容</legend>
            ${hasReward ? `<small class="promotion-span">${type === "gift" ? "达标后由顾客手动领取赠品。" : "达标后由顾客手动选择换购商品。"}</small>
              ${select("rewardMode", type === "gift" ? "赠品组合" : "换购商品组合", [["any", "任意商品"], ["same", "相同商品"]])}
              ${input("limit", type === "gift" ? "赠送件数上限" : "换购件数上限", "number", 'min="1" step="1"')}
              ${product("reward", type === "gift" ? "赠送商品" : "换购商品")}` : ""}
            ${type === "order" || type === "exchange" ? select("discountKind", type === "exchange" ? "单件优惠类型" : "折扣类型", type === "order" ? [["", "请选择优惠类型"], ...discountKinds] : discountKinds) : ""}
            ${type !== "gift" && (type === "quantity" || fields.discountKind) ? input("discount", discount, "number", 'min="0.01" step="0.01"') : ""}
            ${type === "quantity" ? `<div class="promotion-span promotion-options" role="group" aria-label="优惠计算方式">
              <span>优惠计算方式</span><div>${choice("frequency", "each", "每满 M 件优惠一件", fields.frequency)}${choice("frequency", "once", "满 M 件只优惠一件", fields.frequency)}</div>
            </div>` : ""}
          </fieldset>
          ${type === "order" ? `<fieldset class="promotion-rule"><legend>促销码</legend>
            ${select("useCode", "使用促销码", yesNo, !!original)}
            ${fields.useCode === "yes" ? `<div class="promotion-span promotion-code">${input("codeName", "促销码名称", "text", 'maxlength="255"')}${input("code", "促销码", "text", original ? "disabled" : 'maxlength="15"')}</div>` : ""}
          </fieldset>` : ""}
        </section>` : ""}
        <section><h3>生效时间</h3><fieldset ${editable ? "" : "disabled"}>
          <small class="promotion-span">日期、星期、时段至少设置一项。设置多项时须同时满足。</small>
          ${input("startDate", "开始日期", "date")}${input("endDate", "结束日期", "date")}
          ${input("startTime", "开始时间", "time")}${input("endTime", "结束时间", "time")}
          <div class="promotion-days"><span>适用星期</span><div>${[1,2,3,4,5,6,0].map(day => `<label><input type="checkbox" name="day" value="${day}" ${fields.days?.split(",").includes(String(day)) ? "checked" : ""}>周${"日一二三四五六"[day]}</label>`).join("")}</div></div>
        </fieldset></section>
        <p class="promotion-error" role="alert" data-error></p></form>`;
    }

    function pick(which: "purchase" | "reward") {
      const existing = (which === "purchase" ? purchase : reward) ?? emptyBrandMenuStructureByLine();
      const excluded = type === "quantity" && fields.startDate && fields.endDate
        ? draft.campaigns.filter(other => other.id !== original?.id && other.type === "quantity" &&
          other.fields.startDate && other.fields.endDate &&
          other.fields.startDate <= fields.endDate && other.fields.endDate >= fields.startDate)
          .flatMap(other => other.purchase ? selectedBrandMenuDishesByLine(other.purchase).map(dish => dish.dishId) : [])
        : [];
      const pickerModal = dialog(which === "purchase" ? "购买商品" : "优惠商品",
        '<p>演示菜单 · Kiosk</p>' + renderBrandMenuStructurePickerHtml(existing.kiosk, undefined, undefined,
          { treeLineId: "kiosk", searchable: true, readOnly: !editable, excludedDishIdsByLine: { kiosk: excluded } }), editable ? "确认" : undefined, true);
      const picker = pickerModal.querySelector<HTMLElement>("[data-brand-menu-structure-picker]")!;
      bindBrandMenuStructurePicker(picker);
      pickerModal.querySelector("[data-confirm]")?.addEventListener("click", () => {
        const value = emptyBrandMenuStructureByLine();
        value.kiosk = readBrandMenuStructureKeysFromPicker(pickerModal.querySelector<HTMLElement>("[data-brand-menu-structure-picker]")!);
        if (which === "purchase") purchase = value;
        else reward = value;
        pickerModal.close();
        paint();
        body.querySelector<HTMLElement>(`[name="${which}"]`)?.focus();
      });
    }

    paint();
    const initial = JSON.stringify([type, fields, purchase, reward]);
    const discard = () => initial === JSON.stringify([type, fields, purchase, reward]) || window.confirm("放弃此活动尚未确认的修改？");
    node.addEventListener("cancel", event => { if (!discard()) event.preventDefault(); });
    node.querySelector("[data-close]")!.addEventListener("click", event => {
      if (!discard()) event.stopImmediatePropagation();
    }, { capture: true });
    body.addEventListener("input", event => {
      const field = event.target as HTMLInputElement;
      if (field.name === "day") {
        fields.days = [...body.querySelectorAll<HTMLInputElement>('[name="day"]:checked')].map(day => day.value).join(",");
      } else if (field.name && field.name !== "type") fields[field.name] = field.value;
    });
    body.addEventListener("change", event => {
      const field = event.target as HTMLInputElement | HTMLSelectElement;
      if (field.name === "type") {
        type = field.value as PromotionType | "";
        const common = Object.fromEntries(["name", "zh", "en", "startDate", "endDate", "startTime", "endTime", "days"].map(k => [k, fields[k] ?? ""]));
        fields = type ? { ...defaults(type), ...common } : common;
        purchase = reward = undefined;
      } else if (field.name === "useCode" && field.value === "no") {
        delete fields.code;
        delete fields.codeName;
      }
      if (["type", "condition", "discountKind", "useCode"].includes(field.name)) {
        paint();
        const selector = field.type === "radio" ? `[name="${field.name}"]:checked` : `[name="${field.name}"]`;
        body.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
      }
    });
    body.addEventListener("click", event => {
      const which = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-product]")?.dataset.product;
      if (which === "purchase" || which === "reward") pick(which);
    });
    body.addEventListener("submit", event => event.preventDefault());
    node.querySelector("[data-confirm]")?.addEventListener("click", () => {
      const record = type ? { id: original?.id ?? crypto.randomUUID(), enabled: original?.enabled ?? true, type,
        fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()])), purchase, reward } : null;
      const issue = record ? validateCampaign(record, draft) : ["type", "请选择活动类型。"];
      if (issue) {
        const error = body.querySelector<HTMLElement>("[data-error]")!;
        error.textContent = issue[1];
        const field = body.querySelector<HTMLElement>(`[name="${issue[0]}"]`);
        const container = issue[0] === "type" ? field?.closest("fieldset") : field?.closest("label");
        container?.append(error);
        body.querySelector<HTMLElement>(`[name="${issue[0]}"]`)?.focus();
        return;
      }
      if (!record) return;
      draft.campaigns = original ? draft.campaigns.map(row => row.id === record.id ? record : row) : [...draft.campaigns, record];
      tab = record.type;
      currentPage = 1;
      query = message = "";
      node.close();
      render();
    });
  }

  render();
  page.addEventListener("input", event => {
    const target = event.target as HTMLInputElement;
    if (target.matches("[data-promo-search]")) { query = target.value; currentPage = 1; updateRows(); }
  });
  page.addEventListener("change", event => {
    const target = event.target as HTMLSelectElement;
    if (target.matches("[data-promo-filter]")) { tab = target.value as PromotionType | ""; currentPage = 1; updateRows(); }
    if (editable && target.matches("[data-promo-active]")) { draft.activeType = target.value as PromotionType | ""; message = ""; render(); }
  });
  page.addEventListener("click", event => {
    const control = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-promo-action]");
    if (!control || control.disabled) return;
    const row = draft.campaigns.find(item => item.id === control.dataset.id);
    switch (control.dataset.promoAction) {
      case "definitions": dialog("活动定义", `<dl>${types.map(([type, label]) => `<dt>${label}</dt><dd>${definitions[type]}</dd>`).join("")}</dl><p>同一范围只可启用一种活动类型。活动行开启、时段及终端的会员和云促销互斥检查共同决定是否可用。</p>`); break;
      case "prev": currentPage--; updateRows(); break;
      case "next": currentPage++; updateRows(); break;
      case "add": if (editable) openEditor(); break;
      case "edit": if (row) openEditor(row); break;
      case "toggle":
      case "delete": {
        if (!editable || !row) break;
        const deleting = control.dataset.promoAction === "delete";
        const apply = () => {
          if (deleting) draft.campaigns = draft.campaigns.filter(item => item.id !== row.id);
          else row.enabled = !row.enabled;
          message = "";
          render();
        };
        if (deleting || (row.enabled && row.fields.useCode === "yes")) confirmAction(row, deleting ? "删除" : "关闭", apply);
        else apply();
        break;
      }
      case "save":
        if (!editable || !dirty()) break;
        try {
          if (localStorage.getItem(key) !== storedValue) {
            message = "此范围的配置已在其他页面更新。当前草稿仍保留，无法覆盖较新的配置。";
          } else {
            const next = JSON.stringify(draft);
            localStorage.setItem(key, next);
            storedValue = next;
            saved = structuredClone(draft);
            message = "活动配置已保存到本浏览器。";
          }
        } catch {
          message = "保存失败，草稿已保留。请重试。";
        }
        render();
        break;
    }
  });
}
