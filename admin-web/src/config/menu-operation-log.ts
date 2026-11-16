import {appendOperation} from './operation-log';
import type {JsonMenuEditorStore} from './json-menu-editor-store';
const actions:Record<string,string>={addNode:'新增菜单',duplicateSelected:'复制菜单及子级',deleteSelected:'删除菜单',moveSelected:'移动/排序',saveDraft:'保存草稿',publish:'发布',createNew:'新建配置',importDocument:'导入 JSON'};
export function withMenuOperationLog(store:JsonMenuEditorStore):JsonMenuEditorStore {
 let savedDocument=structuredClone(store.state.document);
 let queued:Parameters<typeof appendOperation>[0]|undefined;
 const queue=(input:Parameters<typeof appendOperation>[0])=>{if(queued){queued.after=input.after;return;}queued=input;queueMicrotask(()=>{const entry=queued;queued=undefined;if(entry)appendOperation(entry);});};
 return new Proxy(store,{get(target,key,receiver){const member=Reflect.get(target,key,receiver);if(typeof member!=='function')return member;
  if(key==='load'||key==='discard')return async (...args:unknown[])=>{const result=await member.apply(target,args);savedDocument=structuredClone(target.state.document);return result;};
  if(!actions[String(key)])return member.bind(target);
  return (...args:unknown[])=>{
   const before=structuredClone(key==='publish'?target.state.published:key==='saveDraft'?(savedDocument??target.state.published):target.state.document);
   const stage=key==='publish'?'发布':key==='saveDraft'?'保存草稿':'编辑配置';
   const finish=(result:unknown,error?:unknown)=>{const outcome=result as {ok?:boolean;needsWarningConfirmation?:boolean}|null;if(outcome?.needsWarningConfirmation)return result;
    const failed=Boolean(error)||result===false||result===null||outcome?.ok===false;
    const input:Parameters<typeof appendOperation>[0]={scope:'menu',action:actions[String(key)],stage:key==='exportJson'?'导出':stage,before,after:structuredClone(failed?before:target.state.document),result:failed?'failure':'success',reason:error instanceof Error?error.message:failed?(target.state.message||'校验未通过或操作未成功'):'',force:key==='publish'||key==='exportJson'||failed};
    if(stage==='编辑配置'&&key!=='exportJson'&&!failed)queue(input);else appendOperation(input);
    if(!failed&&(key==='saveDraft'||key==='publish'))savedDocument=structuredClone(target.state.document);return result;};
   try{const result=member.apply(target,args);if(result&&typeof result.then==='function')return result.then((value:unknown)=>finish(value),(error:unknown)=>{finish(false,error);throw error;});return finish(result);}catch(error){finish(false,error);throw error;}
  };
 }});
}
