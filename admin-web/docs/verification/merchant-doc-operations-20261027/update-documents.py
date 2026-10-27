from pathlib import Path
import json,re
root=Path('docs/项目文档');v=Path('docs/verification/merchant-doc-operations-20261027');assets=root/'assets/merchant-operations-20261027'
ordered=['operations.json','operations-extra.json','operations-final.json','operations-links.json','operations-cancel.json'];items=[];events=[]
for f in ordered:
 data=json.loads((v/f).read_text(encoding='utf-8'));events.extend(data.get('errors',[]))
 for x in data['items']:
  x['evidence']=f
  if x['status']=='captured':items.append(x)
items.insert(0,dict(id='m-no-access',page='M平台入口',title='无M权限访问品牌管理',entry='使用未绑定M角色的商家总部演示账号访问品牌管理路由',expect='显示暂无M平台访问权限；不得仅凭商家总部身份进入M',before=None,after='m-access-denied.png',fields=[],status='captured-result-only',evidence='受限态页面实际截图',body='暂无 M 平台访问权限；请联系服务商管理员，为当前员工分配具有相应菜单权限的角色。'))
native_ids={'request-reject-cancel','request-reject-save','request-approve','pos-approve','pos-reject','create-leave-native','crm-sync'}
limitations=[('G01','浏览器原生prompt/alert/confirm','已记录实际文案与确认/取消后果；页面截图不能呈现原生层，相关操作仅结果图覆盖，不声称原生对话框截图完整。'),('G02','原生必填、长度及日期控件校验','截图保留提交后的页面；原生校验气泡不保证被页面截图捕获，不能以页面截图替代原生浮层。'),('G03','M/B分层目标尚未实现','两套商家角色状态统一、M门店上限与B内部启用范围拆分未实现，无目标态真实页面可截图。'),('G04','生产或后端失败分支','本地原型不具备生产认证、真实邮件、Salesforce或后端鉴权证据；受控存储失败只证明本地异常处理。'),('G05','只读筛选现状偏差','已验证currentMAccess=read，查询及重置disabled=true；与只读仍可浏览筛选的设计意图有差异，本次仅记录，不改代码。'),('G06','共享组件与未逐一复现分支','本轮逐项清单覆盖本次列明操作；合同到期阻塞、Loading超时、每个弹框Esc/遮罩及所有业务组合未逐一复现，不凭共用代码推定全部覆盖。'),('G07','无M权限访问的入口过程','采集实际受限结果页，未采集该账号完整登录过程；该项仅结果态覆盖。')]
fieldnames={'name':'姓名／品牌名称（按当前弹框）','email':'登录账号','password':'登录密码／新密码','reason':'操作原因','mode':'菜单配置方式','groupId':'所属集团','contactName':'联系人','code':'品牌编码','timezone':'时区','contactPhone':'联系电话','contractExpiresAt':'合同到期日','merchantName':'申请品牌名称','orgType':'组织类型','primaryAdminEmail':'初始管理员邮箱','applicantEmail':'申请人邮箱','notes':'备注','storeName':'门店名称','address':'地址','posDeviceId':'POS设备标识'}
def title(x):return x['page']+' · '+x['title']
def rowcell(t):return str(t).replace('|','／').replace('\n','；')
check='''# 品牌管理与商户入驻逐操作覆盖清单

变更MERCHANT-OPS-20261027-54；基线main@64ddec8f；功能分支codex/merchant-doc-operations-20261027，5250预览。先建清单再逐项执行；operations*.json保留每项采集前planned及执行后状态。演示品牌、Admin、申请和异常均在独立Edge上下文中构造，不是用户现有商户数据。这里的数量是逐项清单统计，不以图片总数替代操作验收。

| ID | 所属页面 | 操作 | 触发入口 | 操作后界面／结果 | 入口图 | 结果图 | 状态 | 正文位置 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
'''
blocks=[]
for x in items:
 id=x['id'];state='入口及结果已采集'
 if id in native_ids:state='结果已采集；原生层截图受限G01'
 if id=='create-invalid':state='页面已采集；原生校验气泡受限G02'
 if id=='m-no-access':state='仅结果态G07'
 x['coverageStatus']=state
 before=f'assets/merchant-operations-20261027/{x["before"]}' if x.get('before') else None;after=f'assets/merchant-operations-20261027/{x["after"]}'
 assert (root/after).exists()
 if before:assert(root/before).exists()
 check+='| '+' | '.join(map(rowcell,[id,x['page'],x['title'],x.get('entry','页面对应按钮／链接'),x['expect'],before or '未采集完整入口过程',after,state,'三份文档：操作 '+id]))+' |\n'
 b='### 操作 '+id+' '+title(x)+'\n\n'
 if before:b+='!['+title(x)+' 入口](./'+before+')\n\n图注：'+x['page']+'／'+x['title']+'／触发前；main@64ddec8f，5250功能分支；隔离本地演示。\n\n'
 else:b+='入口截图限制：'+limitations[-1][2]+'\n\n'
 b+='!['+title(x)+' 操作后](./'+after+')\n\n图注：同一操作的实际界面／结果；非真实商户历史；状态：'+state+'。\n\n'
 b+='| 字段／操作 | 逻辑说明 |\n| --- | --- |\n'
 b+='| 入口与前提 | '+rowcell(x.get('entry','从所属页面当前可见按钮／链接进入；需具备该M页面及对应操作权限'))+' |\n'
 b+='| '+rowcell(x['title'])+' | '+rowcell(x['expect'])+' |\n'
 seen=set()
 for f in x.get('fields',[]):
  name=f.get('name')
  if not name or name in seen:continue
  seen.add(name);desc=[]
  if f.get('required'):desc.append('必填')
  else:desc.append('该控件未标required，不据此推断所有保存分支可为空')
  if f.get('readOnly'):desc.append('只读，不能修改身份')
  if f.get('disabled'):desc.append('当前状态禁用')
  if f.get('minLength',-1)>0:desc.append('控件最少'+str(f['minLength'])+'字')
  if 0<f.get('maxLength',-1)<10000:desc.append('控件最多'+str(f['maxLength'])+'字')
  if f.get('options'):desc.append('选项：'+'、'.join(f['options']))
  if f.get('type')=='password':desc.append('密码框遮蔽显示；不在文档或审计展示密码值')
  b+='| '+rowcell(fieldnames.get(name,name))+' | '+rowcell('；'.join(desc))+'。实际保存约束另见当前字段字典，不把HTML控件属性当唯一业务校验。 |\n'
 visible=[line.strip() for line in x.get('body','').splitlines() if any(k in line for k in ['请填写','不存在','未保存','已关闭','菜单范围','暂无','版本','配置已更新','当前页面为只读','写入失败']) and 0<len(line)<160]
 if visible:b+='| 可见结果／提示 | '+rowcell('；'.join(dict.fromkeys(visible[:3])))+' |\n'
 if id in native_ids:b+='| 原生提示限制 | 原生提示的准确文案及测试确认／取消选择见operation事件记录；不得把上方结果图冒充原生弹框截图。 |\n'
 b+='| 取消、关闭与异常 | 对本条实际触发的分支按截图及上述结果执行；其他分支必须查对应独立操作ID。未逐一复现的组合见G06，不据本图推定成功、失败、取消均已覆盖。 |\n\n'
 blocks.append(b)
summary='''## 本轮逐操作规范更新 MERCHANT-OPS-20261027-54

本轮按DOC-OP-SCREENSHOT-20261022-01执行。源码基线main@64ddec8f，隔离功能分支codex/merchant-doc-operations-20261027，预览http://127.0.0.1:5250。使用prd-review核对业务、字段、页面与结果；仅修改文档及采集证据，不修改业务实现，也未操作生产数据。

本轮正文范围：M平台品牌管理列表、三步创建、品牌独立详情及其菜单／门店／管理员／审计、关联的开通申请和POS申请。门店管理和硬件资产仅覆盖从品牌业务到达的相关入口，其他外围模块不冒充已完成全量更新；B内部授权仍按目标及差距说明，不伪造尚未实现的界面。

### 复核新增事实

| 项目 | 当前main事实与文档口径 |
| --- | --- |
| M访问权限 | M平台有独立m:资源目录、服务商员工与角色。商家总部身份或B品牌Admin不自动拥有M权限；未绑定者实际显示暂无M平台访问权限。演示管理员走既有显式系统角色，不将演示兼容扩展为生产授权。 |
| 导航与页面名 | M权限导航资源当前仍标品牌列表／门店列表，内容页标题为品牌管理／门店管理。保留这种实际命名差异，不把修改文档当作已改UI。 |
| 页面与独立操作 | 品牌页面访问、进入商家后台、CRM同步、申请批准／驳回等还有独立M操作授权；页面可编辑不等于独立操作已授权。当前新旧控件选择器覆盖仍须实测，不宣称所有控件均被同粒度权限约束。 |
| 只读限制 | 专门验证currentMAccess(m:page:brands)=read后，页面显示只读提示，查询及重置被禁用。记录为实现偏差G05；不在需求中许诺当前只读账号筛选正常。 |
| 申请审批与向导不同 | 三步向导显式开账号、菜单；普通申请审批仍调用旧createMerchant，默认hotpot/POS、默认集团、Asia/Shanghai、沿用申请初始主邮箱并生成邀请预览。不是等同新向导已完成完整授权。 |
| POS申请审批 | 以brandName或storeName建立单店品牌，分配BID、建立门店，full-service/POS、activateImmediately=true、不发邀请。当前自动主邮箱含pos.menusifu.cn，不能套用新Admin表单的域名约束描述所有历史入口。 |
| 演示边界 | 提示“已发送邀请”实际写时间、日志及邮件预览；CRM同步为本地演示；不等于外部邮件、Salesforce或正式认证成功。 |
| 批量预览 | 同集合与差异集合均已实际采集；差异集合测试用第一店空配置、第二店继承构造，未修改产品代码；切换预览不改变保存门店集合。 |
| 异常证据 | 重复邮箱、非法域名、最后Admin保护、并发保存冲突、受控存储写入失败均有实际结果图。存储故障只证明本地失败保留输入，不证明生产事务。 |

### 截图覆盖清单与缺口

逐项清单：[覆盖清单](./品牌管理与商户入驻逐操作截图覆盖清单.md)，机器证据：[采集记录](../verification/merchant-doc-operations-20261027/coverage.json)。旧版按页面配图继续作为布局参考，本节逐操作图片是本轮新增证据。入口与结果图就近内嵌，不能用图册或图片文件存在代替操作覆盖。图片均保留整页上下文，不将隐藏原生提示仿制成网页截图。

'''
summary+=f'本轮清单共{len(items)}项：'+str(sum(x['coverageStatus']=='入口及结果已采集' for x in items))+'项有入口及结果图，其余按原生层／校验气泡／入口过程限制标注。该统计仅指本清单，不代表所有业务组合全部覆盖。\n\n'
summary+='| 编号 | 未完成项／限制 | 原因及交付处理 |\n| --- | --- | --- |\n'+''.join('| '+' | '.join(rowcell(x) for x in row)+' |\n' for row in limitations)+'\n'
# native events transcript is part of the evidence, no credential values.
summary+='### 原生提示的文案与后果\n\n| 场景 | 已知文案与后果 |\n| --- | --- |\n| 驳回申请 | prompt“请输入驳回原因：”；取消不变更，确认后写rejected；空白原因当前落为未说明原因。 |\n| 普通申请批准 | alert提示已通过并创建品牌及onboarding邀请已发送；实际本地创建与邀请预览，不代表真实发信。 |\n| POS申请批准 | alert提示已通过并分配BID，可在组织页挂载到连锁品牌；当前生成本地单店品牌。 |\n| 创建中离开 | confirm“有未保存的品牌配置，是否放弃并离开？”；确认离开，取消保留原路由和草稿。原生层未截图，结果页已采集。 |\n| CRM同步 | alert“CRM 合同已同步。”；仅表示本地演示调用完成。 |\n\n'
section=summary+'## 逐操作正文与就近截图\n\n'+''.join(blocks)
check+='\n## 未完成项与限制\n\n| 编号 | 项目 | 说明 |\n| --- | --- | --- |\n'+''.join('| '+' | '.join(rowcell(x) for x in row)+' |\n' for row in limitations)
(root/'品牌管理与商户入驻逐操作截图覆盖清单.md').write_text(check,encoding='utf-8')
(v/'coverage.json').write_text(json.dumps({'baseline':'64ddec8f','changeId':'MERCHANT-OPS-20261027-54','items':items,'nativeEvents':events,'limitations':limitations},ensure_ascii=False,indent=2),encoding='utf-8')
names=['M平台-入驻商户管理中心设计方案.md','M平台-入驻商户管理中心业务规格说明书（研发交付版）.md','M平台-入驻商户管理中心需求文档（个人规范版）.md']
for i,name in enumerate(names):
 p=root/name;s=p.read_text(encoding='utf-8');idx=s.index('## 阅读范围、证据与复核结论');head=s[:idx]
 head=head.replace('V1.50','V1.51').replace('V1.49','V1.50').replace('2026-10-22 · MB-REVIEW-20261022-53','2026-10-27 · MERCHANT-OPS-20261027-54').replace('现状静态复核完成；目标分层待实现，生产服务未接入。','本轮新增逐操作实采证据；原生层及目标未实现缺口已登记，生产服务未接入。')
 # Restore historical version records, then insert newest row.
 history=s[s.index('## 版本记录'):idx];version='V1.51' if i==0 else 'V1.50';history=history.replace('| --- | --- | --- | --- |','| --- | --- | --- | --- |\n| '+version+' | 2026-10-27 | MERCHANT-OPS-20261027-54 | 品牌管理及入驻方案逐操作截图、M权限前置、审批入口和异常分支复核 |',1);head=head[:head.index('## 版本记录')]+history
 tail=s[idx:];cut=tail.index('## 历史版本与增量记录');active=tail[:cut];archive=tail[cut:]
 active=active.replace('本轮变更 **MB-REVIEW-20261022-53**，源码基线 **main@3f0cb3d5**，在codex/mb-authorization-docs-20261022续作上一轮尚未提交的文档。','上一轮MB-REVIEW-20261022-53以main@3f0cb3d5进行静态复核；本轮MERCHANT-OPS-20261027-54以main@64ddec8f重新核对并采集逐操作证据。')
 active=active.replace('本轮未重新运行浏览器，不宣称全部截图与当前画面一致。','旧页面截图仍仅作历史参考；本轮逐操作章节采用5250预览实采图，原生层及未实现分支按G01—G07登记，不能宣称全部操作截图完整。')
 active=active.replace('本轮为源码／文档静态复核和链接、图片路径、版本、图示围栏检查；沿用的旧测试记录不是本轮重新执行结果。','本轮有隔离浏览器逐操作实采及静态校验；旧测试记录不视为本轮重跑，截图采集不等于所有断言测试或生产验收通过。')
 active=active.replace('本轮未重新截图。','此处为旧版页面图；本轮新操作结果见逐操作章节。')
 active=active.replace('本轮源码基线main@3f0cb3d5','原页面说明基线main@3f0cb3d5，本轮操作证据main@64ddec8f')
 active=active.replace('本轮未重新运行浏览器','上一轮未重新运行浏览器')
 active=active.replace('上文', '上文')
 # Don't silently rewrite approved target permissions to current M behavior.
 p.write_text(head+section+'\n'+active+archive,encoding='utf-8')
print('updated 3 documents and operation checklist',len(items),'items')
