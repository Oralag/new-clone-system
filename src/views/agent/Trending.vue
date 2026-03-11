<template>
  <div class="trending-page">
    <div class="page-title">热搜抓取</div>

    <!-- Platform Tabs -->
    <div class="tabs-row">
      <button
        v-for="p in platforms"
        :key="p.key"
        class="tab"
        :class="{ active: currentPlatform === p.key }"
        @click="switchPlatform(p.key)"
      >{{ p.label }}</button>
      <button class="btn-sm fetch-btn" :disabled="agentStore.loading" @click="doFetch">
        <span v-if="agentStore.loading">抓取中...</span>
        <span v-else>🔄 抓取热搜</span>
      </button>
    </div>

    <!-- List -->
    <div class="card trending-card">
      <div v-if="agentStore.loading" class="loading-state">
        <el-skeleton :rows="8" animated />
      </div>
      <div v-else-if="currentList.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">点击"抓取热搜"获取最新数据</div>
      </div>
      <div v-else class="trending-list">
        <div
          v-for="(item, idx) in currentList"
          :key="idx"
          class="trending-row"
          :class="{ selected: selectedSet.has(item.title) }"
        >
          <label class="row-check">
            <input
              type="checkbox"
              :checked="selectedSet.has(item.title)"
              @change="toggleSelect(item.title)"
            />
          </label>
          <span class="rank" :class="rankClass(idx)">{{ idx + 1 }}</span>
          <span class="trend-title">{{ item.title }}</span>
          <span v-if="item.hot" class="heat-val">🔥 {{ formatHot(item.hot) }}</span>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div v-if="localSelected.length > 0" class="action-bar">
      <span class="selected-count">已选 {{ localSelected.length }} 个话题</span>
      <button class="btn-generate" @click="goGenerate">用选中话题生成文案 →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTrendingStore } from '@/stores/agent'

const router = useRouter()
const agentStore = useTrendingStore()

const platforms = [
  { key: 'douyin', label: '抖音' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'kuaishou', label: '快手' },
]

const currentPlatform = ref('douyin')
const localSelected = ref<string[]>([])

const currentList = computed(() => agentStore.trending[currentPlatform.value] || [])
const selectedSet = computed(() => new Set(localSelected.value))

function switchPlatform(key: string) {
  currentPlatform.value = key
}

async function doFetch() {
  await agentStore.fetchTrending(currentPlatform.value)
}

function toggleSelect(title: string) {
  const idx = localSelected.value.indexOf(title)
  if (idx >= 0) localSelected.value.splice(idx, 1)
  else localSelected.value.push(title)
}

function goGenerate() {
  agentStore.setSelectedTopics(localSelected.value)
  router.push('/agent/copywriting')
}

function rankClass(idx: number) {
  if (idx === 0) return 'rank-1'
  if (idx === 1) return 'rank-2'
  if (idx === 2) return 'rank-3'
  return ''
}

function formatHot(hot: string | number) {
  const n = Number(hot)
  if (isNaN(n)) return hot
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  return n.toString()
}
</script>

<style scoped>
.trending-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }

.tabs-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tab {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fdfefe;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  transition: all 0.15s;
}
.tab:hover { border-color: #93c5fd; color: #2563eb; }
.tab.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }

.btn-sm {
  padding: 7px 16px;
  border-radius: 20px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  margin-left: auto;
}
.btn-sm:hover { background: #dbeafe; }
.btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.fetch-btn { white-space: nowrap; }

.card {
  background: #fdfefe;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}
.trending-card { min-height: 200px; }

.loading-state { padding: 8px; }
.empty-state { text-align: center; padding: 40px 0; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
.empty-text { font-size: 14px; color: #94a3b8; }

.trending-list { display: flex; flex-direction: column; }
.trending-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 7px;
  transition: background 0.15s;
  cursor: pointer;
}
.trending-row:hover { background: #f8fafc; }
.trending-row.selected { background: #eff6ff; }

.row-check input { cursor: pointer; width: 15px; height: 15px; }
.rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rank-1 { background: #fef3c7; color: #d97706; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #fef9ee; color: #b45309; }

.trend-title { flex: 1; font-size: 13.5px; color: #1e293b; }
.heat-val { font-size: 12px; color: #ef4444; flex-shrink: 0; }

.action-bar {
  position: sticky;
  bottom: 0;
  background: #fdfefe;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
}
.selected-count { font-size: 13px; color: #64748b; }
.btn-generate {
  padding: 9px 22px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
}
.btn-generate:hover { background: #1d4ed8; }
</style>
