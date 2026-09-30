/* Shared reference-driven scene: preview, editor hit boxes and export. */
(function(root){
  const R=root.MenuRenderer;
  let renderSequence=0;
  function positions(s,page){
    const h=1000*s.height/s.width,top=h>1000?230:150,H=Math.max(90,h-top-65),gap=20,n=page.items.length;
    const layout=s.layout||'grid', boxes=[];
    if(layout==='hero'&&n>1){
      if(h>1000){const hh=H*.43;boxes.push([50,top,900,hh]);const cols=2,rows=Math.ceil((n-1)/cols),ch=(H-hh-gap-(rows-1)*gap)/rows;for(let i=1;i<n;i++)boxes.push([50+((i-1)%2)*460,top+hh+gap+Math.floor((i-1)/2)*(ch+gap),440,ch]);}
      else {boxes.push([50,top,390,H]);const cols=n>4?2:1,rows=Math.ceil((n-1)/cols),cw=(490-(cols-1)*gap)/cols,ch=(H-(rows-1)*gap)/rows;for(let i=1;i<n;i++)boxes.push([460+((i-1)%cols)*(cw+gap),top+Math.floor((i-1)/cols)*(ch+gap),cw,ch]);}
    } else if(layout==='collage'&&n===4){
      boxes.push([50,top,360,H*.56],[440,top+18,510,H*.4],[70,top+H*.56+20,480,H*.44-20],[580,top+H*.4+40,370,H*.6-40]);
    } else if(layout==='collage'&&n===6){
      const cw=280;
      for(let i=0;i<6;i++){const col=i%3,split=[.60,.43,.52][col],first=(H-20)*split;boxes.push([50+col*310,top+(i<3?0:first+20),cw,i<3?first:H-first-20]);}
    } else if(layout==='text'){
      const cols=h>1000?1:2,rows=Math.ceil(n/cols),cw=(900-(cols-1)*40)/cols,ch=(H-(rows-1)*16)/rows;for(let i=0;i<n;i++)boxes.push([50+(i%cols)*(cw+40),top+Math.floor(i/cols)*(ch+16),cw,ch]);
    } else {
      const cols=h>1000?2:(n>4?3:2),rows=Math.ceil(n/cols),cw=(900-(cols-1)*gap)/cols,ch=(H-(rows-1)*gap)/rows;
      for(let i=0;i<n;i++){let x=50+(i%cols)*(cw+gap),y=top+Math.floor(i/cols)*(ch+gap),w=cw,hh=ch;
        if(layout==='collage'){const inset=(i%3)*9;x+=inset;w-=inset+(i%2?12:0);y+=i%2?22:0;hh-=i%2?22:9;}
        if(layout==='editorial'){w=cw*(i%cols===0?.83:1);x+=i%cols===0?0:0;y+=i%cols===0?0:30;hh-=i%cols===0?0:30;}
        boxes.push([x,y,w,hh]);}
    }
    const ordered=layout==='hero'?[...page.items].sort((a,b)=>(b.id===s.featured?1:0)-(a.id===s.featured?1:0)):page.items;
    return ordered.map((item,i)=>{let [x,y,cw,ch]=boxes[i]||[50,top,900,H];const ai=s.aiDesign?.slots?.[i];if(ai){x=50+ai.x*900;y=top+ai.y*H;cw=ai.w*900;ch=ai.h*H;}if(s.compositionVariant===1)x=1000-x-cw;const o=s.overrides[item.id]||{};return {item,x:o.x??x,y:o.y??y,cw:o.cw??cw,ch:o.ch??ch,scale:o.scale||1,locked:!!o.locked}});
  }
  function svg(s,page,selected){
    page=page||{id:'p0',items:[]};const prefix='layout-'+(++renderSequence),p=root.MenuModel.brandPalette(s,s.aiDesign?.palette||R.palettes[s.style]||R.palettes.nature),h=1000*s.height/s.width,portrait=h>1000;
    const text=(x,y,size,value,color=p.ink,attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${attrs}>${R.esc(value)}</text>`;
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${h}" role="img" aria-label="参考构图菜单预览" font-family="Microsoft YaHei,sans-serif"><rect width="1000" height="${h}" fill="${p.bg}"/>`;
    if(s.layout==='collage')out+=`<circle cx="910" cy="100" r="140" fill="${p.accent}" opacity=".09"/><path d="M0 ${h*.55} Q500 ${h*.3} 1000 ${h*.68}L1000 ${h}H0Z" fill="${p.accent}" opacity=".045"/>`;
    if(s.layout==='editorial')out+=`<rect x="30" y="25" width="8" height="${h-50}" fill="${p.accent}"/>`;
    out+=text(50,55,11,'SEASONAL SELECTION / MENU',p.accent,'letter-spacing="3"')+text(48,105,40,s.brand,p.ink,'font-family="SimSun,serif" font-weight="bold"')+text(51,130,12,s.subtitle,p.muted);
    if(portrait)out+=text(50,190,18,s.goal+' · '+(page.items[0]?.category||'当季料理'),p.accent);
    if(s.logo)out+=`<image href="${R.esc(s.logo)}" x="875" y="48" width="70" height="70" preserveAspectRatio="xMidYMid meet"/>`;
    for(const z of positions(s,page)){
      const {item,x,y,cw,ch,scale,locked}=z,o=s.overrides[item.id]||{},has=(item.image||item.art)&&s.layout!=='text',vertical=has&&ch>220&&ch>cw*.65;
      out+=`<g data-component="${item.id}" transform="translate(${x} ${y}) scale(${scale})"><rect width="${cw}" height="${ch}" rx="${s.layout==='collage'?18:2}" fill="${s.layout==='collage'?'none':p.card}"/>`;
      let tx=14,ty=24,tw=cw-28;
      if(has){const iw=vertical?cw-24:Math.min(cw*.32,ch-20),ih=vertical?Math.max(60,ch-118):ch-20;
        const clip=`${prefix}-${page.id}-${item.id}`;
        out+=`<defs><clipPath id="${clip}"><rect x="12" y="10" width="${iw}" height="${ih}" rx="${s.layout==='collage'?Math.min(iw,ih)*.4:2}"/></clipPath></defs><image href="${R.esc(item.image||R.artURI(item.kind))}" x="12" y="10" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid ${o.crop==='contain'?'meet':'slice'}" clip-path="url(#${clip})"/>`;
        if(vertical)ty=ih+29;else {tx=iw+22;tw=cw-tx-12;}
      }
      const compact=ch<125,sz=Math.min(25,Math.max(13,tw/Math.min(item.name.length,10))),nameY=ty+(compact?0:24);
      if(!compact)out+=text(tx,ty-7,10,item.category,p.accent);
      out+=text(tx,nameY,sz,item.name,p.ink,`font-family="${s.fontMood==='serif'?'SimSun,serif':'Microsoft YaHei,sans-serif'}" font-weight="bold" textLength="${Math.min(tw,item.name.length*sz)}" lengthAdjust="spacingAndGlyphs"`);
      if(s.language==='双语'&&ch>105)out+=text(tx,nameY+19,9,item.en,p.muted,`textLength="${Math.min(tw,item.en.length*5)}" lengthAdjust="spacingAndGlyphs"`);
      out+=text(tx,Math.min(ch-12,nameY+(ch>105?53:30)),compact?22:28,item.price===null?'待确认':'¥ '+Number(item.price).toFixed(2).replace(/\.00$/,''),p.accent,'font-family="Georgia,serif"');
      if(s.featured===item.id&&cw>300&&ch>180)out+=text(cw-80,ch-12,8,'CHEF’S PICK',p.accent);
      if(selected===item.id)out+=`<rect width="${cw}" height="${ch}" fill="none" stroke="#376cf0" stroke-width="3" stroke-dasharray="6 4"/>`;
      if(selected&&locked)out+=`<rect x="${cw-15}" y="${ch-15}" width="11" height="11" fill="#376cf0"/>`;
      out+='</g>';
    }
    out+=`<path d="M50 ${h-47}H950" stroke="${p.line}"/>`+text(50,h-25,10,s.promo||'用心料理 · 随季而食',p.muted)+text(850,h-25,10,'MENU / '+String(Math.max(1,root.MenuModel.pages(s).findIndex(x=>x.id===page.id)+1)).padStart(2,'0'),p.muted);
    return out+'</svg>';
  }
  root.MenuLayouts={positions,svg};
  const oldSVG=R.svg,oldPositions=R.positions;
  R.svg=(s,p,selected)=>s.layout||root.MenuModel.ensureBrand(s).primary?svg({...s,layout:s.layout||'grid'},p,selected):oldSVG(s,p,selected);
  R.positions=(s,p)=>s.layout?positions(s,p):oldPositions(s,p);
})(window);
