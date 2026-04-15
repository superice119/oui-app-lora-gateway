<template>
  <!-- Minimal dev shell that simulates OUI sidebar layout -->
  <el-container style="height: 100vh;">
    <!-- Sidebar -->
    <el-aside width="220px" style="background: #1a2332; color: #fff;">
      <div style="padding: 20px 16px 12px; font-size: 18px; font-weight: 600; color: #7ecde8;">
        LoRa Gateway
      </div>
      <el-menu
        :default-active="route.path"
        background-color="#1a2332"
        text-color="#c8d6e5"
        active-text-color="#7ecde8"
        router
      >
        <el-menu-item index="/">
          <el-icon><Monitor /></el-icon>
          <span>{{ t('menu.overview') }}</span>
        </el-menu-item>
        <el-menu-item index="/service">
          <el-icon><Setting /></el-icon>
          <span>{{ t('menu.service') }}</span>
        </el-menu-item>
        <el-menu-item index="/config">
          <el-icon><Tools /></el-icon>
          <span>{{ t('menu.config') }}</span>
        </el-menu-item>
      </el-menu>
      <!-- Dev badge -->
      <div style="
        position: absolute; bottom: 16px; left: 16px;
        font-size: 11px; color: #4a6a7a;
        background: #0d2030; padding: 4px 8px; border-radius: 4px;
      ">
        🛠 Dev Mode (Mock RPC)
      </div>
    </el-aside>

    <!-- Content -->
    <el-container>
      <el-main style="background: #f5f7fa; padding: 0;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Monitor, Setting, Tools } from '@element-plus/icons-vue'

const route = useRoute()
const { t } = useI18n()
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.el-aside { position: relative; }
</style>
