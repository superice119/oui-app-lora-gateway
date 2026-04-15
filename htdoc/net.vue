<template>
  <div class="page-wrap">
    <div class="page-title">Network</div>

    <!-- WAN card -->
    <div class="card">
      <div class="card-title">WAN</div>
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

    <!-- LAN card -->
    <div class="card">
      <div class="card-title">LAN</div>
      <div class="form-row">
        <div class="form-label">Interface</div>
        <div class="form-content"><span class="val-text">{{ lan.iface || '—' }}</span></div>
      </div>
      <div class="form-row">
        <div class="form-label">IP Address</div>
        <div class="form-content"><span class="val-text">{{ lan.ip || '—' }}</span></div>
      </div>
      <div class="form-row no-border">
        <div class="form-label">Subnet Mask</div>
        <div class="form-content"><span class="val-text">{{ lan.mask || '—' }}</span></div>
      </div>
    </div>

    <!-- Sticky footer -->
    <div class="sticky-footer">
      <button class="pill-btn" disabled style="opacity: 0.5; cursor: not-allowed;">Save</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

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

onMounted(() => fetchStatus())
</script>

<style scoped>
.page-wrap  { padding: 32px; max-width: 1100px; }
.page-title { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 24px; }
.card       { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
.form-row   { display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.form-row.no-border { border-bottom: none; }
.form-label { width: 240px; min-width: 240px; color: #6b7280; font-size: 14px; padding-right: 24px; padding-top: 2px; }
.form-content { flex: 1; }
.val-text   { font-size: 14px; color: #111827; font-weight: 500; }
.pill-btn   { border: 1px solid #d1d5db; border-radius: 20px; padding: 7px 20px; background: white; cursor: pointer; font-size: 14px; color: #374151; }
.sticky-footer {
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e5e7eb;
  padding: 16px 24px; display: flex; justify-content: flex-end;
  border-radius: 0 0 8px 8px;
}
</style>
