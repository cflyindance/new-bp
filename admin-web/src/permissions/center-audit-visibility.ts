import type {Audit} from './center-domain';
/** Exclude only the legacy generated role-only migration entry, not real operator records. */
export function isRoleOnlyMigrationAudit(log:Pick<Audit,'actor'|'objectId'|'action'>):boolean {
  return log.actor==='系统迁移'&&log.objectId==='employee-authorization'&&log.action==='清除个人例外，员工仅按角色与门店范围授权';
}
