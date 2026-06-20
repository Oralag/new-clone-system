<template>
  <div class="trending-dept">

    <DeptEmployeeCard
      name="Rex"
      :role="t('agentTrending.role')"
      emoji="📈"
      :desc="t('agentTrending.desc')"
      color="#06b6d4"
      illustId="intel"
      :busy="loading"
      :stats="[
        { value: trendingCount, label: t('agentTrending.kpiTrending') },
        { value: trendingStore.selectedTopics.length, label: t('agentTrending.kpiSelected') },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#06b6d4"></span>{{ t('agentTrending.todayGoal') }}</div>
          <textarea v-model="todayGoal" class="goal-input" :placeholder="t('agentTrending.goalPlaceholder')" rows="3" @blur="saveGoal"/>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#6366f1"></span>{{ t('agentTrending.quickPrompts') }}</div>
          <div class="quick-list">
            <button v-for="q in quickPrompts" :key="q.text" class="quick-item" @click="chatRef?.sendQuickPrompt(q.text)">
              <span class="quick-emoji">{{ q.emoji }}</span>
              <span class="quick-text">{{ q.text }}</span>
            </button>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#10b981"></span>{{ t('agentTrending.platformMonitor') }}</div>
          <div class="status-list">
            <div v-for="p in platforms" :key="p.key" class="status-row">
              <span class="status-label">{{ p.name }}</span>
              <span class="status-badge" :class="trendingStore.trending[p.key]?.length ? 'green' : 'gray'">
                {{ trendingStore.trending[p.key]?.length || 0 }} {{ t('common.items') }}
              </span>
            </div>
          </div>
          <button class="fetch-btn" :class="{ loading }" @click="fetchAll" style="margin-top:12px">
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 6.5a4.5 4.5 0 11-1.3-3.2"/><path d="M9.7 1v2.5H7.2"/></svg>
            {{ loading ? t('agentTrending.fetching') : t('agentTrending.fetchHot') }}
          </button>
        </div>
      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#06b6d4' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">📈</span>
            <div>
              <div class="chat-agent-name">Rex · {{ t('agentTrending.role') }}</div>
              <div class="chat-agent-sub">{{ t('agentLayout.trendingDept') }} · {{ t('agentTrending.desc') }}</div>
            </div>
          </div>
        </div>
        <AgentChat agent-id="trend" ref="chatRef" @streaming-change="streaming = $event" />
      </section>

      <!-- 右侧：热搜产出 -->
      <aside class="right-panel">
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#06b6d4"></span>
            {{ t('agentTrending.previewTitle') }}
            <div class="platform-mini-tabs">
              <button v-for="p in platforms" :key="p.key" class="mini-tab" :class="{ active: activePlatform === p.key }" @click="activePlatform = p.key">{{ p.name }}</button>
            </div>
          </div>
          <div v-if="currentList.length === 0" class="output-empty">{{ t('agentTrending.noData') }}</div>
          <div v-else class="trending-list">
            <div v-if="currentList[0]?.isMock" class="mock-notice">{{ t('agentTrending.mockNotice') }}</div>
            <div v-for="(item, i) in currentList.slice(0, 8)" :key="i" class="trending-item" :class="{ 'is-mock': item.isMock }" @click="addTopic(item.title)">
              <span class="t-rank" :class="i < 3 ? 'hot' : ''">{{ i + 1 }}</span>
              <span class="t-title">{{ item.title }}</span>
              <span class="t-heat">{{ item.heat }}</span>
            </div>
          </div>
        </div>

        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd"><span class="panel-dot" style="background:#f59e0b"></span>{{ t('agentTrending.selectedTitle') }} <span class="panel-count">{{ trendingStore.selectedTopics.length }}</span></div>
          <div v-if="trendingStore.selectedTopics.length === 0" class="output-empty">{{ t('agentTrending.selectedEmpty') }}</div>
          <div v-else class="topic-list">
            <div v-for="(t, i) in trendingStore.selectedTopics" :key="i" class="topic-item">
              <span class="topic-text">{{ t }}</span>
              <button class="topic-del" @click="removeTopic(i)">×</button>
            </div>
          </div>
          <button
            v-if="trendingStore.selectedTopics.length > 0"
            class="send-next-btn"
            @click="sendToContent"
            :class="{ sent: sentToContent }"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
              <path d="M2 5.5h7M6 3l3 2.5L6 8"/>
            </svg>
            {{ sentToContent ? t('agentTrending.sentDone') : t('agentTrending.sent') }}
          </button>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import { useTrendingStore } from '@/stores/agent'
import { usePipelineStore } from '@/stores/pipeline'
import { ElMessage } from 'element-plus'

const trendingStore = useTrendingStore()
const pipelineStore = usePipelineStore()
const { t } = useI18n()
const sentToContent = ref(false)
const chatRef = ref<InstanceType<typeof AgentChat>>()
const streaming = ref(false)
const loading = ref(false)
const activePlatform = ref('douyin')

const platforms = [
  { key: 'douyin', name: t('agentTrending.platformDouyin') },
  { key: 'xiaohongshu', name: t('agentTrending.platformXhs') },
  { key: 'weibo', name: t('agentTrending.platformWeibo') },
  { key: 'bilibili', name: t('agentTrending.platformBilibili') },
]

const trendingCount = computed(() => Object.values(trendingStore.trending).reduce((s: number, a: any[]) => s + a.length, 0))
const currentList = computed(() => trendingStore.trending[activePlatform.value] || [])

const todayGoal = ref(localStorage.getItem('intel_dept_goal') || '')
function saveGoal() { localStorage.setItem('intel_dept_goal', todayGoal.value) }

const quickPrompts = [
  { emoji: '🔥', text: t('agentTrending.prompt1') },
  { emoji: '📊', text: t('agentTrending.prompt2') },
  { emoji: '🎯', text: t('agentTrending.prompt3') },
  { emoji: '💡', text: t('agentTrending.prompt4') },
]

async function fetchAll() {
  loading.value = true
  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/trending', { headers: { 'x-erp-token': token } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json() as any
    if (data.trending) trendingStore.setTrending(data.trending)
    ElMessage.success(t('agentTrending.fetchSuccess'))
  } catch (e: any) {
    ElMessage.error(t('agentTrending.fetchFailed') + e.message)
  } finally {
    loading.value = false
  }
}

function addTopic(title: string) {
  const topics = [...trendingStore.selectedTopics]
  if (!topics.includes(title)) {
    topics.push(title)
    trendingStore.setSelectedTopics(topics)
    ElMessage.success(t('agentTrending.added'))
  }
}

function removeTopic(i: number) {
  const topics = [...trendingStore.selectedTopics]
  topics.splice(i, 1)
  trendingStore.setSelectedTopics(topics)
}

function sendToContent() {
  const topics = trendingStore.selectedTopics
  if (topics.length === 0) return
  const title = topics[0].slice(0, 20) + (topics.length > 1 ? ` ${t('agentTrending.topicsTitle', { count: topics.length })}` : '')
  const existing = pipelineStore.tasks.find(t => t.title === title)
  if (existing) {
    pipelineStore.recordOutput(existing.id, 'intel', topics.join('、'))
    ElMessage.success(t('agentTrending.updated'))
  } else {
    pipelineStore.createTask(title)
    const task = pipelineStore.tasks[0]
    pipelineStore.recordOutput(task.id, 'intel', topics.join('、'))
    pipelineStore.advanceStage(task.id)
  }
  sentToContent.value = true
  ElMessage.success(t('agentTrending.sentToast'))
  setTimeout(() => { sentToContent.value = false }, 3000)
}
</script>

<style scoped>
.trending-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1400px; }

.three-col { display: grid; grid-template-columns: 220px 1fr 220px; gap: 14px; align-items: start; }

.panel-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
.panel-hd { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; flex-wrap: wrap; }
.panel-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.panel-count { margin-left: auto; background: #F0F0EE; color: #666; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px; }

.left-panel { display: flex; flex-direction: column; gap: 10px; }
.goal-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #333; background: #F8F8F6; resize: none; outline: none; font-family: inherit; line-height: 1.5; box-sizing: border-box; }
.goal-input:focus { border-color: #06b6d4; }
.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border-radius: 8px; background: #F8F8F6; border: 1px solid transparent; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s; }
.quick-item:hover { background: rgba(6,182,212,0.06); border-color: rgba(6,182,212,0.2); }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: #555; line-height: 1.4; }
.status-list { display: flex; flex-direction: column; gap: 7px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 12px; color: #555; }
.status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.status-badge.green { background: rgba(52,211,153,0.1); color: #059669; }
.status-badge.gray  { background: #F0F0EE; color: #AAAAAA; }
.fetch-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 9px; border-radius: 10px; border: 1px solid #E8E8E8; background: #F8F8F6; color: #555; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.fetch-btn:hover:not(.loading) { background: #06b6d4; color: #fff; border-color: #06b6d4; }
.fetch-btn.loading { opacity: 0.6; cursor: not-allowed; }

.chat-panel { background: #fff; border: 1px solid #E8E8E8; border-left: 3px solid var(--ac,#06b6d4); border-radius: 14px; padding: 16px 16px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-shrink: 0; }
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 24px; }
.chat-agent-name { font-size: 14px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.02em; }
.chat-agent-sub { font-size: 11px; color: #AAAAAA; margin-top: 1px; }
.chat-panel :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }

.right-panel { display: flex; flex-direction: column; gap: 0; }
.output-empty { padding: 14px 0; text-align: center; font-size: 12px; color: #CCCCCC; font-style: italic; }

.platform-mini-tabs { display: flex; gap: 3px; margin-left: auto; }
.mini-tab { padding: 2px 7px; border-radius: 6px; border: 1px solid #E8E8E8; background: #F8F8F6; font-size: 10px; font-weight: 600; color: #AAAAAA; cursor: pointer; font-family: inherit; transition: all 0.12s; }
.mini-tab.active { background: #06b6d4; color: #fff; border-color: #06b6d4; }

.mock-notice { font-size: 10px; color: #d97706; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; padding: 4px 8px; margin-bottom: 4px; text-align: center; }
.trending-item.is-mock .t-title { color: #AAAAAA; }
.trending-list { display: flex; flex-direction: column; gap: 4px; }
.trending-item { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 7px; cursor: pointer; transition: background 0.12s; }
.trending-item:hover { background: rgba(6,182,212,0.06); }
.t-rank { width: 16px; font-size: 11px; font-weight: 800; color: #CCCCCC; text-align: center; flex-shrink: 0; }
.t-rank.hot { color: #ef4444; }
.t-title { flex: 1; font-size: 11px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.t-heat { font-size: 10px; color: #AAAAAA; flex-shrink: 0; }

.topic-list { display: flex; flex-direction: column; gap: 5px; }
.topic-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: rgba(6,182,212,0.06); border-radius: 7px; }
.topic-text { font-size: 12px; color: #0891b2; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.topic-del { background: none; border: none; color: #AAAAAA; cursor: pointer; font-size: 14px; padding: 0 2px; line-height: 1; flex-shrink: 0; }
.topic-del:hover { color: #ef4444; }

.send-next-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; margin-top: 10px; padding: 8px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3);
  border-radius: 8px; font-size: 12px; font-weight: 600; color: #d97706;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.send-next-btn:hover:not(.sent) { background: #f59e0b; color: white; border-color: #f59e0b; }
.send-next-btn.sent { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #059669; cursor: default; }

@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }
</style>
