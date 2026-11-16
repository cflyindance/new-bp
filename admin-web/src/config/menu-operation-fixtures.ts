import type {OperationEntry} from './operation-log';

/** Display-only business scenarios. Never execute these actions or persist them as audit events. */
export function menuOperationFixtures():OperationEntry[] {
 const records:Array<{action:string;name:string;path:string;field:string;before:unknown;after:unknown;failure?:string}>=[
  {action:'新增目录',name:'商品管理',path:'商品中心 / 商品管理',field:'菜单配置',before:null,after:{name:'商品管理',children:[]}},
  {action:'新增菜单',name:'商品列表',path:'商品中心 / 商品管理 / 商品列表',field:'菜单配置',before:null,after:{name:'商品列表',type:'micro-app',path:'/products/list',display:true}},
  {action:'编辑菜单',name:'商品列表',path:'商品中心 / 商品管理 / 商品列表',field:'name',before:'商品查询',after:'商品列表'},
  {action:'更换页面',name:'订单列表',path:'订单中心 / 订单管理 / 订单列表',field:'关联页面',before:{title:'订单查询',path:'/orders/search'},after:{title:'订单列表',path:'/orders/list'}},
  {action:'移动菜单',name:'库存变更记录',path:'商品中心 / 库存管理 / 库存变更记录',field:'父级菜单',before:'商品中心 / 商品管理',after:'商品中心 / 库存管理'},
  {action:'复制及子级',name:'会员管理（门店）',path:'会员中心 / 会员管理（门店）',field:'菜单配置',before:null,after:{name:'会员管理（门店）',children:[{name:'会员列表',path:'/store-members/list'},{name:'会员等级',path:'/store-members/levels'}]}},
  {action:'排序',name:'订单列表',path:'订单中心 / 订单管理 / 订单列表',field:'显示顺序',before:['退款记录','订单列表','订单统计'],after:['订单列表','退款记录','订单统计']},
  {action:'停用菜单',name:'优惠券核销',path:'促销中心 / 优惠券核销',field:'disabled',before:false,after:true},
  {action:'启用菜单',name:'优惠券核销',path:'促销中心 / 优惠券核销',field:'disabled',before:true,after:false},
  {action:'编辑权限',name:'退款记录',path:'支付中心 / 退款记录',field:'accessControl',before:{bool:false},after:{bool:true,permission:{rule:'some',value:['退款查看','退款审核']}}},
  {action:'删除菜单',name:'旧版经营报表',path:'经营分析 / 旧版经营报表',field:'菜单配置',before:{name:'旧版经营报表',path:'/reports/legacy',display:true},after:null},
  {action:'发布',name:'商品列表',path:'商品中心 / 商品管理 / 商品列表',field:'发布状态',before:'待发布',after:'已发布'},
  {action:'发布',name:'订单统计',path:'订单中心 / 订单管理 / 订单统计',field:'path',before:'/orders/statistics',after:'/orders/list',failure:'路径地址与“订单列表”重复，请调整路径后重新发布。'}
 ];
 return records.map((r,i)=>{
  const id=`menu-log-fixture-v1:${i}`,nodeId=`menu-log-fixture-node:${i}`;
  const base={id:nodeId,name:r.name};
  return {id,batchId:id,time:new Date(Date.UTC(2026,10,16,2,i*3)).toISOString(),scope:'menu',action:r.action,actor:['张明','李娜','王磊','陈晨','刘洋'][i%5],stage:r.action==='发布'?'发布':'编辑配置',result:r.failure?'failure':'success',reason:r.failure??'',before:{menu:[base],[r.field]:r.before},after:{menu:[base],[r.field]:r.after},objects:[{id:nodeId,name:r.name,path:r.path,kind:'菜单'}],changes:[{field:r.field,before:r.before,after:r.after}],persistent:true} satisfies OperationEntry;
 });
}
