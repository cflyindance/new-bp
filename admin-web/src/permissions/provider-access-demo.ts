import type { Resource, Role } from './center-domain';
import type { ProviderAccessState } from './provider-access-domain';
/** Unbound demo fixtures. Existing authorization data never passes through this factory. */
export function createProviderDemoState(resources: Map<string, Resource>): ProviderAccessState {
  const roles: Role[] = [['orders','演示·订单查看员'],['finance','演示·财务查看员'],['dashboard','演示·经营概览查看员']].map(([module,name]) => {
    const inModule = (r:Resource):boolean => {
      const seen=new Set<string>();
      while(!seen.has(r.key)) {
        if(r.key==='module:'+module)return true;
        seen.add(r.key);const parent=r.parent&&resources.get(r.parent);if(!parent)return false;r=parent;
      }
      return false;
    };
    return {id:'provider-demo-'+module,name,description:'预设测试数据，仅用于界面演示；未关联员工。',system:false,
      grants:Object.fromEntries([...resources.values()].filter(r=>!['action','setting'].includes(r.type)&&!r.compatibilityOnly&&inModule(r)).map(r=>[r.key,'read' as const]))};
  });
  return {schema:1,revision:0,systemEmployeeIds:['ent001'],employees:[],roles,
    logs:roles.map((role,index)=>({id:'provider-demo-log-'+index,at:`2026-11-03T0${9-index}:00:00+08:00`,actor:'演示数据（非真实操作人）',action:'演示：预设访问角色',object:role.name,before:JSON.stringify({roles:[],employees:[]}),after:JSON.stringify({roles:[role],employees:[]})}))};
}

/** Existing snapshots, including deliberate empty lists, always win. Never write or repair storage here. */
export function providerStateFromStorage(raw:string|null,resources:()=>Map<string,Resource>):ProviderAccessState {
  return raw===null?createProviderDemoState(resources()):JSON.parse(raw);
}
