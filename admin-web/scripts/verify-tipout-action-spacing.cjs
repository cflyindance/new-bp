const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = process.env.TIPOUT_BROWSER_PACKAGES ? createRequire(path.join(process.env.TIPOUT_BROWSER_PACKAGES,'package.json'))('playwright') : require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage();
  await page.setContent('<div class="tipout-fidelity"><table><tbody>'+['分配','确认已发放','查看发放记录'].map(label=>'<tr><td class="tipout-detail-link"><span>查看明细</span><button class="btn btn-sm '+(label==='确认已发放'?'tipout-confirm-payout':'')+'">'+label+'</button></td></tr>').join('')+'</tbody></table></div>');
  await page.addStyleTag({content:fs.readFileSync('src/team/tips/tips-page.css','utf8')});
  const gaps=await page.locator('.tipout-detail-link').evaluateAll(cells=>cells.map(cell=>{const a=cell.querySelector('span').getBoundingClientRect(),b=cell.querySelector('button').getBoundingClientRect();return b.left-a.right;}));
  assert.ok(gaps.every(gap=>gap>=12),`操作间距不足: ${gaps}`);
  console.log('All three date-row actions have at least 12px spacing:',gaps);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
