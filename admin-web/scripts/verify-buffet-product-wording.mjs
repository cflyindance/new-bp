import fs from 'node:fs';
import path from 'node:path';

const exactFiles = [
  'dist/Configuration center/assets/order-limit-flow.js',
  'dist/Configuration center/assets/buffet-rule-list-view.js',
  'dist/Configuration center/assets/buffet-rule-profile.js',
];
const scanDirectories = [
  ['scripts', /^verify-buffet-.*\.mjs$/],
  ['docs/superpowers/specs', /buffet.*\.md$/],
  ['docs/superpowers/plans', /buffet.*\.md$/],
];
const excludedDocuments = new Set([
  'docs/superpowers/specs/2026-09-21-buffet-product-wording-design.md',
  'docs/superpowers/plans/2026-09-21-buffet-product-wording-implementation.md',
]);
const excludedScripts = new Set(['scripts/verify-buffet-product-wording.mjs']);
const forbidden = [
  /菜品集成员/g,
  /成员跨产线/g,
  /个成员/g,
  /成员保护/g,
  /成员例外/g,
  /成员重叠/g,
  /成员不足/g,
  /成员表/g,
  /该成员/g,
  /全部成员/g,
  /额度与成员/g,
];

const files = exactFiles.slice();
for (const [directory, matcher] of scanDirectories) {
  for (const name of fs.readdirSync(directory)) {
    const relative = path.posix.join(directory.replaceAll('\\', '/'), name);
    if (matcher.test(name) && !excludedDocuments.has(relative) && !excludedScripts.has(relative)) files.push(relative);
  }
}

const findings = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (forbidden.some(pattern => { pattern.lastIndex = 0; return pattern.test(line); })) {
      findings.push(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length) {
  console.error('发现仍以“成员”指代菜品集商品的文案：');
  findings.forEach(finding => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log('verify-buffet-product-wording: PASS');
}
