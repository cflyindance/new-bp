import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import viteImp from 'vite-plugin-imp'
import viteImagemin from 'vite-plugin-imagemin'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { createHtmlPlugin } from 'vite-plugin-html'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'
import { version } from './package.json'
import eslint from 'vite-plugin-eslint'

function versionJsonPlugin() {
  const versionPayload = `${JSON.stringify({ name: 'EMENU', version }, null, 2)}\n`
  const versionPath = '/kpos/emenu/version.json'

  return {
    name: 'version-json-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = (req.url || '').split('?')[0]

        if (requestPath !== versionPath) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(versionPayload)
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionPayload,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  const env = loadEnv(mode, process.cwd())
  const {
    VITE_LEGACY,
    VITE_BUILD_SOURCEMAP,
    VITE_BUILD_COMPRESS,
    VITE_ENABLE_IMAGEMIN,
    VITE_BUILD_REPORT,
    VITE_BUILD_WATCH,
    VITE_DROP_CONSOLE,
    VITE_SERVER_URL,
    VITE_USE_PWA,
  } = env

  const plugins = [
    versionJsonPlugin(),
    react(),
    viteImp({
      libList: [
        {
          libName: 'antd',
          style(name) {
            return `antd/es/${name}/style`
          },
        },
      ],
    }),
    createHtmlPlugin({
      inject: {
        data: {
          title:
            mode === 'production'
              ? `Emenu App v${version}`
              : `Emenu App v${version} at ${new Date().toLocaleString()}`,
          isDev: mode === 'development',
        },
      },
    }),
    // eslint(),
  ]

  if (VITE_LEGACY === 'true') {
    plugins.push(
      legacy({
        targets: [
          '>= 1%',
          'not dead',
          'Android >= 4.4',
          'Chrome >= 64',
          'iOS >= 9',
          'Safari >= 9',
        ],
        modernPolyfills: [
          'es/global-this',
          'es.array.flat',
          'es.array.flat-map',
          'es.object.values',
          'es.string.replace-all',
        ],
        ignoreBrowserslistConfig: true,
        renderLegacyChunks: false,
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      })
    )
  }
  if (['gzip', 'brotli'].includes(VITE_BUILD_COMPRESS)) {
    plugins.push(
      viteCompression({
        algorithm: VITE_BUILD_COMPRESS === 'brotli' ? 'brotliCompress' : 'gzip',
        ext: VITE_BUILD_COMPRESS === 'brotli' ? '.br' : '.gz',
        deleteOriginFile: false,
      })
    )
  }
  if (VITE_ENABLE_IMAGEMIN === 'true') {
    plugins.push(
      viteImagemin({
        gifsicle: {
          optimizationLevel: 2,
          interlaced: false,
        },
        optipng: {
          optimizationLevel: 4,
        },
        mozjpeg: {
          quality: 20,
        },
        pngquant: {
          quality: [0.8, 0.9],
          speed: 4,
          strip: true,
          dithering: false,
        },
        svgo: {
          multipass: true,
        },
      })
    )
  }

  if (VITE_BUILD_REPORT === 'true') {
    plugins.push(
      visualizer({
        filename: 'node_modules/.cache/visualizer/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    )
  }

  if (VITE_USE_PWA === 'true') {
    plugins.push(
      VitePWA({
        devOptions: {
          // enabled: true,
        },
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'apple-touch-icon.png',
          'masked-icon.svg',
          'robots.txt',
        ],
        // manifest: false,
        manifest: {
          name: 'Emenu App',
          short_name: 'Emenu',
          description: 'Menusifu Emenu New App',
          theme_color: '#ffffff',
          orientation: 'landscape',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        registerType: 'prompt',
        // selfDestroying: true,
        workbox: {
          // skipWaiting: true,
          // disableDevLogs: true,
          // cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /(.*?)\/kpos\/api\/.+/, // 接口缓存
              handler: 'NetworkFirst',
              options: {
                cacheName: 'interface-cache',
                // expiration: {
                //   maxEntries: 10, // 最多缓存10个，超过的按照LRU原则删除
                //   maxAgeSeconds: 12 * 60 * 60, // 12 hours
                // },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern:
                /(.*?)\.(png|jpe?g|svg|gif|bmp|tiff|tga|eps|woff|mp4|webm)$/, // 图片等资源缓存
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets-cache',
              },
            },
          ],
        },
      })
    )
  }

  return {
    plugins,

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            'primary-color': '#96272F',
            'border-radius-base': '5px',
          },
        },
      },
    },

    // webpack.alias -> resolve.alias
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    server: {
      hmr: true,
      host: '0.0.0.0',
      port: 8000,
      proxy: {
        '/kpos/api': {
          target: VITE_SERVER_URL,
          changeOrigin: true,
          timeout: 5000,
          rewrite: (path) => path.replace(/^\/kpos/, ''),
        },
        '/kpos/img/gallery/kiosk': {
          target: VITE_SERVER_URL,
          changeOrigin: true,
          timeout: 5000,
          rewrite: (path) => path.replace(/^\/kpos/, ''),
        },
      },
    },

    // BASE_URL 公共基础路径改成相对路径
    base: mode === 'development' ? './' : '/kpos/emenu/',
    build: {
      // target: 'es2015',
      outDir: 'build',
      sourcemap: VITE_BUILD_SOURCEMAP === 'true',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-router-dom', 'react-dom'],
            mui: ['@material-ui/core', '@material-ui/icons'],
            antd: ['antd'],
          },
        },
      },
      watch: VITE_BUILD_WATCH === 'true' ? {} : null,
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE === 'true' ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
      include: [
        'antd/es/config-provider/style',
        'antd/es/menu/style',
        'antd/es/button/style',
        'antd/es/card/style',
        'antd/es/input-number/style',
        'antd/es/select/style',
        'antd/es/switch/style',
        'antd/es/typography/style',
        'antd/es/tree-select/style',
      ],
    },
  }
})
