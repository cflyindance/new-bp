import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceHtml = fs.readFileSync(path.join(root, "dist/TipOut/payroll.html"), "utf8");
const commonCss = fs.readFileSync(path.join(root, "dist/TipOut/common.css"), "utf8");
const payrollCss = fs.readFileSync(path.join(root, "dist/TipOut/payroll.css"), "utf8");
const outputDirectory = path.join(root, "src/team/payroll");

function extractDivAt(source, start) {
  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(source))) {
    if (!match[0].startsWith("</")) depth += 1;
    else depth -= 1;
    if (depth === 0) {
      return { html: source.slice(start, tagPattern.lastIndex), end: tagPattern.lastIndex };
    }
  }
  throw new Error(`Unclosed div at offset ${start}`);
}

const contentStart = sourceHtml.indexOf('<div class="content-area">');
if (contentStart < 0) throw new Error("Payroll content area was not found");
const contentArea = extractDivAt(sourceHtml, contentStart);
const contentInnerStart = contentArea.html.indexOf(">") + 1;
const contentInner = contentArea.html.slice(contentInnerStart, contentArea.html.lastIndexOf("</div>"));

const modalPattern = /<div class="modal-overlay"\s+id="[^"]+">/g;
const modalFragments = [];
let modalMatch;
while ((modalMatch = modalPattern.exec(sourceHtml))) {
  if (modalMatch.index < contentArea.end) continue;
  modalFragments.push(extractDivAt(sourceHtml, modalMatch.index).html);
}

if (modalFragments.length !== 12) {
  throw new Error(`Expected 12 Payroll dialogs, found ${modalFragments.length}`);
}

const template = `<section class="team-payroll-page payroll-page" data-team-payroll-page>\n` +
  `  <div class="payroll-native-status no-print" data-payroll-status hidden></div>\n` +
  `${contentInner.trim()}\n` +
  `${modalFragments.join("\n")}\n` +
  `</section>\n`;

function makeShadowScopedCss(source) {
  return source
    .replace(/^@import[^;]+;\s*/gm, "")
    .replace(/:root\b/g, ".team-payroll-page")
    .replace(/(?<![\w-])body(?=[.#\s,{])/g, ".team-payroll-page")
    .replace(/^\s*html\s*,\s*\.team-payroll-page\s*\{/gm, ".team-payroll-page {")
    .replace(/^\s*html\s*\{/gm, ".team-payroll-page {");
}

const combinedCss = `/* Generated from TipOut common.css + payroll.css for the native Payroll shadow root. */\n` +
  `${makeShadowScopedCss(commonCss)}\n${makeShadowScopedCss(payrollCss)}\n`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, "payroll-template.html"), template, "utf8");
fs.writeFileSync(path.join(outputDirectory, "payroll-page.css"), combinedCss, "utf8");
console.log(`Generated native Payroll template with ${modalFragments.length} dialogs.`);
