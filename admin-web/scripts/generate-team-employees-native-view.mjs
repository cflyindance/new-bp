import fs from "node:fs";

const source = fs.readFileSync("dist/TipOut/employees.html", "utf8");

function extractBalancedDiv(input, start) {
  const token = /<div\b[^>]*>|<\/div\s*>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(input))) {
    if (/^<div\b/i.test(match[0])) depth += 1;
    else depth -= 1;
    if (depth === 0) return input.slice(start, token.lastIndex);
  }
  throw new Error(`Unbalanced div beginning at ${start}`);
}

const contentStart = source.indexOf('<div class="content-area">');
if (contentStart < 0) throw new Error("employees content area was not found");
const content = extractBalancedDiv(source, contentStart);

const modalPattern = /<div class="[^"]*modal-overlay[^"]*"/g;
const modals = [];
let match;
while ((match = modalPattern.exec(source))) {
  const modal = extractBalancedDiv(source, match.index);
  modals.push(modal);
  modalPattern.lastIndex = match.index + modal.length;
}
if (modals.length < 4) throw new Error(`Expected employee modal overlays, found ${modals.length}`);

let template = [content, ...modals].join("\n\n");
let inlineCloseCount = 0;
template = template.replace(/\s+onclick="closeModal\('addEmployeeModal'\)"/g, () => {
  inlineCloseCount += 1;
  return ' data-action="close-employee-modal"';
});
if (inlineCloseCount !== 2) throw new Error(`Expected two employee close handlers, replaced ${inlineCloseCount}`);
if (/\sonclick\s*=/i.test(template)) throw new Error("Extracted employee markup still contains inline handlers");

template = `<section class="team-employees-page employees-page" data-team-employees-page>\n${template}\n</section>\n`;
fs.mkdirSync("src/team/employees", { recursive: true });
fs.writeFileSync("src/team/employees/employees-template.html", template);

const commonCss = fs.readFileSync("dist/TipOut/common.css", "utf8");
const employeesCss = fs.readFileSync("dist/TipOut/employees.css", "utf8");
fs.writeFileSync("src/team/employees/employees-page.css", `${commonCss}\n\n${employeesCss}\n`);
console.log(`Generated native employees view with ${modals.length} modal overlays.`);
