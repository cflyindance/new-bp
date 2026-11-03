# 独立页面返回图标样式

用户明确以提供的新增自助餐规则截图为准；不重新设计。基线 main@c3dee8cb，分支 codex/standalone-back-style-20261103。

参考 dist/Configuration center/assets/order-limit-flow.css 的 .olf-icon-button：48×48px、12px圆角，背景rgba(0,0,0,.04)、图标rgba(0,0,0,.45)，hover背景rgba(0,0,0,.08)。参考JS头部icon(back,20)与路径M19 12H5m7-7-7 7 7 7，20px、描边1.8。无可见返回文案；已有非空aria-label保持不变，无有效aria-label则补原返回文案作为aria-label（无原文案回退“返回”），原aria-labelledby保留并提供aria-label回退。原title保持，缺少时补同语义提示；title不是唯一可访问名称。SVG装饰设置aria-hidden=true和focusable=false。

范围沿用已确认的全项目原生独立页公共头部：仅规范明确传入backHtml的返回槽，不扫描全局按钮、不移动DOM、不代理事件。保持原a/button标签、href/data-*/type/disabled及已存在可访问属性；链接仍为链接，按钮原事件仍由原根处理。槽内仅单一a或button时统一渲染为SVG；异常槽原样保留，不误处理其他HTML。其他页面操作仍在右侧；普通列表、步骤上一页、弹框/抽屉、内嵌子应用不扩大范围。

共享TS渲染与CSS集中落实，旧各模块类保留用于原绑定，但公共按钮高优先级样式统一尺寸/背景/内边距/边框/阴影；仅返回槽受影响。focus-visible提供可见焦点，disabled保持原状态；暗色适配保持对比。适配48px返回后，标题顶部对齐，窄屏无重叠。

更新AGENTS及公共三份文档到V1.1，同一编号STANDALONE-BACK-20261103-01，增加新图和独立验证记录。验证原button与a的属性不丢、无文案SVG可访问，外部浏览器核对权限按钮返回、链接返回及48px计算样式；TypeScript与相关既有回归。无需改变业务存储、权限、确认或草稿保护；本次不提交合并推送。
