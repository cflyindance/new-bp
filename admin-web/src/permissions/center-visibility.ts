import { additionalPageActions } from './center-actions';
import { actionGroups } from './center-action-groups';

export interface VisibilityEntry { id:string; title:string; kind:'content'|'field'; parentId?:string; source:string; control:string; previewValue:string }
export const contentKey=(path:string,id:string)=>`content:${path}:${id}`;
export const fieldKey=(path:string,id:string)=>`field:${path}:${id}`;
const objectId=(id:string)=>`object-${id}`;
const objects={...actionGroups,'/operations/queue-call/classification-settings':[{id:'manage-category',title:'编辑分类',members:[]}]};
/** Business-object evidence only; this does not bind production DOM or fetch data. */
export const visibilityEntries:Record<string,VisibilityEntry[]>=Object.fromEntries(Object.entries(objects).map(([path,groups])=>[path,groups.map(group=>{
  const action=additionalPageActions[path].find(a=>a.id===group.id)!;
  const title=group.title.replace(/^编辑/,'');
  return {id:objectId(group.id),title:`${title}内容`,kind:'content' as const,source:action.source,control:action.control,previewValue:`${title}记录（示例）`};
})]));
const payroll='/team/payroll-report',template='src/team/payroll/payroll-template.html';
visibilityEntries[payroll].unshift(
  {id:'employee-info',title:'员工身份信息',kind:'content',source:template,control:'ws-employee-name',previewValue:'示例员工'},
  {id:'adp-id',title:'ADP ID',kind:'field',parentId:'employee-info',source:template,control:'ws-employee-adp-display',previewValue:'ADP-001（示例）'},
  {id:'ssn',title:'SSN',kind:'field',parentId:'employee-info',source:template,control:'ws-employee-ssn-display',previewValue:'***-**-6789（示例）'},
  {id:'payroll-detail',title:'薪资明细内容',kind:'content',source:template,control:'detail-meta-employee',previewValue:'当前员工明细（示例）'},
  {id:'salary-amount',title:'薪资金额',kind:'field',parentId:'payroll-detail',source:template,control:'ws-total-salary',previewValue:'5,000.00（示例）'},
);
export const actionVisibilityDependencies:Record<string,string[]>={};
const requireObject=(path:string,object:string,actions:string[])=>{for(const id of actions)actionVisibilityDependencies[`action:${path}:${id}`]=[contentKey(path,objectId(object))];};
for(const [path,groups] of Object.entries(objects))for(const group of groups)requireObject(path,group.id,[group.id]);
requireObject('/permissions/roles','manage-role',['edit','copy']);
requireObject('/team/shift-scheduling','manage-shift',['save-schedule','clear-schedule','reset-schedule','copy-week']);
requireObject('/team/training-performance','manage-course',['publish-course','start-course','complete-course']);
for(const id of ['layout','save-layout'])actionVisibilityDependencies[`action:/operations/queue-call/floor-plan:${id}`]=[contentKey('/operations/queue-call/floor-plan','object-manage-area'),contentKey('/operations/queue-call/floor-plan','object-manage-table')];
requireObject('/notifications/templates','manage-template',['toggle']);
requireObject('/device-management/hardware/cash-drawer','manage-device',['policy']);
for(const path of ['/device-management/hardware/emenu','/device-management/hardware/fiscal','/device-management/hardware/caller-id'])requireObject(path,'manage-device',['toggle']);
requireObject('/team/roles-employees','manage-employee',['save-employee']);
requireObject('/team/tips/rules','manage-rule',['copy']);
requireObject('/operations/queue-call/menu-order-limits','manage-rule',['copy-quantities']);
requireObject('/operations/queue-call/buffet-rules','manage-rule',['copy','toggle']);
requireObject(payroll,'manage-declaration',['save-declaration','publish-declaration','version-declaration','retire-declaration','assign-declaration']);
actionVisibilityDependencies[`action:${payroll}:edit-employee`]=[contentKey(payroll,'employee-info')];
actionVisibilityDependencies[`action:${payroll}:refresh-attendance`]=[contentKey(payroll,'payroll-detail')];
actionVisibilityDependencies[`action:${payroll}:save-payroll`]=[fieldKey(payroll,'salary-amount')];
for(const id of ['export-detail-pdf','export-detail-csv','email-detail','export-batch-detail','print-detail'])actionVisibilityDependencies[`action:${payroll}:${id}`]=[fieldKey(payroll,'salary-amount'),fieldKey(payroll,'ssn')];
for(const id of ['export-adp','export-batch-adp'])actionVisibilityDependencies[`action:${payroll}:${id}`]=[fieldKey(payroll,'salary-amount'),fieldKey(payroll,'ssn'),fieldKey(payroll,'adp-id')];
