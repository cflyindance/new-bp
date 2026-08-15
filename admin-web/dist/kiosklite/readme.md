# kiosklite

## 环境要求

- Node.js：`>=22.12.0 <23`
- 包管理器：npm
- 构建工具：Vite 8

## 安装与常用命令

```bash
# 安装依赖
npm ci

# 本地开发
npm start

# 测试
npm test

# 开发环境构建
npm run build:dev

# 测试/QA 环境构建
npm run build:test
npm run build:qa

# 生产环境构建
npm run build:prod
npm run build

# 构建并打包
npm run build:zip
npm run build:test:zip
```

## 构建与部署

### 本地构建

- `npm run build:dev`：development mode 构建，并执行 `scripts/postbuild.mjs --mode development`。
- `npm run build:test`：integration mode 构建，并执行 `scripts/postbuild.mjs --mode integration`。
- `npm run build:qa`：等同于 `npm run build:test`。
- `npm run build:prod`：production mode 构建，并执行 `scripts/postbuild.mjs --mode production`。
- `npm run build`：等同于 `npm run build:prod`。
- `npm run build:zip`：生成部署压缩包。
- `npm run build:test:zip`：生成测试环境压缩包。

### 本地 POS 上传

```bash
npm run build:upload
```

`build:upload` 会先执行 `npm run build:dev`，再通过 `upload.js` 部署到固定目录：

```text
C:\Wisdomount\Menusifu\application\1.8.0.30.11\tomcat\webapps\kpos\kiosklite
```

部署流程：

1. 只允许从仓库 `dist` 部署到上述唯一目标目录。
2. 先把 `dist` 复制到同级临时 staging 目录。
3. 校验 staging 文件 hash 与 `dist` 一致。
4. 将现有目标目录改名为同级 backup 目录。
5. 将 staging 提升为新的目标目录。
6. 校验新目标目录文件 hash 与 `dist` 一致。
7. 如果提升或校验失败，会删除失败的目标目录，并把 backup 回滚为原目标目录。

上传成功后，脚本会输出 `backupDir`。请先在本地 POS 浏览器中完成验证；只有确认浏览器访问成功后，才清理 backup：

```bash
node upload.js --cleanup-backup "<backupDir>"
```

如果浏览器验证失败，使用输出的 `backupDir` 回滚：

```bash
node upload.js --rollback "<backupDir>"
```

### legacy 兼容说明

Vite legacy 构建已开启，会输出旧浏览器/WebView 兼容资源。外部 vendor 的旧设备、旧 WebView 兼容性仍必须做实机验证；不能只依赖本地构建通过或浏览器模拟结果。

## CRM 对接

```text
crm 登录分主动登录、被动登录。在 phoneInput 页面输入手机号登录是被动登录；通过 login 弹窗登录输入是主动登录。
被动登录后点击加入并输入验证码后，也会从被动登录转换为主动登录。
```
