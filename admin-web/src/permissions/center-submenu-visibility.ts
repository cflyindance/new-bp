import type {Catalog} from './center-catalog';
import {roleAccess,type Role,type Resource} from './center-domain';
import {applyResourceGrant} from './center-employee-pages';

/** Explicit menu choice, using the existing grants only; failures never publish a partial edit. */
export function applySubmenuVisibility(c:Catalog,role:Role,parent:string,key:string,value:'hidden'|'read'):boolean {
  if(value!=='hidden'&&value!=='read')throw Error('子导航状态无效');
  const resource=c.resources.get(key);
  if(!resource||resource.parent!==parent||resource.compatibilityOnly||!['page','navigation','module'].includes(resource.type))throw Error('请选择当前目录的子导航');
  if(value==='read'&&roleAccess(role,parent,c.resources)==='hidden')throw Error('上级导航不可见，不能开启子导航');
  const visible=roleAccess(role,key,c.resources)!=='hidden';
  if(visible===(value==='read'))return false;
  const next={...role.grants},candidate={...role,grants:next};
  const effective=(k:string)=>roleAccess(candidate,k,c.resources);
  if(resource.type!=='page')applyResourceGrant(next,resource,value);
  else {
    // Keep saved content/action decisions when hiding; reopening first tries that same configuration.
    next[key]=value;
    if(value==='read'){
      const hasSavedAllow=(r:Resource|undefined,seen=new Set<string>()):boolean=>{
        if(!r||seen.has(r.key))return false;seen.add(r.key);
        const raw=role.grants[r.key];
        if(raw!==undefined)return raw!=='hidden';
        return r.inheritFrom?hasSavedAllow(c.resources.get(r.inheritFrom),seen):false;
      };
      const gate=resource.settingPageGate?c.resources.get(resource.settingPageGate):undefined;
      // New settings menus must not inherit the legacy editable default on first enable.
      if(gate&&(!(resource.pageContentKeys??[]).some(k=>hasSavedAllow(c.resources.get(k)))||effective(gate.key)==='hidden'))applyResourceGrant(next,gate,'read');
      if(effective(key)==='hidden')for(const coreKey of resource.pageContentKeys??[]){
        const core=c.resources.get(coreKey);if(!core||!['content','setting','page'].includes(core.type))continue;
        const trial={...next};
        for(const k of [core.key,...(core.relatedGrantKeys??[])]){
          const r=c.resources.get(k);if(!r||r.type==='action')continue;
          for(const cap of r.ceilingKeys??[])if((cap===resource.settingPageGate||cap.startsWith('setting-category:'+key+':'))&&effective(cap)==='hidden'){
            const ceiling=c.resources.get(cap);if(ceiling)applyResourceGrant(trial,ceiling,'read');
          }
          applyResourceGrant(trial,r,'read');
        }
        if(roleAccess({...role,grants:trial},key,c.resources)!=='hidden'){Object.assign(next,trial);break;}
      }
    }
  }
  if(value==='read'&&effective(key)==='hidden')throw Error('该页面仍受权限限制，请进入配置权限处理');
  role.grants=next;return true;
}
