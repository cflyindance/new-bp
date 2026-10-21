export interface BrandChangeFacts {
 category:'品牌门店'|'品牌菜单'|'品牌管理员'|'品牌服务'|'其他';
 title:string;target:string;source:string;operationId?:string;
 fields:{name:string;before:string;after:string}[];
}
export interface AdminAuditContext {source:string;accountId:string;operation:'create'|'profile'|'password'|'enable'|'disable'}
