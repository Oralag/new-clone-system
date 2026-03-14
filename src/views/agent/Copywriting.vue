<template>
  <AgentPageLayout
    agent-id="copywriter"
    agent-name="文案Agent"
    agent-emoji="✍️"
    agent-specialty="爆款文案 · 多平台适配 · 钩子设计"
    agent-color="#8b5cf6"
    :quick-prompts="quickPrompts"
    :streaming="streaming"
    @quick-prompt="onQuickPrompt"
    ref="layoutRef"
  >
    <AgentChat
      agent-id="copywriter"
      :quick-prompts="[]"
      @streaming-change="streaming = $event"
      @message-sent="layoutRef?.loadHistory()"
      ref="chatRef"
    />
  </AgentPageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AgentPageLayout from '@/components/agent/AgentPageLayout.vue'
import AgentChat from '@/components/agent/AgentChat.vue'

const streaming = ref(false)
const layoutRef = ref<InstanceType<typeof AgentPageLayout>>()
const chatRef = ref<InstanceType<typeof AgentChat>>()

const quickPrompts = [
  '为我的产品写一篇小红书爆款笔记',
  '写一段抖音开场白，帮我涨粉',
  '给护肤品写3个版本的广告文案',
  '写一篇微信朋友圈种草文案',
  '帮我优化这段文案让它更有感染力',
  '写一个618大促的标题钩子',
  '给产品写30字以内的核心卖点',
]

function onQuickPrompt(p: string) {
  chatRef.value?.sendQuickPrompt(p)
}
</script>

<style scoped>
:deep(.agent-chat-wrap) { height: 100%; border-radius: 18px; }
</style>
