import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
const base=new URL('../dist/Configuration center/',import.meta.url);
const w={};runInNewContext(readFileSync(new URL('assets/kiosk-theme-display-positions.js',base),'utf8'),{window:w});
for(const [position,role,width,height] of [['home','portrait',1080,1250],['home','landscape',1440,1080],['screensaver','portrait',1080,1920],['screensaver','landscape',1920,1080]]){
 const spec=w.KioskThemePositions.mediaSpec(position,role);assert.equal(spec.width,width);assert.equal(spec.height,height);
}
for(const name of ['screensaver-create.html','screensaver-edit.html','channel-select.html','store-select.html','effective-time.html']){
 const html=readFileSync(new URL(name,base),'utf8');for(const [,code] of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new Script(code,{filename:name});
}
new Script(readFileSync(new URL('assets/kiosk-theme-position-editor.js',base),'utf8'));
console.log('PASS four position/orientation dimensions and all changed inline JavaScript syntax');
