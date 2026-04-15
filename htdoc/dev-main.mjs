import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/variables.scss'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHashHistory } from 'vue-router'
import DevShell from './dev-shell.vue'
import messages from './locale.json'

// Pages
import IndexPage   from './index.vue'
import LoraPage    from './service.vue'   // LoRa Configuration
import ConfigPage  from './config.vue'    // keep for now as redirect target
import PlaceholderPage from './placeholder.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',     component: IndexPage   },
    { path: '/lora', component: LoraPage    },
    { path: '/service', redirect: '/lora'   },
    { path: '/config',  component: ConfigPage },
    { path: '/net',     component: PlaceholderPage, meta: { title: 'Network'          } },
    { path: '/diag',    component: PlaceholderPage, meta: { title: 'Diagnostics'      } },
    { path: '/sys',     component: PlaceholderPage, meta: { title: 'System Settings'  } },
    { path: '/ext',     component: PlaceholderPage, meta: { title: 'Extensions'       } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

const app = createApp(DevShell)

// $oui stub: maps to /oui-rpc (proxied to mock server in dev)
app.config.globalProperties.$oui = {
  call(module, func, params = {}) {
    return fetch('/oui-rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module, func, params })
    })
    .then(r => r.json())
    .then(({ code, error, result }) => {
      if (code !== 0) throw new Error(error || 'RPC error ' + code)
      return result
    })
  }
}

app.use(i18n)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
