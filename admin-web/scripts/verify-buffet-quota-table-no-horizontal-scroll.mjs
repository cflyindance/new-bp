import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');

assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*table-layout:\s*fixed/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table-wrap\s*\{[^}]*overflow-x:\s*hidden/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-product-table td\s*\{[^}]*overflow-wrap:\s*anywhere/s);
assert.match(css, /\.olf-scene-workbench \.olf-v4-table-limit\s*\{[^}]*white-space:\s*normal[^}]*flex-wrap:\s*wrap/s);
assert.match(css, /\.olf-scene-workbench \.olf-cross-store-table\s*\{[^}]*min-width:\s*0/s);
assert.match(css, /\.olf-scene-workbench \.olf-cross-store-limits\s*\{[^}]*min-width:\s*0/s);
assert.match(css, /\.olf-buffet-summary-table\s*\{[^}]*min-width:\s*1200px/s);

console.log('verify-buffet-quota-table-no-horizontal-scroll: PASS');
