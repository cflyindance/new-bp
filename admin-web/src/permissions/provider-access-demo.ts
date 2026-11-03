import type { Resource, Role } from './center-domain';
import type { ProviderAccessState, ProviderEmployee, ProviderScope } from './provider-access-domain';
export interface ProviderDemoTargets {brandIds:string[];storeIds:string[];employees:{id:string;name:string}[]}
/** Explicit demo directory only. Existing authorization data never passes through this factory. */
export function createProviderDemoState(resources: Map<string, Resource>,targets?:ProviderDemoTargets): ProviderAccessState {
  const roles: Role[] = [['orders','演示·订单查看员'],['finance','演示·财务查看员'],['dashboard','演示·经营概览查看员'],['store-mgmt','演示·门店运营员']].map(([module,name]) => {
    const inModule = (r:Resource):boolean => {
      const seen=new Set<string>();
      while(!seen.has(r.key)) {
        if(r.key==='module:'+module)return true;
        seen.add(r.key);const parent=r.parent&&resources.get(r.parent);if(!parent)return false;r=parent;
      }
      return false;
    };
    return {id:'provider-demo-'+module,name,description:module==='store-mgmt'?'预设测试数据，用于演示门店信息查看、设置和操作。':'预设测试数据，仅用于演示查看权限与员工访问范围。',system:false,
      grants:Object.fromEntries([...resources.values()].filter(r=>(module==='store-mgmt'||!['action','setting'].includes(r.type))&&!r.compatibilityOnly&&inModule(r)).map(r=>[r.key,module==='store-mgmt'&&['action','setting'].includes(r.type)?'edit' as const:'read' as const]))};
  });
  roles.push({id:'provider-demo-unused',name:'演示·未关联角色（可删除）',description:'未绑定员工，可用于编辑、复制、删除及空权限预览。',system:false,grants:{}});
  const employees:ProviderEmployee[]=[];
  const add=(id:string,roleId:string,scope:ProviderScope)=>{
    if(!targets?.employees.some(e=>e.id===id)||!scope.ids.length)return;
    let employee=employees.find(e=>e.employeeId===id);if(!employee){employee={employeeId:id,bindings:[]};employees.push(employee);}
    employee.bindings.push({id:'provider-demo-binding-'+id+'-'+roleId,roleId,scope});
  };
  if(targets){
    add('ent002','provider-demo-dashboard',{mode:'brands',ids:targets.brandIds.slice(0,1)});
    add('ent003','provider-demo-orders',{mode:'stores',ids:targets.storeIds.slice(0,2)});
    add('ent004','provider-demo-finance',{mode:'brands',ids:targets.brandIds.slice(1,2)});
    add('ent002','provider-demo-store-mgmt',{mode:'stores',ids:targets.storeIds.slice(0,1)});
    add('demo-permission-disabled','provider-demo-store-mgmt',{mode:'stores',ids:targets.storeIds.slice(0,1)});
  }
  const bindingLogs=employees.map((employee,index)=>({id:'provider-demo-log-binding-'+employee.employeeId,at:`2026-11-03T10:0${index+1}:00+08:00`,actor:'演示数据（非真实操作人）',action:'演示：预设商户访问授权',object:(targets?.employees.find(e=>e.id===employee.employeeId)?.name??employee.employeeId)+' · '+employee.employeeId,before:JSON.stringify({roles,employees:employees.slice(0,index)}),after:JSON.stringify({roles,employees:employees.slice(0,index+1)})})).reverse();
  return {schema:1,revision:0,systemEmployeeIds:['ent001'],employees,roles,
    logs:[...bindingLogs,...roles.map((role,index)=>({id:'provider-demo-log-'+index,at:`2026-11-03T0${9-index}:00:00+08:00`,actor:'演示数据（非真实操作人）',action:'演示：预设访问角色',object:role.name,before:JSON.stringify({roles:[],employees:[]}),after:JSON.stringify({roles:[role],employees:[]})}))]};
}

/** Existing snapshots, including deliberate empty lists, always win. Never write or repair storage here. */
export function providerStateFromStorage(raw:string|null,resources:()=>Map<string,Resource>,targets?:()=>ProviderDemoTargets):ProviderAccessState {
  return raw===null?createProviderDemoState(resources(),targets?.()):JSON.parse(raw);
}
