import { readCommittedTeamSchedule } from "../../config/team-shift-scheduling-ui";
import { canonicalRosterStoreDisplayName, parseRosterStoreScopeId } from "../../config/team-employee-roster-scope";
import { getScopedFilterOptions } from "../../auth/session-scope";

const canonical = (value: string) => canonicalRosterStoreDisplayName(parseRosterStoreScopeId(value) ?? value).trim().toLowerCase();
export function projectTipOutSchedule(store: string, dateKey: string, data: ReturnType<typeof readCommittedTeamSchedule>, aliases: string[] = []) {
  if (!store) throw new Error("请先选择门店");
  const stores = new Set([store,...aliases].filter(Boolean).map(canonical));
  const employees = new Map(data.employees.filter(e=>!!e.store && stores.has(canonical(e.store))).map(e=>[String(e.id),e]));
  const templates = new Map(data.shifts.map(s=>[s.id,s]));
  const groups = new Map<string,{id:string;name:string;start:string;end:string;employeeIds:string[];minClockMinutes:number;maxClockMinutes:number;source:string;dateKey:string}>();
  for (const assignment of data.assignments) {
    if (assignment.date !== dateKey || !employees.has(String(assignment.employeeId))) continue;
    const shift = templates.get(assignment.shiftId);
    if (!shift) throw new Error("当日排班引用的班次已失效，请先修正排班表");
    if (shift.storeId && !stores.has(canonical(shift.storeId))) throw new Error("排班班次与员工门店不一致，请先修正排班表");
    const start = assignment.overrideStartTime || shift.startTime, end = assignment.overrideEndTime || shift.endTime;
    const key = JSON.stringify([shift.id,start,end]);
    let group = groups.get(key);
    if (!group) { group={id:shift.id,name:shift.name+" "+start+"—"+end,start,end,employeeIds:[],minClockMinutes:0,maxClockMinutes:0,source:"schedule",dateKey}; groups.set(key,group); }
    if (!group.employeeIds.includes(String(assignment.employeeId))) group.employeeIds.push(String(assignment.employeeId));
  }
  return Array.from(groups.values()).map(g=>({...g,employeeIds:g.employeeIds.sort()})).sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
}
export function readTipOutSchedule(store: string,dateKey: string) {
  const option = getScopedFilterOptions().stores.find(s=>[s.value,s.labelZh,s.labelEn].some(v=>v&&canonical(v)===canonical(store)));
  return projectTipOutSchedule(store,dateKey,readCommittedTeamSchedule(),option?[option.value,option.labelZh,option.labelEn]:[]);
}
