import type {CenterState} from './center-domain';

export function roleBoundEmployees(state:CenterState,id:string) {
  return state.employees.filter(employee=>employee.bindings.some(binding=>binding.roleId===id));
}

/** Presets are ordinary roles; employee assignments still protect every role. */
export function deleteUnassignedRole(state:CenterState,id:string):CenterState {
  if(!state.roles.some(role=>role.id===id))throw Error('角色不存在');
  if(roleBoundEmployees(state,id).length)
    throw Error('请先解除员工的角色分配，再删除角色');
  const next=structuredClone(state);
  next.roles=next.roles.filter(role=>role.id!==id);
  return next;
}
