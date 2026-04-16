<template>
  <div class="page-wrap">
    <div class="page-title">System Settings</div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <div :class="['tab', { active: tab === 'general'  }]" @click="tab = 'general'">General settings</div>
      <div :class="['tab', { active: tab === 'backup'   }]" @click="tab = 'backup'">Backup and restore</div>
      <div :class="['tab', { active: tab === 'firmware' }]" @click="tab = 'firmware'">Firmware</div>
      <div :class="['tab', { active: tab === 'files'    }]" @click="tab = 'files'">File browser</div>
    </div>

    <!-- ── General settings ── -->
    <template v-if="tab === 'general'">
      <div class="card">
        <div class="form-row">
          <div class="form-label">Hostname</div>
          <div class="form-content">
            <el-input v-model="general.hostname" style="width:300px" placeholder="oolite-v8" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-label">Timezone</div>
          <div class="form-content">
            <el-select v-model="general.timezone" style="width:300px">
              <el-option v-for="tz in timezones" :key="tz.value" :label="tz.label" :value="tz.value"/>
            </el-select>
          </div>
        </div>
        <div class="form-row no-border">
          <div class="form-label">NTP Server</div>
          <div class="form-content">
            <el-input v-model="general.ntp" style="width:300px" placeholder="pool.ntp.org" />
          </div>
        </div>
      </div>
      <div class="sticky-footer">
        <el-button type="primary" @click="saveGeneral" :loading="saving">Save</el-button>
      </div>
    </template>

    <!-- ── Backup and restore ── -->
    <template v-if="tab === 'backup'">
      <div class="card">
        <div class="card-inner">
          <div class="section-title">Backup configuration</div>
          <p class="section-desc">Download a backup of your current gateway configuration as a tar.gz archive.</p>
          <button class="pill-btn">Download backup</button>
        </div>
      </div>
      <div class="card">
        <div class="card-inner">
          <div class="section-title">Restore configuration</div>
          <p class="section-desc">Upload a previously downloaded backup file to restore the configuration.</p>
          <div class="drop-zone">
            <el-icon :size="28" color="#7c3aed"><Upload /></el-icon>
            <p>Drag &amp; drop your backup file here or <span class="purple-link">browse</span></p>
          </div>
          <div style="margin-top: 16px;">
            <button class="pill-btn primary">Restore</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Firmware ── -->
    <template v-if="tab === 'firmware'">
      <div class="card">
        <div class="form-row">
          <div class="form-label">Firmware</div>
          <div class="form-content">
            <div class="fw-current">
              <span class="form-sublabel">Current version</span>
              <span class="fw-version">{{ firmwareVersion }}</span>
            </div>
            <span class="form-sublabel" style="margin-top: 20px; display: block;">Upload the new firmware file</span>
            <div class="drop-zone" @click="$refs.fileInput.click()"
                 @dragover.prevent @drop.prevent="handleDrop">
              <div v-if="!firmwareFile">
                <el-icon :size="32" color="#7c3aed"><UploadFilled /></el-icon>
                <p style="margin:8px 0 4px">Drop your firmware file here or
                  <span class="choose-link">choose file</span></p>
                <p style="font-size:12px;color:#9ca3af">Accepts .bin files</p>
              </div>
              <div v-else class="file-chosen">
                <el-icon color="#16a34a"><CircleCheck /></el-icon>
                {{ firmwareFile.name }}
              </div>
              <input ref="fileInput" type="file" accept=".bin" style="display:none" @change="handleFileChange"/>
            </div>
            <div style="margin-top: 16px;">
              <el-checkbox v-model="keepSettings">Keep settings after updating</el-checkbox>
            </div>
            <div style="margin-top: 16px;">
              <button class="pill-btn" :disabled="!firmwareFile" :style="!firmwareFile ? 'opacity:0.5;cursor:not-allowed' : ''">Update</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ── File browser ── -->
    <template v-if="tab === 'files'">
      <div class="card">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <span
            v-for="(seg, i) in pathSegs"
            :key="i"
          >
            <span
              class="breadcrumb-link"
              :class="{ last: i === pathSegs.length - 1 }"
              @click="navigateTo(i)"
            >{{ seg || '/' }}</span>
            <span v-if="i < pathSegs.length - 1" class="breadcrumb-sep">&gt;</span>
          </span>
        </div>

        <!-- File list -->
        <div class="file-list">
          <div
            v-for="entry in fileEntries"
            :key="entry.name"
            class="file-row"
            :class="{ clickable: entry.type === 'dir' }"
            @click="entry.type === 'dir' && navigateInto(entry.name)"
          >
            <el-icon :size="18" :color="entry.type === 'dir' ? '#7c3aed' : '#9ca3af'">
              <component :is="entry.type === 'dir' ? Folder : Document" />
            </el-icon>
            <span class="file-name">{{ entry.name }}</span>
            <el-icon v-if="entry.type === 'dir'" :size="14" color="#9ca3af"><ArrowRight /></el-icon>
          </div>
          <div v-if="fileEntries.length === 0" class="file-empty">No entries found.</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, ElCheckbox, ElSelect, ElOption, ElInput, ElButton } from 'element-plus'
import { Upload, Folder, Document, ArrowRight, UploadFilled, CircleCheck } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

const tab = ref('general')

// General settings
const general = reactive({ hostname: 'oolite-v8', timezone: 'Asia/Shanghai', ntp: 'pool.ntp.org' })
const saving = ref(false)
const timezones = [
  { value: 'UTC',            label: 'UTC' },
  { value: 'Asia/Shanghai',  label: 'Asia/Shanghai (CST, UTC+8)' },
  { value: 'Europe/London',  label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin',  label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York',  label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo',     label: 'Asia/Tokyo (JST, UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT)' },
]

async function saveGeneral() {
  saving.value = true
  try {
    await proxy.$oui.call('system', 'set_general', { ...general })
    ElMessage({ message: 'Settings saved', type: 'success', duration: 2000 })
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

// Firmware
const firmwareVersion = ref('ImmortalWrt_1.0.0_Oolite-V8')
const keepSettings    = ref(true)
const firmwareFile    = ref(null)

function handleDrop(e) {
  const f = e.dataTransfer.files[0]
  if (f) firmwareFile.value = f
}
function handleFileChange(e) {
  const f = e.target.files[0]
  if (f) firmwareFile.value = f
}

// File browser
const currentPath = ref('/')
const fileEntries = ref([])

const pathSegs = computed(() => {
  if (currentPath.value === '/') return ['/']
  return ['/', ...currentPath.value.replace(/^\//, '').split('/')]
})

function navigateTo(idx) {
  if (idx === 0) { currentPath.value = '/'; fetchFiles(); return }
  const parts = currentPath.value.replace(/^\//, '').split('/')
  currentPath.value = '/' + parts.slice(0, idx).join('/')
  fetchFiles()
}

function navigateInto(name) {
  currentPath.value = currentPath.value === '/' ? '/' + name : currentPath.value + '/' + name
  fetchFiles()
}

async function fetchFiles() {
  try {
    const r = await proxy.$oui.call('system', 'file_list', { path: currentPath.value })
    fileEntries.value = r?.entries || []
  } catch {
    fileEntries.value = []
  }
}

async function loadGeneral() {
  try {
    const r = await proxy.$oui.call('system', 'get_general', {})
    if (r) Object.assign(general, r)
  } catch {}
}

async function loadFirmware() {
  try {
    const r = await proxy.$oui.call('system', 'get_firmware', {})
    if (r?.version) firmwareVersion.value = r.version
  } catch {}
}

onMounted(() => { loadGeneral(); loadFirmware(); fetchFiles() })
</script>

<style scoped>
.page-wrap  { padding: 32px; max-width: 1100px; }
.page-title { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 24px; }
.tab-bar    { display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
.tab        { padding: 10px 20px; font-size: 14px; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab.active { color: #111827; font-weight: 700; border-bottom-color: #111827; }
.card       { background: #fff; border-radius: 8px; padding: 0 24px; margin-bottom: 16px; }
.form-row   { display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.form-row.no-border { border-bottom: none; }
.form-label { width: 240px; min-width: 240px; color: #6b7280; font-size: 14px; padding-right: 24px; padding-top: 6px; }
.form-content { flex: 1; padding-top: 2px; }
.pill-btn   { border: 1px solid #d1d5db; border-radius: 20px; padding: 7px 20px; background: white; cursor: pointer; font-size: 14px; color: #374151; }
.pill-btn:hover:not(:disabled) { background: #f9fafb; }
.pill-btn.primary { background: #7c3aed; color: white; border-color: #7c3aed; }
.pill-btn.primary:hover:not(:disabled) { background: #6d28d9; }

.rak-input {
  width: 300px; height: 36px; padding: 0 12px;
  border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; outline: none;
}
.rak-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.rak-select {
  width: 300px; height: 36px; padding: 0 12px;
  border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; outline: none;
  background: white; cursor: pointer;
}
.rak-select:focus { border-color: #7c3aed; }

.section-title { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px; padding-top: 20px; }
.section-desc  { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
.drop-zone {
  border: 1.5px dashed #7c3aed; background: #faf5ff; border-radius: 8px;
  min-height: 120px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; text-align: center; padding: 24px; margin: 12px 0;
  transition: background 0.15s;
}
.drop-zone:hover { background: #f3e8ff; }
.drop-zone p { font-size: 14px; color: #6b7280; margin: 0; }
.choose-link { color: #7c3aed; text-decoration: underline; }
.file-chosen { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; }
.purple-link { color: #7c3aed; text-decoration: underline; cursor: pointer; }

.card-inner { padding: 20px 0; }
.form-sublabel { font-size: 12px; color: #9ca3af; }
.fw-version   { font-size: 15px; font-weight: 700; color: #111827; }
.fw-drop-zone {
  border: 1.5px dashed #7c3aed; background: #f5f0fe; border-radius: 8px;
  min-height: 100px; text-align: center; padding: 32px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  margin-top: 8px;
}
.fw-drop-zone p  { font-size: 14px; color: #6b7280; margin: 0; }
.fw-file-name    { font-size: 13px; color: #7c3aed; font-weight: 600; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; font-size: 14px; }
.breadcrumb-link { color: #7c3aed; cursor: pointer; }
.breadcrumb-link:hover { text-decoration: underline; }
.breadcrumb-link.last { color: #111827; font-weight: 600; cursor: default; }
.breadcrumb-link.last:hover { text-decoration: none; }
.breadcrumb-sep { color: #9ca3af; margin: 0 2px; }

/* File list */
.file-list { display: flex; flex-direction: column; gap: 2px; }
.file-row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 6px; font-size: 14px; color: #374151;
}
.file-row.clickable { cursor: pointer; }
.file-row.clickable:hover { background: #f5f0fe; }
.file-name { flex: 1; }
.file-empty { font-size: 14px; color: #9ca3af; padding: 16px 0; }

/* Sticky footer */
.sticky-footer {
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e5e7eb;
  padding: 16px 32px; display: flex; justify-content: flex-end;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
}
</style>
