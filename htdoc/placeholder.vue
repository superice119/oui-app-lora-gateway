<template>
  <div class="placeholder-page">
    <div class="ph-icon">
      <el-icon :size="48" color="#d1d5db"><WarningFilled /></el-icon>
    </div>
    <div class="ph-title">{{ pageTitle }}</div>
    <div class="ph-desc">This section is not yet implemented in the local gateway app.</div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute }  from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'Coming Soon')
</script>
<style scoped>
.placeholder-page {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 300px; gap: 16px; padding: 60px 32px;
}
.ph-title { font-size: 18px; font-weight: 600; color: #374151; }
.ph-desc  { font-size: 14px; color: #9ca3af; text-align: center; max-width: 320px; }
</style>
