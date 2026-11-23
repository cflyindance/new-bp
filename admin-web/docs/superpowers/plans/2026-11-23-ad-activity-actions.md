# 广告素材活动交互实施计划

目标：B平台广告位管理中按素材配置不跳转／项目内活动／外部活动，支持批量应用、只读预览、保存与上架检查；统一活动承载及终端接入契约。
基线origin/main@e53bf4b5；分支codex/ad-activity-actions-20261123。按用户已确认方案执行，不新增M运营能力勾选，不提交合并推送。

- [x] 核验最新main和广告位规格调整；独立worktree；读取后台UI规范。
- [x] 共享活动动作契约、活动目录适配、渠道能力／域名配置、资格与排期及门店校验、统计与运行时兜底。
- [x] 原生新建／编辑页素材级配置、应用到全部、活动选择、预览；动作跟随排序、删除、规格切换、复制、视频存储及返回。
- [x] 宿主注入真实品牌和权限上下文；保存／上架／时间保存按最新活动数据复核。
- [x] 统一活动承载页，内部复用适配器、外部受限H5、状态失效与返回；预览不执行真实参与操作。
- [x] 领域及存储边界测试、现有广告回归、TypeScript、实际PC浏览器交互和截图。
- [x] 唯一三份文档V1.19同步及独立交付缺口记录。

现状边界：当前仓库广告为localStorage／IndexedDB演示，促销／积分顾客活动列表和详情API尚未找到；已异步询问接口位置。先提供明确适配接口与无数据／失败态，测试数据仅注入隔离会话，不能伪造真实活动或真实终端接入。

文件：src/marketing-display/ad-activity-actions.ts（规则、目录和运行时）；dist/Configuration center/assets/kiosk-ad-activity-editor.js（素材动作界面）；activity.html及配套runtime（统一承载）；kiosk-theme-position-editor.js及create/edit保存加载链；marketing-screensaver-fullscreen.ts（品牌权限桥）；verify-ad-activity-actions.ts（集成契约测试）。

五份Kiosk业务文档已核对；原促销适配器已完成。上述完成项仅指本仓库实现与本地验证，真实接口、终端、外部合作页及服务端统计接入未完成，见V1.19验证记录。
