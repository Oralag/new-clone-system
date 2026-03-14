<template>
  <div class="agent-page">
    <AgentChat
      agent-id="trend"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '最近护肤品赛道有哪些热门话题？',
  '分析一下当前抖音的爆款内容规律',
  '帮我找3个适合蹭热点的选题方向',
  '下个月有哪些营销节点值得关注？',
  '分析我们竞品最近的内容策略',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
