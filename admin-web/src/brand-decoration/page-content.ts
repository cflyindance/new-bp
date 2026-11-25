type ElementSpec = {
    id: string;
    label: string;
    kind: 'text' | 'image' | 'hidden';
    custom?: string;
    native?: string;
};

const text = (id: string, label: string, custom: string, native?: string): ElementSpec =>
    ({ id, label, kind: 'text', custom, native });
const heading = (native?: string) => [
    text('title', '页面标题', '.pt-heading h1', native),
    text('subtitle', '页面说明', '.pt-heading > p'),
    text('continue', '主按钮文案', '.pt-bottom .pt-primary > span'),
];
const mobileHeading = (cta = '主按钮文案') => [
    text('title', '页面标题', '.em main h1'),
    text('subtitle', '页面说明', '.em main p'),
    text('continue', cta, '.em footer button'),
];

const KIOSK_ELEMENTS: Record<string, readonly ElementSpec[]> = {
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
    screensaver: [
        text('title', '待机标题', '.pt-home-copy h1'),
        text('subtitle', '待机说明', '.pt-home-copy p'),
        text('wake', '开始按钮文案', '[data-k=wake] > span'),
        { id: 'hero', label: '待机主图', kind: 'image', custom: '.pt-home-image .pt-photo' },
    ],
    orderType: heading('.orderTypeTitle___RrElR'),
    detail: [
        text('specification', '规格区标题', '.pt-detail-copy h3'),
        text('continue', '加购按钮文案', '.pt-bottom .pt-primary > span'),
    ],
    combo: heading(),
    review: [
        ...heading(),
        text('amountLabel', '金额标签', '.pt-summary .pt-total > span'),
    ],
    payment: [
        ...heading(),
        text('amountLabel', '金额标签', '.pt-pay-amount > span'),
    ],
    waitList: [
        ...heading(),
        text('phoneLabel', '联系电话标签', '.pt-queue-form label[for=pt-wait-phone]'),
        text('help', '登记提示', '.pt-queue-form .pt-form-help'),
    ],
    tableService: heading(),
    phoneInput: [
        ...heading(),
        text('phoneLabel', '手机号标签', 'label[for=pt-phone]'),
        text('submit', '确认按钮文案', '.pt-bottom .pt-primary > span', '.btnConfirm___wH7C3'),
    ].filter(field => field.id !== 'continue'),
    reward: heading(),
    enterName: [
        ...heading('.enterNameTitle___havey'),
        text('nameLabel', '姓名标签', 'label[for=pt-name]'),
    ],
    partySizeSelection: heading('.partySizeTitle___L1vQH'),
    togoOption: heading('.togoPanelTitle___tSkY6'),
    chooseTable: heading('.chooseTableTitle___Q8nVb'),
    tippingPanel: heading('.panelTitle___4z5or'),
    cardPayment: [
        ...heading('.title___grSiq'),
        text('amountLabel', '金额标签', '.pt-status-card > span:first-child'),
    ],
    afterCreditCardPay: [
        ...heading('.title___9qbN5'),
        text('amountLabel', '金额标签', '.pt-status-card > span:first-child'),
    ],
    signature: [
        ...heading(),
        text('signatureLabel', '签名栏提示', '.pt-signature-card > div > span'),
        text('help', '确认提示', '.pt-signature-page .pt-form-help'),
    ],
    login: [
        ...heading(),
        text('phoneLabel', '手机号标签', 'label[for=pt-phone]'),
    ],
    paymentMember: heading(),
    connectionError: heading(),
};

const EMENU_ELEMENTS: Record<string, readonly ElementSpec[]> = {
    home: [
        ...mobileHeading('开始点餐按钮'),
        { id: 'hero', label: '首页主图', kind: 'image', custom: '.em main .hero' },
    ],
    menu: [
        text('heading', '推荐分类显示名', '.em .menu-tabs > b'),
        text('cart', '购物车按钮文案', '.em footer [data-emenu-copy]'),
    ],
    detail: [
        text('description', '详情提示', '.em main [data-emenu-copy=detail-note]'),
        text('flavorLabel', '口味标签', '.em main .row:nth-last-child(2) b'),
        text('cart', '加购按钮文案', '.em footer [data-emenu-copy]'),
    ],
    review: [
        ...mobileHeading('确认订单按钮'),
        text('totalLabel', '合计标签', '.em main .row:last-child > b:first-child'),
    ].filter(field => field.id !== 'subtitle'),
    payment: [
        text('title', '支付标题', '.em main h1:first-of-type'),
        text('amountLabel', '金额标签', '.em main p'),
        text('continue', '支付按钮文案', '.em footer button'),
    ],
    finish: [
        text('title', '成功标题', '.em .success h2'),
        text('orderLabel', '取餐号说明', '.em .success p:nth-of-type(2)'),
        text('pickup', '取餐提示', '.em .success p:last-child'),
        text('continue', '返回按钮文案', '.em footer button'),
    ],
    login: mobileHeading('登录按钮文案'),
};

export type PageContent = Record<string, Record<string, string | true>>;
export const MAX_PAGE_IMAGE_BYTES = 120 * 1024;
const MAX_IMAGE_LENGTH = 4 * Math.ceil(MAX_PAGE_IMAGE_BYTES / 3) + 32;
export const MAX_PAGE_TEXT = 60;

export function pageElements(channel: 'kiosk' | 'emenu', page: string) {
    const catalog = channel === 'kiosk' ? KIOSK_ELEMENTS : EMENU_ELEMENTS;
    return Object.hasOwn(catalog, page) ? catalog[page] : [];
}

export function validatePageContent(channel: 'kiosk' | 'emenu', content: PageContent) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) return false;
    return Object.entries(content).every(([page, values]) =>
        values && typeof values === 'object' && !Array.isArray(values) &&
        Object.entries(values).every(([id, value]) => {
            const field = pageElements(channel, page).find(element => element.id === id);
            if (!field) return false;
            if (field.kind === 'hidden') return value === true;
            if (typeof value !== 'string') return false;
            if (field.kind === 'text') return Boolean(value.trim()) && value.length <= MAX_PAGE_TEXT;
            return value.length <= MAX_IMAGE_LENGTH && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
        }) && pageElements(channel, page).length > 0);
}
