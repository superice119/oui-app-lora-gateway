<template>
  <div class="app-layout">
    <!-- ── Sidebar ─────────────────────────────────────── -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-wis">Wis</span><span class="logo-gate">Gate</span>
      </div>

      <!-- Nav icons -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-btn"
          :class="{ active: route.path === item.to }"
          :title="item.label"
        >
          <component :is="item.icon" class="nav-icon" />
        </router-link>
      </nav>
    </aside>

    <!-- ── Main ────────────────────────────────────────── -->
    <div class="main-wrap">
      <!-- Page header: device name + horizontal tabs -->
      <header class="page-header">
        <div class="device-name">Oolite V8 Gateway</div>
        <nav class="page-tabs">
          <router-link
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            class="tab-item"
            :class="{ active: route.path === tab.to }"
          >{{ tab.label }}</router-link>
        </nav>
      </header>

      <!-- Page content -->
      <main class="page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Monitor, Setting, Tools, Cpu } from '@element-plus/icons-vue'

const route = useRoute()
const { t } = useI18n()

const navItems = [
  { to: '/',        icon: Monitor, label: 'Overview' },
  { to: '/service', icon: Cpu,     label: 'Service Control' },
  { to: '/config',  icon: Setting, label: 'Configuration' },
]

const tabs = [
  { to: '/',        label: t('menu.overview') },
  { to: '/service', label: t('menu.service')  },
  { to: '/config',  label: t('menu.config')   },
]
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  background: var(--page-bg);
}
</style>

<style scoped>
/* ── Layout ── */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 72px;
  min-width: 72px;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  z-index: 100;
}

.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.logo-wis {
  background: #7c3aed;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  letter-spacing: -0.3px;
}
.logo-gate {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  margin-left: 2px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 0 8px;
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  color: var(--sidebar-icon);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.nav-btn:hover {
  background: rgba(124, 58, 237, 0.3);
  color: rgba(255,255,255,0.85);
}
.nav-btn.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-icon-active);
}
.nav-icon {
  width: 22px;
  height: 22px;
}

/* ── Main wrap ── */
.main-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--page-bg);
}

/* ── Page header ── */
.page-header {
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 0 32px;
  flex-shrink: 0;
}
.device-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--heading-color);
  padding: 20px 0 16px;
  letter-spacing: -0.3px;
}
.page-tabs {
  display: flex;
  gap: 0;
}
.tab-item {
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--tab-color);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}
.tab-item:hover { color: var(--heading-color); }
.tab-item.active {
  color: var(--heading-color);
  font-weight: 700;
  border-bottom-color: var(--heading-color);
}

/* ── Page content ── */
.page-content {
  flex: 1;
  overflow-y: auto;
  background: var(--page-bg);
}
</style>
