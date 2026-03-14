import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aiChatPlugin } from './src/server/viteAiPlugin'
import { VitePWA } from 'vite-plugin-pwa'

function emitReferenceAssets() {
  const assetNames = [
    'FixReceivable-BGwaItks.css',
    'vue_vue_type_script_setup_true_lang-B7eFikl3.js',
  ]
  const sourceRoots = [
    '/tmp/eda_dist/assets',
    fileURLToPath(new URL('./dist-correct/assets.bak', import.meta.url)),
  ]

  return {
    name: 'emit-reference-assets',
    apply: 'build' as const,
    closeBundle() {
      const outDir = fileURLToPath(new URL('./dist/assets', import.meta.url))
      mkdirSync(outDir, { recursive: true })

      for (const assetName of assetNames) {
        const source = sourceRoots.map(root => join(root, assetName)).find(file => existsSync(file))
        if (!source) continue
        const target = join(outDir, assetName)
        mkdirSync(dirname(target), { recursive: true })
        copyFileSync(source, target)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
    aiChatPlugin(),
    emitReferenceAssets(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: '数字游牧ERP',
        short_name: '数字游牧',
        description: '数字游牧企业资源管理系统',
        theme_color: '#1a2332',
        background_color: '#1a2332',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        icons: [
          { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/saas\.mzth\.cn\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'erp-api-cache', networkTimeoutSeconds: 10 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/adminapi': {
        target: 'https://erp-backend-production-a349.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
