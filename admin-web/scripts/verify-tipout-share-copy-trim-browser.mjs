import fs from 'node:fs';
// Reuse the isolated interaction fixture, targeting this feature server and new screenshots only.
let source=fs.readFileSync('scripts/verify-tipout-contributor-share-modes-browser.mjs','utf8').replaceAll('65124','65126').replaceAll('assets/tips-contributor-share-modes-20261023','assets/tips-share-copy-trim-20261023');
source=source.replace("run('screenshot '+asset+'/average.png');",`assert.equal(ev(\`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;const d=r.querySelector('#contributorSharesDrawer');return d.querySelector('#contributorSharesTotal').hidden&&!d.textContent.includes('以下比例分摊')&&!d.textContent.includes('当前名单仅供预览')&&!d.textContent.includes('确定仅更新本页规则草稿')&&!d.textContent.includes('再按P/C规则计算');})()\`),true);run('screenshot '+asset+'/average.png');`);
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
