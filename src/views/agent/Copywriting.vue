<template>
  <div class="agent-page">
    <AgentChat
      agent-id="copywriter"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '为我的产品写一篇小红书爆款笔记',
  '写一段抖音开场白，帮我涨粉',
  '给这款护肤品写3个版本的广告文案',
  '写一篇微信朋友圈种草文案',
  '帮我优化这段文案，让它更有感染力',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
