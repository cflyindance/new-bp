# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目说明

`kiosklite` 是餐厅自助点餐 Kiosk 前端应用，本质是一个 Web App。

### KioskLite 技术栈

- **前端框架**：React 17.0.2 + React Router 4（HashRouter）
- **状态管理**：Redux + Redux Thunk
- **UI 组件**：Material-UI v4 + Antd v5
- **国际化**：react-i18next
- **样式**：Sass + CSS Modules
- **构建工具**：Vite 8
- **包管理器**：npm；本仓库必须使用 npm lockfile 和 npm scripts，禁止改用其他包管理器
- **Node.js**：`>=22.12.0 <23`

> 迁移背景：本仓库已从 Craco/Yarn 迁移到 Vite/npm。旧名只用于说明历史，不代表当前可用命令或推荐流程。

## 常用命令

```bash
# 安装依赖
npm ci

# 开发环境启动
npm start

# 运行测试
npm test

# 开发环境构建（用于调试）
npm run build:dev

# 测试/QA 环境构建
npm run build:test
npm run build:qa

# 生产环境构建
npm run build:prod
npm run build

# 构建并打包（用于部署）
npm run build:zip
npm run build:test:zip

# 构建开发环境并上传到本地 POS
npm run build:upload

# 代码格式化（使用 prettier）
npm exec prettier --write "**/*.{js,jsx,scss}"
```

## 构建与兼容性说明

- Vite legacy 构建已开启，用于输出兼容旧浏览器/WebView 的 legacy 资源。
- 外部 vendor 的旧设备、旧 WebView 兼容性仍需要实机验证；不能只凭本地构建成功判断兼容通过。
- `npm run build:qa` 是 `npm run build:test` 的别名。
- `npm run build` 是 `npm run build:prod` 的别名。

## 代码规范

- 遵循 `.prettierrc` 配置
- 常量命名：UPPER_SNAKE_CASE（如 `ORDER_TYPE`）
- 组件文件命名：PascalCase（如 `LoginBanner.js`）
- 工具函数命名：camelCase（如 `blockRegister.js`）

## 目录结构

```text
kiosklite/src/
├── actions/          # Redux actions
├── reducers/         # Redux reducers
├── container/        # 页面组件容器
├── component/        # 共享组件
├── api/              # API 调用
├── utils/            # 工具函数
├── constants/        # 常量定义
├── context/          # React Context
├── hooks/            # 自定义 Hooks
└── assets/           # 静态资源（图片、i18n、scss）
```

## 注意事项（重要）

1. **按照命令行事**：注意边界，不做命令以外的工作，禁止自作主张。
2. **注意澄清**：对于任何命令，感到疑惑时，要通过 askUserQuestionTool 或 superpower 询问，禁止自作主张。
3. **计划第一**：对于任何任务，先形成计划；不知道怎么计划可以使用 superpower。
4. **函数式组件**：对于新建组件，尽量使用函数式组件而不是 class 组件。
