<template>
  <div class="history-page">
    <div class="page-title">历史记录</div>

    <div v-if="items.length === 0" class="card empty-state">
      <div class="empty-icon">📚</div>
      <div class="empty-text">暂无历史记录</div>
      <div class="empty-sub">生成内容后将自动保存到历史记录</div>
    </div>

    <div v-else>
      <div class="list-header">
        <span class="list-count">共 {{ items.length }} 条记录</span>
        <button class="btn-sm danger-btn" @click="clearAll">清空全部</button>
      </div>
      <div class="history-list">
        <div v-for="(item, idx) in items" :key="idx" class="history-row card">
          <div class="row-meta">
            <span class="platform-tag">{{ item.platform }}</span>
            <span class="type-tag">{{ item.type }}</span>
            <span class="date-tag">{{ item.date }}</span>
          </div>
          <div class="row-topic">{{ item.topic }}</div>
          <div class="row-preview">{{ item.preview }}</div>
          <div class="row-actions">
            <button class="btn-sm copy-btn" @click="copyItem(item)">📋 复制</button>
            <button class="btn-sm delete-btn" @click="deleteItem(idx)">🗑️ 删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface HistoryItem {
  platform: string
  type: string
  topic: string
  date: string
  preview: string
  content: string
}

const STORAGE_KEY = 'agent_history'

function loadItems(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const items = ref<HistoryItem[]>(loadItems())

function deleteItem(idx: number) {
  items.value.splice(idx, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

function clearAll() {
  items.value = []
  localStorage.removeItem(STORAGE_KEY)
}

async function copyItem(item: HistoryItem) {
  await navigator.clipboard.writeText(item.content || item.preview)
}
</script>

<style scoped>
.history-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.empty-state { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: #64748b; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 12px; color: #94a3b8; }
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.list-count { font-size: 13px; color: #64748b; }
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-row { padding: 16px; }
.row-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.platform-tag { padding: 2px 9px; background: #dbeafe; color: #1d4ed8; border-radius: 4px; font-size: 11px; font-weight: 600; }
.type-tag { padding: 2px 9px; background: #f0fdf4; color: #16a34a; border-radius: 4px; font-size: 11px; font-weight: 600; }
.date-tag { font-size: 11px; color: #94a3b8; margin-left: auto; }
.row-topic { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
.row-preview { font-size: 13px; color: #64748b; line-height: 1.6; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 12px; }
.row-actions { display: flex; gap: 8px; }
.btn-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-sm:hover { border-color: #93c5fd; color: #2563eb; }
.copy-btn:hover { border-color: #93c5fd; color: #2563eb; }
.delete-btn:hover { border-color: #fca5a5; color: #ef4444; background: #fef2f2; }
.danger-btn { border-color: #fca5a5; color: #ef4444; }
.danger-btn:hover { background: #fef2f2; }
</style>
