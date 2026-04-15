<template>
  <div class="app-layout" :class="{ 'sidebar-expanded': expanded }">
    <!-- ── Sidebar ─────────────────────────────────────── -->
    <aside class="sidebar">
      <!-- LoRa logo -->
      <div class="sidebar-logo" @click="expanded = !expanded" title="Toggle sidebar">
        <svg class="lora-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Radio tower / LoRa arcs symbol -->
          <circle cx="20" cy="26" r="3" fill="#fff"/>
          <path d="M13 20 a9 9 0 0 1 14 0" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M8.5 15.5 a15 15 0 0 1 23 0" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M4.5 11.5 a21 21 0 0 1 31 0" stroke="rgba(255,255,255,0.25)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        </svg>
        <span v-if="expanded" class="logo-text">LoRa Gateway</span>
        <span v-else class="logo-abbr">LG</span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-btn"
          :class="{ active: isActive(item) }"
          :title="expanded ? '' : item.label"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="expanded" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Bottom: user + collapse toggle -->
      <div class="sidebar-bottom">
        <div class="nav-btn" title="Account">
          <UserFilled class="nav-icon" />
          <span v-if="expanded" class="nav-label">Account</span>
        </div>
        <button class="collapse-btn" @click="expanded = !expanded" :title="expanded ? 'Collapse' : 'Expand'">
          <ArrowLeft v-if="expanded" class="nav-icon" />
          <ArrowRight v-else class="nav-icon" />
        </button>
      </div>
    </aside>

    <!-- ── Main ────────────────────────────────────────── -->
    <div class="main-wrap">
      <header class="page-header">
        <div class="device-name">Oolite V8 Gateway</div>
        <nav v-if="currentTabs.length" class="page-tabs">
          <a
            v-for="tab in currentTabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: tab.active }"
            @click="tab.action ? tab.action() : null"
            :href="tab.href || 'javascript:void(0)'"
            @click.prevent="handleTabClick(tab)"
          >{{ tab.label }}</a>
        </nav>
      </header>

      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  DataBoard, CreditCard, Share, TrendCharts,
  Setting, Tools, UserFilled, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'

const route  = useRoute()
const router = useRouter()

// sidebar collapsed/expanded state (persisted in sessionStorage)
const expanded = ref(sessionStorage.getItem('sidebar-expanded') === 'true')
import { watch } from 'vue'
watch(expanded, v => sessionStorage.setItem('sidebar-expanded', String(v)))

// sidebar nav items
const navItems = [
  { to: '/',     icon: DataBoard,   label: 'Dashboard'         },
  { to: '/lora', icon: CreditCard,  label: 'LoRa Configuration'},
  { to: '/net',  icon: Share,       label: 'Network'           },
  { to: '/diag', icon: TrendCharts, label: 'Diagnostics'       },
  { to: '/sys',  icon: Setting,     label: 'System Settings'   },
  { to: '/ext',  icon: Tools,       label: 'Extensions'        },
]

function isActive(item) {
  if (item.to === '/') return route.path === '/'
  return route.path.startsWith(item.to)
}

// phantom tab state (Applications / Gateways are UI-only placeholders)
const phantomTab = ref(null)

// page-level tabs per section
const currentTabs = computed(() => {
  if (route.path === '/lora' || route.path.startsWith('/lora')) {
    return [
      { key: 'overview',     label: 'Overview',     href: '/'     },
      { key: 'config',       label: 'Configuration',href: '/lora', active: !phantomTab.value },
      { key: 'applications', label: 'Applications', phantom: true, active: phantomTab.value === 'applications' },
      { key: 'gateways',     label: 'Gateways',     phantom: true, active: phantomTab.value === 'gateways'     },
    ]
  }
  return []
})

function handleTabClick(tab) {
  if (tab.phantom) {
    phantomTab.value = phantomTab.value === tab.key ? null : tab.key
  } else {
    phantomTab.value = null
    router.push(tab.href)
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: var(--page-bg); }
</style>

<style scoped>
.app-layout { display: flex; height: 100vh; overflow: hidden; }

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar {
  width: 72px;
  background: var(--sidebar-bg);
  display: flex; flex-direction: column; align-items: center;
  z-index: 100;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
}
.app-layout.sidebar-expanded .sidebar { width: 210px; align-items: stretch; }

/* Logo */
.sidebar-logo {
  height: 56px; display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 0 12px; cursor: pointer; flex-shrink: 0;
  transition: padding 0.22s;
}
.app-layout.sidebar-expanded .sidebar-logo { justify-content: flex-start; }
.lora-icon { width: 36px; height: 36px; flex-shrink: 0; }
.logo-text  { color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap; letter-spacing: 0.2px; }
.logo-abbr  { color: rgba(255,255,255,0.75); font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

/* Nav */
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 0 8px; flex: 1; }
.sidebar-bottom { padding: 0 8px 12px; width: 100%; display: flex; flex-direction: column; gap: 4px; }

.nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 48px; border-radius: 10px; padding: 0 13px;
  color: var(--sidebar-icon); text-decoration: none;
  cursor: pointer; background: none; border: none;
  transition: background 0.15s, color 0.15s;
  gap: 12px; white-space: nowrap; overflow: hidden;
}
.app-layout.sidebar-expanded .nav-btn { justify-content: flex-start; }
.nav-btn:hover { background: rgba(124,58,237,0.3); color: rgba(255,255,255,0.85); }
.nav-btn.active { background: var(--sidebar-active-bg); color: var(--sidebar-icon-active); }
.nav-icon { width: 22px; height: 22px; flex-shrink: 0; }
.nav-label { font-size: 13px; font-weight: 500; opacity: 0; transition: opacity 0.15s 0.05s; }
.app-layout.sidebar-expanded .nav-label { opacity: 1; }

/* Collapse button */
.collapse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 36px; border-radius: 8px; padding: 0 13px;
  color: rgba(255,255,255,0.35); background: none; border: none; cursor: pointer;
  transition: background 0.15s, color 0.15s; gap: 12px;
}
.app-layout.sidebar-expanded .collapse-btn { justify-content: flex-start; }
.collapse-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }

/* ── Main ─────────────────────────────────────────────────── */
.main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--page-bg); }

.page-header { background: var(--header-bg); border-bottom: 1px solid var(--border-color); padding: 0 32px; flex-shrink: 0; }
.device-name { font-size: 22px; font-weight: 700; color: var(--heading-color); padding: 20px 0 16px; letter-spacing: -0.3px; }
.page-tabs { display: flex; gap: 0; }
.tab-item {
  padding: 12px 20px; font-size: 14px; font-weight: 500;
  color: var(--tab-color); text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px; cursor: pointer;
}
.tab-item:hover { color: var(--heading-color); }
.tab-item.active { color: var(--heading-color); font-weight: 700; border-bottom-color: var(--heading-color); }

.page-content { flex: 1; overflow-y: auto; background: var(--page-bg); }
</style>
