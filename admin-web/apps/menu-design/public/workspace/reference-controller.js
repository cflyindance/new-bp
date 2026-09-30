/* Integration with the existing standalone wizard; no remote requests. */
let referenceFailure=false,referenceUploadToken=0;
function referenceChange(key,value){
  const r=Ref.ensure(s);
  if(key==='interpreted'){r.interpreted=r.analysis.status==='ready'&&!!value;r.confirmed=false;r.samples=false;s.generated=false;s.maxStep=Math.min(5,s.maxStep);clearFiles();save();render();return;}
  checkpoint();dirty(true);r[key]=value;if(['recipe','palette'].includes(key))r.analysis.edited=true;save();render();
}
async function referenceAction(action,id){
  const r=Ref.ensure(s);
  if(action==='choose'){checkpoint();dirty(true);Ref.choose(s,id);error='';save();render();await analyzeReference();return;}
  if(action==='upload'){uploadReference();return;}
  if(action==='analyze'||action==='analysis-fail'){await analyzeReference(action==='analysis-fail');return;}
  if(action==='select'){r.selected=Number(id);r.confirmed=false;s.generated=false;s.maxStep=Math.min(s.maxStep,5);clearFiles();save();render();return;}
  if(action==='confirm'){if(!M.canGenerate(s)){error='请先前往材料体检，完成待办后再采用样稿。';render();return;}Ref.confirm(s,r.selected);if(Ref.ready(s)){s.generated=false;s.maxStep=Math.max(6,s.maxStep);s.overrides={};clearFiles();save();render();toast('参考方向已确认，下一步规划完整菜单');}return;}
  if(action==='fail'){referenceFailure=true;toast('下次样稿生成将失败一次，可体验重试');return;}
  if(action==='samples'){
    if(!M.canGenerate(s)){error='请先前往材料体检，完成待办后再生成样稿。';render();return;}
    if(!r.source||!r.interpreted||r.analysis.status!=='ready')return;
    const token=++job;error='';r.confirmed=false;r.samples=false;s.generated=false;s.maxStep=Math.min(s.maxStep,5);clearFiles();save();busy={type:'reference',progress:10};render();
    for(const progress of [35,68,95]){await new Promise(resolve=>setTimeout(resolve,380));if(token!==job)return;busy.progress=progress;render();}
    busy=null;
    if(referenceFailure){referenceFailure=false;error='演示：样稿生成失败，参考图与商品已保留。请点击「生成 2 个菜单样稿」重试。';render();return;}
    if(!M.canGenerate(s)){error='材料已发生变化，请先重新完成材料体检。';render();return;}
    r.samples=true;r.selected=0;r.sampleInput=JSON.parse(JSON.stringify(Ref.sample(s,0)));save();render();document.querySelector('.reference-candidates')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
}
function uploadReference({autoAnalyze=true}={}){
  document.querySelector('#reference-file-input')?.remove();
  const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg';input.id='reference-file-input';input.hidden=true;input.setAttribute('aria-label','上传菜单参考图');document.body.append(input);input.oncancel=()=>input.remove();
  input.onchange=()=>{
    const file=input.files[0];input.remove();if(!file)return;
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>5*1024*1024){error='参考图上传失败：请选择最大 5 MB 的 PNG 或 JPG。原参考图已保留。';render();return;}
    const token=++referenceUploadToken,target=s,reader=new FileReader();
    const fail=()=>{if(token!==referenceUploadToken||target!==s)return;error='无法解码参考图，原图与商品已保留，请重新上传。';render();};
    reader.onerror=fail;reader.onload=()=>{const img=new Image();img.onerror=fail;img.onload=()=>{
      if(token!==referenceUploadToken||target!==s||busy)return;
      const ratio=Math.min(1,1000/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*ratio));cv.height=Math.max(1,Math.round(img.height*ratio));cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      checkpoint();dirty(true);Object.assign(Ref.ensure(s),{source:'upload',id:null,name:file.name,image:cv.toDataURL('image/png'),recipe:'hero',palette:'nature',analysis:{status:'idle',kind:'demo'}});error='';save();render();document.querySelector('.simple-upload-analysis')?.scrollIntoView({behavior:'smooth',block:'start'});if(autoAnalyze)analyzeReference().catch(err=>{busy=null;Ref.ensure(s).analysis.status='failed';error=err.message;save();render();});
    };img.src=reader.result;};reader.readAsDataURL(file);
  };input.click();
}
async function analyzeReference(fail=false){
  const target=s,r=Ref.ensure(s);if(!r.source||busy)return;
  checkpoint();dirty(true);Ref.beginAnalysis(s);
  const token=++job;error='';busy={type:'analysis',progress:8};save();render();
  document.querySelector('.main')?.scrollTo({top:0,behavior:'smooth'});
  for(const progress of [30,58,82,100]){
    await new Promise(resolve=>setTimeout(resolve,500));
    if(token!==job||s!==target||Ref.ensure(s)!==r)return;
    busy.progress=progress;render();
  }
  busy=null;
  if(fail){r.analysis.status='failed';save();render();document.querySelector('.analysis-status')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
  Ref.finishAnalysis(s);save();render();
  document.querySelector('.analysis-report')?.scrollIntoView({behavior:'smooth',block:'center'});
}
