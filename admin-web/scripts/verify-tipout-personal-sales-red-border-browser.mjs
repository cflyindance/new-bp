import fs from 'node:fs';
const setup=fs.readFileSync('scripts/verify-tipout-share-store-notice-browser.mjs','utf8').split('const result=ev(')[0].replaceAll('65125','65128');
const scenario=`
const result=ev(\`(async()=>{let r;for(let i=0;i<80;i++){r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#deductAddMenuBtn'))break;await new Promise(x=>setTimeout(x,100));}r.querySelector('#deductAddMenuBtn').click();const item=r.querySelector('#deductAddOptionMenu [data-basis=personal_sales_pct]'),css=getComputedStyle(item);return {border:css.borderTopColor,width:css.borderTopWidth,color:css.color,other:getComputedStyle(r.querySelector('#deductAddOptionMenu [data-basis=sales_pct]')).borderTopWidth};})()\`);
assert.equal(result.border,'rgb(255, 77, 79)');assert.equal(result.width,'1px');assert.notEqual(result.color,'rgb(255, 77, 79)');assert.equal(result.other,'0px');
run('screenshot '+path.resolve('dist/TipOut/docs/assets/tips-personal-sales-red-border-20261023/menu.png').replaceAll('\\\\','/'));
const redistribution=ev(\`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;r.querySelector('#deductAddMenuBtn').click();r.querySelector('[data-native-onclick="addReceiverRow()"]').click();const link=[...r.querySelectorAll('#receiverTable a')].find(e=>e.textContent==='再分配');const css=getComputedStyle(link);return {border:css.borderTopColor,width:css.borderTopWidth,color:css.color};})()\`);
assert.equal(redistribution.border,'rgb(255, 77, 79)');assert.equal(redistribution.width,'1px');assert.notEqual(redistribution.color,'rgb(255, 77, 79)');
run('screenshot '+path.resolve('dist/TipOut/docs/assets/tips-personal-sales-red-border-20261023/redistribute.png').replaceAll('\\\\','/'));
console.log('PASS personal sales menu: red1px border only, text color preserved, other entry unchanged');
`;
await import('data:text/javascript;base64,'+Buffer.from(setup+scenario).toString('base64'));
