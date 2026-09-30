import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import vm from 'node:vm';

function setup() {
  const channels=[];
  class Channel {
    constructor(name){this.name=name;channels.push(this);}
    postMessage(data){for(const other of channels)if(other!==this&&other.name===this.name&&!other.closed)queueMicrotask(()=>other.onmessage?.({data}));}
    close(){this.closed=true;}
  }
  const context=vm.createContext({URL,BroadcastChannel:Channel,crypto:{randomUUID:()=> 'test-session'},setTimeout,clearTimeout,module:{exports:{}}});
  vm.runInContext(transformSync(readFileSync(new URL('../../../src/auth/menu-session-bridge.ts',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code,context);
  return context.module.exports;
}
test('authenticated source can hand off its current identity without exposing it in URL',async()=>{
  const api=setup();const url=api.createMenuSessionLink('http://localhost/menu-design/',()=> 'user@menusifu.com');
  assert.equal(url.includes('user@'),false);
  assert.equal(await api.requestMenuSession(url,30),'user@menusifu.com');
});
test('logout or restricted source is checked at return time, not launch time',async()=>{
  const api=setup();let email='user@menusifu.com';const url=api.createMenuSessionLink('http://localhost/menu-design/',()=>email);
  email=null;assert.equal(await api.requestMenuSession(url,30),null);
});
test('direct anonymous entry and missing source never authenticate',async()=>{
  const api=setup();assert.equal(await api.requestMenuSession('http://localhost/menu-design/',10),null);
  assert.equal(await api.requestMenuSession('http://localhost/menu-design/?menuSession=missing',10),null);
});
