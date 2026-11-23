/** Minimal, in-memory browser host for permission-catalog tests. No disk or shared demo state. */
const data=new Map<string,string>();
const storage:Storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{data.set(key,String(value));},removeItem:key=>{data.delete(key);},clear:()=>data.clear(),key:index=>[...data.keys()][index]??null,get length(){return data.size;}};
if(typeof window==='undefined')Object.assign(globalThis,{
  localStorage:storage,sessionStorage:storage,
  window:Object.assign(new EventTarget(),{localStorage:storage,sessionStorage:storage}),
  location:{hash:'',pathname:'/',search:'',origin:'http://localhost'},
  document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}},
});
