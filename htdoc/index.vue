<template>
  <div class="rak-page">
    <div v-if="loading" class="spinner-wrap">
      <el-icon class="spin" :size="28" color="#7c3aed"><Loading /></el-icon>
    </div>
    <template v-else>
      <!-- Status banner -->
      <div class="status-banner" :class="status.running ? 'is-running' : 'is-stopped'">
        <div class="status-left">
          <span class="status-dot" />
          <span class="status-text">{{ status.running ? t('overview.running') : t('overview.stopped') }}</span>
          <span class="status-svc">{{ status.active_service }}</span>
        </div>
        <div v-if="status.running" class="status-uptime">{{ t('overview.uptime') }}: {{ uptimeStr }}</div>
      </div>
      <!-- Info rows -->
      <div class="info-section">
        <div class="form-row">
          <div class="form-label">{{ t('overview.chip_id') }}</div>
          <div class="form-divider" />
          <div class="form-content"><code class="mono-val">{{ status.chip_id || t('common.unknown') }}</code></div>
        </div>
        <div class="form-row">
          <div class="form-label">{{ t('overview.eui') }}</div>
          <div class="form-divider" />
          <div class="form-content"><code class="mono-val eui">{{ status.eui || t('common.unknown') }}</code></div>
        </div>
        <div class="form-row">
          <div class="form-label">{{ t('overview.usb') }}</div>
          <div class="form-divider" />
          <div class="form-content row-inline">
            <code class="mono-val">{{ status.usb_path || '/dev/ttyACM0' }}</code>
            <span class="inline-badge" :class="status.usb_ok ? 'ok' : 'err'">
              {{ status.usb_ok ? t('overview.usb_ok') : t('overview.usb_fail') }}
            </span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-label">Frequency Band</div>
          <div class="form-divider" />
          <div class="form-content"><span class="tag-pill">EU868</span></div>
        </div>
        <div class="form-row">
          <div class="form-label">{{ t('overview.active_service') }}</div>
          <div class="form-divider" />
          <div class="form-content"><span class="tag-pill purple">{{ status.active_service }}</span></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading } from '@element-plus/icons-vue'

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
  if (h > 0) return h + 'h ' + m + 'm'
  if (m > 0) return m + 'm ' + sec + 's'
  return sec + 's'
})

async function fetchStatus() {
  try { status.value = await proxy.$oui.call('lora-gateway', 'get_status') }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}
onMounted(() => { fetchStatus(); timer = setInterval(fetchStatus, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.rak-page { background: var(--page-bg); min-height: 100%; }
.spinner-wrap { display: flex; justify-content: center; align-items: center; height: 200px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.status-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px; font-size: 14px; font-weight: 500;
  border-bottom: 1px solid var(--border-color);
  background: var(--content-bg);
}
.status-banner.is-running { border-left: 4px solid #10b981; }
.status-banner.is-stopped { border-left: 4px solid #ef4444; }
.status-left { display: flex; align-items: center; gap: 10px; }
.status-dot { width: 9px; height: 9px; border-radius: 50%; }
.is-running .status-dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); animation: pulse 2s infinite; }
.is-stopped .status-dot { background: #ef4444; }
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
}
.status-text { color: var(--heading-color); }
.status-svc  { color: var(--label-color); font-weight: 400; }
.status-uptime { color: var(--label-color); font-size: 13px; }

.info-section { background: var(--content-bg); }
.form-row {
  display: flex; align-items: flex-start; min-height: 56px;
  border-bottom: 1px solid var(--border-color);
}
.form-row:last-child { border-bottom: none; }
.form-label {
  width: 220px; min-width: 220px; padding: 16px 32px;
  font-size: 14px; color: var(--label-color); display: flex; align-items: center;
}
.form-divider { width: 1px; background: var(--divider-color); align-self: stretch; flex-shrink: 0; }
.form-content { flex: 1; padding: 16px 32px; display: flex; align-items: center; font-size: 14px; color: var(--heading-color); }
.row-inline { gap: 12px; }
.mono-val { font-family: 'SF Mono', monospace; font-size: 13px; background: #f5f5f8; padding: 3px 8px; border-radius: 4px; color: #374151; }
.mono-val.eui { letter-spacing: 0.5px; }
.inline-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }
.inline-badge.ok  { background: #d1fae5; color: #065f46; }
.inline-badge.err { background: #fee2e2; color: #991b1b; }
.tag-pill { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 13px; font-weight: 500; background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
.tag-pill.purple { background: var(--el-color-primary-light-9); color: var(--el-color-primary); border-color: var(--el-color-primary-light-7); }
</style>
