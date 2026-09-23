import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {handlePayrollMockApi} from './lib/payroll-mock-api-handler.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'payroll-revision-'));
const db=path.join(dir,'state.json');
async function request(method,body,revision){
  const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);
  req.method=method;req.url='/api/v1/payroll/state';req.headers=revision===undefined?{}:{'if-match':String(revision)};
  let result;
  const res={statusCode:200,setHeader(){},end(text){result={status:this.statusCode,body:JSON.parse(text)}}};
  await handlePayrollMockApi(req,res,db);return result;
}
const one=await request('PUT',{data:{periods:[],employees:{},auditLog:[]}},0);
assert.equal(one.status,200);assert.equal(one.body.revision,1);
const stale=await request('PUT',{data:{lost:true}},0);assert.equal(stale.status,409);
const blind=await request('PUT',{data:{lost:true}});assert.equal(blind.status,428);
const read=await request('GET');assert.equal(read.body.revision,1);assert.equal(read.body.data.lost,undefined);
const results=await Promise.all([request('PUT',{data:{winner:1}},1),request('PUT',{data:{winner:2}},1)]);
assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
assert.equal((await request('GET')).body.revision,2);
console.log('Payroll revision concurrency passed');
