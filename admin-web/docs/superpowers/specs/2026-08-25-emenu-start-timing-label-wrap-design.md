# eMenu 首页开单计时按钮换行设计

## 背景

eMenu 首页圆形主按钮已经对“开始点单”“继续点单”及其英文文案采用固定两行展示，但 KTV 计时桌在未开始计时时显示的“开单计时”仍为单行，视觉表现不一致。

## 目标

- 简体中文“开单计时”固定显示为两行：第一行“开单”，第二行“计时”。
- 英文“Start timing”固定显示为两行：第一行“Start”，第二行“timing”。
- 保持“开始点单”“继续点单”及英文标签的现有两行行为。
- 仅影响首页圆形主按钮，不改变弹窗、提示信息或其他位置的计时文案。

## 设计

扩展 `Landing` 页面现有的 `renderStartButtonLabel` 标签拆分逻辑。该函数仍从国际化资源取得完整文案，再针对首页按钮支持的四种已知标签进行结构化拆分，并在两部分之间渲染 `<br />`：

- `开始点单` → `开始` / `点单`
- `继续点单` → `继续` / `点单`
- `Start Order` → `Start` / `Order`
- `Continue Order` → `Continue` / `Order`
- `开单计时` → `开单` / `计时`
- `Start timing` → `Start` / `timing`

未匹配的语言或文案保持原样，避免对其他语言产生未经确认的分词行为。

## 验证

1. 静态检查源码无格式错误。
2. 确认构建后的 Landing 资源包含新增拆分规则。
3. 从项目根目录执行 `npm run build:emenu-new-embed -- --skip-install`。
4. 校验 `dist/emenu-new/index.html` 引用的新哈希资源均存在。
5. 校验 `dist/emenu-new/.emenu-embed-build.json` 的 `builtAt` 已刷新。
