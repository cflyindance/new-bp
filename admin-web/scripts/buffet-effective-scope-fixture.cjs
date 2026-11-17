// Isolated browser data only. This function runs in a dedicated test context.
module.exports = function seedEffectiveScope() {
  const p = window.ORDER_LIMIT_MODULE_PROFILE;
  const rule = p.createDefaultScenarioRule(p.defaultScenarios.find(s => s.key === 'party_size|per_round|dish'), 99019);
  rule.origin = 'custom'; rule.status = 'draft';
  const d = rule.editorDraft;
  d.name = '生效范围 UI 验证'; d.currentStep = 4; d.highestStep = 5;
  d.buffetSceneFusionVersion = 1;
  d.buffetTemplateId = 'party-round-basic';
  d.participatingStoreIds = ['ny-midtown', 'flushing']; d.deployStoreIds = ['ny-midtown']; d.activeStoreId = 'ny-midtown';
  const dishId = 'd:g-hotpot:c-hotpot-base:d-pot-single';
  const config = {productLines:['kiosk'],targetIds:['dish:'+dishId],structureByLine:{kiosk:[dishId],emenu:[],sdi:[]},dishTargets:[{productLineId:'kiosk',dishId}],categoryTargets:[],dishSetMembers:[],periodValues:{per_round:{targetLimits:{},exceptionDishLimits:{},totalBounds:{}}}};
  d.storeConfigs = {'ny-midtown':structuredClone(config),flushing:structuredClone(config)};
  d.conditions.effectiveFrom = '2026-11-17'; d.conditions.effectiveTo = '';
  d.conditions.activityCycle = 'weekly'; d.conditions.daysOfWeek = ['mon','tue','wed','thu','fri','sat','sun'];
  d.conditions.memberMode = 'all'; d.conditions.memberLevelIds = [];
  d.conditions.businessHourSlots = [{id:'lunch',mode:'full',from:'',to:''},{id:'dinner',mode:'full',from:'',to:''}];
  d.conditions.businessHourSetupMode = 'all_full';
  p.repository.saveRules([rule]);
};
