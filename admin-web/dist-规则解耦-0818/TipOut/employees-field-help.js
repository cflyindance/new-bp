/**
 * 员工列表表单 — 字段说明（与 Payroll field-help 交互一致）
 */
(function (global) {
  "use strict";

  var FIELD_HELP = {
    name: {
      title: "姓名",
      body: "员工在全系统中的显示名称。用于 POS 登录界面、小票打印、排班表、小费分配与薪资管理；请与门店实际用工姓名保持一致。",
      sync: "同步至：POS、Tip Out、Payroll、排班与考勤",
    },
    store: {
      title: "门店",
      body: "员工所属门店。用于列表筛选、小费规则按店匹配、Payroll 门店维度展示；一名员工通常归属一个主门店。",
      sync: "同步至：Tip Out 门店规则、Payroll 门店筛选",
    },
    role: {
      title: "岗位",
      body: "员工在门店的业务岗位（如 Server、Cashier）。影响 Tip Out 小费池扣款/接收角色、POS 权限模板与默认考勤规则。",
      sync: "同步至：Tip Out、POS 权限",
    },
    "hire-date": {
      title: "入职时间",
      body: "员工入职日期，格式 MM/DD/YYYY。与「薪资管理」Employees Detail 双向同步，用于报税明细表头展示。",
      sync: "与 Payroll Hire Date 双向同步",
    },
    age: {
      title: "年龄",
      body: "员工年龄，仅供人事档案与合规参考，不下发至 POS 收银流程。",
      sync: null,
    },
    notes: {
      title: "备注",
      body: "内部人事备注，仅后台可见，不同步至 POS 收据或小票打印。",
      sync: null,
    },
    phone: {
      title: "电话",
      body: "员工主要联系电话，供人事管理与紧急联络使用。",
      sync: "POS 本地档案",
    },
    phone2: {
      title: "电话 2",
      body: "备用联系电话，如家属或第二手机号，供紧急联络使用。",
      sync: "POS 本地档案",
    },
    street: {
      title: "街道",
      body: "员工邮寄地址中的街道门牌，用于人事档案与信函寄送。",
      sync: "POS 本地档案",
    },
    city: {
      title: "城市",
      body: "员工地址所在城市。",
      sync: "POS 本地档案",
    },
    state: {
      title: "州 / 省",
      body: "员工地址所在州或省（如 TX、CA）。",
      sync: "POS 本地档案",
    },
    zip: {
      title: "邮编",
      body: "员工地址邮政编码。",
      sync: "POS 本地档案",
    },
    password: {
      title: "密码",
      body: "员工登录 POS 的密码。保存后下发至门店终端；编辑时留空表示不修改已有密码。",
      sync: "下发至 POS 本地终端",
    },
    "card-swipe": {
      title: "刷卡数据",
      body: "员工卡或磁条刷卡编码，用于 POS 刷卡登录。保存后随员工主档下发至门店终端。",
      sync: "下发至 POS 本地终端",
    },
    "earliest-clock-in": {
      title: "最早打卡时间",
      body: "允许员工上班打卡的最早时刻。早于此时间的上班打卡将被 POS 拒绝，用于防止过早到岗未排班打卡。",
      sync: "下发至 POS 考勤门禁",
    },
    "require-clock-in": {
      title: "需要打卡",
      body: "勾选后该员工须在 POS 完成上下班打卡；未勾选则不作为考勤对象（如部分管理岗或系统账号）。",
      sync: "下发至 POS 考勤规则",
    },
    "require-batch-close": {
      title: "需要收银扎帐",
      body: "勾选后该员工在收银班次结束时须完成扎帐（Batch Close）；通常适用于 Cashier 等收银岗位。",
      sync: "下发至 POS 收银流程",
    },
    "require-cash-tip": {
      title: "需要上报现金小费",
      body: "勾选后该员工须在班次结束时上报现金小费金额；通常适用于 Server、Bartender 等收取现金小费的岗位。",
      sync: "下发至 POS 小费上报",
    },
    "pay-type": {
      title: "薪酬类型",
      body: "员工薪酬计算周期：时薪、周薪、双周薪或月薪。时薪类型填写后将同步至 Payroll 基本时薪与加班倍率。",
      sync: "时薪 → Payroll Rate / OT / OT2",
    },
    "pay-amount": {
      title: "薪酬",
      body: "按所选薪酬类型填写的金额：时薪为每小时金额，周薪/双周薪/月薪为对应周期固定薪资金额。",
      sync: "时薪金额同步至 Payroll 基本时薪",
    },
    rate: {
      title: "基本时薪（Payroll）",
      body: "Payroll 报税用正常时薪。时薪类型下可由「薪酬」字段自动推算；也可手工覆盖。Regular 金额 = Regular 工时 × 时薪。",
      sync: "同步至 Payroll 宽表 Rate",
    },
    "ot-rate": {
      title: "加班时薪 OT",
      body: "第一层加班时薪，通常为基本时薪的 1.5 倍。OT 金额 = OT 工时 × 本字段。",
      sync: "同步至 Payroll 宽表",
    },
    "ot2-rate": {
      title: "加班时薪 OT2",
      body: "双倍加班时薪，通常为基本时薪的 2 倍。OT2 金额 = OT2 工时 × 本字段。",
      sync: "同步至 Payroll 宽表",
    },
    "adp-file": {
      title: "ADP File#",
      body: "员工在 ADP 系统中的唯一档案编号。须与 ADP 主档一致方可导出报税 CSV；建议与薪资管理保持一致。",
      sync: "同步至 Payroll · ADP 导出 FILE #",
    },
    ssn: {
      title: "SSN",
      body: "员工社会安全号，格式 XXX-XX-XXXX。与「薪资管理」双向同步，用于 Employees Detail 与报税导出。",
      sync: "与 Payroll SSN 双向同步",
    },
  };

  function getEmployeeFieldHelp(key) {
    return FIELD_HELP[key] || null;
  }

  global.getEmployeeFieldHelp = getEmployeeFieldHelp;
})(typeof window !== "undefined" ? window : global);
