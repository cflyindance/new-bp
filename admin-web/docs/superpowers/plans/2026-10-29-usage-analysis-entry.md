# 实施计划

1. 核对m-platform-catalog/domain/store/navigation及现有权限回归，分离目录，增加可复算的旧角色迁移测试。
2. 阅读merchant-activity-ui/drilldown/domain与enterprise-merchant-scope/ui，提取可复用上下文组件，精确ID限定集合；新增usage页签与可校验的分析上下文/返回链接。
3. 查找分析模块三份权威文档，连同商户中心三份同步更新；新页面独立实采，空态及权限受限实采。
4. tsc、权限迁移/导航/范围单测、原分析域测试与浏览器门店/品牌/返回/只读/空态/筛选回归。启动独立端口5257，保持5197主线独立。
5. 核对diff和文档链接后交付功能分支效果，保留未提交状态。
