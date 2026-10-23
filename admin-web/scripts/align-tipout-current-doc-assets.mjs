// Mechanical metadata and screenshot-reference alignment; business edits are reviewed in Markdown.
import fs from 'node:fs';
const dir='dist/TipOut/docs/';
const files=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
const versions=['V4.18','V3.18','V2.16'];
const captures=[
 ['tips-hours-help-alignment-20261023/clock.png','hours-clock','工时分配＋仅打卡；标题问号展开'],
 ['tips-hours-help-alignment-20261023/unrestricted.png','hours-unrestricted','工时分配＋不限打卡；原帮助内容保留'],
 ['tips-rule-editor-groups-20261023/top.png','editor-top','新增普通规则；基础与分配分组，模式默认折叠'],
 ['tips-rule-editor-groups-20261023/contribution.png','contribution-no-role','规则页下部；参与资格后为独立贡献分组，无角色不展示员工承担行'],
 ['tips-rule-editor-groups-20261023/commission.png','commission','计提模式；原贡献分组隐藏'],
 ['tips-share-copy-trim-20261023/average.png','share-average','员工承担比例；平均模式只读比例，无长说明'],
 ['tips-share-copy-trim-20261023/custom.png','share-custom','员工承担比例；自定义40/60，合计100%'],
 ['tips-contributor-shares-20261023/invalid-total.png','share-invalid','自定义40＋50=90%；点击确定被拦截，草稿保留'],
 ['tips-contributor-shares-20261023/detail-shortfall.png','contribution-shortage','已发放快照；本条A应扣40、余额20、实扣20，少扣提示展开'],
 ['tips-daily-shortfall-20261023/shortfall-expanded.png','funding-shortfall','C<P规则：实际贡献不足，按计划分配，老板补足提示展开'],
 ['tips-funding-excess-20261023/excess-explanation.png','funding-excess','C>P规则：按实际贡献分配，超出部分全部参与分配'],
 ['tips-operations-20261023/rules-list.png','rules','当前分配规则列表：门店筛选、统计及新增入口'],
 ['tips-operations-20261023/rule-edit-default.png','editor-top','当前新增普通规则：基础信息及分配区域，不是编辑回填'],
];
for(let i=0;i<files.length;i++){
 let text=fs.readFileSync(dir+files[i],'utf8');
 const newline=text.includes('\r\n')?'\r\n':'\n';text=text.replaceAll('\r\n','\n');
 text=text.replace('最新维护：TIPOUT-RULE-EDITOR-GROUPS-20261023-01。','历史维护：TIPOUT-RULE-EDITOR-GROUPS-20261023-01。');
 text=text.replaceAll('门店／角色未选时入口保持禁用；','该批入口禁用已被后续规则替代：无角色隐藏，有角色无门店点击提示；');
 text=text.replaceAll('旧角色无独立公式、salesPct组承担、旧funding配置及计提／时段兼容未自动迁移','未配置employeeShares的旧salesPct／角色归集、旧funding及计提／时段兼容未自动迁移；显式员工承担路径按前文已确认定义计算');
 text=text.replace('## 本轮截图来源与未完成项','## 历史截图来源与原未完成项（65114批次）');
 // Insert one revision; never rewrite historical version rows.
 const header='| 版本 | 日期 | 修改内容 | 对应版本 |';
 const section=text.indexOf('## 版本记录');
 const at=text.indexOf('| 版本 |',section);if(at<0)throw Error('Version table not found '+files[i]);
 const end=text.indexOf('\n',text.indexOf('\n',at)+1);
 if(!text.includes(`| ${versions[i]} | 2026-10-23 | TIPOUT-DOC-CURRENT`))text=text.slice(0,end+1)+`| ${versions[i]} | 2026-10-23 | TIPOUT-DOC-CURRENT-20261023-01：核对主线实现，修正规则排列、资金路径状态及旧配对信息，更新真实截图，登记UI-01／02偏差；无新增业务 | 产品V4.18／研发V3.18／个人V2.16 |\n`+text.slice(end+1);
 // Repair pre-existing three-column headings above four-cell revision rows without removing history.
 const start=text.indexOf('## 版本记录'),next=text.indexOf('\n## ',start+4);
 const versionBlock=text.slice(start,next<0?text.length:next).split('\n').map(line=>{
  if(line==='| 版本 | 日期 | 修改内容 |')return '| 版本 | 日期 | 修改内容 | 对应版本 |';
  if(line==='| --- | --- | --- |')return '| --- | --- | --- | --- |';
  if(/^\| V\d/.test(line)&&line.split('|').length===5)return line+' — |';
  return line;
 }).join('\n');
 text=text.slice(0,start)+versionBlock+(next<0?'':text.slice(next));
 for(const [old,name,state] of captures){
  const escaped=old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex=new RegExp(`!\\[[^\\]]*\\]\\(assets/${escaped}\\)\\n\\n图注：[^\\n]*`,'g');
  text=text.replace(regex,`![${state}](assets/tips-docs-current-20261023/${name}.png)\n\n图注：${state}。2026-10-23／main@e8d203b0／65132独立演示；实际页面采集，非生产交易。只证明所示状态，其他结果沿用逐操作缺口。`);
 }
 fs.writeFileSync(dir+files[i],text.replaceAll('\n',newline));
}
console.log('Aligned revision metadata and selected current screenshots in three documents');
