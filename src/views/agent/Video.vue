<template>
  <div class="agent-page">
    <AgentChat
      agent-id="video"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '写一个15秒抖音短视频脚本',
  '帮我设计一个产品开箱视频的分镜',
  '写一段60秒口播文案，介绍我们的新品',
  '给我一个能在前3秒留住观众的视频开头',
  '我需要一个3分钟的品牌故事视频脚本',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
