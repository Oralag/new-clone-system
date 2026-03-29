<template>
  <div class="ap-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  agentId: string
  agentName?: string
  agentEmoji?: string
  agentSpecialty?: string
  agentColor?: string
  quickPrompts?: string[]
  streaming?: boolean
}>()

const emit = defineEmits<{
  (e: 'quick-prompt', p: string): void
  (e: 'restore', msg: any): void
}>()

interface HistoryMsg { role: string; content: string }
const history = ref<HistoryMsg[]>([])

async function loadHistory() {
  const token = localStorage.getItem('erp_token') || ''
  if (!token) return
  try {
    const res = await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      headers: { 'x-erp-token': token },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) history.value = data.slice(-20)
    }
  } catch {}
}

async function clearHistory() {
  const token = localStorage.getItem('erp_token') || ''
  try {
    await fetch(`/api/agent-chat?agentId=${props.agentId}`, {
      method: 'DELETE',
      headers: { 'x-erp-token': token },
    })
    history.value = []
  } catch {}
}

onMounted(loadHistory)
defineExpose({ loadHistory })
</script>

<style scoped>
.ap-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0;
}

@media (max-width: 768px) {
  .ap-layout { height: auto; }
}
</style>
