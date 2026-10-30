# 商家订阅主体基本信息验证

分支codex/subscription-subject-info-20261030，起始main@fb8063e6，功能预览5288，实际目录D:/Projects/new-bp-worktrees/subscription-subject-info-20261030/admin-web。已获取远端main，本地main包含已授权合并未推送成果。

主体名称按钮按brand/store及subjectId读取当前资料，独立只读弹框；品牌显示公开BID/类型/服务状态/联系人/电话/主管理员/门店数/创建时间/时区；门店显示MID/品牌/BID/状态/地址/邮编/开业及关联时间。无集团、内部编码、密码或编辑入口。数据缺失显示—，主体缺失提示保留记录ID。

verify-subscription-subject-info.cjs通过品牌/门店对应、公共ID、同页不跳转、Escape/关闭/焦点恢复、路由清理、主体已移除、筛选行数保留及存储无写入。列表筛选回归通过，TypeScript通过。截图list.png、brand.png、store.png实采，品牌弹框视觉核验通过。

三份需求文档V1.14，同一变更SUBSCRIPTION-SUBJECT-INFO-20261030-87。尚未提交、合并、推送。
