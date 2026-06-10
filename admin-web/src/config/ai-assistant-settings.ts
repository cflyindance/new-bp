/**
 * AI 助手 · 全站功能设置检索与开关改配（基于 module-settings catalog + localStorage 原型）
 */

import type { ModuleSettingCatalogItem } from "./module-settings-catalog";
import {
  getModuleSettingsItemHref,
  listAllModuleSettingCatalogEntries,
} from "./module-settings-catalog";
import {
  formatMultiOptionGuide,
  processAiAssistantComplexSettingChange,
  processSubOptionConfigureIntent,
  readSubOptionStatusSummary,
} from "./module-settings-ai-editable";
import { hasSubOptionsForSeq } from "./module-settings-ai-multi-options";
import {
  isModuleSettingToggleSeq,
  readModuleSettingToggleOn,
} from "./module-settings-toggle-ui";

import type { AiSettingMutation } from "./module-settings-ai-editable";

export type AiAssistantReply = {
  text: string;
  html: string;
  /** 若通过 AI 改写了开关，供 UI 同步刷新 */
  changedSeq?: number;
  changedOn?: boolean;
  /** 复杂改配（表单 / 多选 / 产线 / 数值等） */
  mutations?: AiSettingMutation[];
};

type IndexedSetting = {
  hubTitle: string;
  settingsPath: string;
  item: ModuleSettingCatalogItem;
  href: string;
  searchable: string;
  titleNorm: string;
};

type ConfigureIntent = {
  action: "on" | "off";
  target: string;
};

/** 检索类口语（模糊意图） */
const SEARCH_INTENT_RE =
  /搜索|搜一下|搜一搜|搜下|搜啥|搜|查找|查一下|查询|查|找找|找一下|找下|找|哪里有|在哪|哪儿|哪个|哪些|什么设置|哪些设置|有没有|有吗|有没有相关|想知道|看看|看一下|看下|浏览|定位|列出|列表|显示|展示|告诉我|帮我看|帮我找|给我|推荐|入口|跳转|去哪|啥地方|什么地方|哪个页面|路径|怎么配|在哪配|如何配置|怎么设置|在哪里设置|想改|想配|帮我配|全部|所有|有哪些|setting|settings|find|search|where|look\s+for|show\s+me|list|locate|navigate|go\s+to|browse|recommend|how\s+to/i;

/** 领域关键词：无显式「搜索」也尝试匹配设置 */
const DOMAIN_KEYWORD_RE =
  /配置|设置|开关|功能项|选项|参数|规则|策略|修改|改一下|调整|打印|小费|班结|日结|结算|送厨|厨房|厨打|权限|税|税率|收据|小票|厨房单|支付|结账|会员|等位|排队|外卖|来取|礼品卡|库存|财务|钱箱|平账|备款|batch|客显|cds|kds|后厨|前厅|pos|打包|折扣|加收|报表|消息|通知|短信|语音|长短款|容差|提现|关账|刷卡|信用卡|借记卡|卡付|服务费|附加费|扫码|自助|kiosk|堂食|堂吃|外带|外送|预约|薪酬|工资|分摊|促销|优惠券|评价|评论|团队|员工|硬件|打印机|支付终端|密码|角色|店长|收银员|火锅|锅底|效期|盘点|采购|供应商|购货单|主题色|超时|布局|收单|免税|计税|打包单|传菜|上菜|备餐|出餐|找单|合单|预设|分摊小费|分享小费|云等位|号码牌|调味|改价|整单税|收银|点单|食客|企台|drawer|tip|tips|gratuity|surcharge|receipt|takeout|delivery|pickup|waitlist|payroll|hotpot|stocktake|procurement/i;

/** 查询开关状态 */
const STATUS_INTENT_RE =
  /是否开启|是否打开|是否启用|是否关闭|是否关掉|开了吗|关了吗|开着吗|关着吗|有没有开|有没有关|有没有启用|有没有关掉|当前状态|状态是|是开还是关|开没开|关没关|启用没|关掉没|现在开|现在关|现在是开|现在是关|查状态|查看状态|处于什么状态|什么状态|enabled|disabled|on\s+or\s+off|is\s+it\s+on|is\s+it\s+off|status/i;

/** 口语同义词 → 扩展检索词 */
const QUERY_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  班结: ["日结", "结算", "现金", "平账", "提现", "关账", "关店", "打烊", "收银员下班"],
  日结: ["班结", "结算", "现金", "平账", "关账"],
  平账: ["班结", "日结", "长短款", "对账", "钱箱"],
  长短款: ["容差", "平账", "钱箱", "对账", "超差"],
  容差: ["长短款", "平账", "超差"],
  备款: ["开班", "备用金", "钱箱", "开班金", "drawer"],
  提现: ["班结", "现金", "平账", "日结"],
  关账: ["batch", "关店", "日结", "结算", "批结算"],
  batch: ["批结算", "卡结算", "刷卡结算", "关账", "日终", "batch结算"],
  送厨: ["厨房", "厨打", "后厨", "厨房单", "上菜", "传菜"],
  厨房单: ["送厨", "厨打", "厨房", "后厨"],
  厨打: ["送厨", "厨房", "厨房单", "打印机"],
  打包单: ["打包", "外带", "来取", "takeout"],
  打包: ["外带", "来取", "打包单", "takeout"],
  小费: ["tip", "tips", "gratuity", "小费池", "服务费"],
  小费池: ["分享小费", "分摊", "薪酬", "payroll"],
  分享小费: ["小费池", "分摊", "payroll", "分摊小费"],
  分摊: ["分享小费", "小费池", "薪酬"],
  打印: ["收据", "小票", "出纸", "打印机", "票种", "厨打"],
  收据: ["打印", "小票", "订单收据", "receipt"],
  小票: ["收据", "打印", "receipt", "订单收据"],
  支付: ["结账", "收款", "付款", "交易", "刷卡", "收单"],
  结账: ["支付", "收款", "客显", "cds", "checkout"],
  刷卡: ["支付", "信用卡", "借记卡", "卡付", "batch"],
  信用卡: ["刷卡", "卡付", "支付", "batch"],
  客显: ["cds", "客显屏", "食客结账", "结账屏"],
  cds: ["客显", "客显屏", "结账屏", "食客结账"],
  税: ["税率", "税务", "免税", "税费", "计税", "销售税"],
  折扣: ["打折", "优惠", "减价", "coupon"],
  打折: ["折扣", "优惠"],
  加收: ["服务费", "附加费", "surcharge"],
  服务费: ["加收", "附加费"],
  附加费: ["加收", "服务费"],
  会员: ["积分", "会员卡", "储值", "余额"],
  积分: ["会员", "会员卡"],
  储值: ["会员", "余额", "充值"],
  权限: ["授权", "角色", "rbac", "密码", "店长", "收银员"],
  密码: ["权限", "登录", "验证", "送厨密码"],
  角色: ["权限", "店长", "收银员", "服务员"],
  等位: ["排队", "waitlist", "叫号", "取号", "预约", "云等位"],
  排队: ["等位", "叫号", "取号", "waitlist"],
  预约: ["等位", "排队"],
  外卖: ["来取", "外送", "自取", "打包", "外带", "delivery"],
  外带: ["打包", "takeout", "外送", "外卖"],
  外送: ["外卖", "delivery", "外带"],
  来取: ["自取", "pickup", "打包", "外带"],
  堂食: ["堂吃", "dinein", "店内"],
  堂吃: ["堂食", "dinein"],
  财务: ["钱箱", "核算", "成本", "报表口径", "收单"],
  钱箱: ["现金", "平账", "备款", "开班", "drawer"],
  报表: ["总报表", "汇总", "核算", "sales"],
  消息: ["通知", "短信", "语音", "播报", "模板"],
  短信: ["消息", "通知", "下单完成", "取餐"],
  通知: ["消息", "短信", "语音", "播报"],
  礼品卡: ["gift", "卡券", "ecard", "电子卡"],
  库存: ["物料", "效期", "盘点", "供应链"],
  盘点: ["库存", "清点", "stocktake"],
  采购: ["购货单", "供应商", "补货", "procurement"],
  供应商: ["采购", "购货单", "补货"],
  购货单: ["采购", "供应商", "补货"],
  前厅: ["pos", "点单", "食客", "企台", "收银"],
  后厨: ["厨房", "kds", "厨打"],
  kds: ["后厨", "厨房屏", "出餐屏", "厨显"],
  pos: ["前厅", "收银", "点单", "服务员"],
  硬件: ["打印机", "支付终端", "钱箱", "设备"],
  打印机: ["打印", "收据机", "厨打机", "小票机"],
  促销: ["优惠", "折扣", "活动", "coupon"],
  团队: ["员工", "薪酬", "小费", "payroll", "工资"],
  薪酬: ["工资", "小费", "payroll", "团队"],
  工资: ["薪酬", "payroll", "小费"],
  扫码: ["自助", "kiosk", "点餐码", "线上下单"],
  自助: ["扫码", "kiosk", "顾客自助", "自助点餐"],
  kiosk: ["自助", "自助点餐", "顾客端"],
  评价: ["评论", "feedback", "评分"],
  超时: ["提醒", "kds", "出餐", "变色"],
  火锅: ["锅底", "锅型", "hotpot"],
  锅底: ["火锅", "锅型"],
  收银: ["pos", "前厅", "结账", "收银员"],
  点单: ["pos", "前厅", "下单", "点餐"],
  找单: ["订单列表", "未加小费"],
  合单: ["合并订单", "加收重算"],
  免税: ["税", "外送", "外卖单"],
  计税: ["税", "税基", "折扣后"],
  号码牌: ["打包", "取餐", "来取"],
  调味: ["备注", "口味", "加料"],
  收单: ["支付", "通道", "成本率", "刷卡"],
};

/** 多词口语 → 归一化检索词（在分词前替换） */
const PHRASE_ALIAS_REPLACERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/长短款|短款|长款|差多少钱/gi, "长短款容差"],
  [/刷卡结算|卡结|批结|日终结算/gi, "batch"],
  [/顾客屏|结账屏|双屏/gi, "客显"],
  [/小票机|收据机|热敏机/gi, "打印机"],
  [/关店|打烊|下班结/gi, "班结"],
  [/自取|pick\s*up/gi, "来取"],
  [/堂吃|店内吃|dine\s*-?\s*in/gi, "堂食"],
  [/外送单|delivery\s*order/gi, "外卖"],
  [/附加费|服务费|service\s*charge/gi, "加收"],
  [/打折|减价/gi, "折扣"],
  [/卡付|挥卡/gi, "刷卡"],
  [/分享小费|小费池|tip\s*pool/gi, "分摊小费"],
  [/购货|补货单/gi, "采购"],
  [/清点|盘库/gi, "盘点"],
  [/厨显|厨房屏|出餐屏/gi, "kds"],
  [/扫码点|扫码下单/gi, "扫码点餐"],
  [/自助机|自助点餐机/gi, "kiosk"],
  [/叫号|取号排队/gi, "等位"],
  [/预设小费|建议小费/gi, "小费"],
  [/开班金|备用金/gi, "备款"],
  [/对账|点钱/gi, "平账"],
  [/合并单|并单/gi, "合单"],
  [/号码牌|取餐号/gi, "号码牌"],
  [/税务|销售税/gi, "税"],
  [/礼品券|礼卡/gi, "礼品卡"],
  [/效期管理|保质期/gi, "效期"],
  [/低库存/gi, "库存"],
];

/** 管理中心别名 → 便于按业务域检索 */
const HUB_ALIAS_REPLACERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/财务中心|财务模块/gi, "财务"],
  [/打印中心|打印模块/gi, "打印"],
  [/支付中心|支付模块/gi, "支付"],
  [/后厨中心|厨房中心/gi, "后厨"],
  [/前厅中心|收银中心/gi, "前厅"],
  [/硬件中心|设备中心/gi, "硬件"],
  [/供应链|库存中心/gi, "库存"],
  [/等位中心|排队中心/gi, "等位"],
  [/消息中心|通知中心/gi, "消息"],
  [/报表中心/gi, "报表"],
  [/团队中心|人事/gi, "团队"],
  [/促销中心/gi, "促销"],
];

/** 剥离检索意图后的噪声词 */
const SEARCH_NOISE_RE =
  /搜索|搜一下|搜一搜|搜下|搜啥|搜|查找|查一下|查询|查|找找|找一下|找下|找|哪里有|在哪|哪儿|哪个|哪些|什么|有没有|有吗|想知道|看看|看一下|看下|浏览|定位|列出|列表|显示|展示|告诉我|帮我看|帮我找|给我|推荐|入口|跳转|去哪|啥地方|什么地方|哪个页面|路径|怎么配|在哪配|如何配置|怎么设置|在哪里设置|想改|想配|帮我配|全部|所有|有哪些|相关|一下|一下下|请|帮我|麻烦|能不能|可不可以|帮忙|可以|顺便|吗|呢|的|了|啊|呀|嘛|呗|功能|设置项|设置|配置|项|关于|有关|请问|想知道|想要|需要|我想|我要|能不能/gi;

const MIN_FUZZY_SCORE = 10;

const SETTING_INDEX: IndexedSetting[] = listAllModuleSettingCatalogEntries().map((row) => {
  const { hubTitle, settingsPath, item } = row;
  const searchable = [
    hubTitle,
    settingsPath,
    item.groupTitle,
    item.groupKey,
    item.title,
    item.sceneDesc,
    item.moduleName,
    item.feature,
    String(item.seq),
  ]
    .join(" ")
    .toLowerCase();
  return {
    hubTitle,
    settingsPath,
    item,
    href: getModuleSettingsItemHref(settingsPath, item),
    searchable,
    titleNorm: item.title.toLowerCase(),
  };
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function settingLink(href: string, label: string): string {
  return `<a href="#${escapeHtml(href)}" class="font-medium text-primary underline underline-offset-2 hover:text-primary/80">${escapeHtml(label)}</a>`;
}

function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[？?！!。．.，,、；;：:""''【】\[\]()（）<>《》—\-_/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 口语别名归一化，提升模糊检索命中率 */
function normalizeQueryPhrase(phrase: string): string {
  let out = phrase;
  for (const [re, replacement] of PHRASE_ALIAS_REPLACERS) {
    out = out.replace(re, replacement);
  }
  for (const [re, replacement] of HUB_ALIAS_REPLACERS) {
    out = out.replace(re, replacement);
  }
  return out.replace(/\s+/g, " ").trim();
}

function chineseBigrams(text: string): string[] {
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 2) return compact ? [compact] : [];
  const grams: string[] = [];
  for (let i = 0; i < compact.length - 1; i++) {
    grams.push(compact.slice(i, i + 2));
  }
  return grams;
}

function expandSynonyms(tokens: string[]): string[] {
  const out = new Set<string>();
  for (const token of tokens) {
    if (!token) continue;
    out.add(token);
    const syns = QUERY_SYNONYMS[token];
    if (syns) for (const s of syns) out.add(s.toLowerCase());
  }
  return [...out];
}

function tokenizePhrase(phrase: string): string[] {
  const norm = normalizePhrase(phrase);
  if (!norm) return [];
  const split = norm.split(/[\s,，、；;/.]+/).filter(Boolean);
  const bigrams = chineseBigrams(norm);
  const merged = [...split, ...bigrams];
  return expandSynonyms(merged).filter((t) => t.length >= 1);
}

/** 子序列模糊：query 字符按顺序出现在 text 中 */
function subsequenceRatio(query: string, text: string): number {
  const q = query.replace(/\s+/g, "");
  if (q.length < 2) return 0;
  let qi = 0;
  for (const ch of text) {
    if (ch === q[qi]) qi += 1;
    if (qi >= q.length) break;
  }
  return qi / q.length;
}

function scoreSetting(indexed: IndexedSetting, phrase: string): number {
  const q = normalizePhrase(normalizeQueryPhrase(phrase));
  if (!q) return 0;
  let score = 0;
  const { item, searchable, titleNorm } = indexed;

  if (titleNorm === q) score += 140;
  else if (titleNorm.includes(q)) score += 85;
  else {
    const sub = subsequenceRatio(q, titleNorm);
    if (sub >= 0.75) score += 45;
    else if (sub >= 0.55) score += 28;
    else if (sub >= 0.4) score += 14;
  }

  if (searchable.includes(q)) score += 40;

  const groupNorm = item.groupTitle.toLowerCase();
  if (groupNorm.includes(q)) score += 32;
  if (indexed.hubTitle.toLowerCase().includes(q)) score += 24;

  const tokens = tokenizePhrase(q);
  for (const token of tokens) {
    if (token.length < 2 && !/^\d+$/.test(token)) continue;
    if (titleNorm.includes(token)) score += 22;
    else if (groupNorm.includes(token)) score += 14;
    else if (searchable.includes(token)) score += 10;
    else {
      const sub = subsequenceRatio(token, titleNorm);
      if (sub >= 0.7) score += 8;
    }
  }

  const queryBigrams = chineseBigrams(q);
  const titleBigrams = new Set(chineseBigrams(titleNorm));
  let biHit = 0;
  for (const bg of queryBigrams) {
    if (titleBigrams.has(bg)) biHit += 1;
    else if (searchable.includes(bg)) biHit += 0.5;
  }
  if (queryBigrams.length > 0) {
    score += Math.round((biHit / queryBigrams.length) * 35);
  }

  const seqMatch = q.match(/\b(\d{1,4})\b/) ?? phrase.match(/(\d{1,4})/);
  if (seqMatch) {
    const seq = Number(seqMatch[1]);
    if (seq === item.seq) score += 240;
  }

  return score;
}

function searchSettings(phrase: string, limit = 6): IndexedSetting[] {
  const ranked = SETTING_INDEX.map((row) => ({ row, score: scoreSetting(row, phrase) }))
    .filter((x) => x.score >= MIN_FUZZY_SCORE)
    .sort((a, b) => b.score - a.score);

  if (ranked.length > 0) {
    return ranked.slice(0, limit).map((x) => x.row);
  }

  /** 二次放宽：仅用长度≥2 的字词做 OR 匹配 */
  const looseTokens = tokenizePhrase(phrase).filter((t) => t.length >= 2);
  if (looseTokens.length === 0) return [];

  return SETTING_INDEX.map((row) => {
    let score = 0;
    for (const token of looseTokens) {
      if (row.titleNorm.includes(token)) score += 15;
      else if (row.searchable.includes(token)) score += 6;
    }
    return { row, score };
  })
    .filter((x) => x.score >= MIN_FUZZY_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.row);
}

function cleanTargetPhrase(target: string): string {
  return normalizeQueryPhrase(
    target
      .replace(/^(一下|这个|那个|这项|这一项|该|此|的|把|将)+/u, "")
      .replace(/(设置|配置|功能|选项|开关|项|一下|啊|呢|吗|吧|呗)+$/u, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function parseConfigureIntent(query: string): ConfigureIntent | null {
  const q = query.trim();
  const patterns: Array<{ re: RegExp; action: "on" | "off"; targetIdx: number }> = [
    { re: /^(?:请|帮我|请帮我|麻烦|能不能|可以|我想|我要|我需要)?(?:把|将)\s*(.+?)\s*(?:给|)?(?:开启|打开|启用|激活|启动|开起来|开一下|开)$/u, action: "on", targetIdx: 1 },
    { re: /^(?:请|帮我|请帮我|麻烦|能不能|可以|我想|我要|我需要)?(?:把|将)\s*(.+?)\s*(?:给|)?(?:关闭|关掉|禁用|停用|停掉|关起来|关一下|关)$/u, action: "off", targetIdx: 1 },
    { re: /^(?:请|帮我|请帮我|麻烦)?(?:把|将)?(.+?)(?:设置|配置)?(?:为|成|改成|改为|设成|设定为)(开启|打开|启用|激活|启动|开起来|开一下|开)$/u, action: "on", targetIdx: 1 },
    { re: /^(?:请|帮我|请帮我|麻烦)?(?:把|将)?(.+?)(?:设置|配置)?(?:为|成|改成|改为|设成|设定为)(关闭|关掉|禁用|停用|停掉|关起来|关一下|关)$/u, action: "off", targetIdx: 1 },
    { re: /^(?:开启|打开|启用|激活|启动|开|开一下)\s*(.+)$/u, action: "on", targetIdx: 1 },
    { re: /^(?:关闭|关掉|禁用|停用|停掉|关|关一下|取消)\s*(.+)$/u, action: "off", targetIdx: 1 },
    { re: /^(?:别|不要|别再|不用)(?:开启|打开|启用|激活|启动)\s*(.+)$/u, action: "off", targetIdx: 1 },
    { re: /^(.+?)\s*(?:别|不要)(?:开启|打开|启用)$/u, action: "off", targetIdx: 1 },
    { re: /^(.+?)\s*(?:开启|打开|启用|激活|启动)$/u, action: "on", targetIdx: 1 },
    { re: /^(.+?)\s*(?:关闭|关掉|禁用|停用|停掉)$/u, action: "off", targetIdx: 1 },
    { re: /^(?:切换|toggle)\s*(.+?)\s*(?:为|成|到)?\s*(开|开启|打开|on)$/iu, action: "on", targetIdx: 1 },
    { re: /^(?:切换|toggle)\s*(.+?)\s*(?:为|成|到)?\s*(关|关闭|关掉|off)$/iu, action: "off", targetIdx: 1 },
    { re: /^(?:turn\s+on|enable|activate|open|switch\s+on)\s+(.+)$/i, action: "on", targetIdx: 1 },
    { re: /^(?:turn\s+off|disable|deactivate|close|switch\s+off)\s+(.+)$/i, action: "off", targetIdx: 1 },
    { re: /^(.+?)\s+(?:turn\s+on|enable|activate|open|switch\s+on)$/i, action: "on", targetIdx: 1 },
    { re: /^(.+?)\s+(?:turn\s+off|disable|deactivate|close|switch\s+off)$/i, action: "off", targetIdx: 1 },
  ];

  for (const { re, action, targetIdx } of patterns) {
    const m = q.match(re);
    if (!m) continue;
    const target = cleanTargetPhrase(m[targetIdx] ?? "");
    if (target.length >= 2) return { action, target };
  }
  return null;
}

function parseStatusIntent(query: string): string | null {
  if (!STATUS_INTENT_RE.test(query)) return null;
  const stripped = normalizeQueryPhrase(
    query
      .replace(STATUS_INTENT_RE, " ")
      .replace(SEARCH_NOISE_RE, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  const target = cleanTargetPhrase(stripped);
  return target.length >= 2 ? target : stripped.length >= 2 ? stripped : null;
}

function isSearchIntent(query: string): boolean {
  return SEARCH_INTENT_RE.test(query);
}

function shouldTrySettingsSearch(query: string): boolean {
  return isSearchIntent(query) || DOMAIN_KEYWORD_RE.test(query);
}

function extractSearchPhrase(query: string): string {
  const cleaned = normalizeQueryPhrase(
    query.replace(SEARCH_NOISE_RE, " ").replace(/\s+/g, " ").trim(),
  );
  return cleaned.length >= 1 ? cleaned : normalizeQueryPhrase(query.trim());
}

function formatSearchResults(
  query: string,
  results: IndexedSetting[],
  locale: "zh" | "en",
): AiAssistantReply {
  if (results.length === 0) {
    const text =
      locale === "en"
        ? `No matching settings found for "${query}". Try shorter keywords, synonyms (e.g. cash close), or a seq number.`
        : `未找到与「${query}」匹配的功能设置。可换更短关键词、同义词（如班结/日结、小票/打印、加收/服务费），或直接输入 seq 编号。`;
    return { text, html: escapeHtml(text) };
  }

  const head =
    locale === "en"
      ? `Found ${results.length} setting(s) related to your query:`
      : `找到 ${results.length} 条相关功能设置：`;
  const lines = results.map((row, i) => {
    const toggleHint =
      isModuleSettingToggleSeq(row.item.seq)
        ? locale === "en"
          ? " · toggle"
          : " · 可开关"
        : "";
    const state =
      isModuleSettingToggleSeq(row.item.seq)
        ? locale === "en"
          ? readModuleSettingToggleOn(row.item.seq)
            ? "On"
            : "Off"
          : readModuleSettingToggleOn(row.item.seq)
            ? "已开启"
            : "已关闭"
        : "";
    const stateSuffix = state ? `（${state}${toggleHint}）` : toggleHint;
    return `${i + 1}. ${row.hubTitle} · ${row.item.groupTitle} · ${settingLink(row.href, row.item.title)}${stateSuffix}`;
  });
  const tip =
    locale === "en"
      ? 'Try "enable …", "disable …", or "is … enabled?" for toggle settings.'
      : "可说「把 xxx 打开」改开关、「开班备款设为 500」改数值、「产线 Kiosk 开启 xxx」改产线、「勾选外带」改多选。";
  const html = `${escapeHtml(head)}<ul class="mt-2 list-disc space-y-1.5 pl-4">${lines.map((l) => `<li>${l}</li>`).join("")}</ul><p class="mt-2 text-xs text-muted-foreground">${escapeHtml(tip)}</p>`;
  const text = `${head}\n${results.map((r, i) => `${i + 1}. ${r.hubTitle} · ${r.item.title}`).join("\n")}`;
  return { text, html };
}

function formatStatusResult(
  indexed: IndexedSetting,
  locale: "zh" | "en",
): AiAssistantReply {
  const { item, hubTitle, href } = indexed;
  if (!isModuleSettingToggleSeq(item.seq)) {
    const subSummary = readSubOptionStatusSummary(item.seq);
    if (subSummary) {
      const text =
        locale === "en"
          ? `${hubTitle} · ${item.title}: checked options — ${subSummary}.`
          : `${hubTitle} ·「${item.title}」当前已勾选：${subSummary}。`;
      const html = `<p>${escapeHtml(text)}</p><p class="mt-2">${settingLink(href, locale === "en" ? "View in settings" : "在设置页查看")}</p>`;
      return { text, html };
    }
    const text =
      locale === "en"
        ? `"${item.title}" is not a simple toggle. Open the settings page for details.`
        : `「${item.title}」不是简单开关项，请在设置页查看详情。`;
    const html = `${escapeHtml(text)} ${settingLink(href, locale === "en" ? "Open settings" : "打开设置页")}`;
    return { text, html };
  }
  const on = readModuleSettingToggleOn(item.seq);
  const stateLabel = on
    ? locale === "en"
      ? "enabled (on)"
      : "已开启"
    : locale === "en"
      ? "disabled (off)"
      : "已关闭";
  const text =
    locale === "en"
      ? `${hubTitle} · ${item.title}: currently ${stateLabel}.`
      : `${hubTitle} · ${item.title}：当前${stateLabel}。`;
  const html = `<p>${escapeHtml(text)}</p><p class="mt-2">${settingLink(href, locale === "en" ? "View in settings" : "在设置页查看")}</p>`;
  return { text, html };
}

function applyToggleChange(
  indexed: IndexedSetting,
  on: boolean,
  locale: "zh" | "en",
): AiAssistantReply {
  const { item, hubTitle, href } = indexed;
  if (!isModuleSettingToggleSeq(item.seq)) {
    if (hasSubOptionsForSeq(item.seq)) {
      const guide = formatMultiOptionGuide(indexed, locale);
      return { text: guide.text, html: guide.html };
    }
    const text =
      locale === "en"
        ? `"${item.title}" is not a simple on/off toggle. Open the settings page to configure it.`
        : `「${item.title}」不是简单开关项，请在设置页手动配置。`;
    const html = `${escapeHtml(text)} ${settingLink(href, locale === "en" ? "Open settings" : "打开设置页")}`;
    return { text, html };
  }

  const prev = readModuleSettingToggleOn(item.seq);
  const stateLabel = on
    ? locale === "en"
      ? "enabled"
      : "已开启"
    : locale === "en"
      ? "disabled"
      : "已关闭";
  const text =
    locale === "en"
      ? `${hubTitle} · ${item.title}: ${prev === on ? "already " : ""}${stateLabel}.`
      : `${hubTitle} · ${item.title}：${prev === on ? "状态未变，仍为" : "已设为"}${stateLabel}。`;
  const html = `<p>${escapeHtml(text)}</p><p class="mt-2">${settingLink(href, locale === "en" ? "View in settings" : "在设置页查看")}</p>`;
  return { text, html, changedSeq: item.seq, changedOn: on };
}

/** 处理功能设置相关的检索与开关改配意图 */
export function processAiAssistantSettingsQuery(
  query: string,
  locale: "zh" | "en",
): AiAssistantReply | null {
  const q = query.trim();
  if (!q) return null;

  const statusTarget = parseStatusIntent(q);
  if (statusTarget) {
    const hits = searchSettings(statusTarget, 3);
    if (hits.length === 0) {
      const text =
        locale === "en"
          ? `Could not find a setting matching "${statusTarget}".`
          : `未找到与「${statusTarget}」匹配的功能设置。`;
      return { text, html: escapeHtml(text) };
    }
    return formatStatusResult(hits[0], locale);
  }

  const complex = processAiAssistantComplexSettingChange(q, locale);
  if (complex) return complex;

  const configure = parseConfigureIntent(q);
  if (configure && configure.target.length >= 2) {
    const subOptionResult = processSubOptionConfigureIntent(q, configure, locale);
    if (subOptionResult) return subOptionResult;
    const hits = searchSettings(configure.target, 3);
    if (hits.length === 0) {
      const text =
        locale === "en"
          ? `Could not find a setting matching "${configure.target}". Try a shorter or alternate phrase.`
          : `未找到与「${configure.target}」匹配的功能设置，可换更短或同义说法再试。`;
      return { text, html: escapeHtml(text) };
    }
    return applyToggleChange(hits[0], configure.action === "on", locale);
  }

  if (!shouldTrySettingsSearch(q)) return null;

  const searchPhrase = isSearchIntent(q) ? extractSearchPhrase(q) : q;
  const phrase = searchPhrase.length >= 1 ? searchPhrase : q;
  const results = searchSettings(phrase, 6);

  if (results.length === 0 && !isSearchIntent(q)) return null;
  return formatSearchResults(phrase || q, results, locale);
}
