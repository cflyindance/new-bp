# 创建品牌字段验收

日期：2026-11-10；变更：BRAND-CREATE-FIELDS-20261110-01。
功能分支：codex/brand-create-fields-20261110；起始 main：f131a421b12b20ba7e21dedd8c94d95cdd6cdc22。
预览：http://127.0.0.1:5314/#/m-platform/merchants/new 。

## 通过的验证

- 字段及编号脚本：可选联系人、名称与联系人长度、业态和产线各至少一项、旧编码占用避让、八位编号耗尽保护。
- 持久化浏览器脚本：两种创建入口注入写入失败后快照和序列不变，恢复后重试复用编号；默认编码等于 BID；内部演示显式编码保留；联系人不阻断启用就绪检查。
- TypeScript：`node node_modules/typescript/bin/tsc --noEmit` 通过。
- 外部 Chrome 实际交互：缺业态、缺产线分别提示；联系人留空进入下一步；核对与返回修改保留输入且不创建；最终创建成功，B00000035 在页头只显示一次，管理员仍需另行开通。

测试先发现旧编码避让、联系人启用门槛及编号耗尽三个缺口，修复后对应断言通过。脚本持久化验证使用隔离浏览器上下文；未修改用户原端口5313的草稿。

## 页面证据

- [品牌信息](../../项目文档/assets/brand-create-fields-20261110/basic.png)
- [缺产线提示](../../项目文档/assets/brand-create-fields-20261110/required-lines.png)
- [创建核对](../../项目文档/assets/brand-create-fields-20261110/review.png)
- [创建成功](../../项目文档/assets/brand-create-fields-20261110/created.png)
- [持久化验证结果](store-test-result.json)

三份商户管理中心文档已同步：产品V1.71、研发V1.70、个人规范V1.70。无 eMenu 源码变更；未执行嵌入包构建。本记录不代表生产后端、部署或其他未改页面已验收。未提交、合并、推送。
