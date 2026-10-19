import { validateRole, type CenterState, type Resource } from './center-domain';
export function validateCenterState(state:CenterState,resources:Map<string,Resource>):void {
  if(state.employeeAuthorization!==undefined&&state.employeeAuthorization!=='roles-only')throw Error('员工角色授权模式无效');
  if(state.navigationVersion!==undefined&&state.navigationVersion!==1)throw Error('导航权限数据版本无效');
  const unique=(ids:string[])=>new Set(ids).size===ids.length;
  if(!unique(state.roles.map(r=>r.id))||!unique(state.employees.map(e=>e.id)))throw Error('角色或员工编号重复');
  for(const role of state.roles)validateRole(state,role);
  const emails=state.employees.map(e=>e.email.trim().toLowerCase()).filter(Boolean);
  if(!unique(emails))throw Error('员工邮箱重复');
  const validGrant=(key:string,value:string)=>{
    const resource=resources.get(key);
    if(!resource)return; // Preserve retired resources for review; resolver denies them.
    const values=resource.type==='action'?['hidden','edit']:resource.type==='setting'?['hidden','read','edit']:['hidden','read'];
    if(!values.includes(value))throw Error(`权限状态无效：${resource.title}`);
  };
  for(const role of state.roles)for(const [key,value] of Object.entries(role.grants))validGrant(key,value);
  for(const employee of state.employees){
    if(state.employeeAuthorization==='roles-only'&&Object.keys(employee.overrides).length)throw Error('员工仅支持角色授权，不能保存个人例外');
    if(!['unopened','pending','revoked','enabled','disabled'].includes(employee.status))throw Error('账号状态无效');
    if(!employee.name.trim()||employee.name.length>30)throw Error('员工姓名无效');
    for(const binding of employee.bindings){
      if(!state.roles.some(r=>r.id===binding.roleId))throw Error('绑定的角色不存在');
      if(!['stores','brands','regions'].includes(binding.scope.mode)||!binding.scope.ids.length||binding.scope.ids.some(id=>!id))throw Error('必须指定有效的授权范围');
    }
    for(const grants of Object.values(employee.overrides))for(const [key,value] of Object.entries(grants))validGrant(key,value);
  }
}
export function persistCenterChange(storage:Pick<Storage,'getItem'|'setItem'>,key:string,next:CenterState,expectedVersion:number,objectId:string,action:string,actor:string,resources:Map<string,Resource>):CenterState {
  const raw=storage.getItem(key);if(!raw)throw Error('原权限数据不存在，请刷新后重新编辑');
  const current=JSON.parse(raw) as CenterState;
  if(current.version!==expectedVersion)throw Error('数据已被其他窗口修改。请保留当前内容，刷新后重新编辑');
  if(current.employeeAuthorization==='roles-only'&&next.employeeAuthorization!=='roles-only')throw Error('不能回退员工角色授权模式，请刷新后重新编辑');
  validateCenterState(next,resources);
  for(const old of current.roles)if(!next.roles.some(r=>r.id===old.id)&&(old.system||next.employees.some(e=>e.bindings.some(b=>b.roleId===old.id))))throw Error('系统角色或有关联员工的角色不能删除');
  const saved=structuredClone(next);
  const object=(s:CenterState)=>s.roles.find(r=>r.id===objectId)??s.employees.find(e=>e.id===objectId)??null;
  saved.logs=[{id:crypto.randomUUID(),at:new Date().toISOString(),actor,objectId,action,before:JSON.stringify(object(current)),after:JSON.stringify(object(next))},...current.logs];
  saved.version=current.version+1;
  // One write; publish state to the caller only after persistence succeeds.
  storage.setItem(key,JSON.stringify(saved));return saved;
}
