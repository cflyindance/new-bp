/**
 * 按《发布会模板》对现有薪资管理发布会 PPT 做增量补充：
 * - 不重写既有页
 * - 仅插入模板缺口页，并同步更新宣讲文稿 MD
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pptPath = path.join(root, 'docs/产品发布会/薪资管理-P0产品发布会.pptx');
const mdPath = path.join(root, 'docs/产品发布会/薪资管理-P0产品发布会宣讲文稿.md');
const tmp = path.join(root, '.tmp-launch-tpl-patch');
const addPpt = path.join(tmp, 'add-slides.pptx');

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

function stage(pres) {
  const s = pres.addSlide();
  s.background = { color: C.stage };
  return s;
}
function pureBlack(pres) {
  const s = pres.addSlide();
  s.background = { color: C.black };
  return s;
}
function eyebrow(slide, text, y = 1.2) {
  slide.addText(text, {
    x: 0.5, y, w: 9, h: 0.35,
    fontSize: 14, color: C.accent, fontFace: FONT,
    align: 'center', bold: true, charSpacing: 4, margin: 0,
  });
}
function centerHero(slide, lines, opts = {}) {
  const texts = lines.map((t, i) => ({
    text: t,
    options: {
      breakLine: i < lines.length - 1,
      fontSize: Array.isArray(opts.sizes) ? opts.sizes[i] : (opts.fontSize ?? 34),
      bold: true,
      color: Array.isArray(opts.colors) ? opts.colors[i] : C.white,
      fontFace: FONT,
      align: 'center',
    },
  }));
  slide.addText(texts, {
    x: 0.5, y: opts.y ?? 1.9, w: 9, h: opts.h ?? 2.2,
    valign: 'middle', margin: 0,
  });
}

/** 生成仅含补充页的临时 PPT（顺序即插入顺序分组标签） */
async function buildAddSlides() {
  fs.mkdirSync(tmp, { recursive: true });
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.title = '薪资管理发布会-模板补页';

  // A1 今天只记住一件事
  {
    const s = pureBlack(pres);
    s.addText('今天只记住一件事', {
      x: 0.5, y: 1.8, w: 9, h: 0.5,
      fontSize: 18, color: C.soft, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addText('少抄表、少出错、报税文件一次出齐。', {
      x: 0.6, y: 2.5, w: 8.8, h: 1.0,
      fontSize: 28, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addText('核对一次 · 签字有据 · 报税即用', {
      x: 0.5, y: 3.7, w: 9, h: 0.4,
      fontSize: 16, color: C.accent, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addNotes('模板目标页：发布会不是培训，是让卖点深入人心。开场先立记忆点。');
  }

  // A2 20分钟议程
  {
    const s = stage(pres);
    eyebrow(s, '今天怎么讲');
    s.addText('二十分钟，四段话', {
      x: 0.5, y: 1.55, w: 9, h: 0.45,
      fontSize: 26, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    const agenda = [
      ['① 为什么做', '2–3 分钟', '客户痛点与真实场景'],
      ['② 讲亮点', '约 10 分钟', '2–3 个核心卖点，讲价值'],
      ['③ 看效果', '约 5 分钟', '现场演示，少讲多看'],
      ['④ 怎么卖', '2–3 分钟', '卖给谁、为什么买、一句话'],
    ];
    agenda.forEach((row, i) => {
      const y = 2.15 + i * 0.7;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 1.1, y, w: 7.8, h: 0.58,
        fill: { color: C.card }, rectRadius: 0.08, line: { color: C.card, width: 0 },
      });
      s.addText(row[0], {
        x: 1.3, y: y + 0.1, w: 2.4, h: 0.38,
        fontSize: 15, bold: true, color: C.accent, fontFace: FONT, valign: 'middle', margin: 0,
      });
      s.addText(row[1], {
        x: 3.7, y: y + 0.1, w: 1.6, h: 0.38,
        fontSize: 13, color: C.soft, fontFace: FONT, valign: 'middle', margin: 0,
      });
      s.addText(row[2], {
        x: 5.4, y: y + 0.1, w: 3.2, h: 0.38,
        fontSize: 13, color: C.ice, fontFace: FONT, valign: 'middle', margin: 0,
      });
    });
    s.addNotes('对齐发布会模板四段结构，提醒听众：少功能列表，多价值与故事。');
  }

  // B1 讲亮点章节
  {
    const s = pureBlack(pres);
    s.addText('② 讲亮点', {
      x: 0.5, y: 2.1, w: 9, h: 0.5,
      fontSize: 18, color: C.accent, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addText('只讲三个，值得卖的。', {
      x: 0.5, y: 2.7, w: 9, h: 0.7,
      fontSize: 32, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addNotes('模板：重点讲 2–3 个核心卖点。业务场景 → 产品能力 → 带来的价值。');
  }

  // B2-B4 三个卖点
  const selling = [
    {
      n: '卖点一',
      scene: '场景：每期还在表格里抄考勤、小费、加班',
      ability: '能力：考勤/加班自动算 · 小费从 TipOut 自动带入 · 一处改数处处一致',
      value: '价值：少抄表、少出错，每期省下反复对账的时间',
      notes: '用销售语言：帮客户省时间、少出错，不是讲字段。',
    },
    {
      n: '卖点二',
      scene: '场景：员工要签字，门店要留档，数字却对不上',
      ability: '能力：一键生成可打印的员工薪资明细与签字声明',
      value: '价值：签得了、留得住，争议时可追溯，降低纠纷成本',
      notes: '合规与信任卖点：门店终于有一张和系统一致的签字纸。',
    },
    {
      n: '卖点三',
      scene: '场景：会计师催报税文件，专员还在 Excel 拼列',
      ability: '能力：导出与报税模板对齐的文件（现阶段人工导入）',
      value: '价值：核对完就能交文件，少返工、少贴列',
      notes: '边界仍要带一句：不对接 ADP，是格式导出 + 人工导入。',
    },
  ];
  for (const sp of selling) {
    const s = stage(pres);
    eyebrow(s, sp.n);
    const blocks = [
      ['业务场景', sp.scene],
      ['产品能力', sp.ability],
      ['带来的价值', sp.value],
    ];
    blocks.forEach((b, i) => {
      const y = 1.65 + i * 1.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.9, y, w: 8.2, h: 0.9,
        fill: { color: C.card }, rectRadius: 0.1, line: { color: C.card, width: 0 },
      });
      s.addText(b[0], {
        x: 1.1, y: y + 0.12, w: 7.8, h: 0.28,
        fontSize: 12, color: C.accent, fontFace: FONT, margin: 0,
      });
      s.addText(b[1], {
        x: 1.1, y: y + 0.4, w: 7.8, h: 0.4,
        fontSize: 15, bold: true, color: C.white, fontFace: FONT, margin: 0,
      });
    });
    s.addNotes(sp.notes);
  }

  // C1 看效果章节
  {
    const s = pureBlack(pres);
    s.addText('③ 看效果', {
      x: 0.5, y: 2.1, w: 9, h: 0.5,
      fontSize: 18, color: C.accent, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addText('少讲 PPT，多看真实效果。', {
      x: 0.5, y: 2.7, w: 9, h: 0.7,
      fontSize: 30, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addNotes('模板要求：优先产品演示。本页后进入 Live Demo。');
  }

  // C2 演示五步
  {
    const s = stage(pres);
    eyebrow(s, '现场演示');
    s.addText('五步，看客户最终获得什么', {
      x: 0.5, y: 1.55, w: 9, h: 0.4,
      fontSize: 22, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    const steps = [
      '1. 完成小费分配（TipOut）',
      '2. 进入薪资管理，看小费自动带入',
      '3. 改打卡，看加班自动重算',
      '4. 打印员工签字明细',
      '5. 导出报税文件（说明：人工导入，不对接 ADP）',
    ];
    steps.forEach((t, i) => {
      const y = 2.15 + i * 0.55;
      s.addText(t, {
        x: 1.4, y, w: 7.2, h: 0.45,
        fontSize: 16, color: C.ice, fontFace: FONT, margin: 0,
      });
    });
    s.addNotes('演示时停 PPT，切系统。强调客户最终拿到：自动数字 + 签字纸 + 可交会计师的文件。');
  }

  // C3 客户最终获得
  {
    const s = stage(pres);
    eyebrow(s, '客户最终获得');
    const gains = [
      ['自动算好的数', '考勤 · 加班 · 小费'],
      ['能签字的一页纸', '员工确认 · 门店留档'],
      ['能交差的报税文件', '模板对齐 · 人工导入'],
    ];
    gains.forEach((g, i) => {
      const x = 0.7 + i * 3.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 1.9, w: 2.9, h: 2.3,
        fill: { color: C.card }, rectRadius: 0.12, line: { color: C.card, width: 0 },
      });
      s.addText(g[0], {
        x: x + 0.15, y: 2.5, w: 2.6, h: 0.7,
        fontSize: 18, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
      });
      s.addText(g[1], {
        x: x + 0.15, y: 3.35, w: 2.6, h: 0.5,
        fontSize: 13, color: C.soft, fontFace: FONT, align: 'center', margin: 0,
      });
    });
    s.addNotes('看效果收束：别讲功能清单，讲客户手里多了什么。');
  }

  // D1 怎么卖章节
  {
    const s = pureBlack(pres);
    s.addText('④ 怎么卖', {
      x: 0.5, y: 2.1, w: 9, h: 0.5,
      fontSize: 18, color: C.accent, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addText('卖给谁 · 为什么买 · 怎么开口', {
      x: 0.5, y: 2.7, w: 9, h: 0.7,
      fontSize: 28, bold: true, color: C.white, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addNotes('模板最后一段：回答销售最关心的问题。');
  }

  // D2 为什么会买
  {
    const s = stage(pres);
    eyebrow(s, '客户为什么会买');
    const reasons = [
      ['痛够真', '双周二十六次，抄表抄到崩溃'],
      ['省得到', '自动带小费、自动算加班，少人对账'],
      ['交得出', '签字明细 + 报税文件，一次备齐'],
      ['加得上', '已用 TipOut 的店，天然可加购增值'],
    ];
    reasons.forEach((r, i) => {
      const y = 1.65 + i * 0.8;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 1.0, y, w: 8.0, h: 0.68,
        fill: { color: C.card }, rectRadius: 0.08, line: { color: C.card, width: 0 },
      });
      s.addText(r[0], {
        x: 1.25, y: y + 0.14, w: 1.8, h: 0.4,
        fontSize: 16, bold: true, color: C.accent, fontFace: FONT, valign: 'middle', margin: 0,
      });
      s.addText(r[1], {
        x: 3.2, y: y + 0.14, w: 5.5, h: 0.4,
        fontSize: 15, color: C.ice, fontFace: FONT, valign: 'middle', margin: 0,
      });
    });
    s.addNotes('为什么买：痛、省、交、加——四字好记。');
  }

  // D3 有什么证明
  {
    const s = stage(pres);
    eyebrow(s, '有什么证明');
    const proofs = [
      ['市场需求', '头部餐饮客户已提：报税格式导出 + 员工签字明细'],
      ['竞品参照', 'Toast / 7shifts 有薪资闭环；我们切「准备层 + 餐饮小费」更贴地'],
      ['产品闭环', '已有 TipOut + 考勤，薪资管理补齐最后一环'],
      ['边界可信', '不夸大：不发薪、不代报税、现阶段不对接 ADP'],
    ];
    proofs.forEach((p, i) => {
      const y = 1.6 + i * 0.8;
      s.addText(p[0], {
        x: 1.1, y, w: 2.0, h: 0.55,
        fontSize: 15, bold: true, color: C.accent, fontFace: FONT, valign: 'middle', margin: 0,
      });
      s.addText(p[1], {
        x: 3.2, y, w: 5.7, h: 0.55,
        fontSize: 14, color: C.ice, fontFace: FONT, valign: 'middle', margin: 0,
      });
    });
    s.addNotes('证明不等于造假案例：用需求、竞品、闭环、可信边界支撑「值得卖」。');
  }

  // D4 一句最易传播
  {
    const s = stage(pres);
    eyebrow(s, '一句最容易传播的卖点');
    centerHero(s, ['少抄表，少出错，', '报税文件一次出齐。'], {
      sizes: [34, 34],
      colors: [C.white, C.accent],
      y: 2.0,
      h: 1.8,
    });
    s.addText('备用 Slogan：核对一次 · 签字有据 · 报税即用', {
      x: 0.5, y: 4.3, w: 9, h: 0.35,
      fontSize: 14, color: C.dim, fontFace: FONT, align: 'center', margin: 0,
    });
    s.addNotes('模板 Checklist：发布会结束后若只记住一件事，就记这句。');
  }

  await pres.writeFile({ fileName: addPpt });
}

function rm(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function ps(cmd) {
  execSync(`powershell -NoProfile -Command "${cmd}"`, { stdio: 'inherit' });
}

function mergeSlides() {
  // keep addPpt; only clear nested unpack dirs
  const mainZip = path.join(tmp, 'main.zip');
  const addZip = path.join(tmp, 'add.zip');
  const mainU = path.join(tmp, 'main');
  const addU = path.join(tmp, 'add');
  rm(mainU);
  rm(addU);
  if (fs.existsSync(mainZip)) fs.unlinkSync(mainZip);
  if (fs.existsSync(addZip)) fs.unlinkSync(addZip);
  fs.copyFileSync(pptPath, mainZip);
  fs.copyFileSync(addPpt, addZip);
  ps(`Expand-Archive -Path '${mainZip.replace(/'/g, "''")}' -DestinationPath '${mainU.replace(/'/g, "''")}' -Force`);
  ps(`Expand-Archive -Path '${addZip.replace(/'/g, "''")}' -DestinationPath '${addU.replace(/'/g, "''")}' -Force`);

  const mainSlidesDir = path.join(mainU, 'ppt/slides');
  const addSlidesDir = path.join(addU, 'ppt/slides');
  const mainRelsDir = path.join(mainSlidesDir, '_rels');
  const addRelsDir = path.join(addSlidesDir, '_rels');
  const mainNotesDir = path.join(mainU, 'ppt/notesSlides');
  const addNotesDir = path.join(addU, 'ppt/notesSlides');
  const mainNotesRels = path.join(mainNotesDir, '_rels');
  const addNotesRels = path.join(addNotesDir, '_rels');

  const existing = fs.readdirSync(mainSlidesDir).filter((f) => /^slide\d+\.xml$/.test(f));
  const maxId = Math.max(...existing.map((f) => parseInt(f.match(/\d+/)[0], 10)));
  const addSlides = fs.readdirSync(addSlidesDir).filter((f) => /^slide\d+\.xml$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  // Map: add slide index -> new main slide number
  // Insertion plan (1-based original positions):
  // After slide 1: A1,A2 (memory + agenda)
  // After slide 10 (边界): B1-B4 (讲亮点 4 pages) — before 三个核心能力, so after 边界
  // After slide 18 (工作台): C1-C3 (看效果)
  // After slide 20 (谁最需要): D1-D4 (怎么卖强化)
  //
  // We'll rebuild sldIdLst completely.

  const insertAfter = {
    1: ['A', 2],   // after cover: 2 slides
    10: ['B', 4],  // after 边界: 4 slides
    18: ['C', 3],  // after 工作台: 3 slides
    20: ['D', 4],  // after 谁最需要: 4 slides
  };

  // Copy all add slides sequentially as slide{maxId+1...}
  const copied = []; // {group, src, newNum, notesNewNum?}
  let next = maxId + 1;
  let addIdx = 0;
  const groups = [
    { key: 'A', count: 2 },
    { key: 'B', count: 4 },
    { key: 'C', count: 3 },
    { key: 'D', count: 4 },
  ];
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      const srcName = addSlides[addIdx++];
      const srcNum = parseInt(srcName.match(/\d+/)[0], 10);
      const newNum = next++;
      fs.copyFileSync(path.join(addSlidesDir, srcName), path.join(mainSlidesDir, `slide${newNum}.xml`));
      // slide rels
      const srcRel = path.join(addRelsDir, `slide${srcNum}.xml.rels`);
      let relXml = fs.readFileSync(srcRel, 'utf8');
      // notes?
      const notesSrc = path.join(addNotesDir, `notesSlide${srcNum}.xml`);
      let notesNew = null;
      if (fs.existsSync(notesSrc)) {
        notesNew = newNum; // keep same numbering as slide for simplicity? notes usually notesSlideN
        // find max notes
        if (!fs.existsSync(mainNotesDir)) fs.mkdirSync(mainNotesDir, { recursive: true });
        if (!fs.existsSync(mainNotesRels)) fs.mkdirSync(mainNotesRels, { recursive: true });
        const existNotes = fs.existsSync(mainNotesDir)
          ? fs.readdirSync(mainNotesDir).filter((f) => /^notesSlide\d+\.xml$/.test(f))
          : [];
        const maxNotes = existNotes.length
          ? Math.max(...existNotes.map((f) => parseInt(f.match(/\d+/)[0], 10)))
          : 0;
        notesNew = maxNotes + 1;
        fs.copyFileSync(notesSrc, path.join(mainNotesDir, `notesSlide${notesNew}.xml`));
        const notesRelSrc = path.join(addNotesRels, `notesSlide${srcNum}.xml.rels`);
        if (fs.existsSync(notesRelSrc)) {
          let nr = fs.readFileSync(notesRelSrc, 'utf8');
          nr = nr.replace(/slide\d+\.xml/g, `slide${newNum}.xml`);
          fs.writeFileSync(path.join(mainNotesRels, `notesSlide${notesNew}.xml.rels`), nr, 'utf8');
        }
        relXml = relXml.replace(/notesSlide\d+\.xml/g, `notesSlide${notesNew}.xml`);
      }
      fs.writeFileSync(path.join(mainRelsDir, `slide${newNum}.xml.rels`), relXml, 'utf8');
      copied.push({ group: g.key, newNum, notesNew });
    }
  }

  // Update [Content_Types].xml
  const ctPath = path.join(mainU, '[Content_Types].xml');
  let ct = fs.readFileSync(ctPath, 'utf8');
  for (const c of copied) {
    if (!ct.includes(`slide${c.newNum}.xml`)) {
      ct = ct.replace(
        '</Types>',
        `  <Override PartName="/ppt/slides/slide${c.newNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n</Types>`
      );
    }
    if (c.notesNew && !ct.includes(`notesSlide${c.notesNew}.xml`)) {
      ct = ct.replace(
        '</Types>',
        `  <Override PartName="/ppt/notesSlides/notesSlide${c.notesNew}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>\n</Types>`
      );
    }
  }
  fs.writeFileSync(ctPath, ct, 'utf8');

  // Rebuild presentation.xml sldIdLst
  const presPath = path.join(mainU, 'ppt/presentation.xml');
  let presXml = fs.readFileSync(presPath, 'utf8');
  const presRelsPath = path.join(mainU, 'ppt/_rels/presentation.xml.rels');
  let presRels = fs.readFileSync(presRelsPath, 'utf8');

  // existing rIds for slides
  const slideRelMap = {}; // slideN -> rId
  for (const m of presRels.matchAll(/Id="(rId\d+)"[^>]*Target="slides\/slide(\d+)\.xml"/g)) {
    slideRelMap[m[2]] = m[1];
  }
  let maxRId = Math.max(...[...presRels.matchAll(/rId(\d+)/g)].map((m) => parseInt(m[1], 10)));

  const groupCopied = { A: [], B: [], C: [], D: [] };
  for (const c of copied) groupCopied[c.group].push(c);

  // assign rIds for new slides
  for (const c of copied) {
    maxRId += 1;
    const rId = `rId${maxRId}`;
    slideRelMap[String(c.newNum)] = rId;
    if (!presRels.includes(`slide${c.newNum}.xml`)) {
      presRels = presRels.replace(
        '</Relationships>',
        `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${c.newNum}.xml"/>\n</Relationships>`
      );
    }
  }
  fs.writeFileSync(presRelsPath, presRels, 'utf8');

  // Build new order of original slides 1..26 with inserts
  const order = [];
  for (let i = 1; i <= 26; i++) {
    order.push(i);
    if (i === 1) for (const c of groupCopied.A) order.push(c.newNum);
    if (i === 10) for (const c of groupCopied.B) order.push(c.newNum);
    if (i === 18) for (const c of groupCopied.C) order.push(c.newNum);
    if (i === 20) for (const c of groupCopied.D) order.push(c.newNum);
  }

  // max existing sld id attr
  let maxSldId = 256;
  const sldIds = order.map((n) => {
    maxSldId += 1;
    const rId = slideRelMap[String(n)];
    if (!rId) throw new Error(`Missing rId for slide ${n}`);
    return `<p:sldId id="${maxSldId}" r:id="${rId}"/>`;
  });

  presXml = presXml.replace(
    /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
    `<p:sldIdLst>${sldIds.join('')}</p:sldIdLst>`
  );
  fs.writeFileSync(presPath, presXml, 'utf8');

  // Repack
  const outZip = path.join(tmp, 'out.zip');
  rm(outZip);
  // Compress contents of mainU
  ps(`Compress-Archive -Path '${path.join(mainU, '*').replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`);
  fs.copyFileSync(outZip, pptPath);
  console.log('Merged. New slide count:', order.length);
  console.log('Order sample after cover:', order.slice(0, 6).join(','));
  return order.length;
}

function updateMd() {
  let md = fs.readFileSync(mdPath, 'utf8');
  const supplement = `

---

## 按《发布会模板》补充结构（已插入 PPT）

> 对齐 \`docs/产品发布会/发布会模板.md\`：20 分钟四段式 · 少功能多价值。

### ① 为什么做（既有页保留）
痛点故事 + 假如四连 + 正式发布（原第 2–7 页一带）。

### 开场记忆点（新增）
- **今天只记住一件事**：少抄表、少出错、报税文件一次出齐。
- **二十分钟四段话**：为什么做 → 讲亮点 → 看效果 → 怎么卖。

### ② 讲亮点（新增 · 三大卖点）
按「业务场景 → 产品能力 → 带来的价值」：

| 卖点 | 场景 | 能力 | 价值 |
|------|------|------|------|
| 一 | 每期还在表格抄考勤/小费/加班 | 自动算 + TipOut 自动带入 + 一处改数 | **少抄表、少出错，省对账时间** |
| 二 | 员工要签字、门店要留档却对不上 | 可打印签字明细 | **签得了、留得住，降纠纷** |
| 三 | 会计师催报税文件 | 报税格式导出（人工导入） | **核对完就能交，少返工** |

### ③ 看效果（新增）
- 现场演示五步（TipOut → 自动带入 → 加班重算 → 签字明细 → 导出）
- 客户最终获得：自动算好的数 / 能签字的一页纸 / 能交差的报税文件

### ④ 怎么卖（新增强化）
- **客户为什么会买**：痛够真 · 省得到 · 交得出 · 加得上  
- **有什么证明**：市场需求 · 竞品参照 · 产品闭环 · 边界可信  
- **一句最易传播**：少抄表，少出错，报税文件一次出齐。  
  （备用：核对一次 · 签字有据 · 报税即用）

### 发布前 Checklist 对照
- [x] 一句话说清核心价值  
- [x] 有真实业务场景  
- [x] 聚焦 2–3 个核心亮点  
- [x] 每个亮点对应业务价值  
- [x] 有真实演示路径（现场切系统）  
- [x] 能回答卖给谁、为什么买  
- [x] 提炼一句最易传播卖点  

---
`;
  if (!md.includes('按《发布会模板》补充结构')) {
    md = md.replace(/\n\*文稿版本：.*/, `${supplement}\n*文稿版本：2026-07-28 · Payroll 1.0 · 已按发布会模板补页*`);
    if (!md.includes('文稿版本：2026-07-28')) {
      md += supplement;
      md += '\n*文稿版本：2026-07-28 · Payroll 1.0 · 已按发布会模板补页*\n';
    }
  } else {
    // replace existing supplement block lightly by appending note
    md = md.replace(/\*文稿版本：.*/, '*文稿版本：2026-07-28 · Payroll 1.0 · 已按发布会模板补页*');
  }
  // Also update duration note at top
  md = md.replace(
    /\*\*时长\*\*：25–30 分钟 · 约 26 页/,
    '**时长**：按模板建议约 **20 分钟**（四段）· PPT 已补充模板缺页（总页数约 39）'
  );
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('MD updated:', mdPath);
}

await buildAddSlides();
const n = mergeSlides();
updateMd();
rm(tmp);
console.log('Done. Total slides ~', n);
