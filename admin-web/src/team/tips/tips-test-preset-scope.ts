import raw from './test-presets/catalog.json?raw';
export interface TipoutTestCase { id: string; group: string; title: string; expected: string }
export const TIPOUT_TEST_CATALOG: TipoutTestCase[] = JSON.parse(raw);
export function testPresetStoreName(id: string): string {
  const c=TIPOUT_TEST_CATALOG.find(c=>c.id===id);if(!c)throw new Error('未知小费测试预设');
  return `【小费测试】${({C:'规则',S:'状态',E:'异常'} as Record<string,string>)[c.group]} ${id} ${c.title}`;
}
// Explicit local test view only. It replaces this page's options; it never alters business permissions.
export function readTestPresetStores(query: string, storage: Pick<Storage,'getItem'> = localStorage) {
  const p=new URLSearchParams(query),store=p.get('store');
  const selected=TIPOUT_TEST_CATALOG.find(c=>testPresetStoreName(c.id)===store);
  if(p.get('testPresets')!=='1'&&!selected)return null;
  try {
    const manifest=JSON.parse(storage.getItem('tipout-test-presets-v1')||'{}');
    if(manifest.version!==1||!manifest.cases||typeof manifest.cases!=='object')return [];
    return TIPOUT_TEST_CATALOG.filter(c=>manifest.cases[c.id]&&(!selected||c.id===selected.id)&&(!p.get('testGroup')||c.group===p.get('testGroup'))&&(!p.get('testCase')||c.id===p.get('testCase')))
      .map(c=>({value:testPresetStoreName(c.id),labelZh:testPresetStoreName(c.id),labelEn:testPresetStoreName(c.id)}));
  } catch { return []; }
}
