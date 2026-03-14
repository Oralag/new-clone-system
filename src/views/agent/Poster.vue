<template>
  <AgentPageLayout
    agent-id="poster"
    agent-name="海报Agent"
    agent-emoji="🎨"
    agent-specialty="视觉方案 · 配色排版 · AI生图提示词"
    agent-color="#ec4899"
    :quick-prompts="quickPrompts"
    :streaming="streaming"
    @quick-prompt="onQuickPrompt"
    ref="layoutRef"
  >
    <AgentChat
      agent-id="poster"
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
  '设计一张护肤品促销海报方案',
  '给我一个新品发布海报的创意方向',
  '生成适合小红书的Midjourney提示词',
  '帮我设计朋友圈封面图的排版方案',
  '我需要一套618大促的视觉方案',
  '设计一张节日限定礼盒的海报',
  '给我一套品牌主视觉的配色方案',
]

function onQuickPrompt(p: string) {
  chatRef.value?.sendQuickPrompt(p)
}
</script>

<style scoped>
:deep(.agent-chat-wrap) { height: 100%; border-radius: 18px; }
</style>
