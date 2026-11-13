(function () {
  "use strict";
  function array(v) { return Array.isArray(v) ? v : []; }
  function unique(v) { return Array.from(new Set(v)); }
  function catalog() {
    var picker = window.BrandMenuStructurePicker;
    return picker && picker.listAllDishes ? picker.listAllDishes().map(function(p) {
      var suffix=new RegExp("\\s*[（(]"+p.lineLabel+"[）)]$");
      return Object.assign({},p,{dishName:p.dishName.replace(suffix,""),categoryName:p.categoryName.replace(suffix,"")});
    }) : [];
  }
  function enabled(c) {
    return unique(array(c.enabledPeriods).length ? c.enabledPeriods : [c.period]).filter(function(p) { return ["order_lifetime","per_round","multi_round"].indexOf(p)>=0; });
  }
  function scopes(c, storeId) {
    var config = c.storeConfigs && c.storeConfigs[storeId], out = [];
    if (!config) return [];
    enabled(c).forEach(function(period) {
      var parties = c.subject === "party_size" ? Math.max(array(c.partyRanges).length,1) : 1;
      var rounds = period === "multi_round" ? Math.max(array(c.roundRanges).length,1) : 1;
      for(var p=0;p<parties;p++) for(var r=0;r<rounds;r++) {
        out.push(window.BuffetRulePolicy.resolveScenarioTargets(c,config,period,p,r));
      }
    });
    return out;
  }
  function same(item, product, category) {
    return String(item.productLineId || item.lineId) === String(product.lineId) &&
      [category ? product.categoryKey : product.dishKey, category ? product.categoryId : product.dishId].indexOf(String(category ? item.categoryId || item.id : item.dishId || item.productId || item.id))>=0;
  }
  function products(c,storeId) {
    var all=catalog(), selected=[], missing=false, source=scopes(c,storeId);
    var field=c.targetType==="category"?"categoryTargets":c.targetType==="dish_set"?"dishSetMembers":"dishTargets";
    source.forEach(function(scope) {
      array(scope[field]).forEach(function(item) {
        var matches=all.filter(function(product){return same(item,product,c.targetType==="category");});
        if(!matches.length) missing=true;
        selected=selected.concat(matches);
      });
    });
    // Legacy records keep their explicit store identity. Never use another store's targets.
    if(!c.storeConfigs || !c.storeConfigs[storeId]) {
      array(c.targetsByStore && c.targetsByStore[storeId]).forEach(function(item) {
        var matches=all.filter(function(product){return same(item,product,c.targetType==="category");});
        if(!matches.length) missing=true;
        selected=selected.concat(matches);
      });
    }
    var seen={};
    return {items:selected.filter(function(p){var key=p.lineId+"|"+p.dishKey;if(seen[key])return false;seen[key]=true;return true;}),unknown:missing};
  }
  function objectOptions(stores,storeId) {
    return stores.filter(function(s){return !storeId||s.id===storeId;}).flatMap(function(s) {
      return catalog().map(function(p) {
        return {key:JSON.stringify([s.id,p.lineId,p.dishKey]),storeId:s.id,lineId:p.lineId,dishKey:p.dishKey,label:s.name+" · "+p.lineLabel+" · "+p.categoryName+" · "+p.dishName};
      });
    });
  }
  function matchesProduct(row,key,storeId) {
    var ref;try{ref=JSON.parse(key);}catch(e){return false;}
    if(!Array.isArray(ref)||ref.length!==3||storeId&&ref[0]!==storeId||row.deployStoreIds.indexOf(ref[0])<0)return false;
    return products(row.config,ref[0]).items.some(function(p){return p.lineId===ref[1]&&p.dishKey===ref[2];});
  }
  function dateParts(value) {
    var m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value||"");
    if(!m)return null;
    var d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
    if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[3]||+m[4]>23||+m[5]>59)return null;
    return {date:value.slice(0,10),week:d.getUTCDay()||7,day:+m[3],minute:+m[4]*60 + +m[5]};
  }
  function minute(v) {var m=/^(\d{2}):(\d{2})$/.exec(v||"");return m&&+m[1]<24&&+m[2]<60?+m[1]*60 + +m[2]:null;}
  function timeMatch(c,value) {
    var p=dateParts(value),t=c.conditions||{};
    if(!p)return null;
    var validDate=function(v){return !!dateParts(v+"T00:00");};
    if(!validDate(t.effectiveFrom)||t.effectiveTo&&!validDate(t.effectiveTo))return null;
    if(t.effectiveTo&&t.effectiveTo<t.effectiveFrom)return null;
    if(p.date<t.effectiveFrom||t.effectiveTo&&p.date>t.effectiveTo)return false;
    if(t.activityCycle==="weekly") {
      if(!array(t.daysOfWeek).length)return null;
      if(array(t.daysOfWeek).map(Number).indexOf(p.week)<0)return false;
    } else if(t.activityCycle==="monthly") {
      if(!array(t.daysOfMonth).length)return null;
      if(array(t.daysOfMonth).map(Number).indexOf(p.day)<0)return false;
    } else if(t.activityCycle!=="daily") return null;
    var slots=array(t.businessHourSlots), ranges=[];
    if(!slots.length&&t.businessHour)slots=[{id:t.businessHour,mode:t.businessHourTimeMode,from:t.businessHourFrom,to:t.businessHourTo}];
    if(!slots.length)return null;
    for(var i=0;i<slots.length;i++) {
      var slot=slots[i], bounds={all:[0,1440],lunch:[660,1020],dinner:[1020,1380]}[slot.id];
      if(!bounds)return null;
      if(slot.mode==="custom") {
        var from=minute(slot.from),to=minute(slot.to);
        if(from==null||to==null||from>=to||from<bounds[0]||to>bounds[1])return null;
        bounds=[from,to];
      } else if(slot.mode!=="full")return null;
      ranges.push(bounds);
    }
    return ranges.some(function(b){return p.minute>=b[0]&&p.minute<b[1];});
  }
  function timeSummary(c) {
    var t=c.conditions;if(!t||!t.effectiveFrom)return "未设置／无法核对";
    var cycle=t.activityCycle==="daily"?"每天":t.activityCycle==="weekly"?"每周 "+array(t.daysOfWeek).map(function(d){return ["","一","二","三","四","五","六","日"][d]||"?";}).join("、"):t.activityCycle==="monthly"?"每月 "+array(t.daysOfMonth).join("、")+" 日":"周期无法核对";
    var slots=array(t.businessHourSlots),labels={all:"全天",lunch:"午市",dinner:"晚市"};
    var time=slots.map(function(s){return (labels[s.id]||"未知时段")+(s.mode==="custom"?" "+s.from+"–"+s.to:"");}).join("；")||"时段无法核对";
    return t.effectiveFrom+" 至 "+(t.effectiveTo||"长期")+"；"+cycle+"；"+time+(t.memberMode&&t.memberMode!=="all"?"；限指定会员":"");
  }
  function productSummary(row) {
    var c=row.config,ids=array(c.participatingStoreIds),items=[],unknown=false;
    if(!ids.length)ids=array(c.deployStoreIds);
    ids.forEach(function(id){var result=products(c,id);items=items.concat(result.items.map(function(p){return {storeId:id,product:p};}));unknown=unknown||result.unknown;});
    if(!items.length)return unknown?"无法核对商品目录":"未设置";
    var labels=unique(items.map(function(x){return x.product.dishName;}));
    var lines=unique(items.map(function(x){return x.product.lineLabel;}));
    return labels.slice(0,3).join("、")+(labels.length>3?"等":"")+"；"+ids.length+" 家门店 · "+items.length+" 个商品 · "+lines.join("、")+(unknown?"（部分无法核对）":"");
  }
  function channelSummary(row) {
    var c=row.config || {}, field=c.targetType==="category"?"categoryTargets":c.targetType==="dish_set"?"dishSetMembers":"dishTargets";
    var storeIds=unique(array(c.participatingStoreIds).concat(array(c.deployStoreIds),Object.keys(c.storeConfigs || {}),Object.keys(c.targetsByStore || {})));
    var ids=[], unknown=false, all=catalog(), labels={};
    all.forEach(function(p){labels[p.lineId]=p.lineLabel;});
    storeIds.forEach(function(id) {
      var source=scopes(c,id);
      if(!c.storeConfigs || !c.storeConfigs[id]) source=[{[field]:array(c.targetsByStore && c.targetsByStore[id])}];
      source.forEach(function(scope){array(scope[field]).forEach(function(item){
        var line=item.productLineId || item.lineId;
        if(line)ids.push(String(line));else unknown=true;
      });});
    });
    var values=unique(ids).map(function(id){return labels[id] || "未知产线（"+id+"）";});
    if(unknown)values.push("部分产线无法核对");
    return values.join("、") || "—";
  }
  function authorization(c) {
    var a=c.authorization||c.overrideAuthorization;
    if(!a)return "未设置";
    if(!a.enabled)return "不允许授权";
    var labels={operation:"本次操作",round:"当前轮",order:"当前订单"};
    return array(a.allowedScopes).map(function(k){return (labels[k]||k)+"："+(a.scopePermissions&&a.scopePermissions[k]||"权限未设置");}).join("；")||"授权配置不完整";
  }
  window.BuffetListQuery={catalog:catalog,products:products,objectOptions:objectOptions,matchesProduct:matchesProduct,dateParts:dateParts,timeMatch:timeMatch,timeSummary:timeSummary,productSummary:productSummary,channelSummary:channelSummary,authorization:authorization};
})();
