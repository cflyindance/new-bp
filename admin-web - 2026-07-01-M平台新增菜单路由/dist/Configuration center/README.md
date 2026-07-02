# 营销中心 - 屏保批量下发

基于 Pencil 设计稿实现的营销中心多页面应用，包含屏保图片批量下发到连锁门店的完整流程。

## 技术栈

- **HTML5**：多页面、语义化结构
- **Tailwind CSS**：布局、间距、颜色、圆角、阴影等统一设计规范（与 [Ant Design 设计体系](https://ant-design.antgroup.com/docs/spec/colors-cn) 对齐）
- **Ant Design 设计规范**：按钮、表单、卡片、分页、空状态等视觉与交互参考 [Ant Design 6.x 组件](https://ant-design.antgroup.com/components/button-cn)
- 无构建步骤，浏览器直接打开即可运行

## 页面与路由

| 文件 | 说明 | 入口 |
|------|------|------|
| `index.html` | 营销中心首页 | 入口 |
| `kiosk-screensaver.html` | 屏保空状态 | 侧栏「屏保」、首页链接 |
| `kiosk-screensaver.html?list=1` | 屏保主题列表（同列表页） | 可选展示 |
| `kiosk-theme-list.html` | 屏保主题列表（搜索、筛选、分页、卡片操作） | 从空状态「+ 新建」提交后或直接访问 |
| `screensaver-create.html` | 新建屏保（主题名称、竖版/横版图片或视频上传） | 空状态/列表「+ 新建」 |
| `screensaver-uploaded.html` | 已上传屏保（带预览的创建中状态） | 新建屏保「确认」 |
| `screensaver-edit.html` | 编辑主题 | 列表卡片「⋯」→ 编辑屏保 |
| `store-select.html` | 选择门店（表格多选、已选汇总、下一步） | 列表卡片「⋯」→ 下发门店 |
| `channel-select.html` | 选择渠道（Kiosk/eMenu/CDS/OO/SDI/取餐屏） | 选择门店「Next →」 |
| `effective-time.html` | 选择展示生效时间并完成下发写库 | 选择渠道「Next →」→ 完成回列表 |
| `material.html` | 图片素材占位页 | 侧栏「图片素材」 |

## 业务流程

1. **空状态**：进入屏保 → 暂无屏保 → 点击「+ 新建」→ 新建屏保。
2. **新建屏保**：填写主题名称，竖版/横版选择图片或视频并上传 →「确认」→ 已上传屏保（可继续加图）→ 确认后回到主题列表。
3. **主题列表**：搜索主题名称、按开始/结束时间筛选、重置；卡片操作「⋯」→ 编辑屏保 / 下发门店 / 删除；底部 Total 与分页。
4. **下发流程**：下发门店 → 选择门店（勾选、已选门店: N、Next）→ 选择渠道（Kiosk/eMenu/CDS/OO/SDI/取餐屏）→ 选择展示生效时间（选时间、完成）→ 回到主题列表。

## 本地运行

用本地静态服务器打开根目录，或直接双击 `index.html` 在浏览器中打开（部分功能依赖相对路径，建议用服务器）：

```bash
# 示例：Python
python -m http.server 8080

# 示例：Node
npx serve .
```

然后访问 `http://localhost:8080/index.html`。

## 设计规范说明

- 颜色、字体、间距、圆角（如 `6px`）、阴影在 `assets/common.css` 与各页 Tailwind 中统一。
- 侧栏、顶栏、按钮、输入框、卡片、分页、空状态、步骤条等均按 Ant Design 6.x 视觉规范实现，便于后续替换为 Ant Design React 组件（如引入 `antd@6.2.1` + React）时保持一致。
