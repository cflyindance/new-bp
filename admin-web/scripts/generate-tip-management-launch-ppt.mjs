/**
 * 小费管理新增能力产品发布会
 * 16:9 · 暗色 Keynote · 一页一观点 · 含演讲者备注
 */
import path from 'path';
import { fileURLToPath } from 'url';

const pptxModule = process.env.PPTXGENJS_MODULE ?? 'pptxgenjs';
const { default: pptxgen } = await import(pptxModule);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../docs/产品发布会/小费管理-新增能力产品发布会.pptx');

const C = {
  black: '000000', stage: '0B0B0F', card: '17171C', card2: '222229',
  white: 'FFFFFF', ice: 'F2F2F7', soft: 'B8B8BE', dim: '85858B',
  accent: 'FF6A00', accent2: 'FF9F0A', green: '34C759', red: 'FF453A',
  cyan: '64D2FF', violet: 'BF5AF2', line: '34343A',
};
const FONT = 'Microsoft YaHei';
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Product Team';
pres.company = 'MenuSifu';
pres.title = '小费管理新增能力产品发布会';
pres.subject = '小费分配规则四项线上能力发布';
pres.lang = 'zh-CN';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

const noLine = () => ({ color: C.stage, transparency: 100 });
const line = (color = C.line, width = 1) => ({ color, width });
const shadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.24 });

function base(bg = C.stage) {
  const s = pres.addSlide();
  s.background = { color: bg };
  s.addShape(pres.shapes.OVAL, { x: 8.6, y: -0.55, w: 1.7, h: 1.7, fill: { color: C.accent, transparency: 88 }, line: noLine() });
  return s;
}
function title(s, text, eyebrow = '') {
  if (eyebrow) s.addText(eyebrow.toUpperCase(), { x: 0.65, y: 0.28, w: 8.7, h: 0.24, fontFace: FONT, fontSize: 10, bold: true, color: C.accent, charSpacing: 2.5, margin: 0 });
  s.addText(text, { x: 0.65, y: eyebrow ? 0.78 : 0.55, w: 8.7, h: 0.62, fontFace: FONT, fontSize: 30, bold: true, color: C.white, margin: 0, breakLine: false, fit: 'shrink' });
}
function page(s, n) {
  s.addText(String(n).padStart(2, '0'), { x: 9.0, y: 5.12, w: 0.35, h: 0.18, fontFace: FONT, fontSize: 8, color: C.dim, align: 'right', margin: 0 });
}
function pill(s, text, x, y, w, color = C.accent, opts = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: opts.h ?? 0.42, rectRadius: 0.08, fill: { color, transparency: opts.transparency ?? 0 }, line: noLine() });
  s.addText(text, { x, y: y + 0.01, w, h: (opts.h ?? 0.42) - 0.02, fontFace: FONT, fontSize: opts.fontSize ?? 12, bold: opts.bold ?? true, color: opts.textColor ?? C.white, align: 'center', valign: 'middle', margin: 0.03, fit: 'shrink' });
}
function card(s, { x, y, w, h, kicker, heading, body, color = C.accent, big }) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.card }, line: { color: C.line, width: 1 }, shadow: shadow() });
  if (kicker) s.addText(kicker, { x: x + 0.24, y: y + 0.2, w: w - 0.48, h: 0.2, fontFace: FONT, fontSize: 9, bold: true, color, charSpacing: 1.5, margin: 0 });
  if (big) s.addText(big, { x: x + 0.24, y: y + 0.45, w: w - 0.48, h: 0.58, fontFace: FONT, fontSize: 30, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  if (heading) s.addText(heading, { x: x + 0.24, y: y + (big ? 1.13 : 0.52), w: w - 0.48, h: 0.45, fontFace: FONT, fontSize: 17, bold: true, color: C.white, margin: 0, fit: 'shrink' });
  if (body) s.addText(body, { x: x + 0.24, y: y + (big ? 1.62 : 1.05), w: w - 0.48, h: h - (big ? 1.82 : 1.25), fontFace: FONT, fontSize: 11.5, color: C.soft, margin: 0, breakLine: false, valign: 'top', fit: 'shrink' });
}
function hero(s, lines, opts = {}) {
  const runs = lines.map((item, i) => ({ text: item.text ?? item, options: { breakLine: i < lines.length - 1, bold: item.bold ?? true, color: item.color ?? C.white, fontSize: item.size ?? opts.size ?? 38 } }));
  s.addText(runs, { x: opts.x ?? 0.65, y: opts.y ?? 1.65, w: opts.w ?? 8.7, h: opts.h ?? 2.0, fontFace: FONT, align: opts.align ?? 'center', valign: 'middle', margin: 0, fit: 'shrink' });
}
function notes(s, seconds, transition, facts, boundary = '') {
  const text = [`【建议时长】${seconds} 秒`, `【开场/转场】${transition}`, `【必须讲清】${facts}`];
  if (boundary) text.push(`【不要误讲】${boundary}`);
  s.addNotes(text.join('\n'));
}
function arrow(s, x, y, w, color = C.accent) {
  s.addShape(pres.shapes.CHEVRON, { x, y, w, h: 0.34, fill: { color }, line: noLine() });
}

// 01 封面
{
  const s = base(C.black);
  s.addText('产品发布会', { x: 0.65, y: 1.35, w: 8.7, h: 0.3, fontFace: FONT, fontSize: 13, color: C.dim, align: 'center', charSpacing: 5, margin: 0 });
  hero(s, [{ text: '小费管理', size: 48 }, { text: '新增能力', size: 48, color: C.accent }], { y: 1.85, h: 1.45 });
  s.addText('TIP MANAGEMENT · RULE ENHANCEMENTS', { x: 0.65, y: 3.55, w: 8.7, h: 0.3, fontFace: FONT, fontSize: 11, color: C.soft, align: 'center', charSpacing: 2.2, margin: 0 });
  notes(s, 20, '停顿两秒后开场。', '今天发布的是小费分配规则的四项线上能力。');
}

// 02 记忆点
{
  const s = base();
  hero(s, [{ text: '每天都要改的规则，', size: 37, color: C.soft }, { text: '不应该每天都靠人改。', size: 42, color: C.white }], { y: 1.65, h: 1.7 });
  pill(s, '从人工补救，走向规则自动化', 3.05, 3.75, 3.9, C.accent, { h: 0.48, fontSize: 13 });
  page(s, 2);
  notes(s, 35, '先讲日常，而不是先讲功能。', '客户每天在小费分配明细里修工时、补服务费、重新核对销售额。');
}

// 03 四个现实
{
  const s = base(); title(s, '门店正在用人工，补系统规则的缺口', 'WHY NOW');
  const items = [
    ['01', '异常工时', '打卡 7h，却只认可 5h'],
    ['02', '服务费补录', '订单已收取，还要手工再录'],
    ['03', '销售额太粗', '不同支付方式无法拆分'],
    ['04', '订单混在一起', '含小费与不含小费无法区分'],
  ];
  items.forEach((it, i) => {
    const x = 0.65 + (i % 2) * 4.42, y = 1.55 + Math.floor(i / 2) * 1.63;
    card(s, { x, y, w: 4.0, h: 1.32, kicker: it[0], heading: it[1], body: it[2], color: i === 0 ? C.accent : [C.cyan, C.violet, C.green][i - 1] });
  });
  page(s, 3);
  notes(s, 45, '把四个问题快速扫一遍。', '它们共同指向同一个问题：门店真实规则无法自动落进系统。');
}

// 04 发布
{
  const s = base(C.black);
  s.addText('今天，我们正式上线', { x: 0.65, y: 1.25, w: 8.7, h: 0.35, fontFace: FONT, fontSize: 17, color: C.soft, align: 'center', margin: 0 });
  hero(s, [{ text: '4 项', size: 64, color: C.accent }, { text: '小费分配规则增强', size: 34 }], { y: 1.75, h: 1.65 });
  s.addText('规则更精准 · 数据更自动 · 分配更省心', { x: 0.65, y: 3.8, w: 8.7, h: 0.4, fontFace: FONT, fontSize: 17, color: C.ice, align: 'center', margin: 0 });
  page(s, 4);
  notes(s, 25, '这些不是四个孤立问题，而是门店规则无法自动落进系统。', '正式发布四项增强，核心结果是减少人工修改。');
}

// 05 总览
{
  const s = base(); title(s, '四项能力，一条自动化链路', 'WHAT IS NEW');
  const xs = [0.65, 2.95, 5.25, 7.55];
  const data = [
    ['01', '工时上限', '算得准', C.accent], ['02', '加收服务费', '进得来', C.cyan],
    ['03', '支付方式', '筛得细', C.violet], ['04', '小费状态', '选得对', C.green],
  ];
  data.forEach((d, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xs[i], y: 1.65, w: 1.8, h: 2.35, rectRadius: 0.08, fill: { color: C.card }, line: { color: d[3], width: 1.4 } });
    s.addText(d[0], { x: xs[i] + 0.18, y: 1.88, w: 1.44, h: 0.35, fontFace: FONT, fontSize: 18, bold: true, color: d[3], align: 'center', margin: 0 });
    s.addText(d[1], { x: xs[i] + 0.16, y: 2.48, w: 1.48, h: 0.5, fontFace: FONT, fontSize: 17, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
    s.addText(d[2], { x: xs[i] + 0.16, y: 3.32, w: 1.48, h: 0.3, fontFace: FONT, fontSize: 12, color: C.soft, align: 'center', margin: 0 });
    if (i < 3) arrow(s, xs[i] + 1.92, 2.67, 0.26, C.line);
  });
  page(s, 5);
  notes(s, 35, '先建立全局地图，再逐项展开。', '四项能力分别解决计算、数据来源、销售额筛选和订单筛选。');
}

// 06 工时上限
{
  const s = base(); title(s, '异常打卡，不再放大小费权重', '01 · 工时最大值');
  pill(s, '实际打卡', 0.75, 1.72, 1.35, C.card2, { textColor: C.soft });
  s.addText('7h', { x: 0.75, y: 2.25, w: 1.35, h: 0.7, fontFace: FONT, fontSize: 42, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText('vs', { x: 2.25, y: 2.43, w: 0.55, h: 0.3, fontFace: FONT, fontSize: 14, color: C.dim, align: 'center', margin: 0 });
  pill(s, '配置最大时长', 2.95, 1.72, 1.55, C.card2, { textColor: C.soft });
  s.addText('5h', { x: 2.95, y: 2.25, w: 1.55, h: 0.7, fontFace: FONT, fontSize: 42, bold: true, color: C.accent, align: 'center', margin: 0 });
  arrow(s, 4.8, 2.42, 0.55, C.accent);
  card(s, { x: 5.65, y: 1.55, w: 3.7, h: 2.5, kicker: 'SYSTEM RESULT', big: '5h', heading: '参与小费分配', body: '系统比较实际打卡时长与最大时长，取较小值。', color: C.green });
  s.addText('未启用最大时长规则时，仍按实际打卡时长计算。', { x: 0.75, y: 4.3, w: 8.6, h: 0.35, fontFace: FONT, fontSize: 12, color: C.soft, align: 'center', margin: 0 });
  page(s, 6);
  notes(s, 65, '从能力总览进入第一项。', '门店配置最大时长 5h；员工实际打卡 7h；启用最大时长规则后按 5h 分配。', '不要说成固定取排班时长，也不要说成简单的 5h/7h 二选一；系统逻辑是取实际值与配置上限的较小值。');
}

// 07 服务费
{
  const s = base(); title(s, '订单里已经收取的服务费，自动进入小费池', '02 · 加收服务费');
  card(s, { x: 0.65, y: 1.5, w: 2.5, h: 2.65, kicker: 'BEFORE', heading: '人工补录', body: '自定义金额\n逐日录入\n保存后再生成分配结果', color: C.red });
  arrow(s, 3.45, 2.58, 0.58, C.accent);
  card(s, { x: 4.32, y: 1.5, w: 2.5, h: 2.65, kicker: 'NOW', heading: '规则自动取值', body: '贡献规则新增\n“加收服务费”来源', color: C.cyan });
  arrow(s, 7.12, 2.58, 0.58, C.green);
  card(s, { x: 8.0, y: 1.5, w: 1.35, h: 2.65, kicker: 'VALUE', big: '少录', heading: '少漏', body: '少对账', color: C.green });
  const tags = ['角色', '员工', '订单区域', '订单类型', '营业时间段', '订单加收', '商品加收'];
  tags.forEach((t, i) => pill(s, t, 0.8 + i * 1.2, 4.4, 1.02, i > 4 ? C.accent : C.card2, { h: 0.4, fontSize: 10.5, textColor: i > 4 ? C.white : C.soft }));
  page(s, 7);
  notes(s, 65, '规则不仅要算得准，数据还要进得来。', '贡献规则新增加收服务费；支持角色、员工、订单区域、订单类型、营业时间段，以及订单加收和商品加收。', '不要承诺所有加收都默认计入；是否取值仍由规则条件决定。');
}

// 08 支付方式
{
  const s = base(); title(s, '销售额，可以只计算指定支付方式', '03 · 支付方式');
  const methods = [['现金', C.green], ['信用卡', C.accent], ['礼品卡', C.violet], ['会员卡', C.cyan], ['ALIPAY', C.accent2], ['WECHATPAY', C.green]];
  methods.forEach((m, i) => {
    const x = 0.65 + (i % 3) * 2.05, y = 1.55 + Math.floor(i / 3) * 0.72;
    pill(s, m[0], x, y, 1.78, m[1], { h: 0.48, fontSize: 12 });
  });
  card(s, { x: 7.0, y: 1.42, w: 2.35, h: 1.8, kicker: 'MULTI-SELECT', heading: '支持多选', body: '与其他销售额取值条件叠加过滤', color: C.violet });
  s.addText('可叠加条件', { x: 0.65, y: 3.45, w: 1.4, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: C.white, margin: 0 });
  const filters = ['角色', '员工', '订单区域', '订单类型', '订单小费状态', '支付方式', '营业时间'];
  filters.forEach((t, i) => pill(s, t, 1.95 + i * 1.06, 3.38, 0.92, C.card2, { h: 0.4, fontSize: 10, textColor: C.soft }));
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.65, y: 4.32, w: 8.7, h: 0.62, rectRadius: 0.06, fill: { color: C.card }, line: { color: C.line, width: 1 } });
  s.addText('当营业额类型选择“支付方式”时', { x: 0.9, y: 4.5, w: 3.4, h: 0.24, fontFace: FONT, fontSize: 11, color: C.soft, margin: 0 });
  s.addText('“菜单”条件不展示', { x: 6.35, y: 4.45, w: 2.6, h: 0.3, fontFace: FONT, fontSize: 14, bold: true, color: C.red, align: 'right', margin: 0 });
  page(s, 8);
  notes(s, 80, '数据自动进来之后，还要决定哪些销售额真正参与分配。', '支付方式为多选，支持六种方式；可与七类条件叠加；营业额类型为支付方式时不展示菜单条件。', '不要说支付方式只能单选，也不要漏讲菜单条件隐藏。');
}

// 09 小费状态规则
{
  const s = base(); title(s, '只让符合小费状态的订单进入销售额', '04 · 订单小费状态');
  pill(s, '单选', 0.65, 1.5, 0.82, C.accent, { h: 0.38, fontSize: 10 });
  card(s, { x: 0.65, y: 2.0, w: 2.75, h: 2.15, kicker: 'OPTION A', heading: '含小费', body: '信用卡小费、现金小费、其他小费\n任一金额 > $0', color: C.green });
  card(s, { x: 3.65, y: 2.0, w: 2.75, h: 2.15, kicker: 'OPTION B', heading: '不含小费', body: '上述三类订单小费金额均为 $0', color: C.soft });
  card(s, { x: 6.65, y: 2.0, w: 2.7, h: 2.15, kicker: 'RULE BOUNDARY', heading: '两个特殊口径', body: '配置为“记作小费”的加收服务费：计入\n手动上报小费：不计入', color: C.accent });
  s.addText('该条件可与其他销售额取值条件叠加过滤。', { x: 0.65, y: 4.55, w: 8.7, h: 0.3, fontFace: FONT, fontSize: 13, color: C.soft, align: 'center', margin: 0 });
  page(s, 9);
  notes(s, 85, '支付方式解决钱怎么收，订单小费状态解决哪些订单该算。', '含小费由三类订单小费任一金额大于零判定；配置为小费的加收服务费计入；手动上报不计。', '不要把信用卡小费、现金小费、其他小费误讲为订单支付方式。');
}

// 10 案例
{
  const s = base(); title(s, '同一批订单，三种清晰结果', '04 · 计算示例');
  card(s, { x: 0.65, y: 1.45, w: 2.3, h: 1.55, kicker: 'ORDER A', big: '$100', heading: '+ $10 小费', color: C.green });
  card(s, { x: 0.65, y: 3.25, w: 2.3, h: 1.55, kicker: 'ORDER B', big: '$50', heading: '无小费', color: C.soft });
  arrow(s, 3.25, 2.73, 0.5, C.line);
  const results = [
    ['选择“含小费”', '$100', C.green], ['选择“不含小费”', '$50', C.soft], ['不添加该条件', '$150', C.accent],
  ];
  results.forEach((r, i) => card(s, { x: 4.05, y: 1.22 + i * 1.25, w: 5.3, h: 1.0, kicker: r[0], big: r[1], color: r[2] }));
  page(s, 10);
  notes(s, 65, '用一组数字把规则讲透。', 'A 单销售额 $100、小费 $10；B 单销售额 $50、无小费。含小费取 $100，不含小费取 $50，不设置取 $150。', '销售额不包含小费金额本身，因此含小费订单结果是 $100，而不是 $110。');
}

// 11 整体价值
{
  const s = base(); title(s, '四项配置，最终只带来一个结果', 'CUSTOMER VALUE');
  hero(s, [{ text: '少改明细。', size: 34, color: C.soft }, { text: '少做重复核对。', size: 42 }, { text: '每次分配都更可信。', size: 38, color: C.accent }], { x: 0.7, y: 1.5, w: 5.2, h: 2.6, align: 'left' });
  const vals = [['准', '规则更准确', C.accent], ['自动', '数据自动进入', C.cyan], ['省', '减少人工操作', C.green], ['稳', '结果口径一致', C.violet]];
  vals.forEach((v, i) => card(s, { x: 6.25 + (i % 2) * 1.55, y: 1.5 + Math.floor(i / 2) * 1.55, w: 1.35, h: 1.3, kicker: v[0], heading: v[1], color: v[2] }));
  page(s, 11);
  notes(s, 45, '四项能力最终只带来一个结果：让门店少改明细、少做重复核对。', '价值不是多四个配置，而是把门店真实规则固化为可重复执行的系统规则。');
}

// 12 识别客户
{
  const s = base(); title(s, '听到这四句话，就是销售机会', 'WHO NEEDS IT');
  const quotes = [
    ['“员工经常忘记下班打卡。”', '推荐：工时最大值'],
    ['“服务费每天都要再录一遍。”', '推荐：加收服务费'],
    ['“我们只按信用卡销售额扣点。”', '推荐：支付方式'],
    ['“没给小费的订单不应该参与。”', '推荐：订单小费状态'],
  ];
  quotes.forEach((q, i) => {
    const y = 1.35 + i * 0.93;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.8, y, w: 8.4, h: 0.7, rectRadius: 0.06, fill: { color: i % 2 ? C.card2 : C.card }, line: { color: C.line, width: 1 } });
    s.addText(q[0], { x: 1.05, y: y + 0.16, w: 5.6, h: 0.3, fontFace: FONT, fontSize: 15, bold: true, color: C.white, margin: 0, fit: 'shrink' });
    s.addText(q[1], { x: 6.65, y: y + 0.17, w: 2.15, h: 0.28, fontFace: FONT, fontSize: 11, bold: true, color: C.accent, align: 'right', margin: 0, fit: 'shrink' });
  });
  page(s, 12);
  notes(s, 50, '把销售从功能记忆切换到客户信号。', '四类典型客户话语分别对应四项能力，销售可用这些问题做需求发现。');
}

// 13 销售话术
{
  const s = base(C.black); title(s, '30 秒，怎么介绍？', 'SALES PITCH');
  const pitchRows = [
    ['01 · 先说现状', '很多门店的小费规则，并不只是按总销售额或实际打卡时长简单分配。', C.soft],
    ['02 · 再说能力', '最大工时自动封顶，服务费自动入池，并按支付方式和订单小费状态精准筛选销售额。', C.white],
    ['03 · 最后说价值', '把每天改明细、补金额、重新核对的工作写进规则里，让分配更准确，也更省时间。', C.accent],
  ];
  pitchRows.forEach((row, i) => {
    const y = 1.42 + i * 1.12;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.75, y, w: 8.5, h: 0.88, rectRadius: 0.06, fill: { color: C.card }, line: { color: C.line, width: 1 } });
    s.addText(row[0], { x: 1.02, y: y + 0.15, w: 1.55, h: 0.24, fontFace: FONT, fontSize: 10, bold: true, color: i === 2 ? C.accent : C.dim, margin: 0 });
    s.addText(row[1], { x: 2.45, y: y + 0.13, w: 6.35, h: 0.46, fontFace: FONT, fontSize: 14, bold: i > 0, color: row[2], margin: 0, valign: 'middle', fit: 'shrink' });
  });
  page(s, 13);
  notes(s, 55, '这一页可以直接照读。', '先说客户规则复杂，再说四项能力，最后落到省人工与准确性。');
}

// 14 FAQ
{
  const s = base(); title(s, '客户追问时，守住这四个口径', 'QUICK Q&A');
  const qa = [
    ['最大时长是固定工时吗？', '不是。系统比较实际时长与配置上限，取较小值。'],
    ['支付方式只能选一种吗？', '不是。支持多选，并可与其他销售额条件叠加。'],
    ['服务费都算订单小费吗？', '只有配置为“记作小费”的加收服务费才计入。'],
    ['手动上报小费算含小费订单吗？', '不算。它只与员工有关，不属于订单。'],
  ];
  qa.forEach((q, i) => {
    const x = 0.65 + (i % 2) * 4.42, y = 1.42 + Math.floor(i / 2) * 1.68;
    card(s, { x, y, w: 4.0, h: 1.4, kicker: `Q${i + 1}`, heading: q[0], body: q[1], color: [C.accent, C.violet, C.cyan, C.green][i] });
  });
  page(s, 14);
  notes(s, 55, '销售介绍完后，用四个问答校准边界。', '逐条读问句，答案简短明确；重点强调最大时长取较小值、支付方式多选、服务费配置和手动上报边界。');
}

// 15 演示
{
  const s = base(); title(s, '现场演示：四步看见规则生效', 'LIVE DEMO · 3 MIN');
  const steps = [
    ['1', '工时', '7h → 上限 5h → 结果 5h'],
    ['2', '服务费', '选择来源 → 设置条件 → 自动入池'],
    ['3', '支付方式', '多选方式 → 叠加条件 → 查看销售额'],
    ['4', '小费状态', '$100 / $50 / $150 三种结果'],
  ];
  steps.forEach((st, i) => {
    const y = 1.42 + i * 0.91;
    s.addShape(pres.shapes.OVAL, { x: 0.85, y, w: 0.58, h: 0.58, fill: { color: i === 3 ? C.accent : C.card2 }, line: { color: i === 3 ? C.accent : C.line, width: 1 } });
    s.addText(st[0], { x: 0.85, y: y + 0.07, w: 0.58, h: 0.28, fontFace: FONT, fontSize: 14, bold: true, color: C.white, align: 'center', margin: 0 });
    s.addText(st[1], { x: 1.72, y: y + 0.02, w: 1.35, h: 0.3, fontFace: FONT, fontSize: 16, bold: true, color: C.white, margin: 0 });
    s.addText(st[2], { x: 3.15, y: y + 0.05, w: 3.55, h: 0.28, fontFace: FONT, fontSize: 13, color: C.soft, margin: 0, fit: 'shrink' });
    if (i < 3) s.addShape(pres.shapes.LINE, { x: 1.14, y: y + 0.58, w: 0, h: 0.33, line: { color: C.line, width: 2 } });
  });
  card(s, { x: 7.15, y: 1.48, w: 2.1, h: 3.15, kicker: 'DEMO GOAL', big: '3 min', heading: '看见结果变化', body: '少讲配置细节\n每一步都回到客户价值', color: C.accent });
  page(s, 15);
  notes(s, 180, '现在切到真实产品，用三分钟完成四步演示。', '依次展示最大时长、加收服务费、支付方式多选和订单小费状态案例；PPT 只作为步骤导航。');
}

// 16 总结
{
  const s = base(C.black);
  hero(s, [{ text: '规则更精准。', size: 39 }, { text: '数据更自动。', size: 39 }, { text: '分配更省心。', size: 45, color: C.accent }], { y: 1.3, h: 2.4 });
  s.addText('不用每天改明细，小费分配也能自动贴合门店真实规则。', { x: 1.0, y: 4.05, w: 8.0, h: 0.45, fontFace: FONT, fontSize: 16, color: C.soft, align: 'center', margin: 0, fit: 'shrink' });
  page(s, 16);
  notes(s, 60, '回到开场记忆点，放慢收束。', '请大家记住：不用每天改明细，小费分配也能自动贴合门店真实规则。');
}

await pres.writeFile({ fileName: outPath });
console.log(`Generated: ${outPath}`);
