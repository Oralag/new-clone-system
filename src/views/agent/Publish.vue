<template>
  <div class="publish-page">
    <div class="page-title">发布管理</div>

    <!-- Filters -->
    <div class="filter-row">
      <div class="tabs-row">
        <button
          v-for="p in ['全部', ...platformOptions]"
          :key="p"
          class="tab"
          :class="{ active: filterPlatform === p }"
          @click="filterPlatform = p"
        >{{ p }}</button>
      </div>
      <div class="tabs-row">
        <button
          v-for="s in ['全部', '草稿', '待发布', '已发布']"
          :key="s"
          class="tab"
          :class="{ active: filterStatus === s }"
          @click="filterStatus = s"
        >{{ s }}</button>
      </div>
    </div>

    <!-- List -->
    <div class="card">
      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">📤</div>
        <div class="empty-text">暂无发布内容</div>
        <div class="empty-sub">在文案生成或视频脚本页面创建内容后，将在此管理发布</div>
      </div>
      <div v-else class="publish-list">
        <div v-for="(item, idx) in filtered" :key="idx" class="history-row">
          <div class="row-left">
            <span class="platform-tag">{{ item.platformName }}</span>
            <div class="row-info">
              <div class="row-topic">{{ item.topic }}</div>
              <div class="row-type">{{ typeLabel(item.type) }}</div>
            </div>
          </div>
          <div class="row-right">
            <span class="status-badge" :class="statusClass(item.status || '草稿')">
              {{ item.status || '草稿' }}
            </span>
            <button class="btn-sm action-btn" @click="markPublish(idx)">
              {{ item.status === '已发布' ? '已发布' : '标记发布' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()

const filterPlatform = ref('全部')
const filterStatus = ref('全部')

const platformOptions = ['抖音', '小红书', '快手', '微博']

interface PublishItem {
  platform: string
  platformName: string
  topic: string
  type: string
  content: string
  status?: string
}

const localItems = ref<PublishItem[]>(
  agentStore.flowResults.map(r => ({ ...r, status: '草稿' }))
)

const filtered = computed(() => {
  return localItems.value.filter(item => {
    const matchPlatform = filterPlatform.value === '全部' || item.platformName === filterPlatform.value
    const matchStatus = filterStatus.value === '全部' || (item.status || '草稿') === filterStatus.value
    return matchPlatform && matchStatus
  })
})

function typeLabel(type: string) {
  const map: Record<string, string> = { video_script: '视频脚本', poster: '图文海报', copy: '文案' }
  return map[type] || type
}

function statusClass(status: string) {
  const map: Record<string, string> = { '草稿': 'status-draft', '待发布': 'status-pending', '已发布': 'status-done' }
  return map[status] || 'status-draft'
}

function markPublish(idx: number) {
  const item = filtered.value[idx]
  const realIdx = localItems.value.indexOf(item)
  if (realIdx >= 0) {
    const cur = localItems.value[realIdx].status || '草稿'
    if (cur === '草稿') localItems.value[realIdx].status = '待发布'
    else if (cur === '待发布') localItems.value[realIdx].status = '已发布'
  }
}
</script>

<style scoped>
.publish-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.filter-row { display: flex; flex-direction: column; gap: 8px; }
.tabs-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tab { padding: 6px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: #fdfefe; cursor: pointer; font-size: 12.5px; color: #64748b; transition: all 0.15s; }
.tab:hover { border-color: #93c5fd; color: #2563eb; }
.tab.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.empty-state { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: #64748b; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 12px; color: #94a3b8; }
.publish-list { display: flex; flex-direction: column; gap: 10px; }
.history-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; }
.row-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.platform-tag { padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border-radius: 5px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.row-info { min-width: 0; }
.row-topic { font-size: 13.5px; color: #1e293b; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-type { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-draft { background: #f1f5f9; color: #64748b; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-done { background: #dcfce7; color: #16a34a; }
.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-sm:hover { border-color: #93c5fd; color: #2563eb; }
.action-btn { white-space: nowrap; }
</style>
