import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/team/tips/programs/rule-editor.js.txt','utf8');
const clock={clock:{value:'clock',checked:true},unrestricted:{value:'unrestricted'},time_window:{value:'time_window'}};
const scopes=[{value:'day',checked:true},{value:'time_window'}], elements={dailyParticipationSection:{},allocationScopeTimeNotice:{}};
const ctx={document:{querySelector(s){if(s.includes('allocationScope'))return scopes.find(x=>x.checked);if(s.includes(':checked'))return Object.values(clock).find(x=>x.checked);return clock[s.match(/value="([^"]+)"/)[1]];},querySelectorAll(s){return s.includes('allocationScope')?scopes:[];},getElementById(id){return elements[id];}},updateDistributionOptions(){ctx.syncAllocationScopeUi();}};
// Radio setters in a browser automatically uncheck other members of the group.
for(const radio of Object.values(clock)){let checked=radio.checked;Object.defineProperty(radio,'checked',{get(){return checked;},set(v){if(v)for(const other of Object.values(clock))if(other!==radio)other.checked=false;checked=v;}});}
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('    var dailyParticipationDraft'),source.indexOf('    var legacyTimeWindowHoursCap')),ctx);
ctx.syncAllocationScopeUi();assert.equal(elements.dailyParticipationSection.hidden,false);
clock.unrestricted.checked=true;ctx.syncAllocationScopeUi();
scopes[0].checked=false;scopes[1].checked=true;ctx.changeAllocationScope();assert.equal(clock.time_window.checked,true);assert.equal(elements.dailyParticipationSection.hidden,true);
scopes[1].checked=false;scopes[0].checked=true;ctx.changeAllocationScope();assert.equal(clock.unrestricted.checked,true);assert.equal(elements.dailyParticipationSection.hidden,false);
clock.time_window.checked=true;ctx.syncAllocationScopeUi();assert.equal(scopes[1].checked,true);
console.log('PASS allocation scope: default, time-window mapping, eligibility visibility, daily draft restoration and existing rule loading');
