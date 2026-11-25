import {roleAccess,type Audit,type CenterState,type Employee,type Resource,type Role,type Store} from './center-domain';
import type {StaffLoginAccount} from './staff-account-store';

const prefix='permission-scene-v1';

const rolePresets=[
  {key:'manager',name:'跨店运营主管'},
  {key:'cashier',name:'门店收银专员',legacyDescription:'演示指定门店的收银角色。',description:'适用于指定门店的收银角色。'},
  {key:'spare',name:'待分配收银角色',legacyDescription:'无成员、未配置门店，可用于分配、复制和删除演示。',description:'暂无成员和授权门店。'},
  {key:'unscoped',name:'待配置门店角色'},
] as const;

const presetPages:Record<string,string[]>={
  manager:['/stores/profile','/orders/all','/reports/revenue'],
  cashier:['/orders/all'],
  spare:['/orders/all'],
  unscoped:['/stores/profile'],
};

function seedRoleMenus(role:Role,key:string,resources:Map<string,Resource>):Role {
  const grants={...role.grants};
  const allow=(resourceKey:string)=>{
    const resource=resources.get(resourceKey);
    if(!resource)return;
    grants[resourceKey]='read';
    for(const parent of [resource.parent,resource.legacyGateKey,...(resource.requires??[])])
      if(parent&&grants[parent]!=='read'&&grants[parent]!=='edit')allow(parent);
    if(resource.settingPageGate&&grants[resource.settingPageGate]===undefined)grants[resource.settingPageGate]='read';
  };
  for(const path of presetPages[key]??[]){
    const page=resources.get('page:'+path);
    if(!page)continue;
    allow(page.key);
    if(page.pageContentKeys?.length)allow(page.pageContentKeys[0]!);
  }
  return {...role,grants};
}

function refreshPresetRoleCopy(state:CenterState,resources:Map<string,Resource>):CenterState {
  const roles=state.roles.map(role=>{
    const preset=rolePresets.find(item=>role.id===prefix+'-'+item.key);
    if(!preset)return role;
    const canRename=role.name==='演示 · '+preset.name&&!state.roles.some(item=>item.id!==role.id&&item.name.trim().toLowerCase()===preset.name.toLowerCase());
    const description='legacyDescription' in preset&&role.description===preset.legacyDescription?preset.description:role.description;
    const hasManualChanges=state.logs.some(log=>log.objectId===role.id&&log.source!=='demo');
    const hasVisiblePage=[...resources.values()].some(resource=>resource.type==='page'&&roleAccess(role,resource.key,resources)!=='hidden');
    const configured=!hasManualChanges&&!hasVisiblePage?seedRoleMenus(role,preset.key,resources):role;
    if(!canRename&&description===role.description&&JSON.stringify(configured.grants)===JSON.stringify(role.grants))return role;
    return {...configured,name:canRename?preset.name:role.name,description};
  });
  return roles.some((role,index)=>role!==state.roles[index])?{...state,roles,version:state.version+1}:state;
}


export function buildDemoScenarios(state:CenterState,stores:Store[],accounts:StaffLoginAccount[],now:Date,resources=new Map<string,Resource>()):{state:CenterState;accounts:StaffLoginAccount[]} {
  const unchanged={state,accounts:[]};
  if(state.demoScenarioSeedVersion===1)return {state:refreshPresetRoleCopy(state,resources),accounts:[]};
  const manager=state.roles.find(role=>role.id==='store-manager');
  const cashier=state.roles.find(role=>role.id==='cashier');
  const primary=stores.find(store=>store.id==='M00000001');
  const secondary=stores.find(store=>store.id==='M00000002');
  const third=stores.find(store=>store.id==='M00000003');
  if(!manager||!cashier||!primary||!secondary||!third)return unchanged;

  const next=structuredClone(state);
  const roles:Role[]=[
    {...structuredClone(manager),id:prefix+'-manager',name:rolePresets[0].name,description:'查看经营与门店配置，适用于已授权门店。',system:false,defaultStoreIds:[primary.id,secondary.id,third.id]},
    {...structuredClone(cashier),id:prefix+'-cashier',name:rolePresets[1].name,description:rolePresets[1].description,system:false,defaultStoreIds:[secondary.id]},
    {...structuredClone(cashier),id:prefix+'-spare',name:rolePresets[2].name,description:rolePresets[2].description,system:false,defaultStoreIds:[]},
    {...structuredClone(cashier),id:prefix+'-unscoped',name:rolePresets[3].name,description:'已分配，配置门店后才在相应门店生效。',system:false,defaultStoreIds:[]},
  ].map((role,index)=>seedRoleMenus(role,rolePresets[index]!.key,resources));
  if(roles.some(role=>state.roles.some(item=>item.id===role.id||item.name===role.name)))return unchanged;
  next.roles.push(...roles);

  const plans:{key:string;name:string;status:Employee['status'];roles:string[];extraStoreIds?:string[]}[]=[
    {key:'operations',name:'演示 · 林晓（跨店运营）',status:'enabled',roles:['manager','cashier'],extraStoreIds:stores.filter(store=>![primary.id,secondary.id,third.id].includes(store.id)).slice(0,2).map(store=>store.id)},
    {key:'cashier',name:'演示 · 周宁（单店收银）',status:'enabled',roles:['cashier']},
    {key:'disabled',name:'演示 · 陈雨（已停用）',status:'disabled',roles:['cashier']},
    {key:'pending',name:'演示 · 许安（待接受邀请）',status:'pending',roles:[]},
    {key:'revoked',name:'演示 · 赵晴（邀请已撤销）',status:'revoked',roles:[]},
    {key:'expired',name:'演示 · 郑可（邀请已过期）',status:'pending',roles:[]},
    {key:'unopened',name:'演示 · 宋雨（未开通）',status:'unopened',roles:['unscoped']},
    {key:'unassigned',name:'演示 · 罗佳（未分配角色）',status:'enabled',roles:[]},
  ];
  const additions:StaffLoginAccount[]=[];
  const events:Audit[]=[];
  function event(key:string,objectId:string,action:string,before:unknown,after:unknown):void {
    events.push({id:prefix+'-log-'+key,source:'demo',at:new Date(now.getTime()-60000*(events.length+1)).toISOString(),actor:'演示管理员',objectId,action:action+'（演示）',before:JSON.stringify(before),after:JSON.stringify(after)});
  }
  for(const role of roles){
    if(role.defaultStoreIds?.length)event(role.id,role.id,'更新角色授权门店',{...role,defaultStoreIds:[]},role);
    else event(role.id,role.id,'新增角色',null,role);
  }
  for(const plan of plans){
    const id=prefix+'-'+plan.key;
    const email=plan.status==='unopened'?'':`permission.demo.${plan.key}@menusifu.cn`;
    if(next.employees.some(item=>item.id===id||item.name===plan.name||(email&&item.email.toLowerCase()===email)))continue;
    if(accounts.some(account=>account.id===id||account.employeeId===id||account.loginEmail.toLowerCase()===email))continue;
    const employee:Employee={id,name:plan.name,email,status:plan.status,bindings:plan.roles.map(role=>({id:id+'-'+role,roleId:prefix+'-'+role,scope:{mode:'stores',ids:[]}})),overrides:{},extraStoreIds:plan.extraStoreIds};
    next.employees.push(employee);
    if(email){
      const invited=plan.status==='pending'||plan.status==='revoked';
      additions.push({id,employeeId:id,employeeName:plan.name,loginEmail:email,password:crypto.randomUUID(),enabled:plan.status==='enabled',openedVia:invited?'email':'password',updatedAt:now.toISOString(),...(invited?{invitation:{sentAt:new Date(now.getTime()-(plan.key==='expired'?73*60*60*1000:0)).toISOString(),expiresAt:new Date(now.getTime()+(plan.key==='expired'?-1:72)*60*60*1000).toISOString(),revoked:plan.status==='revoked'}}:{})});
    }
    if(employee.bindings.length)event(plan.key+'-assignment',id,'分配员工角色',{...employee,bindings:[]},employee);
    if(employee.extraStoreIds?.length)event(plan.key+'-extra',id,'更新额外授权门店',{...employee,extraStoreIds:[]},employee);
    if(plan.status==='disabled')event(plan.key,id,'停用账号',{...employee,status:'enabled'},employee);
    if(plan.status==='pending'||plan.status==='revoked')event(plan.key,id,plan.status==='pending'?'创建演示邀请':'撤销邀请',{...employee,status:plan.status==='pending'?'unopened':'pending'},employee);
  }
  next.demoScenarioSeedVersion=1;
  next.version++;
  next.logs=[...state.logs.filter(log=>log.source!=='demo'),...events,...state.logs.filter(log=>log.source==='demo')];
  return {state:next,accounts:additions};
}
