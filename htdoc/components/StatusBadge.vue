<template>
  <span class="status-badge" :class="statusClass">
    <span class="dot" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  running: { type: Boolean, default: false },
  label:   { type: String, default: '' }
})

const statusClass = computed(() =>
  props.running ? 'badge--running' : 'badge--stopped'
)
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}
.badge--running {
  background: #e8f8ef;
  color: #1a7a47;
}
.badge--stopped {
  background: #fef0f0;
  color: #c0392b;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.badge--running .dot {
  background: #27ae60;
  box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.3);
  animation: pulse 2s infinite;
}
.badge--stopped .dot {
  background: #e74c3c;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(39, 174, 96, 0.3); }
  50%       { box-shadow: 0 0 0 5px rgba(39, 174, 96, 0.1); }
}
</style>
