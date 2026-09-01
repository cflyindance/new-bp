import { createRequire } from 'node:module';
import path from 'node:path';

import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import genericNames from 'generic-names';
import postcssFlexbugsFixes from 'postcss-flexbugs-fixes';
import postcssPresetEnv from 'postcss-preset-env';
import { defineConfig, normalizePath, transformWithOxc } from 'vite';

const require = createRequire(import.meta.url);
const postcssNormalize = require('postcss-normalize');

const generate = genericNames('[local]___[hash:base64:5]', {
  context: process.cwd(),
});

function generateScopedName(localName, filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return generate(localName, relativePath);
}

function assetFileName(assetInfo) {
  const isCss = assetInfo.names.some((name) => name.endsWith('.css'));
  return isCss
    ? 'static/css/[name].[hash][extname]'
    : 'static/media/[name].[hash][extname]';
}

function jsxInJsPlugin() {
  let sourceRoot;
  let development;

  return {
    name: 'kiosklite:jsx-in-js',
    enforce: 'pre',
    config() {
      return {
        optimizeDeps: {
          rolldownOptions: {
            moduleTypes: {
              '.js': 'jsx',
            },
          },
        },
      };
    },
    configResolved(config) {
      sourceRoot = `${normalizePath(path.resolve(config.root, 'src'))}/`;
      development = !config.isProduction;
    },
    async transform(code, id) {
      const cleanId = normalizePath(id.split('?')[0]);
      if (!cleanId.startsWith(sourceRoot) || !cleanId.endsWith('.js')) {
        return null;
      }

      const result = await transformWithOxc(code, cleanId, {
        lang: 'jsx',
        jsx: {
          runtime: 'automatic',
          importSource: 'react',
          development,
        },
      });
      for (const warning of result.warnings) this.warn(warning);
      return { code: result.code, map: result.map, moduleType: 'js' };
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const reactAppEnv = {
    development: 'development',
    integration: 'integration',
    production: 'production',
    test: 'development',
  }[mode];
  if (!reactAppEnv) throw new Error(`Unsupported Vite mode: ${mode}`);

  const isProduction = mode === 'production';
  const nodeEnv = command === 'serve' ? 'development' : 'production';

  return {
    base: './',
    resolve: { alias: { '@': path.resolve('src') } },
    define: {
      'process.env.REACT_APP_ENV': JSON.stringify(reactAppEnv),
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    plugins: [
      jsxInJsPlugin(),
      react(),
      legacy({
        targets: ['Android >= 4.4', 'iOS >= 9', 'Safari >= 9', 'Chrome >= 60'],
        renderLegacyChunks: true,
        modernPolyfills: true,
      }),
    ],
    css: {
      modules: { generateScopedName },
      postcss: {
        plugins: [
          postcssFlexbugsFixes,
          postcssPresetEnv({
            autoprefixer: { flexbox: 'no-2009' },
            stage: 3,
          }),
          postcssNormalize(),
        ],
      },
    },
    server: {
      port: 3000,
      cors: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      proxy: {
        '/img': 'http://localhost:22080/kpos/',
        '/kpos/api': {
          target: 'http://localhost:22080',
          secure: false,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      manifest: true,
      sourcemap: isProduction ? 'hidden' : true,
      rolldownOptions: {
        output: {
          sourcemapExcludeSources: isProduction,
          entryFileNames: 'static/js/[name].[hash].js',
          chunkFileNames: 'static/js/[name].[hash].chunk.js',
          assetFileNames: assetFileName,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      clearMocks: true,
    },
  };
});
