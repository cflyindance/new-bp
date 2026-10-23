import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('src/team/tips/tips-page.css','utf8');
const closed=css.match(/\.contributor-shares-drawer\s*\{([^}]+)\}/)?.[1]||'';
assert.match(closed,/visibility:\s*hidden/, 'closed share drawer must not expose its extra width');
assert.match(closed,/right:\s*-680px/, 'closed offset must cover the full drawer');
assert.match(css,/\.contributor-shares-drawer\.show\s*\{[^}]*visibility:\s*visible[^}]*right:\s*0/s);
console.log('PASS shares drawer closed hidden and full-width offscreen; open visible');
