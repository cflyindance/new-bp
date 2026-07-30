/**
 * 仅向现有薪资管理发布会 PPT 插入一页「需求背景」：
 * - 插在当前第 3 页（议程）之后
 * - 保留所有已有页面与人工修改
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import pptxgen from 'pptxgenjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pptPath = path.join(root, 'docs/产品发布会/薪资管理-P0产品发布会.pptx');
const tmp = path.join(root, '.tmp-payroll-background-slide');
const sourcePpt = path.join(tmp, 'background-slide.pptx');

const C = {
  stage: '0B0B0F',
  card: '16161A',
  white: 'FFFFFF',
  soft: 'A1A1A6',
  accent: 'FF6A00',
  ice: 'E8E8ED',
};
const FONT = 'Microsoft YaHei';

function rm(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function ps(command) {
  execSync(`powershell -NoProfile -Command "${command}"`, { stdio: 'inherit' });
}

async function buildSourceSlide() {
  fs.mkdirSync(tmp, { recursive: true });
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';

  const slide = pres.addSlide();
  slide.background = { color: C.stage };

  slide.addText('需求背景', {
    x: 0.5,
    y: 0.75,
    w: 9,
    h: 0.35,
    fontSize: 14,
    color: C.accent,
    fontFace: FONT,
    align: 'center',
    bold: true,
    charSpacing: 4,
    margin: 0,
  });

  slide.addText('餐饮薪资，长期依赖人工拼接。', {
    x: 0.6,
    y: 1.35,
    w: 8.8,
    h: 0.65,
    fontSize: 28,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    bold: true,
    margin: 0,
  });

  const items = [
    ['数据分散', '考勤、小费、加班、报税文件分散在不同环节'],
    ['重复核对', '双周发薪，每期都要重新汇总与对账'],
    ['交付繁琐', '员工要签字、门店要留档、会计师要文件'],
  ];

  items.forEach((item, index) => {
    const x = 0.55 + index * 3.05;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.35,
      w: 2.85,
      h: 1.8,
      fill: { color: C.card },
      rectRadius: 0.1,
      line: { color: C.card, width: 0 },
    });
    slide.addText(item[0], {
      x: x + 0.18,
      y: 2.68,
      w: 2.49,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: C.accent,
      fontFace: FONT,
      align: 'center',
      margin: 0,
    });
    slide.addText(item[1], {
      x: x + 0.2,
      y: 3.22,
      w: 2.45,
      h: 0.62,
      fontSize: 12,
      color: C.ice,
      fontFace: FONT,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });
  });

  slide.addText('所以，我们需要一个统一的薪资准备工作台。', {
    x: 0.7,
    y: 4.65,
    w: 8.6,
    h: 0.42,
    fontSize: 17,
    bold: true,
    color: C.white,
    fontFace: FONT,
    align: 'center',
    margin: 0,
  });

  slide.addNotes(
    '需求背景很简单：餐饮薪资的数据散、核对频繁、交付繁琐。每两周都要重新汇总考勤、小费和加班，还要准备签字留档与报税文件，所以需要统一的薪资准备工作台。'
  );

  await pres.writeFile({ fileName: sourcePpt });
}

function unpack(ppt, target) {
  const zip = `${target}.zip`;
  fs.copyFileSync(ppt, zip);
  ps(
    `Expand-Archive -Path '${zip.replace(/'/g, "''")}' -DestinationPath '${target.replace(/'/g, "''")}' -Force`
  );
}

function patchPresentation() {
  const mainDir = path.join(tmp, 'main');
  const sourceDir = path.join(tmp, 'source');
  unpack(pptPath, mainDir);
  unpack(sourcePpt, sourceDir);

  const mainSlidesDir = path.join(mainDir, 'ppt/slides');
  const mainSlideRelsDir = path.join(mainSlidesDir, '_rels');
  const mainNotesDir = path.join(mainDir, 'ppt/notesSlides');
  const mainNotesRelsDir = path.join(mainNotesDir, '_rels');

  const existingSlideNumbers = fs
    .readdirSync(mainSlidesDir)
    .filter((name) => /^slide\d+\.xml$/.test(name))
    .map((name) => Number(name.match(/\d+/)[0]));
  const newSlideNumber = Math.max(...existingSlideNumbers) + 1;

  fs.copyFileSync(
    path.join(sourceDir, 'ppt/slides/slide1.xml'),
    path.join(mainSlidesDir, `slide${newSlideNumber}.xml`)
  );

  let slideRels = fs.readFileSync(
    path.join(sourceDir, 'ppt/slides/_rels/slide1.xml.rels'),
    'utf8'
  );

  const sourceNotes = path.join(sourceDir, 'ppt/notesSlides/notesSlide1.xml');
  let newNotesNumber = null;
  if (fs.existsSync(sourceNotes)) {
    const existingNoteNumbers = fs
      .readdirSync(mainNotesDir)
      .filter((name) => /^notesSlide\d+\.xml$/.test(name))
      .map((name) => Number(name.match(/\d+/)[0]));
    newNotesNumber = Math.max(...existingNoteNumbers) + 1;

    fs.copyFileSync(
      sourceNotes,
      path.join(mainNotesDir, `notesSlide${newNotesNumber}.xml`)
    );

    let notesRels = fs.readFileSync(
      path.join(sourceDir, 'ppt/notesSlides/_rels/notesSlide1.xml.rels'),
      'utf8'
    );
    notesRels = notesRels.replace(/slide1\.xml/g, `slide${newSlideNumber}.xml`);
    fs.writeFileSync(
      path.join(mainNotesRelsDir, `notesSlide${newNotesNumber}.xml.rels`),
      notesRels,
      'utf8'
    );

    slideRels = slideRels.replace(
      /notesSlide1\.xml/g,
      `notesSlide${newNotesNumber}.xml`
    );
  }

  fs.writeFileSync(
    path.join(mainSlideRelsDir, `slide${newSlideNumber}.xml.rels`),
    slideRels,
    'utf8'
  );

  const contentTypesPath = path.join(mainDir, '[Content_Types].xml');
  let contentTypes = fs.readFileSync(contentTypesPath, 'utf8');
  contentTypes = contentTypes.replace(
    '</Types>',
    `<Override PartName="/ppt/slides/slide${newSlideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>` +
      (newNotesNumber
        ? `<Override PartName="/ppt/notesSlides/notesSlide${newNotesNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`
        : '') +
      '</Types>'
  );
  fs.writeFileSync(contentTypesPath, contentTypes, 'utf8');

  const presentationRelsPath = path.join(
    mainDir,
    'ppt/_rels/presentation.xml.rels'
  );
  let presentationRels = fs.readFileSync(presentationRelsPath, 'utf8');
  const maxRid = Math.max(
    ...[...presentationRels.matchAll(/rId(\d+)/g)].map((match) =>
      Number(match[1])
    )
  );
  const newRid = `rId${maxRid + 1}`;
  presentationRels = presentationRels.replace(
    '</Relationships>',
    `<Relationship Id="${newRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${newSlideNumber}.xml"/></Relationships>`
  );
  fs.writeFileSync(presentationRelsPath, presentationRels, 'utf8');

  const presentationPath = path.join(mainDir, 'ppt/presentation.xml');
  let presentation = fs.readFileSync(presentationPath, 'utf8');
  const maxSlideId = Math.max(
    ...[...presentation.matchAll(/<p:sldId id="(\d+)"/g)].map((match) =>
      Number(match[1])
    )
  );
  const slideIds = [
    ...presentation.matchAll(/<p:sldId id="\d+" r:id="rId\d+"\/>/g),
  ].map((match) => match[0]);
  slideIds.splice(
    3,
    0,
    `<p:sldId id="${maxSlideId + 1}" r:id="${newRid}"/>`
  );
  presentation = presentation.replace(
    /<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/,
    `<p:sldIdLst>${slideIds.join('')}</p:sldIdLst>`
  );
  fs.writeFileSync(presentationPath, presentation, 'utf8');

  const outputZip = path.join(tmp, 'output.zip');
  ps(
    `Compress-Archive -Path '${path.join(mainDir, '*').replace(/'/g, "''")}' -DestinationPath '${outputZip.replace(/'/g, "''")}' -Force`
  );
  fs.copyFileSync(outputZip, pptPath);
}

rm(tmp);
await buildSourceSlide();
patchPresentation();
rm(tmp);
console.log('Inserted requirement-background slide after agenda:', pptPath);
