import {localBusinessDate,shiftBusinessDate,type StoreBusinessFacts} from './store-business-status';

/** Replaceable original-facts cache contract. No allocation results or order counts are used. */
export const STORE_BUSINESS_FACTS_KEY='menusifu:store-business-facts:v1';
export function readStoreBusinessFacts(storeId:string,timezone:string,now=new Date()):StoreBusinessFacts|undefined {
  try {
    const raw=localStorage.getItem(STORE_BUSINESS_FACTS_KEY);
    if(raw){const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))return undefined;
      if(Object.prototype.hasOwnProperty.call(data,storeId))return data[storeId];}
  }catch{return undefined;}
  return demoStoreBusinessFacts(storeId,timezone,now);
}
/** Explicit registered MID fixtures; viewing never writes business records. */
export function demoStoreBusinessFacts(storeId:string,timezone:string,now=new Date()):StoreBusinessFacts|undefined {
  const mode:Record<string,string>={M00000001:'sales',M00000002:'tips',M00000003:'punch',M00000004:'zero',M00000005:'zero',M00000006:'zero',M00000007:'sales',M00000009:'missing'};
  const scenario=mode[storeId];if(!scenario)return undefined;
  try{
    const end=localBusinessDate(now,timezone);
    const days=Array.from({length:scenario==='missing'?10:30},(_,i)=>({date:shiftBusinessDate(end,-i),salesAmount:0,tipAmount:0,punchRecords:[] as {source:string;status:string;hours:number}[],complete:true}));
    if(scenario==='sales')days[3]!.salesAmount=1200;
    if(scenario==='tips')days[8]!.tipAmount=80;
    if(scenario==='punch')days[29]!.punchRecords=[{source:'pos',status:'complete',hours:8}];
    return {storeId,timezone,source:'demo',updatedAt:now.toISOString(),days};
  }catch{return undefined;}
}
