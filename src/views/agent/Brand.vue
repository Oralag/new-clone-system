<template>
  <div class="agent-page">
    <AgentChat
      agent-id="brand"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '帮我定义品牌的核心价值观和调性',
  '分析我们和竞品的差异化定位',
  '我想打造一个高端护肤品品牌，如何定位？',
  '帮我审核这段文案是否符合品牌调性',
  '给我们品牌写一个Slogan',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
