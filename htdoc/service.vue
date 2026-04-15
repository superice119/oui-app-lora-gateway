<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('service.title') }}</h2>
    </div>

    <!-- Active service selector -->
    <el-card class="section-card" shadow="never">
      <template #header><span class="card-title">{{ t('service.active_service') }}</span></template>
      <el-radio-group v-model="pendingService" size="large" @change="onServiceSwitch">
        <el-radio-button value="basicstation">basicstation</el-radio-button>
        <el-radio-button value="lora_pkt_fwd">lora_pkt_fwd</el-radio-button>
      </el-radio-group>
    </el-card>

    <!-- Control buttons + status -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <span class="card-title">Controls</span>
        <StatusBadge
          style="float:right"
          :running="status.running"
          :label="status.running ? t('service.status') + ': Running' : t('service.status') + ': Stopped'"
        />
      </template>

      <el-button-group>
        <el-button type="success" :loading="acting" @click="doAction('start')">
          <el-icon><VideoPlay /></el-icon> {{ t('service.start') }}
        </el-button>
        <el-button type="danger" :loading="acting" @click="doAction('stop')">
          <el-icon><VideoPause /></el-icon> {{ t('service.stop') }}
        </el-button>
        <el-button type="warning" :loading="acting" @click="doAction('restart')">
          <el-icon><RefreshRight /></el-icon> {{ t('service.restart') }}
        </el-button>
      </el-button-group>

      <!-- Service details -->
      <el-descriptions :column="3" class="service-desc" border>
        <el-descriptions-item :label="t('service.status')">
          <StatusBadge
            :running="status.running"
            :label="status.running ? t('overview.running') : t('overview.stopped')"
          />
        </el-descriptions-item>
        <el-descriptions-item :label="t('service.uptime')">
          {{ uptimeStr }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('service.pid')">
          {{ status.pid || '--' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, VideoPause, RefreshRight } from '@element-plus/icons-vue'
import StatusBadge from './components/StatusBadge.vue'

const { t } = useI18n()
const { proxy } = getCurrentInstance()

const status         = ref({})
const pendingService = ref('basicstation')
const acting         = ref(false)
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
    pendingService.value = status.value.active_service || 'basicstation'
  } catch (e) { /* ignore polling errors */ }
}

async function doAction(action) {
  acting.value = true
  try {
    await proxy.$oui.call('lora-gateway', `${action}_service`, { service: pendingService.value })
    ElMessage.success(`${action} OK`)
    await fetchStatus()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    acting.value = false
  }
}

async function onServiceSwitch(newVal) {
  try {
    await ElMessageBox.confirm(t('service.switch_warning'), t('common.confirm'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    })
    acting.value = true
    await proxy.$oui.call('lora-gateway', 'set_active_service', { service: newVal })
    ElMessage.success('Switched to ' + newVal)
    await fetchStatus()
  } catch {
    pendingService.value = status.value.active_service
  } finally {
    acting.value = false
  }
}

onMounted(() => { fetchStatus(); timer = setInterval(fetchStatus, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.page-container { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; color: #1a2332; }
.section-card { margin-bottom: 16px; }
.card-title { font-weight: 600; color: #303133; }
.service-desc { margin-top: 20px; }
</style>
