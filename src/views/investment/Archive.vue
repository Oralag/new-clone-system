<template>
  <div class="archive-page">

    <!-- ── 知识库 ── -->
    <div class="panel" style="margin-bottom: 16px;">
      <div class="panel-head">
        <span class="panel-icon">🧠</span>
        <span class="panel-title">{{ t('investmentArchive.knowledgeBase') }} — {{ t('investmentArchive.sharedKnowledge') }}</span>
        <span class="panel-badge">{{ knowledgeEntries.length }} {{ t('investmentArchive.entries') }}</span>
      </div>

      <div v-if="kbLoading" class="empty-state">
        <p class="empty-text">{{ t('investmentArchive.loading') }}</p>
      </div>
      <div v-else-if="knowledgeEntries.length === 0" class="empty-state">
        <span class="empty-icon">📖</span>
        <p class="empty-text">{{ t('investmentArchive.emptyKnowledge') }}</p>
        <p class="empty-sub">{{ t('investmentArchive.emptyKnowledgeSub') }}</p>
      </div>
      <div v-else class="kb-grid">
        <div
          v-for="entry in knowledgeEntries"
          :key="entry.id"
          class="kb-card"
          :class="{ expanded: expandedKb === entry.id }"
          @click="toggleKb(entry.id)"
        >
          <div class="kb-card-top">
            <span class="kb-category mono">{{ entry.category }}</span>
            <span class="kb-time mono">{{ formatDate(entry.created_at) }}</span>
          </div>
          <div class="kb-card-title">{{ entry.title }}</div>
          <div class="kb-card-summary">{{ entry.summary }}</div>
          <div class="kb-tags">
            <span v-for="tag in entry.tags" :key="tag" class="kb-tag">{{ tag }}</span>
          </div>
          <div class="kb-card-footer">
            <span class="kb-source mono">{{ t('investmentArchive.by') }} {{ entry.source }}</span>
            <span class="kb-expand-hint mono">{{ expandedKb === entry.id ? t('investmentArchive.collapse') + ' ↑' : t('investmentArchive.expand') + ' ↓' }}</span>
          </div>
          <div v-if="expandedKb === entry.id" class="kb-content">{{ entry.fullContent || entry.summary }}</div>
        </div>
      </div>
    </div>

    <!-- ── 日记 ── -->
    <div class="panel">
      <div class="panel-head">
        <span class="panel-icon">📚</span>
        <span class="panel-title">{{ t('investmentArchive.archiveDiary') }}</span>
        <span class="panel-badge">{{ reflections.length }} {{ t('investmentArchive.pages') }}</span>
      </div>

      <div v-if="reflections.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p class="empty-text">{{ t('investmentArchive.emptyDiary') }}</p>
        <p class="empty-sub">{{ t('investmentArchive.emptyDiarySub') }}</p>
      </div>

      <div v-else class="reflection-list">
        <div v-for="r in sortedReflections" :key="r.id" class="reflection-card">
          <div class="reflection-meta">
            <span class="reflection-id mono">{{ r.id }}</span>
            <span class="reflection-time mono">{{ formatDate(r.at) }}</span>
          </div>
          <div class="reflection-content">{{ r.content }}</div>
          <div v-if="r.linkedEventIds.length" class="reflection-links">
            <span class="link-label">{{ t('investmentArchive.linkedEvents') }}</span>
            <span v-for="eid in r.linkedEventIds" :key="eid" class="link-tag mono">{{ eid.slice(0, 12) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'

const { t } = useI18n()
const adamStore = useAdamStore()
const reflections = computed(() => adamStore.reflections)
const sortedReflections = computed(() =>
  [...reflections.value].sort((a, b) => b.at.localeCompare(a.at)),
)

// ── 知识库 ──
interface KbEntry {
  id: string
  title: string
  summary: string
  category: string
  tags: string[]
  source: string
  created_at: string
  fullContent?: string
}

const knowledgeEntries = ref<KbEntry[]>([])
const kbLoading = ref(false)
const expandedKb = ref<string | null>(null)

async function loadKnowledge() {
  kbLoading.value = true
  try {
    const res = await fetch('https://nomaderp.pages.dev/api/knowledge')
    const data = await res.json() as any
    knowledgeEntries.value = data.entries || []
  } catch {}
  kbLoading.value = false
}

async function toggleKb(id: string) {
  if (expandedKb.value === id) {
    expandedKb.value = null
    return
  }
  expandedKb.value = id
  // 懒加载完整内容
  const entry = knowledgeEntries.value.find(e => e.id === id)
  if (entry && !entry.fullContent) {
    try {
      const res = await fetch(`https://nomaderp.pages.dev/api/knowledge?id=${id}`)
      const full = await res.json() as any
      entry.fullContent = full?.content || entry.summary
    } catch {}
  }
}

onMounted(loadKnowledge)

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
.archive-page { max-width: 1100px; }

.panel {
  background: var(--card-bg);
  border: none;
  border-radius: 24px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 18px 10px;
  border-bottom: none;
  background: transparent;
}
.panel-icon { font-size: 14px; }
.panel-title {
  font-size: 12px;
  font-weight: 800;
  color: var(--dark);
}
.panel-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 800;
  color: #e2542e;
  background: rgba(226, 84, 46, 0.1);
  padding: 3px 10px;
  border-radius: 999px;
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

/* 知识库 */
.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 16px;
}
.kb-card {
  background: var(--faint);
  border: none;
  border-radius: 18px;
  padding: 15px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kb-card:hover { background: rgba(242, 223, 78, 0.35); }
.kb-card.expanded { background: rgba(242, 223, 78, 0.45); box-shadow: inset 0 0 0 1.5px var(--dark); }
.kb-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kb-category {
  font-size: 9px;
  font-weight: 800;
  color: var(--dark);
  background: #f2df4e;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: none;
}
.kb-time {
  font-size: 9px;
  color: var(--dim);
}
.kb-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
  line-height: 1.4;
}
.kb-card-summary {
  font-size: 11px;
  color: var(--mid);
  line-height: 1.6;
  flex: 1;
}
.kb-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.kb-tag {
  font-size: 9px;
  color: var(--mid);
  background: var(--card-bg);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 99px;
}
.kb-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}
.kb-source {
  font-size: 9px;
  color: var(--dim);
}
.kb-expand-hint {
  font-size: 9px;
  color: var(--accent);
}
.kb-content {
  font-size: 12px;
  color: var(--mid);
  line-height: 1.7;
  white-space: pre-wrap;
  padding: 10px 12px;
  background: var(--card-bg);
  border-radius: 6px;
  border: 1px solid var(--border);
  margin-top: 4px;
}

/* 日记 */
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
  font-size: 9px;
  font-weight: 800;
  color: var(--dim);
}
.link-tag {
  font-size: 9px;
  color: var(--mid);
  background: var(--faint);
  padding: 2px 8px;
  border-radius: 999px;
  border: none;
}

.mono { font-family: inherit; }
</style>
