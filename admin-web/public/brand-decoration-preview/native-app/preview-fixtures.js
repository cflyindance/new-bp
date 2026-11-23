/* 原生组件预览的数据适配；不定义或覆盖页面样式。金额为美元演示数据。 */
window.KioskNativeFixtures = {
  prepare(state, page, goods) {
    if(page==='menu'){const samples=[['香菇卤肉饭',26],['咖喱鸡肉饭',29],['照烧鸡肉饭',28],['番茄牛腩饭',32],['清爽蔬菜沙拉',18],['热汤',12]];samples.forEach(([name,price],i)=>goods.push({...goods[0],id:'preview-extra-'+i,name,displayName:name,price,basePrice:price,sequence:i+3}));}
    const cfg = state.selfConfig;
    const set = (id, value) => { cfg.configList.find(c => c.id === id).value = value; cfg.configMap['id_' + id] = value; };
    set(4, [0, 1]); set(8, 1); state.menuGroup.forEach(group => group.menuCategories.forEach(category => { category.groupId = group.id; }));
    if (page === 'screensaver') set(35, {...cfg.configMap.id_35, dataSource: 'local', delayTime: 0});
    cfg.charge = [{id: 2, select: {id: -1, rate: 0}}, {id: 3, select: {id: -1, rate: 0}}];
    goods.forEach(item => Object.assign(item, {hiddenItem: false, remark: {optionName: '', optionType: 'NOTE', price: 0, quantity: 1}, selectedOptionList: [], sectionDetail: [], taxIds: [], printerIds: [], fieldDisplayNameGroups: [], comboSections: []}));
    if (!['home', 'screensaver', 'orderType', 'menu', 'detail', 'combo', 'login'].includes(page)) state.currentOrder.itemList = goods;
    state.currentItem = {...goods[0], ...(page === 'combo' ? {isCombo: true, comboType: 'CHOICE_SELECTION', name: '招牌双拼套餐', comboSections: [{id: 101,name:'选择配菜',min:1,max:1,minNumOfSelectionAllowed:1,maxNumOfSelectionAllowed:1,numOfItemAllowed:1,comboSectionSaleItems:[{saleItemId:goods[1].id,addPrice:0}]}]} : {})};
    state.currentOrder.originalItemList = goods;
    Object.assign(state.currentOrder.saveOrderResult, {id: 38038, status: 'PAID', orderStatus: 'PAID', totalPrice: 60, subTotal: 60, tax: 0, totalTax: 0, totalTips: 0, remainingAmount: 0, customer: {phone: []}, discountList: []});
    state.togoList = cfg.charge.map(c => ({...c, select: {}}));
    state.allSysConfig = {...state.allSysConfig, RECEIPT_PRINT: 'true', ...(page === 'paymentMember' ? {CRM_INTEGRATION_SERVICE_ENABLED: 'true'} : {})};
    if (page === 'reward') state.crm = {...state.crm,memberCRMInfo: {_id: 'preview-member',id:'preview-member',pointBalance:200,phone:'2125550100'}};
    if (page === 'paymentMember') {
      state.currentOrder.paymentMemberCardRecord = {paymentRecordId: 'preview-card', orderId: 38038, orderStatus: 'PAID', isFullCreditPayment: true, guideSettings: {enabled: true, terminalRegistrationGuide: {enabled: true}}};
      state.currentOrder.paymentTypeTrail = ['CREDIT_CARD'];
    }
    window.__nativeFixtureResponse = url => {
      if (url.includes('marginapp/fetchConfig')) return {result: {successful: true}, marginAppConfigTypes: [{product: 'KIOSKLITE', data: JSON.stringify(cfg)}]};
      if (url.includes('payment-member/query')) return {code: 0, data: {resultType: 'NO_STRONG', isPrimaryCardPayment: true, results: []}};
      return {result: {successful: false}, data: [], msg: '原生预览：未连接业务服务'};
    };
    return state;
  },
  pageState(page) {
    if (page === 'reward') return {crmType:1};
    if (page === 'cardPayment') return {tipsLoading: false};
    if (page === 'waitList') return {manualRefresh: false};
    if (page === 'detail') return {totalPrice: '28.00'};
    if (page === 'chooseTable') return {
      tabIndex: 1, tableLayout: {width: 900, height: 1050},
      areaList: [{id: 1, name: '大厅', tables: [1, 2, 3, 4].map((id, i) => ({id, name: 'A0' + id, number: 'A0' + id, guestNumber: 4, orders: [], x: .12 + Math.floor(i / 2) * .3, y: .18 + i % 2 * .35, width: .16, height: .16, shape: 'SQUARE'}))}]
    };
    return {};
  },
  note(page) {
    return page === 'waitList' ? '原项目排队页为外部 ePager iframe；当前无门店连接，仅展示原生容器，不包含外部系统页面。' : '';
  }
};
