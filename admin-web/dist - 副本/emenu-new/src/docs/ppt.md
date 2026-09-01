---
marp: true
theme: gaia
paginate: true
_class: lead
_backgroundColor: white
---

![bg right:40% 80%](https://i.imgur.com/2LncRl3.png)

# **从 CRA 迁移到 Vite** <!--fit-->

### Migrate from Create-React-App/craco to Vite App

###### _ZhangBingxin_

[create-react-app]: https://create-react-app.dev
[vite]: https://cn.vitejs.dev
[craco]: https://github.com/gsoft-inc/craco
[react]: https://reactjs.org
[vue]: https://vuejs.org
[preact]: https://preactjs.com
[svelte]: https://svelte.dev
[awesome-vite]: https://github.com/vitejs/awesome-vite

---

<!--
backgroundImage: url('https://marp.app/assets/hero-background.svg')
 -->

<style scoped>
section {
  line-height: 1.1
}
code {
  font-size: 20px;
}
</style>

### 背景

- 使用 [Create-React-App] 建立的项目，package.json 如下：

```json
"dependencies": {
  "@craco/craco": "^6.4.3",
  "@testing-library/jest-dom": "^5.16.3",
  "@testing-library/react": "^12.1.4",
  "@testing-library/user-event": "^13.5.0",
  "react": "^17.0.2",
  "react-dom": "^17.0.2",
  "react-scripts": "4.0.3",
  ...
},
"scripts": {
  "start": "craco start",
  "build": "craco build",
  "serve": "serve -s build",
  "test": "craco test"
},
"devDependencies": {
  "postcss": "7.0.39",
  "sass": "^1.49.9"
}
```

---

- 为了方便配置 CRA 添加了[craco]来设置 postcss，babel 等，无需 eject
- 然而 cra 和 craco 存在很多版本兼容问题，全是英文文档:cry:，遇到问题很难解决
- craco 即将停止维护 💀
- devServer 代理还要安装`http-proxy-middleware`
- 最难以忍受的是项目启动速度，开发编译很慢，HMR 还时有失效
- and more...

---

### CRA 启动有多慢呢？

现在 CRA 启动不显示时间了，为了分析启动时间用了`speed-measure-webpack-plugin`

![left](https://s2.loli.net/2022/06/16/MyAHeBmL72cCZud.png)

![bg right 60%](https://s2.loli.net/2022/06/16/zVscO534yUlZSie.png)

---

### `speed-measure-webpack-plugin`配置

```js
plugin: {
  overrideWebpackConfig: ({ webpackConfig }) => {
    // remove CaseSensitivePathsPlugin (replace with tsconfig setting or eslint setting)
    webpackConfig.plugins = webpackConfig.plugins.filter(
      (plugin) => plugin.constructor.name !== 'CaseSensitivePathsPlugin'
    )

    const smp = new SpeedMeasurePlugin({
      outputFormat: 'humanVerbose',
      loaderTopFiles: 5,
    })

    return smp.wrap(webpackConfig)
  }
}
```

---

### 改用 Vite 后启动多块呢

![width:500px](https://pos-1304418119.cos.ap-nanjing.myqcloud.com/20220616230615.PNG)

:rocket: 秒开！

![bg right](https://images.unsplash.com/photo-1511289081-d06dda19034d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=784&q=80)

---

### 为什么 Vite 启动这么快呢？

- **使用 `esbuild` 预构建依赖**
  比以 JavaScript 编写的打包器预构建依赖快 10-100 倍

- **以 原生 ESM 方式提供源码**
  让浏览器接管了打包程序的部分工作：Vite 只需要在浏览器请求源码时进行转换并按需提供源码，根据情景动态导入代码

- **利用 HTTP 头来加速整个页面**
  源码模块的请求会根据 `304 Not Modified` 进行协商缓存，而依赖模块请求则会通过 `Cache-Control: max-age=31536000,immutable` 进行强缓存

---

#### 原来打包器的启动方式：

![height:520px](https://cn.vitejs.dev/assets/bundler.37740380.png)

---

#### Vite 的启动方式：

![height:520px](https://cn.vitejs.dev/assets/esm.3070012d.png)

---

### Vite 除了快还有什么优点？

- 原生 ESM 支持，不用配置`babel-plugin-import`
- 原生 TS, JSX, PostCSS 支持，开箱即用
- 支持 [React], [Vue], [Preact], [Svelte]
- 中文文档 😂

![height:200px](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png) ![height:220px](https://preactjs.com/assets/app-icon.png) ![height:200px](https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Vue.js_Logo_2.svg/555px-Vue.js_Logo_2.svg.png) ![height:220px](https://seeklogo.com/images/S/svelte-logo-E3497608CB-seeklogo.com.png)

---

<style scoped>
section {
  line-height: 1.2
}
</style>

### 如何迁移到 Vite 呢？

###### 1. :zap: 安装 Vite 及 react 插件

`yarn add -D vite @vitejs/plugin-react`

###### 修改`package.json`

```json
   "scripts": {
-    "start": "craco start",
-    "build": "craco build",
-    "serve": "serve -s build",
-    "test": "craco test"

+    "start": "vite",
+    "build": "vite build",
+    "serve": "vite preview"
   }
```

---

<style scoped>
section {
  line-height: 1.2
}
</style>

###### 2. :star2: 添加 Vite 配置

###### 根目录中添加`vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    base: './',
    build: {
      outDir: 'build',
    },
  }
})
```

---

###### 3. :pencil: 组件重命名 js -> jsx

如果您的 jsx 组件是 js 文件，Vite 会报错：

`[vite] Internal server error: Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension. `

所以将所有`.js` `.ts`组件重命名为`.jsx` `.tsx`

---

###### 4. :pencil2: 移动并修改`index.html`

- 将`index.html`从`public`文件夹移动到根目录
- 删除所有的`%PUBLIC_URL%`：

  ```html
  <!-- Before -->
  <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
  <!-- After -->
  <link rel="icon" href="/favicon.ico" />
  ```

- body 末尾增加入口文件

  ```html
  <!-- Add to body -->
  <script type="module" src="/src/index.tsx"></script>
  ```

---

###### 5. :sparkles: 其他调整

- `require` 改為 `import`
- 环境变量 `REACT_APP_`改为`VITE_`，
  或者使用`vite-plugin-env-compatible`
- `process.env`改为`import.meta.env`

###### 6. :boom: 收尾：删除 Create React App

`yarn remove react-scripts`

###### 7. :v: 完工，启动！

`yarn start`

---

#### 一些有用的插件：

- `@vitejs/plugin-legacy`
- `vite-plugin-html`
- `vite-plugin-svgr`
- `vite-plugin-imagemin`
- `vite-plugin-pwa`
- more... [awesome-vite]

![bg right 80%](https://github.com/vitejs/awesome-vite/raw/master/assets/logo.svg)

---

![bg](https://images.unsplash.com/photo-1502355984-b735cb2550ce?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1738&q=80)
