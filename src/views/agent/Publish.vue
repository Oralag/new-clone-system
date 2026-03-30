<template>
  <div class="publish-page">

    <DeptBulletin dept-id="publish" />

    <!-- ── 发布专员指挥台 + 今日数据 ── -->
    <div class="mid-grid">
      <section class="command-section" :style="{ '--ac': '#10b981' }">
        <div class="command-header">
          <div class="command-title-group">
            <span class="agent-label">🚀 发布部</span>
            <p class="command-desc">多平台排期 · 发布计划 · 数据复盘</p>
          </div>
          <div class="command-chips">
            <button v-for="p in agentPrompts" :key="p" class="chip-btn" @click="publishChatRef?.sendQuickPrompt(p)">{{ p }}</button>
          </div>
        </div>
        <AgentChat agent-id="publisher" ref="publishChatRef" />
      </section>

      <aside class="stats-aside">
        <div class="stats-aside-title">今日数据</div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2v10M6 5l3-3 3 3"/><path d="M2 13v3h14v-3"/></svg></div>
            <div class="stat-card-value">{{ publishedCount }}</div>
            <div class="stat-card-label">已发布</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon icon-pending"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 6v4l2.5 2.5"/></svg></div>
            <div class="stat-card-value">{{ pendingCount }}</div>
            <div class="stat-card-label">待发布</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="result-count" v-if="filtered.length">共 {{ filtered.length }} 条内容</span>
      </div>
      <div class="toolbar-right">
        <button class="btn-filter" @click="showFilter = !showFilter">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          筛选
          <span v-if="activeFilters" class="filter-badge">{{ activeFilters }}</span>
        </button>
        <button class="btn-batch" :disabled="selected.length === 0" @click="batchPublish">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          批量发布{{ selected.length > 0 ? ` (${selected.length})` : '' }}
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilter" class="filter-panel">
      <div class="filter-group">
        <span class="filter-label">类型</span>
        <span v-for="t in typeOptions" :key="t.key" class="filter-tag"
          :class="{ active: filterType === t.key }" @click="filterType = filterType === t.key ? '' : t.key">
          {{ t.name }}
        </span>
      </div>
      <div class="filter-group">
        <span class="filter-label">平台</span>
        <span v-for="p in platformOptions" :key="p.key" class="filter-tag"
          :class="{ active: filterPlatform === p.key }" @click="filterPlatform = filterPlatform === p.key ? '' : p.key">
          {{ p.name }}
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="agentStore.flowResults.length === 0" class="empty-state">
      <div class="empty-icon">🚀</div>
      <div class="empty-title">暂无待发布内容</div>
      <div class="empty-desc">在品牌配置页点击「交给 Captain」生成内容后，这里会显示待发布的内容卡片</div>
      <button class="btn-goto-brand" @click="router.push('/agent/brand')">前往生成内容</button>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="card-grid">
      <div v-for="(item, idx) in filtered" :key="idx" class="content-card"
        :class="{ selected: selected.includes(idx) }">

        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="card-header-left">
            <span class="type-badge" :class="item.type">{{ typeLabel(item.type) }}</span>
            <span class="card-time">{{ cardTime(idx) }}</span>
          </div>
          <div class="card-menu" @click.stop="toggleMenu(idx)">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="4" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="14" r="1.2" fill="currentColor"/>
            </svg>
            <div v-if="menuOpen === idx" class="dropdown-menu">
              <div class="dropdown-item" @click="editCard(idx)">编辑</div>
              <div class="dropdown-item" @click="copyContent(item)">复制文案</div>
              <div class="dropdown-item danger" @click="removeCard(idx)">删除</div>
            </div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-body" @click="toggleSelect(idx)">
          <!-- 图片 -->
          <div v-if="item.type === 'poster' && item.imageUrl" class="card-image">
            <img :src="item.imageUrl" :alt="item.topic" />
          </div>
          <!-- 视频脚本 / 文案 / 图文文字 -->
          <div class="card-text" :class="{ compact: item.type === 'poster' && item.imageUrl }" v-html="renderMd(item)" />
        </div>

        <!-- 编辑弹层 -->
        <div v-if="editingIdx === idx" class="edit-overlay" @click.self="editingIdx = -1">
          <textarea class="edit-textarea" v-model="editContent" rows="8" />
          <div class="edit-actions">
            <button class="btn-cancel-edit" @click="editingIdx = -1">取消</button>
            <button class="btn-save-edit" @click="saveEdit(idx)">保存</button>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="card-platforms">
            <span class="platform-icon" :title="item.platformName">{{ platformEmoji(item.platform) }}</span>
            <span class="platform-name">{{ item.platformName }}</span>
            <span v-if="item.topic" class="topic-chip">{{ item.topic.slice(0, 10) }}{{ item.topic.length > 10 ? '…' : '' }}</span>
          </div>
          <div class="card-footer-actions">
            <button class="btn-preview" @click="previewCard(idx)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/></svg>
              查看
            </button>
            <button class="btn-publish" @click="publishOne(idx)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              发布
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- 预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewIdx >= 0" class="preview-overlay" @click.self="previewIdx = -1">
        <div class="preview-modal">
          <div class="preview-header">
            <div class="preview-header-left">
              <span class="type-badge" :class="filtered[previewIdx]?.type">{{ typeLabel(filtered[previewIdx]?.type || '') }}</span>
              <span class="preview-platform">{{ platformEmoji(filtered[previewIdx]?.platform || '') }} {{ filtered[previewIdx]?.platformName }}</span>
            </div>
            <button class="preview-close" @click="previewIdx = -1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="preview-body">
            <div v-if="filtered[previewIdx]?.type === 'poster' && filtered[previewIdx]?.imageUrl" class="preview-image">
              <img :src="filtered[previewIdx].imageUrl" :alt="filtered[previewIdx].topic" />
            </div>
            <div class="preview-content" v-html="renderMd(filtered[previewIdx])" />
          </div>
          <div class="preview-footer">
            <button class="btn-cancel-edit" @click="previewIdx = -1">关闭</button>
            <button class="btn-cancel-edit" @click="copyContent(filtered[previewIdx])">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 10V2.5A.5.5 0 012.5 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              复制
            </button>
            <button class="btn-publish" @click="publishOne(previewIdx); previewIdx = -1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              发布
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTrendingStore } from '@/stores/agent'
import { marked } from 'marked'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptBulletin from '@/components/agent/DeptBulletin.vue'

// 发布专员
const publishChatRef = ref<InstanceType<typeof AgentChat>>()
const agentPrompts = [
  '帮我制定本周发布计划',
  '这批内容应该什么时间发效果最好？',
  '各平台发布频率建议',
]

const router = useRouter()
const agentStore = useTrendingStore()

const publishedCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)
const pendingCount = computed(() => agentStore.flowResults.length)

const showFilter = ref(false)
const filterType = ref('')
const filterPlatform = ref('')
const selected = ref<number[]>([])
const menuOpen = ref(-1)
const editingIdx = ref(-1)
const editContent = ref('')
const previewIdx = ref(-1)

const typeOptions = [
  { key: 'copy', name: '文案' },
  { key: 'poster', name: '图文' },
  { key: 'video_script', name: '视频脚本' },
]

const platformOptions = computed(() => {
  const seen = new Set<string>()
  const opts: { key: string; name: string }[] = []
  for (const r of agentStore.flowResults) {
    if (!seen.has(r.platform)) {
      seen.add(r.platform)
      opts.push({ key: r.platform, name: r.platformName })
    }
  }
  return opts
})

const activeFilters = computed(() => {
  let n = 0
  if (filterType.value) n++
  if (filterPlatform.value) n++
  return n || 0
})

const filtered = computed(() => {
  return agentStore.flowResults.filter(item => {
    if (filterType.value && item.type !== filterType.value) return false
    if (filterPlatform.value && item.platform !== filterPlatform.value) return false
    return true
  })
})

function typeLabel(type: string) {
  return { copy: '文案', poster: '图文', video_script: '视频' }[type] ?? type
}

const BASE_TIME = Date.now() - 30 * 60 * 1000
function cardTime(idx: number) {
  const d = new Date(BASE_TIME + idx * 5 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function platformEmoji(platform: string): string {
  const map: Record<string, string> = {
    douyin: '🎵', xiaohongshu: '📕', kuaishou: '⚡', weibo: '🌐', bilibili: '📺', zhihu: '💡',
  }
  return map[platform] ?? '📱'
}

function displayContent(item: any) {
  if (item.type === 'poster') {
    try {
      const obj = JSON.parse(item.content)
      return obj.title ? `${obj.title}\n\n${obj.body ?? ''}` : item.content
    } catch { return item.content }
  }
  return item.content
}

function renderMd(item: any) {
  return marked.parse(displayContent(item) || '') as string
}

function toggleSelect(idx: number) {
  const i = selected.value.indexOf(idx)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(idx)
}

function toggleMenu(idx: number) {
  menuOpen.value = menuOpen.value === idx ? -1 : idx
  document.addEventListener('click', () => { menuOpen.value = -1 }, { once: true })
}

function editCard(idx: number) {
  menuOpen.value = -1
  const item = filtered.value[idx]
  editContent.value = displayContent(item)
  editingIdx.value = idx
}

function saveEdit(idx: number) {
  const realIdx = agentStore.flowResults.indexOf(filtered.value[idx])
  if (realIdx >= 0) {
    const updated = [...agentStore.flowResults]
    updated[realIdx] = { ...updated[realIdx], content: editContent.value }
    agentStore.setFlowResults(updated)
  }
  editingIdx.value = -1
  ElMessage.success('已保存')
}

async function copyContent(item: any) {
  menuOpen.value = -1
  await navigator.clipboard.writeText(displayContent(item))
  ElMessage.success('已复制到剪贴板')
}

async function removeCard(idx: number) {
  menuOpen.value = -1
  await ElMessageBox.confirm('确定删除这条内容？', '提示', { type: 'warning' })
  const realIdx = agentStore.flowResults.indexOf(filtered.value[idx])
  if (realIdx >= 0) {
    const updated = [...agentStore.flowResults]
    updated.splice(realIdx, 1)
    agentStore.setFlowResults(updated)
    selected.value = selected.value.filter(s => s !== idx).map(s => s > idx ? s - 1 : s)
  }
}

function publishOne(idx: number) {
  ElMessage.success(`「${filtered.value[idx].platformName}」发布成功（模拟）`)
}

function previewCard(idx: number) {
  previewIdx.value = idx
}

function batchPublish() {
  if (selected.value.length === 0) return
  ElMessage.success(`已批量发布 ${selected.value.length} 条内容（模拟）`)
  selected.value = []
}
</script>

<style scoped>
.publish-page {
  padding: 0 0 40px;
  min-height: 100%;
  max-width: 1200px;
}

/* mid-grid 同 Dashboard Captain */
.mid-grid { display: grid; grid-template-columns: 1fr 240px; gap: 14px; margin-bottom: 16px; }
.command-section {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #10b981); border-radius: 14px;
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
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(16,185,129,0.08); display: flex; align-items: center; justify-content: center; color: #10b981; flex-shrink: 0; }
.icon-pending { background: rgba(245,158,11,0.08) !important; color: #f59e0b !important; }
.stat-card-value { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); }

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.toolbar-right { display: flex; gap: 10px; align-items: center; }
.result-count { font-size: 13px; color: #94a3b8; }

.btn-filter {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px;
  background: #1e293b; color: #e2e8f0;
  border: 1px solid #334155; font-size: 14px; cursor: pointer;
  position: relative; transition: background .15s;
}
.btn-filter:hover { background: #273449; }
.filter-badge {
  background: #6366f1; color: #fff; font-size: 11px;
  border-radius: 999px; padding: 1px 6px; margin-left: 2px;
}

.btn-batch {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px; border-radius: 10px;
  background: #4f46e5; color: #fff;
  border: none; font-size: 14px; cursor: pointer; transition: background .15s;
}
.btn-batch:hover:not(:disabled) { background: #4338ca; }
.btn-batch:disabled { opacity: .5; cursor: not-allowed; }

/* ── 筛选面板 ── */
.filter-panel {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 12px; padding: 16px 20px;
  margin-bottom: 20px; display: flex; gap: 24px; flex-wrap: wrap;
}
.filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-label { font-size: 12px; color: #64748b; white-space: nowrap; }
.filter-tag {
  padding: 4px 12px; border-radius: 999px; font-size: 13px;
  background: #0f172a; color: #94a3b8; border: 1px solid #334155;
  cursor: pointer; transition: all .15s;
}
.filter-tag.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

/* ── 空状态 ── */
.empty-state {
  text-align: center; padding: 80px 20px;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: #64748b; margin-bottom: 24px; max-width: 360px; margin-left: auto; margin-right: auto; }
.btn-goto-brand {
  padding: 10px 24px; background: #4f46e5; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; cursor: pointer;
}
.btn-goto-brand:hover { background: #4338ca; }

/* ── 卡片网格 ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.content-card {
  background: #1a2234;
  border-radius: 18px;
  overflow: hidden;
  border: 1.5px solid transparent;
  transition: border-color .15s, box-shadow .15s;
  position: relative;
  cursor: default;
}
.content-card:hover { border-color: #334155; }
.content-card.selected { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,.15); }

/* 卡片头部 */
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 10px;
}
.card-header-left { display: flex; align-items: center; gap: 10px; }

.type-badge {
  font-size: 12px; font-weight: 600; padding: 3px 10px;
  border-radius: 6px; letter-spacing: .3px;
}
.type-badge.copy { background: rgba(99,102,241,.2); color: #818cf8; }
.type-badge.poster { background: rgba(16,185,129,.2); color: #34d399; }
.type-badge.video_script { background: rgba(239,68,68,.2); color: #f87171; }

.card-time { font-size: 12px; color: #64748b; }

.card-menu {
  position: relative; color: #64748b; cursor: pointer; padding: 4px;
  border-radius: 6px; transition: background .15s;
}
.card-menu:hover { background: #273449; color: #94a3b8; }

.dropdown-menu {
  position: absolute; right: 0; top: 28px; z-index: 10;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 10px; padding: 4px; min-width: 110px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
}
.dropdown-item {
  padding: 8px 14px; font-size: 13px; color: #cbd5e1;
  border-radius: 7px; cursor: pointer; transition: background .1s;
}
.dropdown-item:hover { background: #273449; }
.dropdown-item.danger { color: #f87171; }
.dropdown-item.danger:hover { background: rgba(239,68,68,.1); }

/* 卡片内容 */
.card-body {
  padding: 0 16px; cursor: pointer;
}
.card-image {
  border-radius: 10px; overflow: hidden; margin-bottom: 10px;
  background: #0f172a; aspect-ratio: 4/3;
}
.card-image img { width: 100%; height: 100%; object-fit: cover; display: block; }

.card-text {
  font-size: 14px; color: #cbd5e1; line-height: 1.7;
  word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical;
  overflow: hidden; padding-bottom: 14px;
}
.card-text :deep(p) { margin: 0 0 6px; }
.card-text :deep(strong) { color: #f1f5f9; }
.card-text :deep(blockquote) { margin: 0; padding-left: 10px; border-left: 2px solid #475569; color: #94a3b8; }
.card-text.compact { -webkit-line-clamp: 3; }

/* 编辑弹层 */
.edit-overlay {
  position: absolute; inset: 0; background: rgba(10,15,28,.95);
  border-radius: 18px; padding: 16px; z-index: 20;
  display: flex; flex-direction: column; gap: 10px;
}
.edit-textarea {
  flex: 1; background: #0f172a; color: #e2e8f0; border: 1px solid #334155;
  border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.7;
  resize: none; outline: none;
}
.edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel-edit {
  padding: 7px 16px; border-radius: 8px; background: #1e293b;
  color: #94a3b8; border: 1px solid #334155; font-size: 13px; cursor: pointer;
}
.btn-save-edit {
  padding: 7px 16px; border-radius: 8px; background: #4f46e5;
  color: #fff; border: none; font-size: 13px; cursor: pointer;
}

/* 卡片底部 */
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px 14px; border-top: 1px solid #1e293b; margin-top: 4px;
}
.card-platforms { display: flex; align-items: center; gap: 6px; }
.platform-icon { font-size: 16px; }
.platform-name { font-size: 12px; color: #64748b; }
.topic-chip {
  font-size: 11px; color: #475569; background: #0f172a;
  border-radius: 999px; padding: 2px 8px; border: 1px solid #1e293b;
}

.btn-publish {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 16px; border-radius: 8px;
  background: #fff; color: #0f172a;
  border: none; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background .15s;
}
.btn-publish:hover { background: #f1f5f9; }

.card-footer-actions { display: flex; gap: 6px; align-items: center; }

.btn-preview {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px;
  background: transparent; color: #94a3b8;
  border: 1px solid #334155; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all .15s;
}
.btn-preview:hover { background: #1e293b; color: #e2e8f0; border-color: #475569; }

/* 预览弹窗 */
.preview-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.preview-modal {
  background: #1a2234; border: 1px solid #334155;
  border-radius: 18px; width: 100%; max-width: 600px;
  max-height: 80vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 48px rgba(0,0,0,0.5);
}
.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #1e293b;
}
.preview-header-left { display: flex; align-items: center; gap: 10px; }
.preview-platform { font-size: 13px; color: #94a3b8; }
.preview-close {
  background: none; border: none; padding: 6px; cursor: pointer;
  color: #64748b; border-radius: 6px; display: flex; align-items: center;
  transition: background .15s;
}
.preview-close:hover { background: #273449; color: #e2e8f0; }
.preview-body {
  flex: 1; overflow-y: auto; padding: 20px;
}
.preview-image {
  border-radius: 10px; overflow: hidden; margin-bottom: 16px;
  background: #0f172a;
}
.preview-image img { width: 100%; display: block; }
.preview-content {
  font-size: 15px; color: #e2e8f0; line-height: 1.8;
  word-break: break-word;
}
.preview-content :deep(p) { margin: 0 0 10px; }
.preview-content :deep(strong) { color: #f8fafc; }
.preview-content :deep(blockquote) { margin: 0 0 10px; padding-left: 12px; border-left: 3px solid #475569; color: #94a3b8; }
.preview-content :deep(code) { background: #1e293b; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
.preview-content :deep(ul), .preview-content :deep(ol) { padding-left: 20px; margin: 0 0 10px; }
.preview-content :deep(h1), .preview-content :deep(h2), .preview-content :deep(h3) { color: #f1f5f9; margin: 0 0 8px; }
.preview-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px; border-top: 1px solid #1e293b;
}
</style>
