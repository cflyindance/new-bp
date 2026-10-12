import assert from 'node:assert/strict';
import fs from 'node:fs';
for (const file of ['src/team/payroll/payroll-page.css','dist/TipOut/payroll.css']) {
  const css=fs.readFileSync(file,'utf8');
  assert.ok(css.includes('.payroll-page .payroll-employee-hero-head{z-index:2}'),`${file}: dropdown header must stack above sibling metrics z-index 1`);
  const menu=css.match(/\.payroll-page \.payroll-employee-more-menu\{([^}]+)\}/)[1];
  const item=css.match(/\.payroll-page \.payroll-employee-more-menu button\.payroll-employee-more-item\{([^}]+)\}/)[1];
  assert.ok(menu.includes('padding:6px 0'),`${file}: visible row edges must belong to the button`);
  for(const rule of ['display:flex','width:100%','min-height:44px','box-sizing:border-box','margin:0']) assert.ok(item.includes(rule),`${file}: missing ${rule}`);
}
for(const file of ['src/team/payroll/payroll-template.html','dist/TipOut/payroll.html']) {
  const html=fs.readFileSync(file,'utf8');
  for(const action of ['preview-employees-detail','preview-adp-report','open-employee-identity-edit'])
    assert.ok(html.includes('class="payroll-employee-more-item" data-action="'+action+'" role="menuitem"'),file+': action must belong to the same full-row button');
}
console.log('Payroll more menu full-row hit area passed');
