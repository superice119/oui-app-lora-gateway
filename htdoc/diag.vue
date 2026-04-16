<template>
  <div class="page-wrap">
    <div class="page-title">Diagnostics</div>

    <!-- Tab bar with auto-refresh control -->
    <div class="tab-bar-wrap">
      <div class="tab-bar">
        <span class="tab" :class="{active: tab==='log'}" @click="tab='log'">System log</span>
        <span class="tab" :class="{active: tab==='net'}" @click="tab='net'">Network utilities</span>
      </div>
      <div v-if="tab==='log'" class="auto-refresh-ctrl">
        <el-switch v-model="autoRefresh" style="--el-switch-on-color: #7c3aed" />
        <span>Auto refresh</span>
      </div>
    </div>

    <!-- System log tab -->
    <div v-if="tab === 'log'" class="card">
      <div class="log-output">
        <div v-for="(line, i) in logLines" :key="i" :style="colorLine(line)">{{ line }}</div>
      </div>
    </div>

    <!-- Network utilities tab -->
    <div v-if="tab === 'net'" class="card">
      <div class="form-row">
        <div class="form-label">Tools</div>
        <div class="form-content">
          <div class="net-header">
            <span class="net-field-label">
              IPv4 Address / Hostname
              <el-tooltip content="Enter an IPv4 address or hostname to run diagnostics." placement="top">
                <span class="info-icon">ⓘ</span>
              </el-tooltip>
            </span>
          </div>
          <input
            v-model="netHost"
            class="net-input"
            placeholder="e.g. 8.8.8.8 or google.com"
          />
          <div class="net-btns">
            <button class="pill-btn" @click="runTool('ping')">Ping</button>
            <button class="pill-btn" @click="runTool('trace')">Trace</button>
            <button class="pill-btn" @click="runTool('nslookup')">Nslookup</button>
          </div>
          <pre class="net-output">{{ netOutput }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { ElSwitch, ElTooltip } from 'element-plus'

const { proxy } = getCurrentInstance()

const tab         = ref('log')
const autoRefresh = ref(false)
const logText     = ref('')
const netHost     = ref('')
const netOutput   = ref('Add IPv4 or a hostname to see results here.')

let logTimer = null

const logLines = computed(() => logText.value ? logText.value.split('\n') : [])

function colorLine(line) {
  if (line.includes('user.err'))    return 'color:#f87171'
  if (line.includes('user.warn'))   return 'color:#fbbf24'
  if (line.includes('user.notice')) return 'color:#e2e8f0'
  if (line.includes('user.info'))   return 'color:#94a3b8'
  return 'color:#d4d4d4'
}

async function fetchLog() {
  try {
    const r = await proxy.$oui.call('system', 'get_log', { lines: 50 })
    if (r?.lines) logText.value = r.lines
  } catch (e) {
    logText.value = 'Error fetching log: ' + e.message
  }
}

async function runTool(tool) {
  if (!netHost.value.trim()) {
    netOutput.value = 'Error: no host specified'
    return
  }
  netOutput.value = 'Running ' + tool + '…'
  try {
    const r = await proxy.$oui.call('system', 'net_tool', { tool, host: netHost.value.trim() })
    netOutput.value = r?.output || 'No output'
  } catch (e) {
    netOutput.value = 'Error: ' + e.message
  }
}

function startTimer() {
  if (logTimer) clearInterval(logTimer)
  logTimer = setInterval(fetchLog, 3000)
}
function stopTimer() {
  if (logTimer) { clearInterval(logTimer); logTimer = null }
}

watch(autoRefresh, (val) => {
  if (val) startTimer()
  else stopTimer()
})

onMounted(() => fetchLog())
onUnmounted(() => stopTimer())
</script>

<style scoped>
.page-wrap  { padding: 32px; max-width: 1100px; }
.page-title { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 24px; }
.tab-bar-wrap {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;
}
.tab-bar    { display: flex; }
.tab        { padding: 10px 20px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab.active { color: #111827; font-weight: 700; border-bottom-color: #111827; }
.auto-refresh-ctrl { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280; padding-bottom: 1px; }
.card       { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 16px; }
.form-row   { display: flex; align-items: flex-start; padding: 16px 0; }
.form-label { width: 240px; min-width: 240px; color: #6b7280; font-size: 14px; padding-right: 24px; padding-top: 4px; }
.form-content { flex: 1; }
.pill-btn   { border: 1px solid #d1d5db; border-radius: 20px; padding: 7px 20px; background: white; cursor: pointer; font-size: 14px; color: #374151; }
.pill-btn:hover { background: #f9fafb; }

.log-output {
  background: #1e1e2e; font-family: monospace; font-size: 12px;
  padding: 16px; border-radius: 6px; min-height: 400px; overflow-y: auto;
  word-break: break-all;
}
.log-output > div { line-height: 1.6; white-space: pre-wrap; }

.net-header       { margin-bottom: 8px; }
.net-field-label  { font-size: 14px; color: #374151; font-weight: 500; }
.info-icon        { color: #9ca3af; cursor: default; margin-left: 4px; font-size: 13px; }
.net-input {
  width: 300px; height: 36px; padding: 0 12px; border: 1px solid #e5e7eb;
  border-radius: 6px; font-size: 14px; outline: none; display: block; margin-bottom: 12px;
}
.net-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.net-btns  { display: flex; gap: 8px; margin-bottom: 16px; }
.net-output {
  background: #f3f4f6; border-radius: 6px; min-height: 200px; padding: 16px;
  font-family: monospace; font-size: 13px; color: #374151;
  white-space: pre-wrap; word-break: break-all; margin: 0;
}
</style>
