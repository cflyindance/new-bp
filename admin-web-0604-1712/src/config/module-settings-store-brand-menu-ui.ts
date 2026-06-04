/**
 * 门店管理 · 品牌与菜单展示 · 品牌菜单库（seq 548 数据源）。
 * 集团/品牌级菜单主数据见「商品中心 → 品牌菜单」；此处为 Location 可选菜单目录原型。
 */

import { readModuleSettingJson, writeModuleSettingJson } from "./module-settings-form-ui";

export const STORE_BRAND_MENU_SEQ = 548;

export const STORE_BRAND_MENUS_FIELD_ID = "548-brand-menus";

export type StoreBrandMenu = {
  id: string;
  name: string;
  /** 渠道或用途说明（原型展示） */
  channelLabel?: string;
};

function newMenuId(): string {
  return `menu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeMenu(raw: Partial<StoreBrandMenu>): StoreBrandMenu {
  return {
    id: raw.id ?? newMenuId(),
    name: raw.name ?? "未命名菜单",
    channelLabel: raw.channelLabel,
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function defaultBrandMenus(): StoreBrandMenu[] {
  return [
    normalizeMenu({ id: "menu-dine-in", name: "堂食标准菜单", channelLabel: "堂食 · POS / eMenu" }),
    normalizeMenu({ id: "menu-delivery", name: "外卖菜单", channelLabel: "外卖 / 来取" }),
    normalizeMenu({ id: "menu-breakfast", name: "早餐菜单", channelLabel: "限时 · 06:00–10:30" }),
  ];
}

export function readBrandMenus(): StoreBrandMenu[] {
  const raw = readModuleSettingJson<Partial<StoreBrandMenu>[]>(STORE_BRAND_MENUS_FIELD_ID, []);
  if (!Array.isArray(raw) || raw.length === 0) return defaultBrandMenus();
  return uniqueById(raw.filter((m) => m?.id && m?.name).map((m) => normalizeMenu(m)));
}

export function writeBrandMenus(menus: StoreBrandMenu[]): void {
  writeModuleSettingJson(STORE_BRAND_MENUS_FIELD_ID, menus);
}

export function formatBrandMenuSummary(menu: StoreBrandMenu): string {
  return menu.channelLabel ?? "品牌菜单";
}

export function isStoreBrandMenuSeq(seq: number): boolean {
  return seq === STORE_BRAND_MENU_SEQ;
}
