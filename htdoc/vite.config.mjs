import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import compression from 'vite-plugin-compression'
import { resolve } from 'path'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    vue(),
    vueI18n({ include: resolve(__dirname, './**/*.json') }),
    compression()
  ],
  // Dev-only: proxy RPC calls to local mock server (run: npm run mock)
  server: {
    proxy: {
      '/oui-rpc': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    lib: isDev ? undefined : {
      entry: './index.vue',
      fileName: () => 'lora-gateway.js',
      formats: ['es']
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: isDev ? [] : ['vue', 'vue-i18n', 'element-plus', /^@oui\//],
      output: {
        assetFileNames: 'lora-gateway.[ext]'
      }
    }
  }
})

