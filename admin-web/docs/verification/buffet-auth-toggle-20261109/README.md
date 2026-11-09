# 自助餐授权开关化实施与验收

变更编号BUFFET-AUTH-20261109-01。用户确认：只移除范围与角色配置入口，保留原授权逻辑。基线main@13d51d69，分支codex/buffet-auth-toggle-20261109；基线已包含远端2d7893b4，本地主线另有未推送成果。

## 范围

- 第三步仅开关，范围角色区不渲染；对应隐藏字段事件忽略；编辑复核仅显示开关状态。
- 默认数据、保存／启用校验、凭证计算与非自助餐流程不改；纯整单既有规范化继续执行。
- 不涉及权限系统改造，不重置历史授权，不补齐非法旧配置。列表和历史发布兼容页的只读范围摘要保留。
- 共享实现调用方：自助餐编辑／查看、非自助餐order-limit编辑；renderStepSix经renderEditorContent调用，两个编辑复核路径调用authorizationSummary；data-auth事件仍由原编辑器change监听处理。profile.steps只影响自助餐步骤说明。

## 证据

- RED：修改verify-buffet-hidden-operation-entry断言后，在原实现因仍出现data-auth-scope/data-auth-role及区域标题失败。
- GREEN：隐藏入口、原授权JSON不变、隐藏事件无脏标记、纯整单原规范化、开／关摘要、非自助餐范围角色及默认原因可编辑测试通过。
- 授权凭证和v4重新启用校验脚本通过，未更改这些生产函数。
- 完整87项verify-buffet-*.mjs通过；TypeScript --noEmit通过；git diff --check通过。
- node scripts/verify-buffet-auth-toggle-browser.cjs通过：实际Chrome验证仅开关、开启／关闭、下一步及返回、自动保存后刷新、原默认配置不变、只读禁用、仅order范围的历史限制保留。开／关截图在三份文档就近引用。
- 浏览器脚本首次在只读入口等待第三步失败，核对initializeViewRule确认只读固定从第一步进入；补上实际点击第三步后通过，未为此修改产品代码。
- 外部用户Chrome恢复连接后实际从列表进入只读规则并打开第三步，确认只有开关；未编辑用户规则。额外截图位于D:/CodexOutputs/buffet-auth-toggle-20261109/external-readonly.png。
- 自动打开外部预览首次超时，恢复浏览器连接并复用既有5310标签页后成功；未切换到应用内浏览器。

## 文件与查询边界

- 生产修改仅order-limit-flow.js中的授权区渲染、范围角色事件保护和编辑复核摘要，以及buffet-rule-profile.js第三步说明。
- 默认工厂、存储仓库、validateStep、validateActivation、授权凭证函数均未修改。既有纯整单规范化保留。
- Wiki查询返回wiki_not_configured，直接复核上述源码及相关测试，不使用历史方案替代当前实现。
- 产品权威V1.11、研发V1.10、个人规范V1.10同一编号BUFFET-AUTH-20261109-01；新增页面截图，不关闭其他五步文档已有缺口。

## 基础设施与边界

首次托管工作区创建因应用连接中断未完成；未使用其初始化检出。重新建立的实际工作区为buffet-auth-toggle-20261109/new-bp/admin-web，托管创建成功。

Build skipped：运行时局部展示及事件保护，不涉及构建边界；CI unknown。真实POS密码认证与执行未验证，既有执行覆盖缺口保持不变。未自动提交、合并或推送。
