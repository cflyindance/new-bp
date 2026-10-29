# 经营业态维护与菜单绑定验证

BUSINESS-TYPE-MAINTENANCE-20261029-70。基线main@55f13b06；功能分支codex/business-type-maintenance-20261029；目录D:/Projects/new-bp-worktrees/business-type-maintenance-20261029/admin-web；5269功能预览，不是main。

范围：新增/改名复用现有M自定义业态目录；内置名称保留。业态下管理多个服务方式/组织模式的菜单模板，草稿/发布、品牌主动应用和门店权限上限沿用既定规则。品牌创建不再仅显示前8个业态。

验证：verify-business-type-maintenance.cjs实际验证重名拒绝、新增、改名后ID不变、从业态进入预填模板编辑器、绑定真实发布菜单、发布后品牌筛选可见、品牌创建基础资料可见、原品牌菜单键不变、只读操作拒绝、无pageerror。回归前在隔离浏览器建立稳定的显式品牌菜单fixture，避免原默认推荐菜单随着目录首次加载而变化干扰断言。

另执行tsc --noEmit、原verify-business-menu-templates.cjs、verify-m-platform-permissions.ts及diff检查。正常状态截图：新增、维护列表、绑定菜单、品牌选择自定义业态；独立错误状态/改名状态专属图片待补，正文不把新增状态图声明为改名实采。

边界：没有删除内置业态或强制删除已引用目录项；自定义目录使用既有本地存储，正式后端审计、并发事务与跨设备同步仍未实现。新增或改名不自动改变品牌菜单，不自动购买收费服务。用户已授权提交、合并及推送，交付提交以Git历史为准。

文档：业态菜单模板三份V1.1；商户管理产品V1.67、研发及个人规范V1.66；企业平台预设入口v1.2。
