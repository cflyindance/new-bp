import type {MenuNode} from './center-catalog';
import type {Resource} from './center-domain';
/** Match merchant navigation without losing the existing business-detail grants. */
export function registerTipsPages(tree:MenuNode[],resources:Map<string,Resource>):void {
  const node=tree.find(n=>n.id==='team')?.children.find(n=>n.id==='team-tips');
  const distribution='page:/team/tips/distribution',details='page:/team/tips/details';
  const detail=resources.get(details);
  if(!node||!detail||!resources.has(distribution))throw Error('小费权限目录不完整');
  node.children=node.children.filter(n=>n.key!==details);
  detail.type='content';detail.parent=distribution;detail.title='小费分配';detail.previewValue='小费分配及明细（示例）';
  for(const id of ['refresh-tip-data','confirm-allocation','confirm-payout']){
    const resource=resources.get(`action:/team/tips/details:${id}`);if(!resource)throw Error(`小费明细操作缺失：${id}`);
    resource.parent=distribution;resource.requires=[details];
  }
  for(const id of ['batch-allocate','cancel-allocation'])resources.get(`action:/team/tips/distribution:${id}`)!.requires=[details];
  const exportKey='content:/team/tips/distribution:export-results';
  resources.set(exportKey,{key:exportKey,title:'导出操作',type:'content',parent:distribution,path:'/team/tips/distribution',requires:[details],previewValue:'PDF / CSV / 邮箱'});
  for(const id of ['export-pdf','export-csv','email-result'])resources.get(`action:/team/tips/distribution:${id}`)!.requires=[details,exportKey];
}
