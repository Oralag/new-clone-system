<template>
  <div class="trending-dept">

    <DeptEmployeeCard
      name="Rex"
      role="情报专员"
      emoji="📈"
      desc="热点追踪 · 趋势分析 · 选题方向"
      color="#06b6d4"
      illustId="intel"
      :busy="loading"
      :stats="[
        { value: trendingCount, label: '已抓热搜' },
        { value: trendingStore.selectedTopics.length, label: '已选话题' },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#06b6d4"></span>今日目标</div>
          <textarea v-model="todayGoal" class="goal-input" placeholder="今日情报目标..." rows="3" @blur="saveGoal"/>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#6366f1"></span>快捷指令</div>
          <div class="quick-list">
            <button v-for="q in quickPrompts" :key="q.text" class="quick-item" @click="chatRef?.sendQuickPrompt(q.text)">
              <span class="quick-emoji">{{ q.emoji }}</span>
              <span class="quick-text">{{ q.text }}</span>
            </button>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#10b981"></span>平台监控</div>
          <div class="status-list">
            <div v-for="p in platforms" :key="p.key" class="status-row">
              <span class="status-label">{{ p.name }}</span>
              <span class="status-badge" :class="trendingStore.trending[p.key]?.length ? 'green' : 'gray'">
                {{ trendingStore.trending[p.key]?.length || 0 }} 条
              </span>
            </div>
          </div>
          <button class="fetch-btn" :class="{ loading }" @click="fetchAll" style="margin-top:12px">
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 6.5a4.5 4.5 0 11-1.3-3.2"/><path d="M9.7 1v2.5H7.2"/></svg>
            {{ loading ? '抓取中...' : '抓取热搜' }}
          </button>
        </div>
      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#06b6d4' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">📈</span>
            <div>
              <div class="chat-agent-name">Rex · 情报专员</div>
              <div class="chat-agent-sub">情报部 · 热点追踪 & 趋势分析</div>
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
            热搜快览
            <div class="platform-mini-tabs">
              <button v-for="p in platforms" :key="p.key" class="mini-tab" :class="{ active: activePlatform === p.key }" @click="activePlatform = p.key">{{ p.name }}</button>
            </div>
          </div>
          <div v-if="currentList.length === 0" class="output-empty">暂无数据 · 点击抓取</div>
          <div v-else class="trending-list">
            <div v-for="(item, i) in currentList.slice(0, 8)" :key="i" class="trending-item" @click="addTopic(item.title)">
              <span class="t-rank" :class="i < 3 ? 'hot' : ''">{{ i + 1 }}</span>
              <span class="t-title">{{ item.title }}</span>
              <span class="t-heat">{{ item.heat }}</span>
            </div>
          </div>
        </div>

        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd"><span class="panel-dot" style="background:#f59e0b"></span>已选话题 <span class="panel-count">{{ trendingStore.selectedTopics.length }}</span></div>
          <div v-if="trendingStore.selectedTopics.length === 0" class="output-empty">点击热搜条目加入</div>
          <div v-else class="topic-list">
            <div v-for="(t, i) in trendingStore.selectedTopics" :key="i" class="topic-item">
              <span class="topic-text">{{ t }}</span>
              <button class="topic-del" @click="removeTopic(i)">×</button>
            </div>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import { useTrendingStore } from '@/stores/agent'
import { ElMessage } from 'element-plus'

const trendingStore = useTrendingStore()
const chatRef = ref<InstanceType<typeof AgentChat>>()
const streaming = ref(false)
const loading = ref(false)
const activePlatform = ref('douyin')

const platforms = [
  { key: 'douyin', name: '抖音' },
  { key: 'xiaohongshu', name: '小红书' },
  { key: 'weibo', name: '微博' },
  { key: 'bilibili', name: 'B站' },
]

const trendingCount = computed(() => Object.values(trendingStore.trending).reduce((s: number, a: any[]) => s + a.length, 0))
const currentList = computed(() => trendingStore.trending[activePlatform.value] || [])

const todayGoal = ref(localStorage.getItem('intel_dept_goal') || '')
function saveGoal() { localStorage.setItem('intel_dept_goal', todayGoal.value) }

const quickPrompts = [
  { emoji: '🔥', text: '分析当前热搜，找出与品牌相关的话题' },
  { emoji: '📊', text: '帮我找3个适合蹭热点的选题方向' },
  { emoji: '🎯', text: '抖音最近什么类型视频最火？' },
  { emoji: '💡', text: '分析热搜背后的用户情绪和需求' },
]

async function fetchAll() {
  loading.value = true
  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/trending', { headers: { 'x-erp-token': token } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json() as any
    if (data.trending) trendingStore.setTrending(data.trending)
    ElMessage.success('热搜抓取成功')
  } catch (e: any) {
    ElMessage.error('抓取失败：' + e.message)
  } finally {
    loading.value = false
  }
}

function addTopic(title: string) {
  const topics = [...trendingStore.selectedTopics]
  if (!topics.includes(title)) {
    topics.push(title)
    trendingStore.setSelectedTopics(topics)
    ElMessage.success('已加入选题')
  }
}

function removeTopic(i: number) {
  const topics = [...trendingStore.selectedTopics]
  topics.splice(i, 1)
  trendingStore.setSelectedTopics(topics)
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

@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }
</style>
