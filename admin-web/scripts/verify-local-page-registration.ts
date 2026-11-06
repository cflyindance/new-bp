import assert from 'node:assert/strict';
import { buildLocalPageRegistration, readLocalPageRegistrations, saveLocalPageRegistration, LOCAL_PAGE_REGISTRATIONS_KEY } from '../src/config/local-page-registration';
import type { PageRegistration } from '../src/config/page-registration-domain';

const data = new Map<string, string>();
const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
const base = { id: 'local.products', title: '本地商品', module: '商品中心', type: 'inner', path: '/local-products' };
const builtIn: PageRegistration[] = [{ id: 'builtin', title: '内置', module: '基础', status: 'active', source: 'code', routing: { type: 'inner', path: '/builtin' } }];
assert.deepEqual(readLocalPageRegistrations(builtIn).pages, []);
assert.deepEqual(readLocalPageRegistrations(builtIn, storage).pages, []);
const saved = saveLocalPageRegistration(base, builtIn, storage);
assert.equal(saved.status, 'active');
assert.equal(readLocalPageRegistrations(builtIn, storage).pages[0].id, base.id);
assert.throws(() => saveLocalPageRegistration({ ...base, path: '/second' }, builtIn, storage), /标识.*重复/);
assert.throws(() => saveLocalPageRegistration({ ...base, id: 'another' }, builtIn, storage), /路由.*重复/);
assert.throws(() => saveLocalPageRegistration({ ...base, id: 'builtin' }, builtIn, storage), /标识.*重复/);
assert.throws(() => saveLocalPageRegistration({ ...base, id: 'new', path: '/builtin' }, builtIn, storage), /路由.*重复/);
assert.throws(() => buildLocalPageRegistration({ ...base, type: 'script' }), /类型/);
assert.throws(() => buildLocalPageRegistration({ ...base, path: 'invalid' }), /路由/);
assert.throws(() => buildLocalPageRegistration({ ...base, title: ' ' }), /名称/);
for (const type of ['iframe', 'external']) {
  assert.throws(() => buildLocalPageRegistration({ ...base, type, url: 'javascript:alert(1)' }), /HTTP/);
  assert.equal(buildLocalPageRegistration({ ...base, type, url: 'https://example.com/app' }).routing.url, 'https://example.com/app');
}
assert.throws(() => buildLocalPageRegistration({ ...base, type: 'micro-app' }), /微应用/);
assert.equal(buildLocalPageRegistration({ ...base, type: 'micro-app', microName: 'app', microUrl: 'https://example.com/app' }).routing.microAppConfig?.name, 'app');
assert.equal(buildLocalPageRegistration({ ...base, titleEn: ' Products ', url: 'https://unused.example' }).titleEn, 'Products');
assert.equal(buildLocalPageRegistration({ ...base, url: 'https://unused.example' }).routing.url, undefined);
const before = data.get(LOCAL_PAGE_REGISTRATIONS_KEY);
assert.throws(() => saveLocalPageRegistration({ ...base, id: 'quota', path: '/quota' }, builtIn, { ...storage, setItem: () => { throw new Error('quota'); } }), /本地保存失败/);
assert.equal(data.get(LOCAL_PAGE_REGISTRATIONS_KEY), before);
for (const invalid of ['', 'not json', '{"version":2,"pages":[]}', '{"version":1,"pages":[null]}']) {
  data.set(LOCAL_PAGE_REGISTRATIONS_KEY, invalid);
  assert.match(readLocalPageRegistrations(builtIn, storage).error ?? '', /不可读取/);
  assert.throws(() => saveLocalPageRegistration(base, builtIn, storage), /不可读取/);
  assert.equal(data.get(LOCAL_PAGE_REGISTRATIONS_KEY), invalid);
}
data.set(LOCAL_PAGE_REGISTRATIONS_KEY, before!);
assert.match(readLocalPageRegistrations([...builtIn, { ...saved, source: 'code' }], storage).error ?? '', /不可读取/);
assert.match(readLocalPageRegistrations(builtIn, { getItem: () => { throw new Error('denied'); }, setItem: () => {} }).error ?? '', /不可读取/);
console.log('PASS local page registration: persistence, four types, duplicates, no overwrite, corrupt/blocked/quota storage, fixed metadata');
