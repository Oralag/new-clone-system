<template>
  <div class="trending-dept">

    <!-- 部门头部 -->
    <div class="dept-header">
      <div class="dept-header-left">
        <div class="dept-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M1 13L5.5 8.5L9 12L16 4"/><path d="M13 4h3v3"/>
          </svg>
        </div>
        <div>
          <div class="dept-title">情报部</div>
          <div class="dept-sub">热点追踪 · 趋势分析 · 选题方向</div>
        </div>
      </div>
      <div class="dept-header-right">
        <span v-if="brandStore.isConfigured" class="brand-tag">
          <span class="brand-tag-dot"></span>{{ brandStore.brand.name }}
        </span>
        <button class="btn-fetch" :class="{ loading: loading }" @click="fetchAll">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M11 6.5a4.5 4.5 0 11-1.3-3.2"/><path d="M9.7 1v2.5H7.2"/>
          </svg>
          {{ loading ? '抓取中...' : '抓取热搜' }}
        </button>
      </div>
    </div>

    <!-- 主体：热搜看板 + Agent小窗 -->
    <div class="dept-body">

      <!-- 左侧主区 -->
      <div class="dept-main">

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
            <div
              v-for="(item, i) in currentList"
              :key="i"
              class="trending-row"
              :class="{ hot: i < 3 }"
            >
              <span class="rank" :class="{ 'rank-hot': i < 3 }">{{ i + 1 }}</span>
              <div class="trending-info">
                <span class="trending-title">{{ item.title }}</span>
                <span v-if="item.category" class="trending-cate">{{ item.category }}</span>
              </div>
              <span v-if="item.heat || item.hot" class="trending-heat">
                {{ item.heat || item.hot }}
              </span>
              <button class="btn-use" @click="useAsTopic(item.title)">用此选题</button>
            </div>
          </div>
        </div>

        <!-- 已选话题 -->
        <div v-if="trendingStore.selectedTopics.length" class="selected-topics">
          <div class="selected-label">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 7l3 3 6-6"/>
            </svg>
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

      <!-- 右侧：情报专员小窗 -->
      <div class="agent-panel" :class="{ collapsed: agentCollapsed }">
        <div class="agent-panel-header" @click="agentCollapsed = !agentCollapsed">
          <div class="agent-panel-title">
            <span class="agent-emoji">📈</span>
            <span>情报专员</span>
            <span class="agent-status-dot"></span>
          </div>
          <svg class="panel-toggle" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path :d="agentCollapsed ? 'M2 5l4.5 4.5L11 5' : 'M2 8.5l4.5-4.5L11 8.5'"/>
          </svg>
        </div>
        <div v-if="!agentCollapsed" class="agent-panel-body">
          <AgentChat
            agent-id="trend"
            :quick-prompts="quickPrompts"
            @streaming-change="streaming = $event"
            ref="chatRef"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AgentChat from '@/components/agent/AgentChat.vue'
import { useTrendingStore } from '@/stores/agent'
import { useBrandStore } from '@/stores/brand'
import { ElMessage } from 'element-plus'

const trendingStore = useTrendingStore()
const brandStore = useBrandStore()

const streaming = ref(false)
const agentCollapsed = ref(false)
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

const quickPrompts = [
  '分析当前热搜，找出与品牌相关的话题',
  '下个月有哪些营销节点值得关注？',
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
.trending-dept {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 60px);
  min-height: 500px;
}

/* 部门头部 */
.dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 14px 18px;
  flex-shrink: 0;
}
.dept-header-left { display: flex; align-items: center; gap: 12px; }
.dept-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(6,182,212,0.08);
  border: 1px solid rgba(6,182,212,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #06b6d4;
}
.dept-title { font-size: 15px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.dept-sub { font-size: 11px; color: rgba(29,29,31,0.4); margin-top: 2px; }
.dept-header-right { display: flex; align-items: center; gap: 10px; }
.brand-tag {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #0071e3;
  background: rgba(0,113,227,0.07); border: 1px solid rgba(0,113,227,0.15);
  padding: 3px 10px; border-radius: 20px;
}
.brand-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: #0071e3; }
.btn-fetch {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);
  background: #f5f5f7; color: rgba(29,29,31,0.7);
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; font-family: inherit;
}
.btn-fetch:hover { background: #0071e3; color: #fff; border-color: #0071e3; }
.btn-fetch.loading { opacity: 0.6; cursor: not-allowed; }

/* 主体布局 */
.dept-body {
  flex: 1;
  display: flex;
  gap: 14px;
  min-height: 0;
}
.dept-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

/* 平台切换 */
.platform-tabs {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.platform-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08); background: #fff;
  font-size: 12px; font-weight: 500; color: rgba(29,29,31,0.5);
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.platform-tab:hover { border-color: #0071e3; color: #0071e3; }
.platform-tab.active { background: #0071e3; border-color: #0071e3; color: #fff; }
.tab-count {
  font-size: 10px; font-weight: 700;
  background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 10px;
}
.platform-tab:not(.active) .tab-count { background: rgba(0,0,0,0.06); color: rgba(29,29,31,0.4); }

/* 热搜看板 */
.trending-board {
  flex: 1;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  overflow-y: auto;
  min-height: 0;
}
.trending-board::-webkit-scrollbar { width: 4px; }
.trending-board::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 2px; }

.board-loading, .board-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; height: 200px;
  font-size: 13px; color: rgba(29,29,31,0.35);
}
.loading-dots { display: flex; gap: 4px; }
.loading-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #0071e3;
  animation: ldot 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ldot { 0%,100%{opacity:0.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }

.trending-list { padding: 8px 0; }
.trending-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px; transition: background 0.12s;
}
.trending-row:hover { background: #f9f9fb; }
.trending-row.hot { background: rgba(239,68,68,0.02); }

.rank {
  width: 22px; height: 22px; border-radius: 6px;
  background: #f5f5f7;
  font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.35);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rank-hot { background: rgba(239,68,68,0.1); color: #ef4444; }

.trending-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.trending-title {
  font-size: 13px; color: #1d1d1f;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.trending-cate {
  font-size: 10px; color: rgba(29,29,31,0.4);
  background: #f5f5f7; padding: 2px 7px; border-radius: 10px;
  flex-shrink: 0;
}
.trending-heat { font-size: 11px; color: rgba(29,29,31,0.35); white-space: nowrap; flex-shrink: 0; }
.btn-use {
  padding: 4px 10px; border-radius: 8px;
  border: 1px solid rgba(0,113,227,0.2); background: rgba(0,113,227,0.05);
  color: #0071e3; font-size: 11px; font-weight: 500; cursor: pointer;
  flex-shrink: 0; transition: all 0.15s; font-family: inherit; white-space: nowrap;
  opacity: 0;
}
.trending-row:hover .btn-use { opacity: 1; }
.btn-use:hover { background: #0071e3; color: #fff; }

/* 已选话题 */
.selected-topics {
  background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
  padding: 12px 16px; flex-shrink: 0;
}
.selected-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
}
.topic-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.topic-chip {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 16px;
  font-size: 12px; background: rgba(0,113,227,0.06);
  border: 1px solid rgba(0,113,227,0.15); color: #0071e3;
}
.chip-del { cursor: pointer; opacity: 0.5; }
.chip-del:hover { opacity: 1; color: #dc2626; }

/* Agent小窗 */
.agent-panel {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.2s;
}
.agent-panel.collapsed { width: 48px; }
.agent-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; cursor: pointer;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.agent-panel-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12.5px; font-weight: 700; color: #1d1d1f;
  white-space: nowrap; overflow: hidden;
}
.agent-emoji { font-size: 16px; flex-shrink: 0; }
.agent-status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #34d399;
  animation: aipulse 2s ease-in-out infinite; flex-shrink: 0;
}
@keyframes aipulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.panel-toggle { color: rgba(29,29,31,0.3); flex-shrink: 0; }
.agent-panel-body {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}
.agent-panel-body :deep(.agent-chat-wrap) {
  border-radius: 0 !important;
  border: none !important;
  height: 100%;
}

@media (max-width: 900px) {
  .dept-body { flex-direction: column; }
  .agent-panel { width: 100%; }
}
</style>
