/**
 * 薪资管理（Payroll）1.0 产品发布会
 * 风格：苹果 / 小米发布会 Keynote 叙事
 * 一页一观点 · 暗色舞台 · 大字口号 · 渐进揭示 · 中文界面
 */
import pptxgen from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../docs/项目文档/薪资管理-P0产品发布会.pptx');
const outPathAlt = path.join(__dirname, '../docs/项目文档/薪资管理-Payroll1.0产品发布会-更新.pptx');

const C = {
  black: '000000',
  stage: '0B0B0F',
  card: '16161A',
  white: 'FFFFFF',
  soft: 'A1A1A6',
  dim: '6E6E73',
  accent: 'FF6A00',
  ice: 'E8E8ED',
};

const FONT = 'Microsoft YaHei';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Product Team';
pres.title = '薪资管理（Payroll）1.0 产品发布会';
pres.subject = 'Keynote 风格内部产品发布会';

function stage() {
  const s = pres.addSlide();
  s.background = { color: C.stage };
  return s;
}

function pureBlack() {
  const s = pres.addSlide();
  s.background = { color: C.black };
  return s;
}

function centerHero(slide, lines, opts = {}) {
  const fontSize = opts.fontSize ?? 40;
  const color = opts.color ?? C.white;
  const y = opts.y ?? 2.0;
  const texts = lines.map((t, i) => ({
    text: t,
    options: {
      breakLine: i < lines.length - 1,
      fontSize: Array.isArray(opts.sizes) ? opts.sizes[i] : fontSize,
      bold: opts.bold !== false,
      color: Array.isArray(opts.colors) ? opts.colors[i] : color,
      fontFace: FONT,
      align: 'center',
    },
  }));
  slide.addText(texts, {
    x: 0.5,
    y,
    w: 9.0,
    h: opts.h ?? 1.8,
    valign: 'middle',
    margin: 0,
  });
}

function eyebrow(slide, text, y = 1.4) {
  slide.addText(text, {
    x: 0.5,
    y,
    w: 9.0,
    h: 0.35,
    fontSize: 14,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
}

function footerHint(slide, text) {
  slide.addText(text, {
    x: 0.5,
    y: 5.15,
    w: 9.0,
    h: 0.3,
    fontSize: 11,
    color: C.dim,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
}

// 1. 开场
{
  const s = pureBlack();
  s.addText('产品发布会', {
    x: 0.5,
    y: 2.4,
    w: 9.0,
    h: 0.4,
    fontSize: 14,
    color: C.dim,
    fontFace: FONT,
    align: 'center',
    charSpacing: 6,
    margin: 0,
  });
  s.addText('薪资管理（Payroll）', {
    x: 0.5,
    y: 2.85,
    w: 9.0,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes(
    '停顿两秒。「各位同事，今天我们正式发布公司全新增值服务——薪资管理，Payroll 1.0。」'
  );
}

// 2. 钩子
{
  const s = stage();
  centerHero(s, ['每两周一次。', '一年，二十六次。'], {
    fontSize: 42,
    y: 1.9,
    h: 1.6,
  });
  footerHint(s, '发薪周期 · 双周薪酬节奏');
  s.addNotes('用节奏感开场，让现场感到封账压力的重复。');
}

// 3. 痛点
{
  const s = stage();
  eyebrow(s, '现实如此');
  centerHero(s, ['考勤。小费。表格。报税。', '同一个数字，抄了四遍。'], {
    sizes: [28, 36],
    colors: [C.soft, C.white],
    y: 2.0,
    h: 1.8,
  });
  s.addNotes(
    '「专员在多处抄同一数字，再贴进报税文件。错一次，整周白干。」'
  );
}

// 4. 更痛
{
  const s = stage();
  centerHero(s, ['算完，还没完。', '员工要签字。', '门店要留档。', '会计师要文件。'], {
    sizes: [32, 32, 32, 32],
    y: 1.5,
    h: 2.8,
  });
  s.addNotes(
    '第二层痛：「算完还没完。」员工要签字，门店要留档，会计师还要文件。三套交付，缺一套真相——这正是薪资管理 1.0 要解决的。'
  );
}

// 5. 假如
{
  const s = stage();
  eyebrow(s, '假如');
  centerHero(
    s,
    ['如果，考勤自动算？', '如果，小费自动进来？', '如果，加班自动算？', '如果，导出就能用？'],
    {
      sizes: [26, 26, 26, 26],
      colors: [C.ice, C.ice, C.ice, C.accent],
      y: 1.45,
      h: 3.0,
    }
  );
  s.addNotes(
    '四连假如，语气上扬：「考勤自动算？小费自动进来？加班自动算？导出就能用？」引出发布。注意：现阶段不讲对接 ADP，末句是「导出就能用」。'
  );
}

// 6. 正式发布
{
  const s = pureBlack();
  s.addText('今天，我们正式发布', {
    x: 0.5,
    y: 1.55,
    w: 9.0,
    h: 0.4,
    fontSize: 18,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('薪资管理', {
    x: 0.5,
    y: 2.1,
    w: 9.0,
    h: 0.8,
    fontSize: 54,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('Payroll  ·  1.0', {
    x: 0.5,
    y: 3.0,
    w: 9.0,
    h: 0.4,
    fontSize: 22,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('全场最重要一页。放慢：「薪资管理。Payroll 1.0。」');
}

// 7. 全新增值服务（补充场景）
{
  const s = stage();
  eyebrow(s, '产品定位');
  centerHero(s, ['全新增值服务。', '不是标配，是可售能力。'], {
    sizes: [36, 24],
    colors: [C.white, C.soft],
    y: 1.7,
    h: 1.7,
  });
  s.addText('公司级新产品线  ·  可单独对外销售与开通', {
    x: 1.0,
    y: 3.7,
    w: 8.0,
    h: 0.45,
    fontSize: 15,
    color: C.ice,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes(
    '补充场景必讲：「薪资管理是公司全新的增值服务。」不是现有模块小改，而是可单独售卖、开通的新产品。销售按增值服务话术推进。'
  );
}

// 8. Slogan
{
  const s = stage();
  centerHero(s, ['核对一次。', '签字有据。', '报税即用。'], {
    sizes: [40, 40, 40],
    colors: [C.white, C.white, C.accent],
    y: 1.6,
    h: 2.5,
  });
  s.addNotes('Slogan 三连，每句停半拍。');
}

// 9. 它是什么
{
  const s = stage();
  eyebrow(s, '它是什么');
  centerHero(s, ['不是发薪平台。', '是餐饮薪酬的准备层。'], {
    sizes: [28, 34],
    colors: [C.soft, C.white],
    y: 1.9,
    h: 1.8,
  });
  footerHint(s, '毛薪准备 · 格式导出 · 现阶段不对接 ADP 系统');
  s.addNotes(
    '「不是发薪平台，是准备层。」核对干净后导出报税文件；现阶段不对接 ADP 系统，由专员/会计师人工导入。'
  );
}

// 10. 边界
{
  const s = stage();
  eyebrow(s, '边界');
  const items = [
    { t: '不发薪', d: '不做代发工资', accent: false },
    { t: '不代报税', d: '申报仍在外部完成', accent: false },
    { t: '不对接 ADP', d: '现阶段无系统对接', accent: true },
  ];
  items.forEach((it, i) => {
    const x = 0.7 + i * 3.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.9,
      w: 2.85,
      h: 2.2,
      fill: { color: C.card },
      rectRadius: 0.12,
      line: { color: it.accent ? C.accent : C.card, width: it.accent ? 1.5 : 0 },
    });
    s.addText(it.t, {
      x: x + 0.15,
      y: 2.4,
      w: 2.55,
      h: 0.55,
      fontSize: 20,
      bold: true,
      color: it.accent ? C.accent : C.white,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.15,
      y: 3.15,
      w: 2.55,
      h: 0.5,
      fontSize: 13,
      color: C.soft,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
  });
  s.addNotes(
    '三不原则：「不发薪。不代报税。现阶段不对接 ADP。」交付是模板对齐的导出文件，人工导入。禁止说已打通 ADP。'
  );
}

// 11. 章节
{
  const s = pureBlack();
  s.addText('三个核心能力', {
    x: 0.5,
    y: 2.4,
    w: 9.0,
    h: 0.7,
    fontSize: 36,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('壹  ·  贰  ·  叁', {
    x: 0.5,
    y: 3.2,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('短停。「接下来，三个核心能力。」');
}

// 12. 能力一
{
  const s = stage();
  s.addText('壹', {
    x: 0.5,
    y: 1.3,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  centerHero(s, ['一处改数。', '处处一致。'], {
    fontSize: 44,
    y: 1.9,
    h: 1.6,
  });
  s.addText('薪资管理为唯一事实来源\n员工明细与导出文件，同源投影', {
    x: 1.5,
    y: 3.7,
    w: 7.0,
    h: 0.8,
    fontSize: 15,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('能力一：改一次，明细与导出一起变。');
}

// 13. 能力二
{
  const s = stage();
  s.addText('贰', {
    x: 0.5,
    y: 1.3,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  centerHero(s, ['给员工的一页纸。', '签得了，留得住。'], {
    fontSize: 36,
    y: 1.9,
    h: 1.6,
  });
  s.addText('员工薪资明细\n打印友好 · 签字声明 · 与最终值一致', {
    x: 1.5,
    y: 3.7,
    w: 7.0,
    h: 0.8,
    fontSize: 15,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('很多商户缺的是能签、能对齐的一页纸。');
}

// 14. 能力三：导出（非对接）
{
  const s = stage();
  s.addText('叁', {
    x: 0.5,
    y: 1.3,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  centerHero(s, ['报税格式，导出即用。', '系统对接？现阶段没有。'], {
    sizes: [34, 24],
    colors: [C.white, C.accent],
    y: 1.8,
    h: 1.7,
  });
  s.addText('模板对齐的文件导出  ·  专员 / 会计师人工导入', {
    x: 1.2,
    y: 3.7,
    w: 7.6,
    h: 0.45,
    fontSize: 15,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes(
    '能力三：「导出即用，但现阶段不对接 ADP。」价值是少拼表格；导入仍是人工一步。'
  );
}

// 15. 还有更多 · TipOut
{
  const s = stage();
  eyebrow(s, '还有更多');
  centerHero(s, ['小费，自动进来。', '来自自有小费分配。'], {
    sizes: [38, 26],
    colors: [C.white, C.accent],
    y: 1.8,
    h: 1.7,
  });
  s.addText('从自有 TipOut 自动获取  ·  少一次手工抄录', {
    x: 1.2,
    y: 3.7,
    w: 7.6,
    h: 0.45,
    fontSize: 15,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes(
    '「小费自动进来——来自自有 TipOut。」建议先完成小费分配，再进本期薪资管理。'
  );
}

// 16. 加班自动
{
  const s = stage();
  centerHero(s, ['加班，自动算。', '正常工时 / 加班 / 双倍，系统拆分。'], {
    sizes: [40, 22],
    colors: [C.white, C.soft],
    y: 1.8,
    h: 1.8,
  });
  s.addText('基于考勤与规则自动汇总  ·  专员可复核确认', {
    x: 1.2,
    y: 3.8,
    w: 7.6,
    h: 0.45,
    fontSize: 15,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('「加班，自动算。」专员复核即可。');
}

// 17. 架构
{
  const s = stage();
  eyebrow(s, '如何运转');
  s.addText('一条链。自动衔接。', {
    x: 0.5,
    y: 1.0,
    w: 9.0,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });

  const steps = [
    { n: '①', t: '小费分配', s: '小费自动带入' },
    { n: '②', t: '薪资管理', s: '加班自动 · 核对确认' },
    { n: '③', t: '格式导出', s: '人工导入报税侧' },
  ];
  steps.forEach((st, i) => {
    const x = 1.0 + i * 3.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.0,
      w: 2.5,
      h: 2.0,
      fill: { color: C.card },
      rectRadius: 0.1,
      line: { color: C.card, width: 0 },
    });
    s.addText(st.n, {
      x,
      y: 2.2,
      w: 2.5,
      h: 0.4,
      fontSize: 18,
      color: C.accent,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    s.addText(st.t, {
      x,
      y: 2.7,
      w: 2.5,
      h: 0.45,
      fontSize: 20,
      bold: true,
      color: C.white,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    s.addText(st.s, {
      x,
      y: 3.3,
      w: 2.5,
      h: 0.4,
      fontSize: 13,
      color: C.soft,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    if (i < 2) {
      s.addText('→', {
        x: x + 2.45,
        y: 2.7,
        w: 0.55,
        h: 0.45,
        fontSize: 22,
        color: C.dim,
        fontFace: FONT,
        align: 'center',
        margin: 0,
      });
    }
  });
  s.addNotes(
    '「小费分配自动带入 → 薪资管理加班自动并核对 → 格式导出，人工导入报税侧。现阶段不对接 ADP。」'
  );
}

// 18. 工作台
{
  const s = stage();
  eyebrow(s, '工作台');
  centerHero(s, ['薪资管理工作区', '薪酬专员的主战场'], {
    sizes: [36, 22],
    colors: [C.white, C.soft],
    y: 1.7,
    h: 1.5,
  });
  s.addText('考勤自动拆加班  ·  小费自动带入  ·  专员复核确认', {
    x: 0.8,
    y: 3.6,
    w: 8.4,
    h: 0.45,
    fontSize: 15,
    color: C.ice,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('演示：小费自动 → 加班自动 → 确认 → 导出。');
}

// 19. 五个场景
{
  const s = stage();
  eyebrow(s, '业务场景');
  s.addText('五个真实场景', {
    x: 0.5,
    y: 0.95,
    w: 9.0,
    h: 0.4,
    fontSize: 24,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  const scenes = [
    ['甲', '增值售卖', '全新增值服务 · 可单独开通'],
    ['乙', '每期例行', '选期 → 自动带入 → 复核确认'],
    ['丙', '员工签字', '打印明细 → 签字存档'],
    ['丁', '文件交接', '导出文件 → 人工导入报税侧'],
    ['戊', '边界清醒', '现阶段不对接 ADP 系统'],
  ];
  scenes.forEach((sc, i) => {
    const y = 1.45 + i * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.2,
      y,
      w: 7.6,
      h: 0.62,
      fill: { color: C.card },
      rectRadius: 0.08,
      line: { color: C.card, width: 0 },
    });
    s.addText(sc[0], {
      x: 1.4,
      y: y + 0.12,
      w: 0.55,
      h: 0.38,
      fontSize: 16,
      bold: true,
      color: C.accent,
      fontFace: FONT,
      margin: 0,
    });
    s.addText(sc[1], {
      x: 2.05,
      y: y + 0.08,
      w: 2.0,
      h: 0.45,
      fontSize: 15,
      bold: true,
      color: C.white,
      fontFace: FONT,
      valign: 'middle',
      margin: 0,
    });
    s.addText(sc[2], {
      x: 4.2,
      y: y + 0.08,
      w: 4.3,
      h: 0.45,
      fontSize: 13,
      color: C.soft,
      fontFace: FONT,
      valign: 'middle',
      margin: 0,
    });
  });
  s.addNotes(
    '五个场景。甲必讲：全新增值服务。戊必讲：现阶段不对接 ADP。'
  );
}

// 20. 谁最需要（六句版）
{
  const s = stage();
  eyebrow(s, '谁最需要');
  centerHero(
    s,
    [
      '需要报税文件。',
      '已有小费分配。',
      '还在用表格拼数。',
      '员工要签字，门店要留档。',
      '双周发薪，每期都要对。',
      '已用我们小费分配。',
    ],
    {
      sizes: [24, 24, 24, 24, 24, 24],
      y: 1.45,
      h: 3.0,
    }
  );
  s.addNotes(
    '六句画像：报税文件、小费分配、表格拼数、签字留档、双周核对、已用 TipOut。口播：「已经用了我们小费分配的，更是天然适合加购 Payroll 1.0。」'
  );
}

// 21. 对内章节
{
  const s = pureBlack();
  s.addText('会后，各部门怎么落地', {
    x: 0.5,
    y: 2.2,
    w: 9.0,
    h: 0.7,
    fontSize: 32,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('每人记住自己的三件事', {
    x: 0.5,
    y: 3.05,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes(
    '转向内部：「产品讲完了，各部门会后怎么落地？下一页每人三件事，看懂就能执行。」'
  );
}

// 22. 部门行动（白话版）
{
  const s = stage();
  eyebrow(s, '各部门行动');
  s.addText('会后 48 小时内完成', {
    x: 0.5,
    y: 0.95,
    w: 9.0,
    h: 0.35,
    fontSize: 14,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });

  const teams = [
    {
      name: '销售',
      job: '怎么卖',
      items: ['当增值服务卖，单独报价开通', '演示：小费自动→加班自动→导出', '对外说清：现在不对接 ADP'],
    },
    {
      name: '运营',
      job: '怎么开',
      items: ['整理开通清单与权限模板', '核对系统自动生成的发薪周期', '组织 20 分钟上手培训'],
    },
    {
      name: '市场',
      job: '怎么讲',
      items: ['按「全新增值服务」做素材', '统一 Slogan，不写对接 ADP', '准备一页对外简介'],
    },
    {
      name: '售后',
      job: '怎么答',
      items: ['更新常见问题答法', '工单按权限/导出/规则分类', '守住：不发薪、不代报税'],
    },
  ];

  teams.forEach((tm, i) => {
    const x = 0.4 + i * 2.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 1.4,
      w: 2.28,
      h: 3.55,
      fill: { color: C.card },
      rectRadius: 0.1,
      line: { color: C.card, width: 0 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 1.4,
      w: 2.28,
      h: 0.08,
      fill: { color: C.accent },
      line: { color: C.accent, width: 0 },
    });
    s.addText(tm.name, {
      x: x + 0.1,
      y: 1.6,
      w: 2.08,
      h: 0.38,
      fontSize: 18,
      bold: true,
      color: C.white,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    s.addText(tm.job, {
      x: x + 0.1,
      y: 1.98,
      w: 2.08,
      h: 0.3,
      fontSize: 12,
      color: C.accent,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    tm.items.forEach((line, li) => {
      s.addText(`${li + 1}. ${line}`, {
        x: x + 0.14,
        y: 2.45 + li * 0.7,
        w: 2.0,
        h: 0.65,
        fontSize: 11,
        color: C.ice,
        fontFace: FONT,
        align: 'left',
        valign: 'top',
        margin: 0,
      });
    });
  });
  s.addNotes(
    '白话点名：销售负责怎么卖，运营负责怎么开，市场负责怎么讲，售后负责怎么答。每人三件事，会后 48 小时内落地。'
  );
}

// 23. 话术（提炼版）
{
  const s = stage();
  eyebrow(s, '对外话术');
  s.addText('三十秒，这样说', {
    x: 0.5,
    y: 0.95,
    w: 9.0,
    h: 0.4,
    fontSize: 26,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });

  const pitch = [
    { tag: '是什么', text: '公司全新增值服务——薪资管理 Payroll 1.0' },
    { tag: '能做什么', text: '小费自动带入 · 加班自动算 · 签字明细 · 报税文件导出' },
    { tag: '怎么用', text: '专员复核确认 → 导出文件 → 人工导入报税侧' },
    { tag: '边界', text: '现阶段不对接 ADP · 不发薪 · 不代报税' },
  ];

  pitch.forEach((p, i) => {
    const y = 1.5 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.85,
      y,
      w: 8.3,
      h: 0.72,
      fill: { color: C.card },
      rectRadius: 0.08,
      line: { color: C.card, width: 0 },
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.05,
      y: y + 0.16,
      w: 1.35,
      h: 0.4,
      fill: { color: C.accent },
      rectRadius: 0.06,
      line: { color: C.accent, width: 0 },
    });
    s.addText(p.tag, {
      x: 1.05,
      y: y + 0.16,
      w: 1.35,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: C.white,
      fontFace: FONT,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
    s.addText(p.text, {
      x: 2.55,
      y: y + 0.12,
      w: 6.3,
      h: 0.48,
      fontSize: 15,
      color: C.ice,
      fontFace: FONT,
      valign: 'middle',
      margin: 0,
    });
  });
  s.addNotes(
    '话术拆成四句跟读：是什么 → 能做什么 → 怎么用 → 边界。比长段落更好记、更好对外复述。'
  );
}

// 24. FAQ
{
  const s = stage();
  eyebrow(s, '快问快答');
  const qa = [
    ['这是什么产品？', '公司全新增值服务 · Payroll 1.0'],
    ['会对接 ADP 吗？', '现阶段不支持系统对接，支持格式导出'],
    ['小费自动过来吗？', '会。从自有小费分配（TipOut）自动获取'],
    ['加班自动算吗？', '会。系统自动拆分正常工时与加班'],
  ];
  qa.forEach((q, i) => {
    const y = 1.35 + i * 0.9;
    s.addText(q[0], {
      x: 1.0,
      y,
      w: 8.0,
      h: 0.35,
      fontSize: 14,
      color: C.accent,
      fontFace: FONT,
      margin: 0,
    });
    s.addText(q[1], {
      x: 1.0,
      y: y + 0.32,
      w: 8.0,
      h: 0.4,
      fontSize: 17,
      bold: true,
      color: C.white,
      fontFace: FONT,
      margin: 0,
    });
  });
  s.addNotes('四问四答。增值服务与不对接 ADP 要答得干净。');
}

// 25. 收束
{
  const s = stage();
  centerHero(s, ['核对一次。', '签字有据。', '报税即用。'], {
    sizes: [36, 36, 36],
    colors: [C.white, C.white, C.accent],
    y: 1.5,
    h: 2.3,
  });
  s.addText('全新增值服务  ·  小费自动  ·  加班自动  ·  现阶段不对接 ADP', {
    x: 0.5,
    y: 4.1,
    w: 9.0,
    h: 0.35,
    fontSize: 12,
    color: C.dim,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('Slogan 再现 + 能力与边界脚注。');
}

// 26. 谢谢
{
  const s = pureBlack();
  s.addText('谢谢。', {
    x: 0.5,
    y: 2.0,
    w: 9.0,
    h: 0.8,
    fontSize: 52,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('薪资管理（Payroll）1.0  ·  已就绪', {
    x: 0.5,
    y: 2.95,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    color: C.soft,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addText('问答', {
    x: 0.5,
    y: 3.7,
    w: 9.0,
    h: 0.4,
    fontSize: 18,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });
  s.addNotes('「谢谢。Payroll 1.0 已就绪。现在开放提问。」');
}

try {
  await pres.writeFile({ fileName: outPath });
  console.log('Generated:', outPath);
} catch (e) {
  if (e && e.code === 'EBUSY') {
    await pres.writeFile({ fileName: outPathAlt });
    console.log('Original locked; generated:', outPathAlt);
  } else {
    throw e;
  }
}
