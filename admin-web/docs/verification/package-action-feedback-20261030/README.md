# 服务包操作浮层与反馈验证

基线main@5d012ef1；分支codex/package-action-feedback-20261030；预览端口5298；2026-10-30。

- verify-package-action-feedback.cjs通过：下方锚定浮层、行高不变、再次点击／外部点击／Escape关闭、方向键与焦点返回；取消不写入；风险分区、原因错误、成功与草稿未发布反馈；发布冲突保留弹框；放弃编辑保护；窄屏边界。
- verify-service-package-lifecycle.cjs通过：原上下架、停用恢复、删除、商业口径及权限保护不变。
- verify-service-detail-layout.cjs通过：原详情页签、草稿、发布、回滚和离开保护。
- 三份需求文档V1.24，变更编号PACKAGE-ACTION-FEEDBACK-20261030-97。
- 截图为功能分支实采。未新增保存二次确认，未改计费、授权或服务生效规则。

按用户要求移除影响范围底部的统计口径说明段落，数量、名单及授权计算不变；已增加页面断言。
