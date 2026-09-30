import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('independent entry never mounts merchant login; handoff happens only when leaving',()=>{const html=read('../index.html'),main=read('../src/main.ts');assert.match(html,/src\/main.ts/);assert.doesNotMatch(main,/mountLoginShell|bindLoginForm|import.*\.\.\/\.\.\/\.\.\/src\/main/);assert.match(main,/async function goHost[\s\S]*await requestMenuSession/);assert.match(main,/host.origin===location.origin/);assert.match(main,/mountDemoSwitchFab/);});
test('workspace has isolated storage and no prototype download dependency',()=>{assert.match(read('../public/workspace/studio.js'),/KEY='menu-design-draft-v1'/);assert.doesNotMatch(read('../public/workspace/export.js'),/fetch\('\/exports'/);assert.doesNotMatch(read('../index.html'),/59317|docs\/prototypes/);});
test('real AI stays loopback-only and explicit consent is retained',()=>{assert.match(read('../server/codex-bridge.cjs'),/59319/);assert.match(read('../server/codex-bridge.cjs'),/'127.0.0.1'/);assert.match(read('../public/workspace/codex-client.js'),/同意发送并开始/);});
