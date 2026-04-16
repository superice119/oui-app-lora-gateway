<template>
  <div class="rak-page">
    <div class="lora-page-title">LoRa Configuration</div>
    <div class="info-section">

      <!-- Work mode -->
      <div class="form-row">
        <div class="form-label">Work mode</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="radio-stack">
            <label
              v-for="svc in workModes"
              :key="svc.value"
              class="rak-radio"
              :class="{ selected: pendingService === svc.value }"
              @click="onServiceSwitch(svc.value)"
            >
              <span class="radio-circle" :class="{ checked: pendingService === svc.value }">
                <span class="radio-dot" />
              </span>
              <div class="radio-text">
                <span class="radio-label">{{ svc.label }}</span>
                <span class="radio-desc">{{ svc.desc }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Log Level -->
      <div class="form-row">
        <div class="form-label">Log Level</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-group narrow">
            <label>Log Level</label>
            <div class="rak-select-wrap">
              <select v-model="cfg.log_level" class="rak-select">
                <option v-for="lv in logLevels" :key="lv" :value="lv">{{ lv }}</option>
              </select>
              <el-icon class="select-arrow" :size="14"><ArrowDown /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Frequency Plan -->
      <div class="form-row freq-row">
        <div class="form-label">Frequency Plan</div>
        <div class="form-divider" />
        <div class="form-content freq-content">
          <div class="freq-top">
            <div class="input-group narrow">
              <label>Region</label>
              <div class="rak-select-wrap">
                <select v-model="cfg.region" class="rak-select">
                  <option v-for="r in regions" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
                <el-icon class="select-arrow" :size="14"><ArrowDown /></el-icon>
              </div>
            </div>
          </div>
          <!-- Expandable detail panel -->
          <div class="freq-expand" @click="showFreqDetail = !showFreqDetail">
            <span>View detailed regional parameters</span>
            <el-icon><ArrowDown v-if="!showFreqDetail" /><ArrowUp v-else /></el-icon>
          </div>
          <div v-if="showFreqDetail" class="freq-detail-panel">
            <div class="freq-param-grid">
              <div v-for="ch in freqChannels" :key="ch.name" class="freq-param-row">
                <span class="param-name">{{ ch.name }}</span>
                <span class="param-val">{{ ch.freq }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section divider before service-specific config -->
      <div class="section-divider">
        <span>Network Configuration</span>
      </div>

      <!-- Basics Station config (when selected) -->
      <template v-if="pendingService === 'basicstation'">
        <div class="form-row">
          <div class="form-label">LNS Address</div>
          <div class="form-divider" />
          <div class="form-content">
            <div class="input-group">
              <label>LNS WebSocket URI (tc.uri)</label>
              <input v-model="bs.tc_uri" class="rak-input" placeholder="ws://your-lns:3001" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-label">CUPS Address</div>
          <div class="form-divider" />
          <div class="form-content">
            <div class="input-group">
              <label>CUPS URI (optional)</label>
              <input v-model="bs.cups_uri" class="rak-input" placeholder="https://cups-server" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-label">Authentication</div>
          <div class="form-divider" />
          <div class="form-content">
            <div class="radio-stack">
              <label v-for="m in authModes" :key="m.value" class="rak-radio" @click="bs.auth_mode = m.value">
                <span class="radio-circle" :class="{ checked: bs.auth_mode === m.value }">
                  <span class="radio-dot" />
                </span>
                <span class="radio-label">{{ m.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="form-row" v-if="bs.auth_mode !== 'no_auth'">
          <div class="form-label">API Key</div>
          <div class="form-divider" />
          <div class="form-content">
            <div class="input-group">
              <label>API Key</label>
              <input v-model="bs.api_key" class="rak-input" type="password" placeholder="••••••••" />
            </div>
          </div>
        </div>
      </template>

      <!-- Packet Forwarder config (when selected) -->
      <template v-if="pendingService === 'lora_pkt_fwd'">
        <div class="form-row">
          <div class="form-label">Network Server</div>
          <div class="form-divider" />
          <div class="form-content">
            <div class="input-group">
              <label>Server Address</label>
              <input v-model="pf.server_address" class="rak-input" placeholder="eu1.cloud.thethings.network" />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-label">UDP Ports</div>
          <div class="form-divider" />
          <div class="form-content row-inline">
            <div class="input-group narrow">
              <label>Uplink Port</label>
              <input v-model.number="pf.serv_port_up" class="rak-input" type="number" />
            </div>
            <div class="input-group narrow">
              <label>Downlink Port</label>
              <input v-model.number="pf.serv_port_down" class="rak-input" type="number" />
            </div>
          </div>
        </div>
      </template>


      <!-- Service status -->
      <div class="section-sep" />
      <div class="form-row">
        <div class="form-label">Service Status</div>
        <div class="form-divider" />
        <div class="form-content row-inline">
          <span class="status-dot" :class="status.running ? 'run' : 'stop'" />
          <span class="status-label">{{ status.running ? 'Running' : 'Stopped' }}</span>
          <span v-if="status.running" class="muted">{{ uptimeStr }}</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="form-row">
        <div class="form-label">Controls</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="btn-group">
            <button class="rak-btn" :disabled="acting || status.running"    @click="doAction('start')">
              <span class="btn-dot green" />{{ t('service.start') }}
            </button>
            <button class="rak-btn" :disabled="acting || !status.running"   @click="doAction('stop')">
              <span class="btn-dot red" />{{ t('service.stop') }}
            </button>
            <button class="rak-btn primary" :disabled="acting"              @click="doAction('restart')">
              {{ t('service.restart') }}
            </button>
          </div>
        </div>
      </div>

    </div><!-- /info-section -->

    <!-- Sticky footer -->
    <div class="page-footer">
      <button class="rak-btn primary pill" :disabled="saving" @click="handleSave">
        {{ saving ? 'Saving...' : t('config.save_restart') }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Select } from '@element-plus/icons-vue'

const { t }     = useI18n()
const { proxy } = getCurrentInstance()

const status         = ref({})
const pendingService = ref('basicstation')
const acting         = ref(false)
const saving         = ref(false)
const showFreqDetail = ref(false)
let timer

const cfg = reactive({ log_level: 'NOTICE', region: 'EU868' })
const bs  = reactive({ tc_uri: '', cups_uri: '', auth_mode: 'no_auth', api_key: '' })
const pf  = reactive({ server_address: '', serv_port_up: 1700, serv_port_down: 1700 })

const workModes = [
  { value: 'lora_pkt_fwd',  label: 'Packet forwarder',       desc: 'Forward LoRa packets to a remote network server via UDP' },
  { value: 'basicstation',  label: 'Basics station',          desc: 'Connect to LNS using WebSocket (recommended)' },

]

const logLevels = ['ERROR', 'WARNING', 'NOTICE', 'INFO', 'DEBUG']

const regions = [
  { value: 'EU868',  label: 'EU868'  },
  { value: 'US915',  label: 'US915'  },
  { value: 'AU915',  label: 'AU915'  },
  { value: 'AS923',  label: 'AS923'  },
  { value: 'IN865',  label: 'IN865'  },
  { value: 'RU864',  label: 'RU864'  },
  { value: 'KR920',  label: 'KR920'  },
]

const freqChannels = [
  { name: 'CH0', freq: '868.100 MHz' },
  { name: 'CH1', freq: '868.300 MHz' },
  { name: 'CH2', freq: '868.500 MHz' },
  { name: 'CH3', freq: '867.100 MHz' },
  { name: 'CH4', freq: '867.300 MHz' },
  { name: 'CH5', freq: '867.500 MHz' },
  { name: 'CH6', freq: '867.700 MHz' },
  { name: 'CH7', freq: '867.900 MHz' },
  { name: 'FSK', freq: '868.800 MHz' },
]

const authModes = [
  { value: 'no_auth',    label: 'No authentication'   },
  { value: 'tls_server', label: 'TLS Server Auth'      },
  { value: 'tls_mutual', label: 'TLS Mutual Auth'      },
]

const uptimeStr = computed(() => {
  const s = status.value.uptime
  if (!s) return ''
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  if (h > 0) return h + 'h ' + m + 'm'
  return m + 'm ' + (s % 60) + 's'
})

async function fetchStatus() {
  try {
    status.value = await proxy.$oui.call('lora-gateway', 'get_status')
    pendingService.value = status.value.active_service || 'basicstation'
  } catch {}
}

async function loadConfig() {
  try {
    const c = await proxy.$oui.call('lora-gateway', 'get_config')
    if (c.log_level) cfg.log_level = c.log_level
    if (c.region)    cfg.region    = c.region
    if (c.basicstation)  Object.assign(bs, c.basicstation)
    if (c.lora_pkt_fwd)  Object.assign(pf, c.lora_pkt_fwd)
  } catch {}
}

async function handleSave() {
  saving.value = true
  try {
    await proxy.$oui.call('lora-gateway', 'set_config', {
      log_level: cfg.log_level,
      region:    cfg.region,
      basicstation: { ...bs },
      lora_pkt_fwd: { ...pf },
      restart: true,
    })
    ElMessage({ message: t('common.saved'), type: 'success', duration: 2000 })
  } catch (e) { ElMessage.error(e.message) }
  finally { saving.value = false }
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

onMounted(() => { fetchStatus(); loadConfig(); timer = setInterval(fetchStatus, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.rak-page { background: var(--page-bg); min-height: 100%; display: flex; flex-direction: column; }
.info-section { background: var(--content-bg); }

/* Form rows */
.form-row {
  display: flex; align-items: flex-start; min-height: 60px;
  border-bottom: 1px solid var(--border-color);
}
.form-row:last-of-type { border-bottom: none; }
.section-sep { height: 16px; background: var(--page-bg); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }

.form-label {
  width: 240px; min-width: 240px; padding: 20px 32px;
  font-size: 14px; color: #6b7280; font-weight: 500; display: flex; align-items: flex-start;
}
.form-divider { width: 1px; background: var(--divider-color); align-self: stretch; flex-shrink: 0; }
.form-content { flex: 1; padding: 16px 32px; display: flex; align-items: flex-start; flex-wrap: wrap; }
.row-inline { gap: 20px; align-items: center; }

/* Input group */
.input-group { display: flex; flex-direction: column; gap: 5px; min-width: 300px; }
.input-group.narrow { min-width: 160px; }
.input-group label { font-size: 12px; color: var(--label-color); font-weight: 500; }
.rak-input {
  height: 38px; padding: 0 12px; border: 1px solid var(--border-color);
  border-radius: 6px; font-size: 14px; color: var(--heading-color);
  background: #fff; outline: none; width: 100%;
  transition: border-color 0.15s;
}
.rak-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
.rak-input::placeholder { color: #d1d5db; }

/* Custom select */
.rak-select-wrap { position: relative; display: inline-flex; align-items: center; }
.rak-select {
  height: 38px; padding: 0 32px 0 12px;
  border: 1px solid var(--border-color); border-radius: 6px;
  font-size: 14px; color: var(--heading-color); background: #fff;
  appearance: none; outline: none; cursor: pointer; min-width: 160px;
  transition: border-color 0.15s;
}
.rak-select:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
.select-arrow { position: absolute; right: 10px; pointer-events: none; color: #9ca3af; }

/* Frequency plan */
.freq-content { flex-direction: column; gap: 14px; padding-top: 16px; padding-bottom: 16px; }
.freq-top { display: flex; align-items: flex-start; }
.freq-expand {
  display: flex; align-items: center; gap: 6px; color: #7c3aed;
  font-size: 13px; cursor: pointer; padding: 8px 0;
}
.freq-expand:hover { opacity: 0.8; }
.freq-detail-panel { background: #f9fafb; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; }
.freq-param-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.freq-param-row { display: flex; flex-direction: column; gap: 2px; }
.param-name { font-size: 11px; color: #9ca3af; text-transform: uppercase; font-weight: 500; }
.param-val  { font-size: 13px; color: var(--heading-color); font-weight: 600; font-family: 'SF Mono', Consolas, monospace; }

/* Custom radio */
.radio-stack { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; }
.rak-radio { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none; }
.radio-circle {
  width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: border-color 0.15s; margin-top: 2px;
}
.radio-circle.checked { border-color: #1e1048; }
.radio-dot { width: 10px; height: 10px; border-radius: 50%; background: transparent; transition: background 0.15s; }
.radio-circle.checked .radio-dot { background: #1e1048; }
.radio-text { display: flex; flex-direction: column; }
.radio-label { font-size: 14px; color: #374151; }
.radio-desc  { color: #9ca3af; font-size: 12px; margin-top: 2px; }

/* Page title */
.lora-page-title { font-size: 28px; font-weight: 700; color: #111827; padding: 28px 32px 0; margin-bottom: 0; }

/* Frequency expand */
.freq-expand {
  display: flex; align-items: center; gap: 6px; color: #7c3aed;
  font-size: 13px; cursor: pointer; padding: 8px 0;
}
.freq-expand:hover { opacity: 0.8; }

/* Section divider */
.section-divider {
  padding: 16px 32px 8px; font-size: 12px; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.08em;
  border-top: 1px solid #f3f4f6; margin-top: 8px;
}

/* Status */
.status-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.status-dot.run  { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.2); animation: pulse 2s infinite; }
.status-dot.stop { background: #9ca3af; }
@keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.2)} 50%{box-shadow:0 0 0 6px rgba(16,185,129,.05)} }
.status-label { font-size: 14px; color: var(--heading-color); font-weight: 500; }
.muted { font-size: 13px; color: var(--label-color); }

/* Buttons */
.btn-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.rak-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 20px; border-radius: 20px; font-size: 14px; font-weight: 500;
  background: #fff; border: 1px solid var(--border-color); color: #374151;
  cursor: pointer; transition: background 0.15s;
}
.rak-btn:hover:not(:disabled) { background: #f9fafb; }
.rak-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.rak-btn.primary { background: var(--el-color-primary); border-color: var(--el-color-primary); color: #fff; }
.rak-btn.primary:hover:not(:disabled) { background: var(--el-color-primary-dark-2); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
.rak-btn.pill { border-radius: 24px; padding: 10px 28px; }
.btn-dot { width: 8px; height: 8px; border-radius: 50%; }
.btn-dot.green { background: #10b981; }
.btn-dot.red   { background: #ef4444; }

/* Placeholder text */
.placeholder-text { font-size: 13px; color: var(--label-color); font-style: italic; }

/* Footer */
.page-footer {
  position: sticky; bottom: 0; background: #fff;
  border-top: 1px solid #e5e7eb; padding: 16px 32px;
  z-index: 10; display: flex; justify-content: flex-end; margin-top: auto;
}
</style>
