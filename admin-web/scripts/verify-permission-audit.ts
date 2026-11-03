import assert from 'node:assert/strict';
import {allowedAuditTypes,filterAuditRecords,type AuditRecord} from '../src/permissions/permission-audit-domain';
const record=(type:'m'|'provider',id:string,role:string,at:string):AuditRecord=>({id,type,at,actor:'测试',action:'创建',object:role,before:'{"roles":[]}',after:JSON.stringify({roles:[{id:role}]} )});
const records=[record('m','1','m-role','2026-11-03T01:00:00Z'),record('provider','1','p-role','2026-11-03T02:00:00Z')];
assert.deepEqual(allowedAuditTypes(false,false),[]);
assert.equal(filterAuditRecords(records,allowedAuditTypes(true,false),'all').length,1);
assert.equal(filterAuditRecords(records,allowedAuditTypes(true,false),'provider').length,0);
assert.equal(filterAuditRecords(records,allowedAuditTypes(false,true),'m').length,0);
assert.equal(filterAuditRecords(records,allowedAuditTypes(true,true),'all')[0].type,'provider');
assert.equal(filterAuditRecords(records,['m','provider'],'m','m-role').length,1);
assert.equal(filterAuditRecords(records,['m','provider'],'provider','m-role').length,0);
assert.equal(filterAuditRecords([{...records[0],before:'bad',after:'bad'}],['m'],'m','m-role','m-role').length,1);
assert.equal(filterAuditRecords([{...records[0],before:JSON.stringify({roles:[{id:'m-role'}]}),after:JSON.stringify({roles:[{id:'m-role'}]})}],['m'],'m','m-role').length,0);
console.log('PASS: audit source isolation, denied direct filters, role matching, duplicate IDs and chronological union');

assert.equal(filterAuditRecords([{...records[0],before:JSON.stringify({employees:[{id:'employee',roleIds:['m-role']}]}),after:JSON.stringify({employees:[{id:'employee',roleIds:['m-role','other-role']}]})}],['m'],'m','m-role').length,0);
