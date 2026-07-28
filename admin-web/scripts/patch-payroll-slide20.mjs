/**
 * 仅更新 PPT 第 20 页「谁最需要」为六句版，不触碰其他页面。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pptPath = path.join(__dirname, '../docs/项目文档/薪资管理-P0产品发布会.pptx');
const tmpDir = path.join(__dirname, '../.tmp-ppt-patch');

const lines = [
  '需要报税文件。',
  '已有小费分配。',
  '还在用表格拼数。',
  '员工要签字，门店要留档。',
  '双周发薪，每期都要对。',
  '已用我们小费分配。',
];

const para = (text, sz = 2400) => `<a:p><a:pPr marL="0" indent="0" algn="ctr"><a:buNone/></a:pPr><a:r><a:rPr lang="zh-CN" sz="${sz}" b="1" dirty="0"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="Microsoft YaHei" pitchFamily="34" charset="0"/><a:ea typeface="Microsoft YaHei" pitchFamily="34" charset="-122"/><a:cs typeface="Microsoft YaHei" pitchFamily="34" charset="-120"/></a:rPr><a:t>${text}</a:t></a:r><a:endParaRPr lang="zh-CN" sz="${sz}" dirty="0"/></a:p>`;

const heroBody = lines.map((l) => para(l)).join('');

const slide20New = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld name="Slide 20"><p:bg><p:bgPr><a:solidFill><a:srgbClr val="0B0B0F"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Text 0"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="1280160"/><a:ext cx="8229600" cy="320040"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr marL="0" indent="0" algn="ctr"><a:buNone/></a:pPr><a:r><a:rPr lang="zh-CN" sz="1400" b="1" kern="0" spc="400" dirty="0"><a:solidFill><a:srgbClr val="FF6A00"/></a:solidFill><a:latin typeface="Microsoft YaHei" pitchFamily="34" charset="0"/><a:ea typeface="Microsoft YaHei" pitchFamily="34" charset="-122"/><a:cs typeface="Microsoft YaHei" pitchFamily="34" charset="-120"/></a:rPr><a:t>谁最需要</a:t></a:r><a:endParaRPr lang="zh-CN" sz="1400" dirty="0"/></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Text 1"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="457200" y="1463040"/><a:ext cx="8229600" cy="2743200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln/></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="ctr"/><a:lstStyle/>${heroBody}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

const notesText =
  '六句画像：报税文件、小费分配、表格拼数、签字留档、双周核对、已用 TipOut。口播：「已经用了我们小费分配的，更是天然适合加购 Payroll 1.0。」';

function rm(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

rm(tmpDir);
fs.mkdirSync(tmpDir, { recursive: true });
const zipPath = path.join(tmpDir, 'deck.zip');
const unpacked = path.join(tmpDir, 'unpacked');
fs.copyFileSync(pptPath, zipPath);
execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${unpacked.replace(/'/g, "''")}' -Force"`);

fs.writeFileSync(path.join(unpacked, 'ppt/slides/slide20.xml'), slide20New, 'utf8');

const notesPath = path.join(unpacked, 'ppt/notesSlides/notesSlide20.xml');
if (fs.existsSync(notesPath)) {
  let notes = fs.readFileSync(notesPath, 'utf8');
  notes = notes.replace(/<a:t>[\s\S]*?<\/a:t>/, `<a:t>${notesText}</a:t>`);
  fs.writeFileSync(notesPath, notes, 'utf8');
}

const outZip = path.join(tmpDir, 'out.zip');
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(unpacked, '*').replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`
);
fs.copyFileSync(outZip, pptPath);
rm(tmpDir);
console.log('Patched slide 20 (六句版):', pptPath);
