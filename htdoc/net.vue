<template>
  <div class="page-wrap">
    <div class="page-title">Network</div>

    <!-- Tab bar -->
    <div class="tab-bar" style="margin-bottom:24px">
      <span class="tab" :class="{active: tab==='wan'}" @click="tab='wan'">WAN</span>
      <span class="tab" :class="{active: tab==='lan'}" @click="tab='lan'">LAN</span>
      <span class="tab" :class="{active: tab==='wifi'}" @click="tab='wifi'">Wi-Fi</span>
    </div>

    <!-- WAN tab -->
    <template v-if="tab==='wan'">
      <div class="card">
        <div class="conn-status">
          <span class="status-dot connected"></span>
          <span class="status-text">Connected</span>
          <span class="status-detail">via {{ wan.proto || 'DHCP' }} · {{ wan.ip || '—' }}</span>
        </div>
        <div class="form-row">
          <div class="form-label">Interface</div>
          <div class="form-content"><span class="val-text">{{ wan.iface || '—' }}</span></div>
        </div>
        <div class="form-row">
          <div class="form-label">Protocol</div>
          <div class="form-content"><span class="val-text">{{ wan.proto || '—' }}</span></div>
        </div>
        <div class="form-row">
          <div class="form-label">IP Address</div>
          <div class="form-content"><span class="val-text">{{ wan.ip || '—' }}</span></div>
        </div>
        <div class="form-row">
          <div class="form-label">Gateway</div>
          <div class="form-content"><span class="val-text">{{ wan.gateway || '—' }}</span></div>
        </div>
        <div class="form-row no-border">
          <div class="form-label">DNS</div>
          <div class="form-content"><span class="val-text">{{ wan.dns || '—' }}</span></div>
        </div>
      </div>
    </template>

    <!-- LAN tab -->
    <template v-if="tab==='lan'">
      <div class="card">
        <div class="form-row">
          <div class="form-label">Interface</div>
          <div class="form-content"><span class="val-text">{{ lan.iface || '—' }}</span></div>
        </div>
        <div class="form-row">
          <div class="form-label">IP Address</div>
          <div class="form-content">
            <el-input v-model="lan.ip" style="width:300px" />
          </div>
        </div>
        <div class="form-row no-border">
          <div class="form-label">Subnet Mask</div>
          <div class="form-content">
            <el-input v-model="lan.mask" style="width:300px" />
          </div>
        </div>
      </div>
      <div class="sticky-footer">
        <el-button type="primary" @click="saveLan" :loading="saving">Save</el-button>
      </div>
    </template>

    <!-- Wi-Fi tab -->
    <template v-if="tab==='wifi'">
      <div class="card">
        <div style="padding:20px 0; color:#9ca3af; font-size:14px;">Wi-Fi configuration is not available on this device.</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, ElInput, ElButton } from 'element-plus'

const { proxy } = getCurrentInstance()

const tab    = ref('wan')
const saving = ref(false)

const wan = ref({ iface: '', proto: '', ip: '', gateway: '', dns: '' })
const lan = ref({ iface: '', ip: '', mask: '' })

async function fetchStatus() {
  try {
    const r = await proxy.$oui.call('network', 'get_status', {})
    if (r?.wan) wan.value = r.wan
    if (r?.lan)  lan.value  = r.lan
  } catch (e) {
    console.error('network status error:', e)
  }
}

async function saveLan() {
  saving.value = true
  try {
    await proxy.$oui.call('network', 'set_lan', { ...lan.value })
    ElMessage({ message: 'LAN settings saved', type: 'success', duration: 2000 })
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

onMounted(() => fetchStatus())
</script>

<style scoped>
.page-wrap  { padding: 32px; max-width: 1100px; }
.page-title { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 24px; }
.tab-bar    { display: flex; border-bottom: 1px solid #e5e7eb; }
.tab        { padding: 10px 20px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab.active { color: #111827; font-weight: 700; border-bottom-color: #111827; }
.card       { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; }
.form-row   { display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.form-row.no-border { border-bottom: none; }
.form-label { width: 240px; min-width: 240px; color: #6b7280; font-size: 14px; padding-right: 24px; padding-top: 2px; }
.form-content { flex: 1; }
.val-text   { font-size: 14px; color: #111827; font-weight: 500; }
.pill-btn   { border: 1px solid #d1d5db; border-radius: 20px; padding: 7px 20px; background: white; cursor: pointer; font-size: 14px; color: #374151; }

.conn-status { display: flex; align-items: center; gap: 8px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6; margin-bottom: 16px; }
.status-dot  { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
.status-dot.connected { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
.status-text   { font-weight: 600; color: #111827; font-size: 14px; }
.status-detail { color: #9ca3af; font-size: 13px; }

.sticky-footer {
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e5e7eb;
  padding: 16px 24px; display: flex; justify-content: flex-end;
}
</style>
