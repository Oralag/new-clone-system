<template>
  <div class="trending-dept">

    <DeptBulletin dept-id="trending" />

    <!-- 员工卡 -->
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

    <!-- ── 中部：情报专员指挥台 + 今日数据 ── -->
    <div class="mid-grid">
      <section class="command-section" :style="{ '--ac': '#06b6d4' }">
        <div class="command-header">
          <div class="command-title-group">
            <span class="agent-label">📈 情报部</span>
            <p class="command-desc">热点追踪 · 趋势分析 · 选题方向</p>
          </div>
          <div class="command-chips">
            <button v-for="p in quickPrompts" :key="p" class="chip-btn" @click="chatRef?.sendQuickPrompt(p)">{{ p }}</button>
          </div>
        </div>
        <AgentChat
          agent-id="trend"
          @streaming-change="streaming = $event"
          ref="chatRef"
        />
      </section>

      <aside class="stats-aside">
        <div class="stats-aside-title">今日数据</div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 13L5.5 8.5L9 12L16 4"/><path d="M13 4h3v3"/></svg></div>
            <div class="stat-card-value">{{ trendingCount }}</div>
            <div class="stat-card-label">已抓热搜</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon icon-topic"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 7l3 3 6-6"/><path d="M2 14l3 3 6-6"/></svg></div>
            <div class="stat-card-value">{{ trendingStore.selectedTopics.length }}</div>
            <div class="stat-card-label">已选话题</div>
          </div>
        </div>
        <button class="btn-fetch" :class="{ loading: loading }" @click="fetchAll" style="margin-top:12px;width:100%">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M11 6.5a4.5 4.5 0 11-1.3-3.2"/><path d="M9.7 1v2.5H7.2"/>
          </svg>
          {{ loading ? '抓取中...' : '抓取热搜' }}
        </button>
      </aside>
    </div>

    <!-- ── 热搜看板 ── -->
    <div class="trending-panel">
      <!-- 平台切换 -->
      <div class="platform-tabs">
        <button
          v-for="p in platforms"
          :key="p.key"
          class="platform-tab"
          :class="{ active: activePlatform === p.key }"
          @click="activePlatform = p.key"
        >
          {{ p.name }}
          <span v-if="trendingStore.trending[p.key]?.length" class="tab-count">
            {{ trendingStore.trending[p.key].length }}
          </span>
        </button>
      </div>

      <!-- 热搜列表 -->
      <div class="trending-board">
        <div v-if="loading" class="board-loading">
          <div class="loading-dots"><span></span><span></span><span></span></div>
          <span>正在抓取 {{ currentPlatformName }} 热搜...</span>
        </div>
        <div v-else-if="currentList.length === 0" class="board-empty">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:.3">
            <path d="M4 24L10 16L16 20L24 8"/><path d="M20 8h4v4"/>
          </svg>
          <div>暂无数据，点击「抓取热搜」获取</div>
        </div>
        <div v-else class="trending-list">
          <div v-for="(item, i) in currentList" :key="i" class="trending-row" :class="{ hot: i < 3 }">
            <span class="rank" :class="{ 'rank-hot': i < 3 }">{{ i + 1 }}</span>
            <div class="trending-info">
              <span class="trending-title">{{ item.title }}</span>
              <span v-if="item.category" class="trending-cate">{{ item.category }}</span>
            </div>
            <span v-if="item.heat || item.hot" class="trending-heat">{{ item.heat || item.hot }}</span>
            <button class="btn-use" @click="useAsTopic(item.title)">用此选题</button>
          </div>
        </div>
      </div>

      <!-- 已选话题 -->
      <div v-if="trendingStore.selectedTopics.length" class="selected-topics">
        <div class="selected-label">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 7l3 3 6-6"/></svg>
          已选话题（{{ trendingStore.selectedTopics.length }}）
        </div>
        <div class="topic-chips">
          <span v-for="(t, i) in trendingStore.selectedTopics" :key="i" class="topic-chip">
            {{ t }}
            <span class="chip-del" @click="removeTopic(i)">×</span>
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptBulletin from '@/components/agent/DeptBulletin.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import { useTrendingStore } from '@/stores/agent'
import { ElMessage } from 'element-plus'

const trendingStore = useTrendingStore()

const streaming = ref(false)
const loading = ref(false)
const activePlatform = ref('douyin')
const chatRef = ref<InstanceType<typeof AgentChat>>()

const platforms = [
  { key: 'douyin', name: '抖音' },
  { key: 'xiaohongshu', name: '小红书' },
  { key: 'kuaishou', name: '快手' },
  { key: 'weibo', name: '微博' },
  { key: 'bilibili', name: 'B站' },
]

const currentList = computed(() => trendingStore.trending[activePlatform.value] || [])
const currentPlatformName = computed(() => platforms.find(p => p.key === activePlatform.value)?.name || '')
const trendingCount = computed(() => Object.values(trendingStore.trending).reduce((s: number, a: any[]) => s + a.length, 0))

const quickPrompts = [
  '分析当前热搜，找出与品牌相关的话题',
  '帮我找3个适合蹭热点的选题方向',
  '抖音最近什么类型视频最火？',
]

async function fetchAll() {
  loading.value = true
  try {
    await trendingStore.fetchTrending(activePlatform.value)
    ElMessage.success(`已获取 ${currentPlatformName.value} 热搜`)
  } catch {
    ElMessage.error('抓取失败，请重试')
  } finally {
    loading.value = false
  }
}

function useAsTopic(title: string) {
  const topics = [...trendingStore.selectedTopics]
  if (!topics.includes(title)) {
    topics.push(title)
    trendingStore.setSelectedTopics(topics)
    ElMessage.success('已加入选题列表')
  } else {
    ElMessage.info('该话题已在列表中')
  }
}

function removeTopic(index: number) {
  const topics = [...trendingStore.selectedTopics]
  topics.splice(index, 1)
  trendingStore.setSelectedTopics(topics)
}
</script>

<style scoped>
.trending-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1200px; }

/* mid-grid 同 Dashboard Captain */
.mid-grid { display: grid; grid-template-columns: 1fr 240px; gap: 14px; }
.command-section {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #06b6d4); border-radius: 14px;
  padding: 18px 18px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden;
}
.command-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.agent-label { display: block; font-size: 13px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; margin-bottom: 3px; }
.command-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; }
.command-chips { display: flex; gap: 5px; flex-wrap: wrap; align-items: flex-start; }
.chip-btn { background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: rgba(29,29,31,0.6); cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s; }
.chip-btn:hover { border-color: var(--ac); color: var(--ac); background: color-mix(in srgb, var(--ac) 6%, white); }
.command-section :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }

.stats-aside { background: #ffffff; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.stats-aside-title { font-size: 12px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px; }
.stats-cards { display: flex; flex-direction: column; gap: 8px; }
.stat-card { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: #f5f5f7; border-radius: 10px; }
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(6,182,212,0.08); display: flex; align-items: center; justify-content: center; color: #06b6d4; flex-shrink: 0; }
.icon-topic { background: rgba(99,102,241,0.08) !important; color: #6366f1 !important; }
.stat-card-value { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); }

.btn-fetch {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);
  background: #f5f5f7; color: rgba(29,29,31,0.7);
  font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.btn-fetch:hover { background: #06b6d4; color: #fff; border-color: #06b6d4; }
.btn-fetch.loading { opacity: 0.6; cursor: not-allowed; }

/* 热搜看板 */
.trending-panel { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 16px; }
.platform-tabs { display: flex; gap: 6px; margin-bottom: 12px; }
.platform-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08); background: #fff;
  font-size: 12px; font-weight: 500; color: rgba(29,29,31,0.5);
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.platform-tab:hover { border-color: #06b6d4; color: #06b6d4; }
.platform-tab.active { background: #06b6d4; border-color: #06b6d4; color: #fff; }
.tab-count { font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 10px; }
.platform-tab:not(.active) .tab-count { background: rgba(0,0,0,0.06); color: rgba(29,29,31,0.4); }

.trending-board { max-height: 400px; overflow-y: auto; }
.board-loading, .board-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 200px; font-size: 13px; color: rgba(29,29,31,0.35); }
.loading-dots { display: flex; gap: 4px; }
.loading-dots span { width: 6px; height: 6px; border-radius: 50%; background: #06b6d4; animation: ldot 1.2s ease-in-out infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ldot { 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }

.trending-list { padding: 4px 0; }
.trending-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; transition: background 0.12s; border-radius: 8px; }
.trending-row:hover { background: #f9f9fb; }
.rank { width: 22px; height: 22px; border-radius: 6px; background: #f5f5f7; font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.35); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rank-hot { background: rgba(239,68,68,0.1); color: #ef4444; }
.trending-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.trending-title { font-size: 13px; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trending-cate { font-size: 10px; color: rgba(29,29,31,0.4); background: #f5f5f7; padding: 2px 7px; border-radius: 10px; flex-shrink: 0; }
.trending-heat { font-size: 11px; color: rgba(29,29,31,0.35); white-space: nowrap; flex-shrink: 0; }
.btn-use { padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(6,182,212,0.2); background: rgba(6,182,212,0.05); color: #06b6d4; font-size: 11px; font-weight: 500; cursor: pointer; flex-shrink: 0; transition: all 0.15s; font-family: inherit; opacity: 0; }
.trending-row:hover .btn-use { opacity: 1; }
.btn-use:hover { background: #06b6d4; color: #fff; }

.selected-topics { background: #f9f9fb; border: 1px solid rgba(0,0,0,0.06); border-radius: 10px; padding: 12px 14px; margin-top: 12px; }
.selected-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4); margin-bottom: 8px; }
.topic-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.topic-chip { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 16px; font-size: 12px; background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.15); color: #06b6d4; }
.chip-del { cursor: pointer; opacity: 0.5; }
.chip-del:hover { opacity: 1; color: #dc2626; }

@media (max-width: 900px) { .mid-grid { grid-template-columns: 1fr; } }
</style>
