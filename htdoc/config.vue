<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('config.title') }}</h2>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">

        <!-- basicstation tab -->
        <el-tab-pane :label="t('config.basicstation.tab')" name="basicstation">
          <el-form :model="bs" label-width="180px" class="config-form">

            <el-form-item :label="t('config.basicstation.tc_uri')">
              <el-input v-model="bs.tc_uri" placeholder="ws://your-lns-server:3001" clearable />
            </el-form-item>

            <el-form-item :label="t('config.basicstation.cups_uri')">
              <el-input v-model="bs.cups_uri" placeholder="https://cups-server (optional)" clearable />
            </el-form-item>

            <el-form-item :label="t('config.basicstation.auth_mode')">
              <el-radio-group v-model="bs.auth_mode">
                <el-radio value="no_auth">{{ t('config.basicstation.no_auth') }}</el-radio>
                <el-radio value="tls_server">{{ t('config.basicstation.tls_server') }}</el-radio>
                <el-radio value="tls_mutual">{{ t('config.basicstation.tls_mutual') }}</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="bs.auth_mode !== 'no_auth'"
              :label="t('config.basicstation.api_key')"
            >
              <el-input v-model="bs.api_key" type="password" show-password clearable />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveBS">
                {{ t('config.save_restart') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- lora_pkt_fwd tab -->
        <el-tab-pane :label="t('config.lora_pkt_fwd.tab')" name="lora_pkt_fwd">
          <el-form :model="pf" label-width="180px" class="config-form">

            <el-form-item :label="t('config.lora_pkt_fwd.server_address')">
              <el-input v-model="pf.server_address" placeholder="eu1.cloud.thethings.network" clearable />
            </el-form-item>

            <el-form-item :label="t('config.lora_pkt_fwd.serv_port_up')">
              <el-input-number v-model="pf.serv_port_up" :min="1" :max="65535" />
            </el-form-item>

            <el-form-item :label="t('config.lora_pkt_fwd.serv_port_down')">
              <el-input-number v-model="pf.serv_port_down" :min="1" :max="65535" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="saving" @click="savePF">
                {{ t('config.save_restart') }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

      </el-tabs>
    </el-card>
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

async function loadConfig() {
  try {
    const cfg = await proxy.$oui.call('lora-gateway', 'get_config')
    Object.assign(bs, cfg.basicstation)
    Object.assign(pf, cfg.lora_pkt_fwd)
  } catch (e) {
    ElMessage.error('Failed to load config: ' + e.message)
  }
}

async function saveBS() {
  saving.value = true
  try {
    await proxy.$oui.call('lora-gateway', 'set_config', { basicstation: { ...bs }, restart: true })
    ElMessage.success(t('common.saved'))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function savePF() {
  saving.value = true
  try {
    await proxy.$oui.call('lora-gateway', 'set_config', { lora_pkt_fwd: { ...pf }, restart: true })
    ElMessage.success(t('common.saved'))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.page-container { padding: 24px; }
.page-header { margin-bottom: 20px; }
.page-header h2 { font-size: 20px; color: #1a2332; }
.config-form { max-width: 600px; padding-top: 16px; }
</style>
