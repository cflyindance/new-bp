import type {CenterState} from './center-domain';
/** User-approved one-way migration. A recoverable raw snapshot is written before active data changes. */
export function migrateRoleOnlyState(storage:Pick<Storage,'getItem'|'setItem'>,key:string,state:CenterState,raw:string):CenterState {
  if(state.schema!==1||!Number.isSafeInteger(state.version)||state.version<0||!Array.isArray(state.roles)||!Array.isArray(state.employees)||!Array.isArray(state.logs))throw Error('权限数据无法安全迁移；原数据已保留');
  if(state.navigationVersion!==undefined&&state.navigationVersion!==1)throw Error('导航权限版本无法迁移；原数据已保留');
  if(state.employeeAuthorization!==undefined&&state.employeeAuthorization!=='roles-only')throw Error('员工角色授权模式无法读取；原数据已保留');
  if(state.employeeAuthorization==='roles-only'&&state.employees.every(e=>e.overrides&&Object.keys(e.overrides).length===0))return state;
  if(storage.getItem(key)!==raw)throw Error('权限数据已被其他窗口修改，请刷新后重新迁移');
  const next=structuredClone(state),backupKey=`${key}:before-roles-only:v${state.version}`;
  const existing=storage.getItem(backupKey);
  if(existing!==null&&existing!==raw)throw Error('个人例外备份已存在且内容不同；原数据已保留，请先导出备份');
  if(existing===null)storage.setItem(backupKey,raw);
  for(const e of next.employees)e.overrides={};
  next.employeeAuthorization='roles-only';next.version=state.version+1;
  if(storage.getItem(key)!==raw)throw Error('权限数据已被其他窗口修改，迁移备份已保留，请刷新');
  storage.setItem(key,JSON.stringify(next));
  return next;
}
