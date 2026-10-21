import { buildMerchantServiceTreeIndex, resolveMerchantServiceProductLine } from './enterprise-merchant-services';
export interface MenuChoice {key:string;title:string;parent?:string;path?:string;level:number;kind:'menu'|'setting';isPage?:boolean}
export function brandMenuChoices(productLines: string[] = ['pos']): MenuChoice[] {
  const choices = new Map<string,MenuChoice>();
  for (const pl of productLines) {
    const index = buildMerchantServiceTreeIndex(resolveMerchantServiceProductLine([pl]));
    const visit = (node: typeof index.groups[number]['tree'],depth=1) => {
      const r=node.resource;
      if (r.actionId) return;
      const title=r.title;
      choices.set(r.key,{key:r.key,title,parent:r.parentKey,path:r.path,level:depth,kind:r.seq!=null?'setting':'menu',isPage:r.seq==null&&!r.groupKey&&(r.customL3MountKind==='page'||r.customL2MountKind==='page'||r.level===2&&r.customL2MountKind!=='features')});
      node.children.forEach(child=>visit(child,depth+1));
    };
    index.groups.forEach(g=>visit(g.tree));
  }
  return [...choices.values()];
}
