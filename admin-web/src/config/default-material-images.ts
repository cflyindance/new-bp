/**
 * 图片素材库 · 默认演示素材数据。
 */
import type { MaterialImageRecord } from "./image-material-library";

function createMaterialSvgDataUrl(options: {
  title: string;
  subtitle?: string;
  bgFrom: string;
  bgTo: string;
  accent?: string;
}): string {
  const accent = options.accent ?? "#ffffff";
  const subtitle = options.subtitle
    ? `<text x="400" y="360" text-anchor="middle" fill="#ffffffcc" font-size="26" font-family="system-ui,sans-serif">${options.subtitle}</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${options.bgFrom}"/><stop offset="100%" stop-color="${options.bgTo}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="680" cy="120" r="90" fill="${accent}" opacity="0.18"/><circle cx="140" cy="500" r="110" fill="${accent}" opacity="0.12"/><rect x="60" y="60" width="180" height="8" rx="4" fill="${accent}" opacity="0.25"/><text x="400" y="290" text-anchor="middle" fill="#fff" font-size="52" font-family="system-ui,sans-serif" font-weight="700">${options.title}</text>${subtitle}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const DEFAULT_MATERIAL_IMAGES: MaterialImageRecord[] = [
  {
    id: "m-demo-001",
    name: "圣诞节",
    category: "屏保素材",
    tagColor: "blue",
    url: createMaterialSvgDataUrl({
      title: "圣诞节",
      subtitle: "Merry Christmas",
      bgFrom: "#0f3d2e",
      bgTo: "#1a5c40",
      accent: "#f5d547",
    }),
  },
  {
    id: "m-demo-002",
    name: "中秋节",
    category: "广告素材",
    tagColor: "red",
    url: createMaterialSvgDataUrl({
      title: "中秋节",
      subtitle: "月圆人团圆",
      bgFrom: "#7c2d12",
      bgTo: "#c2410c",
      accent: "#fde68a",
    }),
  },
  {
    id: "m-demo-003",
    name: "新年",
    category: "屏保素材",
    tagColor: "blue",
    url: createMaterialSvgDataUrl({
      title: "新年快乐",
      subtitle: "Happy New Year",
      bgFrom: "#991b1b",
      bgTo: "#dc2626",
      accent: "#fcd34d",
    }),
  },
  {
    id: "m-demo-004",
    name: "端午节",
    category: "广告素材",
    tagColor: "red",
    url: createMaterialSvgDataUrl({
      title: "端午节",
      subtitle: "粽香传情",
      bgFrom: "#14532d",
      bgTo: "#166534",
      accent: "#86efac",
    }),
  },
  {
    id: "m-demo-005",
    name: "春季特惠",
    category: "广告素材",
    tagColor: "red",
    url: createMaterialSvgDataUrl({
      title: "春季特惠",
      subtitle: "限时 8 折起",
      bgFrom: "#be185d",
      bgTo: "#db2777",
      accent: "#fbcfe8",
    }),
  },
  {
    id: "m-demo-006",
    name: "招牌美食",
    category: "其他",
    tagColor: "green",
    url: createMaterialSvgDataUrl({
      title: "招牌美食",
      subtitle: "店长推荐",
      bgFrom: "#92400e",
      bgTo: "#b45309",
      accent: "#fde68a",
    }),
  },
  {
    id: "m-demo-007",
    name: "欢迎光临",
    category: "屏保素材",
    tagColor: "blue",
    url: createMaterialSvgDataUrl({
      title: "欢迎光临",
      subtitle: "Welcome",
      bgFrom: "#1e3a8a",
      bgTo: "#2563eb",
      accent: "#93c5fd",
    }),
  },
  {
    id: "m-demo-008",
    name: "会员专享",
    category: "广告素材",
    tagColor: "red",
    url: createMaterialSvgDataUrl({
      title: "会员专享",
      subtitle: "积分翻倍",
      bgFrom: "#581c87",
      bgTo: "#7c3aed",
      accent: "#ddd6fe",
    }),
  },
  {
    id: "m-demo-009",
    name: "限时促销",
    category: "其他",
    tagColor: "green",
    url: createMaterialSvgDataUrl({
      title: "限时促销",
      subtitle: "今日特价",
      bgFrom: "#b45309",
      bgTo: "#ea580c",
      accent: "#ffedd5",
    }),
  },
  {
    id: "m-demo-010",
    name: "秋日暖饮",
    category: "屏保素材",
    tagColor: "blue",
    url: createMaterialSvgDataUrl({
      title: "秋日暖饮",
      subtitle: "季节限定",
      bgFrom: "#78350f",
      bgTo: "#a16207",
      accent: "#fef3c7",
    }),
  },
];
