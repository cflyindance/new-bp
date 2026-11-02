import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.css', 'utf8');
assert.match(css, /\.olf-choice:not\(:disabled\):hover\s*\{/);
assert.doesNotMatch(css, /\.olf-choice:hover\s*\{/);
assert.match(css, /\.olf-choice\.is-locked:disabled\s*\{[^}]*cursor:\s*default/);
assert.match(css, /\.olf-choice\.is-locked:disabled:not\(\.is-selected\)\s*\{[^}]*opacity:\s*\.56/);
assert.match(css, /\.olf-choice\.is-locked:disabled\.is-selected\s*\{[^}]*opacity:\s*1/);
assert.match(css, /\.olf-period-toggle-grid--readonly \.olf-period-toggle:not\(\.is-selected\)\s*\{[^}]*opacity:\s*\.56/);
console.log('verify-buffet-subject-disabled-style: PASS');
