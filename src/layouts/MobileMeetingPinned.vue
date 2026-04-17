<template>
  <div class="m-meeting-pinned" @click="router.push('/agent/meeting')">
    <div class="m-meeting-icon">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round">
        <rect x="2" y="3" width="16" height="11" rx="2.5"/>
        <path d="M7 17h6M10 14v3"/>
        <circle cx="5.5" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
        <circle cx="10" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
        <circle cx="14.5" cy="8.5" r="1.3" fill="#6366f1" opacity=".7"/>
      </svg>
    </div>
    <span class="m-meeting-label">AI会议室</span>
    <span class="m-meeting-desc">多Agent协同</span>
    <svg class="m-meeting-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.m-meeting-pinned {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  margin: 12px 12px 0;
  padding: 12px 14px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.m-meeting-pinned:active {
  background: #f5f5f7;
}
.m-meeting-icon {
  width: 32px;
  height: 32px;
  background: rgba(99,102,241,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.m-meeting-label {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}
.m-meeting-desc {
  flex: 1;
  font-size: 12px;
  color: #86909c;
  margin-left: 4px;
}
.m-meeting-arrow {
  flex-shrink: 0;
}
</style>
