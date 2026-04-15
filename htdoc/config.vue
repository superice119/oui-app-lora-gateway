<template>
  <div class="rak-page">
    <!-- basicstation section -->
    <div class="section-header">
      <span class="section-title">Basics Station</span>
      <el-tag v-if="activeTab === 'basicstation'" type="success" size="small" effect="plain">Active</el-tag>
    </div>
    <div class="info-section" v-show="activeTab === 'basicstation'">

      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.tc_uri') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-wrap">
            <label class="field-label">LNS WebSocket URI</label>
            <input v-model="bs.tc_uri" class="rak-input" placeholder="ws://your-lns:3001" />
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.cups_uri') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-wrap">
            <label class="field-label">CUPS URI (optional)</label>
            <input v-model="bs.cups_uri" class="rak-input" placeholder="https://cups-server" />
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">{{ t('config.basicstation.auth_mode') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="radio-stack">
            <label class="rak-radio" v-for="m in authModes" :key="m.value" @click="bs.auth_mode = m.value">
              <span class="radio-circle" :class="{ checked: bs.auth_mode === m.value }">
                <span class="radio-dot" />
              </span>
              <span class="radio-label">{{ m.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <div class="form-row" v-if="bs.auth_mode !== 'no_auth'">
        <div class="form-label">{{ t('config.basicstation.api_key') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-wrap">
            <label class="field-label">API Key</label>
            <input v-model="bs.api_key" class="rak-input" type="password" placeholder="••••••••" />
          </div>
        </div>
      </div>

    </div>

    <!-- Tab switcher (work mode style) -->
    <div class="section-divider" />
    <div class="info-section">
      <div class="form-row">
        <div class="form-label">Active section</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="tab-switch">
            <button class="ts-btn" :class="{ active: activeTab === 'basicstation' }" @click="activeTab = 'basicstation'">Basics station</button>
            <button class="ts-btn" :class="{ active: activeTab === 'lora_pkt_fwd' }" @click="activeTab = 'lora_pkt_fwd'">Packet forwarder</button>
          </div>
        </div>
      </div>
    </div>

    <!-- lora_pkt_fwd section -->
    <div class="section-header">
      <span class="section-title">Packet Forwarder</span>
      <el-tag v-if="activeTab === 'lora_pkt_fwd'" type="success" size="small" effect="plain">Active</el-tag>
    </div>
    <div class="info-section" v-show="activeTab === 'lora_pkt_fwd'">

      <div class="form-row">
        <div class="form-label">{{ t('config.lora_pkt_fwd.server_address') }}</div>
        <div class="form-divider" />
        <div class="form-content">
          <div class="input-wrap">
            <label class="field-label">Network Server Address</label>
            <input v-model="pf.server_address" class="rak-input" placeholder="eu1.cloud.thethings.network" />
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-label">{{ t('config.lora_pkt_fwd.serv_port_up') }}</div>
        <div class="form-divider" />
        <div class="form-content row-inline">
          <div class="input-wrap narrow">
            <label class="field-label">Uplink Port</label>
            <input v-model.number="pf.serv_port_up" class="rak-input" type="number" />
          </div>
          <div class="input-wrap narrow">
            <label class="field-label">Downlink Port</label>
            <input v-model.number="pf.serv_port_down" class="rak-input" type="number" />
          </div>
        </div>
      </div>

    </div>

    <!-- Footer save button -->
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
.rak-page { background: var(--page-bg); min-height: 100%; }
.info-section { background: var(--content-bg); }

.section-header {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 32px 8px;
  background: var(--content-bg);
  border-top: 1px solid var(--border-color);
}
.section-title { font-size: 15px; font-weight: 600; color: var(--heading-color); }
.section-divider { height: 8px; background: var(--page-bg); }

.form-row { display: flex; align-items: flex-start; min-height: 60px; border-bottom: 1px solid var(--border-color); background: var(--content-bg); }
.form-row:last-child { border-bottom: none; }
.form-label { width: 220px; min-width: 220px; padding: 18px 32px; font-size: 14px; color: var(--label-color); display: flex; align-items: flex-start; padding-top: 20px; }
.form-divider { width: 1px; background: var(--divider-color); align-self: stretch; flex-shrink: 0; }
.form-content { flex: 1; padding: 16px 32px; display: flex; align-items: flex-start; flex-wrap: wrap; }
.row-inline { gap: 20px; align-items: flex-start; }

/* Input */
.input-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 280px; }
.input-wrap.narrow { min-width: 140px; }
.field-label { font-size: 12px; color: var(--label-color); }
.rak-input {
  height: 38px; padding: 0 12px; border: 1px solid var(--border-color);
  border-radius: 6px; font-size: 14px; color: var(--heading-color);
  background: #fff; outline: none; transition: border-color 0.15s; width: 100%;
}
.rak-input:focus { border-color: var(--el-color-primary); }
.rak-input::placeholder { color: #d1d5db; }

/* Radio */
.radio-stack { display: flex; flex-direction: column; gap: 12px; padding: 2px 0; }
.rak-radio { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.radio-circle { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.15s; }
.radio-circle.checked { border-color: #1e1048; }
.radio-dot { width: 10px; height: 10px; border-radius: 50%; background: transparent; transition: background 0.15s; }
.radio-circle.checked .radio-dot { background: #1e1048; }
.radio-label { font-size: 14px; color: #374151; }

/* Tab switch */
.tab-switch { display: flex; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
.ts-btn { padding: 8px 20px; font-size: 14px; background: #fff; border: none; cursor: pointer; color: var(--label-color); transition: background 0.15s, color 0.15s; }
.ts-btn.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 600; }
.ts-btn:not(:last-child) { border-right: 1px solid var(--border-color); }

/* Footer */
.page-footer {
  position: sticky; bottom: 0; background: var(--content-bg);
  border-top: 1px solid var(--border-color);
  padding: 16px 32px; display: flex; justify-content: flex-end;
}
.rak-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 22px; border-radius: 20px; font-size: 14px; font-weight: 500;
  background: #fff; border: 1px solid var(--border-color); color: #374151;
  cursor: pointer; transition: background 0.15s;
}
.rak-btn.primary { background: var(--el-color-primary); border-color: var(--el-color-primary); color: #fff; }
.rak-btn.primary:hover:not(:disabled) { background: var(--el-color-primary-dark-2); }
.rak-btn.pill { border-radius: 24px; padding: 10px 28px; }
.rak-btn:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
