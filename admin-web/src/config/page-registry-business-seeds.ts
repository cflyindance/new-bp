import { NAV_MODULES, PROMOTIONS_MGMT_SUBNAV, MEMBERS_SHEET_SUBNAV, MEMBERS_SHEET_SETTINGS_SUBNAV } from './navigation';
import type { RegistryWorkspace } from './page-registry-projects';
type Item = { title: string; path: string; children?: readonly Item[]; sidebarChildren?: readonly Item[] };
export function seedBusinessRegistries(workspace: RegistryWorkspace): RegistryWorkspace {
  const next = structuredClone(workspace);
  for (const [key,name] of [['promotions','促销中心'],['members','会员中心'],['transactions','支付中心'],['orders','订单中心']] as const) {
    const projectId=`registry-test-${key}`;
    if(next.projects.some(p=>p.id===projectId||p.name===name))continue;
    const module=NAV_MODULES.find(m=>m.id===key);
    if(!module)continue;
    const base=`/__registry-test/${key}`;
    next.projects.push({id:projectId,name,microName:`${key}-demo`,microUrl:`https://example.com/${key}-demo`,microRoute:base});
    const source:readonly Item[]=key==='promotions'?PROMOTIONS_MGMT_SUBNAV:key==='members'?[...MEMBERS_SHEET_SUBNAV,...MEMBERS_SHEET_SETTINGS_SUBNAV]:module.children??[];
    function add(items:readonly Item[],parentId:string|null,prefix:string):void {
      items.forEach((item,index)=>{
        const id=`${prefix}-${index}`,children=item.sidebarChildren??item.children??[];
        const pageId=children.length?undefined:`${id}-page`;
        next.directories.push({id,name:item.title,projectId,parentId,...(pageId?{pageId}:{})});
        if(pageId){next.pages.push({id:pageId,title:item.title,module:name,status:'active',source:'本地注册（当前浏览器）',routing:{type:'micro-app',path:`${base}${item.path}`,microAppConfig:{name:`${key}-demo`,url:`https://example.com/${key}-demo`,path:base}}});next.assignments.push({pageId,projectId,directoryId:parentId});}
        add(children,id,id);
      });
    }
    add(source,null,projectId);
  }
  return next;
}
