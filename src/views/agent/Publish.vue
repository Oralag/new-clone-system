<template>
  <AgentPageLayout
    agent-id="publisher"
    agent-name="发布Agent"
    agent-emoji="🚀"
    agent-specialty="发布策略 · 内容日历 · 平台规则"
    agent-color="#34d399"
    :quick-prompts="quickPrompts"
    :streaming="streaming"
    @quick-prompt="onQuickPrompt"
    ref="layoutRef"
  >
    <AgentChat
      agent-id="publisher"
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
  '帮我制定本月的内容发布计划',
  '小红书和抖音最佳发布时间是什么？',
  '同一内容如何适配不同平台发布？',
  '帮我排一个下周的内容日历',
  '618大促期间应该如何安排发布节奏？',
  '帮我规划Q3的内容营销日历',
  '哪些平台话题标签策略最有效？',
]

function onQuickPrompt(p: string) {
  chatRef.value?.sendQuickPrompt(p)
}
</script>

<style scoped>
:deep(.agent-chat-wrap) { height: 100%; border-radius: 18px; }
</style>
