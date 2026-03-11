<template>
  <div class="history-page">
    <div class="page-header">
      <div class="page-title">历史记录</div>
      <div v-if="agentStore.history.length > 0" class="header-stats">
        <span class="stat-badge">总内容数：{{ agentStore.history.length }}</span>
        <el-button size="small" type="danger" plain @click="handleClear">清空历史</el-button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="agentStore.history.length === 0" class="card empty-state">
      <div class="empty-icon">📚</div>
      <div class="empty-text">暂无历史记录</div>
      <div class="empty-sub">生成内容后将自动保存到历史记录</div>
    </div>

    <template v-else>
      <!-- Category tabs -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="cat-tab"
          :class="{ active: activeCat === cat.key }"
          @click="activeCat = cat.key"
        >
          {{ cat.label }}
          <span class="cat-count">{{ getCategoryCount(cat.key) }}</span>
        </button>
      </div>

      <!-- List -->
      <div v-if="filteredHistory.length === 0" class="card empty-state">
        <div class="empty-icon">🗂️</div>
        <div class="empty-text">该分类暂无记录</div>
      </div>

      <div v-else class="history-list">
        <div
          v-for="item in filteredHistory"
          :key="item.id"
          class="history-row card"
        >
          <div class="row-meta">
            <span class="platform-tag">{{ item.platformName || item.platform }}</span>
            <span class="type-tag" :class="'type-' + item.type">{{ typeLabel(item.type) }}</span>
            <span class="date-tag">{{ item.date }}</span>
          </div>
          <div class="row-topic">{{ item.topic }}</div>
          <div class="row-preview">{{ item.preview }}</div>
          <div class="row-actions">
            <el-button size="small" @click="reuseItem(item)">复用方案</el-button>
            <el-button size="small" @click="copyItem(item)">复制内容</el-button>
            <el-button size="small" type="danger" plain @click="deleteItem(item.id)">删除</el-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTrendingStore, type HistoryItem } from '@/stores/agent'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const agentStore = useTrendingStore()

const activeCat = ref<'all' | 'copy' | 'image_text' | 'video_script' | 'topic'>('all')

const categories = [
  { key: 'all', label: '全部' },
  { key: 'copy', label: '文案' },
  { key: 'image_text', label: '图文' },
  { key: 'video_script', label: '视频脚本' },
  { key: 'topic', label: '选题' },
]

function typeLabel(type: string) {
  const map: Record<string, string> = {
    copy: '文案',
    image_text: '图文',
    video_script: '视频脚本',
    topic: '选题',
  }
  return map[type] || type
}

function getCategoryCount(key: string) {
  if (key === 'all') return agentStore.history.length
  return agentStore.history.filter(h => h.type === key).length
}

const filteredHistory = computed<HistoryItem[]>(() => {
  if (activeCat.value === 'all') return agentStore.history
  return agentStore.history.filter(h => h.type === activeCat.value)
})

function deleteItem(id: string) {
  agentStore.removeHistoryItem(id)
}

async function handleClear() {
  try {
    await ElMessageBox.confirm('确定清空全部历史记录吗？此操作不可恢复。', '清空历史', {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
    agentStore.clearHistory()
    ElMessage.success('历史记录已清空')
  } catch {
    // user cancelled
  }
}

async function copyItem(item: HistoryItem) {
  await navigator.clipboard.writeText(item.content || item.preview)
  ElMessage.success('内容已复制')
}

function reuseItem(item: HistoryItem) {
  const routeMap: Record<string, string> = {
    copy: '/agent/copywriting',
    image_text: '/agent/copywriting',
    video_script: '/agent/video',
    topic: '/agent/trending',
  }
  const target = routeMap[item.type] || '/agent/copywriting'
  agentStore.setSelectedTopics([item.topic])
  router.push(target)
}
</script>

<style scoped>
.history-page { display: flex; flex-direction: column; gap: 16px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.header-stats { display: flex; align-items: center; gap: 12px; }
.stat-badge {
  padding: 4px 12px;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.empty-state { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: #64748b; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 12px; color: #94a3b8; }

.category-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cat-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fdfefe;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  transition: all 0.15s;
}
.cat-tab:hover { border-color: #93c5fd; color: #2563eb; }
.cat-tab.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
.cat-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgba(0,0,0,0.08);
  border-radius: 9px;
  font-size: 11px;
}
.cat-tab.active .cat-count { background: rgba(255,255,255,0.3); }

.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-row { padding: 16px; }

.row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.platform-tag {
  padding: 2px 9px;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.type-tag {
  padding: 2px 9px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.type-copy { background: #f0fdf4; color: #16a34a; }
.type-image_text { background: #fdf4ff; color: #9333ea; }
.type-video_script { background: #fff7ed; color: #ea580c; }
.type-topic { background: #fefce8; color: #ca8a04; }

.date-tag { font-size: 11px; color: #94a3b8; margin-left: auto; }
.row-topic { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.row-preview {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 12px;
}
.row-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
