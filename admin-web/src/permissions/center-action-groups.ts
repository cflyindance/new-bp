import type { ActionRegistration } from './center-actions';

export interface ActionGroup { id: string; title: string; members: { id: string; operation: '新增' | '删除' | '修改' }[] }
const group=(id:string,title:string,ids:{create?:string;delete?:string;edit?:string}):ActionGroup=>({id,title,members:[
  ...(ids.create?[{id:ids.create,operation:'新增' as const}]:[]),
  ...(ids.delete?[{id:ids.delete,operation:'删除' as const}]:[]),
  ...(ids.edit?[{id:ids.edit,operation:'修改' as const}]:[]),
]});
/** Explicit same-object groups. Never infer CRUD or ownership from labels/prefixes. */
export const actionGroups:Record<string,ActionGroup[]>={
  '/permissions/roles':[group('manage-role','编辑角色',{create:'create',edit:'edit-role',delete:'delete'})],
  '/brand-products/seasoning-mgmt/seasoning':[
    group('manage-option','编辑 Option',{create:'create-option',edit:'edit-option'}),
    group('manage-product','编辑商品调味',{edit:'edit-product',delete:'delete-product'}),
  ],
  '/team/breaks-overtime':[
    group('manage-break','编辑休息',{create:'create-break',edit:'edit-break',delete:'delete-break'}),
    group('manage-overtime','编辑加班规则',{create:'create-overtime',edit:'edit-overtime',delete:'delete-overtime'}),
  ],
  '/team/shift-scheduling':[group('manage-shift','编辑班次',{create:'create-shift',edit:'edit-shift',delete:'delete-shift'})],
  '/team/training-performance':[
    group('manage-course','编辑课程',{create:'create-course',edit:'edit-course',delete:'delete-course'}),
    group('manage-review','编辑评估',{create:'create-review',edit:'edit-review'}),
  ],
  '/operations/queue-call/floor-plan':[
    group('manage-area','编辑区域',{create:'create-area',edit:'edit-area',delete:'delete-area'}),
    group('manage-table','编辑桌台',{create:'create-table',edit:'edit-table',delete:'delete-table'}),
  ],
  '/operations/queue-call/category-settings':[
    group('manage-age','编辑年龄分组',{create:'create-age',edit:'edit-age',delete:'delete-age'}),
    group('manage-category','编辑品类',{create:'create-category',edit:'edit-category',delete:'delete-category'}),
  ],
  '/notifications/templates':[group('manage-template','编辑模板',{create:'create',edit:'edit'})],
  '/device-management/hardware/payments':[group('manage-device','编辑支付设备',{create:'create',edit:'edit',delete:'delete'})],
  '/device-management/hardware/printers':[group('manage-device','编辑打印机',{create:'create',edit:'edit',delete:'delete'})],
  '/device-management/hardware/cash-drawer':[group('manage-device','编辑钱箱',{create:'create',edit:'edit',delete:'delete'})],
  '/device-management/hardware/emenu':[group('manage-device','编辑 eMenu 设备',{edit:'edit',delete:'delete'})],
  '/device-management/hardware/kiosk':[group('manage-device','编辑 Kiosk 设备',{edit:'edit',delete:'delete'})],
  '/device-management/hardware/cds':[group('manage-device','编辑 CDS 设备',{edit:'edit',delete:'delete'})],
  '/device-management/hardware/fiscal':[group('manage-device','编辑税控机',{create:'create',edit:'edit',delete:'delete'})],
  '/device-management/hardware/caller-id':[group('manage-device','编辑来电显示',{create:'create',edit:'edit',delete:'delete'})],
  '/team/payroll-report':[
    group('manage-declaration','编辑薪资声明模板',{create:'create-declaration',edit:'edit-declaration',delete:'delete-declaration'}),
    group('manage-pay-schedule','编辑发薪周期规则（演示）',{create:'create-pay-schedule',edit:'edit-pay-schedule',delete:'delete-pay-schedule'}),
  ],
  '/team/roles-employees':[
    group('manage-employee','编辑员工',{create:'create-employee',edit:'edit-employee',delete:'delete-employee'}),
    group('manage-role','编辑岗位',{create:'create-role',edit:'edit-role'}),
  ],
  '/team/tips/rules':[group('manage-rule','编辑分配规则',{create:'create',edit:'edit',delete:'delete'})],
  '/operations/queue-call/menu-order-limits':[group('manage-rule','编辑下单限制规则',{create:'create',edit:'edit-dimensions'})],
  '/operations/queue-call/buffet-rules':[group('manage-rule','编辑自助餐规则',{create:'create',edit:'edit',delete:'delete'})],
};

export function applyActionGroups(source:Record<string,ActionRegistration[]>):Record<string,ActionRegistration[]> {
  for(const path of Object.keys(actionGroups))if(!source[path])throw Error(`组合编辑权限缺少页面：${path}`);
  return Object.fromEntries(Object.entries(source).map(([path,actions])=>{
    const specs=actionGroups[path]??[],byMember=new Map<string,ActionGroup>(),usedIds=new Set(actions.map(a=>a.id));
    if(usedIds.size!==actions.length)throw Error(`重复的源操作权限：${path}`);
    for(const spec of specs){
      if(usedIds.has(spec.id))throw Error(`重复的组合编辑权限：${path}/${spec.id}`);usedIds.add(spec.id);
      if(spec.members.length<2)throw Error(`组合编辑权限至少需要两个实际操作：${path}/${spec.id}`);
      for(const member of spec.members){
        if(!actions.some(a=>a.id===member.id))throw Error(`组合编辑权限缺少操作：${path}/${member.id}`);
        if(byMember.has(member.id))throw Error(`操作属于多个组合：${path}/${member.id}`);
        byMember.set(member.id,spec);
      }
    }
    const emitted=new Set<string>();
    return [path,actions.flatMap(action=>{
      const spec=byMember.get(action.id);if(!spec)return [action];if(emitted.has(spec.id))return [];emitted.add(spec.id);
      const members=spec.members.map(m=>actions.find(a=>a.id===m.id)!);
      const points=members.flatMap(a=>[{source:a.source,control:a.control},...(a.relatedControls??[]).map(control=>({source:a.source,control})),...a.relatedSources??[]]);
      const unique=[...new Map(points.map(p=>[`${p.source}\0${p.control}`,p])).values()],first=unique[0];
      return [{id:spec.id,title:spec.title,source:first.source,control:first.control,relatedControls:unique.slice(1).filter(p=>p.source===first.source).map(p=>p.control),relatedSources:unique.slice(1).filter(p=>p.source!==first.source),help:`编辑权限包含${spec.members.map(m=>m.operation).join('、')}`}];
    })];
  }));
}
