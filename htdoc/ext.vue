<template>
  <div class="page-wrap">
    <div class="page-header">
      <div class="page-title">Extensions</div>
      <button class="pill-btn primary">Add new extension</button>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <div :class="['tab', { active: tab === 'installed' }]" @click="tab = 'installed'">Installed</div>
      <div :class="['tab', { active: tab === 'gallery'   }]" @click="tab = 'gallery'">Extension gallery</div>
    </div>

    <!-- Installed tab -->
    <div v-if="tab === 'installed'" class="ext-grid">
      <div v-for="ext in installed" :key="ext.name" class="ext-card">
        <div class="ext-card-top">
          <div class="ext-icon-wrap">
            <div class="ext-icon">
              <el-icon :size="22"><component :is="ext.icon" /></el-icon>
            </div>
            <span class="ext-dot" title="Active" />
          </div>
          <div class="ext-name">{{ ext.name }}</div>
        </div>
        <p class="ext-desc">{{ ext.desc }}</p>
        <div class="ext-auto">
          <el-checkbox v-model="ext.autoUpdate" size="small">Auto Update</el-checkbox>
        </div>
        <div class="ext-btns">
          <button class="btn-launch" @click="">Launch</button>
          <button class="pill-btn" style="color: #9ca3af; cursor: not-allowed;" disabled>Update</button>
          <span class="remove-link" @click="removeExt(ext.name)">Remove</span>
        </div>
      </div>
    </div>

    <!-- Gallery tab -->
    <div v-if="tab === 'gallery'" class="ext-grid">
      <div v-for="ext in gallery" :key="ext.name" class="ext-card">
        <div class="ext-card-top">
          <div class="ext-icon">
            <el-icon :size="22" color="#6b7280"><component :is="ext.icon" /></el-icon>
          </div>
          <div class="ext-name">{{ ext.name }}</div>
        </div>
        <p class="ext-desc">{{ ext.desc }}</p>
        <div class="ext-btns">
          <button class="pill-btn primary">Install</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElCheckbox } from 'element-plus'
import { Cpu, Monitor, Connection, Promotion, SetUp, Tools } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const tab = ref('installed')

const installed = reactive([
  {
    icon: Cpu,
    name: 'Packet Forwarder Monitor',
    desc: 'Real-time monitoring of packet forwarder statistics and performance metrics.',
    autoUpdate: false,
  },
  {
    icon: Monitor,
    name: 'LoRa Network Server',
    desc: 'Built-in lightweight LoRa network server for local device management.',
    autoUpdate: true,
  },
  {
    icon: Connection,
    name: 'WireGuard VPN',
    desc: 'Simple and fast, general-purpose Virtual Private Network (VPN).',
    autoUpdate: false,
  },
  {
    icon: Promotion,
    name: 'Field Test',
    desc: 'Extension providing background computing services for field testing.',
    autoUpdate: false,
  },
])

const gallery = reactive([
  {
    icon: SetUp,
    name: 'Remote Access Manager',
    desc: 'Manage SSH tunnels and remote access sessions securely from the gateway.',
  },
  {
    icon: Tools,
    name: 'RF Scanner',
    desc: 'Scan and visualize LoRa RF activity across all configured channels.',
  },
])

function removeExt(name) {
  ElMessage({ message: name + ' removed', type: 'info', duration: 2000 })
}
</script>

<style scoped>
.page-wrap   { padding: 32px; max-width: 1100px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title  { font-size: 28px; font-weight: 700; color: #111827; }
.tab-bar     { display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
.tab         { padding: 10px 20px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab.active  { color: #111827; font-weight: 700; border-bottom-color: #111827; }
.pill-btn    { border: 1px solid #d1d5db; border-radius: 20px; padding: 7px 20px; background: white; cursor: pointer; font-size: 14px; color: #374151; }
.pill-btn:hover:not(:disabled) { background: #f9fafb; }
.pill-btn.primary { background: #7c3aed; color: white; border-color: #7c3aed; }
.pill-btn.primary:hover { background: #6d28d9; }

.ext-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.ext-card {
  background: #fff; border-radius: 10px; padding: 20px;
  border: 1px solid #e5e7eb;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ext-card:hover { border-color: #7c3aed; box-shadow: 0 2px 12px rgba(124,58,237,0.08); }
.ext-card-top {
  display: flex; align-items: center; gap: 12px;
}
.ext-icon-wrap { position: relative; flex-shrink: 0; }
.ext-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: #f5f0fe; display: flex; align-items: center; justify-content: center;
  color: #7c3aed; flex-shrink: 0;
}
.ext-name { font-size: 16px; font-weight: 700; color: #111827; flex: 1; }
.ext-dot  {
  width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0;
  position: absolute; top: -2px; right: -2px;
}
.ext-desc { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }
.ext-auto { }
.ext-btns { display: flex; align-items: center; gap: 8px; }
.btn-launch {
  background: #7c3aed; color: #fff; border: none;
  border-radius: 20px; padding: 7px 20px; font-size: 13px; cursor: pointer;
}
.btn-launch:hover { background: #6d28d9; }
.remove-link { color: #7c3aed; font-size: 14px; cursor: pointer; margin-left: 4px; }
.remove-link:hover { text-decoration: underline; }
</style>
