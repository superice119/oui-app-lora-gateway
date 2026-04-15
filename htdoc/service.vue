<template>
  <div class="rak-page">
    <div class="info-section">

      <!-- Row 1: Work mode -->
      <div class="form-row">
        <div class="form-label">Work mode</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="radio-stack">
            <label
              v-for="svc in services"
              :key="svc.value"
              class="rak-radio"
              :class="{ selected: pendingService === svc.value }"
              @click="onServiceSwitch(svc.value)"
            >
              <span class="radio-circle" :class="{ checked: pendingService === svc.value }">
                <span class="radio-dot" />
              </span>
              <span class="radio-label">{{ svc.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Row 2: Service status -->
      <div class="form-row">
        <div class="form-label">{{ t('service.status') }}</div>
        <div class="form-divider" />
        <div class="form-content row-inline">
          <span class="status-dot" :class="status.running ? 'run' : 'stop'" />
          <span class="status-label">
            {{ status.running ? t('overview.running') : t('overview.stopped') }}
          </span>
          <span v-if="status.running" class="muted">{{ uptimeStr }}</span>
        </div>
      </div>

      <!-- Row 3: Controls -->
      <div class="form-row">
        <div class="form-label">Controls</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="btn-group">
            <button
              class="rak-btn"
              :disabled="acting || status.running"
              @click="doAction('start')">
              <span class="btn-dot green" />
              {{ t('service.start') }}
            </button>
            <button
              class="rak-btn"
              :disabled="acting || !status.running"
              @click="doAction('stop')">
              <span class="btn-dot red" />
              {{ t('service.stop') }}
            </button>
            <button
              class="rak-btn primary"
              :disabled="acting"
              @click="doAction('restart')">
              {{ t('service.restart') }}
            </button>
          </div>
        </div>
      </div>

    </div><!-- /info-section -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const { proxy } = getCurrentInstance()

const status         = ref({})
const pendingService = ref('basicstation')
const acting         = ref(false)
let timer

const services = [
  { value: 'lora_pkt_fwd', label: 'Packet forwarder' },
  { value: 'basicstation',  label: 'Basics station'  },
]

const uptimeStr = computed(() => {
  const s = status.value.uptime
  if (!s) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return h + 'h ' + m + 'm'
  if (m > 0) return m + 'm ' + sec + 's'
  return sec + 's'
})

async function fetchStatus() {
  try {
    status.value = await proxy.$oui.call('lora-gateway', 'get_status')
    pendingService.value = status.value.active_service || 'basicstation'
  } catch (e) {}
}

async function doAction(action) {
  acting.value = true
  try {
    await proxy.$oui.call('lora-gateway', action + '_service', { service: pendingService.value })
    ElMessage({ message: action + ' OK', type: 'success', duration: 2000 })
    await fetchStatus()
  } catch (e) { ElMessage.error(e.message) }
  finally { acting.value = false }
}

async function onServiceSwitch(newVal) {
  if (newVal === pendingService.value) return
  try {
    await ElMessageBox.confirm(t('service.switch_warning'), t('common.confirm'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText:  t('common.cancel'),
      type: 'warning'
    })
    acting.value = true
    await proxy.$oui.call('lora-gateway', 'set_active_service', { service: newVal })
    ElMessage({ message: 'Switched to ' + newVal, type: 'success', duration: 2000 })
    await fetchStatus()
  } catch { pendingService.value = status.value.active_service }
  finally { acting.value = false }
}

onMounted(() => { fetchStatus(); timer = setInterval(fetchStatus, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.rak-page { background: var(--page-bg); min-height: 100%; }
.info-section { background: var(--content-bg); }

/* Form rows */
.form-row {
  display: flex; align-items: flex-start; min-height: 60px;
  border-bottom: 1px solid var(--border-color);
}
.form-row:last-child { border-bottom: none; }

.form-label {
  width: 240px; min-width: 240px; padding: 18px 32px;
  font-size: 14px; color: var(--label-color);
  display: flex; align-items: flex-start; padding-top: 20px;
}
.form-divider { width: 1px; background: var(--divider-color); align-self: stretch; flex-shrink: 0; }
.form-content { flex: 1; padding: 16px 32px; display: flex; align-items: flex-start; }
.row-inline { align-items: center; gap: 10px; }

/* Custom radio buttons */
.radio-stack { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.rak-radio { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.radio-circle {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #d1d5db;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: border-color 0.15s;
}
.radio-circle.checked { border-color: #1e1048; }
.radio-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: transparent; transition: background 0.15s;
}
.radio-circle.checked .radio-dot { background: #1e1048; }
.radio-label { font-size: 14px; color: #374151; }

/* Status indicator */
.status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.status-dot.run  { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); animation: pulse 2s infinite; }
.status-dot.stop { background: #9ca3af; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.20); }
  50%       { box-shadow: 0 0 0 6px rgba(16,185,129,0.05); }
}
.status-label { font-size: 14px; color: var(--heading-color); font-weight: 500; }
.muted { font-size: 13px; color: var(--label-color); }

/* Control buttons */
.btn-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.rak-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;
  background: #fff; border: 1px solid var(--border-color); color: #374151;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
}
.rak-btn:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
.rak-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.rak-btn.primary { background: var(--el-color-primary); border-color: var(--el-color-primary); color: #fff; }
.rak-btn.primary:hover:not(:disabled) { background: var(--el-color-primary-dark-2); }
.btn-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.btn-dot.green { background: #10b981; }
.btn-dot.red   { background: #ef4444; }
</style>
