import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync('src/permissions/center-ui.ts','utf8');
const assign=ui.split('\n').find(line=>line.includes("modal('确认分配角色'"))!;
assert(assign.includes("},'确定')"));
assert(!assign.includes("},'加入草稿')"));
assert(assign.includes('确认后加入草稿，保存员工详情后生效。'));
assert(assign.includes('employee()!.bindings.push(')&&assign.includes('mark();render();return true;'));
console.log('PASS assignment confirm label: 确定; existing draft, save and binding semantics retained');
