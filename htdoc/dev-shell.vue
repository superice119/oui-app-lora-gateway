<template>
  <div class="app-layout">
    <!-- ── Sidebar ─────────────────────────────────────── -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-wis">Wis</span><span class="logo-gate">Gate</span>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-btn"
          :class="{ active: isActive(item) }"
          :title="item.label"
        >
          <component :is="item.icon" class="nav-icon" />
        </router-link>
      </nav>
      <!-- User icon at bottom -->
      <div class="sidebar-bottom">
        <div class="nav-btn" title="Account">
          <UserFilled class="nav-icon" />
        </div>
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
  Setting, Tools, UserFilled
} from '@element-plus/icons-vue'

const route  = useRoute()
const router = useRouter()

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

/* Sidebar */
.sidebar {
  width: 72px; min-width: 72px;
  background: var(--sidebar-bg);
  display: flex; flex-direction: column; align-items: center;
  z-index: 100;
}
.sidebar-logo {
  height: 56px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;
}
.logo-wis  { background: #7c3aed; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 4px; border-radius: 3px; letter-spacing: -0.3px; }
.logo-gate { color: #fff; font-size: 12px; font-weight: 600; margin-left: 2px; }

.sidebar-nav  { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 0 8px; flex: 1; }
.sidebar-bottom { padding: 0 8px 16px; width: 100%; }

.nav-btn {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 48px; border-radius: 10px;
  color: var(--sidebar-icon); text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.nav-btn:hover { background: rgba(124,58,237,0.3); color: rgba(255,255,255,0.85); }
.nav-btn.active { background: var(--sidebar-active-bg); color: var(--sidebar-icon-active); }
.nav-icon { width: 22px; height: 22px; }

/* Main */
.main-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--page-bg); }

/* Page header */
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

/* Page content */
.page-content { flex: 1; overflow-y: auto; background: var(--page-bg); }
</style>
