/**
 * 生成 eMenu Pro 组件默认图标（SVG），供页面组件 / 全局组件与画布占位使用。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../dist/emenu-pro/images");

const stroke = "#AE7B4C";
const fill = "#F5E6D0";

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const icons = {
  addToCart: svg(
    `<rect x="10" y="14" width="28" height="24" rx="4" fill="${fill}"/><path d="M16 14 18 8h12l2 6"/><circle cx="18" cy="34" r="2.5" fill="${stroke}" stroke="none"/><circle cx="30" cy="34" r="2.5" fill="${stroke}" stroke="none"/><path d="M24 20v8M20 24h8"/>`
  ),
  soldOut: svg(
    `<circle cx="24" cy="24" r="16" fill="${fill}"/><path d="M14 14l20 20"/><path d="M18 18h12v12H18z" opacity=".35"/>`
  ),
  shoppingCart: svg(
    `<path d="M8 10h4l4 18h18l4-14H14" fill="none"/><circle cx="20" cy="36" r="2.5" fill="${stroke}" stroke="none"/><circle cx="32" cy="36" r="2.5" fill="${stroke}" stroke="none"/>`
  ),
  home: svg(
    `<path d="M8 22 24 8l16 14" fill="${fill}"/><path d="M12 20v18h24V20"/><path d="M20 38V26h8v12"/>`
  ),
  memberLogin: svg(
    `<circle cx="24" cy="16" r="7" fill="${fill}"/><path d="M10 40c2.5-8 8-12 14-12s11.5 4 14 12"/>`
  ),
  callServer: svg(
    `<path d="M18 8c0 2 1.5 4 4 4h4c2.5 0 4-2 4-4" fill="${fill}"/><path d="M16 10h16v8c0 8-3.5 14-8 14s-8-6-8-14v-8z"/><path d="M24 32v6"/><path d="M18 40h12"/>`
  ),
  clock: svg(
    `<circle cx="24" cy="26" r="14" fill="${fill}"/><path d="M24 8v4"/><path d="M24 18v10l7 4"/>`
  ),
  changeLanguage: svg(
    `<circle cx="24" cy="24" r="16" fill="${fill}"/><path d="M8 24h32"/><path d="M24 8c4 6 4 28 0 32"/><path d="M24 8c-4 6-4 28 0 32"/>`
  ),
  switchBuffet: svg(
    `<path d="M10 18h20l-4-4" fill="none"/><path d="M38 30H18l4 4" fill="none"/><rect x="8" y="12" width="10" height="10" rx="2" fill="${fill}"/><rect x="30" y="26" width="10" height="10" rx="2" fill="${fill}"/>`
  ),
  changePartySize: svg(
    `<circle cx="16" cy="18" r="5" fill="${fill}"/><circle cx="32" cy="18" r="5" fill="${fill}"/><path d="M8 38c1.5-6 5-9 8-9s6.5 3 8 9"/><path d="M24 38c1.5-6 5-9 8-9s6.5 3 8 9"/>`
  ),
  switchTable: svg(
    `<rect x="8" y="10" width="14" height="14" rx="2" fill="${fill}"/><rect x="26" y="24" width="14" height="14" rx="2" fill="${fill}"/><path d="M22 17h4M22 31h4"/>`
  ),
  memberPriceIcon: svg(
    `<path d="M24 6l4.5 9.5L39 17l-7.5 7 2 10.5L24 30l-9.5 4.5 2-10.5L9 17l10.5-1.5z" fill="${fill}"/>`
  ),
  expand_vertical: svg(
    `<rect x="10" y="8" width="12" height="32" rx="3" fill="${fill}"/><path d="M28 24h10"/><path d="M34 20l4 4-4 4"/>`
  ),
  narrow_vertical: svg(
    `<rect x="26" y="8" width="12" height="32" rx="3" fill="${fill}"/><path d="M10 24h10"/><path d="M14 20l-4 4 4 4"/>`
  ),
  video: svg(
    `<rect x="8" y="14" width="24" height="20" rx="3" fill="${fill}"/><path d="M32 20l10-5v18l-10-5z" fill="${fill}"/>`
  ),
  carousel: svg(
    `<rect x="8" y="12" width="22" height="24" rx="3" fill="${fill}"/><rect x="14" y="8" width="22" height="24" rx="3" opacity=".7" fill="${fill}"/><rect x="20" y="16" width="22" height="24" rx="3" fill="${fill}"/>`
  ),
  dishName: svg(
    `<path d="M10 16h28"/><path d="M10 24h22"/><path d="M10 32h16"/><rect x="8" y="10" width="32" height="28" rx="4" fill="${fill}" opacity=".35"/>`
  ),
  salePrice: svg(
    `<path d="M24 10v28"/><path d="M18 16c0-4 3-6 6-6s6 2 6 6-3 6-6 8-6 4-6 8 3 6 6 6 6-2 6-6" fill="none"/>`
  ),
  memberPrice: svg(
    `<path d="M12 14h24l-4 20H16z" fill="${fill}"/><path d="M20 14c0-4 2-6 4-6s4 2 4 6"/><path d="M24 30l-2 4h4z" fill="${stroke}" stroke="none"/>`
  ),
  menuList: svg(
    `<rect x="10" y="8" width="28" height="32" rx="4" fill="${fill}"/><path d="M16 16h16"/><path d="M16 24h16"/><path d="M16 32h10"/>`
  ),
  batteryWifi: svg(
    `<rect x="10" y="18" width="18" height="12" rx="2" fill="${fill}"/><path d="M30 22v4"/><path d="M34 16c3 2.5 4.5 5.5 4.5 8s-1.5 5.5-4.5 8"/><path d="M37 13c4.5 3.5 6.5 8 6.5 11s-2 7.5-6.5 11"/>`
  ),
};

fs.mkdirSync(outDir, { recursive: true });

for (const [name, content] of Object.entries(icons)) {
  fs.writeFileSync(path.join(outDir, `${name}.svg`), content, "utf8");
}

console.log(`[generate-emenu-pro-block-icons] Wrote ${Object.keys(icons).length} icons to ${outDir}`);
