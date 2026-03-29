<template>
  <div class="archive-page">
    <div class="panel">
      <div class="panel-head">
        <span class="panel-icon">📚</span>
        <span class="panel-title">ARCHIVE — 亚当的日记</span>
        <span class="panel-badge">{{ reflections.length }} 篇</span>
      </div>

      <div v-if="reflections.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p class="empty-text">档案馆空空如也。</p>
        <p class="empty-sub">亚当还没有写过日记。当他使用 write_reflection 工具时，日记会出现在这里。</p>
      </div>

      <div v-else class="reflection-list">
        <div v-for="r in sortedReflections" :key="r.id" class="reflection-card">
          <div class="reflection-meta">
            <span class="reflection-id mono">{{ r.id }}</span>
            <span class="reflection-time mono">{{ formatDate(r.at) }}</span>
          </div>
          <div class="reflection-content">{{ r.content }}</div>
          <div v-if="r.linkedEventIds.length" class="reflection-links">
            <span class="link-label">LINKED_EVENTS</span>
            <span v-for="eid in r.linkedEventIds" :key="eid" class="link-tag mono">{{ eid.slice(0, 12) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdamStore } from '@/stores/adam'

const adamStore = useAdamStore()

const reflections = computed(() => adamStore.reflections)
const sortedReflections = computed(() =>
  [...reflections.value].sort((a, b) => b.at.localeCompare(a.at)),
)

function formatDate(iso: string) {
  if (!iso) return '--'
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}
</script>

<style scoped>
.archive-page { max-width: 720px; }

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--faint);
}
.panel-icon { font-size: 14px; }
.panel-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--mid);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.panel-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 600;
  color: var(--dim);
  background: var(--gray);
  padding: 2px 8px;
  border-radius: 99px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}
.empty-icon { font-size: 32px; opacity: 0.4; }
.empty-text {
  font-size: 13px;
  color: var(--mid);
  margin: 12px 0 4px;
}
.empty-sub {
  font-size: 11px;
  color: var(--dim);
  max-width: 300px;
  margin: 0 auto;
  line-height: 1.6;
}

/* List */
.reflection-list { padding: 12px 16px; }
.reflection-card {
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.reflection-card:last-child { border-bottom: none; }

.reflection-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.reflection-id {
  font-size: 9px;
  color: var(--dim);
  opacity: 0.6;
}
.reflection-time {
  font-size: 10px;
  color: var(--dim);
}
.reflection-content {
  font-size: 13px;
  color: var(--dark);
  line-height: 1.7;
  white-space: pre-wrap;
}

.reflection-links {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.link-label {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.link-tag {
  font-size: 9px;
  color: var(--mid);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid var(--border);
}

.mono { font-family: 'SF Mono', 'Fira Code', monospace; }
</style>
