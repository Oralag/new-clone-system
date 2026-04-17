<template>
  <div class="m-meeting-pinned" @click="router.push('/mobile/meeting')">
    <div class="m-meeting-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
        <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
      </svg>
    </div>
    <span class="m-meeting-label">会议室</span>
    <span v-if="activeCount > 0" class="m-meeting-badge">{{ activeCount }}场进行中</span>
    <svg class="m-meeting-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#86909c" stroke-width="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import http from '@/api/http'

const router = useRouter()
const activeCount = ref(0)

async function loadActiveCount() {
  try {
    const res = await http.get('/meeting/recent', { params: { list_rows: 10 } })
    const meetings = res?.data?.rows ?? res?.rows ?? []
    activeCount.value = meetings.filter((m: any) => m.status === 'active').length
  } catch { /* 忽略 */ }
}

onMounted(() => {
  loadActiveCount()
})
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
  background: rgba(0,113,227,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.m-meeting-label {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}
.m-meeting-badge {
  font-size: 12px;
  color: #00b42a;
  background: rgba(0,180,42,0.1);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}
.m-meeting-arrow {
  flex-shrink: 0;
}
</style>
