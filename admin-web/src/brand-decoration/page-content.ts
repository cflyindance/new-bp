export const PAGE_CONTENT_GROUPS = {
    copy: '标题与说明',
    button: '按钮',
    paymentMethods: '支付方式卡片',
    choiceCards: '选项卡片',
    field: '字段标签',
    image: '图片',
    visibility: '显示设置',
} as const;
type ContentGroup = keyof typeof PAGE_CONTENT_GROUPS;

type ElementSpec = {
    id: string;
    label: string;
    kind: 'text' | 'image' | 'hidden';
    group?: Exclude<ContentGroup, 'image' | 'visibility'>;
    attribute?: 'placeholder';
    previewHitArea?: string;
    custom?: string;
    native?: string;
    nativeOriginal?: string;
    nativeLabel?: string;
    nativeGroup?: ContentGroup;
};

const text = (id: string, label: string, custom: string, native?: string): ElementSpec =>
    ({ id, label, kind: 'text', custom, native });
const button = (id: string, label: string, custom: string, native?: string): ElementSpec =>
    ({ ...text(id, label, custom, native), group: 'button' });
const fieldLabel = (id: string, label: string, custom: string, native?: string): ElementSpec =>
    ({ ...text(id, label, custom, native), group: 'field' });
export function pageContentGroup(field: ElementSpec, native = false): ContentGroup {
    if (native && field.nativeGroup) return field.nativeGroup;
    return field.kind === 'image' ? 'image' : field.kind === 'hidden' ? 'visibility' : field.group ?? 'copy';
}
const secondary = (label = '次按钮文案', native?: string) =>
    button('secondary', label, '.pt-bottom .pt-back-button > span', native);
const heading = (native?: string, primary = button('continue', '主按钮文案', '.pt-bottom .pt-primary > span'),
    other = secondary()) => [
    text('title', '页面标题', '.pt-heading h1', native),
    text('subtitle', '页面说明', '.pt-heading > p'),
    primary,
    other,
];
const mobileHeading = (cta = '主按钮文案') => [
    text('title', '页面标题', '.em main h1'),
    text('subtitle', '页面说明', '.em main p'),
    button('continue', cta, '.em footer button'),
];

const KIOSK_ELEMENTS: Record<string, readonly ElementSpec[]> = {
    home: [
        { id: 'title', label: '首页标题', kind: 'text', custom: '.pt-home-copy h1', native: '.mainName___wLUYw' },
        { id: 'subtitle', label: '首页副标题', kind: 'text', custom: '.pt-home-copy p' },
        { id: 'hero', label: '首页主图', kind: 'image', custom: '.pt-home-image .pt-photo' },
        button('start', '开始点单按钮', '[data-k=start] > span', '.orderingBtn___jUzMM'),
    ],
    menu: [
        { id: 'heading', label: '推荐区标题', kind: 'text', custom: '.pt-list-title h2' },
        { id: 'banner', label: '活动图', kind: 'image', custom: '.pt-menu-banner .pt-photo' },
        button('cart', '购物车按钮文案', '[data-k=cart] > span'),
        { id: 'hideBanner', label: '隐藏活动推荐区', kind: 'hidden', custom: '.pt-menu-banner' },
    ],
    finish: [
        { id: 'title', label: '完成页标题', kind: 'text', custom: '.pt-finish h1' },
        fieldLabel('orderLabel', '取餐号说明', '.pt-ticket-label span', '.currentOrderNum___-5ivB > div:first-child'),
        { id: 'pickup', label: '取餐提示', kind: 'text', custom: '.pt-ticket > p' },
        { id: 'thanks', label: '致谢语', kind: 'text', custom: '.pt-thanks h2' },
        button('back', '结束按钮文案', 'footer .pt-primary[data-k=home] > span', '.close___mL5p5'),
        secondary(),
    ],
    screensaver: [
        text('title', '待机标题', '.pt-home-copy h1'),
        text('subtitle', '待机说明', '.pt-home-copy p'),
        button('wake', '开始按钮文案', '[data-k=wake] > span'),
        { id: 'hero', label: '待机主图', kind: 'image', custom: '.pt-home-image .pt-photo' },
    ],
    orderType: heading('.orderTypeTitle___RrElR'),
    detail: [
        text('specification', '规格区标题', '.pt-detail-copy h3'),
        button('continue', '加购按钮文案', '.pt-bottom .pt-primary > span'),
        secondary(),
    ],
    combo: heading(),
    review: [
        ...heading(),
        fieldLabel('amountLabel', '金额标签', '.pt-summary .pt-total > span'),
    ],
    payment: [
        ...heading(),
        fieldLabel('amountLabel', '金额标签', '.pt-pay-amount > span'),
        { ...text('scanTitle', '扫码支付标题', '.pt-payment-options [data-value="scan"] .pt-option-copy > strong'),
            group: 'paymentMethods', previewHitArea: '.pt-payment-options [data-value="scan"]' },
        { ...text('scanNote', '扫码支付说明', '.pt-payment-options [data-value="scan"] .pt-option-copy > small'), group: 'paymentMethods' },
        { ...text('cardTitle', '银行卡支付标题', '.pt-payment-options [data-value="card"] .pt-option-copy > strong'),
            group: 'paymentMethods', previewHitArea: '.pt-payment-options [data-value="card"]' },
        { ...text('cardNote', '银行卡支付说明', '.pt-payment-options [data-value="card"] .pt-option-copy > small'), group: 'paymentMethods' },
    ],
    waitList: [
        ...heading(),
        fieldLabel('phoneLabel', '联系电话标签', '.pt-queue-form label[for=pt-wait-phone]'),
        text('help', '登记提示', '.pt-queue-form .pt-form-help'),
    ],
    tableService: heading(),
    phoneInput: [
        ...heading(),
        fieldLabel('phoneLabel', '手机号标签', 'label[for=pt-phone]'),
        button('submit', '确认按钮文案', '.pt-bottom .pt-primary > span', '.btnConfirm___wH7C3'),
    ].filter(field => field.id !== 'continue'),
    reward: heading(),
    enterName: [
        ...heading('.enterNameTitle___havey',
            button('continue', '确定按钮文案', '.pt-bottom .pt-primary > span', '.confirmCusTip___OnT-S'),
            secondary('跳过按钮文案', '.never___vP-xG')),
        fieldLabel('nameLabel', '姓名标签', 'label[for=pt-name]'),
    ],
    partySizeSelection: heading('.partySizeTitle___L1vQH'),
    togoOption: heading('.togoPanelTitle___tSkY6'),
    chooseTable: heading('.chooseTableTitle___Q8nVb'),
    tippingPanel: heading('.panelTitle___4z5or'),
    cardPayment: [
        ...heading('.title___grSiq'),
        fieldLabel('amountLabel', '金额标签', '.pt-status-card > span:first-child'),
    ],
    afterCreditCardPay: [
        ...heading('.title___9qbN5'),
        fieldLabel('amountLabel', '金额标签', '.pt-status-card > span:first-child'),
    ],
    signature: [
        ...heading(),
        fieldLabel('signatureLabel', '签名栏提示', '.pt-signature-card > div > span'),
        text('help', '确认提示', '.pt-signature-page .pt-form-help'),
    ],
    login: [
        ...heading(),
        fieldLabel('phoneLabel', '手机号标签', 'label[for=pt-phone]'),
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
        button('cart', '购物车按钮文案', '.em footer [data-emenu-copy]'),
    ],
    detail: [
        text('description', '详情提示', '.em main [data-emenu-copy=detail-note]'),
        fieldLabel('flavorLabel', '口味标签', '.em main .row:nth-last-child(2) b'),
        button('cart', '加购按钮文案', '.em footer [data-emenu-copy]'),
    ],
    review: [
        ...mobileHeading('确认订单按钮'),
        fieldLabel('totalLabel', '合计标签', '.em main .row:last-child > b:first-child'),
    ].filter(field => field.id !== 'subtitle'),
    payment: [
        text('title', '支付标题', '.em main h1:first-of-type'),
        fieldLabel('amountLabel', '金额标签', '.em main p'),
        button('continue', '支付按钮文案', '.em footer button'),
    ],
    finish: [
        text('title', '成功标题', '.em .success h2'),
        fieldLabel('orderLabel', '取餐号说明', '.em .success p:nth-of-type(2)'),
        text('pickup', '取餐提示', '.em .success p:last-child'),
        button('continue', '返回按钮文案', '.em footer button'),
    ],
    login: mobileHeading('登录按钮文案'),
};


const placeholder = (id: string, label: string, selector: string): ElementSpec =>
    ({ ...fieldLabel(id, label, selector), attribute: 'placeholder' });
const choiceCopy = (id: string, label: string, group: string, value: string, editableTitle = true): ElementSpec[] => {
    const card = `[data-k="pt-select"][data-group="${group}"][data-value="${value}"]`;
    const options: ElementSpec[] = [
        { ...text(id + 'Note', label + '说明', card + ' .pt-option-copy > small'), group: 'choiceCards' },
    ];
    if (editableTitle) options.unshift({
        ...text(id + 'Title', label + '标题', card + ' .pt-option-copy > strong'), group: 'choiceCards', previewHitArea: card,
    });
    else options[0].previewHitArea = card;
    return options;
};

const homeCopy = [
    text('eyebrow', '页眉短句', '.pt-home-copy > .pt-kicker'),
    text('leftTagline', '品牌短句一', '.pt-home-detail > span:first-child'),
    text('rightTagline', '品牌短句二', '.pt-home-detail > span:last-child'),
    text('actionNote', '操作提示', '.pt-home-action > small'),
    text('footerNote', '页脚寄语', '.pt-home-foot > span:last-child'),
];
const phoneCopy = [
    fieldLabel('phoneFieldLabel', '手机号字段标签', '.pt-phone-field > span'),
    placeholder('phonePlaceholder', '手机号输入提示', '#pt-phone'),
    text('phoneHelp', '手机号用途说明', '.pt-form-card .pt-form-help'),
    text('formCaption', '表单短句', '.pt-form-symbol > span'),
    button('clearPhone', '清空按钮', '.pt-key[data-value="清空"]'),
];
const membershipCopy = [
    text('memberTagline', '会员卡标识', '.pt-membership-card > div:first-child > span'),
    text('memberCaption', '会员卡短句', '.pt-membership-card > .pt-kicker'),
    text('memberTitle', '会员卡标题', '.pt-membership-card > h2'),
];
const KIOSK_LAYOUT_COPY: Record<string, readonly ElementSpec[]> = {
    home: homeCopy,
    screensaver: homeCopy,
    orderType: [...choiceCopy('dineIn', '堂食卡片', 'dining', '堂食'), ...choiceCopy('takeout', '打包卡片', 'dining', '打包')],
    menu: [
        text('bannerCaption', '推荐区短句', '.pt-menu-banner .pt-kicker'),
        text('bannerTitle', '活动主标题', '.pt-menu-banner h2'),
        text('bannerNote', '活动说明', '.pt-menu-banner p'),
        text('listNote', '商品区说明', '.pt-list-title > span'),
        fieldLabel('cartCountLabel', '已选餐品标签', '.pt-cart > div small'),
    ],
    detail: [
        text('detailCaption', '商品详情短句', '.pt-detail-copy > .pt-kicker'),
        text('detailBadge', '商品展示角标', '.pt-detail-hero .pt-flag'),
        ...choiceCopy('regular', '标准份规格', 'spec', '标准份', false),
        ...choiceCopy('large', '大份规格', 'spec', '大份', false),
    ],
    combo: ['主食', '配菜', '饮品'].flatMap((name, index) => [
        fieldLabel('groupTitle' + index, name + '分组名称', `.pt-combo-groups > section:nth-child(${index + 1}) .pt-combo-title h3`),
        text('groupNote' + index, name + '分组说明', `.pt-combo-groups > section:nth-child(${index + 1}) .pt-combo-title small`),
    ]),
    review: [
        text('summaryCaption', '订单摘要短句', '.pt-summary > .pt-kicker'),
        text('summaryTitle', '订单摘要标题', '.pt-summary > h2'),
        fieldLabel('diningLabel', '用餐方式标签', '.pt-summary > div:nth-of-type(1) > span'),
        fieldLabel('quantityLabel', '餐品数量标签', '.pt-summary > div:nth-of-type(2) > span'),
        text('summaryNote', '订单摘要说明', '.pt-summary > small'),
    ],
    payment: [text('paymentSafety', '支付提示', '.pt-payment-safety > [data-bd-copy]')],
    finish: [
        text('finishCaption', '完成页短句', '.pt-finish > .pt-kicker'),
        text('subtitle', '完成页说明', '.pt-finish > p'),
        fieldLabel('orderCaption', '取餐号副标签', '.pt-ticket-label > small'),
        fieldLabel('totalLabel', '订单金额标签', '.pt-ticket-total > span'),
        button('receiptPrint', '打印小票按钮', '.pt-receipt-actions [data-k="print"] > [data-bd-copy]'),
        button('receiptSkip', '无需小票按钮', '.pt-receipt-actions [data-k="home"]'),
        text('thanksNote', '致谢说明', '.pt-thanks > span'),
    ],
    waitList: [
        text('queueCaption', '登记卡片短句', '.pt-queue-card > .pt-kicker'),
        text('queueTitle', '登记卡片标题', '.pt-queue-card > h2'),
        text('queueNote', '登记卡片说明', '.pt-queue-card > p'),
        text('queueTagline', '服务寄语', '.pt-queue-card > div > span:last-child'),
        fieldLabel('partyLabel', '用餐人数标签', '.pt-queue-form > label:first-child'),
        placeholder('phonePlaceholder', '联系电话输入提示', '#pt-wait-phone'),
    ],
    tableService: [...choiceCopy('counter', '柜台取餐卡片', 'service', '柜台自取'), ...choiceCopy('delivery', '送餐到桌卡片', 'service', '送餐到桌')],
    phoneInput: phoneCopy,
    reward: [
        ...membershipCopy,
        fieldLabel('pointsLabel', '可用积分标签', '.pt-membership-bottom small'),
        button('firstRewardAction', '第一条奖励领取按钮', '.pt-reward:nth-child(1) > i'),
        button('secondRewardAction', '第二条奖励领取按钮', '.pt-reward:nth-child(2) > i'),
    ],
    enterName: [
        text('nameCaption', '姓名输入短句', '.pt-name-card > .pt-kicker'),
        placeholder('namePlaceholder', '姓名输入提示', '#pt-name'),
        text('nameNote', '姓名卡片说明', '.pt-name-decoration > p'),
    ],
    partySizeSelection: [
        text('introTitle', '人数卡片标题', '.pt-party-intro > h2'),
        text('introNote', '人数卡片说明', '.pt-party-intro > p'),
    ],
    togoOption: [
        ...choiceCopy('withCutlery', '需要餐具卡片', 'cutlery', '需要餐具'),
        ...choiceCopy('withoutCutlery', '无需餐具卡片', 'cutlery', '无需餐具'),
        text('ecoNote', '外带提示', '.pt-quiet-note > [data-bd-copy]'),
    ],
    chooseTable: [
        fieldLabel('zoneLabel', '用餐区域标签', '.pt-zone-label > span'),
        text('zoneHelp', '选桌提示', '.pt-zone-label > small'),
    ],
    tippingPanel: [
        text('gratitudeTitle', '感谢卡片标题', '.pt-gratitude > h2'),
        text('gratitudeNote', '感谢卡片说明', '.pt-gratitude > p'),
        ...choiceCopy('tip15', '第一档小费', 'tip', '15%', false),
        ...choiceCopy('tip18', '第二档小费', 'tip', '18%', false),
        ...choiceCopy('tip20', '第三档小费', 'tip', '20%', false),
        button('skipTip', '不添加按钮', '.pt-tip-alternatives [data-k="pt-select"]'),
        button('customTip', '自定义金额按钮', '.pt-tip-alternatives [data-k="pt-custom-tip"]'),
        text('tipHelp', '小费说明', '.pt-choice-page > .pt-form-help'),
    ],
    cardPayment: [text('statusNote', '读卡器提示', '.pt-status-card > p')],
    afterCreditCardPay: [text('statusNote', '支付完成说明', '.pt-status-card > p')],
    signature: [
        fieldLabel('paidLabel', '已支付金额标签', '.pt-signature-summary > span'),
        button('clearSignature', '重新签写按钮', '.pt-signature-card [data-k="native-clear"]'),
        fieldLabel('signLineLabel', '签名线标签', '.pt-sign-line > span'),
        text('signLineNote', '签名线说明', '.pt-sign-line > small'),
    ],
    login: phoneCopy,
    paymentMember: [
        ...membershipCopy,
        text('memberNote', '会员卡说明', '.pt-membership-bottom > span'),
        text('benefitTitle', '权益标题', '.pt-benefits > div:first-child > strong'),
        text('benefitNote', '权益说明', '.pt-benefits > div:first-child > small'),
        text('pointsTitle', '积分标题', '.pt-benefits > div:last-child > strong'),
        text('pointsNote', '积分说明', '.pt-benefits > div:last-child > small'),
    ],
    connectionError: [
        text('errorTitle', '异常卡片标题', '.pt-status-card > strong'),
        text('errorNote', '异常卡片说明', '.pt-status-card > p'),
        text('errorTag', '异常卡片提示', '.pt-status-tag'),
    ],
};
const EMENU_LAYOUT_COPY: Record<string, readonly ElementSpec[]> = {
    home: [text('eyebrow', '首页短句', '.em main > .eyebrow')],
    menu: [
        fieldLabel('featuredCategory', '第二分类标签', '.em .menu-tabs > span:first-of-type'),
        fieldLabel('drinkCategory', '第三分类标签', '.em .menu-tabs > span:last-of-type'),
    ],
    detail: [fieldLabel('portionLabel', '份量标签', '.em main .row:last-child > b')],
    review: [text('eyebrow', '订单短句', '.em main > .eyebrow')],
    payment: [
        text('eyebrow', '支付短句', '.em main > .eyebrow'),
        { ...text('cardTitle', '银行卡支付标题', '.em [data-payment-method="card"] > b'), group: 'paymentMethods',
            previewHitArea: '[data-payment-method="card"]' },
        { ...text('scanTitle', '扫码支付标题', '.em [data-payment-method="scan"] > b'), group: 'paymentMethods',
            previewHitArea: '[data-payment-method="scan"]' },
    ],
    finish: [text('eyebrow', '完成页短句', '.em .success > p:first-of-type')],
    login: [
        text('eyebrow', '登录短句', '.em main > .eyebrow'),
        placeholder('phonePlaceholder', '手机号输入提示', '.em main > input'),
    ],
};


const nativeText = (id: string, label: string, selector: string, original?: string, group?: ElementSpec['group']): ElementSpec =>
    ({ id, label, kind: 'text', native: selector, nativeOriginal: original, group });
const nativeButton = (id: string, label: string, selector: string, original?: string) =>
    nativeText(id, label, selector, original, 'button');

const KIOSK_NATIVE_COPY: Record<string, readonly ElementSpec[]> = {
    menu: [nativeText('listEnd', '列表底部提示', '#root div', '—— 已经到底啦 ——')],
    combo: [
        nativeText('listEnd', '列表底部提示', '#root div', '—— 已经到底啦 ——'),
        nativeButton('continue', '加购按钮文案', '#root div', '加入购物车'),
    ],
    orderType: [
        nativeButton('dineInTitle', '堂食按钮文案', '.text___2pQ--', '我要堂吃'),
        nativeButton('takeoutTitle', '打包按钮文案', '.text___2pQ--', '我要打包'),
    ],
    detail: [
        nativeText('specification', '规格区标题', '#root span', '规格'),
        nativeText('itemNote', '商品备注标签', '.title___Z-GBw'),
        nativeButton('continue', '加购按钮文案', '#root span', '加入购物车'),
    ],
    review: [
        nativeText('orderNote', '订单备注标签', '.title___XfUCM'),
        nativeText('listEnd', '列表底部提示', '#root div', '—— 已经到底啦 ——'),
        nativeButton('continue', '确认订单按钮文案', '#root div', '确认订单'),
    ],
    payment: [
        nativeText('title', '支付方式标题', '.paymentMethod___8b2eu'),
        nativeText('cardTitle', '信用卡／借记卡文案', '.payText___k1kKm', '信用卡/借记卡', 'paymentMethods'),
        nativeText('counterTitle', '柜台支付文案', '.payText___k1kKm', '柜台支付', 'paymentMethods'),
    ],
    finish: [
        nativeText('receiptTitle', '收据方式标题', '.receipt___xNg8u'),
        nativeButton('receiptPrint', '打印收据按钮', '.txt___Lj26F', '打印收据'),
        nativeButton('receiptSkip', '不要收据按钮', '.txt___Lj26F', '不要收据'),
    ],
    tableService: [
        nativeText('title', '取餐方式标题', '.serviceTypeMethod___3bdgp'),
        nativeButton('counterTitle', '柜台自取按钮文案', '.title___FeLjk', '柜台自取'),
        nativeButton('deliveryTitle', '送餐到桌按钮文案', '.title___FeLjk', '送餐到桌'),
    ],
    phoneInput: [
        nativeText('title', '手机号输入标题', '#root span', '请提供您的手机号以便接收订单信息'),
        nativeText('phonePlaceholder', '手机号输入提示', '.showPhone___HQ8g5', '请输入手机号', 'field'),
        nativeButton('secondary', '跳过按钮文案', '.never___cxSDJ'),
        nativeButton('submit', '确定按钮文案', '.btnConfirm___wH7C3, .btnNoConfirm___7glLx'),
    ],
    reward: [
        nativeText('title', '会员奖励标题', '.title___G-N5s'),
        nativeText('pointsLabel', '积分标签', '.pts___rdj6B', undefined, 'field'),
        nativeButton('secondary', '跳过按钮文案', '.skipBtn___Cz-ty'),
        nativeButton('continue', '选择兑换按钮文案', '.btnNotConfirm___nzxTe'),
    ],
    partySizeSelection: [
        nativeButton('secondary', '跳过按钮文案', '.never___ElcYN'),
        nativeButton('continue', '确定按钮文案', '.btnConfirm___buD-5'),
    ],
    togoOption: [
        nativeButton('cutleryLabel', '餐具选项文案', '.name___-WAWB', '需要免费餐具'),
        nativeButton('bagLabel', '打包袋选项文案', '.name___-WAWB', '需要免费打包袋'),
        nativeButton('secondary', '跳过按钮文案', '.never___vAk1R'),
        nativeButton('continue', '确定按钮文案', '#root div', '确定'),
    ],
    chooseTable: [nativeButton('secondary', '跳过按钮文案', '.skipBtn___eqrsV')],
    tippingPanel: [
        nativeButton('skipTip', '不添加小费按钮文案', '.tipBtnText___Eql6S', '没有小费'),
        nativeButton('customTip', '自定义小费按钮文案', '.tipBtnText___Eql6S', '自定义'),
        nativeButton('continue', '确定按钮文案', '.confirmBtnContainer___i5mLL'),
    ],
    cardPayment: [
        nativeText('title', '读卡器操作标题', '#root div', '请使用右侧读卡器完成付款'),
        nativeText('subtitle', '取消支付提示', '.cardPaymentSubTips___s08jH'),
        nativeText('amountLabel', '总计标签', '#root div', '总计', 'field'),
    ],
    afterCreditCardPay: [
        nativeButton('clearSignature', '重签按钮文案', '.backBtn___si-yA'),
        nativeButton('continue', '确定按钮文案', '#root span', '确定'),
    ],
    signature: [
        nativeText('title', '签名标题', '.header___XWCPD'),
        nativeButton('clearSignature', '重签按钮文案', '.backBtn___si-yA'),
        nativeButton('continue', '确定按钮文案', '#root span', '确定'),
    ],
    login: [
        nativeText('title', '会员登录标题', '.title___3sx3O'),
        nativeText('phonePlaceholder', '手机号输入提示', '.showPhone___HQ8g5', '请输入手机号', 'field'),
        nativeButton('secondary', '取消按钮文案', '.never___a10Py'),
        nativeButton('continue', '确定按钮文案', '.confirmBtn___bbIGb'),
    ],
    paymentMember: [
        nativeText('title', '支付后会员标题', '#root h1', '将卡片绑定到会员账户'),
        nativeText('subtitle', '绑定会员说明', '#root p', '输入手机号以绑定您的账户。'),
        nativeButton('secondary', '跳过按钮文案', '.secondaryButton___Xilnw'),
        nativeButton('continue', '注册或登录按钮文案', '.primaryButton___4Uuok'),
    ],
    connectionError: [
        nativeText('title', '支付失败标题', '.ops___gr6Fv'),
        nativeText('subtitle', '失败说明', '.failureDescription___nCpLq'),
        nativeButton('secondary', '取消订单按钮文案', '.failureActionBtn___5p-2o'),
        nativeButton('continue', '再试一次按钮文案', '.tryAgainBtn___n5542'),
        nativeButton('payAtCounter', '柜台支付按钮文案', '.bottomBtn___Ca5CN'),
    ],
};
export type PageContent = Record<string, Record<string, string | true>>;
export const MAX_PAGE_IMAGE_BYTES = 120 * 1024;
const MAX_IMAGE_LENGTH = 4 * Math.ceil(MAX_PAGE_IMAGE_BYTES / 3) + 32;
export const MAX_PAGE_TEXT = 60;

export function pageElements(channel: 'kiosk' | 'emenu', page: string) {
    const catalog = channel === 'kiosk' ? KIOSK_ELEMENTS : EMENU_ELEMENTS;
    if (!Object.hasOwn(catalog, page)) return [];
    const extra = channel === 'kiosk' ? KIOSK_LAYOUT_COPY : EMENU_LAYOUT_COPY;
    const fields = catalog[page];
    const kicker = channel === 'kiosk' && fields.some(field => field.custom === '.pt-heading h1')
        ? [text('headingCaption', '页面短句', '.pt-heading > .pt-kicker')]
        : [];
    const combined = [...fields, ...kicker, ...(Object.hasOwn(extra, page) ? extra[page] : [])];
    if (channel !== 'kiosk' || !Object.hasOwn(KIOSK_NATIVE_COPY, page)) return combined;
    for (const nativeField of KIOSK_NATIVE_COPY[page]) {
        const index = combined.findIndex(field => field.id === nativeField.id);
        if (index < 0) combined.push(nativeField);
        else combined[index] = {
            ...combined[index], native: nativeField.native, nativeLabel: nativeField.label,
            nativeOriginal: nativeField.nativeOriginal, nativeGroup: pageContentGroup(nativeField),
        };
    }
    return combined;
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
