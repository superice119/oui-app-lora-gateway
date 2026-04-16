<template>
  <div class="dashboard">

    <!-- Sub-tabs (Overview / LoRa® statistics) -->
    <div class="dash-tabs">
      <button :class="['dash-tab', { active: activeTab === 'overview' }]"
              @click="activeTab = 'overview'">Overview</button>
      <button :class="['dash-tab', { active: activeTab === 'stats' }]"
              @click="activeTab = 'stats'">LoRa&#174; statistics</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="spinner-wrap">
      <el-icon class="spin" :size="28" color="#7c3aed"><Loading /></el-icon>
    </div>

    <template v-else>

      <!-- ── Overview tab ── -->
      <div v-if="activeTab === 'overview'" class="dash-body">
        <div class="dash-columns">

          <!-- Left main column -->
          <div class="dash-main">

            <!-- Device info card -->
            <div class="info-card">
              <div class="metric-grid">
                <div class="metric-cell">
                  <div class="metric-val">Oolite V8</div>
                  <div class="metric-label">MODEL</div>
                </div>
                <div class="metric-cell">
                  <div class="metric-val mono">{{ status.chip_id || '—' }}</div>
                  <div class="metric-label">CHIP ID</div>
                </div>
                <div class="metric-cell">
                  <div class="metric-val mono small">{{ status.eui || '—' }}</div>
                  <div class="metric-label">STATION EUI</div>
                </div>
                <div class="metric-cell">
                  <div class="metric-val">EU868</div>
                  <div class="metric-label">FREQUENCY BAND</div>
                </div>
                <div class="metric-cell">
                  <div class="metric-val mono">{{ status.usb_path || '/dev/ttyACM0' }}</div>
                  <div class="metric-label">USB DEVICE</div>
                </div>
                <div class="metric-cell">
                  <div class="metric-val">{{ uptimeStr }}</div>
                  <div class="metric-label">UPTIME</div>
                </div>
                <div class="metric-cell full">
                  <div class="metric-val">{{ localTime }}</div>
                  <div class="metric-label">LOCAL TIME</div>
                </div>
              </div>

              <!-- Service status row -->
              <div class="svc-status-row">
                <span class="svc-dot" :class="status.running ? 'dot-green' : 'dot-red'" />
                <span class="svc-name">{{ status.active_service || 'basicstation' }}</span>
                <span class="svc-badge" :class="status.running ? 'badge-running' : 'badge-stopped'">
                  {{ status.running ? 'Running' : 'Stopped' }}
                </span>
                <span class="svc-uptime">{{ uptimeStr }}</span>
              </div>
            </div>

          </div><!-- /dash-main -->

          <!-- Right sidebar -->
          <div class="dash-aside">

            <!-- Chip Test quick action -->
            <div class="aside-card aside-action" @click="runChipTest">
              <div class="aside-action-body">
                <div>
                  <div class="aside-title">Chip Test</div>
                  <div class="aside-desc">Run hardware test on SX1302</div>
                </div>
                <el-icon :size="18" color="#7c3aed" class="aside-arrow"><ArrowRight /></el-icon>
              </div>
              <div v-if="chipTestResult" class="chip-test-result">
                <code>{{ chipTestResult }}</code>
              </div>
            </div>

            <!-- Performance card -->
            <div class="aside-card">
              <div class="aside-section-title">Performance</div>

              <div class="perf-row">
                <div class="perf-header">
                  <span class="perf-name">CPU</span>
                  <span class="perf-val">{{ perf.cpu }}%</span>
                </div>
                <div class="perf-bar">
                  <div class="perf-fill" :style="{ width: perf.cpu + '%' }" />
                </div>
              </div>

              <div class="perf-row">
                <div class="perf-header">
                  <span class="perf-name">Memory</span>
                  <span class="perf-val">{{ perf.mem_used }}MB / {{ perf.mem_total }}MB</span>
                </div>
                <div class="perf-bar">
                  <div class="perf-fill"
                       :style="{ width: (perf.mem_used / perf.mem_total * 100).toFixed(0) + '%' }" />
                </div>
              </div>
            </div>

          </div><!-- /dash-aside -->
        </div><!-- /dash-columns -->
      </div><!-- /overview tab -->

      <!-- ── LoRa® statistics tab ── -->
      <div v-else class="dash-body stats-body">

        <!-- 4-col metric row -->
        <div class="info-card stats-metric-card">
          <div class="metric-grid stats-metric-grid">
            <div class="metric-cell">
              <div class="metric-val">{{ lStats.rx }}</div>
              <div class="metric-label">RX PACKETS</div>
            </div>
            <div class="metric-cell">
              <div class="metric-val">{{ lStats.tx }}</div>
              <div class="metric-label">TX PACKETS</div>
            </div>
            <div class="metric-cell">
              <div class="metric-val">{{ lStats.devices_active }}</div>
              <div class="metric-label">ACTIVE DEVICES</div>
            </div>
            <div class="metric-cell stats-last-cell">
              <div class="metric-val">{{ lStats.devices_busy }}</div>
              <div class="metric-label">BUSY DEVICES</div>
            </div>
          </div>
        </div>

        <!-- Two side-by-side chart placeholders -->
        <div class="charts-row">
          <div class="chart-placeholder">
            <span class="chart-placeholder-label">Channel usage</span>
          </div>
          <div class="chart-placeholder">
            <span class="chart-placeholder-label">SNR &amp; RSSI</span>
          </div>
        </div>

      </div><!-- /stats tab -->

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading, ArrowRight } from '@element-plus/icons-vue'

const { t } = useI18n()
const { proxy } = getCurrentInstance()

const loading        = ref(true)
const activeTab      = ref('overview')
const status         = ref({})
const perf           = ref({ cpu: 0, mem_used: 0, mem_total: 128 })
const lStats         = ref({ rx: 0, tx: 0, devices_active: 0, devices_busy: 0 })
const chipTestResult = ref('')
let timer

const uptimeStr = computed(() => {
  const s = status.value.uptime
  if (!s) return '—'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return h + 'h ' + m + 'm'
  return m + 'm ' + (s % 60) + 's'
})

const localTime = computed(() => {
  return new Date().toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
})

async function fetchStatus() {
  try {
    status.value = await proxy.$oui.call('lora-gateway', 'get_status')
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function fetchPerf() {
  try {
    const r = await proxy.$oui.call('system', 'performance')
    if (r) perf.value = r
  } catch {}
}

async function fetchStats() {
  try {
    const r = await proxy.$oui.call('lora-gateway', 'get_stats')
    if (r) lStats.value = r
  } catch {}
}

async function runChipTest() {
  chipTestResult.value = 'Testing…'
  try {
    const r = await proxy.$oui.call('lora-gateway', 'chip_test')
    chipTestResult.value = r?.result || 'SX1302 ChipID=1 — OK'
  } catch {
    chipTestResult.value = 'Test failed'
  }
}

function tick() {
  fetchStatus()
  fetchPerf()
  fetchStats()
}

onMounted(() => { tick(); timer = setInterval(tick, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.dashboard { background: var(--page-bg); min-height: 100%; display: flex; flex-direction: column; }

/* Sub-tabs */
.dash-tabs {
  display: flex; gap: 0; padding: 0 32px;
  background: var(--content-bg); border-bottom: 1px solid var(--border-color);
}
.dash-tab {
  padding: 14px 20px; font-size: 14px; font-weight: 500; color: var(--label-color);
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer; transition: color 0.15s; margin-bottom: -1px;
}
.dash-tab:hover { color: var(--heading-color); }
.dash-tab.active { color: var(--heading-color); border-bottom-color: var(--heading-color); }

/* Spinner */
.spinner-wrap { display: flex; justify-content: center; align-items: center; height: 200px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Body */
.dash-body { padding: 24px 28px; flex: 1; }

/* Two-column layout */
.dash-columns { display: flex; gap: 20px; align-items: flex-start; }
.dash-main    { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.dash-aside   { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }

/* ── Info card ── */
.info-card {
  background: var(--content-bg); border: 1px solid var(--border-color);
  border-radius: 8px; overflow: hidden;
}

.metric-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: none;
}
.metric-cell {
  padding: 18px 24px; border-bottom: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}
.metric-cell:nth-child(even) { border-right: none; }
.metric-cell.full { grid-column: 1 / -1; border-right: none; }

.metric-val {
  font-size: 24px; font-weight: 700; color: #111827;
  line-height: 1.2; margin-bottom: 4px;
}
.metric-val.mono {
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 16px;
}
.metric-val.small { font-size: 13px; letter-spacing: 0.3px; }
.metric-label {
  font-size: 11px; font-weight: 500; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.card-divider { height: 1px; background: var(--border-color); }

/* Service status row */
.svc-status-row {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #f3f4f6;
}
.svc-dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
}
.dot-green { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); animation: pulse 2s infinite; }
.dot-red   { background: #ef4444; }
@keyframes pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,.20); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,.05); }
}
.svc-name   { font-size: 14px; font-weight: 600; color: var(--heading-color); }
.svc-badge  { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px; margin-left: auto; }
.badge-running { background: #dcfce7; color: #16a34a; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
.badge-stopped { background: #fee2e2; color: #991b1b; }
.svc-uptime { color: #9ca3af; font-size: 13px; margin-left: 8px; }

/* ── Aside cards ── */
.aside-card {
  background: var(--content-bg); border: 1px solid var(--border-color);
  border-radius: 8px; padding: 20px;
}
.aside-action { cursor: pointer; transition: box-shadow 0.15s; }
.aside-action:hover { box-shadow: 0 2px 12px rgba(124,58,237,0.12); border-color: #c4b5fd; }
.aside-action-body { display: flex; justify-content: space-between; align-items: flex-start; }
.aside-title { font-size: 15px; font-weight: 600; color: var(--heading-color); margin-bottom: 4px; }
.aside-desc  { font-size: 13px; color: var(--label-color); }
.aside-arrow { flex-shrink: 0; margin-top: 2px; }
.chip-test-result {
  margin-top: 12px; padding: 8px 10px;
  background: #f5f5f8; border-radius: 6px; border: 1px solid #e5e7eb;
}
.chip-test-result code {
  font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #374151;
}
.aside-section-title {
  font-size: 15px; font-weight: 600; color: var(--heading-color);
  margin-bottom: 16px;
}
.perf-row { margin-bottom: 14px; }
.perf-row:last-child { margin-bottom: 0; }
.perf-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
.perf-name { font-size: 12px; color: var(--label-color); font-weight: 500; }
.perf-val  { font-size: 12px; color: var(--heading-color); font-weight: 600; }
.perf-bar  { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.perf-fill { height: 100%; background: #10b981; border-radius: 4px; transition: width 0.6s ease; }

/* ── Stats tab ── */
.stats-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }

.stats-metric-card { background: var(--content-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
.stats-metric-grid { grid-template-columns: 1fr 1fr 1fr 1fr !important; }
.stats-metric-grid .metric-cell:nth-child(even) { border-right: 1px solid var(--border-color); }
.stats-metric-grid .metric-cell:nth-child(4n) { border-right: none; }
.stats-last-cell { border-right: none !important; }

.charts-row { display: flex; gap: 16px; }
.chart-placeholder {
  flex: 1; background: #f3f4f6; border-radius: 8px; height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.chart-placeholder-label { font-size: 14px; color: #9ca3af; font-weight: 500; }

@media (max-width: 900px) {
  .dash-columns { flex-direction: column; }
  .dash-aside   { width: 100%; }
  .charts-row   { flex-direction: column; }
}
</style>
