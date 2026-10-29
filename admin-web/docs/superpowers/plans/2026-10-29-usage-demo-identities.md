# 实施计划

1. 新增纯fixture注册/投射器：src/config/merchant-activity-managed-demo.ts；输入当前管理列表，输出canonical Dataset。单测覆盖合并/缺失/改名转归属/原统计对账。
2. merchant-activity-data.ts提供按管理签名与日期刷新；merchant/device两个UI渲染时更新；context/drilldown支持受控旧alias，运行时依然按MID范围校验。
3. 补充浏览器验收，不再临时注入关联数据；验证品牌与门店默认有数据、全局名称、设备归属、日期/返回/权限及新店空态。5258独立功能预览，5197主线不替换。
4. 更新两模块6份文档的当前数据来源、字段及样例，重采页面；记录测试Demo与生产边界。类型、统计域/权限/导航/新ID回归通过后交付，未获授权不提交。
