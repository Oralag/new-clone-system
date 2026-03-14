<template>
  <div class="agent-page">
    <AgentChat
      agent-id="poster"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '设计一张护肤品促销海报方案',
  '给我一个新品发布海报的创意方向',
  '生成适合小红书的图片提示词（Midjourney）',
  '帮我设计朋友圈封面图的排版方案',
  '我需要一套618大促的视觉方案',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
