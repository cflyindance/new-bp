# 订阅模块独立全屏查看品牌权益验证

基线main@38b50372，分支codex/subscription-brand-rights-dialog-20261030，预览5277。

当前实现：查看品牌服务权益在当前标签导航至/m-platform/permissions/merchant-subscriptions/brands/{brandId}/services，隐藏M侧栏与外层页头，复用renderBrandServiceEntitlements的readOnly/embedded渲染。返回订阅明细恢复会话列表滚动位置；不进入品牌管理。

检查通过：品牌绑定、独立全屏、权益汇总与明细、无管理按钮、菜单弹框/Escape返回、返回按钮和浏览器返回恢复列表位置、深链接及刷新、无品牌管理权限的订阅只读账号可看、缺失品牌空态、无服务/订阅写入；TypeScript检查通过。服务权益完整链路与订阅菜单预览回归已通过。

三份文档V1.6，变更SUBSCRIPTION-BRAND-RIGHTS-20261030-79。未提交、合并或推送。
