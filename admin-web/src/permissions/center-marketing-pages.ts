import type {Resource} from './center-domain';
import type {AuthorizationRow} from './center-authorization';
export const marketingPermissionPages=[
  ['/marketing/screensaver','屏保'],
  ['/marketing/ads','广告'],
  ['/marketing/poster-pro','海报Pro'],
  ['/asset-center/materials','图片素材'],
] as const;
/** Preserve legacy viewing; newly introduced write grants remain denied by default. */
export function registerMarketingPages(resources:Map<string,Resource>):void {
  for(const [path,title] of marketingPermissionPages){
    const page=`page:${path}`,content=`content:${path}:page-content`;
    if(!resources.has(page))throw Error(`营销/素材页面缺失：${path}`);
    resources.set(content,{key:content,title,type:'content',parent:page,path,defaultAccess:'read'});
    const actions=[...resources.values()].filter(r=>r.parent===page&&r.type==='action');
    if(!actions.length){
      const key=`action:${path}:manage-page`;
      resources.set(key,{key,title:`编辑${title}`,type:'action',parent:page,path,requires:[content]});
    }
    for(const action of actions)action.requires=[...new Set([...(action.requires??[]),content])];
  }
}
export function marketingAuthorizationRows(resources:Map<string,Resource>,page:string):AuthorizationRow[]|undefined {
  const entry=marketingPermissionPages.find(([path])=>page===`page:${path}`);
  if(!entry)return;
  const [path,title]=entry;
  return [{contentKey:`content:${path}:page-content`,title,editTitle:`编辑${title}`,
    editKeys:[...resources.values()].filter(r=>r.parent===page&&r.type==='action').map(r=>r.key),
    help:'不可见：隐藏页面；可见不可编辑：仅查看；可编辑：允许本页面的编辑操作。'}];
}
