import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {menuDesignDownloads} from '../server/export-downloads.mjs';
function request(method,url,headers={}){const req=Object.assign(new EventEmitter(),{method,url,headers:{host:'localhost:5173',origin:'http://localhost:5173',...headers}});const res={writableEnded:false,writeHead(code,headers){this.code=code;this.headers=headers},end(body){this.body=body;this.writableEnded=true}};let passed=false;menuDesignDownloads(req,res,()=>{passed=true});return {req,res,passed};}
test('local export can be uploaded and downloaded with attachment headers',()=>{const {req,res}=request('POST','/menu-design/exports',{'content-type':'application/pdf','x-menu-filename':encodeURIComponent('菜单.pdf')});req.emit('data',Buffer.from('%PDF-1.4 test'));req.emit('end');assert.equal(res.code,200);const result=request('GET',JSON.parse(res.body).url);assert.equal(result.res.code,200);assert.match(result.res.headers['Content-Disposition'],/attachment/);assert.equal(result.res.body.toString(),'%PDF-1.4 test');});
test('cross-origin or non-local hosts cannot use download API',()=>{assert.equal(request('POST','/menu-design/exports',{origin:'https://example.com'}).res.code,403);assert.equal(request('POST','/menu-design/exports',{host:'example.com'}).res.code,403);});
test('missing files are explicit and unrelated routes fall through',()=>{assert.equal(request('GET','/menu-design/exports/missing').res.code,404);assert.equal(request('GET','/another-product').passed,true);});
