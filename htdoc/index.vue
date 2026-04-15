<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('overview.title') }}</h2>
    </div>

    <div v-if="loading" class="loading-center">
      <el-icon class="spin" size="32"><Loading /></el-icon>
    </div>

    <template v-else>
      <!-- Top stat cards -->
      <el-row :gutter="16" class="stat-row">
        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-label">{{ t('overview.active_service') }}</div>
            <div class="stat-value service-name">{{ status.active_service || '--' }}</div>
            <StatusBadge
              :running="status.running"
              :label="status.running ? t('overview.running') : t('overview.stopped')"
            />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-label">{{ t('overview.uptime') }}</div>
            <div class="stat-value">{{ uptimeStr }}</div>
            <div class="stat-sub">{{ status.running ? 'Active' : 'Service stopped' }}</div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-label">{{ t('overview.usb') }}</div>
            <div class="stat-value usb-path">{{ status.usb_path || '/dev/ttyACM0' }}</div>
            <StatusBadge
              :running="status.usb_ok"
              :label="status.usb_ok ? t('overview.usb_ok') : t('overview.usb_fail')"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- Hardware info card -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">Hardware Info</span>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('overview.chip_id')">
            <el-tag type="info" size="small">{{ status.chip_id || t('common.unknown') }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('overview.eui')">
            <code class="eui-code">{{ status.eui || t('common.unknown') }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="USB Path">
            {{ status.usb_path || '/dev/ttyACM0' }}
          </el-descriptions-item>
          <el-descriptions-item label="Frequency Band">
            868 MHz (EU868)
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCurrentInstance } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import StatusBadge from './components/StatusBadge.vue'

const { t } = useI18n()
const { proxy } = getCurrentInstance()

const loading = ref(true)
const status  = ref({})
let timer

const uptimeStr = computed(() => {
  const s = status.value.uptime
  if (!s) return '--'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m}m ${sec}s`
})

async function fetchStatus() {
  try {
    status.value = await proxy.$oui.call('lora-gateway', 'get_status')
  } catch (e) {
    console.error('get_status failed', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStatus()
  timer = setInterval(fetchStatus, 5000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.page-container { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; color: #1a2332; }
.stat-row { margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 12px; color: #909399; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 22px; font-weight: 600; color: #1a2332; margin-bottom: 10px; }
.stat-sub { font-size: 12px; color: #c0c4cc; margin-top: 6px; }
.service-name { color: #0d6b8e; }
.usb-path { font-size: 14px; font-family: monospace; }
.info-card { margin-top: 4px; }
.card-title { font-weight: 600; color: #303133; }
.eui-code { font-family: monospace; background: #f5f7fa; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
.loading-center { display: flex; justify-content: center; align-items: center; height: 200px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
