import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/team/tips/legacy/ruleData.js.txt', 'utf8');
const legacyRules = [
  {id:1,ruleName:'Tip Pool — Server & Bartender to Busser',store:'Golden Dragon Chinese Kitchen - Dallas, TX 75231'},
  {id:2,ruleName:'Tip Pool — 多角色分配（打卡按工时）',store:'Sakura Sushi & Ramen House - Dallas, TX 75247'},
  {id:3,ruleName:'Tip Pool — Server to Busser/Runner',store:'El Fuego Tex-Mex Grill - Plano, TX 75074'},
  {id:4,ruleName:'Bar Tip Pool',store:'Golden Dragon Chinese Kitchen - Dallas, TX 75231'}
];

function load(initialRules) {
  const storage = new Map();
  if (initialRules) storage.set('tipout_rules', JSON.stringify(initialRules));
  const context = {window:{},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))}};
  context.window = context;
  vm.runInNewContext(source, context);
  return {rules:JSON.parse(JSON.stringify(context.ruleData.getRules())),storage};
}

const fresh = load();
assert.deepEqual(fresh.rules.map(rule=>rule.id),[5],'fresh data must only seed the retained Golden Dragon clock-hours rule');

const custom = {id:99,ruleName:'Custom Pool',store:'Golden Dragon Chinese Kitchen - Dallas, TX 75231'};
const sameIdCustom = {id:1,ruleName:'User Rule',store:'User Store'};
const persisted = load([...legacyRules,custom,sameIdCustom]);
assert.deepEqual(persisted.rules.map(rule=>rule.ruleName),['Custom Pool','User Rule']);
assert.deepEqual(JSON.parse(persisted.storage.get('tipout_rules')).map(rule=>rule.ruleName),['Custom Pool','User Rule'],'storage migration must persist removal');

console.log('PASS: legacy built-in rules removed without deleting user rules');
