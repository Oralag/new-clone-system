import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aiChatPlugin } from './src/server/viteAiPlugin'

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
