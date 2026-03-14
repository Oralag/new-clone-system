<template>
  <AgentPageLayout
    agent-id="video"
    agent-name="视频Agent"
    agent-emoji="🎬"
    agent-specialty="短视频脚本 · 分镜设计 · 口播文案"
    agent-color="#0071e3"
    :quick-prompts="quickPrompts"
    :streaming="streaming"
    @quick-prompt="onQuickPrompt"
    ref="layoutRef"
  >
    <AgentChat
      agent-id="video"
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
  '写一个15秒抖音短视频脚本',
  '帮我设计一个产品开箱视频的分镜',
  '写一段60秒口播文案介绍新品',
  '给我一个能在前3秒留住观众的开头',
  '我需要一个3分钟品牌故事视频脚本',
  '写一段适合小红书图文的配音文案',
  '帮我写一个对比测评视频的脚本',
]

function onQuickPrompt(p: string) {
  chatRef.value?.sendQuickPrompt(p)
}
</script>

<style scoped>
:deep(.agent-chat-wrap) { height: 100%; border-radius: 18px; }
</style>
