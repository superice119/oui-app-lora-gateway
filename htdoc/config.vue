<template>
  <div class="rak-page">

    <!-- Segmented-control tab bar -->
    <div class="seg-bar">
      <div class="seg-control">
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'basicstation' }"
          @click="activeTab = 'basicstation'"
        >
          Basics Station
        </button>
        <button
          class="seg-btn"
          :class="{ active: activeTab === 'lora_pkt_fwd' }"
          @click="activeTab = 'lora_pkt_fwd'"
        >
          Packet Forwarder
        </button>
      </div>
    </div>

    <!-- ── Basics Station form ──────────────────── -->
    <div v-show="activeTab === 'basicstation'" class="info-section">

      <!-- LNS Address -->
      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.tc_uri') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-group">
            <label>LNS WebSocket URI</label>
            <input v-model="bs.tc_uri" class="rak-input" placeholder="ws://your-lns:3001" />
          </div>
        </div>
      </div>

      <!-- CUPS Address -->
      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.cups_uri') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-group">
            <label>CUPS URI (optional)</label>
            <input v-model="bs.cups_uri" class="rak-input" placeholder="https://cups-server" />
          </div>
        </div>
      </div>

      <!-- Authentication -->
      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.auth_mode') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="radio-stack">
            <label
              v-for="m in authModes"
              :key="m.value"
              class="rak-radio"
              @click="bs.auth_mode = m.value"
            >
              <span class="radio-circle" :class="{ checked: bs.auth_mode === m.value }">
                <span class="radio-dot" />
              </span>
              <span class="radio-label">{{ m.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- API Key (visible only when auth enabled) -->
      <div class="form-row" v-if="bs.auth_mode !== 'no_auth'">
        <div class="form-label">{{ t('config.basicstation.api_key') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-group">
            <label>API Key</label>
            <input v-model="bs.api_key" class="rak-input" type="password" placeholder="••••••••" />
          </div>
        </div>
      </div>

    </div><!-- /basicstation -->

    <!-- ── Packet Forwarder form ─────────────────── -->
    <div v-show="activeTab === 'lora_pkt_fwd'" class="info-section">

      <!-- Network Server -->
      <div class="form-row">
        <div class="form-label">{{ t('config.lora_pkt_fwd.server_address') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-group">
            <label>Network Server Address</label>
            <input v-model="pf.server_address" class="rak-input" placeholder="eu1.cloud.thethings.network" />
          </div>
        </div>
      </div>

      <!-- Ports -->
      <div class="form-row">
        <div class="form-label">{{ t('config.lora_pkt_fwd.serv_port_up') }}</div>
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

    </div><!-- /lora_pkt_fwd -->

    <!-- Sticky save footer -->
    <div class="page-footer">
      <button class="rak-btn primary pill" :disabled="saving" @click="handleSave">
        {{ saving ? 'Saving...' : t('config.save_restart') }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const { t } = useI18n()
const { proxy } = getCurrentInstance()

const activeTab = ref('basicstation')
const saving    = ref(false)

const bs = reactive({ tc_uri: '', cups_uri: '', auth_mode: 'no_auth', api_key: '' })
const pf = reactive({ server_address: '', serv_port_up: 1700, serv_port_down: 1700 })

const authModes = [
  { value: 'no_auth',    label: t('config.basicstation.no_auth')    },
  { value: 'tls_server', label: t('config.basicstation.tls_server') },
  { value: 'tls_mutual', label: t('config.basicstation.tls_mutual') },
]

async function loadConfig() {
  try {
    const cfg = await proxy.$oui.call('lora-gateway', 'get_config')
    Object.assign(bs, cfg.basicstation)
    Object.assign(pf, cfg.lora_pkt_fwd)
  } catch (e) { ElMessage.error('Failed to load config: ' + e.message) }
}

async function handleSave() {
  saving.value = true
  try {
    const payload = activeTab.value === 'basicstation'
      ? { basicstation: { ...bs }, restart: true }
      : { lora_pkt_fwd: { ...pf }, restart: true }
    await proxy.$oui.call('lora-gateway', 'set_config', payload)
    ElMessage({ message: t('common.saved'), type: 'success', duration: 2000 })
  } catch (e) { ElMessage.error(e.message) }
  finally { saving.value = false }
}

onMounted(loadConfig)
</script>

<style scoped>
.rak-page {
  background: var(--page-bg);
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* Segmented control bar */
.seg-bar {
  padding: 16px 32px 0;
  background: var(--content-bg);
  border-bottom: 1px solid var(--border-color);
}
.seg-control {
  display: inline-flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
  margin-bottom: -1px;
}
.seg-btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--label-color);
  background: transparent;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}
.seg-btn.active {
  background: #ffffff;
  color: var(--heading-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
  font-weight: 600;
}
.seg-btn:hover:not(.active) { color: var(--heading-color); }

/* Form section */
.info-section { background: var(--content-bg); }

.form-row {
  display: flex; align-items: flex-start; min-height: 60px;
  border-bottom: 1px solid var(--border-color);
  background: var(--content-bg);
}
.form-row:last-child { border-bottom: none; }

.form-label {
  width: 240px; min-width: 240px; padding: 18px 32px;
  font-size: 14px; color: var(--label-color);
  display: flex; align-items: flex-start; padding-top: 20px;
}
.form-divider {
  width: 1px; background: var(--divider-color);
  align-self: stretch; flex-shrink: 0;
}
.form-content {
  flex: 1; padding: 16px 32px;
  display: flex; align-items: flex-start; flex-wrap: wrap;
}
.row-inline { gap: 20px; align-items: flex-start; }

/* Input group (label above input) */
.input-group {
  display: flex; flex-direction: column; gap: 5px;
  min-width: 300px;
}
.input-group.narrow { min-width: 140px; }
.input-group label {
  font-size: 12px; color: var(--label-color); font-weight: 500;
}
.rak-input {
  height: 38px; padding: 0 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px; font-size: 14px;
  color: var(--heading-color); background: #fff;
  outline: none; transition: border-color 0.15s; width: 100%;
}
.rak-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
.rak-input::placeholder { color: #d1d5db; }

/* Custom radio */
.radio-stack { display: flex; flex-direction: column; gap: 12px; padding: 2px 0; }
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

/* Sticky footer */
.page-footer {
  position: sticky; bottom: 0;
  background: var(--content-bg);
  border-top: 1px solid var(--border-color);
  padding: 16px 32px; display: flex; justify-content: flex-end;
  margin-top: auto;
}
.rak-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 22px; border-radius: 20px; font-size: 14px; font-weight: 500;
  background: #fff; border: 1px solid var(--border-color); color: #374151;
  cursor: pointer; transition: background 0.15s, box-shadow 0.15s;
}
.rak-btn.primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.rak-btn.primary:hover:not(:disabled) {
  background: var(--el-color-primary-dark-2);
  box-shadow: 0 4px 12px rgba(124,58,237,0.35);
}
.rak-btn.pill { border-radius: 24px; padding: 10px 28px; }
.rak-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
