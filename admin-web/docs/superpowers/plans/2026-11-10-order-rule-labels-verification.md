# 下单规则命名验证记录

- 变更编号：NAV-ORDER-LABELS-20261110-01。
- 功能分支：codex/order-rule-labels-20261110；起始 main@f6be9ebe3750e68160cec677958fe641abf3bba9；用户已授权本地提交与合并，提交标识以 Git 历史为准。
- 实际目录：C:/Users/27273/.codex/worktrees/order-rule-labels-20261110/new-bp/admin-web。
- 开始前成功获取 origin/main@0aa320f009cd2585df3d252dda27ce239548eafb；本地 main 领先两个已合入未推送提交，完整保留。该记录不表示后续远端持续不变。
- 独立功能预览：端口5313，http://127.0.0.1:5313/#/operations/queue-call/buffet-rules；未替换 main 服务。

## 验证结果

| 检查 | 结果 |
|---|---|
| 命名回归 RED | 修改测试期望后，原父标题“菜单下单限制”与“下单规则”不匹配，符合预期。 |
| 命名回归 GREEN | verify-rule-restrictions-navigation.ts 通过，覆盖3／2／1／0可见矩阵、输入不变、旧发布名称规范化、原路由和空父项。 |
| 公共导航 | verify-recursive-navigation-interaction.mjs、verify-buffet-rule-navigation.mjs、verify-buffet-rule-fullscreen.mjs通过。 |
| 自助餐规则 | 87个 verify-buffet-*.mjs全部通过。 |
| 类型检查 | npx --no-install tsc --noEmit通过；可选ID处理已补保护。 |
| 原生Chrome | verify-order-rule-labels-browser.cjs通过；真实点击父项和三个叶子，核对顺序、标题、iframe名称、原地址、同轮说明及三个设置分类；无pageerror。仅隔离账号，未修改生产权限。 |
| 原有浏览器回归 | verify-buffet-period-column-browser.cjs及verify-buffet-auth-toggle-browser.cjs通过；列设置和授权行为不变。 |
| 设置分类公共脚本 | verify-settings-category-sidebar.ts在仅补浏览器事件接口的Node环境下通过；26个目录／103个分类。 |
| 构建／部署 | 未执行生产构建，不涉及应用入口、资源边界、依赖或编译配置；CI及部署未知。 |

## 独立缺口

1. verify-menu-order-other-categories.ts直接在Node运行缺少window；补事件接口后，data-category-grant="interval"断言仍失败。在实际main检出同样复现，不修改该历史权限测试以掩盖失败。新命名浏览器回归已核对下单设置原分类，未声称完整权限编辑验收通过。
2. verify-subscription-read-quota-browser.cjs隔离容量异常测试可完成父子导航及自助餐iframe访问，但警告次数为2而非预期1，最后断言失败。未确认该独立缓存告警的根因；本任务不改存储、授权或测试次数阈值。
3. 本次仅更新导航受影响正文；三份历史文档内其他模块的旧版本段落、截图与既有缺图未批量治理，不宣称全部历史文档已清理。
4. 生产账号权限、真实下发和POS实际下单未验收。用户已授权本地提交与合并，未授权推送；功能预览5313仍是独立功能目录，不冒充main预览。

截图位于 ../../项目文档/assets/order-rule-labels-20261110/，均来自同一功能目录与端口。图片表示当前隔离账号可见状态，不用于推导其他账号权限。
