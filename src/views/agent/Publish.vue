<template>
  <div class="agent-page">
    <AgentChat
      agent-id="publisher"
      :quick-prompts="quickPrompts"
    />
  </div>
</template>

<script setup lang="ts">
import AgentChat from '@/components/agent/AgentChat.vue'

const quickPrompts = [
  '帮我制定本月的内容发布计划',
  '小红书和抖音的最佳发布时间是什么时候？',
  '同一内容如何适配不同平台发布？',
  '帮我排一个下周的内容日历',
  '618大促期间应该如何安排发布节奏？',
]
</script>

<style scoped>
.agent-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
</style>
