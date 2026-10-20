import type {Audit,CenterState,Employee,Store} from './center-domain';

const plans=[
  {id:'e001',name:'王小明',email:'xiaoming.wang@menusifu.cn',roles:['store-manager'],scenario:'single-store'},
  {id:'e002',name:'李收银',email:'cashier.li@menusifu.cn',roles:['cashier'],scenario:'multi-store'},
  {id:'e003',name:'张楼面',email:'floor.zhang@menusifu.cn',roles:['floor-staff','cashier'],scenario:'split-roles'},
] as const;
/** Initialize only untouched, recognizable demo assignments. Never repair legacy deny/review gates. */
export function seedDemoBindings(state:CenterState,stores:Store[],defaultStoreId:string):CenterState {
  if(state.demoBindingsSeedVersion===1)return state;
  if(state.demoBindingsSeedVersion!==undefined)throw Error('演示门店授权版本无法读取，原数据已保留');
  const next=structuredClone(state),events:Audit[]=[];
  const primary=stores.find(s=>s.id===defaultStoreId);
  const secondary=primary?stores.find(s=>s.id!==primary.id&&s.brand===primary.brand):undefined;
  for(const plan of plans){
    const employee=next.employees.find(e=>e.id===plan.id);
    if(!employee||!primary||employee.name!==plan.name||employee.email!==plan.email||employee.status!=='enabled'||employee.migrationReview||Object.keys(employee.overrides).length)continue;
    if(!plan.roles.every(id=>state.roles.some(r=>r.id===id)))continue;
    if(state.logs.some(l=>l.source!=='demo'&&(l.objectId===plan.id||plan.roles.some(id=>id===l.objectId))))continue;
    if(employee.bindings.length!==plan.roles.length||!plan.roles.every(roleId=>employee.bindings.filter(b=>b.roleId===roleId&&b.scope.mode==='stores'&&b.scope.ids.length===1&&b.scope.ids[0]===primary.id).length===1))continue;
    if(plan.scenario!=='single-store'&&!secondary)continue;
    const before:Employee=structuredClone(employee);
    if(plan.scenario==='multi-store')employee.bindings[0].scope.ids.push(secondary!.id);
    if(plan.scenario==='split-roles')employee.bindings.find(b=>b.roleId==='cashier')!.scope={mode:'stores',ids:[secondary!.id]};
    employee.demoAuthorization=plan.scenario;
    if(JSON.stringify(before.bindings)!==JSON.stringify(employee.bindings))events.push({id:`permission-demo-bindings-v1:${plan.id}`,source:'demo',at:'2026-10-20T00:00:00.000Z',actor:'演示管理员',objectId:plan.id,action:'更新员工授权（演示）',before:JSON.stringify(before),after:JSON.stringify(employee)});
  }
  const ids=new Set(state.logs.map(l=>l.id));
  next.logs=[...state.logs.filter(l=>l.source!=='demo'),...events.filter(l=>!ids.has(l.id)),...state.logs.filter(l=>l.source==='demo')];
  next.demoBindingsSeedVersion=1;next.version=state.version+1;
  return next;
}
