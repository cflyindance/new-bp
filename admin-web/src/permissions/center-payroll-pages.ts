import type {Resource} from './center-domain';
import type {AuthorizationRow} from './center-authorization';
const path='/team/payroll-report',page=`page:${path}`;
const content=(id:string)=>`content:${path}:${id}`,action=(id:string)=>`action:${path}:${id}`;
const edits=['edit-employee','refresh-attendance','save-payroll'];
const exports=['export-detail-pdf','export-detail-csv','email-detail','export-adp','export-batch-adp','export-batch-detail','print-detail'];
const declarations=['manage-declaration','save-declaration','publish-declaration','version-declaration','retire-declaration','assign-declaration'];
export function registerPayrollPages(resources:Map<string,Resource>):void {
  for(const [suffix,id,ids] of [['schedule-settings','manage-pay-schedule',['manage-pay-schedule']],['declaration-settings','manage-declaration',declarations]] as const){
    const target=`${page}/${suffix}`;if(!resources.has(target))throw Error(`薪资设置页面缺失：${target}`);
    const object=resources.get(content(`object-${id}`));if(!object)throw Error(`薪资设置对象缺失：${id}`);object.parent=target;
    for(const id of ids){const r=resources.get(action(id));if(!r)throw Error(`薪资设置操作缺失：${id}`);r.parent=target;}
  }
  for(const [id,title] of [['export-results','导出操作'],['switch-employee','切换员工']]){
    const key=content(id);if(resources.has(key))throw Error(`重复薪资内容：${key}`);
    resources.set(key,{key,title,type:'content',parent:page,path,requires:[content('payroll-detail')],previewValue:title==='导出操作'?'PDF / CSV / ADP / 打印 / 邮箱':'当前授权范围内员工'});
  }
  for(const id of edits){const r=resources.get(action(id))!;r.requires=[...new Set([...(r.requires??[]),content('payroll-detail')])];}
  for(const id of exports){const r=resources.get(action(id))!;r.requires=[...new Set([...(r.requires??[]),content('payroll-detail'),content('export-results')])];}
  const switchKey=action('switch-employee');if(!resources.has(switchKey))throw Error('缺少薪资切换员工来源登记');
  resources.get(switchKey)!.requires=[content('payroll-detail'),content('switch-employee')];
}
export function payrollAuthorizationRows(key:string):AuthorizationRow[]|undefined {
  if(key===page)return [
    {contentKey:content('payroll-detail'),additionalContentKeys:[content('employee-info')],title:'薪资管理',editKeys:edits.map(action),editTitle:'编辑薪资',help:'不可见：隐藏薪资内容和操作；可见不可编辑：仅查看；可编辑：允许编辑员工资料、更新考勤、修改与保存薪资。敏感字段仍受原权限限制。'},
    {contentKey:content('export-results'),title:'导出操作',editKeys:exports.map(action),editTitle:'导出或发送薪资',mode:'visibility',help:'可见：允许当前及批量PDF、CSV、ADP导出、打印和发送邮箱。无需薪资可编辑，但须薪资内容和原敏感字段可见。'},
    {contentKey:content('switch-employee'),title:'切换员工',editKeys:[action('switch-employee')],editTitle:'切换员工',mode:'visibility',help:'仅控制切换入口，不扩大员工数据范围；薪资内容不可见时不生效。'},
  ];
  if(key===`${page}/schedule-settings`)return [{contentKey:content('object-manage-pay-schedule'),title:'发薪周期管理',editKeys:[action('manage-pay-schedule')],editTitle:'编辑发薪周期',help:'可编辑包含新增、修改、删除发薪周期规则；不授予薪资报表权限。'}];
  if(key===`${page}/declaration-settings`)return [{contentKey:content('object-manage-declaration'),title:'员工声明管理',editKeys:declarations.map(action),editTitle:'编辑员工声明',help:'可编辑包含新增、修改、保存、发布、创建新版本、删除草稿、停用及分配员工。'}];
  return undefined;
}
