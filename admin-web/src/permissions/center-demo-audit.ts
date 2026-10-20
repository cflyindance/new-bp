import type {Audit,CenterState,Employee,Store} from './center-domain';

const presetIds=['e001','e002','e003','hq001','zj-hq001','zj-brand-ops','zj-brand-single'];
/** Fictitious examples only. Snapshots never become active employee or role state. */
export function seedDemoAudit(state:CenterState,stores:Store[]):CenterState {
  if(state.demoAuditSeedVersion===1)return state;
  if(state.demoAuditSeedVersion!==undefined)throw Error('演示变更记录版本无法读取，原数据已保留');
  const logs:Audit[]=[];
  for(const [index,id] of presetIds.entries()){
    const employee=state.employees.find(e=>e.id===id);if(!employee)continue;
    let step=0;
    const emit=(scenario:string,action:string,before:Employee,after:Employee)=>{
      logs.push({id:`permission-demo-audit-v1:${id}:${scenario}`,source:'demo',at:new Date(Date.UTC(2026,9,19,1+index,step++)).toISOString(),actor:'演示管理员',objectId:id,action:action+'（演示）',before:JSON.stringify(before),after:JSON.stringify(after)});
    };
    const assigned=structuredClone(employee);
    let binding=assigned.bindings.find(b=>b.scope.mode==='stores'&&b.scope.ids.length&&state.roles.some(r=>r.id===b.roleId));
    let synthetic=false;
    if(!binding&&state.roles.length&&stores.length){binding={id:`demo-binding:${id}`,roleId:state.roles[0].id,scope:{mode:'stores',ids:[stores[0].id]}};assigned.bindings.push(binding);synthetic=true;}
    if(binding){
      const before=structuredClone(assigned);before.bindings=before.bindings.filter(b=>b.id!==binding!.id);
      emit('assign','分配角色',before,assigned);
      const additional=stores.find(s=>!binding!.scope.ids.includes(s.id));
      if(additional){const expanded=structuredClone(assigned);expanded.bindings.find(b=>b.id===binding!.id)!.scope.ids.push(additional.id);emit('store-add','新增授权门店',assigned,expanded);emit('store-remove','移除授权门店',expanded,assigned);}
      if(synthetic)emit('unbind','解除角色',assigned,employee);
    }
    if(employee.status==='enabled'||employee.status==='disabled'){
      const toggled=structuredClone(employee);toggled.status=employee.status==='enabled'?'disabled':'enabled';
      emit('account-toggle',toggled.status==='enabled'?'启用账号':'停用账号',employee,toggled);
      emit('account-restore',employee.status==='enabled'?'启用账号':'停用账号',toggled,employee);
    }else if(employee.status==='pending'){
      const before=structuredClone(employee);before.status='unopened';emit('invite','记录邀请',before,employee);
    }
  }
  const existingIds=new Set(state.logs.map(l=>l.id));
  return {...state,demoAuditSeedVersion:1,version:state.version+1,logs:[...state.logs,...logs.filter(l=>!existingIds.has(l.id)).sort((a,b)=>b.at.localeCompare(a.at))]};
}
