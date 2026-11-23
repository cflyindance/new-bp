import type {AdSlot,AdSpec} from './ad-slot-catalog';
import {CHANNELS,DISPLAY_UPLOAD_RULES,newSpec,ratio} from './ad-slot-catalog';
import {escapeDisplay as e} from './ui-common';
function number(name:string,label:string,value:number,max:number){return `<label class="display-field"><span>${e(label)}</span><input class="display-input" aria-label="${e(label)}" name="${name}" type="number" min="1" max="${max}" value="${value}" required></label>`}
function dimensionSummary({width,height}:Pick<AdSpec,'width'|'height'>):string{return Number.isInteger(width)&&width>0&&Number.isInteger(height)&&height>0?`${width} × ${height} px · ${ratio({width,height})}`:'—'}
const devicePresets:Partial<Record<string,string>>={Kiosk:'自助终端',取餐屏:'取餐显示屏',Waitlist:'排队叫号屏'};
const layoutPresets=[['横屏','横版'],['竖屏','竖版']] as const;
const commonDevicePresets=['移动端','平板','PC 端'];
const legacyOption='legacy';
function applicabilityField(prefix:string,value:string):string {
 return `<div data-slot-applicability><div class="display-field-grid"><label class="display-field">适用设备<select class="display-input" data-slot-device aria-label="适用设备" required></select></label><label class="display-field">适用版式<select class="display-input" data-slot-layout aria-label="适用版式" required></select></label></div><input type="hidden" name="${prefix}applicability" value="${e(value)}"></div>`;
}
function syncApplicability(section:HTMLElement,devicePreset:string,initialize=false):void {
 const device=section.querySelector<HTMLSelectElement>('[data-slot-device]')!;
 const layout=section.querySelector<HTMLSelectElement>('[data-slot-layout]')!;
 const stored=section.querySelector<HTMLInputElement>('input[type=hidden]')!;
 if(initialize){
  const presets=devicePreset?[devicePreset,...commonDevicePresets]:commonDevicePresets;
  device.replaceChildren(new Option('请选择设备',''),...presets.map(option=>new Option(option,option)));
  const [storedDevice,storedLayout,...extra]=stored.value.split('／');
  const matched=!extra.length&&presets.includes(storedDevice)&&layoutPresets.some(([value])=>value===storedLayout);
  if(!matched&&stored.value){const previous=new Option('历史值：'+stored.value,legacyOption);previous.disabled=true;device.add(previous);}
  device.value=matched?storedDevice:stored.value?legacyOption:'';
  layout.replaceChildren(new Option('请选择版式',''),...layoutPresets.map(([value,label])=>new Option(label,value)));
  layout.value=matched?storedLayout:'';
 }
 layout.disabled=!device.value||device.value===legacyOption;
 if(device.value!==legacyOption)stored.value=device.value&&layout.value?device.value+'／'+layout.value:'';
}
export function newSlotSpec():AdSpec {const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));const id='spec-'+Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');return {...newSpec(id),applicability:''};}
function row(s:AdSpec,i:number){const p='slot-spec-'+i+'-';return `<section class="display-slot-spec" data-slot-spec="${i}" aria-label="素材规格 ${i+1}"><header class="display-slot-header"><h4>素材规格 ${i+1}</h4><button type="button" class="display-btn display-slot-remove" aria-label="删除素材规格 ${i+1}" data-slot-remove="${i}">删除此规格</button></header><div class="display-slot-group"><h5>适用范围</h5><input type="hidden" name="${p}id" value="${e(s.id)}">${applicabilityField(p,s.applicability)}</div><div class="display-slot-group"><h5>推荐尺寸</h5><div class="display-field-grid">${number(p+'width','规格'+(i+1)+'推荐宽度（px）',s.width,16384)}${number(p+'height','规格'+(i+1)+'推荐高度（px）',s.height,16384)}</div><output class="display-muted display-slot-ratio" aria-label="自动计算比例" data-slot-ratio>${dimensionSummary(s)}</output></div></section>`}
export function slotProductLineField(slot:Partial<AdSlot>):string {
 return `<fieldset class="display-field display-product-line"><legend>所属产线 <span aria-hidden="true">*</span></legend><div class="display-checks">${CHANNELS.map(channel=>`<label><input type="radio" name="slotProductLine" value="${channel}" ${slot.productLine===channel?'checked':''} ${slot.productLine?'disabled':'required'}>${channel}</label>`).join('')}</div></fieldset>`;
}
export function slotFields(slot:Partial<AdSlot>):string{return `<h3 class="display-section-title">素材规格</h3><div data-slot-specs>${(slot.specs??[newSlotSpec()]).map(row).join('')}</div><button type="button" class="display-btn" data-slot-add>新增规格</button>`}
export function readSlotFields(form:HTMLFormElement,original:Partial<AdSlot>){const fd=new FormData(form);const specs=[...form.querySelectorAll('[data-slot-spec]')].map((_,i)=>{const p='slot-spec-'+i+'-',v=(k:string)=>String(fd.get(p+k)??'');const id=v('id'),applicability=v('applicability');const previous=original.id?original.specs?.find(spec=>spec.id===id):undefined;const name=previous?.name??applicability.replace('／横屏',' · 横版').replace('／竖屏',' · 竖版');return {id,name,applicability,width:Number(v('width')),height:Number(v('height')),mediaKinds:previous?.mediaKinds??['image','video'],imageFormats:previous?.imageFormats.length?previous.imageFormats:[...DISPLAY_UPLOAD_RULES.image.formats],videoFormats:previous?.videoFormats.length?previous.videoFormats:[...DISPLAY_UPLOAD_RULES.video.formats],imageMaxMB:previous?.imageMaxMB??DISPLAY_UPLOAD_RULES.image.maxMB,videoMaxMB:previous?.videoMaxMB??DISPLAY_UPLOAD_RULES.video.maxMB,videoMaxSeconds:previous?.videoMaxSeconds??DISPLAY_UPLOAD_RULES.video.maxSeconds,maxImages:previous?.maxImages??5,maxVideos:previous?.maxVideos??1,sizeMode:previous?.sizeMode??'recommend',fit:previous?.fit??'contain'} as AdSpec});return {productLine:original.productLine||String(fd.get('slotProductLine')??''),specs,ratio:[...new Set(specs.map(s=>s.width>0&&s.height>0?ratio(s):'1:1'))].join(' / '),mediaKinds:[...new Set(specs.flatMap(s=>s.mediaKinds))],maxItems:20}}
export function bindSlotFields(form:HTMLFormElement,original:Partial<AdSlot>):void {
 function initApplicability(){const productLine=original.productLine||String(new FormData(form).get('slotProductLine')??'');form.querySelectorAll<HTMLElement>('[data-slot-applicability]').forEach(section=>syncApplicability(section,devicePresets[productLine]??'',true));}
 initApplicability();
 form.addEventListener('change',event=>{const control=event.target as HTMLInputElement;if(control.name==='slotProductLine'){form.querySelectorAll<HTMLSelectElement>('[data-slot-device]').forEach(device=>{if(device.value&&device.value!==legacyOption&&!commonDevicePresets.includes(device.value))device.closest('[data-slot-applicability]')!.querySelector<HTMLInputElement>('input[type=hidden]')!.value=''});initApplicability();return}const section=control.closest<HTMLElement>('[data-slot-applicability]');if(!section)return;if(control.matches('[data-slot-device]'))section.querySelector<HTMLSelectElement>('[data-slot-layout]')!.value='';syncApplicability(section,'');});
 form.addEventListener('click',event=>{const target=(event.target as Element).closest<HTMLElement>('[data-slot-add],[data-slot-remove]');if(!target)return;event.preventDefault();const values=readSlotFields(form,original).specs;if(target.hasAttribute('data-slot-add'))values.push(newSlotSpec());else values.splice(Number(target.dataset.slotRemove),1);form.querySelector('[data-slot-specs]')!.innerHTML=values.map(row).join('');initApplicability();form.dispatchEvent(new Event('input',{bubbles:true}))});
 form.addEventListener('input',event=>{const section=(event.target as Element).closest<HTMLElement>('[data-slot-spec]');if(!section)return;const i=Number(section.dataset.slotSpec),w=Number(form.querySelector<HTMLInputElement>(`[name="slot-spec-${i}-width"]`)?.value),h=Number(form.querySelector<HTMLInputElement>(`[name="slot-spec-${i}-height"]`)?.value);section.querySelector('[data-slot-ratio]')!.textContent=dimensionSummary({width:w,height:h})});
}
