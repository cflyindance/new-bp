type ElementSpec = {
    id: string;
    label: string;
    kind: 'text' | 'image' | 'hidden';
    custom?: string;
    native?: string;
};

export const PAGE_ELEMENTS: Record<string, readonly ElementSpec[]> = {
    home: [
        { id: 'title', label: '首页标题', kind: 'text', custom: '.pt-home-copy h1', native: '.mainName___wLUYw' },
        { id: 'subtitle', label: '首页副标题', kind: 'text', custom: '.pt-home-copy p' },
        { id: 'hero', label: '首页主图', kind: 'image', custom: '.pt-home-image .pt-photo' },
        { id: 'start', label: '开始点单按钮', kind: 'text', custom: '[data-k=start] > span', native: '.orderingBtn___jUzMM' },
    ],
    menu: [
        { id: 'heading', label: '推荐区标题', kind: 'text', custom: '.pt-list-title h2' },
        { id: 'banner', label: '活动图', kind: 'image', custom: '.pt-menu-banner .pt-photo' },
        { id: 'cart', label: '购物车按钮文案', kind: 'text', custom: '[data-k=cart] > span' },
        { id: 'hideBanner', label: '隐藏活动推荐区', kind: 'hidden', custom: '.pt-menu-banner' },
    ],
    finish: [
        { id: 'title', label: '完成页标题', kind: 'text', custom: '.pt-finish h1' },
        { id: 'orderLabel', label: '取餐号说明', kind: 'text', custom: '.pt-ticket-label span', native: '.currentOrderNum___-5ivB > div:first-child' },
        { id: 'pickup', label: '取餐提示', kind: 'text', custom: '.pt-ticket > p' },
        { id: 'thanks', label: '致谢语', kind: 'text', custom: '.pt-thanks h2' },
        { id: 'back', label: '结束按钮文案', kind: 'text', custom: 'footer .pt-primary[data-k=home] > span', native: '.close___mL5p5' },
    ],
};

export type PageContent = Record<string, Record<string, string | true>>;
export const MAX_PAGE_IMAGE_BYTES = 120 * 1024;
const MAX_IMAGE_LENGTH = 4 * Math.ceil(MAX_PAGE_IMAGE_BYTES / 3) + 32;
export const MAX_PAGE_TEXT = 60;

export function pageElements(page: string) {
    return Object.hasOwn(PAGE_ELEMENTS, page) ? PAGE_ELEMENTS[page] : [];
}

export function validatePageContent(content: PageContent) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) return false;
    return Object.entries(content).every(([page, values]) =>
        values && typeof values === 'object' && !Array.isArray(values) &&
        Object.entries(values).every(([id, value]) => {
            const field = pageElements(page).find(element => element.id === id);
            if (!field) return false;
            if (field.kind === 'hidden') return value === true;
            if (typeof value !== 'string') return false;
            if (field.kind === 'text') return Boolean(value.trim()) && value.length <= MAX_PAGE_TEXT;
            return value.length <= MAX_IMAGE_LENGTH && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
        }) && pageElements(page).length > 0);
}
