export interface BrandMenuScene {label:string;categories:string[];modes:string[];org:'single'|'chain'}
export interface BrandMenuSceneOptions {read:()=>BrandMenuScene;edit:()=>void}
/** Existing brand business IDs remain authoritative; aliases only match templates. */
export function resolveBrandMenuScene(ids:string[],labels:Array<{id:string;label:string}>,org:'single'|'chain'='chain'):BrandMenuScene {
 const service:Record<string,string|undefined>={'fast-food':'fast','delivery-only':'delivery','casual-dining':'dining','full-meal':'dining','full-service':undefined};
 const selected=labels.filter(b=>ids.includes(b.id)),ordered=[...selected.filter(b=>!Object.hasOwn(service,b.id)),...selected.filter(b=>Object.hasOwn(service,b.id))];
 return {label:(ordered.map(b=>b.label).join(' · ')||'尚未选择业态')+' · '+(org==='chain'?'连锁':'单店'),categories:[...new Set(ids.filter(id=>!Object.hasOwn(service,id)).map(id=>id==='tea-drinks'?'tea':id))],modes:[...new Set(ids.map(id=>service[id]).filter((v):v is string=>!!v))],org};
}
export function matchesBrandMenuScene(template:{category:string;mode:string;org:string},scene:BrandMenuScene):boolean {
 return template.org===scene.org&&(!scene.categories.length||scene.categories.includes(template.category))&&(!scene.modes.length||scene.modes.includes(template.mode));
}
