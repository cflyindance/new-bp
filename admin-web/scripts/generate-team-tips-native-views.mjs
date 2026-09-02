import fs from "node:fs";

const views = {
  distribution: "index.html",
  details: "detail.html",
  rules: "rules.html",
  "rule-editor": "rule-add.html",
};

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

function neutralizeHandlers(markup) {
  return markup
    .replace(/\s(on[a-z]+)=(["'])/gi, " data-native-$1=$2")
    .replace(/\shref=(["'])javascript:([\s\S]*?)\1/gi, " data-native-href=$1javascript:$2$1 href=$1#$1");
}

fs.mkdirSync("src/team/tips/templates", { recursive: true });
fs.mkdirSync("src/team/tips/programs", { recursive: true });

for (const [view, name] of Object.entries(views)) {
  const source = fs.readFileSync(`dist/TipOut/${name}`, "utf8");
  const bodyClasses = source.match(/<body\b[^>]*\bclass=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
  const inlineStyles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((item) => item[1].trim())
    .filter(Boolean)
    .join("\n\n");
  const contentStart = source.search(/<div class="content-area(?:\s|\")/);
  if (contentStart < 0) throw new Error(`${name}: content area not found`);
  const content = extractBalancedDiv(source, contentStart);
  const contentEnd = contentStart + content.length;
  const extras = [];
  const extraPattern = /<div class="[^"]*(?:modal-overlay|drawer-overlay|drawer(?:\s|"))[^"]*"/g;
  extraPattern.lastIndex = contentEnd;
  let match;
  while ((match = extraPattern.exec(source))) {
    if (source.slice(contentEnd, match.index).includes("<script")) break;
    const fragment = extractBalancedDiv(source, match.index);
    extras.push(fragment);
    extraPattern.lastIndex = match.index + fragment.length;
  }
  const classNames = ["team-tips-page", bodyClasses].filter(Boolean).join(" ");
  const viewStyle = inlineStyles ? `<style data-team-tips-view-style>\n${inlineStyles}\n</style>\n` : "";
  const template = neutralizeHandlers(`${viewStyle}<section class="${classNames}" data-team-tips-view="${view}">\n${content}\n${extras.join("\n")}\n</section>\n`);
  if (/\s(on[a-z]+)=/i.test(template) || /href=["']javascript:/i.test(template)) throw new Error(`${name}: executable inline markup remains`);
  fs.writeFileSync(`src/team/tips/templates/${view}.html`, template);

  const programs = [...source.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((item) => item[1].trim())
    .filter(Boolean);
  if (programs.length !== 1) throw new Error(`${name}: expected one inline page program, found ${programs.length}`);
  fs.writeFileSync(`src/team/tips/programs/${view}.js.txt`, `${programs[0]}\n`);
}

const commonCss = fs.readFileSync("dist/TipOut/common.css", "utf8").replace(":root {", ":host {");
const fidelityCss = fs.readFileSync("dist/TipOut/prototype-fidelity.css", "utf8");
fs.writeFileSync("src/team/tips/tips-page.css", `${commonCss}\n\n${fidelityCss}\n`);
console.log("Generated four native Team Tips templates and page programs.");
