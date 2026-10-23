import fs from 'node:fs';
const setup=fs.readFileSync('scripts/verify-tipout-share-store-notice-browser.mjs','utf8').split('const result=ev(')[0].replaceAll('65125','65127');
const scenario=`
const result=ev(\`(async()=>{let r;for(let i=0;i<80;i++){r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#deductAddMenuBtn'))break;await new Promise(x=>setTimeout(x,100));}r.querySelector('#deductAddMenuBtn').click();r.querySelector('#deductAddOptionMenu [data-basis=sales_pct]').click();await new Promise(x=>setTimeout(x,100));const entry=r.querySelector('.contributor-share-entry');return {hidden:entry.hidden,display:getComputedStyle(entry).display};})()\`);
assert.equal(result.hidden,true);assert.equal(result.display,'none');
run('screenshot '+path.resolve('dist/TipOut/docs/assets/tips-share-role-visibility-20261023/no-role.png').replaceAll('\\\\','/'));
const selected=ev(\`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;const card=r.querySelector('.deduct-basis-card');[...card.querySelectorAll('button')].find(e=>e.textContent.includes('设置取值条件')).click();const d=r.querySelector('#salesDrawer');const cb=d.querySelector('input[type=checkbox][value="Bartender"]');if(!cb)throw Error('role option missing');cb.click();[...d.querySelectorAll('button')].find(e=>e.textContent==='提交').click();const entry=r.querySelector('.contributor-share-entry');return {hidden:entry.hidden,display:getComputedStyle(entry).display,role:card.querySelector('.cond-text').textContent};})()\`);
assert.equal(selected.hidden,false);assert.equal(selected.display,'flex');assert.match(selected.role,/Bartender/);
run('screenshot '+path.resolve('dist/TipOut/docs/assets/tips-share-role-visibility-20261023/role-selected.png').replaceAll('\\\\','/'));
console.log('PASS live role visibility: initial no-role entire row hidden, condition Bartender saved then row visible');
`;
await import('data:text/javascript;base64,'+Buffer.from(setup+scenario).toString('base64'));
