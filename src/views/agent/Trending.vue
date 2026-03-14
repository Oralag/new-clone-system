<template>
  <AgentPageLayout
    agent-id="trend"
    agent-name="趋势Agent"
    agent-emoji="📈"
    agent-specialty="热点分析 · 选题建议 · 竞品洞察"
    agent-color="#f97316"
    :quick-prompts="quickPrompts"
    :streaming="streaming"
    @quick-prompt="onQuickPrompt"
    ref="layoutRef"
  >
    <AgentChat
      agent-id="trend"
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
  '最近护肤品赛道有哪些热门话题？',
  '分析当前抖音爆款内容规律',
  '帮我找3个适合蹭热点的选题方向',
  '下个月有哪些营销节点值得关注？',
  '分析竞品最近的内容策略',
  '抓取微博今日热搜榜单',
  '抖音最近什么类型视频最火？',
]

function onQuickPrompt(p: string) {
  chatRef.value?.sendQuickPrompt(p)
}
</script>

<style scoped>
:deep(.agent-chat-wrap) {
  height: 100%;
  border-radius: 18px;
}
</style>
