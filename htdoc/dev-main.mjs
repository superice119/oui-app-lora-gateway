/**
 * Dev entry point — only used during `npm run dev` (not in production build).
 * Provides minimal OUI stubs so the app works without the full OUI runtime.
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'

// ── OUI stub: $oui.call(module, func, params) → POST /oui-rpc ──
const $oui = {
  async call(module, func, params) {
    const res = await fetch('/oui-rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, func, params })
    })
    const data = await res.json()
    if (data.code !== 0) throw new Error(data.error || 'RPC error')
    return data.result
  }
}

// ── Router ──
import IndexPage   from './index.vue'
import ServicePage from './service.vue'
import ConfigPage  from './config.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',        component: IndexPage },
    { path: '/service', component: ServicePage },
    { path: '/config',  component: ConfigPage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// ── i18n ──
import locale from './locale.json'
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en: locale.en, zh: locale.zh }
})

// ── Dev shell wrapper (sidebar + nav) ──
import DevShell from './dev-shell.vue'

const app = createApp(DevShell)
app.config.globalProperties.$oui = $oui
app.use(ElementPlus)
app.use(router)
app.use(i18n)
app.mount('#app')
